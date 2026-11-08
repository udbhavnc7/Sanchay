# Sanchay — Release Checklist (P0/P1)

This document is a release-gate checklist. Items marked **[Verified here]** were checked in this repository checkout. Items marked **[Needs device/APK]** must be verified on a physical Android device and a release APK before store submission.

Path A rule remains mandatory: payment assistance and local reconciliation only. No `upi://pay` deep links, QR generation, UPI Collect/API, SMS/notification scraping, PIN/OTP/credentials, or auto-retry of unknown payments. Path B is not enabled.

## 1) Privacy policy URL (P0)

- [ ] Publish a public privacy policy URL and link it in-store listing + in-app.
  - Draft ready for maintainer: [docs/privacy-policy.md](privacy-policy.md) — fill the `[TODO]` identity/contact/retention-decision fields and publish at a public HTTPS URL; then link it here, in the README, in the in-app privacy panel, and in the Play listing.
  - In-app privacy panel exists and now documents retention/deletion, the unencrypted-backup risk, and PIN exclusion. No published public URL is known in-repo.
  - Retention + incident-response procedure: [docs/retention-incident-response.md](retention-incident-response.md).
- [ ] Match every in-app/README claim to release APK behavior before submission:
  - Web dashboard: local only (`sanchay.local.v1`); no upload/sync network calls. **[Verified here]** — web source: no `fetch(`/XHR/beacon; no `upi://` or QR generation.
  - Native shell/modules: APK capabilities differ — see §2.

## 2) APK network / permission / SDK audit (P0) — static, verified from repo

Verified from `app/src/main/AndroidManifest.xml`, Gradle files, and native Java/Kotlin sources:

