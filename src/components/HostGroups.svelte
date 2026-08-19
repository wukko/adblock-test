<script lang="ts">
import { DATA } from "../lib/data";
import { type CheckResult, test } from "../lib/test.svelte";
import Row from "./Row.svelte";

const counter = (hosts: string[], results: Record<string, CheckResult>) => {
    const done = hosts.filter((host) => results[host] !== null).length;
    if (done < hosts.length) {
        return { text: "pending", cls: "st-wait" };
    }

    const blocked = hosts.filter((host) => results[host] === true).length;
    const cls = blocked === hosts.length
        ? "st-ok"
        : blocked * 2 > hosts.length
        ? "st-warn"
        : "st-bad";

    return { text: `${blocked}/${hosts.length} blocked`, cls };
};
</script>

{#each Object.entries(DATA) as [category, providers]}
    <h3>{category}</h3>
    {#each Object.entries(providers).toSorted(([a], [b]) => a.localeCompare(b)) as [provider, hosts]}
        {@const results = test.hosts[category][provider]}
        {@const state = counter(hosts, results)}
        <details>
            <summary>
                <span>{provider}</span>
                <span class="st {state.cls}">{state.text}</span>
            </summary>
            <div>
                {#each hosts as host}
                    <Row name={host} status={results[host]} />
                {/each}
            </div>
        </details>
    {/each}
{/each}

<style>
summary {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
}

summary > span:first-of-type {
    flex: 1;
}
</style>
