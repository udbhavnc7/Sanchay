# Sanchay - Personal Finance Manager

<p align="center">
  <strong>Simple. Private. Your Money, Your Way.</strong>
</p>

Sanchay (संचय) means **saving, accumulation, or the gathering of wealth**.

Sanchay is an open-source Android personal finance project focused on simple, local-first money management. It is an early-stage fork of Ivy Wallet with a custom React dashboard running inside an Android WebView shell.

> **Project status:** early development. The dashboard uses seeded demo data and local browser storage. It is not a production banking or accounting application.

---

## What is implemented today

### Transactions

- Add income or expense transactions from Overview or Activity.
- Start from up to three recent matching transactions to prefill account, amount, category, and description.
- Get an explainable category suggestion from earlier titles or payees, showing the match count and source.
- Record amount, active INR account, category, date, and an optional note.
- Account balances update immediately, with an 8-second Undo action.
- Edit a transaction's amount, category, account, date, and note; affected balances are recalculated.
- Delete a completed transaction with a balance warning and an 8-second Undo action.
- Goal deposits are linked to their goal so deleting or restoring them adjusts goal progress.
- Future-dated quick-add transactions are rejected.
- Search transactions and filter by status, category, or direction.
- Open a transaction to view its details, edit or delete it, and copy a receipt.

### Accounts and cards

- View account type, currency, balance, and status.
- Freeze or unfreeze the card presentation state.
- Preference state is saved locally.

### Budgets and goals

- View monthly budgets and spending progress.
- Adjust category budget limits.
- Create savings goals with a target amount, target month, icon, and color.
- Deposit money into a goal from an active INR account.
- View goal progress and amounts still needed.
- See the equal monthly amount implied by each goal's remaining balance and target month.
- Edit a goal's name, target, date, icon, or colour and see the pace recalculate.
- Add one-time planned payments with a title, amount, direction, due date, category, and optional account.
- See a 30-day safe-to-spend estimate after remaining budgets, goal pace, planned outflows, and planned inflows. Overdue outflows stay in the estimate until you delete them.
- Review the planned payments behind the estimate; planned entries never change the ledger or account balances.

### Payees and payments (Path A payment assistance)

- Add payees with a currency, optional UPI ID, and account reference.
- Mark payees as favorites for quick access.
- Safe external payment assistance: copy payee UPI ID (flagged as user-entered and not verified by Sanchay) and payment details for manual entry into your external UPI app.
- Sanchay does **not** move money, connect to the UPI network, generate `upi://pay` deep links, or generate QR codes in Path A.
- Local reconciliation lifecycle with explicit states (`prepared`, `needs_reconciliation`, `marked_paid_by_user`, `cancelled_or_failed`).
- Confirming an attempt records a local ledger expense explicitly labeled **"Marked paid by you — not verified by Sanchay"** with optional user-entered UTR/reference, protected against duplicate confirmations.
- Unresolved payment attempts remain visible in a dedicated queue for later reconciliation.
- Request money helper generates plain text payment request messages to share; it does not issue UPI Collect requests.

### Reports

- View cash-flow and category summaries calculated from local transactions.
- Compare month-to-date spending and income with the same days last month, including the largest category changes.
- Open a category change to see the current-month payments behind it and jump into a transaction.
- Export the transaction list as a CSV file.

### Privacy and preferences

- Light and dark themes.
- Sound on/off preference.
- Privacy panel that explains local storage, exports a JSON backup, imports a backup, and offers a two-step reset to demo data.
- Backups include accounts, transactions, payees, goals, budgets, planned payments, and preferences.
- Restoring a backup replaces the current data on this device after a confirmation preview.
- On Android, exports and receipt/CSV downloads are written to `Downloads/Sanchay` through a native bridge, and imports use the system file picker.
- In a desktop browser, exports use normal browser downloads.
- All dashboard data is stored in the WebView's `localStorage` under `sanchay.local.v1`.
- Nothing is uploaded or synced by the dashboard.

---

## Current limitations

