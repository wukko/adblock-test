<script lang="ts">
import { onMount } from "svelte";
import Row from "./components/Row.svelte";
import Score from "./components/Score.svelte";
import HostGroups from "./components/HostGroups.svelte";
import { COSMETIC_BAITS, REAL_WORLD_CHECKS, SCRIPT_BAITS } from "./lib/data";
import { run, test } from "./lib/test.svelte";

// EasyList's $generichide exceptions disable generic hiding on local addresses
const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
    || location.hostname.startsWith("192.168.")
    || location.hostname.startsWith("10.");

onMount(() => {
    // the bait scripts in index.html are parser-blocking, so by mount
    // time they have either executed or been blocked
    run();
});
</script>

<main>
    <div class="hero">
        <header>
            <h1>Content filtering test</h1>
            <p class="sub lede">
                Check whether your browser or network blocks real-world ads, trackers, and analytics.
            </p>
        </header>

        <Score />

        <p class="disclaimer">
            This test does not indicate how well a blocker performs in real world.
            There may be compatibility issues and misreports.
        </p>

        <a
            class="source"
            href="https://github.com/wukko/adblock-test"
            target="_blank"
            rel="noopener noreferrer"
        >
            Source code
        </a>

        <a class="button see-details" href="#details">See details ↓</a>
    </div>

    <section id="details">
        <h2>Notes</h2>
        <ul class="notes">
            <li>
                The score is the average of the four category scores, so each category counts
                equally. 60% and above means your setup blocks most of what this test can
                measure. 30% and below usually means no blocker is active, or it is invisible to
                the test.
            </li>
            <li>
                Before testing, the page checks that its own origin and a known-benign site are
                reachable. If they are not, failed requests mean a broken network rather than
                blocking, and the results are flagged as unreliable. Hosts that time out are
                retried once before counting as blocked.
            </li>
            <li>
                Blockers that answer a blocked request with a local dummy resource, like uBlock
                Origin's redirect rules, are detected by response timing. If host results still
                look too low, adding <code>@@*$redirect-rule</code> to My Filters makes those
                blocks plain.
            </li>
            <li>
                DNS filters (Pi-hole, AdGuard Home, NextDNS, and similar) can only be measured on
                host checks, so the cosmetic and script scores stay low. Block pages make blocked
                requests look successful; turn them off for a correct score.
            </li>
        </ul>
    </section>

    <section>
        <h2>Cosmetic filtering</h2>
        <p class="sub">
            This test determines whether common ad-like elements are blocked. Test elements match
            EasyList's generic rules, which apply on every site. A failure likely means your setup
            does no cosmetic filtering at all.
        </p>
        {#if isLocalHost}
            <p class="sub local-note">
                EasyList disables its generic hiding rules on localhost and LAN addresses, so
                these checks cannot pass here. Test on a deployed domain to measure cosmetic
                filtering.
            </p>
        {/if}
        {#each COSMETIC_BAITS as bait}
            <Row
                name={bait.rule + (bait.injected ? " (injected)" : "")}
                status={test.cosmetic[bait.key]}
            />
        {/each}
        <div class="bait" aria-hidden="true">
            {#each COSMETIC_BAITS.filter((bait) => !bait.injected) as bait (bait.key)}
                <div class={bait.className} id={bait.id} data-bait={bait.key}>&nbsp;</div>
            {/each}
            {#if test.dynamicBaitMounted}
                {#each COSMETIC_BAITS.filter((bait) => bait.injected) as bait (bait.key)}
                    <div class={bait.className} id={bait.id} data-bait={bait.key}>&nbsp;</div>
                {/each}
            {/if}
        </div>
    </section>

    <section>
        <h2>Script loading</h2>
        <p class="sub">
            This test loads scripts from paths that match EasyList's generic rules. A failure
            likely means your setup does not filter script requests by URL.
        </p>
        {#each SCRIPT_BAITS as bait}
            <Row name={bait.path} status={test.script[bait.key]} />
        {/each}
    </section>

    <section>
        <h2>Real-world scripts</h2>
        <p class="sub">
            This test loads the AdSense and Publisher Tag SDKs from Google's CDN, Google
            Analytics, LinkedIn Insight pixels with dummy IDs, and a DoubleClick ad
            iframe. These are live requests to real ad servers, but no data is sent.
        </p>
        {#each REAL_WORLD_CHECKS as check}
            <Row name={check.name} status={test.realworld[check.key]} />
        {/each}
    </section>

    <section>
        <h2>Hosts</h2>
        <p class="sub">
            This test probes domains to determine whether it's filtered. A request that
            fails or times out counts as blocked.
        </p>
        <HostGroups />
    </section>
</main>

<noscript>
    <p class="noscript-note">JavaScript is required to run this test.</p>
</noscript>

<style>
main {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 20px 64px;
}

.hero {
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.source {
    margin-top: 14px;
    font-size: 14px;
    color: var(--sub);
}

.disclaimer {
    margin: 12px 0 0;
    max-width: 420px;
    font-size: 13px;
    color: var(--sub);
}

.see-details {
    position: absolute;
    bottom: 16px;
    text-decoration: none;
}

@media (hover: hover) {
    .see-details:hover {
        background: var(--highlight);
    }
}

header h1 {
    margin: 0;
}

.lede {
    margin: 8px 0 0;
    max-width: 420px;
}

section {
    margin-top: 44px;
}

#details {
    scroll-margin-top: 32px;
}

.local-note {
    color: var(--warn);
}

section h2 {
    margin: 0;
}

section .sub {
    margin: 6px 0 16px;
}

.notes {
    margin: 16px 0 0;
    padding-left: 19px;
}

.notes li {
    margin: 8px 0;
    font-size: 14px;
}

.noscript-note {
    text-align: center;
    padding: 24px 16px;
}
</style>
