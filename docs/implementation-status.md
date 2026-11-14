# Implementation Status

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` §3.1
**Verified against:** commit `f0a682bb7` + working tree, 14 November 2026
**Legend:** ✅ implemented and verified · 🟡 implemented but unverified · ◐ partial · ❌ missing · 🖼 mock/simulated

Platform key: **B** = desktop browser · **E** = emulator · **D** = physical device · **CI** = GitHub Actions

## Dashboard (React, `web/`)

| Feature | Status | Sources | Tests | Defects / edge cases | Platform | Next action |
|---|---|---|---|---|---|---|
| First-run blank vs sample | ✅ | `App.tsx`, `data/firstRun.ts`, `components/FirstRunScreen.tsx` | `firstRun.test.ts` (4), E2E 18 checks | none known (closed before commit) | B, CI | keep |
| Transactions CRUD + undo | ✅ | `utils/ledgerOps.ts` (pure engine), `App.tsx` (wiring), `components/AddTransactionModal.tsx` (busy-ref guard) | `ledgerOps.test.ts` (41 acceptance tests, plan §4.2/§4.3), `ledger.test.ts`, `transactionTemplates.test.ts` | engine extracted from App closures 10 Nov; undo is idempotent (no duplicate writes); goal-contribution reversal gap fixed | B, CI | device pass (1.5) |
| Money math (minor units) | ✅ | `utils/money.ts` | `money.test.ts` | DST bug in safe-to-spend horizon **fixed** 10 Nov (calendar-day arithmetic) | B, CI | keep TZ CI leg (in `web.yml`) |
| Accounts lifecycle | ◐ | `utils/ledgerOps.ts` (`deleteAccount` guard), `App.tsx` (connect/toggle), `components/ProfileSettingsModal.tsx` (inline delete error) | `ledgerOps.test.ts` (delete-with-history blocked → archive message; inactive rules) | delete now refuses when transactions are linked (plan §4.3); opening-balance **display** added to CardsTab account card; derivation statement added | B | opening-balance display + derivation done 10 Nov; next: device pass (1.5) |
| Cards (3D + freeze) | 🖼 | `components/CardsTab.tsx`, `ThreeDCard.tsx` | none | visual simulation only — must never imply real card controls | B | keep copy honest (README ✓) |
| Safe-to-Spend | ✅ | `utils/safeToSpend.ts` | `safeToSpend.test.ts` (7) + 5 time zones | lookback/recurring inputs deferred to recurring design | B, CI | after 2.4 |
| Planned payments + recurrence | ✅ | `components/PlannedPaymentsSection.tsx`, `utils/recurrence.ts` | `recurrence.test.ts`, `safeToSpend.test.ts`, `persistenceSafety.test.ts` | daily/weekly/monthly/yearly rules with interval and optional end date; month-end clamping; pause/resume; per-occurrence skip; expanded estimates never write the ledger and never auto-pay | B, CI | device pass (1.5) |
| Savings goals | ✅ | `components/GoalsTab.tsx`, `utils/goalProjection.ts` | `goalProjection.test.ts` | goal-contribution vs expense classification verified in tests | B, CI | — |
| Budgets | ✅ | `utils/budgetHistory.ts` (periods/archive/history), `components/GoalsTab.tsx`, `components/OverviewTab.tsx`, `App.tsx` alerts | `budgetHistory.test.ts` (14), budget E2E 16 checks | effective-month periods (edits never rewrite past months), archive/restore keeps past performance, 6-month history table, INR-scoped spend with refunds netted and transfers/pending/foreign currency excluded; legacy snapshots still parse; built-in and custom categories share the same budget labels | B, CI | device pass (1.5) |
| Category suggestions | ✅ | `utils/categorySuggestion.ts` | `categorySuggestion.test.ts` | — | B, CI | — |
| Payees | ✅ | `components/TransfersTab.tsx`, `utils/contacts.ts`, `data/persistence.ts` (validators) | `contacts.test.ts`, persistence validators | duplicate detection for name/UPI ID with explicit user override; favorites and edit/delete flows covered | B, CI | device pass (1.5) |
| Path A payment assistance | ✅ | `utils/paymentAttempts.ts`, `components/TransfersTab.tsx` | `paymentAttempts.test.ts`, `paymentWorkflowIntegration.test.ts` | enforced by CI gate (3,142 asserts: `upi://`, `intent://`) | B, CI | keep |
| Request money (plain text) | ✅ | `components/RequestMoneyModal.tsx` | — | never UPI Collect (copy verified) | B | — |
| Reports + CSV export | ✅ | `components/ReportsTab.tsx`, `utils/reporting.ts` | `reporting.test.ts` (12), `spendingComparison.test.ts`, `fileSave.test.ts` | totals derived from ledger rules and reconciled to `ledgerOps` state in tests; refunds net spending/categories; CSV preserves every row + currency | B, CI | — |
| Search / filters | ✅ | `components/SearchOverlay.tsx`, `ActivityTab.tsx` | — | — | B | — |
| App lock (4-digit PIN) | ✅ | `utils/appLock.ts`, `App.tsx`, `components/AppLockScreen.tsx`, `components/ProfileSettingsModal.tsx` | `appLock.test.ts` (8: format, salted credential, wrong PIN, backoff), `persistence.test.ts` (credential round-trip, backup exclusion, malformed rejection) | PIN stored only as salted PBKDF2-SHA-256 credential (120k iterations, random 16-byte salt, constant-time compare); legacy plaintext PIN upgraded on first successful unlock; 5-failure exponential lockout (30s-5min) persisted; copy states access barrier, not encryption | B | device pass (1.5) for background/process-death checks |
| Backup / restore | ✅ | `data/persistence.ts`, `utils/backupCrypto.ts`, `components/BackupPasswordModal.tsx`, `App.tsx` | `persistence.test.ts`, `backupCrypto.test.ts`, `persistenceSafety.test.ts` | password-encrypted `.sanchay` export (PBKDF2-SHA-256 600k + AES-256-GCM, random salt/IV, 5 MB plaintext / 7 MB envelope caps), plain JSON export/import, legacy backups import, atomic restore preserves the device lock, PIN/credential never exported or imported, invalid stored state is never overwritten | B, CI | device pass (1.5) for Downloads bridge |
| Privacy & terms panel | ✅ (in-app) | `App.tsx` privacy modal, `docs/privacy-policy.md`, `docs/terms-of-use.md` | privacy E2E 13 checks | embedded privacy/terms summaries: local-only storage, no analytics/ads/crash code, blocked hosts, inherited native destinations, not a bank / does not move money, estimates not advice, encrypted vs plain backups, PIN never exported; dialog semantics + Escape close; public policy/terms URLs + contact still external (1095) | B | host public URLs |
| Demo/blank reset | ✅ | `App.tsx` `handleResetLocalData`, `ProfileSettingsModal.tsx` | E2E + firstRun tests | two-step confirmations verified E2E | B | — |
| Sample-data opt-in + banner | ✅ | `App.tsx` banner, `ProfileSettingsModal` sample section | E2E round-trip | banner travels via `demoMode` pref (in backups) | B | — |
| Android file bridge | 🟡 | native `saveFile`/picker (Kotlin) | — | **device-only; never run** | — | D (1.5) |
| Multi-currency | ✅ | `money.ts` currency params, `utils/reporting.ts`, account currency field | `reporting.test.ts` (currency isolation), minor-unit tests (0/2/3-digit) | reports are per-currency (selector when >1); totals never mix currencies; transfers convert with explicit rate; quick entry stays INR-only and rejects other currencies explicitly | B, CI | — |
| Themes / preferences | ✅ | `App.tsx`, `index.css` | persistence round-trip | — | B | — |
| Custom categories/tags | ✅ | `utils/categories.ts`, `components/CategoriesModal.tsx`, `components/AddTransactionModal.tsx`, `components/TransactionDrawer.tsx` | `categories.test.ts`, persistence validators | custom `custom_*` income/expense categories with name, color, icon, archive and delete-when-unused; built-ins remain name-keyed; tags stored per transaction and shown in details/receipts | B, CI | device pass (1.5) |
| Refunds | ✅ | `utils/ledgerOps.ts` (`recordRefund`), `components/TransactionDrawer.tsx`, `App.tsx` | `ledgerOps.test.ts`, `reporting.test.ts` | only completed expenses; same currency and active account; date not before original; capped at remaining refundable; linked via `refundOfId`; nets spending and category totals | B, CI | device pass (1.5) |
| Recurring schedules | ✅ | `utils/recurrence.ts`, `components/PlannedPaymentsSection.tsx`, `utils/safeToSpend.ts` | `recurrence.test.ts`, `safeToSpend.test.ts`, `persistenceSafety.test.ts` | deterministic calendar expansion with end date, pause, and skip; no reminders, auto-pay, or ledger writes | B, CI | device pass (1.5) |
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
| Package ID / signing | ✅ | `applicationId app.sanchay` (+ `namespace app.sanchay`; demo `app.sanchay.debug`) | `aapt2 dump badging` + `assembleDemo` GREEN 12 Nov | production upload keystore still maintainer-only | `docs/android-identity-and-signing.md` |
| Home-screen widgets | 🟡 (inherited) | temp modules | — | not advertised; not P0 | — | trace reachability before removal |

