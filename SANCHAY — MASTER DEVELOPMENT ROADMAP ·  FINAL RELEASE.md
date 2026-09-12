# SANCHAY
## Personal Financial Operating System
### Master Development Roadmap — Remaining Development

---

# 0. PROJECT NORTH STAR

Sanchay is not intended to be merely a renamed or visually modified Ivy Wallet.

The product goal is:

> **A calm, intelligent Personal Financial Operating System that helps people capture, understand, plan, commit, protect and control their money.**

The core loop is:

**CAPTURE → UNDERSTAND → PLAN → COMMIT → PROTECT → CONTROL → IMPROVE**

Sanchay should eventually answer three questions better than a conventional expense tracker:

1. **What happened to my money?**
2. **What is going to happen to my money?**
3. **What should I pay attention to?**

The application must remain practical, understandable, deterministic where possible, privacy-conscious and reliable.

---

# 1. CURRENT STATUS

## Completed

Phases 1–18 have been implemented across:

- Sanchay design system
- launch/splash
- application shell
- Home
- Quick Add
- Smart Categorization
- Recurring Payments
- Budgets
- Goals
- Cash Flow Forecasting
- Financial Pacts
- Purchase Protection
- True Cost
- Financial Rules & Guardrails
- Can-I-Afford
- Sanchay Agent
- System Integrity Audit
- Private Financial Profile

Phase 19 / Release Candidate work exposed build issues.

## Phase 19B — BUILD RECOVERY

Phase 19B is now COMPLETE.

Verified:

- zero Kotlin compilation errors
- zero KSP/Hilt compilation blockers
- `assembleDebug` succeeds
- APK produced
- APK installed
- Sanchay launches
- basic navigation works
- no destructive architecture migration

Approximately 20 shared UI files and several feature/app files were repaired using real Compose APIs and minimal architectural changes.

The existing financial architecture was preserved.

---

# 2. CRITICAL DEVELOPMENT RULE

From this point onward:

> **Do not start the next phase merely because code was written.**

Every phase must follow:

**INSPECT → DESIGN → IMPLEMENT → TEST → COMPILE → INSTALL → VERIFY → DOCUMENT**

A phase is complete only when its implementation works with the existing application.

Never claim completion based solely on source-code generation.

---

# 3. ARCHITECTURAL PRINCIPLES

These rules apply to EVERY remaining phase.

## Preserve existing architecture

Do not unnecessarily change:

- `applicationId`
- namespace
- `com.ivy.*` package names
- Room entity identifiers
- serialization identifiers
- DataStore identifiers
- Firebase configuration
- backup/import identifiers
- existing navigation architecture

unless a deliberate, tested migration is genuinely necessary.

## One source of financial truth

Do not create duplicate financial calculation engines.

For example:

- Cash Flow remains authoritative for cash-flow calculations.
- Budget system remains authoritative for budgets.
- Goal system remains authoritative for goals.
- Pact system remains authoritative for Pact balances.
- Transaction system remains authoritative for transactions.

New layers should orchestrate or consume existing truth.

## Deterministic first

Prefer:

- rules
- formulas
- existing financial engines
- structured data
- explicit user configuration

over unnecessary AI/LLM behavior.

AI must never invent financial facts.

## No autonomous money movement

Sanchay must not independently:

- transfer money
- pay bills
- send money
- delete financial records
- silently modify financial data

without an explicit user-controlled confirmation flow.

## Privacy first

Financial information is sensitive.

Do not introduce:

- public financial profiles
- unnecessary cloud storage
- unnecessary external APIs
- unnecessary telemetry
- sharing by default

---

# PHASE 20
# SANCHAY INTELLIGENCE 2.0

## Objective

Transform Sanchay from a financial tracker into a system that actively identifies meaningful financial situations.

The principle:

> **Ivy tells me what happened. Sanchay tells me what matters.**

---

## 20.1 Intelligence Architecture

Create a unified intelligence/orchestration layer.

Conceptually:

Existing Financial Systems
↓
Financial Intelligence Engine
↓
Financial Signals
↓
Prioritization
↓
Deduplication
↓
Home / Insights / Notifications / Agent

The Intelligence Engine must NOT become another financial source of truth.

---

## 20.2 Financial Signal Model

Create a structured signal model containing appropriate fields such as:

