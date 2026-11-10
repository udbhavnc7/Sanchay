# Android Identity and Signing

**Plan:** `SANCHAY_COMPLETION_MASTER_PLAN.md` §3.5
**Audited:** 10 November 2026 against `app/build.gradle.kts`, `app/src/main/AndroidManifest.xml`, tracked files and `.gitignore`.

## Package identity (current)

| Item | Value |
|---|---|
| `applicationId` | `com.ivy.wallet` (`app/build.gradle.kts:18`) |
| `namespace` | `com.ivy.wallet` (`:14`) |
| Debug applicationId | `com.ivy.wallet.debug` (`applicationIdSuffix = ".debug"`) |
| Demo applicationId | `com.ivy.wallet.debug` (debug-signed, minified) |
| Release applicationId | `com.ivy.wallet` (no suffix) |
| Deep links | **none** — no `http/https/custom-scheme` intent-filters; only launcher |
| Custom intent action | `ivy.wallet.intent.action.add_transaction` declared in manifest — **no handler found in code** (dead filter; remove or implement before release) |
| Other exported components | 3 app-widget receivers, `PaymentTileService` (QS tile), app-shortcuts meta-data |

## Decision: package ID before first public release — **OPEN, recommendation below**

No Play listing or publicly distributed APK exists yet, so there is **no upgrade-continuity obligation** (plan §3.5, third bullet). However `com.ivy.wallet` is the upstream Ivy Wallet identity:

- It collides with the upstream Ivy Wallet brand/listing if both ever publish (Play rejects same-ID/different-signature apps).
- The plan requires Sanchay branding to stay distinct from Ivy Apps (§11.3).

**Recommendation:** pick a Sanchay-owned ID (e.g. `app.sanchay`) *before* the first public release, then migrate consistently:

1. `applicationId` + `namespace` in `app/build.gradle.kts`.
2. Manifest authorities using `${applicationId}` (e.g. `InitializationProvider`) — already templated, verify.
3. Widget providers, QS tile, shortcuts — verify no hard-coded `com.ivy.wallet` strings.
4. `google-services.json` `package_name` entries (currently `com.ivy.wallet*`) — regenerate for the new ID or remove Firebase entirely (see below).
5. Hilt/WorkManager manifests if any hard-code the ID.
6. Keep `com.ivy.wallet.debug` semantics (suffix moves with the base ID) so test installs stay separate from production.

Do **not** rename casually after any public install base exists.

## Signing

| Config | Keystore | Passwords | Tracked in git? | Use |
|---|---|---|---|---|
| `debug` | `../debug.jks`, alias `debug` | **hard-coded in `build.gradle.kts` (`IVY7834!DEbug`)** | **yes** (`debug.jks`, 2.5 KB) | debug + **demo** flavors |
| `release` | `../sign.jks` | env only: `SIGNING_STORE_PASSWORD` / `SIGNING_KEY_ALIAS` / `SIGNING_KEY_PASSWORD` | **no — file absent from the repo and working tree** | release flavor only |

Findings and rules:

1. **The committed `debug.jks` + hard-coded password is the only credential in the tree.** It is a standard Android debug keystore (inherited from Ivy Wallet). Risk is limited to anyone producing `*.debug`-signed builds — acceptable for an open-source pre-release, **never acceptable as the production identity**. Do not reuse it for release; consider rotating at Play-listing time.
2. **`sign.jks` must never be committed.** `.gitignore` currently has the keystore ignore-lines **commented out** — the file is absent only by discipline. Fixed this session: `*.jks` / `*.keystore` are now ignored (tracked `debug.jks` stays tracked).
3. **Release signing is private and env-driven** — correct pattern (plan: do not ship a debug-signed production APK). The demo APK used for verification is intentionally debug-signed + R8-minified (`com.ivy.wallet.debug`) and must be labeled as a test build.
4. No service-account keys, API secrets or private credentials were found in tracked files (repo-wide secret scan, this session: clean; the debug password above is the deliberate exception, documented here).

## Firebase / network identity

- `com.google.gms.google-services` plugin is applied and `app/google-services.json` is **tracked** (project/client config, not a secret by convention).
- Whether Firebase actually performs runtime calls in the release APK is **unverified** (plan 7.2 runtime network audit on a clean device). Until that audit: do not claim "no network" in the Privacy Policy or Data safety form; consider removing the plugin if the audit shows zero Firebase usage.

## Inherited release pipeline (`.github/workflows/internal_release.yml`)

The dormant Ivy Wallet release workflow is still present. Facts:

- **Signing pattern is correct:** `secrets.SIGNING_KEYSTORE` (base64) is decoded to `sign.jks` at build time; alias/passwords come from `SIGNING_KEY_ALIAS` / `SIGNING_KEY_PASSWORD` / `SIGNING_STORE_PASSWORD` secrets. Nothing sensitive is stored in the repo.
- **Gated:** jobs run only when the head commit message contains `Automatic release` **and** the author is `github-actions[bot]` — it cannot fire from ordinary pushes.
- **Identity defects to fix before any Sanchay release (plan §11):**
  1. Artifacts are named `Ivy-Wallet-Demo.apk` / `Ivy Wallet <tag>` — must become Sanchay.
  2. A hardcoded **Telegram chat id** receives every release APK via `BOTFATHER_TELEGRAM_BOT_TOKEN` — an inherited third-party side channel; remove or re-point (and cover in the privacy/Data-safety review).
  3. Play upload uses `GOOGLE_PLAY_CONSOLE_JSON` — must be the **Sanchay** Play service account, not Ivy's.
  4. `java-version: '18'` (EOL) — bump to the toolchain LTS used locally (21) when reviving this workflow.
- The referenced secrets almost certainly do not exist in this fork yet; the workflow is effectively dead until deliberately revived.

## Update strategy (before publication)

1. Decide the package ID (above) and freeze it.
2. Create the upload keystore (`sign.jks`), store it outside git + in the maintainer's password manager; wire CI/release via the existing env vars.
3. Keep demo (`*.debug`) as the public test track identity; production must be release-signed with the frozen key.
4. Record the final values here and in `docs/release-readiness-checklist.md`.

## Deliverable status

- [x] Actual `applicationId`, namespace, manifest components, deep links and signing setup inspected (this file).
- [x] No production signing key, service-account key or API secret committed (debug keystore disclosed above).
- [ ] Final package ID chosen — **open decision, recommendation recorded**.
- [ ] Release-signing runbook executed once with the real upload key (blocked: key generation by maintainer).
