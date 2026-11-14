# Storage Architecture Decision

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` §3.4
**Status:** Decided — 10 November 2026
**Scope:** Which store owns dashboard financial data on each runtime, and how versions/migrations/backups work.

## Decision (summary)

**The WebView `localStorage` key `sanchay.local.v1` is the single authoritative ledger for all dashboard financial data on every runtime** (Android WebView shell and the standalone browser/Render preview — same React code, same key). The inherited native Room database is **retained but is not a dashboard ledger**: no write path from the shipped UI was found; it serves at most read-only legacy consumers (settings theme, an optional reminder worker). A third store exists — Glance widget preferences (`balance_v2`) — but it is a **display cache**, not a ledger.

No second writable ledger may be introduced without updating this document.

## The seven questions (plan §3.4)

### 1. Which store is authoritative for Android dashboard data?

`localStorage` under `sanchay.local.v1`, written only by the React app (`web/src/data/persistence.ts`) inside the app's WebView. Evidence:

- Every financial write path (transactions, accounts, goals, budgets, planned payments, payment attempts, preferences) goes through `savePersistedState()` in `web/src/data/persistence.ts`.
- `RootViewModel` (the only app-shell consumer of Room found) uses `SettingsDao.findAll()` **read-only** for theme preference.
- Legacy Room actions/DAOs (`temp/legacy-code`, `WalletDAOs`, `*Act` classes) compile into the APK but are not reachable from `SanchayModernUI` (the WebView shell) — no navigation graph wires them to shipped UI.
- Widgets (`widget/*`) use their own Glance state; no Room or `localStorage` access found.
- `TransactionReminderWorker` reads `TransactionDao` (read-only) and is only relevant if legacy scheduling runs it — flagged for runtime verification on device (plan 8.4).

### 2. Which store is authoritative for the standalone Render/browser build?

The same `sanchay.local.v1` key in that browser's `localStorage`. There is **no server-side persistence and no sync**; the preview and the phone never share data (by design — local-first, plan §0).

### 3. How are schema versions and migrations handled?

- `STORAGE_VERSION = 1` (`persistence.ts`); every load validates the full structure (`parsePersistedState` + per-entity type guards).
- **Additive migrations:** new optional fields are introduced with defaults applied at parse time — `plannedPayments`, `paymentAttempts` (→ `[]`), `safeToSpendBuffer` (→ `undefined`), `demoMode` (→ `false`). Each has a regression test in `persistence.test.ts` ("loads older backups without …").
- **Breaking changes (future):** bump `STORAGE_VERSION`, write an explicit `migrateV1→V2` function, and add fixture tests before shipping. Do not repurpose the key.
- **Known weakness (accepted, documented):** a structurally invalid blob parses as `null` and the app falls back to first-run; the immediate auto-save then overwrites the corrupt blob. Mitigations today: JSON export reminders in the privacy panel; planned improvement is a corrupt-storage recovery prompt that offers the raw file for rescue before overwriting (plan 7.4).

### 4. How will old `sanchay.local.v1` users retain their records?

The key name and version stay stable; additive parsing keeps every existing field. For the (pre-release) installed base there is no migration to run — records survive upgrades as long as validation passes. If a v2 schema is ever required, v1 blobs migrate in place before first save, tested with fixtures.

### 5. How will backup/restore work across versions?

- Export: `createBackupState()` → versioned JSON (`version`, `savedAt`), **excluding** the app-lock PIN (tested).
- Import: `parsePersistedState()` validates entities, IDs, dates, currencies and amounts; invalid files are rejected without touching current state; restore is an explicit **replace** after preview (never a silent merge) — stated in UI copy.
- Cross-version: same additive parse path as the live key, plus legacy-field fixture tests. Restoring an older backup into a newer app is covered; newer-into-older is rejected by `version` check (safe failure).
- Encrypted backups: deferred to `docs/design-encrypted-backups.md` (approval pending).

### 6. Can two storage layers ever both accept writes for the same data?

**No — single-writer rule.**

| Store | Writer | Reader | Role |
|---|---|---|---|
| `sanchay.local.v1` (localStorage) | React app only | React app only | **Authoritative ledger** |
| Room (`IvyRoomDatabase`) | none found from shipped UI | `RootViewModel` (theme), optional reminder worker | Dormant legacy subsystem |
| Glance widget prefs (`balance_v2`) | widget internals | widget UI | Display cache |

Enforcement: the JS↔native bridge (`SanchayFileBridge`, `SanchayModernUI`) exposes file export/import only — no generic storage or DB bridge. Any future change that adds a Room writer for dashboard data **must** first make Room the single Android source of truth and migrate `sanchay.local.v1` data into it (plan §3.4 recommended shape), updating this document.

### 7. Cost/risk: keep localStorage vs IndexedDB or a Room-backed adapter?

| Option | Cost | Risk | Verdict |
|---|---|---|---|
| **Keep localStorage (chosen)** | none now; synchronous main-thread saves; ~5 MB quota | quota exhaustion on very large ledgers (handled with a visible save-error banner); no encryption at rest | **Selected** — smallest change, zero two-writer risk, matches both runtimes with one codebase |
| IndexedDB | rewrite persistence layer + tests; async everywhere | moderate — new failure modes, no user-visible gain yet | Revisit only with evidence (quota errors or measured jank) |
| Room-backed adapter for Android | full data migration, dual-runtime divergence (browser has no Room), bridge expansion | **high** — exactly the two-writer failure mode the plan forbids | Rejected for now; only as part of a deliberate "Room becomes the ledger" project |

Limitations of the chosen path that must stay documented for users: data lives in WebView storage only; clearing app data or uninstalling without an export destroys it; backups are manual, and plain JSON exports are unencrypted (password-encrypted `.sanchay` backups shipped 14 Nov 2026).

## Acceptance criteria (plan §3.4) — status

- [x] Documented architecture decision — this file.
- [x] One clear writer/source of truth per runtime — single-writer table above.
- [x] Data migration has tests using representative old backups — additive-legacy fixtures in `persistence.test.ts` (synthetic v1-without-new-fields blobs; no prior public release exists to harvest real fixtures from).
- [x] No user's existing data is discarded during migration — additive parse; invalid-file import aborts before touching state.
- [ ] Runtime confirmation that no native path writes Room — static evidence only; **requires the device/emulator session** (add to `docs/qa-and-device-test-results.md` when run).

## Native module retention

Inherited modules stay in the repo until dependency/license review (plan §3.4, 8.4): manifest declares widgets, QS tile, shortcuts, a custom `add_transaction` intent action (**no handler found in code — dead filter, remove or implement before release**), and `PaymentTileService`. Removal requires tracing each entry point; do not delete casually.
