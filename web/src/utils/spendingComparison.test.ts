import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/finance';
import { absoluteMoney, buildMonthlyComparison } from './spendingComparison';

const now = new Date(2026, 9, 23, 18, 0, 0);

function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour, 0, 0).toISOString();
}

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    title: 'Transaction',
    category: 'Other',
    amount: 100,
    type: 'debit',
    status: 'Completed',
    date: at(2026, 10, 5),
    accountId: 'a1',
    ...overrides,
  };
}

describe('buildMonthlyComparison', () => {
  it('compares the same part of this month and last month', () => {
    const result = buildMonthlyComparison(
      [
        transaction({ id: 'oct-first', date: at(2026, 10, 1) }),
        transaction({ id: 'oct-today', date: at(2026, 10, 23) }),
        transaction({ id: 'oct-future', date: at(2026, 10, 24) }),
        transaction({ id: 'sep-first', date: at(2026, 9, 1), amount: 200 }),
        transaction({ id: 'sep-cutoff', date: at(2026, 9, 23), amount: 200 }),
        transaction({ id: 'sep-after', date: at(2026, 9, 24), amount: 200 }),
      ],
      now
    );

    expect(result.currentLabel).toBe('Oct 1-23');
    expect(result.previousLabel).toBe('Sep 1-23');
    expect(result.current.spending).toBe(200);
    expect(result.previous.spending).toBe(400);
    expect(result.spendingDelta).toBe(-200);
  });

  it('excludes transfers, pending rows and credits from spending', () => {
    const result = buildMonthlyComparison(
      [
        transaction({ id: 'spend', amount: 1000 }),
        transaction({ id: 'transfer', amount: 5000, kind: 'transfer', category: 'Savings' }),
        transaction({ id: 'pending', amount: 700, status: 'Pending' }),
        transaction({ id: 'income', amount: 3000, type: 'credit', category: 'Income' }),
      ],
      now
    );

    expect(result.current.spending).toBe(1000);
    expect(result.current.income).toBe(3000);
  });

  it('reports the largest category movements without moralising', () => {
    const result = buildMonthlyComparison(
      [
        transaction({ id: 'grocery-now', category: 'Groceries', amount: 1200 }),
        transaction({ id: 'dining-now', category: 'Dining', amount: 400 }),
        transaction({ id: 'transport-now', category: 'Transport', amount: 300 }),
        transaction({
          id: 'grocery-before',
          category: 'Groceries',
          amount: 800,
          date: at(2026, 9, 5),
        }),
        transaction({
          id: 'dining-before',
          category: 'Dining',
          amount: 900,
          date: at(2026, 9, 5),
        }),
      ],
      now
    );

    expect(result.topMovements.map((movement) => movement.category)).toEqual([
      'Dining',
      'Groceries',
      'Transport',
    ]);
    expect(result.topMovements[0]).toEqual({
      category: 'Dining',
      current: 400,
      previous: 900,
      delta: -500,
    });
    expect(absoluteMoney(result.topMovements[0].delta)).toBe(500);
  });

  it('caps the previous window at the end of a shorter month', () => {
    const endOfOctober = new Date(2026, 9, 31, 12, 0, 0);
    const result = buildMonthlyComparison(
      [
        transaction({ id: 'sep-last', date: at(2026, 9, 30), amount: 250 }),
        transaction({ id: 'oct-first', date: at(2026, 10, 1), amount: 100 }),
      ],
      endOfOctober
    );

    expect(result.previousLabel).toBe('Sep 1-30');
    expect(result.previous.spending).toBe(250);
  });

  it('handles a month with no prior spending', () => {
    const result = buildMonthlyComparison(
      [transaction({ id: 'only-now', category: 'Bills', amount: 900 })],
      now
    );

    expect(result.previous).toEqual({ income: 0, spending: 0 });
    expect(result.topMovements).toEqual([
      { category: 'Bills', current: 900, previous: 0, delta: 900 },
    ]);
  });
});