- signal ID/type
- severity
- title
- explanation
- evidence
- related entity
- timestamp/context
- recommended action
- deduplication identity
- lifecycle state

Possible states:

- ACTIVE
- DISMISSED
- SNOOZED
- RESOLVED

---

## 20.3 Intelligence Categories

### Cash Flow

Detect:

- projected low balance
- projected negative balance
- upcoming cash-flow pressure
- clustered commitments
- improving cash-flow position

### Budgets

Detect:

- approaching budget limit
- exceeded budget
- spending pacing too quickly
- budget recovery

### Goals

Detect:

- goal behind pace
- goal approaching target
- goal completed
- meaningful progress
- projected completion changes

### Recurring Payments

Detect:

- upcoming recurring payment
- recurring payment clusters
- recurring cost increase
- growing fixed commitments

### Financial Pacts

Detect:

- Pact due soon
- Pact overdue
- clustered Pact repayments
- Pact completion
- outstanding obligation requiring attention

### Purchase Protection

Detect:

- return deadline approaching
- warranty deadline approaching
- important purchase requiring attention

### Spending Patterns

Where data supports it, detect:

- meaningful category increase
- meaningful category decrease
- recurring spending growth
- spending concentration

Do not make trivial observations into "insights."

### Positive Intelligence

Also surface:

- completed goals
- completed Pacts
- recovered budgets
- strong progress
- milestones

Sanchay should not feel like a warning machine.

---

## 20.4 Prioritization

Create deterministic prioritization.

Potential levels:

- CRITICAL
- HIGH
- MEDIUM
- LOW
- POSITIVE

Consider:

- severity
- financial impact
- time sensitivity
- deadline proximity
- user rules
- resolution status

Home should normally surface only the most important 1–3 signals.

---

## 20.5 Home Integration

Add:

### Sanchay Intelligence

Possible sections:

**Needs Your Attention**

**Upcoming**

**Progress**

Keep this compact.

Do not turn Home into a wall of cards.

Every signal should lead to the relevant feature.

---

## 20.6 Insights

Create:

### Financial Briefing

Sections:

- TODAY
- NEEDS ATTENTION
- UPCOMING
- THIS PERIOD
- LOOKING AHEAD
- PROGRESS

The purpose is understanding, not displaying maximum analytics.

---

## 20.7 Notifications

Only high-value events should create notifications.

Examples:

- important deadline
- serious projected cash-flow issue
- overdue Pact
- return deadline
- important user rule

Avoid notification spam.

---

## 20.8 Agent Integration

Extend Sanchay Agent so it can answer:

- What needs my attention?
- What's coming up?
- How are my goals doing?
- Why is my projected balance low?
- Give me my financial briefing.

The Agent must consume the same Intelligence Engine.

Never create a second intelligence implementation.

---

## 20.9 Testing

Test:

- every signal type
- prioritization
- deduplication
- dismissal
- snooze
- resolution
- conflicting signals
- empty state
- large datasets
- Agent consistency
- notification deduplication

Also verify:

**Existing Engine Truth = Intelligence Truth**

---

# PHASE 21
# MONEY 2.0 — COMPLETE MONEY WORKSPACE

## Objective

Turn MONEY from a transaction area into a comprehensive financial workspace.

---

# 21.1 Accounts

Improve support for:

- cash
- bank accounts
- wallets
- savings accounts
- credit cards
- other financial accounts
- assets/liabilities where the existing architecture supports them

Provide:

- account balances
- account history
- account-specific analytics
- archive/deactivate
- account details

---

# 21.2 Transaction Workspace

Upgrade transaction management with:

- search
- filters
- date ranges
- categories
- accounts
- amount ranges
- recurring status
- notes
- tags
- attachments
- linked purchases
- linked Pacts

---

# 21.3 Transaction Detail

Turn each transaction into a complete financial record.

Potential information:

- amount
- type
- account
- category
- date
- notes
- attachment
- purchase relationship
- Pact relationship
- recurring relationship
- relevant history

---

# 21.4 Search

Build deterministic financial search.

Examples:

> Amazon

> transactions above ₹2,000

> food last month

> HDFC

> recurring expenses

> purchases

Search should operate across appropriate financial entities where practical.

---

# 21.5 Transfers

Ensure transfers:

