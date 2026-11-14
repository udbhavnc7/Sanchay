# Verification Baseline

**Recorded:** 10 November 2026 - **Re-verified:** 14 November 2026 (roadmap features, encrypted backups, release pipeline)
**Machine:** Windows 11, PowerShell 5.1 (WSL present but broken — use `"C:\Program Files\Git\bin\bash.exe"` for shell scripts)

## Toolchain

| Tool | Version |
|---|---|
| Node.js | v20.20.1 |
| pnpm | 10.34.3 (`%APPDATA%\npm`) |
| JDK | OpenJDK 21.0.12.1 (LTS) |
| Gradle | 8.8 (wrapper, `gradle-8.8-bin.zip`) |
| Kotlin | 2.0.20 (`gradle/libs.versions.toml`) |
| Vitest | 5.0.5 (`web/`) |
| oxlint | via `pnpm -C web run lint` |
| Android SDK | `C:\Users\LENOVO\AppData\Local\Android\Sdk` (emulator + `Medium_Phone_API_36.1` AVD present; AVD ini name ≠ directory name) |

## Commands and results (this baseline run)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm -C web run lint` (oxlint) | exit 0 |
| `pnpm -C web exec tsc -b --pretty false` | exit 0 |
| `pnpm -C web test` (vitest) | **447/447 passed, 21 files** (14 Nov; adds recurrence, encrypted-backup WebCrypto, categories, persistence-safety, refund, and goal tests; TZ legs America/New_York / Europe/London / Asia/Kolkata / Australia/Sydney also green) |
| Reports/currency suite (`reporting.test.ts`) | **12/12 PASS** - totals reconcile with `ledgerOps` state, refunds net spending (incl. category breakdown), transfer debits become goal savings, currencies never mix, CSV quoting/currency column (12 Nov) |
| Budget-history suite (`budgetHistory.test.ts`) | **14/14 PASS** - legacy snapshots still parse, same-month edit replaces the period, future scheduling, year rollover, negative clamp, no limit before first period, archive/restore, 6-month rows newest-first, refunds net and transfers/pending/foreign-currency rows excluded, zero-budget overspend, archived budgets keep past performance, empty state (12 Nov) |
| `pnpm -C web run build` | exit 0 (chunk-size warning pre-existing; bundle `index-Cjl43afo.js` + `index-D7yrrk_f.css`) |
| `node scripts/check-release-compliance.mjs` | **PASS - 3,163 checks** (count scales with shipped files; 748 Kotlin/Java incl. `temp/`, web incl. `upi://`/`intent://`) |
| `gradlew detekt` | GREEN (`config/detekt/config.yml` + `baseline.yml`, 450 pre-existing TopLevelPropertyNaming entries — do not regenerate) |
| `gradlew lintRelease` | GREEN |
| `gradlew testDebugUnitTest` | GREEN (full suite) |
| `gradlew assembleDemo` | GREEN (14 Nov, 1m 5s) — `app/build/outputs/apk/demo/app-demo.apk`, R8-minified, demo flavor = `app.sanchay.debug` |
| `bash scripts/check-apk-artifact.sh app/build/outputs/apk/demo/app-demo.apk` | **PASS** — dex denylist absent; exactly one bundle pair + `index.html` embedded (`index-Cjl43afo.js`, `index-D7yrrk_f.css`) |
| `node --test scripts/*.test.js` | **15/15 PASS** (Fastlane lanes + Appfile paths + release guards) |
| Package identity (`aapt2 dump badging`) | **PASS** — `package: name='app.sanchay.debug'`, `application-label:'Sanchay'`, `launchable-activity: com.ivy.wallet.RootActivity` (12 Nov) |
| `gradlew :ci-actions:*:test` | GREEN |
| `gradlew :ci-actions:compose-stability:test` + `:run` | GREEN (`SUCCESS!`) |
| `git diff --check` | clean (CRLF warnings only) |
| First-run E2E (headless Edge/CDP vs production build) | **17/17 PASS** — see below; re-run 10 Nov after ledger-engine extraction, still ALL PASS |
| App-lock E2E (headless Edge/CDP vs production build) | **17/17 PASS** - set PIN, PBKDF2 credential persisted with no plaintext PIN, wrong + correct unlock, reload/process-restart lock, legacy plaintext upgrade, 5-failure lockout persisted across reload (11 Nov) |
| Privacy/terms panel E2E (headless Edge/CDP vs production build) | **13/13 PASS** - header opens the panel, local-only storage copy, no analytics/ads/crash code statement, Android host blocking, inherited native destinations, "not a bank / does not move money / no UTR verification", estimates-not-advice, encrypted/plain-backup + PIN exclusion copy, export/import/reset actions, `role="dialog"` + `aria-modal`, Escape closes, Got it closes (12 Nov) |
| Reports/currency E2E (headless Edge/CDP vs production build) | **11/11 PASS, 2 consecutive runs** - metrics render, single-currency hides selector, CSV statement downloads (13 rows), mixed-currency fixture shows chips, USD scope filters to $25 only, INR scope formats in rupees, CSV export keeps every currency row (11 Nov) |
| Budget-history E2E (headless Edge/CDP vs production build) | **16/16 PASS, 2 consecutive runs** - sample history shows ₹56,500 current / ₹54,500 October; editing Groceries 12000->15000 records a November period while October stays ₹11,000; totals move to ₹59,500 vs ₹54,500; Overview budget follows; archiving Shopping drops the card to 6 categories and adds "Archived budgets" while October history is intact; restore returns 7 categories; reload keeps the edit and archive state (12 Nov) |
| README screenshots (`docs/screenshots/`) | **7/7 captured** at 390×844 @2x from the production build with sample data (Overview, Activity, Reports, Plan, Accounts, Payees, Budget history); on-device screenshots pending (12 Nov) |
| Runtime network audit (headless Edge/CDP vs production build) | **PASS** - 8 requests total: localhost assets only, plus one Google Fonts CSS request blocked via CDP to mirror the WebView allowlist; no analytics/telemetry hosts; first-run, Reports and CSV export still work offline (11 Nov) |
| Text encoding sweep (all tracked `md/ts/tsx/json/kt/xml/css/html/js/mjs/yml/properties/gradle/txt`) | **PASS** - 0 mojibake markers and 0 U+FFFD after repair of `App.tsx`, `CardsTab`, `OverviewTab`, `ReportsTab`, `TransactionDrawer`, `ledgerOps(.test)`, `ProfileSettingsModal`, `README`, plan, `data-flow-inventory` (11 Nov) |

