# SANCHAY — Completion Master Plan

**Project:** Sanchay — Personal Finance Manager
**Repository:** https://github.com/udbhavnc7/Sanchay  
**Live web preview:** https://sanchay-raib.onrender.com/  
**Prepared:** 10 November 2026  
**Purpose:** A single implementation and release roadmap for bringing the existing Sanchay application to a reliable, feature-complete, Android-ready release.

---

## 0. Instructions to the coding agent

Treat this document as the master execution brief for the existing Sanchay codebase.

### Non-negotiable product direction

Sanchay remains a **local-first personal finance manager**. Improve and complete the product that already exists. Do not pivot it into a different product.

Preserve the current identity and core jobs:

1. Understand how much money the user has.
2. Record and understand where money comes from and where it goes.
3. Plan known upcoming expenses and income.
4. Understand how much can be safely spent based on entered information.
5. Manage budgets, savings goals, accounts, payees and payment records.
6. Keep personal financial data under the user's control.

Do not turn Sanchay into a bank, wallet, payment gateway, investment platform, lending marketplace, accounting suite, or AI chatbot. Do not require cloud accounts, cloud sync, or a backend for the core product.

### Before changing code

- Inspect the current branch, working tree, README, source tree, Gradle modules, web application, tests, build scripts, and existing design/compliance documents.
- Do not rely exclusively on this document or the previous Antigravity summary. Verify every claim against the current checkout.
- Classify each item as **implemented and verified**, **implemented but unverified**, **partial**, **missing**, **mock/simulated**, or **not applicable**.
- Map every change to the actual files and modules. Do not invent file paths.
- Preserve working functionality. Make small, reviewable changes with regression tests.
- Do not replace the app, rewrite the dashboard, delete inherited modules, migrate the database, or change the Android package ID without a documented decision and migration plan.
- If a requirement conflicts with the current UPI compliance specification, the UPI specification wins for payment behavior.

### Completion is evidence-based

A feature is not complete merely because a screen or button exists. It is complete only when its data model, validation, persistence, error handling, accessibility, tests, Android behavior and documentation are all correct.

Never report a task as completed when it was only statically inspected, implemented but not run, or tested only in a desktop browser. State exactly what was and was not verified.

---

## 1. Current product baseline

The public repository describes Sanchay as an early-stage Ivy Wallet fork with a Kotlin Android shell and a React dashboard inside a WebView. The visible dashboard uses React 19, TypeScript, Vite and local browser/WebView storage. The repository README currently says it uses seeded demo data and is not yet a production banking or accounting application.

The Antigravity briefing supplied for this plan reports 68/68 tests passing across 11 suites. The current repository's UPI compliance document contains a later reference to 75/75 tests for its payment-related verification. **Do not treat either number as the current total. Run the current test suite and report the actual result.**

### 1.1 Features reported as implemented in the dashboard

| Area | Existing behavior to preserve and verify | Current assessment from available project materials |
|---|---|---|
| Transactions | Add income/expense, edit, delete, undo, search, filters, details, receipt text, recent quick-fill, category suggestions | Implemented; full edge-case verification required |
| Money calculations | Integer minor-unit/paise arithmetic | Reported implemented; audit every calculation path |
| Accounts | Bank accounts, cards, cash wallets, savings vaults; provider presets; active/inactive; balances | Implemented; deletion and balance semantics need hardening |
| Cards | 3D card display and visual freeze state | Visual simulation only; must never imply real card controls |
| Safe-to-Spend | 30-day estimate, buffer, planned events, goal pace, what-if purchase | Implemented; assumptions and edge cases need validation |
| Planned payments | One-time inflows/outflows and due indicators | Implemented; recurring rules are missing |
| Savings goals | Targets, progress, monthly pace, goal deposits | Implemented; verify ledger/account/goal consistency |
| Budgets | Category limits, progress and warnings | Implemented; history and custom categories are missing |
| Payees | Saved payees and favorites | Implemented; validate data and UX |
| Payment assistance | Manual external UPI assistance and local reconciliation under Path A | Implemented according to the current compliance direction; release audit required |
| Request money | Copy/share plain-text request | Implemented; must never be described as UPI Collect |
| Reports | Period comparison, category movements, drill-down, CSV export | Implemented; calculation scope and export correctness need verification |
| App lock | Optional local 4-digit PIN lock | Implemented; security claims and PIN handling require review |
| Backup/restore | JSON backup, validation and import preview | Implemented; backups are currently unencrypted and migration support needs improvement |
| Android file bridge | Save exports/receipts and import through system picker | Implemented; device/OS testing required |
| Themes/preferences | Existing visual theme, light/dark or preference behavior, profile settings | Preserve; audit completeness and persistence |

### 1.2 Known gaps and release risks

- First-run demo seed data can be confused with real personal financial records. A new user must be able to start with a genuinely blank ledger.
- Planned payments are one-time only; recurring schedules and reminders are not complete.
- Categories are fixed; user-created categories are not complete.
- Budget history and multi-month performance are incomplete.
- Backup files are not encrypted. Backup version migration and clean-install restore need stronger coverage.
- Multi-currency accounts may appear in seed/display data, but full transaction entry, conversion and reporting are incomplete. Current quick-add flows are INR-oriented.
- The Android WebView dashboard uses `localStorage` under `sanchay.local.v1`; the inherited native Room database is a separate, unused ledger. There must not be two competing writable ledgers.
- Native Ivy modules and capabilities remain in the repository. A static data-flow inventory reports dormant network-capable native functionality, including public exchange-rate/GitHub metadata requests and Firestore poll voting. The actual release APK still needs runtime network verification.
- Physical Android device verification is not established by the supplied briefing.
- Android package/application ID, signing identity, permissions, privacy disclosures, Play Console declarations, store assets and GPL obligations need a release audit.
- The public README still describes the project as early development and demo-data-backed. Documentation must not claim production readiness before the gates in this plan pass.

### 1.3 Source-of-truth rule

Use these project documents as related references, not competing master plans:

