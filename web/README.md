# Sanchay web dashboard

React 19 + TypeScript + Vite dashboard that Sanchay loads inside its Android WebView (origin `https://sanchay.local`). All data lives in the WebView's `localStorage` (`sanchay.local.v1`); the dashboard performs **no network requests** — see [../docs/data-flow-inventory.md](../docs/data-flow-inventory.md).

## Commands (pnpm)

```bash
pnpm install        # lockfile: pnpm-lock.yaml (CI runs --frozen-lockfile)
pnpm dev            # dev server with HMR
pnpm test           # vitest unit tests
pnpm run lint       # oxlint
pnpm exec tsc -b    # type check
pnpm run build      # production build
```

From the repository root, `node scripts/build-web.js` builds the production bundle and syncs it to `dist/` (web hosting) and `app/src/main/assets/web/` (Android packaging), wiping stale hashed bundles first.

CI runs lint, typecheck, tests and the production build on every push/PR (`.github/workflows/web.yml`).

## Stack

React 19, TypeScript, Vite, plain CSS, lucide-react icons, vitest, oxlint.

Release-compliance rules (no `upi://`/`intent://`, no QR generation, no scraping APIs) are enforced over this source by `scripts/check-release-compliance.mjs`, which runs in CI.