## First-run E2E evidence (plan §3.3 acceptance)

Production build served by `vite preview` on `:4173`, driven over CDP in a clean profile:

1. First-run gate renders after splash; blank option listed first.
2. Choosing blank → persisted snapshot with **0 transactions, 0 accounts, no demo flag**; no banner.
3. Reload keeps the blank ledger; gate does not reappear (choice survives).
4. Clearing storage re-offers the gate (blank remains the default path).
5. Choosing sample → 53 transactions persisted with `demoMode: true`; persistent banner visible.
6. Banner "Manage" opens Profile settings → "Preferences & Backup" tab shows sample status and blank-reset section with correct copy.
7. Two-step reset → blank ledger, demo flag off, banner gone.
8. "Load sample data" offered after reset → round-trip restores 53 records and banner.

## Known environment caveats

- **Paparazzi:** goldens are recorded on Linux CI, never locally (Windows font rasterisation differs). On 14 Nov 2026 six goldens were still pre-rebranding images ("Ivy Wallet is open-source", "I accept"): all four `DisclaimerScreenPaparazziTest` cases plus both `OpenSourceCardPaparazziTest` cases, so CI failed while local Windows runs failed for the unrelated rendering reason. Re-recorded on `ubuntu-latest` via the manual `record_paparazzi_goldens.yml` workflow and committed; the remaining 46 goldens were byte-noisy but pixel-identical or within tolerance and were left untouched. CI verified green on 14 Nov 2026 (all 10 workflows on `a545adb32`).
- **Gradle harness:** long builds may report `ChildProcess.kill` spuriously; poll redirect files, check **stderr** (`BUILD FAILED` often lands there only).
- **Emulator:** boots but the AVD goes/stays `adb offline` on this machine (window-manager + adb-server issues); androidTest suites (`Migration128to129Test`, `IvyRoomDatabaseMigrationTest`, `BackupDataUseCaseAndroidTest`, `SyncExchangeRatesUseCaseTest`) have **not been run locally** — see `docs/implementation-status.md`.
- **Physical device:** none attached; checklist §3 / master plan §1.5 remain open (runbook + `scripts/device-verify.ps1` ready).

## Test inventory (web)

`web/src/utils/`: money, ledger, ledgerOps (add/edit/delete/undo/refund/account-lifecycle acceptance), appLock (PIN derivation + lockout backoff), backupCrypto (PBKDF2 + AES-GCM round-trip, tamper/wrong-password failures), budgetHistory (periods, archive, 6-month history), recurrence (calendar expansion, end date, skip, month-end clamping), categories (built-in/custom lifecycle), contacts (validation + duplicate detection), safeToSpend, goalProjection, paymentAttempts, paymentWorkflowIntegration, categorySuggestion, spendingComparison, transactionTemplates, fileSave.
`web/src/data/`: persistence (incl. demo-mode + backup rules), persistenceSafety (invalid-state recovery, atomic restore, recurrence/category validation), firstRun (blank/sample seeds).
