# Sanchay — Privacy policy (DRAFT)

Status: **draft for maintainer review — not yet published.** Created 2026-11-08 to satisfy the
"public privacy policy" work item (`SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` §7 item 201 and
[release checklist](release-checklist.md) §1). Every statement below is grounded in
[data-flow-inventory.md](data-flow-inventory.md); re-verify that inventory if behaviour changes.

Before publishing, the maintainer must fill in every `[TODO]` and host this document at a public
HTTPS URL, then link that URL in the Google Play listing, the README, and the in-app privacy panel.

---

**Effective date:** `[TODO: publication date]`
**Contact:** `[TODO: name or entity, email address for privacy questions, data-deletion requests
and complaints]`

## Who collects what

Sanchay is a local-first personal-finance dashboard. The short version: **your financial data stays
on your device.** There is no user account, no login, and no server that receives your accounts,
transactions, payees, budgets, goals or notes.

### Data stored on your device (never uploaded by the dashboard)

Stored in the app's private WebView `localStorage` (key `sanchay.local.v1`):

- Accounts (name, type, currency, balance)
- Transactions (title, category, amount, date, status, your notes/references)
- Payees/contacts (name, handle/UPI id, bank label)
- Savings goals, budgets, planned (one-time) payments
- Payment-assistance attempts you create (recipient UPI id, amount, note, status)
- Preferences: theme, sound, card-frozen flag, profile name/email you type, optional safe-to-spend
  buffer, optional 4-digit app-lock PIN

Purpose: to show you your own data and compute your balances, reports and safe-to-spend estimate.
Processing is entirely local — search, reports, receipts and exports are generated on the device.

### Data that can leave your device (non-financial)

| What | Where | When | Why |
|---|---|---|---|
| App-generated random identifier (UUID) + your poll choice + server timestamp | Google Firestore (project configured in `app/google-services.json`) | Only if you tap Vote on the native poll screen (not reachable from the current dashboard UI) | Poll tallying. No financial data, phone number, email or hardware id is included |
| Plain HTTP GET requests (no payload) | `currency-api.pages.dev`, `cdn.jsdelivr.net`, `api.github.com` | Only from dormant native screens (exchange-rate refresh, contributors/releases) not reachable from the current dashboard UI | Display public FX rates and repository metadata |
| Your chosen URL | Your device's browser (Android intent) | When you tap a Play Store / GitHub / help link | Open the link outside the app |

The dashboard itself performs **no** network requests: no `fetch`, XHR, WebSocket or beacon exists
in its source (inventory §2), and the WebView blocks every host except the local `sanchay.local`
served from bundled assets (inventory §4).

### Files you export

JSON backups, CSV exports and receipts are written only to local storage (`Downloads/Sanchay` on
Android, browser downloads elsewhere). **Backups are not encrypted** — anyone with the file can
read it. Your app-lock PIN is never included in an export and is never taken from an imported
backup. Store exports carefully and delete them when you no longer need them.

## Third parties / SDKs in the app

- **Google Firebase Firestore** (Google Ireland Limited) — poll votes only (table above). Required
  by the app's Google Services configuration.
- **Google Play services** (transitive, via Firestore) — transport for the Firestore SDK.
- **Ktor (OkHttp)** HTTP client — dormant FX/repository fetches (table above).
- No analytics, advertising, attribution, crash-reporting or session-replay SDK is included;
  Firebase Crashlytics was removed on 2026-11-08.

## Retention and deletion

- On-device dashboard data: kept until you delete it. Reset it any time via Privacy panel →
  "Reset local data", or remove everything at once with Android Settings → Apps → Sanchay →
  Storage → Clear data. The app is excluded from Android cloud backup (`allowBackup="false"`), so
  no server-side copy exists.
- Poll votes: retained on Google Firestore until `[TODO: retention decision, e.g. "removed on the
  maintainer's schedule" or "indefinitely"]`. Request deletion via the contact address above.
- Exported files: under your control; delete them with your file manager.
- Logs: release builds emit no app logs (debug-only Timber); nothing financial is logged.

## Legal basis / who is responsible

`[TODO: maintainer identity as required for Play's data-safety and privacy requirements: name or
registered entity, country/region, and the complaint/contact process — e.g. "Requests are
answered within 30 days at [email]".]`

This app does not target children and does not knowingly collect data from children.

## Changes

Material changes will be reflected in this document with a new effective date and announced in
the app's release notes.

## Source and license

Sanchay is a GPL-3.0 fork of Ivy Wallet (Ivy Apps). This policy covers the Sanchay build only.
See the README for the "Changes since the fork" list.
