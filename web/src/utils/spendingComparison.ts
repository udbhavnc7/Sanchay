import type { Transaction } from '../types/finance';
import {
  addMoney,
  compareMoney,
  fromMinorUnits,
  subtractMoney,
  toMinorUnits,
} from './money';

export interface ComparisonTotals {
  income: number;
  spending: number;
}

export interface CategoryMovement {
  category: string;
  current: number;
  previous: number;
  delta: number;
}

export interface MonthlyComparison {
  currentLabel: string;
  previousLabel: string;
  current: ComparisonTotals;
  previous: ComparisonTotals;
  spendingDelta: number;
  incomeDelta: number;
  topMovements: CategoryMovement[];
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function windowLabel(start: Date, endExclusive: Date): string {
  const last = new Date(endExclusive.getTime() - 1);
  return `${shortDate(start)}-${last.getDate()}`;
}

function inWindow(date: string, start: Date, endExclusive: Date): boolean {
  const value = new Date(date).getTime();
  return Number.isFinite(value) && value >= start.getTime() && value < endExclusive.getTime();
}

function totalsFor(
  transactions: Transaction[],
  start: Date,
  endExclusive: Date
): ComparisonTotals {
  let income = 0;
  let spending = 0;

  transactions.forEach((tx) => {
    if (tx.status !== 'Completed' || tx.kind === 'transfer') return;
    if (!inWindow(tx.date, start, endExclusive)) return;
    if (tx.type === 'credit') {
      income = addMoney(income, tx.amount);
    } else {
      spending = addMoney(spending, tx.amount);
    }
  });

  return { income, spending };
}

function spendingByCategory(
  transactions: Transaction[],
  start: Date,
  endExclusive: Date
): Map<string, number> {
  const totals = new Map<string, number>();
  transactions.forEach((tx) => {
    if (tx.status !== 'Completed' || tx.kind === 'transfer' || tx.type !== 'debit') return;
    if (!inWindow(tx.date, start, endExclusive)) return;
    totals.set(tx.category, addMoney(totals.get(tx.category) ?? 0, tx.amount));
  });
  return totals;
}

export function buildMonthlyComparison(
  transactions: Transaction[],
  now = new Date()
): MonthlyComparison {
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousEnd = new Date(previousStart);
  previousEnd.setDate(previousEnd.getDate() + now.getDate());
  if (previousEnd.getTime() > currentStart.getTime()) {
    previousEnd.setTime(currentStart.getTime());
  }

  const current = totalsFor(transactions, currentStart, currentEnd);
  const previous = totalsFor(transactions, previousStart, previousEnd);

  const currentCategories = spendingByCategory(transactions, currentStart, currentEnd);
  const previousCategories = spendingByCategory(transactions, previousStart, previousEnd);
  const categories = new Set([
    ...currentCategories.keys(),
    ...previousCategories.keys(),
  ]);

  const topMovements = Array.from(categories)
    .map((category) => {
      const currentAmount = currentCategories.get(category) ?? 0;
      const previousAmount = previousCategories.get(category) ?? 0;
      return {
        category,
        current: currentAmount,
        previous: previousAmount,
        delta: subtractMoney(currentAmount, previousAmount),
      };
    })
    .filter((movement) => compareMoney(movement.delta, 0) !== 0)
    .sort(
      (a, b) =>
        Math.abs(toMinorUnits(b.delta)) - Math.abs(toMinorUnits(a.delta))
    )
    .slice(0, 3);

  return {
    currentLabel: windowLabel(currentStart, currentEnd),
    previousLabel: windowLabel(previousStart, previousEnd),
    current,
    previous,
    spendingDelta: subtractMoney(current.spending, previous.spending),
    incomeDelta: subtractMoney(current.income, previous.income),
    topMovements,
  };
}

export function absoluteMoney(amount: number): number {
  return fromMinorUnits(Math.abs(toMinorUnits(amount)));
}
