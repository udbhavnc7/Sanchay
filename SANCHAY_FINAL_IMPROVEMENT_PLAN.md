# SANCHAY — Final Improvement Plan
**Repository:** https://github.com/udbhavnc7/Sanchay

## Non-negotiable instruction

**Improve the existing Sanchay personal-finance app. Do not pivot it into a different product.**

Preserve its current product direction and existing features:
- Income and expense tracking.
- Multiple accounts and account balances.
- Categories, notes, tags, and transaction details.
- Transfers between accounts.
- Loans and related transactions.
- Spending statistics, reports, and financial insights.
- Budgets.
- Planned and recurring payments.
- Financial goals and upcoming expense planning.
- Multiple currencies.
- Customizable themes and appearance.
- Local-first/private-by-design approach.
- Existing Kotlin/Android architecture, Jetpack Compose, Room, DataStore, Coroutines/Flow, Hilt, and established modules.

Do not replace Sanchay with a different financial product, require a cloud account, turn it into an investment/banking app, or remove existing functionality. First inspect the repository to verify which features are complete, partial, or only documented.

---

## 1. Goal

Make the existing Sanchay experience more polished, fast, trustworthy, and useful for everyday money management.

Sanchay already aims to help users answer:
- How much money do I have?
- Where did my money go?
- How much can I safely spend?
- Am I moving toward my financial goals?

Improvements should make those existing jobs easier without changing the app's identity.

## 2. Improve the existing home dashboard

Keep the current finance-manager dashboard concept; improve information hierarchy rather than replacing it.

Suggested order:
1. Total balance with clear account inclusion rules.
2. Income and expenses for the selected period.
3. Upcoming planned/recurring payments.
4. Budget progress and any user-defined warnings.
5. Goal progress.
6. Cash-flow insight and reports.
7. Quick actions for expense, income, transfer, and planned payment.

Requirements:
- Make the most important numbers easy to scan.
- Avoid showing every chart and metric at equal visual weight.
- Let users choose the date range and relevant accounts.
- Explain how each summary number is calculated.
- Ensure transfers do not inflate income/expense totals.
- Make empty states useful for new users.
- Keep quick transaction entry fast and reachable.
- Preserve theme and customization options.
- Support font scaling, accessible contrast, screen readers, and comfortable touch targets.

Do not redesign every screen at once. Improve the existing navigation and screens incrementally, with screenshots and regression tests.

---

## 3. Add a natural extension: Safe-to-Spend / Upcoming Cash-Flow View

This builds on existing balances, budgets, planned payments, recurring payments, and goals. It does not replace the existing finance manager.

### User value
Help users see how known upcoming obligations may affect their available balance.

### Inputs
- Current account balances.
- Planned and recurring payments.
- Expected income, where the user has entered it.
- Upcoming expenses and goal contributions.
- Optional user-defined minimum balance.

### Output
- Upcoming money-in and money-out timeline.
- Estimated balance after each known event.
- A warning when the projection crosses the user's chosen buffer.
- A clear list of which entries contributed to the estimate.
- An explicit message when data is incomplete.

### What-if option
Let a user temporarily add a hypothetical purchase or change an expected payment date and compare the result with the baseline. Do not modify the real transaction history unless the user confirms.

### Correctness rules
- Calculate locally and deterministically; no LLM is required for arithmetic.
- Use integer minor units or an appropriate decimal representation, never binary floating point for financial calculations.
- Handle transfers without double-counting.
- Distinguish confirmed transactions, planned payments, and estimates.
- Use explicit date, recurrence, and currency semantics.
- Make missing or uncertain inputs visible.
- Do not present a forecast as guaranteed or as personalized financial advice.

### Acceptance criteria
- A user can understand why a projected balance changes.
- Every projected event traces to a known entry or explicit assumption.
- A what-if scenario does not alter the real ledger until confirmed.
- Tests cover transfers, recurring schedules, refunds, late/changed dates, month-end, currency precision, and missing data.

---

