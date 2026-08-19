<script lang="ts">
import { type CategoryScore, downloadResult, test } from "../lib/test.svelte";

const CATEGORY_LABELS: Record<string, string> = {
    cosmetic: "cosmetic",
    scripts: "scripts",
    realworld: "ad tech",
    hosts: "hosts",
};

const pct = (cat: CategoryScore) => cat.total ? Math.min(100, (100 * cat.blocked) / cat.total) : 0;

// the score weighs the four categories equally, so the many host checks
// don't drown out the handful of cosmetic and script ones
const percent = $derived(Math.round(
    Object.values(test.categories).reduce((sum, cat) => sum + pct(cat), 0)
        / Object.keys(test.categories).length,
));
const started = $derived(test.blocked + test.notblocked > 0);
const color = $derived(
    !started
        ? "var(--sub)"
        : percent > 30
        ? (percent > 60 ? "var(--ok)" : "var(--warn)")
        : "var(--bad)",
);
</script>

<section class="score" style="--score-c: {color}" aria-label="Score" aria-busy={!test.finished}>
    <div class="score-num">{started ? percent + "%" : "--"}</div>
    <div class="meter" role="presentation">
        <div class="meter-fill" style="width: {percent}%"></div>
    </div>
    <p class="counts">
        {#each Object.entries(test.categories) as [key, cat], i}
            {i > 0 ? " · " : ""}{CATEGORY_LABELS[key]} <span>{Math.round(pct(cat))}%</span>
        {/each}
    </p>
    <p class="counts">
        <span>{test.blocked}</span> blocked · <span>{test.notblocked}</span> not blocked ·
        <span>{test.total}</span> checks
    </p>
    {#if test.unreliable}
        <p class="warning" role="alert">
            Network problems detected. Results may be unreliable.
        </p>
    {/if}
    <div class="actions">
        <button type="button" onclick={() => location.reload()}>Run again</button>
        <button
            type="button"
            class="download"
            aria-label="Download results"
            disabled={!test.finished}
            onclick={downloadResult}
        >
            <span class:invisible={!test.finished}>Download results</span>
            {#if !test.finished}
                <span class="spinner" aria-hidden="true"></span>
            {/if}
        </button>
    </div>
</section>

<style>
.score {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 32px;
}

.score-num {
    font-size: 96px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    letter-spacing: -2px;
    line-height: 1;
    color: var(--score-c);
}

.download {
    position: relative;
}

.invisible {
    visibility: hidden;
}

.spinner {
    position: absolute;
    inset: 0;
    width: 14px;
    height: 14px;
    margin: auto;
    border: 2px solid var(--highlight);
    border-top-color: var(--sub);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .spinner {
        animation: none;
    }
}

.meter {
    width: 320px;
    height: 4px;
    border-radius: 2px;
    margin-top: 20px;
    background: var(--highlight);
    overflow: hidden;
}

.meter-fill {
    height: 100%;
    width: 0;
    background: var(--score-c);
    border-radius: 2px;
}

@media (prefers-reduced-motion: no-preference) {
    .meter-fill {
        transition: width 0.3s ease, background-color 0.3s ease;
    }
}

.counts {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--sub);
}

.meter + .counts {
    margin-top: 12px;
}

.counts span {
    color: var(--accent);
}

.warning {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--bad);
}

.actions {
    margin: 20px 0 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}
</style>