- `README.md` — user-facing description and supported setup instructions.
- `SANCHAY_FINAL_IMPROVEMENT_PLAN.md` — product direction, UX and technical improvement principles.
- `SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` — authoritative UPI/payment boundary and payment-related release requirements.
- `docs/data-flow-inventory.md` — static data-flow and network capability inventory.
- Any current release checklist under `docs/` — physical-device and release evidence.

Where this document and the UPI specification differ on payment behavior, follow the UPI specification. Where the repository has changed since this plan was prepared, inspect the code and update this plan rather than reverting valid work.

---

## 2. Definition of Done

Sanchay is ready for its first production release only when all **P0 release gates** below are complete.

### Product correctness

- A new user can start with a blank ledger. Demo data is an explicit optional sample mode, never silently mixed with real records.
- Account balances, transactions, transfers, goals, budgets and reports reconcile correctly.
- Income, expense, transfer, refund, planned event and payment attempt have distinct meanings.
- No operation silently duplicates a transaction or changes a historical transaction unexpectedly.
- All money calculations use integer minor units or a verified decimal-safe representation with explicit currency and rounding rules.
- Multi-currency limitations are clearly disclosed until the feature is fully supported.
- All core features work offline after installation, except explicitly documented optional external functions.

### Data safety

- Every financial write is validated and persisted safely.
- Storage schema versions and migrations are documented and tested.
- Backup export, preview, restore, cancellation and recovery work.
- The user is clearly warned that local data can be lost if app data is cleared or the app is uninstalled without a backup.
- No private financial data is sent to analytics, logs, crash systems or third parties without a justified, disclosed and reviewed reason.
- There is one authoritative ledger per runtime. No feature reads from one ledger and writes to another.

### Android reliability

- A signed release build installs and runs on supported physical Android devices.
- WebView keyboard, viewport, safe-area, navigation, file import/export, process recreation, app backgrounding and offline behavior are tested.
- Permissions are minimal and justified.
- The package ID and signing/update strategy are finalized before public distribution.
- No production signing secrets or private credentials are committed to Git.

### Trust and release readiness

- The Privacy Policy, Terms of Use, support contact and Play Store declarations accurately describe the shipped product.
- UPI assistance is Path A only unless the separate formal approval gate in the UPI specification has been passed.
- GPL-3.0 and third-party attribution/license obligations are reviewed.
- README, screenshots and store listing match the actual release build.
- There are no known P0 data-loss, financial-calculation, privacy or payment-status defects.

---

## 3. Phase 0 — Repository audit and stabilization (P0)

**Do this before adding new features.**

### 3.1 Create a verified feature inventory

Inspect the current source and produce `docs/implementation-status.md` with:

- Feature/module name.
- Actual implementation status.
- Relevant source files.
- Current tests and test coverage.
- Known defects or edge cases.
- Platform verification status: browser, emulator, physical Android.
- Next action and priority.

Do not mark an item implemented only because the README mentions it.

### 3.2 Establish a reproducible baseline

From a clean checkout:

- Install dependencies using the lockfile and documented package manager.
- Run web tests, lint, type-check and production build.
- Run all available Kotlin/Gradle tests and static analysis.
- Build the debug APK.
- Build the release variant if signing configuration permits.
- Record toolchain versions, commands, test counts and failures in `docs/verification-baseline.md`.
- Fix build failures before starting feature work.

Do not suppress tests or weaken lint rules simply to obtain a green build.

### 3.3 Audit seeded/demo data

Required behavior:

- First launch offers **Start with blank data** as the normal/default path.
- Sample/demo data is opt-in and clearly labeled as fictional sample data.
- Provide a clear way to leave/reset the demo environment without deleting real user data accidentally.
- Demo records must never resemble real bank-confirmed transactions.
- A reset must require explicit confirmation and state what will be deleted.
- Exported demo data and real data must not be silently merged.

Acceptance tests:

- Fresh install with blank start has zero fake transactions, accounts or budgets.
- Opt-in demo mode loads sample records and displays a persistent demo indicator.
- Reset and switch-to-blank paths do not leave stale records in derived totals.

### 3.4 Audit the storage architecture

Current known condition: the React dashboard uses `localStorage` (`sanchay.local.v1`), while inherited native Room is a separate database not wired to the dashboard.

Do not immediately build a Room bridge or delete Room modules. First create `docs/storage-architecture-decision.md` that answers:

1. Which store is authoritative for Android dashboard data?
2. Which store is authoritative for the standalone Render/browser build?
3. How are schema versions and migrations handled?
4. How will old `sanchay.local.v1` users retain their records?
5. How will backup/restore work across versions?
6. Can two storage layers ever both accept writes for the same data?
7. What is the cost and risk of retaining the current local storage versus adopting IndexedDB or a Room-backed adapter?

Recommended engineering shape:

- Introduce a small typed persistence/repository boundary before changing the underlying storage.
- Keep domain calculations and validation outside React components.
- Keep Android bridge methods narrow, typed, origin-restricted and independently validated in Kotlin.
- Keep the standalone web preview local-only; do not introduce server-side persistence just to share data with Android.
- If Room is selected for Android, it must become the single Android source of truth and the old WebView data must be migrated safely. Do not keep two independently writable ledgers.
- If the current WebView store is retained, document its limitations, add durable versioned migrations and make frequent backup/export reliable.
- Do not delete inherited native modules until dependencies, navigation entry points, workers, widgets, manifest declarations and release dependencies have been traced.

Acceptance criteria:

- A documented architecture decision exists.
- The selected path has one clear writer/source of truth per runtime.
- Data migration has tests using representative old backups and current local data.
- No user's existing data is discarded during migration.

### 3.5 Audit Android app identity and secrets

- Inspect the actual `applicationId`, namespace, manifest package references, deep links and signing setup.
- Decide the final package ID before the first public store release.
- If an existing Play listing or distributed APK must be updated, preserve the package ID and signing continuity. Do not rename it casually.
- If this is still a private pre-release build with no upgrade obligation, choose the Sanchay package ID before publication and migrate all references consistently.
- Inspect `debug.jks` and all keystore/config files. Confirm no production signing key, service-account key, API secret or private credential is committed.
- Use the appropriate private release-signing process; do not ship a debug-signed production APK.

