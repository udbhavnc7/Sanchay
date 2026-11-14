# Android Identity and Signing

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` §3.5
**Audited:** 10 November 2026 against `app/build.gradle.kts`, `app/src/main/AndroidManifest.xml`, tracked files and `.gitignore`.
**Package ID frozen:** 12 November 2026 — `app.sanchay` (see decision below).

## Package identity (current)

| Item | Value |
|---|---|
| `applicationId` | `app.sanchay` (`app/build.gradle.kts:18`) |
| `namespace` | `app.sanchay` (`:14`) |
| Debug applicationId | `app.sanchay.debug` (`applicationIdSuffix = ".debug"`) |
| Demo applicationId | `app.sanchay.debug` (debug-signed, minified) |
| Release applicationId | `app.sanchay` (no suffix) |
| Kotlin source packages | unchanged (`com.ivy.wallet.*`, `com.ivy.*` modules) — namespace ≠ source package is supported; manifest components are fully-qualified |
| Deep links | **none** — no `http/https/custom-scheme` intent-filters; only launcher |
| Custom intent action | `ivy.wallet.intent.action.add_transaction` declared in manifest — **no handler found in code** (dead filter; remove or implement before release) |
| Other exported components | 3 app-widget receivers, `PaymentTileService` (QS tile), app-shortcuts meta-data |

## Decision: package ID frozen — **`app.sanchay`** (12 Nov 2026)

No Play listing or publicly distributed APK exists yet, so there is **no upgrade-continuity obligation** (plan §3.5, third bullet). `com.ivy.wallet` was the upstream Ivy Wallet identity, which would collide with the upstream listing and violate the Sanchay branding requirement (§11.3). The Sanchay-owned ID is now `app.sanchay`; it must not change after the first public install.

Migration performed (12 Nov 2026):

1. `applicationId` + `namespace` in `app/build.gradle.kts`.
2. `app/src/main/AndroidManifest.xml` — removed the deprecated `package` attribute (AGP 8 uses `namespace`) and fully-qualified the app components (`com.ivy.wallet.IvyAndroidApp`, `com.ivy.wallet.RootActivity`, `com.ivy.wallet.PaymentTileService`) so relative names cannot resolve against the new namespace.
3. `import app.sanchay.BuildConfig` added/replaced in `RootActivity.kt`, `IvyAndroidApp.kt`, `SanchayModernUI.kt` (source packages stay `com.ivy.wallet`).
4. `google-services.json` — both `package_name` and `android_info.package_name` for the debug and release clients changed to `app.sanchay.debug` / `app.sanchay`.
5. `scripts/device-verify.ps1` default `-Package` changed to `app.sanchay.debug` (runbook updated too).
6. Manifest authorities using `${applicationId}` stay templated — now resolve under `app.sanchay*`. Widget/QS/shortcut component class names are unchanged (`com.ivy.*` modules).
7. `.debug` semantics preserved: debug/demo installs are `app.sanchay.debug`, production is `app.sanchay`.

Verification (12 Nov 2026):

```
.\gradlew.bat :app:assembleDemo --no-daemon --max-workers=2   # BUILD SUCCESSFUL
aapt2 dump badging app\build\outputs\apk\demo\app-demo.apk
  package: name='app.sanchay.debug' versionCode='206' ...
  application-label:'Sanchay'
  launchable-activity: name='com.ivy.wallet.RootActivity'