- move money correctly
- do not become artificial income
- do not become artificial spending
- maintain correct account balances
- appear correctly in history

---

# 21.6 Categories

Improve category management where appropriate:

- category organization
- custom categories
- category icons
- category filtering
- category usage information

Do not break historical transaction categorization.

---

# 21.7 Credit Cards

Where architecture supports it, improve:

- card balance
- spending
- repayment/settlement representation
- statement-related organization
- account relationships

Do not pretend to provide bank-level card synchronization unless actually implemented.

---

# 21.8 Money Analytics

Provide useful views such as:

- spending by category
- spending by account
- income vs expense
- transaction trends
- recurring spending
- largest spending areas

Reuse existing analytics engines where possible.

---

# 21.9 Testing

Test:

- transactions
- income
- expenses
- transfers
- account balances
- categories
- search
- filters
- attachments
- large datasets
- historical data
- backup compatibility

---

# PHASE 22
# PLAN & COMMIT 2.0

## Objective

Unify:

**Budgets + Goals + Recurring Payments + Planned Payments + Financial Pacts**

into a coherent financial planning system.

---

# 22.1 Financial Timeline

Create a planning timeline/calendar.

Show:

- expected income
- bills
- recurring payments
- Pact repayments
- goal milestones
- planned payments
- financial deadlines

The user should be able to answer:

> **"What is my financial month going to look like?"**

---

# 22.2 Planning View

Create a unified planning screen.

Possible structure:

### TODAY

### THIS WEEK

### THIS MONTH

### NEXT MONTH

Each event should link to its source.

---

# 22.3 Goals 2.0

Upgrade Goals with:

- milestones
- target dates
- contribution history
- progress
- pace
- projected completion
- priority
- completion state

Ensure Goal progress remains consistent with the existing Goal architecture.

---

# 22.4 Budget 2.0

Improve:

- commitment-aware budgeting
- pacing
- projected budget health
- recovery states
- historical comparison
- goal-aware planning where appropriate

Do not duplicate budget calculations.

---

# 22.5 Recurring Payments

Improve:

- upcoming schedule
- recurring cost overview
- renewal awareness
- monthly/annual cost representation
- missed/changed pattern detection

---

# 22.6 Financial Pacts 2.0

Develop Pacts into a robust commitment lifecycle.

Possible lifecycle:

**PROPOSED → CONFIRMED → ACTIVE → DUE → PARTIALLY PAID → COMPLETED / OVERDUE**

Support:

- repayment schedules
- outstanding amount
- evidence
- notes
- timeline
- reminders
- completion
- overdue state

Never automatically create a transaction merely because a Pact becomes due.

---

# 22.7 Planning Intelligence

Connect planning systems with Intelligence.

Examples:

Multiple commitments cluster together
→ Intelligence highlights cash-flow pressure.

Goal is behind
→ Intelligence explains pace.

Budget is recovering
→ Intelligence can recognize positive progress.

---

# 22.8 Testing

Test:

- timeline ordering
- recurring schedules
- goal milestones
- Pact lifecycle
- budget integration
- cash-flow consistency
- intelligence consistency
- date/time edge cases

---

# PHASE 23
# FINANCIAL CONTROL CENTER

## Objective

Create the layer that allows users to define how Sanchay should watch and protect their financial behavior.

---

# 23.1 Rules

Expand Financial Rules.

Support appropriate rule types such as:

- spending threshold
- category threshold
- low balance
- projected balance
- recurring cost increase
- goal protection
- commitment protection
- budget protection
- custom user-defined conditions where practical

---

# 23.2 Guardrails

Examples:

> Warn me before dining spending exceeds ₹5,000.

> Alert me when projected balance falls below ₹3,000.

> Notify me when recurring expenses increase.

Guardrails should be user-controlled.

---

# 23.3 Notification Center

Create a centralized attention system.

Sections:

### NEEDS ATTENTION

### UPCOMING

### WARNINGS

### COMPLETED

### DISMISSED / SNOOZED

Ensure notifications generated by Intelligence and Rules do not duplicate each other unnecessarily.

---

# 23.4 Permission Center

Create:

### Sanchay Permissions

Show what the Agent can access.

For example:

READ:

- transactions
- accounts
- budgets
- goals
- Pacts
- purchases

DRAFT:

- transactions
- budgets
- rules

