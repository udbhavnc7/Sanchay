# Troubleshooting CI failures

If you see any of the PR checks failing (❌) go to [Actions](https://github.com/udbhavnc7/Sanchay/actions) and find it there. Or simply click "Details" next to the failed check and explore the logs to see why it has failed.

## PR description check

It means that you didn't follow our [official PR template](../.github/PULL_REQUEST_TEMPLATE.md).
Update your PR description with all necessary information. You can also check the exact error by
clicking "Details" on the failing (❌) check.

## Detekt
[Detekt](https://detekt.dev/) is a static code analyzer for Kotlin that we use to enforce code readability and good practices.

**To run Detekt locally:**
```
./gradlew detekt
```

If the Detekt errors are caused by a legacy code, you can suppress them using a baseline.

**Suppress Detekt** (only if you're sure that Detekt is wrong)

Add `@Suppress("ID_OF_THE_CHECK")` to ignore the error on a single place. For example:
```kotlin
@Suppress("FunctionMaxLength")
fun veryVeryLongFunction() {
    // ...
}
```

**Detekt baseline** (not recommended)
```
./scripts/detektBaseline.sh
```

## Lint

We use the [standard Android Lint](https://developer.android.com/studio/write/lint) plus [Slack's compose-lints](https://slackhq.github.io/compose-lints/) as an addition to enforce proper Compose usage.

**To run Lint locally:**
```
./scripts/lint.sh
```

If the Lint errors are caused by a legacy code, you can suppress them using a baseline.

**Suppress Lint** (only if you're sure that Lint is wrong)

Same as suppressing Detekt, just add `@Suppress("ID_OF_CHECK")`.

**Lint baseline** (not recommended)
```
./scripts/lintBaseline.sh
```

## Unit tests

If this job is failing this means that your changes break an existing unit test. You must identify the failing tests and fix your code.

**To run the Unit tests locally:**
```
./gradlew testDebugUnitTest
```

## Compose Stability

This GitHub Action checks whether your `@Composable` functions are stable (i.e. "restartable" and "skippable"). If it fails it means that some of your composables are unstable. That causes unnecessary recompositions which can lead to lost frames and laggy UI/UX especially when animation or scrolling. You must fix that! To fix it, open the failing working and see the output from the report - it tells you which `@Composable` functions are unstable and what parameters cause that.

**Fixing Stability issues:**
1. Read https://developer.android.com/jetpack/compose/performance/stability/fix
2. https://developer.android.com/jetpack/compose/performance/stability

**Compose Stability baseline** (not recommended)
```
./scripts/composeStabilityBaseline.sh
```
Do that only if the failure is in legacy code. If the script is failing, open it and execute the commands inside it manually.


## Paparazzi Tests
Paparazzi is used for automated visual testing. It captures screenshots of various `@Composable` and then compares them against baseline images to detect any visual differences or regressions.

> **Windows caution:** local `verifyPaparazziDebug` runs can fail with tiny font/antialiasing pixel deltas that the Linux CI job does not see. **Never re-record goldens on Windows** — CI is the source of truth. See [Screenshot-Testing.md](guidelines/Screenshot-Testing.md).

**Fixing Paparazzi issues:**

1. Check the failed CI log for the specific tests and download the `failure`/`delta` PNGs from the job's `feature/<module>/build/paparazzi/` output. If CI passes and only your local Windows run fails, stop — nothing is broken.
2. Review the delta image to understand what actually changed. Stale goldens (for example after a rebranding) look like real text differences, not antialiasing noise.
3. If the change is intentional and reproducible on CI, run the **Record Paparazzi goldens** workflow (`record_paparazzi_goldens.yml`, `workflow_dispatch`) and download its `paparazzi-goldens` artifact.
4. Commit only the goldens that genuinely changed — diff the artifact against `src/test/snapshots/images/` first; the rest are usually byte-noise with identical pixels.
5. Push and confirm `paparazzi_screenshot_test.yml` is green. Never record goldens locally on Windows or macOS.

> **Note**: Ensure the use of static data only. Dynamic data, such as current time or date, will cause test failures due to its variability.