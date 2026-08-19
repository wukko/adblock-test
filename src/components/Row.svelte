<script lang="ts">
import type { CheckResult } from "../lib/test.svelte";

type Props = {
    name: string;
    status: CheckResult;
};

let { name, status }: Props = $props();
</script>

<div class="row">
    <span class="name">{name}</span>
    <span class="st {status === null ? 'st-wait' : status ? 'st-ok' : 'st-bad'}">
        {status === null ? "pending" : status ? "blocked" : "not blocked"}
    </span>
</div>
