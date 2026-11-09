# Sanchay — Physical device verification runbook

Purpose: execute every item of [release checklist](release-checklist.md) §3 (and the device-only
rows of [data-flow-inventory](data-flow-inventory.md) §11) on a real device, capturing evidence.
Created 2026-11-09. Companion helper: `scripts/device-verify.ps1` (Windows/PowerShell; adb in
`PATH`).

## 0. Which APK?

| Purpose | Build | Package id | Signing |
|---|---|---|---|
| Behaviour, persistence, offline, backup tests (iterative) | `./gradlew assembleDemo` → `app/build/outputs/apk/demo/app-demo.apk` | `com.ivy.wallet.debug` | debug keystore (checked in) |
| Final gate (release config, minified, no debug logs) | `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release-unsigned.apk` **then sign** | `com.ivy.wallet` | needs `sign.jks` + `SIGNING_STORE_PASSWORD`/`SIGNING_KEY_ALIAS`/`SIGNING_KEY_PASSWORD` env vars (`app/build.gradle.kts:37–42`); or install the Play-internal-testing build |

Run the full checklist on the **release** build; the demo build is fine for iterating on steps.
Evidence goes to `device-evidence/` (git-ignored): screenshots, `package-info.txt`, `logcat.txt`,
netstats deltas, notes.

## 1. Automated subset (run first)

```powershell
.\scripts\device-verify.ps1 -Apk app\build\outputs\apk\demo\app-demo.apk -Package com.ivy.wallet.debug
```

The script: installs the APK, dumps `dumpsys package` (asserts **no location/SMS/call-log
permissions**), launches `RootActivity`, waits, captures a screenshot and a logcat dump, and
prints a permission assertion result. Release build: `-Package com.ivy.wallet`.

## 2. Manual steps (map to checklist §3)

**42 — Install the release APK on a physical device** (not emulator only).
Use a device on a supported Android version; ideally also one Android 10 device for the
scoped-storage step below. Record model + OS version in `device-evidence/notes.md`.

**43 — Dashboard loads from bundled assets; no remote fetch.**
1. Enable airplane mode.
2. Cold-start the app; dashboard must render fully (logo, tabs, numbers).
3. Connect Chrome DevTools → `chrome://inspect` → inspect the WebView → Network panel:
   confirm **only** `sanchay.local` requests (assets) and **zero** third-party requests.

**44 — Persistence + data-loss behaviour matches README.**
1. Add a transaction; force-stop the app (`adb shell am force-stop com.ivy.wallet.debug`);
   relaunch → transaction still there.
2. In-app: Privacy panel → "Reset local data" (two-step) → back to demo data, PIN cleared.
3. OS-level: Settings → Apps → Sanchay → Storage → **Clear data** → relaunch → app reseeds
   demo data; README's "data can be lost if Android clears WebView storage" claim confirmed.

**45 — Backup export/import round-trip on-device.**
1. Export backup (privacy panel) → file lands in `Downloads/Sanchay` (bridge). Pull it:
   `adb pull /storage/emulated/0/Downloads/Sanchay .`
2. Wipe/reset the app, import the file via the system picker → counts match
   (accounts/transactions/payees/…); **app-lock PIN is NOT restored** (by design).
3. Sanity: file is plaintext JSON (expected until the encrypted-backup design ships).

**46 — No network traffic for dashboard-only flows.**
1. Baseline: `adb shell dumpsys netstats --uid <appUid>` (get uid via
   `adb shell dumpsys package com.ivy.wallet.debug | findstr userId`) → save.
2. Airplane mode ON; exercise dashboard flows 5–10 min (add/edit/report/export/reset).
3. Airplane mode OFF (Wi-Fi only, no mobile data); repeat; then re-read netstats — the app UID
   must show no meaningful RX/TX delta beyond negligible Android background noise; any Firestore/
   Ktor hit fails this item (those paths are supposed to be unreachable from the UI).
4. Optional stronger evidence: host-side Wi-Fi capture (Wireshark/tcpdump) filtered to the
   device IP during the session.

**47 — Unit tests** — already satisfied statically (`:app:testDebugUnitTest` BUILD SUCCESSFUL /
NO-SOURCE); re-run if the device session follows new code changes.

**48 — Play data-safety / privacy review with the release manifest + SDK list** — use
[play-submission-drafts.md](play-submission-drafts.md) §1 against the *installed* build's
manifest: `adb shell dumpsys package com.ivy.wallet | findstr permission` must match inventory
§8 exactly (no surprises).

**Inventory §10 rows (fold into the same session):**
- Scoped storage: on the Android 10 device, export CSV/backup via the legacy path
  (`WRITE_EXTERNAL_STORAGE` maxSdk 28 + `requestLegacyExternalStorage`); on Android 13/14,
  confirm MediaStore path (`Downloads/Sanchay`) with no storage permission prompt beyond the
  system picker on import.
- Permission prompts: fresh install → record every runtime prompt shown (expected: notifications
  only, when a reminder feature fires; no storage prompt on 13+; none for location — none exists).

## 3. Pass criteria

Every §3 checklist box ticked with a pointer to the evidence file; any failure → file an issue
with the evidence and **do not submit** until resolved (checklist is a gate, not a suggestion).