Deliverable: `docs/android-identity-and-signing.md`.

---

## 4. Phase 1 — Financial ledger correctness (P0)

This phase is the foundation. A beautiful interface is not useful if balances or reports are wrong.

### 4.1 Define the financial data model

Create or verify explicit domain types for:

- Account.
- Transaction.
- Transaction type/direction.
- Transfer.
- Category.
- Payee.
- Planned payment.
- Recurring schedule.
- Budget and budget period.
- Savings goal and goal contribution.
- Payment assistance attempt.
- Currency and exchange-rate snapshot.

Every record must have a stable ID, created/updated timestamps where appropriate, explicit currency, and an unambiguous status. Do not use a display name as a primary key.

Use integer minor units (for INR, paise) or a verified decimal-safe representation. Never use JavaScript binary floating-point arithmetic for financial totals.

### 4.2 Transaction rules

The transaction form must support:

- Income and expense.
- Amount and currency.
- Account.
- Category.
- Date and optional time if supported consistently.
- Optional payee/counterparty.
- Optional note and tags.
- Status where relevant.
- Optional reference/attachment only if it can be stored and backed up safely.

Validation:

- Reject zero, negative or malformed amounts unless a specific transaction type explicitly supports them.
- Reject impossible dates and unsupported future-dated completed transactions.
- Validate currency/account compatibility.
- Require a valid active account for new entries.
- Explain validation errors close to the affected field.
- Prevent accidental double-submit and duplicate creation after retries.

Editing/deletion:

- Editing a transaction must update every affected account balance, category total, budget, report and goal relationship consistently.
- Deletion must clearly explain its effect and provide undo only when the original state can be safely restored.
- Undo must not cause duplicate writes after app restart or delayed events.
- Do not silently alter linked historical records.

Acceptance tests:

- Add/edit/delete/undo transaction.
- Edit amount, account, category, date and currency.
- Duplicate tap and rapid repeated save.
- Invalid amount/date/account.
- App background/restart around a save.
- Restore a backup containing edited/deleted records.

### 4.3 Account balances and account lifecycle

Each account must clearly show:

- Name/provider label.
- Account type.
- Currency.
- Starting/opening balance.
- Current calculated balance.
- Active/archived status.
- Optional account color/icon.

Rules:

- State whether the displayed balance is calculated from opening balance plus ledger entries.
- Do not claim live bank balance or bank synchronization.
- An inactive account must not be selectable for new transactions, but historical records must remain visible and editable under an explicit rule.
- Do not permit deleting an account with linked transactions without a clear resolution path.
- Prefer archive/close for accounts with history; offer reassignment or a deliberate migration if deletion is necessary.
- Account deletion must never erase transaction history silently.
- Account cards and visual balances must always match the ledger.

### 4.4 Transfers between accounts

Transfers must be a first-class operation, not two unrelated income/expense entries.

Required behavior:

- Select source and destination accounts.
- Show source amount, destination amount and exchange rate when currencies differ.
- Validate sufficient available balance where the app's balance model supports that check; otherwise explain that balances are user-maintained.
- Keep transfer legs linked by a shared transfer ID.
- Editing, deleting or undoing a transfer updates both sides atomically.
- A transfer must not count as income or spending in reports or budgets.
- A transfer to a savings account/goal must not be misclassified as consumption spending.
- Support an explicit transfer fee only if represented separately and included in expense reporting.

Tests:

- Same-currency transfer.
- Cross-currency transfer with explicit rate and rounding.
- Insufficient balance behavior.
- Inactive/deleted source or destination.
- Edit/delete/undo transfer.
- Transfer excluded from income, expense and budget totals.
- Restore with linked transfer legs intact.

### 4.5 Refunds and reversals

- Record a refund as a linked inflow/expense adjustment, not as an arbitrary positive expense.
- Preserve the original transaction reference.
- Define how partial refunds affect category spending and budget totals.
- Do not imply a bank refund occurred unless the user recorded it or an authorised source confirms it.
- A refund must not create negative or duplicated totals unexpectedly.

---

## 5. Phase 2 — Complete the existing finance features (P1)

### 5.1 Categories and tags

Implement custom category management:

- Create, rename, recolor and choose an icon for categories.
- Distinguish income and expense category types where necessary.
- Prevent duplicate/conflicting category names within the same category type.
- Allow categories to be archived.
- When deleting a category with existing transactions, require reassignment to another category or an explicit uncategorized state.
- Preserve historical transaction meaning.
- Include user categories in backup, restore, import and export.
- Keep built-in categories available and distinguish built-in from custom.

Tags:

- Optional user-created tags for cross-category organization.
- Tags must not alter financial calculations.
- Search/filter by tags if the UX remains simple.

### 5.2 Recurring payments and income schedules

Extend planned payments with recurrence rules:

- Daily, weekly, monthly and yearly.
- User-defined interval where practical (for example, every 2 weeks).
- Start date, optional end date, next occurrence, timezone/date semantics and active/paused state.
- Month-end behavior must be explicit (for example, a 31st-of-month schedule in shorter months).
- Leap-year behavior must be tested.
- Allow skip, pause, resume, edit and cancel.
- Distinguish editing only this occurrence from editing the whole schedule and future occurrences.
- Past confirmed transactions must never be rewritten when a schedule changes.

Important behavior:

- A recurring schedule is not itself a completed ledger transaction.
- Upcoming occurrences appear in the planned-payment timeline and Safe-to-Spend calculation.
- When due, prompt the user to review and confirm/record the actual transaction. Do not silently claim that money moved.
- Do not implement auto-debit, UPI AutoPay or background fund movement.
- Use deterministic occurrence IDs/idempotency so app restarts, time changes and repeated jobs do not create duplicates.
- If local reminders are used, schedule them only with user consent and respect Android notification permission settings.

Tests:

- Daily/weekly/monthly/yearly recurrence.
- 29th/30th/31st and leap-year dates.
- Timezone/date changes and daylight-saving behavior where applicable.
- Pause/resume/skip/end date.
- Edit future schedule without changing past transactions.
- Process restart and duplicate reminder delivery.
- Notification disabled or permission denied.

