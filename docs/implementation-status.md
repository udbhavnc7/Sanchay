# Implementation Status

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` §3.1
**Verified against:** commit `b84db95d3` + working tree, 10 November 2026
**Legend:** ✅ implemented and verified · 🟡 implemented but unverified · ◐ partial · ❌ missing · 🖼 mock/simulated

Platform key: **B** = desktop browser · **E** = emulator · **D** = physical device · **CI** = GitHub Actions

## Dashboard (React, `web/`)

| Feature | Status | Sources | Tests | Defects / edge cases | Platform | Next action |
|---|---|---|---|---|---|---|
| First-run blank vs sample | ✅ | `App.tsx`, `data/firstRun.ts`, `components/FirstRunScreen.tsx` | `firstRun.test.ts` (4), E2E 18 checks | none known (closed before commit) | B, CI | keep |
| Transactions CRUD + undo | ✅ | `App.tsx`, `components/TransactionDrawer.tsx`, `utils/ledger.ts` | `ledger.test.ts`, `transactionTemplates.test.ts` | double-submit covered by UI state; device untested | B, CI | D (1.5) |
| Money math (minor units) | ✅ | `utils/money.ts` | `money.test.ts` | DST bug in safe-to-spend horizon **fixed** 10 Nov (calendar-day arithmetic) | B, CI | keep TZ CI leg (in `web.yml`) |
| Accounts lifecycle | ◐ | `App.tsx` (connect/toggle/delete), `components/ConnectAccountModal.tsx` | none direct | delete-with-history path untested; inactive-account selection rules unverified | B | tests for delete/archive semantics (1.2) |
| Cards (3D + freeze) | 🖼 | `components/CardsTab.tsx`, `ThreeDCard.tsx` | none | visual simulation only — must never imply real card controls | B | keep copy honest (README ✓) |
| Safe-to-Spend | ✅ | `utils/safeToSpend.ts` | `safeToSpend.test.ts` (7) + 5 time zones | lookback/recurring inputs deferred to recurring design | B, CI | after 2.4 |
| Planned payments (one-time) | ✅ | `components/PlannedPaymentsSection.tsx` | partial via safeToSpend | **recurring rules missing** — design `docs/design-recurring-payments.md` awaits approval | B | P1 after approval |
| Savings goals | ✅ | `components/GoalsTab.tsx`, `utils/goalProjection.ts` | `goalProjection.test.ts` | goal-contribution vs expense classification verified in tests | B, CI | — |
| Budgets | ◐ | `components/ReportsTab.tsx`/Overview | partial | **history/custom categories missing**; period-boundary tests thin | B | 2.3 |
| Category suggestions | ✅ | `utils/categorySuggestion.ts` | `categorySuggestion.test.ts` | — | B, CI | — |
| Payees | ✅ | `components/TransfersTab.tsx`, `data/persistence.ts` (validators) | persistence validators | duplicate-detect with user choice (6.4) not implemented | B | P1 |
| Path A payment assistance | ✅ | `utils/paymentAttempts.ts`, `components/TransfersTab.tsx` | `paymentAttempts.test.ts`, `paymentWorkflowIntegration.test.ts` | enforced by CI gate (3,127 asserts: `upi://`, `intent://`) | B, CI | keep |
| Request money (plain text) | ✅ | `components/RequestMoneyModal.tsx` | — | never UPI Collect (copy verified) | B | — |
| Reports + CSV export | ✅ | `components/ReportsTab.tsx`, `utils/` (csv) | `spendingComparison.test.ts`, `fileSave.test.ts` | reconciliation-to-ledger not exhaustively tested | B | 2.5 audit |
| Search / filters | ✅ | `components/SearchOverlay.tsx`, `ActivityTab.tsx` | — | — | B | — |
| App lock (4-digit PIN) | ◐ | `App.tsx`, `components/AppLockScreen.tsx` | none | **`appLockPin` stored as plaintext string in localStorage** (plan 7.3: improve storage + throttling); claims must say "access barrier, not encryption" | B | **P0: 7.3 review** |
| Backup / restore | ◐ | `data/persistence.ts`, `App.tsx` (export/import) | `persistence.test.ts` (validation, PIN exclusion, legacy fields) | unencrypted (design `docs/design-encrypted-backups.md` awaits approval); atomic-rollback not implemented | B, CI | 1.3 + approval |
| Demo/blank reset | ✅ | `App.tsx` `handleResetLocalData`, `ProfileSettingsModal.tsx` | E2E + firstRun tests | two-step confirmations verified E2E | B | — |
| Sample-data opt-in + banner | ✅ | `App.tsx` banner, `ProfileSettingsModal` sample section | E2E round-trip | banner travels via `demoMode` pref (in backups) | B | — |
| Android file bridge | 🟡 | native `saveFile`/picker (Kotlin) | — | **device-only; never run** | — | D (1.5) |
| Multi-currency | ◐ | `money.ts` currency params, account currency field | minor-unit tests cover 0/2/3-digit idea only | quick-add flows INR-oriented; no FX rates/transfers/report grouping | B | 2.6 or disclose as unsupported |
| Themes / preferences | ✅ | `App.tsx`, `index.css` | persistence round-trip | — | B | — |
| Custom categories/tags | ❌ | — | — | fixed category list | — | P1 (2.1) |
| Recurring schedules | ❌ | — | — | design ready, awaiting approval | — | P1 (2.2) |
| Loans | ❌ (not exposed) | — | — | inherited/dormant only; **do not add before P0/P1** (plan 5.8) | — | out of scope |

