import { describe, expect, it } from 'vitest';
import type { Account, Budget, Transaction } from '../types/finance';
import {
  activeBudgets,
  applyBudgetLimit,
  archivedBudgets,
  budgetLimitForMonth,
  buildBudgetHistory,
  currentBudgetLimit,
  formatBudgetMonth,
  normalizeBudgetPeriods,
  setBudgetArchived,
  shiftMonthKey,
} from './budgetHistory';

const NOW = new Date(2026, 10, 15, 10, 0, 0);

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-inr',
    name: 'HDFC',
    type: 'Bank',
    currency: 'INR',
    balance: 100000,
    openingBalance: 100000,
    status: 'Active',
    change: '+0%',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Sample',
    category: 'Groceries',
    amount: 100,
    type: 'debit',
    status: 'Completed',
    date: new Date(2026, 10, 5, 12, 0, 0).toISOString(),
    accountId: 'acc-inr',
    kind: 'expense',
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b1',
    category: 'Groceries',
    limit: 12000,
    color: '#ff5722',
    ...overrides,
  };
}

function datedBudget(limits: Array<{ month: string; limit: number }>): Budget {
  return budget({
    limit: limits[limits.length - 1].limit,
    history: limits.map((entry) => ({
      id: `b1-${entry.month}`,
      limit: entry.limit,
      effectiveFrom: `${entry.month}-01`,
      createdAt: NOW.toISOString(),
    })),
  });
}

describe('budget limit history', () => {
  it('treats legacy budgets without history as applying to every month', () => {
    const legacy = budget();
    expect(normalizeBudgetPeriods(legacy)).toHaveLength(1);
    expect(budgetLimitForMonth(legacy, '2026-11')?.limit).toBe(12000);
    expect(budgetLimitForMonth(legacy, '2025-01')?.limit).toBe(12000);
    expect(currentBudgetLimit(legacy, NOW)).toBe(12000);
  });

  it('records a new period for the current month without rewriting earlier months', () => {
    const legacy = budget();
    const updated = applyBudgetLimit(legacy, 15000, '2026-11', NOW);
    expect(updated.limit).toBe(15000);
    expect(budgetLimitForMonth(updated, '2026-10')?.limit).toBe(12000);
    expect(budgetLimitForMonth(updated, '2026-11')?.limit).toBe(15000);
  });

  it('replaces a period when the same month is edited twice', () => {
    const once = applyBudgetLimit(budget(), 15000, '2026-11', NOW);
    const twice = applyBudgetLimit(once, 16000, '2026-11', NOW);
    expect(normalizeBudgetPeriods(twice).filter((p) => p.effectiveFrom.startsWith('2026-11'))).toHaveLength(1);
    expect(budgetLimitForMonth(twice, '2026-11')?.limit).toBe(16000);
    expect(budgetLimitForMonth(twice, '2026-10')?.limit).toBe(12000);
  });

  it('keeps the current limit stable when a future month is scheduled', () => {
    const updated = applyBudgetLimit(budget(), 18000, '2026-12', NOW);
    expect(budgetLimitForMonth(updated, '2026-11')?.limit).toBe(12000);
    expect(budgetLimitForMonth(updated, '2026-12')?.limit).toBe(18000);
    expect(currentBudgetLimit(updated, NOW)).toBe(12000);
    expect(updated.limit).toBe(12000);
  });

  it('handles month boundaries and year rollover', () => {
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(formatBudgetMonth('2026-02')).toContain('Feb 2026');
    const february = applyBudgetLimit(budget(), 9000, '2026-02', NOW);
    expect(budgetLimitForMonth(february, '2026-01')?.limit).toBe(12000);
    expect(budgetLimitForMonth(february, '2026-02')?.limit).toBe(9000);
    expect(budgetLimitForMonth(february, '2026-03')?.limit).toBe(9000);
  });

  it('clamps negative limits to zero', () => {
    const updated = applyBudgetLimit(budget(), -500, '2026-11', NOW);
    expect(budgetLimitForMonth(updated, '2026-11')?.limit).toBe(0);
  });

  it('returns null before the first recorded period', () => {
    const subscribed = datedBudget([{ month: '2026-10', limit: 12000 }]);
    expect(budgetLimitForMonth(subscribed, '2026-09')).toBeNull();
    expect(budgetLimitForMonth(subscribed, '2026-10')?.limit).toBe(12000);
  });
});