- Categories are fixed; custom category management is not implemented.
- Recent quick-fill is inferred from local transaction history; saved custom templates are not implemented.
- Category suggestions use simple local text matching and only change the category when the user taps Use.
- Goal monthly-pace figures assume equal contributions and do not schedule or move money automatically.
- Quick-add, goal deposits, and transaction editing currently require an active INR account, except that an existing transaction on a now-inactive INR account can still be edited.
- USD, EUR, GBP, and JPY accounts appear in seed/display data, but full multi-currency entry and conversion are incomplete.
- Planned payments are one-time estimates; recurring schedules, automatic occurrence generation, and bill reminders are not implemented.
- Safe-to-spend is a deterministic 30-day estimate using remaining budgets, goal pace, overdue outflows, and entered planned payments. It does not predict income beyond entered planned inflows, guarantee a balance, or include a user-defined buffer yet.
- Loans, bank sync, automatic cloud backups, and cloud sync are not connected to the dashboard.
- Backups are manual JSON files and are not encrypted; import only accepts backups with the current storage version.
- The native Ivy Wallet Compose/Room modules remain in the repository, but the visible Sanchay dashboard is not wired to that native ledger.
- The dashboard has been tested in a desktop browser and emulated mobile viewports, but not yet verified on a physical Android device.
- UPI / Bank integration: Operates under Path A (payment assistance and local ledger reconciliation only). Sanchay does not connect to bank or UPI networks, does not verify bank settlement or UTRs, and does not initiate fund transfers.
- Data can be lost if Android clears WebView storage or the app's data.

---

## Tech stack

### Visible dashboard

- React 19
- TypeScript
- Vite
- Plain CSS
- Lucide icons
- Vitest
- WebView-hosted static assets

### Android shell and inherited modules

- Kotlin
- Jetpack Compose
- Hilt
- Kotlin Coroutines and Flow
- Room and DataStore in native modules
- Gradle Kotlin DSL

Some inherited Ivy Wallet features are present in the repository but are not currently reachable from the Sanchay dashboard.

---

## Getting started

### Requirements

- Node.js and pnpm
- Java 17+
- Android Studio or the Android SDK
- A connected Android device or emulator for installation

### Run the web dashboard

```bash
cd web
pnpm install
pnpm dev
```

The development server prints its local URL.

### Test and build the dashboard

```bash
cd web
pnpm test
pnpm lint
pnpm build
```

The production files are written to `web/dist`. Copy them into `app/src/main/assets/web/` before building the Android app.

### Build the Android APK

```bash
./gradlew.bat :app:assembleDebug
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

The Android app loads the bundled dashboard from `https://sanchay.local/index.html` through a WebView.

---

## Data safety

This project is not a bank and does not move real money. The payment and request flows are demonstrations that write transactions to local storage.

Before relying on Sanchay for real records, verify behavior on your device, keep your own backups, and do not enter sensitive banking credentials.

---

## Why Sanchay?

Managing money should not require a spreadsheet or complicated financial software.

Sanchay aims to answer simple questions:

**How much money do I have?**

**Where did my money go this month?**

**How much can I safely spend?**

**Am I moving toward my financial goals?**

> **Understand your money. Build better habits. Grow your savings.**

---

## Roadmap

Planned areas include:

- On-device verification and Android storage hardening
- Recurring payment schedules and reminders
- Custom categories and account management
- Complete multi-currency handling
- Encrypted and automatic backup options
- Stronger reports and accessibility
- Connecting or retiring the inherited native Ivy Wallet ledger

Priorities may change as development continues.

---

## Based on Ivy Wallet

Sanchay is a customized fork of **Ivy Wallet**, an open-source Android money management application created by Ivy Apps and released under the **GNU General Public License v3.0 (GPL-3.0)**. The original repository was archived in April 2026.

Sanchay adds its own branding, dashboard, design changes, and local-first behavior.

Original project: https://github.com/Ivy-Apps/ivy-wallet

This project is not affiliated with or endorsed by Ivy Apps Ltd.

---

## Contributing

Contributions, suggestions, bug reports, and ideas are welcome.

1. Fork the repository.
2. Create a new branch.
3. Make focused changes.
4. Run the web tests and build.
5. Open a pull request.

---

## License

Sanchay is distributed under the **GNU General Public License v3.0 (GPL-3.0)**.

This project is based on Ivy Wallet and complies with the licensing requirements of the original project.

See [LICENSE](LICENSE) for the complete license text.
