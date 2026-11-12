import type { Account, Budget, BudgetPeriod, Transaction } from '../types/finance';
import {
  compareMoney,
  fromMinorUnits,
  monthKey,
  startOfMonth,
  toMinorUnits,
} from './money';
import {
  computeCategorySpending,
  DEFAULT_CURRENCY,
  reportsAccountMap,
  scopeToCurrency,
} from './reporting';

const LEGACY_EFFECTIVE_FROM = '1970-01-01';
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const PERIOD_MONTH_PATTERN = /^\d{4}-\d{2}-01$/;

export interface BudgetLimitForMonth {
  limit: number;
  period: BudgetPeriod;
  color: string;
}

export interface BudgetHistoryRow {
  month: string;
  label: string;
  budgeted: number;
  spent: number;
  budgetedCategories: number;
  over: boolean;
}

export function monthStartIso(month: string): string {
  return `${month}-01`;
}

export function monthKeyOf(date: Date = new Date()): string {
  return monthKey(date);
}

export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return monthKey(new Date());
  }
  return monthKey(new Date(year, monthNumber - 1 + delta, 1));
}

export function formatBudgetMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) return 'Unknown month';
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function isPeriod(value: unknown): value is BudgetPeriod {
  if (!value || typeof value !== 'object') return false;
  const period = value as Partial<BudgetPeriod>;
  return (
    typeof period.id === 'string' &&
    typeof period.limit === 'number' &&
    Number.isFinite(period.limit) &&
    typeof period.effectiveFrom === 'string' &&
    PERIOD_MONTH_PATTERN.test(period.effectiveFrom) &&
    typeof period.createdAt === 'string'
  );
}

export function normalizeBudgetPeriods(budget: Budget): BudgetPeriod[] {
  const stored = Array.isArray(budget.history) ? budget.history.filter(isPeriod) : [];
  if (stored.length === 0) {
    return [
      {
        id: `${budget.id}-legacy`,
        limit: budget.limit,
        effectiveFrom: LEGACY_EFFECTIVE_FROM,
        createdAt: '',
      },
    ];
  }
  return [...stored].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
}

export function budgetLimitForMonth(
  budget: Budget,
  month: string
): BudgetLimitForMonth | null {
  if (!MONTH_PATTERN.test(month)) return null;
  const periods = normalizeBudgetPeriods(budget).filter(
    (period) => period.effectiveFrom.slice(0, 7) <= month
  );
  if (periods.length === 0) return null;
  const period = periods[periods.length - 1];
  return { limit: period.limit, period, color: budget.color };
}

export function currentBudgetLimit(budget: Budget, now = new Date()): number {
  return budgetLimitForMonth(budget, monthKey(startOfMonth(now)))?.limit ?? budget.limit;
}

export function applyBudgetLimit(
  budget: Budget,
  limit: number,
  effectiveMonth: string,
  now = new Date()
): Budget {
  const month = MONTH_PATTERN.test(effectiveMonth) ? effectiveMonth : monthKey(now);
  const normalized = compareMoney(limit, 0) < 0 ? 0 : fromMinorUnits(toMinorUnits(limit));
  const periods = normalizeBudgetPeriods(budget).filter(
    (period) => period.effectiveFrom.slice(0, 7) !== month
  );
  periods.push({
    id: `${budget.id}-${month}`,
    limit: normalized,
    effectiveFrom: monthStartIso(month),
    createdAt: now.toISOString(),
  });
  periods.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const current = budgetLimitForMonth({ ...budget, history: periods }, monthKey(now));
  return {
    ...budget,
    limit: current?.limit ?? normalized,
    history: periods,
  };
}

export function setBudgetArchived(budget: Budget, archived: boolean): Budget {
  return { ...budget, archived };
}

export function activeBudgets(budgets: readonly Budget[]): Budget[] {
  return budgets.filter((budget) => budget.archived !== true);
}

export function archivedBudgets(budgets: readonly Budget[]): Budget[] {
  return budgets.filter((budget) => budget.archived === true);
}

export function buildBudgetHistory(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  accounts: readonly Account[],
  endMonth = monthKey(new Date()),
  monthCount = 6
): BudgetHistoryRow[] {
  const accountsById = reportsAccountMap(accounts);
  const inrTransactions = scopeToCurrency(transactions, accountsById, DEFAULT_CURRENCY);
  const rows: BudgetHistoryRow[] = [];
  for (let offset = 0; offset < Math.max(1, monthCount); offset += 1) {
    const month = shiftMonthKey(endMonth, -offset);
    const spendByCategory = computeCategorySpending(
      inrTransactions.filter((tx) => monthKey(new Date(tx.date)) === month),
      DEFAULT_CURRENCY
    );
    let budgeted = 0;
    let spent = 0;
    let budgetedCategories = 0;
    budgets.forEach((budget) => {
      const forMonth = budgetLimitForMonth(budget, month);
      if (!forMonth) return;
      budgetedCategories += 1;
      budgeted += forMonth.limit;
      const categorySpend = spendByCategory.get(budget.category) ?? 0;
      spent += categorySpend > 0 ? categorySpend : 0;
    });
    rows.push({
      month,
      label: formatBudgetMonth(month),
      budgeted,
      spent,
      budgetedCategories,
      over: compareMoney(spent, budgeted) > 0,
    });
  }
  return rows;
}