EXECUTE:

- unavailable unless deliberately implemented with explicit confirmation

Make permission boundaries understandable.

---

# 23.5 Agent Safety

Maintain:

**READ → DRAFT → USER CONFIRMATION → EXECUTE**

Never:

- silently change financial records
- automatically transfer money
- automatically pay bills
- perform irreversible actions without confirmation

---

# 23.6 Rule Testing

Test:

- threshold rules
- date rules
- budget rules
- balance rules
- recurring rules
- notification deduplication
- permission enforcement
- Agent interaction

---

# PHASE 24
# SANCHAY SEARCH & UNIVERSAL EXPERIENCE

## Objective

Make the entire app feel like one coherent system.

---

# 24.1 Global Search

Create a unified search surface covering appropriate:

- transactions
- accounts
- budgets
- goals
- recurring payments
- Pacts
- purchases
- rules
- insights

Search results should be grouped intelligently.

---

# 24.2 Universal Quick Action

Create a universal action entry point.

Possible actions:

- Add expense
- Add income
- Transfer
- Create goal
- Create budget
- Create Pact
- Add purchase
- Create rule
- Ask Sanchay Agent

The existing Quick Add remains the fastest transaction path.

---

# 24.3 Contextual Navigation

Whenever the user sees information, provide a natural route to its source.

For example:

Intelligence
→ Budget

Budget
→ related transactions

Transaction
→ Purchase

Purchase
→ Warranty/return

Pact
→ repayment timeline

Goal
→ contribution history

---

# 24.4 Empty States

Every major feature should have:

- useful empty state
- explanation
- clear CTA
- no confusing dead end

---

# 24.5 Error States

Every important flow should handle:

- loading
- failure
- missing data
- invalid input
- unavailable feature
- database errors

Do not show raw exceptions to users.

---

# 24.6 Onboarding

Create a polished first-run experience.

Possible flow:

WELCOME
→ Financial setup
→ Accounts
→ Basic preferences
→ Goals
→ Notifications
→ Privacy
→ HOME

Do not force users through unnecessary configuration.

Everything should be skippable where reasonable.

---

# PHASE 25
# SANCHAY AGENT 2.0

## Objective

Turn the Agent into a useful financial interface while keeping it safe and deterministic.

---

# 25.1 Agent Capabilities

Expand supported intents around:

- transaction search
- account information
- budget status
- goal status
- upcoming commitments
- Pacts
- purchases
- cash flow
- intelligence
- financial profile
- rules

---

# 25.2 Natural Financial Queries

Support understandable queries such as:

> How much did I spend on food?

> What's coming up this week?

> Which bills are due soon?

> Am I on track for my goal?

> Why is my projected balance low?

> Show my recent Amazon transactions.

> What needs my attention?

Use deterministic intent routing wherever possible.

---

# 25.3 Draft Actions

Allow safe drafting such as:

> Draft an expense of ₹500 for food.

> Draft a budget for dining.

> Draft a financial rule.

The user must explicitly confirm before persistence.

---

# 25.4 Explainability

Agent responses should explain where financial answers came from.

Example:

> Your projected balance is low because three planned commitments fall within the next 7 days.

Do not produce unexplained financial claims.

---

# 25.5 Agent UI

Improve:

- conversation layout
- suggested questions
- result cards
- linked entities
- confirmation UI
- draft previews
- error handling

---

# 25.6 Agent Safety Tests

Test:

- unauthorized actions
- malformed requests
- ambiguous requests
- destructive actions
- draft confirmation
- read-only queries
- permission restrictions
- incorrect entity matching

---

# PHASE 26
# PRIVACY, SECURITY & DATA OWNERSHIP

## Objective

Make Sanchay trustworthy enough for a serious personal-finance application.

---

# 26.1 App Lock

Audit and improve existing app-lock functionality.

Support appropriate:

- PIN
- biometric authentication where available
- automatic lock timeout
- privacy-safe lock screen

Do not weaken existing security for convenience.

---

# 26.2 Sensitive UI

Ensure sensitive financial information is not unnecessarily exposed through:

- notifications
- screenshots/previews
- recent-app previews
- share flows

Where Android supports privacy controls, use them appropriately.

---

# 26.3 Selective Sharing

Improve Private Financial Profile sharing.

The user should control:

- what is shared
- when it is shared
- how long it is valid
- whether sensitive fields are excluded

Default should be privacy-preserving.

---

# 26.4 Data Export

Provide practical export functionality where the architecture supports it.

Possible formats:

- structured backup
- CSV
- human-readable summary

Ensure exported information is accurate.

---

# 26.5 Backup & Restore

Perform complete testing:

CREATE BACKUP
→ REINSTALL
→ RESTORE
→ VERIFY

Verify:

- transactions
- accounts
- budgets
- goals
- recurring payments
- Pacts
- purchases
- rules
- profile
- supported attachments

---

# 26.6 Data Integrity

Test:

- duplicate records
- partial restoration
- interrupted writes
- invalid data
- migration failures
- corrupted backup handling

Never silently discard user financial data.

---

# PHASE 27
# DATA, MIGRATION & RELIABILITY HARDENING

## Objective

Make Sanchay reliable across years of financial history.

---

# 27.1 Room Migration Audit

Review every migration from the original supported database versions through the current schema.

Verify:

- schema changes
- defaults
- nullability
- indexes
- foreign keys
- serialization
- data preservation

---

# 27.2 Fresh Database Test

Test a completely fresh installation.

---

# 27.3 Upgrade Test

Test supported upgrade paths.

Especially verify old Ivy/Sanchay data.

---

# 27.4 Large Dataset Test

Test with:

- 100 transactions
- 1,000
- 10,000
- 50,000 where practical

Also test:

- many accounts
- many goals
- many Pacts
- many recurring payments
- many purchases
- many rules

---

# 27.5 Performance

Measure:

- cold start
- warm start
- Home loading
- Money list
- Search
- Insights
- Intelligence generation
- database queries
- Agent queries

Avoid blocking the main thread.

---

# 27.6 Crash Resilience

Audit:

- null states
- empty database
- deleted relationships
- migration edge cases
- invalid user input
- process death
- configuration changes

---

# PHASE 28
# PREMIUM UI / UX 2.0

## Objective

Make Sanchay feel like a polished premium consumer application.

This phase is not about adding random features.

It is about making everything already built feel intentional.

---

# 28.1 Design System Audit

Audit:

- typography
- spacing
- shapes
- icons
- buttons
- cards
- text fields
- dialogs
- sheets
- navigation
- charts
- states

Remove inconsistent components.

---

# 28.2 Motion

Add restrained motion where useful:

- transitions
- list insertion
- confirmation
- progress
- navigation
- state changes

Do not sacrifice performance.

---

# 28.3 Financial Visualization

Improve charts for:

- cash flow
- spending
- budget
- goals
- trends

Charts must remain understandable.

Never use visual complexity merely to appear sophisticated.

---

# 28.4 Accessibility

Test:

- TalkBack
- large text
- font scaling
- touch targets
- content descriptions
- semantic labels
- contrast
- color-independent status

---

# 28.5 Themes

Verify:

- Light
- Dark
- AMOLED

No unreadable text.

No broken cards.

No hardcoded colors that violate the design system.

---

# 28.6 Responsive UI

Verify:

- different phone sizes
- portrait
- landscape where appropriate
- tablets if architecture supports them

---

# PHASE 29
# FINANCIAL INSIGHTS & ANALYTICS 2.0

## Objective

Make Insights genuinely useful rather than a collection of charts.

---

# 29.1 Historical Analysis

Provide useful views for:

- spending trends
- income trends
- category trends
- recurring costs
- cash-flow history
- net worth where supported

---

# 29.2 Period Comparison

Allow comparisons such as:

- this month vs previous month
- this quarter vs previous quarter
- current period vs historical average

Avoid misleading comparisons when insufficient data exists.

---

# 29.3 Spending Behavior

Highlight meaningful patterns.

Examples:

- major category growth
- recurring-cost growth
- spending concentration
- unusually high periods

Do not label normal variation as a problem.

---

# 29.4 Financial Milestones

Surface positive progress:

- first goal completion
- debt/obligation completion
- budget recovery
- savings milestones
- consistency milestones

Keep it private and user-focused.

---

# PHASE 30
# COMPLETE END-TO-END PRODUCT INTEGRATION

## Objective

At this point, stop thinking feature-by-feature.

Test Sanchay as ONE product.

---

# 30.1 Core User Journey

