import { tick } from "svelte";
import { COSMETIC_BAITS, DATA, REAL_WORLD_CHECKS, SCRIPT_BAITS } from "./data";
import { checkHost, checkRealResource, networkControls, runPool, sleep } from "./check";

export type CheckResult = boolean | null;
export type CategoryScore = { blocked: number; total: number };

type Category = "cosmetic" | "scripts" | "realworld" | "hosts";
type HostResults = Record<string, Record<string, Record<string, CheckResult>>>;

type TestState = {
    finished: boolean;
    unreliable: boolean;
    dynamicBaitMounted: boolean;
    blocked: number;
    notblocked: number;
    total: number;
    categories: Record<Category, CategoryScore>;
    cosmetic: Record<string, CheckResult>;
    script: Record<string, CheckResult>;
    realworld: Record<string, CheckResult>;
    hosts: HostResults;
};

const COSMETIC_SETTLE_MS = 1200;
const CONCURRENCY = 16;

const nullResults = (keys: { key: string }[]): Record<string, CheckResult> =>
    Object.fromEntries(keys.map(({ key }) => [key, null]));

const makeHostResults = (): HostResults => {
    const tree: HostResults = {};
    for (const [category, providers] of Object.entries(DATA)) {
        tree[category] = {};
        for (const [provider, hosts] of Object.entries(providers)) {
            tree[category][provider] = Object.fromEntries(hosts.map((host) => [host, null]));
        }
    }
    return tree;
};

const hostCount = Object.values(DATA)
    .flatMap((category) => Object.values(category))
    .flat().length;

export const test: TestState = $state({
    finished: false,
    unreliable: false,
    dynamicBaitMounted: false,
    blocked: 0,
    notblocked: 0,
    total: hostCount + SCRIPT_BAITS.length + COSMETIC_BAITS.length + REAL_WORLD_CHECKS.length,
    categories: {
        cosmetic: { blocked: 0, total: COSMETIC_BAITS.length },
        scripts: { blocked: 0, total: SCRIPT_BAITS.length },
        realworld: { blocked: 0, total: REAL_WORLD_CHECKS.length },
        hosts: { blocked: 0, total: hostCount },
    },
    cosmetic: nullResults(COSMETIC_BAITS),
    script: nullResults(SCRIPT_BAITS),
    realworld: nullResults(REAL_WORLD_CHECKS),
    hosts: makeHostResults(),
});

function record(blocked: boolean, category: Category) {
    test[blocked ? "blocked" : "notblocked"] += 1;
    if (blocked) test.categories[category].blocked += 1;
}

// Hiding rules apply display:none. Height is useless here: the bait
// wrappers have line-height 0 and collapse to zero height regardless.
const isHidden = (el: HTMLElement | null) =>
    !el || el.offsetParent === null || getComputedStyle(el).display === "none";

function scriptChecks() {
    for (const bait of SCRIPT_BAITS) {
        const blocked = window[bait.flag] === undefined;
        test.script[bait.key] = blocked;
        record(blocked, "scripts");
    }
}

async function cosmeticChecks() {
    test.dynamicBaitMounted = true;
    await tick();
    await sleep(COSMETIC_SETTLE_MS);
    for (const bait of COSMETIC_BAITS) {
        const el = document.querySelector<HTMLElement>(`[data-bait="${bait.key}"]`);
        const hidden = isHidden(el);
        test.cosmetic[bait.key] = hidden;
        record(hidden, "cosmetic");
    }
}

let started = false;

export async function run() {
    // a remount (dev-time HMR) would re-record every check
    if (started) return;
    started = true;

    performance.setResourceTimingBufferSize?.(400);

    // also calibrates the surrogate timing threshold
    test.unreliable = !(await networkControls());

    scriptChecks();

    const hostTasks = Object.entries(DATA).flatMap(([category, providers]) =>
        Object.entries(providers).flatMap(([provider, hosts]) =>
            hosts.map((host) => async () => {
                const blocked = await checkHost(host);
                test.hosts[category][provider][host] = blocked;
                record(blocked, "hosts");
            })
        )
    );

    const realWorld = REAL_WORLD_CHECKS.map(async (check) => {
        const blocked = await checkRealResource(check);
        test.realworld[check.key] = blocked;
        record(blocked, "realworld");
    });

    await Promise.all([
        ...realWorld,
        cosmeticChecks(),
        runPool(hostTasks, CONCURRENCY),
    ]);

    test.finished = true;
}

function saveJson(filename: string, value: unknown) {
    const blob = new Blob([JSON.stringify(value)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadResult() {
    const now = new Date();
    const date = now.toLocaleString("en-GB");
    const stamp = date.replaceAll("/", "-").replaceAll(":", "-").replace(", ", "_");

    saveJson(`adblock-test_${stamp}.json`, {
        time: now.getTime(),
        date,
        note: "",
        abt: {
            total: test.total,
            blocked: test.blocked,
            notblocked: test.notblocked,
            unreliable: test.unreliable,
            categories: $state.snapshot(test.categories),
            cosmetic_test: $state.snapshot(test.cosmetic),
            script: $state.snapshot(test.script),
            realworld: $state.snapshot(test.realworld),
            hosts: $state.snapshot(test.hosts),
        },
    });
}