## CI / quality gates

| Gate | Status | Evidence |
|---|---|---|
| web.yml (pnpm, frozen lockfile, lint/tsc/test/build + **TZ=America/New_York leg**) | ✅ | local green — 21 files / 447 tests |
| release-compliance.yml | ✅ | 3,163 assertions, planted-violation FAIL path proven |
| apk.yml (assemble + artifact script) | ✅ | local `assembleDemo` + `check-apk-artifact.sh` green |
| internal_release.yml (manual, fail-closed) | ✅ static | Sanchay-only workflow: `confirm_package` + `publish` inputs, Java 21, pnpm build, Fastlane `production_build`, AAB artifact, internal draft upload only after explicit confirmation; no Telegram |
| automatic_release.yml | ✅ manual | Repurposed as an explicit "Version bump PR" workflow, not an automatic store release |
| test.yml / detekt.yml / lint.yml | ✅ | local green |
| ci_actions_test.yml / compose_stability.yml | ✅ | local green (CRLF baseline fix) |
| paparazzi.yml | 🟡 CI-only | Windows local delta documented — never re-record |
| integration_test.yml (androidTest) | ❌ blocked | needs emulator/device |

## Open blockers (updated 14 Nov)

1. ~~Package ID decision~~ — **resolved 12 Nov**: `app.sanchay` / `app.sanchay.debug`, migrated + demo APK verified; only the production upload keystore remains (maintainer).
2. ~~Inherited `internal_release.yml`~~ — **resolved 14 Nov**: Sanchay-only manual workflow with package confirmation, no Telegram, and a fail-closed Play upload gate.
3. **Production Android signing + Play publishing** — requires the maintainer's upload keystore, `google-play-console-user.json`, Play Console access, and store listing/legal URLs. Externally blocked; not claimed as complete.
4. Physical device session (plan 1.5) — runbook ready, no device attached.
5. Emulator androidTest run — AVD stuck offline on this machine.
6. ~~App-lock PIN storage hardening (7.3)~~ - **resolved 11 Nov** (salted PBKDF2 credential + lockout; `utils/appLock.ts`).
7. Runtime network audit (7.2) — web layer **PASS** 12 Nov (production build: localhost assets only + one blocked font request; no analytics/telemetry); on-device WebView/release packet capture still pending.
8. ~~Design approvals: recurring payments, encrypted backups~~ — **both implemented and tested 14 Nov**; design docs updated to implemented status.
9. External: privacy/terms public URLs + contact TODOs, Play entries, legal review (UPI spec § external items). In-app summaries shipped 12 Nov; publication remains maintainer work.

Roadmap work completed 14 Nov: custom categories (UI + persistence + budgets/search/detail labels), transaction tags, partial expense refunds, recurring planned payments (pause/skip/end date + safe-to-spend expansion), goal notes and pause/complete/archive states, payee duplicate detection, encrypted backup/restore (AES-256-GCM), plain JSON fallback and legacy import, atomic restore preserving the device lock, web/Android asset sync, Sanchay-only release workflows, and Render deployment config.
Previously completed: 0.1 (`docs/implementation-status.md` + `docs/verification-baseline.md`), 0.2 (blank first-run, E2E 17/17), 0.3 (`docs/storage-architecture-decision.md`), 0.4 (`docs/android-identity-and-signing.md` + `.gitignore` keystore hardening), 5.3 (budget history/archive + E2E 16/16), privacy/terms in-app summaries + E2E 13/13, package-ID migration to `app.sanchay`.