Verify:

Install
→ Onboarding
→ Account setup
→ Add income
→ Add expenses
→ Create budget
→ Create goal
→ Add recurring payment
→ Create Pact
→ Add purchase
→ View cash flow
→ View Intelligence
→ Ask Agent
→ Create rule
→ Receive notification
→ Review Insights
→ Backup
→ Restore

---

# 30.2 Cross-Feature Relationships

Verify:

Transaction
↔ Account

Transaction
↔ Category

Transaction
↔ Purchase

Transaction
↔ Pact where appropriate

Budget
↔ Transactions

Goal
↔ Contributions

Recurring Payment
↔ Cash Flow

Pact
↔ Cash Flow

Purchase
↔ Protection

Rules
↔ Notifications

All systems
↔ Intelligence

Agent
↔ existing authoritative systems

---

# 30.3 Contradiction Audit

Search for situations where different screens report conflicting information.

Examples:

Home balance ≠ Money balance

Budget total ≠ Budget detail

Goal progress ≠ Goal detail

Pact outstanding amount ≠ Pact detail

Cash-flow projection ≠ Intelligence

Agent answer ≠ underlying data

Fix the source or integration rather than adding patches.

---

# PHASE 31
# RELEASE CANDIDATE 2.0

## Objective

Prepare Sanchay for real-world use.

---

# 31.1 Clean Installation

Test:

- install
- launch
- onboarding
- permissions
- account creation

---

# 31.2 Existing User Upgrade

Test:

old supported database
→ upgrade
→ latest Sanchay

---

# 31.3 Backup/Restore

Test complete round trip.

---

# 31.4 Device Testing

Test on multiple Android devices/emulators where available.

Check:

- different screen sizes
- Android versions
- performance
- notifications
- keyboard behavior
- biometric/app lock
- dark mode

---

# 31.5 Offline Behavior

Because Sanchay is fundamentally a personal finance application, core financial functionality should remain usable without network access where the existing architecture permits it.

Verify:

- transaction creation
- viewing history
- budgets
- goals
- cash flow
- Pacts
- rules
- intelligence

Do not introduce unnecessary network dependency.

---

# 31.6 Error Handling

No critical flow should crash because of:

- empty data
- missing optional information
- temporary failure
- malformed input

---

# PHASE 32
# FINAL SECURITY / PRIVACY / LEGAL AUDIT

Before release, verify:

- GPL-3.0 obligations
- Ivy attribution
- Sanchay modifications clearly distinguishable
- no accidentally removed copyright notices
- no unauthorized third-party assets
- no exposed API keys
- no debug credentials
- no test secrets
- no unnecessary logging of financial information
- no sensitive data accidentally exposed through logs
- privacy behavior is understandable

Do not claim legal compliance beyond what has actually been reviewed.

---

# PHASE 33
# FINAL PLAY STORE PREPARATION

Prepare the application for release.

Audit:

- app name
- icon
- splash
- package configuration
- version
- release build
- signing configuration
- screenshots
- descriptions
- privacy disclosures
- permissions
- data safety information
- support/contact information
- store graphics

Do not publish automatically.

The final publishing decision remains user-controlled.

---

# PHASE 34
# FINAL DEVICE QA

This is the final engineering gate.

Perform actual:

**BUILD → INSTALL → LAUNCH → USE**

on a real device/emulator.

Manually test every major feature.

Minimum checklist:

- Splash
- Onboarding
- Home
- Money
- Quick Add
- Accounts
- Transactions
- Transfers
- Budgets
- Goals
- Recurring Payments
- Cash Flow
- Financial Pacts
- Purchases
- True Cost
- Rules
- Can-I-Afford
- Intelligence
- Insights
- Agent
- Profile
- Search
- Notifications
- Backup
- Restore
- Settings
- App Lock
- Dark Mode
- AMOLED
- Large Font

Fix all release-blocking issues.

---

# PHASE 35
# FINAL PRODUCT POLISH

Only after the application is stable.

Review every screen asking:

### Is this necessary?

### Is this understandable?

### Is this visually consistent?

### Is this useful?

### Is the next action obvious?

### Does this feel like Sanchay rather than Ivy?

Remove unnecessary complexity.

This phase may involve deleting or simplifying features rather than adding them.

---