describe('archived budgets', () => {
  it('separates active and archived budgets while keeping their history', () => {
    const live = budget({ id: 'live' });
    const paused = setBudgetArchived(budget({ id: 'paused' }), true);
    const budgets = [live, paused];
    expect(activeBudgets(budgets).map((entry) => entry.id)).toEqual(['live']);
    expect(archivedBudgets(budgets).map((entry) => entry.id)).toEqual(['paused']);
    expect(normalizeBudgetPeriods(paused).length).toBeGreaterThan(0);
    const restored = setBudgetArchived(paused, false);
    expect(archivedBudgets([restored])).toHaveLength(0);
  });
});

describe('budget history rows', () => {
  const accounts = [account()];
  const budgets = [
    datedBudget([
      { month: '2026-07', limit: 10000 },
      { month: '2026-11', limit: 12000 },
    ]),
    budget({ id: 'b2', category: 'Dining', limit: 4000 }),
  ];

  const transactions = [
    tx({ id: 'nov-groceries', amount: 5000, date: new Date(2026, 10, 3, 12).toISOString() }),
    tx({
      id: 'nov-refund',
      amount: 1000,
      type: 'credit',
      kind: 'refund',
      date: new Date(2026, 10, 6, 12).toISOString(),
    }),
    tx({
      id: 'nov-pending',
      amount: 3000,
      status: 'Pending',
      date: new Date(2026, 10, 7, 12).toISOString(),
    }),
    tx({
      id: 'nov-transfer',
      amount: 2000,
      kind: 'transfer',
      date: new Date(2026, 10, 8, 12).toISOString(),
    }),
    tx({
      id: 'nov-dining',
      amount: 5000,
      category: 'Dining',
      date: new Date(2026, 10, 9, 12).toISOString(),
    }),
    tx({
      id: 'nov-usd',
      amount: 7000,
      accountId: 'acc-usd',
      date: new Date(2026, 10, 10, 12).toISOString(),
    }),
    tx({ id: 'oct-groceries', amount: 8000, date: new Date(2026, 9, 5, 12).toISOString() }),
  ];
  const accountsWithUsd = [...accounts, account({ id: 'acc-usd', currency: 'USD', name: 'USD' })];

  it('builds six months newest-first using the limit in force each month', () => {
    const rows = buildBudgetHistory(budgets, transactions, accountsWithUsd, '2026-11', 6);
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => row.month)).toEqual([
      '2026-11',
      '2026-10',
      '2026-09',
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
    expect(rows[0]).toMatchObject({
      label: expect.stringContaining('Nov 2026'),
      budgeted: 16000,
      spent: 9000,
      budgetedCategories: 2,
      over: false,
    });
    expect(rows[1]).toMatchObject({
      budgeted: 14000,
      spent: 8000,
      budgetedCategories: 2,
      over: false,
    });
    expect(rows[4]).toMatchObject({ budgeted: 14000, spent: 0 });
    expect(rows[5]).toMatchObject({ budgeted: 4000, budgetedCategories: 1 });
  });

  it('nets refunds, excludes transfers, pending entries and other currencies', () => {
    const rows = buildBudgetHistory(budgets, transactions, accountsWithUsd, '2026-11', 1);
    expect(rows[0].spent).toBe(9000);
  });

  it('flags overspending and zero budgets without pretending unspent money exists', () => {
    const zero = budget({ id: 'b0', category: 'Entertainment', limit: 0 });
    const rows = buildBudgetHistory(
      [zero],
      [tx({ id: 'cinema', category: 'Entertainment', amount: 500 })],
      accounts,
      '2026-11',
      1
    );
    expect(rows[0]).toMatchObject({ budgeted: 0, spent: 500, budgetedCategories: 1, over: true });
  });

  it('keeps past performance when a budget is archived', () => {
    const paused = setBudgetArchived(budgets[0], true);
    const rows = buildBudgetHistory([paused, budgets[1]], transactions, accountsWithUsd, '2026-10', 1);
    expect(activeBudgets([paused, budgets[1]]).map((entry) => entry.id)).toEqual(['b2']);
    expect(rows[0]).toMatchObject({ budgeted: 14000, spent: 8000 });
  });

  it('reports empty history when nothing has been budgeted or spent', () => {
    const rows = buildBudgetHistory([], [], accounts, '2026-11', 6);
    expect(rows.every((row) => row.budgetedCategories === 0 && row.spent === 0)).toBe(true);
    const withEmptyBudget = buildBudgetHistory([zeroBudget()], [], accounts, '2026-11', 1);
    expect(withEmptyBudget[0].budgeted).toBe(0);
    expect(withEmptyBudget[0].budgetedCategories).toBe(1);
  });
});

function zeroBudget(): Budget {
  return budget({ id: 'zero', limit: 0 });
}
