# Sanchay — Data-flow inventory (static)

Method: static inspection of this repository checkout — no device run. Date: 2026-11-08.
Companion to [release checklist](release-checklist.md) §2 and `SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` §7 ("Required release work"). Items that require a physical device remain in checklist §3.

## 1. Where data lives

| Store | Contents | Written by |
|---|---|---|
| WebView `localStorage` under `sanchay.local.v1` | Dashboard accounts, transactions, payees, goals, budgets, planned payments, payment-assistance attempts, preferences (including the optional app-lock PIN) | Web dashboard only (`web/src/data/persistence.ts`) |
| Native Room database | Inherited Ivy Wallet ledger | Native modules — **not wired to the dashboard**; a separate store (README, "Current limitations") |
| Native SharedPrefs / DataStore | Inherited native settings | Native modules |

Dashboard data does not enter native code except through the local file export in §3.

## 2. React dashboard (`web/`)

- Persistence: `localStorage` (`web/src/data/persistence.ts`), version `sanchay.local.v1`.
- Network: **none** — no `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, or remote asset URLs anywhere in `web/src`.
- Clipboard: user-initiated copies of payee UPI ID, payment details, and receipt text via `navigator.clipboard`; the app never reads the clipboard back.
- App-lock PIN: stored in local preferences only; the dashboard has no network path that could transmit it.
- Storage-reset: Privacy panel offers a two-step reset to demo data — see §10 for the full deletion/reset picture.

## 3. Kotlin ↔ JS bridge

- Single JS-visible object: `SanchayAndroid` exposing `saveFile(fileName, mimeType, content)` (`app/.../SanchayFileBridge.kt:16`).
  - Writes local files to `Downloads/Sanchay` via MediaStore (API 29+) or the legacy Downloads path (older); file name and MIME type are sanitized (`sanitizeFileName`, `sanitizeMimeType`).
  - Returns a local result string; performs no network I/O.
- Import path: system file picker through `WebChromeClient.onShowFileChooser` (`app/.../SanchayModernUI.kt:105`); the picked file content is handed back to the WebView. There is no bridge "read file" method and no bridge network method.
- No other `@JavascriptInterface` methods exist in the app.

## 4. WebView containment (`SanchayModernUI.kt`)

- Loads only `https://sanchay.local/index.html` from bundled assets (line 188).
- `shouldInterceptRequest` (lines 143–183) serves `sanchay.local` assets and returns a blocked `text/plain` response for every other host (line 181) — external navigations and subresource loads fail closed.
- `android:usesCleartextTraffic="false"` (`AndroidManifest.xml:31`).
- `allowFileAccess`, `allowContentAccess`, `allowFileAccessFromFileURLs`, `allowUniversalAccessFromFileURLs` all `false`; `mixedContentMode = MIXED_CONTENT_NEVER_ALLOW`; JavaScript enabled (required by the dashboard).
- No `onConsoleMessage` override → JavaScript console output is not forwarded to logcat.
- `android:allowBackup="false"` (`AndroidManifest.xml:23`) → no system cloud backup of app data.

## 5. Network destinations in the APK (capability inventory)