# FINAL PRODUCT STRUCTURE

When all phases are complete, Sanchay should conceptually contain:

## MONEY

- Accounts
- Transactions
- Transfers
- Categories
- Credit Cards
- Search
- History

## UNDERSTAND

- Dashboard
- Insights
- Financial Briefing
- Analytics
- Trends
- Cash Flow
- Intelligence

## PLAN

- Budgets
- Goals
- Recurring Payments
- Planned Payments
- Financial Timeline

## COMMIT

- Financial Pacts
- Repayments
- Shared Expenses
- Obligations
- Evidence
- Commitment Timeline

## PROTECT

- Purchases
- Receipts
- Return Deadlines
- Warranty
- True Cost

## CONTROL

- Rules
- Guardrails
- Notifications
- Permissions
- App Lock

## AGENT

- Financial Questions
- Search
- Explanations
- Briefings
- Draft Actions
- Confirmed Actions where explicitly supported

## OWN

- Private Financial Profile
- Selective Sharing
- Backup
- Restore
- Export
- Data Ownership

---

# WHAT SANCHAY MUST NOT BECOME

Do NOT add features simply to increase feature count.

Avoid:

- crypto
- unnecessary blockchain
- social-media finance
- public financial profiles
- autonomous payments
- investment-advisor claims
- fake AI
- unnecessary LLM dependencies
- unnecessary cloud requirements
- gamification that trivializes finances
- excessive notifications
- dozens of meaningless charts
- duplicate financial engines
- duplicate databases
- feature bloat

---

# DEFINITION OF DONE

The project is not finished when:

> "The agent says all features are implemented."

It is finished when:

### FUNCTIONAL

Every major feature works.

### FINANCIAL

Calculations remain internally consistent.

### ARCHITECTURAL

No unnecessary duplicate truth exists.

### RELIABLE

Fresh installs, upgrades and migrations work.

### PRIVATE

User financial data is appropriately protected.

### ACCESSIBLE

The application works for different users and text sizes.

### FAST

Normal and large datasets remain usable.

### VISUAL

The UI feels cohesive and premium.

### DEVICE

The actual APK installs and works.

### PRODUCT

A new user can understand why Sanchay exists.

---

# MASTER EXECUTION ORDER

Execute strictly in this order:

**19B — BUILD RECOVERY — COMPLETE**

↓

**20 — INTELLIGENCE 2.0**

↓

**21 — MONEY 2.0**

↓

**22 — PLAN & COMMIT 2.0**

↓

**23 — FINANCIAL CONTROL CENTER**

↓

**24 — SEARCH & UNIVERSAL EXPERIENCE**

↓

**25 — AGENT 2.0**

↓

**26 — PRIVACY, SECURITY & DATA OWNERSHIP**

↓

**27 — DATA, MIGRATION & RELIABILITY**

↓

**28 — PREMIUM UI/UX 2.0**

↓

**29 — INSIGHTS & ANALYTICS 2.0**

↓

**30 — COMPLETE END-TO-END INTEGRATION**

↓

**31 — RELEASE CANDIDATE 2.0**

↓

**32 — SECURITY / PRIVACY / LEGAL AUDIT**

↓

**33 — PLAY STORE PREPARATION**

↓

**34 — FINAL DEVICE QA**

↓

**35 — FINAL PRODUCT POLISH**

---

# IMPORTANT AGENT INSTRUCTION

Do not implement all phases in one uncontrolled operation.

Use this document as the master specification.

At the beginning of each phase:

1. Read the relevant phase.
2. Inspect the actual repository.
3. Identify existing implementations.
4. Implement only that phase.
5. Integrate with existing systems.
6. Test continuously.
7. Build.
8. Install.
9. Verify.
10. Report exact results.
11. Only then proceed to the next phase.

If a phase exposes an architectural problem, stop and resolve the problem before continuing.

Do not hide errors.

Do not report "complete" if the feature has not been compiled and verified.

---

# FINAL PRODUCT VISION

Sanchay should ultimately feel like this:

> **You don't merely record where your money went.**
>
> **Sanchay helps you understand where you are, what is coming, what you have committed to, what needs protection, and what deserves your attention.**

The application should remain calm, private, intelligent and user-controlled.

The goal is not to build the application with the most features.

The goal is to build an application where the features form **one coherent financial system.**