### 5.3 Budgets and budget history

Complete budgets with:

- Monthly category budgets at minimum.
- Clear period start/end and account/category inclusion rules.
- Spent, remaining, percentage and over-budget amount.
- Optional warning thresholds and user-controlled notifications.
- Refund treatment consistent with the ledger rules.
- Transfers excluded from spending.
- Archived budgets retain historical performance.
- Budget edits apply according to a clear effective date and do not rewrite old periods.
- Historical view for at least the previous 3–6 months where data exists.
- Period comparison and category drill-down.
- Clear empty states when there is not enough history.
- Non-shaming language; no manipulative warnings.

Acceptance tests:

- Month boundary and varying month lengths.
- Zero budget, unused budget and overspending.
- Refund and transfer inclusion rules.
- Edit/archive/delete budget.
- Historical data remains stable after future budget edits.

### 5.4 Savings goals

Complete the existing goals feature:

- Goal name, target amount, target date, color/icon and optional note.
- Current contribution/progress, remaining amount and calculated contribution pace.
- Optional weekly/monthly contribution plan.
- Clear explanation of how pace is calculated and which date range it assumes.
- Edit target/date and recalculate projections without changing old transactions.
- Pause, complete, archive or cancel a goal.
- Contributions must be linked to their source transaction/transfer and not counted as ordinary spending if they represent money moved into savings.
- No automatic transfer or financial commitment.
- A missed target must be described neutrally.

Tests:

- Deposit, edit, delete and undo contribution.
- Goal completion and target changes.
- Goal/account relationship after backup restore.
- Goal contribution excluded from expense totals where appropriate.

### 5.5 Safe-to-Spend and cash-flow planner

Preserve the existing Safe-to-Spend feature and make its calculation explainable.

Inputs should be explicit:

- Selected account(s) and their user-maintained balances.
- Confirmed ledger transactions up to the calculation date.
- Entered planned/recurring inflows and outflows.
- Remaining applicable budgets.
- Goal contribution pace if the user chooses to include it.
- User-defined safety buffer.
- Optional what-if purchase or changed event date.

Outputs:

- Estimated amount available over the selected projection horizon (currently 30 days).
- Timeline of expected money-in and money-out events.
- Estimated balance after each known event.
- Buffer shortfall warning.
- Clear source/reference for every event affecting the projection.
- Missing-data/uncertainty message when future income or obligations are not entered.

Rules:

- Keep calculation deterministic and local.
- Use integer minor units and explicit currency rules.
- Do not double-count transfers, goal movements, refunds or a schedule occurrence and its confirmed transaction.
- A what-if scenario must not alter the ledger or saved plan unless the user explicitly confirms a separate action.
- Overdue planned outflows must remain visible until resolved, skipped or removed according to a clear rule.
- Never present an estimate as guaranteed cash or as financial advice.
- Explain that the estimate only includes data the user entered; it cannot know all future obligations or bank balances.

Tests:

- No planned events.
- Only planned inflows/outflows.
- Overdue event.
- Recurring occurrence.
- Transfer and goal movement.
- Refund.
- Buffer above/below projected balance.
- What-if purchase added/removed.
- Currency mismatch and missing exchange rate.
- Month-end and date-boundary behavior.

### 5.6 Reports and insights

Complete reports using deterministic calculations:

- Income vs expenses over user-selected periods.
- Account balances and account-level cash flow.
- Category spending and income breakdown.
- Monthly trend and comparable-period comparison.
- Budget performance over time.
- Savings-goal progress.
- Upcoming planned payments and recurring obligations.
- Top category changes with links to underlying records.
- Filters by date, account, currency, category and transaction type where valid.
- Export filtered and full transaction data to CSV.

Every report must show:

- Period covered.
- Currency.
- Accounts included.
- Whether transfers are excluded.
- Refund treatment.
- Data limitations.
- A path from an insight to the underlying transactions.

Do not use vague insight copy such as "spending increased" without displaying the comparison period, amount/difference and source records. Do not add a generic AI chatbot or send financial data to an LLM.

### 5.7 Multi-currency support

Do not show USD/EUR/GBP/JPY as fully supported until transaction entry, balances, transfers, reports and backup all work correctly for them.

Required design:

- Every account and transaction has an explicit currency.
- Store amounts in the currency's minor units, with currency-specific precision rules.
- Never add different currencies together without an explicit conversion.
- When a transaction is entered in a foreign currency, show the original amount and currency.
- For cross-currency transfers, store source amount, destination amount, rate, rate date/source and rounding result.
- Allow manual exchange rates and keep the chosen rate snapshot with the transaction/transfer.
- If automatic public FX rates remain, disclose that they are informational, identify the provider and timestamp, and do not silently overwrite historical transaction rates.
- Reports must either group by currency or use an explicitly selected display currency and a documented conversion basis.
- If a rate is unavailable, do not guess. Show an unavailable/unknown total or ask the user to enter a rate.
- Keep offline transaction entry available using the user's manually selected rate.

Tests:

- INR paise and currencies with 0, 2 and 3 minor digits as applicable.
- Rounding and conversion consistency.
- Historical rate snapshot remains unchanged when current rates update.
- Missing rate, invalid rate and offline mode.
- Cross-currency transfer and report totals.

### 5.8 Loans and debt records — scope verification

The existing improvement plan mentions loans and related transactions, but the current public dashboard README does not establish that a complete loan module is available in the visible Sanchay dashboard.

First verify whether a loan feature is currently exposed or is only inherited/dormant Ivy functionality.

If it is part of the existing user-facing product scope, complete it as **personal record keeping only**:

- Record a loan the user has given or borrowed.
- Principal, counterparty label, date, due date, optional agreed interest and notes.
- Record partial repayments and link each repayment to the loan.
- Show outstanding amount and repayment history.
- Keep loan principal movement distinct from ordinary income/expense totals, while recording actual interest/fees according to explicit rules.
- Do not match borrowers/lenders, arrange loans, issue credit, calculate credit eligibility or provide lending services.

If it is not exposed and not part of the confirmed product scope, do not add it ahead of P0/P1 release blockers.

