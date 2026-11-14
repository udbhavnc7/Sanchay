# Design — Recurring (scheduled) planned payments

Status: **implemented 2026-11-14** (`web/src/utils/recurrence.ts`,
`web/src/components/PlannedPaymentsSection.tsx`, `recurrence.test.ts`). Created 2026-11-09.
Scope follows the UPI compliance spec: Path A only — *estimates and local bookkeeping, never money
movement*. The shipped version adds pause/resume and per-occurrence skip; there are no reminders
or automatic ledger writes.

## 1. Problem

`PlannedPayment` is one-time only (`web/src/types/finance.ts:96–105`: single `dueDate`, no rule).
The README lists "recurring schedules, automatic occurrence generation, and bill reminders" as
missing. Users with rent/salary/subscriptions must re-enter the same item every period, and the
safe-to-spend estimate (`web/src/utils/safeToSpend.ts:61–74`) can only count a single entry no
matter how many times it will actually hit inside the 30-day horizon.

## 2. Goals (v1)

1. Attach a recurrence rule to a planned payment; expand it into concrete occurrences.
2. Safe-to-spend and the Plan tab count/show every occurrence inside their windows.
3. Zero data loss: existing one-time rows and backups keep working with no migration step.
4. Full test coverage of the expansion math (month-end clamping is the classic bug).

## 3. Non-goals (explicit)

- **No automatic payments, transfers, or UPI interaction of any kind** (Path A rule).
- No auto-marking occurrences as paid, no auto-created transactions (Phase 2, §8).
- No push/SMS/native WorkManager reminders (native reminder stack is inherited, not wired to
  the dashboard — wiring it is a separate project).
- No cloud sync, no new permissions, no network.
- No nth-weekday rules ("last Friday"), no custom calendars, no per-occurrence amount overrides.

## 4. Data model

```ts
// web/src/types/finance.ts
export interface RecurrenceRule {
  freq: 'weekly' | 'monthly' | 'yearly';
  interval: number;        // every N weeks/months/years; integer >= 1 (default 1)
  endDate?: string;        // ISO date, inclusive; series stops after this occurrence
}

export interface PlannedPayment {
  // ...existing fields unchanged...
  recurrence?: RecurrenceRule;   // absent => one-time (today's behaviour, exact)
}
```

- **Additive and optional ⇒ no `STORAGE_VERSION` bump.** Old readers ignore the extra key
  (validators check required fields, they do not reject unknown ones); new readers see
  `recurrence === undefined` for every existing row and backup.
- `isPlannedPayment` (`persistence.ts:186–201`) gains an optional shape check for `recurrence`
  (freq whitelisted, integer interval ≥ 1, valid `endDate` if present) — a malformed rule rejects
  the file, consistent with the existing strict-validator style.
- Exports/imports need no change: `plannedPayments` already round-trip through
  `createPersistedState`/`createBackupState`.

## 5. Occurrence expansion (pure utility)

New `web/src/utils/recurrence.ts`:

```ts
expandOccurrences(
  payment: PlannedPayment,
  windowStart: Date,      // inclusive
  windowEnd: Date,        // inclusive
  cap = 400               // hard safety bound
): { date: string; occurrenceKey: string }[]  // sorted ascending
```

Rules:

- **Anchor** = the row's `dueDate` (first occurrence), then step by `interval`.
- **Monthly day-of-month with clamping**: day 31 in a 30-day month → last day of that month
  (2026-01-31 → 02-28 → 03-31 → 04-30). The *original* day is remembered as the series anchor so
  clamping never drifts the series (do **not** re-anchor to the clamped date).
- **Yearly**: same clamping for 29 Feb (2028-02-29 series → 2029-02-28 → 2030-02-28…).
- **DST-safe**: do all stepping in UTC date parts derived from the `YYYY-MM-DD` string; never add
  milliseconds to a local timestamp.
- **endDate**: stop after the first occurrence > `endDate`.
- **Window + cap**: only emit occurrences inside `[windowStart, windowEnd]`; stop at `cap`
  occurrences (defensive against `interval`/`endDate` mistakes) and surface nothing silently —
  a capped series still renders "…" in the UI.
- One-time payments (no rule) are handled by the existing code path unchanged; `expandOccurrences`
  on a rule-less row returns `[{ date: dueDate, ... }]` so callers can use one path.

## 6. Consumers

### 6.1 Safe-to-spend (`safeToSpend.ts`)

Replace the direct `plannedPayments` filter (lines 61–67) with:

1. Expand each payment into occurrences within `[start − lookback, end]`
   (`lookback` = 31 days so past-due recurring outflows keep counting exactly like past-due
   one-time rows do today — preserves current semantics).
2. Apply the existing window rules to occurrence dates instead of `dueDate`.
3. Deduplicate by `occurrenceKey`; cap total occurrences (400) before summing.

`upcoming` (returned for display) switches to occurrence objects; `missingPlannedPayments` and all
money fields keep their current meanings. Existing safe-to-spend tests must pass unmodified
(one-time rows expand to themselves) — that is the regression gate.

### 6.2 Plan tab (`PlannedPaymentsSection.tsx`)

- Add-form: a "Repeat" selector — `Does not repeat | Weekly | Monthly | Yearly`, an optional
  "every N" stepper (hidden for N=1), and an optional "Until" date.
- Series row: title + `Monthly · next on 12 Jan` (or `last occurrence12 Jan 2027` when
  `endDate` set). Editing a row edits the *series* (its next occurrence date is the anchor).
- Per-occurrence display is Phase 2 (§8); v1 shows the series with its next due date plus the
  expanded count inside the safe-to-spend tooltip ("includes 3 recurring payments").

### 6.3 Persistence & import

- `isPlannedPayment` optional `recurrence` validation (§4).
- Backup import preview (`App.tsx` `pendingImport`) shows recurrence counts
  ("2 planned payments, 1 recurring series").

## 7. Test plan (all vitest, pure functions)

| Case | Assertion |
|---|---|
| weekly ×2, 30-day window | correct date list, sorted, within window |
| monthly day-31 clamping | Jan 31 → Feb 28 → Mar 31 → Apr 30 (no drift) |
| yearly 29 Feb clamping | non-leap years → Feb 28, anchor preserved |
| `endDate` inclusive/exclusive boundary | stops exactly at rule |
| window bounds | occurrences outside `[start, end]` never emitted |
| cap | 400 max, no infinite loop when `interval`/dates misused |
| malformed rule in backup | `parsePersistedState` → null |
| one-time back-compat | old backup (no `recurrence`) loads; expands to itself |
| safe-to-spend | 30-day window counts every in-window occurrence once; existing tests unchanged |
| export/import round-trip | `recurrence` survives `createBackupState` → JSON → `parsePersistedState` |

## 8. Phase 2 (out of scope, recorded so it is not invented later)

- Per-occurrence list with "record as paid" that creates a transaction **linked to the occurrence
  key**, labelled with the same honesty copy as Path A ("recorded by you — not verified"), guarded
  against double-recording like `confirmPaymentAttempt`.
- Optional native local reminders (inherited alarm/notification stack) — separate design, needs
  on-device verification.

## 9. Docs to update on implementation

README limitations bullet (line ~102) + Roadmap item; privacy panel planned-payments wording;
inventory §1 (store contents); release checklist §5 item ticks with test evidence.