## 4. Improve existing transaction management

Keep the current transaction model and capabilities; make them faster and safer.

Improvements:
- Reduce the steps needed to add an expense or income.
- Provide optional templates and recent-category suggestions.
- Make account, category, amount, date, and transaction type clear.
- Support notes/tags without making them mandatory.
- Make editing and deletion behavior explicit.
- Show transfer source and destination clearly.
- Prevent duplicate transaction creation during retries/imports.
- Make recurring schedule changes distinct from edits to past transactions.
- Add helpful undo where safe.
- Validate amount, date, account, and currency input.
- Preserve transaction history correctly through migrations and imports.

Do not add automatic bank access merely to reduce entry friction. Prioritize dependable manual entry and imports first.

---

## 5. Improve budgets, planned payments, and goals

### Budgets
- Explain budget period and which categories/accounts are included.
- Show actual spending versus remaining budget.
- Handle refunds and transfers consistently.
- Allow users to adjust a budget without losing historical context.
- Make warnings configurable and non-shaming.

### Planned and recurring payments
- Clearly distinguish a schedule from an actual recorded transaction.
- Show the next occurrence and how it was calculated.
- Define what happens when a user edits, skips, or deletes a recurring schedule.
- Avoid silently rewriting past transactions.
- Prevent duplicate occurrences after app restart or time-zone/date changes.

### Financial goals
- Show target, current progress, and remaining amount.
- Offer optional target date and contribution schedule.
- If the user changes a target or contribution, update the projection transparently.
- Never imply that missing a target is a personal failure.
- Avoid automatic transfers or financial commitments.

---

## 6. Improve financial insights without generic AI

Build on existing reports and statistics. The objective is more useful explanation, not adding an AI chatbot.

Possible improvements:
- Compare the selected period with a comparable prior period.
- Explain the largest changes in spending categories.
- Highlight upcoming planned payments.
- Show budget categories that may need attention.
- Summarize progress toward goals.
- Let users tap an insight to see the transactions behind it.
- Explain filters, account inclusion, and calculations.
- Use deterministic rules for arithmetic and summaries.
- If AI is ever added later, keep it optional, explain data sharing, and never let it silently alter financial records.

Avoid generic statements such as “you spent more this month” without showing the comparison period, amount, and source transactions.

---

## 7. Make the privacy-first design verifiable

Preserve the local-first approach. Make it easier for users to understand and control.

Improvements:
- Add a plain-language Privacy/Data page explaining local storage, network use, telemetry, backups, and any external services.
- Document which information stays on-device and which information, if any, leaves it.
- Keep financial data out of logs and crash reports.
- Minimize permissions and unnecessary collection.
- Provide reliable export and import.
- Preview imported data and detect duplicates before committing.
- Validate file format, size, currency, dates, and malformed records.
- Provide clear backup/restore instructions.
- Distinguish local backup from cross-device sync.
- If backups are encrypted, explain what is encrypted and how keys are managed.
- Provide predictable reset and deletion behavior.
- Do not claim “fully private” or “encrypted end-to-end” unless the implementation supports that claim.

Acceptance criteria:
- Export can be opened or processed using a documented format.
- Import can be previewed, cancelled, and recovered from errors.
- Restore works on a clean install.
- No sensitive transaction details appear in routine logs.
- Privacy disclosures match actual code and network behavior.

---

## 8. Reliability and Android engineering improvements

Preserve the existing Kotlin, Compose, Room, DataStore, Coroutines/Flow, Hilt, and module structure unless repository inspection demonstrates a concrete reason to change it.

