# Implementation Status

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` Â§3.1
**Verified against:** commit `b84db95d3` + working tree, 10 November 2026
**Legend:** âœ… implemented and verified Â· ðŸŸ¡ implemented but unverified Â· â— partial Â· âŒ missing Â· ðŸ–¼ mock/simulated

Platform key: **B** = desktop browser Â· **E** = emulator Â· **D** = physical device Â· **CI** = GitHub Actions

## Dashboard (React, `web/`)

| Feature | Status | Sources | Tests | Defects / edge cases | Platform | Next action |
|---|---|---|---|---|---|---|
| First-run blank vs sample | âœ… | `App.tsx`, `data/firstRun.ts`, `components/FirstRunScreen.tsx` | `firstRun.test.ts` (4), E2E 18 checks | none known (closed before commit) | B, CI | keep |
| Transactions CRUD + undo | âœ… | `utils/ledgerOps.ts` (pure engine), `App.tsx` (wiring), `components/AddTransactionModal.tsx` (busy-ref guard) | `ledgerOps.test.ts` (41 acceptance tests, plan Â§4.2/Â§4.3), `ledger.test.ts`, `transactionTemplates.test.ts` | engine extracted from App closures 10 Nov; undo is idempotent (no duplicate writes); goal-contribution reversal gap fixed | B, CI | device pass (1.5) |
| Money math (minor units) | âœ… | `utils/money.ts` | `money.test.ts` | DST bug in safe-to-spend horizon **fixed** 10 Nov (calendar-day arithmetic) | B, CI | keep TZ CI leg (in `web.yml`) |
| Accounts lifecycle | â— | `utils/ledgerOps.ts` (`deleteAccount` guard), `App.tsx` (connect/toggle), `components/ProfileSettingsModal.tsx` (inline delete error) | `ledgerOps.test.ts` (delete-with-history blocked â†’ archive message; inactive rules) | delete now refuses when transactions are linked (plan Â§4.3); opening-balance **display** added to CardsTab account card; derivation statement added | B | opening-balance display + derivation done 10 Nov; next: device pass (1.5) |
| Cards (3D + freeze) | ðŸ–¼ | `components/CardsTab.tsx`, `ThreeDCard.tsx` | none | visual simulation only â€” must never imply real card controls | B | keep copy honest (README âœ“) |
| Safe-to-Spend | âœ… | `utils/safeToSpend.ts` | `safeToSpend.test.ts` (7) + 5 time zones | lookback/recurring inputs deferred to recurring design | B, CI | after 2.4 |
| Planned payments (one-time) | âœ… | `components/PlannedPaymentsSection.tsx` | partial via safeToSpend | **recurring rules missing** â€” design `docs/design-recurring-payments.md` awaits approval | B | P1 after approval |
| Savings goals | âœ… | `components/GoalsTab.tsx`, `utils/goalProjection.ts` | `goalProjection.test.ts` | goal-contribution vs expense classification verified in tests | B, CI | â€” |
| Budgets | â— | `components/ReportsTab.tsx`/Overview | partial | **history/custom categories missing**; period-boundary tests thin | B | 2.3 |
| Category suggestions | âœ… | `utils/categorySuggestion.ts` | `categorySuggestion.test.ts` | â€” | B, CI | â€” |
| Payees | âœ… | `components/TransfersTab.tsx`, `data/persistence.ts` (validators) | persistence validators | duplicate-detect with user choice (6.4) not implemented | B | P1 |
| Path A payment assistance | âœ… | `utils/paymentAttempts.ts`, `components/TransfersTab.tsx` | `paymentAttempts.test.ts`, `paymentWorkflowIntegration.test.ts` | enforced by CI gate (3,130 asserts: `upi://`, `intent://`) | B, CI | keep |
| Request money (plain text) | âœ… | `components/RequestMoneyModal.tsx` | â€” | never UPI Collect (copy verified) | B | â€” |
| Reports + CSV export | âœ… | `components/ReportsTab.tsx`, `utils/` (csv) | `spendingComparison.test.ts`, `fileSave.test.ts` | reconciliation-to-ledger not exhaustively tested | B | 2.5 audit |
| Search / filters | âœ… | `components/SearchOverlay.tsx`, `ActivityTab.tsx` | â€” | â€” | B | â€” |
| App lock (4-digit PIN) | â— | `App.tsx`, `components/AppLockScreen.tsx` | none | **`appLockPin` stored as plaintext string in localStorage** (plan 7.3: improve storage + throttling); claims must say "access barrier, not encryption" | B | **P0: 7.3 review** |
| Backup / restore | â— | `data/persistence.ts`, `App.tsx` (export/import) | `persistence.test.ts` (validation, PIN exclusion, legacy fields) | unencrypted (design `docs/design-encrypted-backups.md` awaits approval); atomic-rollback not implemented | B, CI | 1.3 + approval |
| Demo/blank reset | âœ… | `App.tsx` `handleResetLocalData`, `ProfileSettingsModal.tsx` | E2E + firstRun tests | two-step confirmations verified E2E | B | â€” |
| Sample-data opt-in + banner | âœ… | `App.tsx` banner, `ProfileSettingsModal` sample section | E2E round-trip | banner travels via `demoMode` pref (in backups) | B | â€” |
| Android file bridge | ðŸŸ¡ | native `saveFile`/picker (Kotlin) | â€” | **device-only; never run** | â€” | D (1.5) |
| Multi-currency | â— | `money.ts` currency params, account currency field | minor-unit tests cover 0/2/3-digit idea only | quick-add flows INR-oriented; no FX rates/transfers/report grouping | B | 2.6 or disclose as unsupported |
| Themes / preferences | âœ… | `App.tsx`, `index.css` | persistence round-trip | â€” | B | â€” |
| Custom categories/tags | âŒ | â€” | â€” | fixed category list | â€” | P1 (2.1) |
| Recurring schedules | âŒ | â€” | â€” | design ready, awaiting approval | â€” | P1 (2.2) |
| Loans | âŒ (not exposed) | â€” | â€” | inherited/dormant only; **do not add before P0/P1** (plan 5.8) | â€” | out of scope |

