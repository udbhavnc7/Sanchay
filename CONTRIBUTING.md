# Contributing to Sanchay

Sanchay is an independently maintained fork of **Ivy Wallet**. The original upstream project ([Ivy-Apps/ivy-wallet](https://github.com/Ivy-Apps/ivy-wallet)) was archived in April 2026 and is no longer maintained by its original developers; this repository continues the work under the same [GPL-3.0 license](LICENSE).

## 1. Fork the repo

Fork [udbhavnc7/Sanchay](https://github.com/udbhavnc7/Sanchay) and clone your fork.

**[Forking — GitHub tutorial](https://docs.github.com/en/get-started/quickstart/fork-a-repo)**

## 2. Pick or create an issue

1. Browse **[Sanchay issues](https://github.com/udbhavnc7/Sanchay/issues)**.
2. Open a new issue first for anything non-trivial so scope can be agreed before code lands.

### Contributing rules

1. Keep each PR focused on one concern.
2. Do not take over an issue someone else is actively working on.
3. Fix or unassign an issue you can no longer complete so others are not blocked.

## 3. Create a feature branch in your fork

```
git checkout -b fix-issue-{YOUR_ISSUE_NUMBER}
```

Replace `{YOUR_ISSUE_NUMBER}` with the ID/number of your issue.

## 4. Time to work

### ⚠️ Very important — read the [Developer Guidelines 🏗️](docs/Guidelines.md) before you begin.

### Checks to run before you push

- Web dashboard: `pnpm -C web test`, `pnpm -C web run lint`, `pnpm -C web exec tsc -b`
- Release compliance gate: `node scripts/check-release-compliance.mjs`
- Kotlin changes: `./gradlew.bat detekt` and `./gradlew.bat lintRelease`
- UI changes: `./gradlew.bat verifyPaparazziDebug` (see [Screenshot testing](docs/guidelines/Screenshot-Testing.md) — **never re-record goldens on Windows**)

### Workflow

- Build often and verify you haven't broken existing features.
- Keep changes simple; prefer the smallest diff that solves the problem.

## 5. Submit a pull request to `main`

Push your branch and [open a pull request](https://github.com/udbhavnc7/Sanchay/pulls) against the `main` branch of `udbhavnc7/Sanchay`.

- Follow the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).
- You are the QA: test behaviour changes on a device or emulator when you can.
- Path A rules are enforced in CI — no `upi://`/`intent://` links, QR generation, or scraping APIs (see the [release checklist](docs/release-checklist.md)).