---

## 6. Phase 3 — Payees and India payment-assistance safety (P0/P1)

The current release path is **Path A: external payment assistance and local record keeping only**.

The current `SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` is authoritative. This master plan does not grant legal approval or permission to implement other payment paths.

### 6.1 Path A behavior to preserve

- User may save a payee and a user-entered UPI ID.
- The UPI ID must be labeled **user-entered / not verified by Sanchay**.
- User can copy the UPI ID and payment details.
- The app tells the user to open their own trusted UPI application and independently verify the recipient name and amount before authorizing.
- Sanchay records a local payment attempt separately from a ledger transaction.
- Unclear outcomes remain unresolved until the user decides what to record.
- If user marks a payment as paid, the ledger entry is labeled as user-confirmed and not bank-verified.
- Duplicate confirmation must never create a second expense.
- A UTR/reference is optional user-entered information, not independently verified by Sanchay.
- A request-money message is plain text only and must say it is not a UPI Collect request.

### 6.2 Prohibited in the initial release

Unless the separate written approval and compliance process in the UPI specification has been completed, do not:

- Generate `upi://pay` or other UPI payment intents/deep links.
- Generate UPI payment QR codes.
- Launch an external UPI app with prefilled payment data.
- Integrate UPI APIs, collect requests, payment SDKs or payment gateways.
- Claim payment success, settlement, bank verification or UTR verification.
- Read SMS, notifications, accessibility events or other app UI to infer payment status.
- Collect UPI PINs, OTPs, bank passwords, card credentials or authentication data.
- Retry an uncertain payment automatically.
- Claim NPCI accreditation, official UPI status or bank affiliation.

A future Path B/Path C proposal must be a separate project gate requiring written specialist review and applicable partner/NPCI/PSP approvals. Do not implement it as an ordinary feature improvement.

### 6.3 Payment-attempt state and ledger rules

Use explicit conservative states consistent with the current specification, such as:

`prepared -> needs_reconciliation -> marked_paid_by_user | cancelled_or_failed`

The exact state names should remain consistent with the implemented model and UPI spec. Do not add misleading success states.

- A payment attempt is not a ledger transaction.
- Only a user-confirmed ledger record changes balances/reports/budgets.
- Confirmation must be idempotent at the domain/repository boundary.
- Do not manually decrement balances if the balance is already derived from ledger transactions.
- A local receipt must say the record was marked by the user and is not bank-verified.
- A copy/share action never changes a payment's status.

### 6.4 Payee management improvements

- Stable payee IDs.
- Duplicate detection with user choice, not silent merging.
- Optional aliases, notes and favorites.
- UPI ID format validation must be described as syntax validation only.
- Editing a payee must not rewrite historical payment attempt details unless the user explicitly chooses to update a draft.
- Allow safe deletion/archive while preserving past records.

### 6.5 India release review

Before publication:

- Re-read the latest UPI compliance specification and its linked official guidance.
- Complete the applicable Google Play Financial Features Declaration accurately.
- Do not display UPI/NPCI logos, badges or accreditation language without authorization.
- Publish accurate Terms of Use and support details.
- Obtain qualified legal review where the operating model or payment flow requires it. This plan is not legal advice and cannot certify regulatory compliance.

---

## 7. Phase 4 — Privacy, security, backups and data recovery (P0)

### 7.1 Privacy/data page

Add or complete an in-app page that explains in ordinary language:

- Where dashboard data is stored.
- Whether data leaves the device and which specific features may contact external services.
- Whether any optional analytics/crash reporting exists.
- What the app lock does and does not protect.
- What backup files contain and whether they are encrypted.
- What happens when the app is uninstalled, app data is cleared or a backup is restored.
- How to export, restore and permanently reset local data.
- What Sanchay cannot do (no live bank balances, no bank sync, no money movement in Path A).

The wording must match the actual code and release artifact. Avoid absolute statements such as "100% secure", "nothing ever leaves your phone" or "fully encrypted" unless each claim is technically verified.

### 7.2 Network and dependency audit

The current static inventory identifies dormant native network-capable modules even though the visible dashboard itself has no network path. Do not assume that a static source scan proves the shipped APK has no outbound traffic.

Required work:

- Update `docs/data-flow-inventory.md` from the current checkout.
- Inspect manifest, merged manifest, Gradle plugins, release dependencies, Firebase configuration, native modules, workers, services, widgets and all network call sites.
- Decide whether dormant network features (public exchange-rate fetch, GitHub metadata and Firestore poll voting) are retained, removed or separately disclosed.
- Ensure no dashboard financial data, payee information, UPI ID, notes, balance, UTR or PIN is sent to those services.
- Capture runtime network behavior on a clean device using the actual release build.
- Document destination, trigger, payload and user-visible purpose for every observed request.
- Remove unused permissions and dependencies only after proving no current feature requires them.
- Keep cleartext traffic disabled and the WebView restricted to the trusted local origin.
- Keep the JS/native bridge narrow. Never expose a generic arbitrary-intent, file-read or network-call bridge.

Release gate: the privacy policy and Play Data safety form must reflect the runtime behavior of the exact release build, not merely an earlier static scan.

### 7.3 App lock

Review the existing 4-digit PIN feature:

- Determine exactly how the PIN is stored and compared.
- Do not store the PIN in plaintext if the implementation can be safely improved.
- Use a reviewed password/PIN derivation or platform secure-storage design appropriate to the threat model; do not invent custom cryptography.
- Add retry throttling and appropriate lockout/backoff without creating a permanent data-loss trap.
- Keep PIN out of logs, backups, exports and analytics.
- Ensure reset/recovery behavior is explicit.
- Explain that a local app lock is an access barrier, not necessarily encryption of the underlying database/files.
- Do not claim that the PIN encrypts the user's financial data unless it actually does.

Tests:

- Correct/wrong PIN.
- App background/resume.
- Process death and restart.
- Lock now.
- Reset flow.
- Storage corruption or unavailable secure storage.

### 7.4 Backup format and restore

Create a documented, versioned backup format.

Backup metadata should include:

- Format identifier and schema version.
- App version/build where useful.
- Export timestamp.
- Currency/category identifiers required for restoration.
- Records and preferences included in the export.

Backup must include all user-owned financial data required for recovery: accounts, transactions, transfers, custom categories/tags, payees, goals, contributions, budgets, planned payments, recurring schedules, payment attempts, relevant settings and relationships.

Backup must not include authentication secrets, app-lock PIN, device-specific signing material or unnecessary device identifiers.

Restore behavior:

- Validate file type, size, schema, IDs, data relationships, dates, currencies, amount precision and malformed records.
- Show an import preview: record counts, unsupported items, duplicates and replacement/merge behavior.
- Allow cancel before commit.
- Use an atomic commit or rollback strategy. A failed restore must not leave half the user's data overwritten.
- Clearly state whether restore replaces current data or merges data. Never make this ambiguous.
- Preserve existing data if validation fails.
- Support migrations from older backup versions with fixtures and tests.
- Test restoring on a clean install and restoring a real export created by the previous release.

### 7.5 Optional encrypted backups

Add optional passphrase-protected encryption only after plain backup/restore is reliable.

- Use a standard, reviewed AES-GCM implementation with a secure random salt and nonce and a suitable password-based key derivation function.
- Do not invent encryption algorithms or hard-code keys.
- Include a format/version header so the app can identify encrypted backups.
- Verify authentication tags before parsing/importing data.
- Wrong passphrase/corrupted file must fail safely without changing current data.
- Explain that a forgotten passphrase cannot be recovered by Sanchay.
- Keep unencrypted export available only with a clear warning if product requirements justify it.

### 7.6 Data deletion and recovery

- Explain the difference between deleting a transaction, archiving an account, resetting demo data and deleting all local data.
- Add a deliberate full-data reset with an explicit confirmation phrase or equivalent confirmation design.
- Ensure reset covers all Sanchay storage keys and caches without deleting unrelated user files.
- Verify app backup policy and Android system backup behavior are intentional.
- Provide a clear reminder to export a backup before reinstalling or clearing app data.

---

## 8. Phase 5 — Android application completion (P0)

### 8.1 WebView and lifecycle

Verify on physical Android devices and emulators:

- Startup and splash behavior.
- Status/navigation bar and safe-area/notch padding.
- Keyboard opening, closing and resizing without covering form controls.
- Scroll behavior inside nested screens/modals.
- Android Back button and predictive/system back behavior where supported.
- App background/resume and process recreation.
- Screen rotation and configuration changes if supported.
- Offline launch and offline core workflows.
- File picker import and MediaStore export on supported API levels.
- Large JSON/CSV exports and interrupted writes.
- Corrupted/missing WebView storage recovery.
- Dark/light mode and system font scaling.
- Low-memory behavior and repeated navigation.

### 8.2 Native file bridge

- Keep `SanchayAndroid.saveFile` or its current equivalent limited to safe file export.
- Validate filename, MIME type, size and content handling on the native side.
- Keep file import through the system picker; do not broaden file/content access unnecessarily.
- Handle cancellation, missing URI, permission errors, insufficient storage and duplicate filenames.
- Never expose arbitrary filesystem paths or unrestricted read/write operations to JavaScript.
- Show a useful success/failure message with the correct saved location.

### 8.3 Permissions

Review the merged release manifest. Request only permissions required by shipped features.

- No SMS, call-log, contacts, location or broad package visibility for convenience.
- Notifications are optional and requested only when the user enables reminder behavior.
- Vibration or other small device capabilities must have a clear feature purpose.
- Remove inherited permissions only after usage/dependency checks.

### 8.4 Home-screen widgets and native modules

Home-screen widgets are not a P0 release requirement unless currently advertised as working.

If retained as a future enhancement:

- Use Sanchay branding.
- Display accurate data from the authoritative store.
- Respect the app lock and privacy settings; do not expose sensitive balances on the lock screen without explicit user control.
- Handle stale data and refresh errors visibly.
- Do not maintain a second ledger inside the widget.

For inherited native modules:

- Identify whether each module is reachable from the shipped UI.
- Remove or isolate unused components only after dependency and license review.
- Do not accidentally remove useful upstream code or break build configuration.

---

## 9. Phase 6 — UX, accessibility and visual polish (P1)

Preserve the existing Sanchay visual identity and layout direction. Improve consistency rather than applying a completely new aesthetic.

### 9.1 Dashboard hierarchy

The dashboard should present the most useful information in a deliberate order:

1. Total balance with a clear explanation of included accounts/currencies.
2. Income and expense for the selected period.
3. Upcoming payments and known cash-flow events.
4. Budget progress and relevant warnings.
5. Savings-goal progress.
6. Useful report/insight summaries.
7. Fast actions for expense, income, transfer and planned payment.

Requirements:

- Avoid giving every metric/chart equal visual weight.
- Make the selected period and selected accounts obvious.
- Explain how every important total is calculated.
- Keep transaction entry fast and reachable.
- Do not overwhelm the home screen with every feature.
- Use clear labels for actual ledger values versus plans, estimates and visual simulations.

### 9.2 Design-system consistency

Audit and standardize:

- Typography, spacing, radii, elevation, icons and colors.
- Income/expense/transfer/planned/savings visual distinctions.
- Light and dark theme contrast.
- Form field states, keyboard types and validation.
- Dialogs, drawers, toasts and confirmation patterns.
- Chart legends, currency formatting and date labels.
- Loading, empty, error, offline and permission-denied states.
- Reduced-motion behavior and animation performance.

Keep the existing beige/brand styling and current Sanchay identity unless there is a concrete usability reason to adjust them. Avoid gratuitous gradients, excessive animation and decorative complexity that reduce readability.

### 9.3 Accessibility

- Screen-reader labels for every meaningful control.
- Logical focus order and visible focus state.
- Touch targets comfortable for mobile use.
- Support system font scaling without clipping or overlap.
- Sufficient contrast in both themes.
- Do not use color alone to indicate income, expense, failure or warnings.
- Respect reduced-motion preferences.
- Charts must have an accessible text/table equivalent.

### 9.4 Localization and formatting

