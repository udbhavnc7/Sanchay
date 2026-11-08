# Sanchay — Release Checklist (P0/P1)

This document is a release-gate checklist. Items marked **[Verified here]** were checked in this repository checkout. Items marked **[Needs device/APK]** must be verified on a physical Android device and a release APK before store submission.

Path A rule remains mandatory: payment assistance and local reconciliation only. No `upi://pay` deep links, QR generation, UPI Collect/API, SMS/notification scraping, PIN/OTP/credentials, or auto-retry of unknown payments. Path B is not enabled.

## 1) Privacy policy URL (P0)

- [ ] Publish a public privacy policy URL and link it in-store listing + in-app.
  - In-app privacy panel currently exists in the dashboard. No published public URL is known in-repo.
- [ ] Match every in-app/README claim to release APK behavior before submission:
  - Web dashboard: local only (`sanchay.local.v1`); no upload/sync network calls. **[Verified here]** — web source: no `fetch(`/XHR/beacon; no `upi://` or QR generation.
  - Native shell/modules: APK capabilities differ — see §2.

## 2) APK network / permission / SDK audit (P0) — static, verified from repo

Verified from `app/src/main/AndroidManifest.xml`, Gradle files, and native Java/Kotlin sources:

- [ ] Manifest declares: `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `SET_ALARM`, `WRITE_EXTERNAL_STORAGE` (maxSdk 28), `READ_EXTERNAL_STORAGE`, `VIBRATE`, `DISABLE_KEYGUARD`, `WAKE_LOCK`.
- [ ] `usesCleartextTraffic="true"` and `requestLegacyExternalStorage="true"` are set on `<application>`.
- [ ] Gradle applies Google Play Services + Firebase: `com.google.gms.google-services`, `com.google.firebase.crashlytics`, `libs.bundles.google` (`google-play-update`, `google-play-services` i.e. play-services-tasks, `google-play-review`), `libs.bundles.firebase` (`firebase-crashlytics` only). `app/google-services.json` is present in the repo.
- [ ] Native location APIs: no usage found in `app/src/main/java` or imported helpers (`app/src/main/java` and `temp` search for `FusedLocation`/`LocationManager`/location permission constants). Location permissions appear inherited from the Ivy legacy manifest and should be removed or justified.
- [ ] Crashlytics: wired via `temp/legacy-code/src/main/java/com/ivy/legacy/utils/FirebaseExt.kt` (`recordException`, `log`); called from `RootActivity.kt:359` for an external-link failure. Runtime traffic and collected metadata depend on Firebase configuration; treat as non-local telemetry until disabled or disclosed.
- [ ] Play review: `RootActivity.kt:426-449` calls `ReviewManagerFactory.create(this)` and `requestReviewFlow()`. Legacy "rate us" flow; requires Play Services and adds network/privacy surface unrelated to the Sanchay dashboard.
- [ ] Bridge check: `SanchayFileBridge.kt` — no upload/network code found by static search (file/export/download only). **[Verified here]**
- [ ] WebView asset serving: `SanchayModernUI.kt:142-184` intercepts only `sanchay.local`, serves bundled `web/` assets, and falls back to `super.shouldInterceptRequest` otherwise; `usesCleartextTraffic="true"` means unmatched/typed URLs could use cleartext. The dashboard should stay local-only; add an explicit deny/fallback for non-`sanchay.local` requests in a reviewed change if shipping as-is.

Release decisions required before Play submission (owner: maintainer):

- [ ] Decide whether `INTERNET`, location permissions, cleartext traffic, legacy storage, Firebase/Crashlytics, Play Services/Review remain in release. Remove/disable anything not needed for the Sanchay dashboard; document removal in the manifest/build.
- [ ] If Firebase/Crashlytics or Play Services remain, complete: privacy policy, Play Data safety, data security section, SDK declarations, and consent/opt-out flow. Do not ship local-first claims that the release APK contradicts.
- [ ] Set cleartext traffic to `false` unless a documented, reviewed exception exists.
- [ ] Confirm no UPI network integration is introduced. Path B stays gated/disabled by default.

## 3) Physical device verification (P0) — needs device/APK

- [ ] Install the **release** APK on a physical Android device (not emulator only).
- [ ] Confirm the dashboard loads from bundled assets; no remote content fetch required.
- [ ] Verify persistence through: app restart, OS WebView storage clear, app data clear; confirm data-loss behavior matches README.
- [ ] Verify backup export/import round-trip on-device (Downloads/Sanchay bridge + system file picker).
- [ ] Verify: no network traffic when using dashboard-only flows (airplane mode + packet capture).
- [ ] Run `./gradlew.bat :app:testDebugUnitTest` to completion on a build machine. *(Timed out at 120s in the authoring environment; not a pass/fail signal.)*
- [ ] Complete Play Store data-safety / privacy review with the release manifest + SDK list.

## 4) Web dashboard — verified here

- [ ] `cd web && npx vitest run` — tests pass.
- [ ] `cd web && npm run lint` — clean.
- [ ] `cd web && npx tsc -b --pretty false` — clean.
- [ ] `node scripts/build-web.js` — assets rebuilt/synced (`dist/` + `app/src/main/assets/web/`).
- [ ] Path A source scan: no `upi://` or QR generation in web source. **[Verified here]**

## 5) P1/P2 before calling the product release-ready

- [ ] Recurring/scheduled payments (one-time planned payments only today) — scoped design required before implementation.
- [ ] Encrypted/automatic backups (manual JSON only; unencrypted).
- [ ] GPL-3.0 attribution + terms/support/deletion-contact links.
