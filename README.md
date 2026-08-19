# adblock-test

Simple ad blocking test inspired by [adblocktest][turtlecute] (fork of [toolz][toolz]).

## How it works

Four categories of checks, averaged into one score:

- Cosmetic filtering: bait elements matching EasyList's generic hiding rules.
- Script loading: first-party bait scripts at paths matching EasyList's generic rules.
- Real-world scripts: production SDKs, tracking pixels, and an ad iframe, loaded the way real pages
  load them.
- Hosts: known ad, tracking, and analytics domains, probed with `no-cors` HEAD requests.

Failed or timed-out requests count as blocked (timeouts are retried once). Local dummy responses,
like uBlock Origin's redirect rules, are detected directly where endpoints allow it (unmasked timing
metadata, CORS-readable bodies) and by response timing elsewhere. Ambiguous timings are re-measured.
If the page's own origin or a known-benign site is unreachable, results are flagged as unreliable.

## Development

```sh
deno install
deno task dev
```

Format with `deno fmt`, typecheck with `deno run -A npm:svelte-check`.

## Deploy

```sh
deno task build
npx wrangler deploy
```

## License

This project is licensed under the [MIT License](LICENSE).

The list of test domains is based on the [Turtlecute Host List][turtlecute], which is licensed under
CC BY-NC-SA.

[turtlecute]: https://github.com/Turtlecute33/adblocktest
[toolz]: https://github.com/d3ward/toolz
