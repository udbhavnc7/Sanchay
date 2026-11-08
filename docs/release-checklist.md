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

Verified from `app/src/main/AndroidManifest.xml` and `app/build.gradle.kts`:

- [ ] Manifest declares: `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `SET_ALARM`, `WRITE_EXTERNAL_STORAGE` (maxSdk 28), `READ_EXTERNAL_STORAGE`, `VIBRATE`, `DISABLE_KEYGUARD`, `WAKE_LOCK`.
- [ ] `usesCleartextTraffic="true"` and `requestLegacyExternalStorage="true"` are set on `<application>`.
- [ ] Gradle applies Google Play Services + Firebase: `com.google.gms.google-services`, `com.google.firebase.crashlytics`, `libs.bundles.google`, `libs.bundles.firebase`.
- [ ] Bridge check: `SanchayFileBridge.kt` — no upload/network code found by static search (file/export/download only). **[Verified here]**

Release decisions required before Play submission (owner: maintainer):

- [ ] Decide whether `INTERNET`, location permissions, cleartext traffic, legacy storage, Firebase/Crashlytics, Play Services remain in release. Remove/disable anything not needed for the Sanchay dashboard; document removal in the manifest/build.
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