- Keep INR as the primary default for the Indian audience.
- Use locale-aware number/date formatting while keeping stored values locale-independent.
- Do not hard-code currency symbols into stored transaction values.
- Check Kannada and other supported language text for clipping if translations exist.
- Ensure Unicode names/notes survive export, restore and search.

---

## 10. Phase 7 — Automated and manual quality assurance (P0)

### 10.1 Automated tests

Keep business logic testable outside UI components. Add or maintain tests for:

- Monetary arithmetic and rounding.
- Account balance derivation.
- Transaction CRUD and undo.
- Transfers and refunds.
- Goal contributions.
- Budget calculations and history.
- Planned and recurring payment occurrence calculation.
- Safe-to-Spend projections and what-if scenarios.
- Multi-currency conversion and missing-rate behavior.
- Payment-attempt state transitions and idempotency.
- Backup export/import/version migration/encryption.
- Persistence recovery and malformed data.
- Search/filter/category suggestions.
- CSV and receipt generation.

Run the full web unit/integration suite, lint, type-check and production build on each substantial change. Run Kotlin/Gradle checks and Android instrumentation/UI tests for native code changes.

### 10.2 Manual test matrix

Test at minimum:

| Scenario | Expected result |
|---|---|
| Fresh install, blank setup | No fake transactions or balances |
| Demo mode | Clearly labeled sample environment |
| Offline launch | Core local features remain usable |
| Add/edit/delete/undo transaction | Correct balance and report reconciliation |
| Same-currency transfer | Source decreases, destination increases, no income/expense inflation |
| Cross-currency transfer | Explicit rate, correct rounding, original values preserved |
| Recurring event due | User prompted; no false completed transaction |
| User declines notification | App remains usable without notification permission |
| Overdue planned payment | Remains visible under defined rules |
| Goal contribution | Goal and account/ledger relationships reconcile |
| Budget period boundary | Correct period and history |
| Payment attempt uncertain | Remains unresolved; no automatic duplicate |
| Payment marked by user | Exactly one clearly labeled unverified ledger entry |
| Export and restore | Data and relationships restored correctly |
| Corrupted backup | Rejected without changing current data |
| Wrong backup passphrase | Rejected without changing current data |
| App background/kill/restart | No lost or duplicated records |
| Android file picker canceled | No crash or false success message |
| WebView storage unavailable | Clear recovery path; no silent seed overwrite |
| Large text/display scaling | No clipped critical controls |

### 10.3 Regression discipline

- Add a regression test for every defect fixed.
- Do not replace real integration tests with shallow snapshots.
- Avoid tests that merely verify internal implementation details.
- Keep fixtures for old backup formats and migration cases.
- Test on the actual release build, not only the debug build.
- Record device model, Android version, app version and test result for manual device tests.

Deliverable: `docs/qa-and-device-test-results.md`.

---

## 11. Phase 8 — Release, legal, licensing and public documentation (P0)

### 11.1 Privacy Policy and Terms

Publish a stable Privacy Policy URL and link it inside the app. It must accurately explain:

- Local dashboard storage.
- Any remaining native network requests and the data involved.
- Optional notifications.
- Backup/export and encryption behavior.
- Data deletion and retention.
- Any third-party services.
- Support and privacy contact.

Publish Terms of Use that accurately state Sanchay is a personal record-keeping tool, not a bank, payment provider or source of verified bank balances. Get qualified review for legal wording where needed.

### 11.2 Google Play readiness

- Complete the Play Console app-content and Financial Features declarations accurately.
- Complete Data safety based on the release APK's runtime behavior and dependencies.
- Provide a support contact and working privacy URL.
- Prepare a content rating and target audience declarations appropriate to the app.
- Create accurate store description and screenshots from the production build.
- Do not claim official bank/UPI/NPCI affiliation or accreditation.
- Do not advertise bank sync, card freeze, automatic payments, encryption or widgets unless those capabilities truly work.
- Ensure the selected package ID, signing configuration and update path are final.
- Verify current Play requirements at submission time; do not rely on old policy assumptions.

### 11.3 GPL-3.0 and third-party assets

Sanchay is based on Ivy Wallet under GPL-3.0 according to the repository. Before distributing binaries:

- Preserve the original license and copyright notices.
- Include required GPL license text and source availability for distributed GPL-covered versions.
- Mark relevant modifications where required.
- Audit licenses for dependencies, fonts, icons, illustrations and other assets.
- Do not imply Ivy Apps endorsement or affiliation.
- Keep Sanchay branding distinct.
- Obtain legal advice if distribution obligations are uncertain.

### 11.4 README and project docs

Update the README only after the release candidate passes verification.

It must include:

- Accurate project status.
- Real screenshots.
- Supported platforms and Android versions.
- Actual feature list and limitations.
- Offline/local storage explanation.
- UPI Path A explanation.
- Backup warning and recovery steps.
- Build/test commands that work from a clean clone.
- License, attribution and contribution instructions.
- Issue/support process.

Remove outdated claims and clearly label demo/preview functionality. The Render website should be described as a web preview if it is not the same as the production Android data environment.

---

## 12. Recommended execution order

Do not attempt every feature in one enormous coding pass. Execute in small phases and stop when a release blocker is discovered.