- [x] Location permissions removed: `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` deleted from `app/src/main/AndroidManifest.xml` (repo-wide search found no usage in any Kotlin/Java/XML source). **[Verified here]**
- [x] Cleartext traffic disabled: `usesCleartextTraffic="false"` on `<application>`; no `networkSecurityConfig` override exists. **[Verified here]**
- [ ] Manifest still declares: `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `INTERNET`, `SET_ALARM`, `WRITE_EXTERNAL_STORAGE` (maxSdk 28), `READ_EXTERNAL_STORAGE`, `VIBRATE`, `DISABLE_KEYGUARD`, `WAKE_LOCK`; `requestLegacyExternalStorage="true"` remains.
  - `INTERNET` + `ACCESS_NETWORK_STATE` justified: Ktor features (exchange-rate sync, contributors, releases), Firestore poll voting. **[Verified here]**
  - Notification/boot/alarm/vibrate/wake-lock justified: reminders, widgets, WorkManager scheduling. Legacy storage kept for CSV/ZIP export/import flows — confirm against scoped storage on device.
- [x] Crashlytics removed: plugin `com.google.firebase.crashlytics` dropped from `app/build.gradle.kts`, `libs.bundles.firebase` removed from `app` + `temp/legacy-code`, `FirebaseExt.kt` deleted, `sendToCrashlytics` call removed from `RootActivity.kt`, crashlytics-gradle-plugin dropped from `buildSrc`. **[Verified here]** — `compileDebugKotlin` BUILD SUCCESSFUL; compiled `RootActivity.class` contains no `sendToCrashlytics`/`ReviewManagerFactory`.
- [x] Play Services surface removed: `libs.bundles.google` (app-update, play-services-tasks, review-ktx) dropped; in-app review flow (`ReviewManagerFactory`) replaced with direct Play Store page open (`openGooglePlayAppPage`) preserving the rate-us card + Settings entry points. **[Verified here]**
- [ ] Firebase retained for Firestore only: `com.google.gms.google-services` plugin + `app/google-services.json` stay (required by `feature/poll/impl` Firestore voting). Poll votes are network writes → disclose in privacy policy + Play Data safety.
- [x] Bridge check: `SanchayFileBridge.kt` — no upload/network code found by static search (file/export/download only). **[Verified here]**
- [x] WebView asset serving: `SanchayModernUI.kt:143-183` now serves only `sanchay.local` assets and returns a blocked response for other hosts (line 181); keep release cleartext disabled. **[Verified here]** — compiles clean.
- [x] WebView security flags: `SanchayModernUI.kt` now sets file/content access and file/URL access off, and mixed content to `MIXED_CONTENT_NEVER_ALLOW`; `javaScriptEnabled` remains enabled because the dashboard requires JS. **[Verified here]** — compiles clean.
- [x] Data-flow inventory created: [docs/data-flow-inventory.md](data-flow-inventory.md) — dashboard, bridge, WebView containment, all network destinations, permissions with justifications, logging, exports/backup flow. **[Verified here]**
- [x] Logging audit: `Timber.plant(DebugTree())` only under `BuildConfig.DEBUG` (`IvyAndroidApp.kt:29`); Ktor `LogLevel.BODY` logging (`KtorClientModule.kt:30`) is a no-op in release and its destinations carry no user data; WebView has no `onConsoleMessage` (console not forwarded to logcat); no crash reports exist (Crashlytics removed). **[Verified here]**
- [x] Release merged manifest audited: regenerated `app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml` (2026-11-08) — `usesCleartextTraffic="false"`, `allowBackup="false"`, `requestLegacyExternalStorage` only on `WRITE_EXTERNAL_STORAGE` with `maxSdkVersion="28"`; full `<uses-permission>` set documented in inventory §8 (includes library-merged `FOREGROUND_SERVICE`, `USE_BIOMETRIC`/`USE_FINGERPRINT`); no `LOCATION`/`crashlytics`/`gms.location` strings. **[Verified here]**
- [x] Release runtime classpath audited: `:app:dependencies --configuration releaseRuntimeClasspath` — no `firebase-crashlytics`, `play-services-review`, or `play-services-app-update`; Firebase artifacts are Firestore-only (`firebase-firestore` + core/interop libs); no analytics/ad/attribution SDKs anywhere (inventory §6). **[Verified here]**
- [x] Release asset hygiene: `app/src/main/assets/web/assets/` contains exactly the current bundle referenced by `index.html`; `scripts/build-web.js` now wipes targets before syncing so stale bundles cannot re-accumulate. **[Verified here]**

Release decisions required before Play submission (owner: maintainer):

- [x] Crashlytics + Play Services/Review removed from release (see §2). **[Verified here]**
- [ ] Remaining maintainer decisions: keep/trim `INTERNET` (justified — network features exist), legacy storage (keep pending on-device scoped-storage check), Firestore poll disclosure (privacy policy + Play Data safety). Do not ship local-first claims the release APK contradicts.
- [x] Cleartext traffic set to `false`. **[Verified here]**
- [ ] Confirm no UPI network integration is introduced. Path B stays gated/disabled by default.

## 3) Physical device verification (P0) — needs device/APK

- [ ] Install the **release** APK on a physical Android device (not emulator only).
- [ ] Confirm the dashboard loads from bundled assets; no remote content fetch required.
- [ ] Verify persistence through: app restart, OS WebView storage clear, app data clear; confirm data-loss behavior matches README.
- [ ] Verify backup export/import round-trip on-device (Downloads/Sanchay bridge + system file picker).
- [ ] Verify: no network traffic when using dashboard-only flows (airplane mode + packet capture).
- [x] Run `./gradlew.bat :app:testDebugUnitTest` — `BUILD SUCCESSFUL`, but task reports `NO-SOURCE` (the `:app` module contains no unit-test sources; a prior 120s timeout was environmental, not a failure). **[Verified here]**
- [ ] Complete Play Store data-safety / privacy review with the release manifest + SDK list.

## 4) Web dashboard — verified here

- [x] `cd web && npx vitest run` — 11 files / 74 tests pass. **[Verified here]**
- [x] `cd web && npm run lint` — clean (oxlint). **[Verified here]**
- [x] `cd web && npx tsc -b --pretty false` — clean. **[Verified here]**
- [x] `node scripts/build-web.js` — assets rebuilt/synced (`dist/` + `app/src/main/assets/web/`); the script now deletes each target before copying, so stale hashed bundles can't accumulate in APK assets (3 previously tracked dead `index-*.js` bundles removed; assets contain exactly the current `index-uZUmDb_u.js` + `index-BMfJWKCU.css`, and `index.html` references only those). **[Verified here]**
- [x] Path A source scan: no `upi://` or QR generation in web source — only matches are negative assertions in `paymentAttempts.test.ts` (asserting absence). **[Verified here]**

## 5) P1/P2 before calling the product release-ready

- [ ] Recurring/scheduled payments (one-time planned payments only today) — scoped design required before implementation.
- [ ] Encrypted/automatic backups (manual JSON only; unencrypted). — Risk-wording branch of spec §7 item 205 is done (panel + README state "not encrypted", PIN excluded from exports, unit-tested); what remains is the optional encryption/automation feature itself.
- [x] GPL-3.0 attribution: `LICENSE` contains the full GPL-3.0 text; README "Based on Ivy Wallet" credits upstream (Ivy Apps), states the license and non-affiliation; a dated "Changes since the fork" section lists the modifications (GPL §5a-style notice). **[Verified here]**
- [ ] Terms of use / support contact / data-deletion contact links — needs maintainer-provided content (URLs, contact address); wire into README + the in-app privacy panel when available.