### P0 engineering checks
- Verify a clean clone can sync, compile, test, and build reproducibly.
- Resolve existing Gradle/KSP/build failures before feature work.
- Keep financial calculations in testable domain code, not UI composables.
- Use a single source of truth for ledger entries.
- Use safe monetary representations.
- Test Room migrations from supported previous schemas.
- Ensure imports and restores cannot silently duplicate or destroy data.
- Test offline operation for all essential local features.
- Ensure background recurring-payment logic is idempotent.
- Test date boundaries, time zones, leap years, negative/zero values, and multi-currency formatting.
- Audit permissions, network calls, crash reporting, and sensitive logs.
- Run unit tests, lint/static analysis, and appropriate UI/instrumentation tests in CI.
- Test startup, scrolling, and common actions on modest Android devices.
- Keep the app usable with large font settings and accessibility services.

### Architecture guidelines
- Keep business rules separate from Compose UI.
- Use predictable state and event handling.
- Avoid duplicate calculations across dashboard components.
- Make repositories and use cases easy to test.
- Avoid adding a backend unless a specific, validated feature requires one.
- Preserve upstream license and attribution requirements for fork-derived code.
- Document build, test, and release commands accurately.

---

## 9. Visual polish without changing product identity

Improve the current design system rather than applying a new aesthetic everywhere.

- Consistent spacing, typography, colors, iconography, and component behavior.
- Clear distinction between income, expenses, transfers, budgets, and planned payments.
- Light/dark themes with tested contrast.
- Consistent charts and date filters.
- Accessible labels and touch targets.
- Clear confirmation for destructive actions.
- Helpful loading, empty, error, and offline states.
- Avoid unnecessary gradients, excessive animation, or dashboard clutter.
- Capture real screenshots of the implemented app for README and store listings.
- Do not show mock features in screenshots as if they were shipped.

---

## 10. Prioritized implementation plan

### P0 — Make existing features dependable
1. Audit actual feature implementation against README.
2. Fix build/test issues.
3. Verify ledger arithmetic, transfers, balances, and reports.
4. Test recurring/planned payment behavior.
5. Verify Room migrations and data recovery.
6. Improve transaction entry and core dashboard hierarchy.
7. Audit local data, network calls, logs, permissions, and privacy claims.
8. Add meaningful tests for the existing core flows.

### P1 — Make existing features more useful
1. Add the Safe-to-Spend / Upcoming Cash-Flow View.
2. Add a simple what-if purchase scenario.
3. Improve budget explanations and history.
4. Improve goal projections.
5. Improve transaction templates and explainable category rules.
6. Improve import/export and backup UX.
7. Add a concise, traceable monthly financial summary.

### P2 — Polish based on real user feedback
1. Optional widgets and reminders.
2. Additional import formats.
3. More accessibility and localization improvements.
4. Optional sync only if requested and designed securely.
5. Additional customization that users actually ask for.

Do not implement all P1/P2 items before the existing app is stable.

---

## 11. Validation and success metrics

Measure:
- Time to record a transaction.
- Transaction editing/deletion error rate.
- Transfer/report correctness.
- Recurring payment duplication or missed-occurrence rate.
- Import/export and restore success.
- User understanding of dashboard totals.
- Usage of planned payments, budgets, and goals.
- Safe-to-Spend comprehension and correction rate.
- Weekly retention.
- Crash rate and data-loss incidents.
- User trust in the privacy explanation.

Use feedback from people who did not build the app. Do not treat downloads alone as proof of success.

---

## 12. Store and documentation readiness

- Add real screenshots for the current implemented features.
- Keep the README feature list accurate.
- State clearly that the app is local-first and explain exceptions.
- Ensure the privacy policy matches actual behavior.
- Verify the license and attribution obligations for the Ivy Wallet-derived code.
- Provide support and bug-reporting instructions.
- Test the release build on multiple Android versions and screen sizes.
- Do not claim a feature is complete until its full workflow has been tested.

---

## Final instruction to the coding agent

Inspect the current repository before making changes. Map each recommendation to existing files/modules and classify it as **already implemented**, **partially implemented**, **missing**, or **unsafe/unverified**.

Preserve Sanchay's current personal-finance direction, branding, working features, and architecture. Do not rewrite the app or remove features to make room for a new concept. Implement the highest-priority verified gaps incrementally, add regression tests, and report exactly what changed and what remains unverified.
