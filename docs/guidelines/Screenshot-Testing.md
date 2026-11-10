# Screenshot testing (Paparazzi)

Paparazzi renders `@Composable` functions to PNGs on the JVM (no emulator or device) and compares them against committed golden images to catch visual regressions. Sanchay uses **Paparazzi 1.3.3** (`gradle/libs.versions.toml`), with 17 screenshot test classes across `feature/*` and `shared/*`.

## How a test looks

```kotlin
@RunWith(TestParameterInjector::class)
class DisclaimerScreenPaparazziTest(
    @TestParameter private val theme: PaparazziTheme,
) : PaparazziScreenshotTest() {

    @Test
    fun `none checked`() {
        snapshot(theme) {
            DisclaimerScreenUi(
                viewState = DisclaimerViewState(...),
                onEvent = {},
            )
        }
    }
}
```

- Extend `PaparazziScreenshotTest` (from `shared/ui/testing`) and call `snapshot(theme) { ... }`.
- Parameterise `PaparazziTheme` (Light/Dark) with `TestParameterInjector` so each screen is captured in both themes.
- **Use static data only.** Current time, dates, random ids or animated values make goldens flaky — seed deterministic fixtures instead.

## Goldens

Stored per module at:

```
<module>/src/test/snapshots/images/<TestClass>_<test name>[Light|Dark].png
```

Commit goldens together with the UI change that produced them.

## Commands

| Command | What it does |
|---|---|
| `./gradlew verifyPaparazziDebug` | Renders and diffs every screenshot against the goldens (fails on any delta) |
| `./gradlew :<module>:recordPaparazziDebug` | Re-records that module's goldens — only for **intentional** UI changes |
| `./scripts/paparazziScreenshotTests.sh` | Repo-root wrapper that runs `verifyPaparazziDebug` |

CI runs verification on every push/PR in `.github/workflows/paparazzi_screenshot_test.yml` (`ubuntu-latest`).

## ⚠️ Platform rendering differences (read before re-recording)

Golden images are rendered with Linux font rasterisation in CI. **Windows renders fonts with different antialiasing**, which can produce sub-pixel diffs (~0.1% of pixels) on text-heavy screens — for example `DisclaimerScreenPaparazziTest` and `OpenSourceCardPaparazziTest` fail locally on Windows while passing in CI.

**Rule: never re-record goldens on Windows.** Re-recording there would bake Windows rendering into the committed images and break the Linux CI job. If `verifyPaparazziDebug` fails only on your Windows machine:

1. Confirm the same test passes in CI (or on Linux).
2. Treat CI as the source of truth; do not touch the goldens.
3. If CI also fails, the delta is a real visual regression — fix the UI, or re-record intentionally on Linux/CI.

See also the [Paparazzi Tests section of CI-Troubleshooting](../CI-Troubleshooting.md#paparazzi-tests).