```

Caveats:

- The old `com.ivy.wallet.debug` install is a **different app**; its WebView localStorage does not carry over. Safe today because no public installs exist — uninstall the old debug build when switching test devices.
- `google-services.json` is the checked-in Firebase config. The Firebase console project must register `app.sanchay` / `app.sanchay.debug` before any Firebase feature is relied on; no runtime Firebase use is confirmed (see network audit below).
- Kotlin/package names remain `com.ivy.wallet`; this is intentional to avoid a mass rename. Only the install/namespace identity changed.

## Signing

| Config | Keystore | Passwords | Tracked in git? | Use |
|---|---|---|---|---|
| `debug` | `../debug.jks`, alias `debug` | **hard-coded in `build.gradle.kts` (`IVY7834!DEbug`)** | **yes** (`debug.jks`, 2.5 KB) | debug + **demo** flavors |
| `release` | `../sign.jks` | env only: `SIGNING_STORE_PASSWORD` / `SIGNING_KEY_ALIAS` / `SIGNING_KEY_PASSWORD` | **no — file absent from the repo and working tree** | release flavor only |

Findings and rules:

1. **The committed `debug.jks` + hard-coded password is the only credential in the tree.** It is a standard Android debug keystore (inherited from Ivy Wallet). Risk is limited to anyone producing `*.debug`-signed builds — acceptable for an open-source pre-release, **never acceptable as the production identity**. Do not reuse it for release; consider rotating at Play-listing time.
2. **`sign.jks` must never be committed.** `.gitignore` currently has the keystore ignore-lines **commented out** — the file is absent only by discipline. Fixed this session: `*.jks` / `*.keystore` are now ignored (tracked `debug.jks` stays tracked).
3. **Release signing is private and env-driven** — correct pattern (plan: do not ship a debug-signed production APK). The demo APK used for verification is intentionally debug-signed + R8-minified (`app.sanchay.debug`) and must be labeled as a test build.
4. No service-account keys, API secrets or private credentials were found in tracked files (repo-wide secret scan, this session: clean; the debug password above is the deliberate exception, documented here).

## Firebase / network identity

- `com.google.gms.google-services` plugin is applied and `app/google-services.json` is **tracked** (project/client config, not a secret by convention).
- Whether Firebase actually performs runtime calls in the release APK is **unverified** (plan 7.2 runtime network audit on a clean device). Until that audit: do not claim "no network" in the Privacy Policy or Data safety form; consider removing the plugin if the audit shows zero Firebase usage.

## Sanchay release pipeline (`.github/workflows/internal_release.yml`)

The inherited Ivy Wallet workflow was rewritten on 14 Nov 2026:

- **Manual gate:** `workflow_dispatch` only, with `confirm_package` (must equal `app.sanchay`) and `publish` inputs. Ordinary pushes cannot trigger a store upload.
- **Signing pattern is unchanged and correct:** `secrets.SIGNING_KEYSTORE` (base64) is decoded to `sign.jks` at build time; alias/passwords come from `SIGNING_KEY_ALIAS` / `SIGNING_KEY_PASSWORD` / `SIGNING_STORE_PASSWORD`. Nothing sensitive is stored in the repo. Missing credentials fail the job before a build.
- **Fixed identity defects:** artifacts are named `Sanchay-Demo.apk` / `Sanchay-release.aab` / `Sanchay <tag>`; the Telegram bot side channel was removed; Play upload expects the Sanchay service account (`GOOGLE_PLAY_CONSOLE_JSON` / `google-play-console-user.json`) and targets package `app.sanchay`, track `internal`, `release_status: draft`, with metadata/changelog uploads skipped.
- **Toolchain:** Java 21 Temurin, pnpm 10.34.3, Node 22; the web bundle is rebuilt and synced before Gradle.
- `automatic_release.yml` is now an explicit **Version bump PR** workflow, not an automatic store release.
- The referenced secrets do not exist in this fork yet; publishing remains blocked until the maintainer provisions the keystore and service account.

## Update strategy (before publication)

1. ~~Decide the package ID (above) and freeze it.~~ **Done 12 Nov 2026: `app.sanchay`.**
2. Create the upload keystore (`sign.jks`), store it outside git + in the maintainer's password manager; wire CI/release via the existing env vars.
3. Keep demo (`*.debug`) as the public test track identity; production must be release-signed with the frozen key.
4. Record the final values here and in `docs/release-readiness-checklist.md`.

## Deliverable status

- [x] Actual `applicationId`, namespace, manifest components, deep links and signing setup inspected (this file).
- [x] No production signing key, service-account key or API secret committed (debug keystore disclosed above).
- [x] Final package ID chosen and frozen — **`app.sanchay`** (namespace + applicationId migrated 12 Nov 2026; demo APK verified as `app.sanchay.debug`).
- [ ] Release-signing runbook executed once with the real upload key (blocked: key generation by maintainer).