## Android shell (`app/`, `temp/`, native modules)

| Feature | Status | Sources | Tests | Defects / edge cases | Platform | Next action |
|---|---|---|---|---|---|---|
| Release build (demo flavor) | âœ… | `app/build.gradle.kts` | `assembleDemo` GREEN, R8 | debug-signed (`sign.jks` + env for release) | CI, local | release signing runbook âœ“ |
| WebView shell (`SanchayModernUI`, RootActivity) | ðŸŸ¡ | recent commits | â€” | keyboard/viewport/back/process-recreation **untested** | â€” | D (8.1, 1.5) |
| Room DB + migrations | ðŸŸ¡ | `shared/data/core` | androidTest exists (`Migration128to129Test`, `IvyRoomDatabaseMigrationTest`) â€” **never run** (emulator stuck offline) | Room is a **separate, unused ledger** vs `sanchay.local.v1` â€” see 0.3 decision pending | E blocked | storage decision (0.3), then run androidTest |
| Backup androidTest | ðŸŸ¡ | `BackupDataUseCaseAndroidTest` | never run | as above | E blocked | as above |
| Exchange-rate sync | ðŸŸ¡ | `SyncExchangeRatesUseCaseTest` | never run | dormant network capability â€” inventory Â§`docs/data-flow-inventory.md` | E blocked | runtime network audit (7.2) |
| Permissions | âœ… audited | merged manifest | gate checks declared set | `WRITE_EXTERNAL_STORAGE` maxSdk 28 etc. justified in checklist | CI | re-audit at RC |
| Package ID / signing | âœ… audited | `applicationId com.ivy.wallet` | â€” | decision documented below | â€” | `docs/android-identity-and-signing.md` (0.4 â€” pending write-up) |
| Home-screen widgets | ðŸŸ¡ (inherited) | temp modules | â€” | not advertised; not P0 | â€” | trace reachability before removal |

## CI / quality gates

| Gate | Status | Evidence |
|---|---|---|
| web.yml (pnpm, frozen lockfile, lint/tsc/test/build + **TZ=America/New_York leg**) | âœ… | local green |
| release-compliance.yml | âœ… | 3,121 assertions, planted-violation FAIL path proven |
| apk.yml (assemble + artifact script) | âœ… | local `assembleDemo` green |
| test.yml / detekt.yml / lint.yml | âœ… | local green |
| ci_actions_test.yml / compose_stability.yml | âœ… | local green (CRLF baseline fix) |
| paparazzi.yml | ðŸŸ¡ CI-only | Windows local delta documented â€” never re-record |
| integration_test.yml (androidTest) | âŒ blocked | needs emulator/device |

## Open blockers (updated 10 Nov)

1. **Package ID decision** â€” `com.ivy.wallet` kept for now; recommendation + migration checklist in `docs/android-identity-and-signing.md` (must freeze before first public release).
2. **Inherited `internal_release.yml`** â€” re-point Ivy artifact names, Telegram side-channel, and Play service account before any release (see identity doc).
3. Physical device session (plan 1.5) â€” runbook ready, no device.
4. Emulator androidTest run â€” AVD stuck offline on this machine.
5. App-lock PIN storage hardening (7.3) â€” P0 security item.
6. Runtime network audit (7.2) â€” google-services plugin present; needed before Privacy Policy/Data safety claims.
7. Design approvals: recurring payments, encrypted backups.
8. External: privacy URL/contact TODOs, Play entries, legal review (UPI spec Â§ external items).

Completed this session: 0.1 (`docs/implementation-status.md` + `docs/verification-baseline.md`), 0.2 (blank first-run, E2E 18/18), 0.3 (`docs/storage-architecture-decision.md`), 0.4 (`docs/android-identity-and-signing.md` + `.gitignore` keystore hardening).
