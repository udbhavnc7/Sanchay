import type { PlannedPayment, SavingsGoal } from '../types/finance';
import { buildGoalProjection } from './goalProjection';
import { addMoney, compareMoney, subtractMoney, sumMoney } from './money';

export const SAFE_TO_SPEND_HORIZON_DAYS = 30;

export interface SafeToSpendInput {
  availableBalance: number;
  remainingBudget: number;
  goals: SavingsGoal[];
  plannedPayments: PlannedPayment[];
  now?: Date;
  buffer?: number;
  horizonDays?: number;
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
  upcoming: PlannedPayment[];
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
  const end = endOfDay(
    new Date(start.getTime() + Math.max(0, horizonDays - 1) * 24 * 60 * 60 * 1000)
  );

  const goalCommitments = sumMoney(
    input.goals.map((goal) => buildGoalProjection(goal, now).requiredMonthly ?? 0)
  );

  const upcoming = input.plannedPayments
    .filter((payment) => {
      const due = new Date(payment.dueDate).getTime();
      if (!Number.isFinite(due) || due > end.getTime()) return false;
      return payment.direction === 'out' || due >= start.getTime();
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const plannedOutflows = sumMoney(
    upcoming.filter((payment) => payment.direction === 'out').map((payment) => payment.amount)
  );
  const plannedInflows = sumMoney(
    upcoming.filter((payment) => payment.direction === 'in').map((payment) => payment.amount)
  );

  const afterObligations = subtractMoney(
    subtractMoney(
      subtractMoney(input.availableBalance, input.remainingBudget),
      goalCommitments
    ),
    plannedOutflows
  );
  const rawSafe = subtractMoney(addMoney(afterObligations, plannedInflows), buffer);
  const safeToSpend = nonNegative(rawSafe);

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
    missingPlannedPayments: upcoming.length === 0,
  };
}