| Destination | Client | Payload | Triggered from | Reachable in current UI? |
|---|---|---|---|---|
| `currency-api.pages.dev`, `cdn.jsdelivr.net` (fawazahmed0 currency-api fallbacks) | Ktor (`shared/data/core/.../RemoteExchangeRatesDataSourceImpl.kt:17–20`) | Outbound: none (GET). Inbound: public FX-rate JSON | `SyncExchangeRatesUseCase` called from native Main/Home/Settings/Onboarding ViewModels | **No** — the unlocked UI shows only `SanchayModernUI` (`RootActivity.kt:130`); `IvyNavGraph`/`NavigationRoot` are unused imports there |
| `api.github.com/repos/Ivy-Apps/ivy-wallet` (`/contributors`, `/releases`, repo info) | Ktor (`feature/contributors/.../IvyWalletRepositoryDataSource.kt:77,97`, `feature/releases/.../ReleasesDataSource.kt:33`) | Outbound: none (GET). Inbound: public repository metadata | Native Contributors / Releases screens | **No** (same) |
| Firebase Firestore (project configured in `app/google-services.json`) | `firebase-firestore` (`feature/poll/impl/.../PollRepositoryImpl.kt:40`) | Write to `polls/{pollId}/votes/{deviceId}` with fields `option` (poll option id) and `timestamp` (server timestamp) — nothing else. `deviceId` is a random UUID generated in-app and stored in local DataStore (`shared/domain/.../DeviceIdUseCase.kt:27–28`), not the Android SSAID/hardware id; no account, balance, payee or transaction data is in the call | Native `PollScreen` vote action | **No** (same) |
| External browser (`ACTION_VIEW` intent) | Android system | URL only, user-initiated (Play Store page, GitHub/support links, import help articles) | Native helpers (`RootActivity.kt:350 openUrlInBrowser`, `:378 openGooglePlayAppPage`) | Only if a native screen is shown; dashboard links to other hosts are blocked by the interceptor (§4) |

Static conclusion: **no dashboard-originated network path exists**. The dormant native capabilities above are still compiled into the APK and must be declared in Play Data safety / the privacy policy. Final confirmation of runtime behavior on a release build is checklist §3 (packet capture).

## 6. Crash reporting / analytics

- **None.** Firebase Crashlytics was removed on 2026-11-08: Gradle plugin (`app/build.gradle.kts`), `libs.bundles.firebase` (app + `temp/legacy-code`), crashlytics-gradle-plugin (buildSrc), `FirebaseExt.kt`, and the `sendToCrashlytics` call in `RootActivity.kt`.
- No other analytics, ads, attribution, or crash SDKs appear in Gradle dependencies.
- `com.google.gms.google-services` plugin + `app/google-services.json` are retained solely because Firestore (poll voting) requires them.
- Verified against the **release** runtime classpath (`:app:dependencies --configuration releaseRuntimeClasspath`, 2026-11-08; re-verified 2026-11-09): `firebase-crashlytics`, `play-services-review`, and `play-services-app-update` are absent. Firebase artifacts present are Firestore-only (`firebase-firestore`, `firebase-common`, `firebase-components`, `firebase-auth-interop`, `firebase-appcheck-interop`, protolite); `play-services-base`/`basement`/`tasks` and `kotlinx-coroutines-play-services` (via `firebase-common`) appear only as Firestore transitives — the version catalog no longer declares any of them directly (dead `kotlin-coroutines-googleplay-temp` entry removed 2026-11-09; zero `kotlinx.coroutines.tasks` usages in source). Other notable runtime deps: Ktor client (OkHttp), Hilt/Dagger, `com.google.crypto.tink:tink-android` (Firestore SDK internals), Material, Accompanist. No analytics/ad/attribution SDK of any kind.

## 7. Logging

- `Timber.plant(DebugTree())` runs only when `BuildConfig.DEBUG` (`app/.../IvyAndroidApp.kt:29`) → release builds emit no Timber output.
- Ktor `Logging` uses `LogLevel.BODY` → `Timber.d` (`shared/data/core/.../KtorClientModule.kt:30–36`): a no-op in release, and its destinations carry no user data (GETs of public rate/repository JSON).
- Reachable flows write no financial data to Android logs: the dashboard has no network/console forwarding, and the file bridge logs nothing.
- No crash reports exist to contain data (§6).

## 8. Permissions (`AndroidManifest.xml`) and justification

Verified against the **release merged manifest** (`app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml`, regenerated 2026-11-08). Complete `<uses-permission>` set:

| Permission | Justification |
|---|---|
| `INTERNET` | Ktor capabilities (§5) + Firestore poll voting; required for Play Store/GitHub browser intents |
| `ACCESS_NETWORK_STATE` | Network connectivity checks for inherited sync/work scheduling (WorkManager, exchange-rate sync) |
| `POST_NOTIFICATIONS` | Inherited reminders/notifications |
| `RECEIVE_BOOT_COMPLETED` | Reschedule reminders after reboot |
| `com.android.alarm.permission.SET_ALARM` | Inherited reminder alarms |
| `WRITE_EXTERNAL_STORAGE` (`maxSdkVersion="28"`, `requestLegacyExternalStorage="true"` — both confirmed in the release merged manifest) | Legacy export path on Android 9/10 (`SanchayFileBridge` legacy branch); MediaStore used on 29+ |
| `READ_EXTERNAL_STORAGE` | Inherited import/picker flows (system picker grants scoped access on modern Android) |
| `VIBRATE` | Notification/alarm patterns |
| `DISABLE_KEYGUARD` | Show app over lockscreen (app lock) |
| `WAKE_LOCK` | Widget/WorkManager updates |
| `FOREGROUND_SERVICE` | Inherited reminder/sync foreground services (library-declared, merged in) |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | AndroidX Biometric prompt for the optional app lock (merged in via the biometric dependency) |
| `com.ivy.wallet.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AGP-generated internal permission for app-internal broadcast receivers — not user-facing |

Removed 2026-11-08: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (no usage found anywhere in source; absent from the release merged manifest). No contacts, SMS, call-log, or device-ID permissions exist in the manifest; no `crashlytics`/`gms.location` strings appear in the release merged manifest.

## 9. Exports and backups

- CSV export, receipt copy, and JSON/ZIP backups are written **locally only**: `Downloads/Sanchay` on Android (§3), browser downloads on desktop.
- Backup import replaces dashboard `localStorage` after a confirmation preview; no upload path exists for backups.
- Backups are **unencrypted**; the privacy panel and README state this explicitly and tell the user to store export files carefully (spec §7 "make the risks clear" branch). An encrypted-backup option remains an open P1 decision (checklist §5).
- **App-lock PIN is never exported**: `createBackupState` (`web/src/data/persistence.ts`) omits `appLockPin` from backup payloads, and the restore path ignores any `appLockPin` found in an imported file — the PIN exists only in this device's local storage. Covered by a unit test (`persistence.test.ts`, "never includes the app-lock PIN in exported backups").
- Backup payload scope = exactly the dashboard state needed to restore: accounts, transactions, payees (contacts), goals, budgets, planned payments, payment-assistance attempts, and non-secret preferences (theme, sound, card-frozen, profile, safe-to-spend buffer). No device identifiers, no analytics ids, no credentials.

## 10. Data deletion and reset

Three layers, from in-app to platform:

1. **In-app reset (dashboard):** Privacy panel → "Reset local data" (two-step confirm). It calls `clearPersistedState()`, which removes the **only** storage key the dashboard uses — `sanchay.local.v1` (`web/src/data/persistence.ts:341`; repo-wide search confirms no other `localStorage`/`sessionStorage` keys in `web/src`) — then repopulates demo data. This erases all dashboard accounts, transactions, payees, goals, budgets, planned payments, attempts, preferences and the app-lock PIN from local storage (the PIN state is explicitly cleared, `App.tsx` `handleResetLocalData`).
2. **Platform-level wipe (whole app):** Android Settings → Apps → Sanchay → Storage → **Clear data**. This removes app-private storage (WebView `localStorage`, DataStore incl. the poll `deviceId` and voted flags, SharedPrefs) and the Room database. `android:allowBackup="false"` means **no cloud backup copies exist** to clean up (§4).
3. **Cloud records:** the only server-side records tied to this app are anonymous Firestore poll votes (`polls/{pollId}/votes/{deviceId}` = option id + timestamp, §5) — no dashboard data is stored in the cloud. Exported backup files on disk are the user's responsibility to delete (stated in the privacy panel).

If cloud sync is ever added, item 203 of spec §7 requires extending this procedure to cover those server-side records.

## 11. Not covered here (requires device / release build)

- Release-APK packet capture and runtime confirmation of §5 reachability (checklist §3).
- On-device permission prompts, scoped-storage behavior on Android 10+, WebView storage-clear data-loss behavior.
- Play Store Data safety form and the public privacy policy URL (spec §7).