## Android shell (`app/`, `temp/`, native modules)

| Feature | Status | Sources | Tests | Defects / edge cases | Platform | Next action |
|---|---|---|---|---|---|---|
| Release build (demo flavor) | ✅ | `app/build.gradle.kts` | `assembleDemo` GREEN, R8 | debug-signed (`sign.jks` + env for release) | CI, local | release signing runbook ✓ |
| WebView shell (`SanchayModernUI`, RootActivity) | 🟡 | recent commits | — | keyboard/viewport/back/process-recreation **untested** | — | D (8.1, 1.5) |
| Room DB + migrations | 🟡 | `shared/data/core` | androidTest exists (`Migration128to129Test`, `IvyRoomDatabaseMigrationTest`) — **never run** (emulator stuck offline) | Room is a **separate, unused ledger** vs `sanchay.local.v1` — see 0.3 decision pending | E blocked | storage decision (0.3), then run androidTest |
| Backup androidTest | 🟡 | `BackupDataUseCaseAndroidTest` | never run | as above | E blocked | as above |
| Exchange-rate sync | 🟡 | `SyncExchangeRatesUseCaseTest` | never run | dormant network capability — inventory §`docs/data-flow-inventory.md` | E blocked | runtime network audit (7.2) |
| Permissions | ✅ audited | merged manifest | gate checks declared set | `WRITE_EXTERNAL_STORAGE` maxSdk 28 etc. justified in checklist | CI | re-audit at RC |
| Package ID / signing | ✅ audited | `applicationId com.ivy.wallet` | — | decision documented below | — | `docs/android-identity-and-signing.md` (0.4 — pending write-up) |
| Home-screen widgets | 🟡 (inherited) | temp modules | — | not advertised; not P0 | — | trace reachability before removal |

## CI / quality gates

| Gate | Status | Evidence |
|---|---|---|
| web.yml (pnpm, frozen lockfile, lint/tsc/test/build + **TZ=America/New_York leg**) | ✅ | local green |
| release-compliance.yml | ✅ | 3,121 assertions, planted-violation FAIL path proven |
| apk.yml (assemble + artifact script) | ✅ | local `assembleDemo` green |
| test.yml / detekt.yml / lint.yml | ✅ | local green |
| ci_actions_test.yml / compose_stability.yml | ✅ | local green (CRLF baseline fix) |
| paparazzi.yml | 🟡 CI-only | Windows local delta documented — never re-record |
| integration_test.yml (androidTest) | ❌ blocked | needs emulator/device |

## Open blockers (unchanged)

1. **0.3 storage architecture decision** — `docs/storage-architecture-decision.md` not yet written (localStorage vs Room; no two writable ledgers).
2. **0.4 android identity/signing write-up** — audit facts known; `docs/android-identity-and-signing.md` not yet written.
3. Physical device session (plan 1.5) — runbook ready, no device.
4. Emulator androidTest run — AVD stuck offline on this machine.
5. App-lock PIN storage hardening (7.3) — P0 security item.
6. Design approvals: recurring payments, encrypted backups.
7. External: privacy URL/contact TODOs, Play entries, legal review (UPI spec § external items).
