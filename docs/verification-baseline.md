# Verification Baseline

**Recorded:** 10 November 2026 - **Re-verified:** 11 November 2026 (app-lock security hardening)
**Recorded:** 10 November 2026
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
| `pnpm -C web test` (vitest) | **151/151 passed, 14 files** (was 83/12 after first-run work; +41 ledger-engine acceptance tests for plan 4.2/4.3; +8 app-lock credential/lockout tests + 2 persistence credential tests; TZ legs America/New_York / Europe/London / Asia/Kolkata / Australia/Sydney also green) |
| `pnpm -C web run build` | exit 0 (chunk-size warning pre-existing; bundle `index-DUvBnQr_.js`) |
| `node scripts/check-release-compliance.mjs` | **PASS - 3,136 checks** (count scales with shipped files; 748 Kotlin/Java incl. `temp/`, web incl. `upi://`/`intent://`) |
| `gradlew detekt` | GREEN (`config/detekt/config.yml` + `baseline.yml`, 450 pre-existing TopLevelPropertyNaming entries — do not regenerate) |
| `gradlew lintRelease` | GREEN |
| `gradlew testDebugUnitTest` | GREEN (full suite) |
| `gradlew assembleDemo` | GREEN — `app/build/outputs/apk/demo/app-demo.apk`, R8-minified, demo flavor = `com.ivy.wallet.debug` |
| `gradlew :ci-actions:*:test` | GREEN |
| `gradlew :ci-actions:compose-stability:test` + `:run` | GREEN (`SUCCESS!`) |
| `git diff --check` | clean (CRLF warnings only) |
| First-run E2E (headless Edge/CDP vs production build) | **17/17 PASS** — see below; re-run 10 Nov after ledger-engine extraction, still ALL PASS |

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

- **Paparazzi:** golden-image tests fail locally on Windows only (~0.137% pixel delta on `DisclaimerScreenPaparazziTest`, `OpenSourceCardPaparazziTest`); goldens recorded on Linux CI. Never re-record locally — CI (`ubuntu-latest`) is authoritative.
- **Gradle harness:** long builds may report `ChildProcess.kill` spuriously; poll redirect files, check **stderr** (`BUILD FAILED` often lands there only).
- **Emulator:** boots but the AVD goes/stays `adb offline` on this machine (window-manager + adb-server issues); androidTest suites (`Migration128to129Test`, `IvyRoomDatabaseMigrationTest`, `BackupDataUseCaseAndroidTest`, `SyncExchangeRatesUseCaseTest`) have **not been run locally** — see `docs/implementation-status.md`.
- **Physical device:** none attached; checklist §3 / master plan §1.5 remain open (runbook + `scripts/device-verify.ps1` ready).

## Test inventory (web)

`web/src/utils/`: money, ledger, ledgerOps (add/edit/delete/undo/account-lifecycle acceptance, plan 4.2/4.3), appLock (PIN derivation + lockout backoff), safeToSpend, goalProjection, paymentAttempts, paymentWorkflowIntegration, categorySuggestion, spendingComparison, transactionTemplates, fileSave.
`web/src/data/`: persistence (incl. demo-mode + backup rules), firstRun (blank/sample seeds).
