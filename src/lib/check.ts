import type { RealWorldCheck } from "./data";

const TIMEOUT_MS = 8000;

// Durations below this count as answered locally by a blocker (~0-5 ms,
// up to ~15 ms under load). Real responses need a network round trip.
// calibrate() may only raise it: surrogate latency is device-bound and
// doesn't shrink on faster networks.
let localAnswerMs = 15;

let probeSeq = 0;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const bustCache = (url: string) =>
    `${url}${url.includes("?") ? "&" : "?"}abt=${Date.now()}${++probeSeq}`;

const headFetch = (url: string, mode?: RequestMode) =>
    fetch(url, {
        method: "HEAD",
        mode,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

// The resource timing entry for a URL lands a task after its fetch settles.
async function resourceEntry(url: string): Promise<PerformanceResourceTiming | undefined> {
    for (let i = 0; i < 5; i++) {
        await sleep(0);
        const entry = performance.getEntriesByName(url).at(-1);
        if (entry) return entry as PerformanceResourceTiming;
    }
    return undefined;
}

// Timing-Allow-Origin unmasks transfer details, and a blocker's local stub
// can never carry them: any nonzero value proves a real network response.
const provenReal = (entry?: PerformanceResourceTiming) =>
    !!entry && (entry.transferSize > 0 || entry.responseStart > 0 || entry.decodedBodySize > 0);

type Verdict = "blocked" | "real" | "ambiguous" | "timeout";

const timingVerdict = (duration: number): Verdict => {
    if (duration < localAnswerMs) return "blocked";
    if (duration >= localAnswerMs * 4) return "real";
    return "ambiguous";
};

// Under concurrency a stub can take longer than the threshold, so ambiguous
// timings are re-measured one at a time once the network quiets down: probed
// alone, a stub drops to near-zero while a real response can't beat its
// round trip. Whatever is still ambiguous counts as blocked - a missed stub
// silently deflates scores, the opposite at worst over-credits a rare host.
let serialChain: Promise<unknown> = Promise.resolve();

function reprobeQuietly<T>(probe: () => Promise<T>): Promise<T> {
    const next = serialChain.then(async () => {
        await sleep(30);
        return probe();
    });
    serialChain = next.catch(() => undefined);
    return next;
}

// no-cors responses are opaque, so an error is the only direct block signal.
// But "success" doesn't prove the request left the machine: uBO's
// redirect(-rule)= filters answer blocked requests with an internal redirect
// to a local stub, and no-cors forbids redirect:'manual'. The key is timing:
// a stub arrives with near-zero network duration, a real response - 200, 404,
// or server-side redirect - needs a round trip.
async function probeHost(host: string): Promise<Verdict> {
    const url = bustCache(`https://${host}/fakepage.html`);
    const started = performance.now();
    try {
        await headFetch(url, "no-cors");
    } catch (error) {
        return error instanceof DOMException && error.name === "TimeoutError"
            ? "timeout"
            : "blocked";
    }
    const entry = await resourceEntry(url);
    if (provenReal(entry)) return "real";
    return timingVerdict(entry?.duration ?? performance.now() - started);
}

export async function checkHost(host: string): Promise<boolean> {
    let verdict = await probeHost(host);
    // a timeout can be a slow host rather than a block, so it gets one retry
    if (verdict === "timeout") verdict = await probeHost(host);
    if (verdict === "ambiguous") verdict = await reprobeQuietly(() => probeHost(host));
    return verdict !== "real";
}

// Round trip to the page's own origin, the fastest plausible real response.
// Sets the surrogate threshold and doubles as the first sanity control.
async function calibrate(): Promise<boolean> {
    const url = bustCache(`${location.origin}/`);
    const started = performance.now();
    try {
        await headFetch(url);
    } catch {
        return false;
    }
    const entry = await resourceEntry(url);
    const rtt = entry?.duration ?? performance.now() - started;
    localAnswerMs = Math.min(30, Math.max(15, rtt * 0.5));
    return true;
}

// Negative controls: if known-benign targets are unreachable, failed
// requests mean a broken network, not blocking.
export async function networkControls(): Promise<boolean> {
    const external = headFetch(bustCache("https://example.com/"), "no-cors")
        .then(() => true, () => false);
    const [originOk, externalOk] = await Promise.all([calibrate(), external]);
    return originOk && externalOk;
}

export async function runPool(tasks: (() => Promise<void>)[], limit: number): Promise<void> {
    let i = 0;
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
        while (i < tasks.length) await tasks[i++]();
    });
    await Promise.all(workers);
}

type LoadOutcome = "load" | "error" | "timeout";

function loadElement(kind: RealWorldCheck["kind"], url: string): Promise<LoadOutcome> {
    return new Promise((resolve) => {
        const el = kind === "image" ? new Image() : document.createElement(kind);
        const done = (outcome: LoadOutcome) => {
            clearTimeout(timer);
            el.remove();
            resolve(outcome);
        };
        const timer = setTimeout(() => done("timeout"), TIMEOUT_MS);
        el.addEventListener("load", () => done("load"), { once: true });
        el.addEventListener("error", () => done("error"), { once: true });
        if (el instanceof HTMLIFrameElement) {
            el.style.display = "none";
            el.tabIndex = -1;
            el.setAttribute("aria-hidden", "true");
        }
        el.src = url;
        if (!(el instanceof HTMLImageElement)) {
            document.body.append(el);
        }
    });
}

// The real endpoint is CORS-readable and its body contains the marker;
// a stub is neither readable nor a match.
async function corsOracle(url: string, marker: string): Promise<boolean> {
    try {
        const res = await fetch(bustCache(url), {
            mode: "cors",
            cache: "no-store",
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        return (await res.text()).includes(marker);
    } catch {
        return false;
    }
}

type ResourceProbe = { verdict: Verdict; outcome: LoadOutcome };

async function probeResource(check: RealWorldCheck): Promise<ResourceProbe> {
    const url = bustCache(check.url);
    const started = performance.now();
    const outcome = await loadElement(check.kind, url);
    if (outcome === "timeout") return { verdict: "timeout", outcome };
    if (check.proof === "cors") {
        const real = await corsOracle(check.url, check.marker ?? "");
        return { verdict: real ? "real" : "blocked", outcome };
    }
    const entry = await resourceEntry(url);
    if (provenReal(entry)) return { verdict: "real", outcome };
    // the real server always sends Timing-Allow-Origin, so masked timing
    // fields mean the response came from somewhere else
    if (check.proof === "tao") return { verdict: "blocked", outcome };
    return { verdict: timingVerdict(entry?.duration ?? performance.now() - started), outcome };
}

// Loads a production ad resource the way real pages do (script/img/iframe);
// scripts must also initialize.
export async function checkRealResource(check: RealWorldCheck): Promise<boolean> {
    let probe = await probeResource(check);
    if (probe.verdict === "ambiguous") probe = await reprobeQuietly(() => probeResource(check));
    if (probe.verdict !== "real") return true;
    // iframes fire load even for error pages, so the load event proves nothing
    if (check.kind === "iframe") return false;
    if (probe.outcome !== "load") return true;
    return check.verify ? !check.verify() : false;
}
