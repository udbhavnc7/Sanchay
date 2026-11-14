import type { PlannedPayment, SavingsGoal } from '../types/finance';
import { buildGoalProjection } from './goalProjection';
import { addMoney, compareMoney, fromMinorUnits, subtractMoney, sumMoney, toMinorUnits } from './money';
import { expandOccurrences, localCalendarDate, MAX_DISPLAY_OCCURRENCES } from './recurrence';

export const SAFE_TO_SPEND_HORIZON_DAYS = 30;

export interface SafeToSpendInput {
  availableBalance: number;
  remainingBudget: number;
  goals: SavingsGoal[];
  plannedPayments: PlannedPayment[];
  now?: Date;
  buffer?: number;
  horizonDays?: number;
  whatIfOutflow?: number;
}

export interface SafeToSpendResult {
  availableBalance: number;
  remainingBudget: number;
  goalCommitments: number;
  plannedOutflows: number;
  plannedInflows: number;
  buffer: number;
  safeToSpend: number;
  shortfall: number;
  horizonDays: number;
  upcoming: (PlannedPayment & { occurrenceKey: string })[];
  occurrenceCount: number;
  warnings: string[];
  missingPlannedPayments: boolean;
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function nonNegative(amount: number): number {
  return compareMoney(amount, 0) < 0 ? 0 : amount;
}

export function buildSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const now = input.now ?? new Date();
  const horizonDays = Math.max(0, Math.round(input.horizonDays ?? SAFE_TO_SPEND_HORIZON_DAYS));
  const buffer = nonNegative(input.buffer ?? 0);
  const start = startOfDay(now);
  // Calendar-day arithmetic, not start + N*86,400,000ms: millisecond stepping
  // shifts the endpoint by an hour across DST transitions and drops the final
  // horizon day (verified failing under TZ=America/New_York).
  const horizonLastDay = new Date(start);
  horizonLastDay.setDate(start.getDate() + Math.max(0, horizonDays - 1));
  const end = endOfDay(horizonLastDay);

  const goalCommitments = sumMoney(
    input.goals.map((goal) => buildGoalProjection(goal, now).requiredMonthly ?? 0)
  );

  const seen = new Set<string>();
  const warnings: string[] = [];
  let upcoming: SafeToSpendResult['upcoming'] = [];
  let occurrenceCount = 0;
  let outflowMinor = 0;
  let inflowMinor = 0;
  let uncertainOutflows = false;
  const earliest = new Date('0001-01-01T12:00:00');
  for (const payment of input.plannedPayments) {
    // The dashboard balance/budgets/goals are INR; never treat a foreign amount as INR.
    if ((payment.currency ?? 'INR') !== 'INR' || seen.has(payment.id)) continue;
    seen.add(payment.id);
    const expansion = expandOccurrences(payment, payment.direction === 'out' ? earliest : start, end);
    if (expansion.warning) warnings.push(`${payment.title}: ${expansion.warning}`);
    if (expansion.warning && !expansion.truncated && payment.direction === 'out') uncertainOutflows = true;
    occurrenceCount += expansion.totalCount;
    const minor = toMinorUnits(payment.amount) * expansion.totalCount;
    if (payment.direction === 'out') outflowMinor += minor;
    else inflowMinor += minor;
    upcoming.push(...expansion.occurrences.map((occurrence) => ({
      ...payment, dueDate: occurrence.date, occurrenceKey: occurrence.occurrenceKey,
    })));
    // Bound memory across many series, retaining the oldest obligations for display.
    upcoming.sort((a, b) => (localCalendarDate(a.dueDate) ?? '').localeCompare(localCalendarDate(b.dueDate) ?? '') || a.occurrenceKey.localeCompare(b.occurrenceKey));
    upcoming = upcoming.slice(0, MAX_DISPLAY_OCCURRENCES);
  }
  if (occurrenceCount > upcoming.length) warnings.push(`Showing ${upcoming.length} of ${occurrenceCount} planned occurrences; all are included in totals.`);
  const plannedOutflows = fromMinorUnits(outflowMinor);
  const plannedInflows = fromMinorUnits(inflowMinor);

  const afterObligations = subtractMoney(
    subtractMoney(
      subtractMoney(input.availableBalance, input.remainingBudget),
      goalCommitments
    ),
    plannedOutflows
  );
  const whatIfOutflow = nonNegative(input.whatIfOutflow ?? 0);
  const rawSafe = subtractMoney(
    subtractMoney(addMoney(afterObligations, plannedInflows), buffer),
    whatIfOutflow
  );
  const safeToSpend = uncertainOutflows ? 0 : nonNegative(rawSafe);

  return {
    availableBalance: input.availableBalance,
    remainingBudget: input.remainingBudget,
    goalCommitments,
    plannedOutflows,
    plannedInflows,
    buffer,
    safeToSpend,
    shortfall: compareMoney(rawSafe, 0) < 0 ? subtractMoney(0, rawSafe) : 0,
    horizonDays,
    upcoming,
    occurrenceCount,
    warnings,
    missingPlannedPayments: occurrenceCount === 0,
  };
}