| Order | Work package | Priority | Exit condition |
|---|---|---|---|
| 0.1 | Clean build/test baseline and feature inventory | P0 | Exact verified state and blockers documented |
| 0.2 | Demo-data/blank-start correction | P0 | No fake records in normal first-run experience |
| 0.3 | Storage architecture decision and migration plan | P0 | One source of truth and safe migration path |
| 0.4 | App identity, signing and dependency/permission audit | P0 | Release identity and secret handling decided |
| 1.1 | Ledger, transaction and money arithmetic audit | P0 | Core ledger tests pass |
| 1.2 | Account lifecycle, transfer and refund correctness | P0 | Balance and reporting rules pass |
| 1.3 | Backup/restore and data-recovery hardening | P0 | Clean-install restore and old-format fixtures pass |
| 1.4 | App lock, WebView bridge and privacy audit | P0 | Security behavior verified and documented |
| 1.5 | Physical Android device/lifecycle testing | P0 | Release-critical device issues resolved |
| 2.1 | Custom categories and tags | P1 | CRUD, remapping and historical records pass |
| 2.2 | Recurring schedules and local reminders | P1 | Idempotent occurrence and reminder tests pass |
| 2.3 | Budget history and goal completion | P1 | Multi-period calculations and goal linkage pass |
| 2.4 | Safe-to-Spend accuracy and explanations | P1 | Projection edge-case tests pass |
| 2.5 | Reports and CSV completeness | P1 | Reconciled reports and exports pass |
| 2.6 | Multi-currency completion | P1 | Explicit conversion, rounding and reports pass |
| 2.7 | UX and accessibility polish | P1 | Usability/accessibility checklist passes |
| 3.1 | Optional widgets/localization/extra import formats | P2 | Only after stable release and user feedback |
| 3.2 | Any future sync or advanced payment integration | Separate decision | Requires its own security/legal architecture review |

---

## 13. Required deliverables from the coding agent

Maintain these files as the work progresses. Do not create empty documents merely to satisfy the list; each file must contain evidence.

1. `docs/implementation-status.md` — verified feature matrix and source mapping.
2. `docs/verification-baseline.md` — exact tool versions, commands, tests and build result.
3. `docs/storage-architecture-decision.md` — selected persistence architecture and migration strategy.
4. `docs/android-identity-and-signing.md` — package ID, signing and secret audit.
5. `docs/data-flow-inventory.md` — current static and runtime data-flow audit.
6. `docs/qa-and-device-test-results.md` — physical device and release test evidence.
7. `docs/release-readiness-checklist.md` — final Play Store and release status.
8. Updated `README.md` — only claims verified in the release candidate.

At the end of each work package, report:

- What changed.
- Files changed.
- Why the change was needed.
- Tests added/updated.
- Exact commands run and results.
- Device/OS tested, if applicable.
- Risks or known limitations.
- Remaining work.

Do not report a test as passing if it was not run. Do not mark physical-device verification complete if only an emulator was used.

---

## 14. Final release checklist

### Product and ledger

- [x] Blank first-run experience is the default. **[Verified 10 Nov: first-run gate + E2E 18 checks; see `docs/verification-baseline.md`]**
- [x] Demo mode is explicit and clearly labeled. **[Verified 10 Nov: opt-in sample data + persistent banner + `demoMode` in backups; E2E round-trip]**
- [x] Account balances reconcile with opening balances and ledger entries. **[Verified 10 Nov: connect sets balance=openingBalance, engine applies ledger from opening balance, CardsTab shows Opening + current + derivation statement; 141/141 tests green; E2E 17/17]**
- [x] Transfers are linked and excluded from income/expense totals.
- [x] Refunds and reversals follow documented rules. **[Verified 10 Nov: ledger recordRefund plus persistence refund kind plus engine validation plus reporting exclusions; 141/141 tests green; E2E 17/17]**
- [x] No duplicate transaction/payment confirmation paths remain. **[Verified 10 Nov: AddTransactionModal submit busy-ref guard; confirmPaymentAttempt idempotent via marked_paid_by_user/transactionId + deterministic tx id; tests green; E2E 17/17]**
- [ ] Core features work offline.

### Features

- [x] Transaction management is fully tested. **[Verified 10 Nov: `ledgerOps.test.ts` — 41 acceptance tests covering plan §4.2 (add/edit/delete/undo, invalid amount/date/account, inactive rules, double-submit guard, backup round-trip via persistence tests, reload via E2E); engine extracted to pure `utils/ledgerOps.ts`]
- [ ] Accounts and account lifecycle are fully tested.
- [ ] Custom categories/tags are complete or explicitly deferred in release notes.
- [ ] Planned and recurring payments are complete or clearly marked one-time only.
- [ ] Budgets and budget history are accurate.
- [ ] Savings goals and contributions reconcile.
- [ ] Safe-to-Spend shows assumptions and limitations.
- [ ] Reports and CSV exports reconcile to ledger data.
- [ ] Multi-currency is complete or unsupported currencies are not presented as fully supported.
- [ ] Payee and Path A payment assistance behavior follows the UPI specification.
- [ ] Visual card controls are clearly described as presentation-only.

### Data and security

- [x] Single source of truth is documented for each runtime. **[Verified 10 Nov: `docs/storage-architecture-decision.md` — localStorage ledger, Room read-only/dormant, widget prefs = display cache, single-writer rule]**
- [ ] Storage migrations are tested.
- [ ] Backup export and restore work.
- [ ] Encrypted backup behavior is tested if included.
- [ ] App lock claims match actual security properties.
- [ ] Data-flow inventory matches the release APK.
- [ ] Runtime network behavior is verified.
- [ ] No private financial data appears in logs or analytics.
- [ ] No production secrets/signing keys are committed.

### Android and release

- [ ] Package ID and signing/update strategy are final.
- [ ] Release APK tested on physical Android devices.
- [ ] WebView lifecycle, file import/export and keyboard behavior pass.
- [ ] Permissions are minimal and justified.
- [ ] Privacy Policy and Terms are published and linked in-app.
- [ ] Play declarations are accurate.
- [ ] GPL-3.0 and dependency/asset licenses are reviewed.
- [ ] README and store screenshots reflect the release candidate.
- [ ] No known P0 issue remains.

---

## 15. Final instruction

The objective is not to add the maximum number of features. The objective is to make the existing Sanchay features dependable, coherent and trustworthy, then complete the natural gaps in the roadmap.

**Start with Phase 0. Do not jump directly to recurring payments, new charts, widgets or visual redesign.** First verify the code, establish a clean baseline, prevent demo data from being mistaken for real data, settle the storage source-of-truth question, and make the ledger/data-recovery paths reliable.

Preserve Sanchay's product direction, existing branding and working features. Make no unapproved payment-path expansion. Implement incrementally, test every financial rule, verify on real Android devices, and report evidence honestly.

**Sanchay is complete only when a user can trust the records they enter, understand the numbers the app shows, recover their data, and use the core app reliably on an actual Android device.**
