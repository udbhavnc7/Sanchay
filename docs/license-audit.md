# License Audit (static inventory)

**Date:** 11 November 2026  
**Scope:** repository code, web dashboard dependencies, Android dependency families, bundled/remote assets.  
**Method:** static inspection of `LICENSE`, `web/package.json`, installed `node_modules/*/package.json` license fields, `web/index.html`, and Gradle version catalog. No legal advice; this is an engineering inventory for the release checklist (plan 14, item 1095).

## 1. Project license

- Sanchay is distributed under **GNU GPL-3.0** (root `LICENSE`).
- The Android shell is inherited from the open-source **Ivy Wallet** project (also GPL-3.0); upstream attribution remains in the repository.

**Implication:** any distributed APK or hosted dashboard must keep the GPL-3.0 terms, source availability, and attribution. Web dependencies must remain GPL-compatible (all listed below are).

## 2. Web dashboard dependencies (`web/package.json`)

| Package | Version | License |
|---|---|---|
| react / react-dom | 19.3.1 | MIT |
| three | 0.186.1 | MIT |
| lucide-react | 1.61.0 | ISC |
| canvas-confetti | 1.9.4 | ISC |
| @designcodeio/threeui | 1.2.0 | MIT |
| tailwindcss / @tailwindcss/vite | 4.3.3 | MIT |
| vite | 8.3.4 | MIT |
| vitest | 5.0.5 | MIT |
| typescript | 6.0.3 | Apache-2.0 |
| oxlint | 1.88.0 | MIT |
| @vitejs/plugin-react | 6.1.2 | MIT |
| @types/* | - | MIT (type definitions only) |

All are permissive (MIT/ISC/Apache-2.0) and compatible with GPL-3.0 distribution. License files are present in each installed package.

## 3. Android / Kotlin dependencies

The app depends on Apache-2.0 and MIT-licensed families: AndroidX, Jetpack Compose, Kotlin/Coroutines, Hilt/Dagger, Room, Ktor (client + OkHttp engine), Timber, Material Components, Accompanist, and Firebase Firestore SDK artifacts.

Notes:
- Firebase **Crashlytics was removed**; no analytics/ad/attribution SDKs remain (see `docs/data-flow-inventory.md` section 6).
- Firebase Firestore SDK transitively includes Google/Tink components (Apache-2.0 / BSD-style) that are compatible with GPL-3.0.
- No dependency was found with a non-commercial, source-available, or unknown license in the release runtime classpath review recorded in the data-flow inventory.

## 4. Fonts and assets

- App icons, logos, and other visual assets are part of this repository (`app/src/main/res`, `app/src/main/assets/web`).
- `web/index.html` loads **JetBrains Mono**, **Plus Jakarta Sans**, and **Syne** from `fonts.googleapis.com` at runtime. These families are distributed under the **SIL Open Font License 1.1 (OFL-1.1)**, which permits web embedding.
  - No font binaries are vendored in the repo, so no font license file is currently shipped.
  - On Android, the WebView blocks non-`sanchay.local` requests, so these remote fonts do not load; the UI falls back to system fonts.
  - Before store publication, either (a) self-host the OFL font files and include the OFL license text, or (b) document the runtime dependency in the privacy policy. Self-hosting also removes the last desktop-side remote asset request.

## 5. Findings and recommendations

1. **Compatible overall** - project GPL-3.0 + permissive dependencies; no conflicting copyleft obligations from third-party libraries.
2. **Font licensing gap** - remote Google Fonts are OFL-1.1; ship the license text if fonts are bundled later.
3. **Attribution** - keep the upstream Ivy Wallet GPL-3.0 notices and the dependency license files accessible in the distributed source.
4. **External legal sign-off** - this inventory supports, but does not replace, the release checklist's legal review.

## 6. Reproduce

```powershell
# Web dependency licenses
Get-ChildItem web/node_modules -Depth 1 -Filter package.json |
  ForEach-Object { (Get-Content $_.FullName -Raw | ConvertFrom-Json) } |
  Select-Object name, version, license

# Root license
Get-Content LICENSE -TotalCount 3

# Remote asset references
Select-String -Path web/index.html -Pattern 'https://'
```
