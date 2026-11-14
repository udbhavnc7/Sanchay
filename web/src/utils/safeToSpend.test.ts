import { describe, expect, it } from 'vitest';
import type { PlannedPayment, SavingsGoal } from '../types/finance';
import { buildSafeToSpend } from './safeToSpend';

const now = new Date(2026, 9, 24, 12, 0, 0);

function at(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour, 0, 0).toISOString();
}

function payment(overrides: Partial<PlannedPayment>): PlannedPayment {
  return {
    id: 'pp',
    title: 'Planned payment',
    amount: 100,
    direction: 'out',
    dueDate: at(2026, 10, 25),
    category: 'Bills',
    ...overrides,
  };
}

function goal(overrides: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: 'g1',
    title: 'Goal',
    icon: 'shield',
    savedAmount: 0,
    targetAmount: 1000,
    targetDate: 'Oct 2026',
    color: '#10b981',
    ...overrides,
  };
}

describe('recurring obligations and lifecycle', () => {
  it('counts every recurring outflow, including old overdue dates, without mutating plans', () => {
    const plan = payment({ dueDate: '2026-01-31', recurrence: { freq: 'monthly', interval: 1 } });
    const before = JSON.stringify(plan);
    const result = buildSafeToSpend({ availableBalance: 2000, remainingBudget: 0, goals: [], plannedPayments: [plan], now });
    expect(result.plannedOutflows).toBe(1000);
    expect(result.upcoming).toHaveLength(10);
    expect(result.safeToSpend).toBe(1000);
    expect(JSON.stringify(plan)).toBe(before);
  });

  it('excludes paused series, skipped dates, old income and inactive goal pace', () => {
    const result = buildSafeToSpend({
      availableBalance: 2000, remainingBudget: 0, now,
      goals: [goal({ status: 'paused' }), goal({ status: 'completed' }), goal({ status: 'archived' })],
      plannedPayments: [
        payment({ id: 'paused', paused: true, recurrence: { freq: 'daily', interval: 1 } }),
        payment({ id: 'in', direction: 'in', dueDate: '2026-10-01', recurrence: { freq: 'weekly', interval: 1 }, skippedDates: ['2026-11-05'] }),
      ],
    });
    expect(result.goalCommitments).toBe(0);
    expect(result.plannedOutflows).toBe(0);
    expect(result.plannedInflows).toBe(300);
    expect(result.upcoming.map((item) => item.dueDate)).toEqual(['2026-10-29', '2026-11-12', '2026-11-19']);
  });

  it('sums all obligations even when only 400 occurrences can be displayed', () => {
    const result = buildSafeToSpend({
      availableBalance: 5000, remainingBudget: 0, goals: [], now: new Date(2026, 0, 1, 12), horizonDays: 1,
      plannedPayments: [payment({ amount: 1, dueDate: '2024-01-01', recurrence: { freq: 'daily', interval: 1 } })],
    });
    expect(result.plannedOutflows).toBe(732);
    expect(result.safeToSpend).toBe(4268);
    expect(result.upcoming).toHaveLength(400);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.occurrenceCount).toBe(732);
  });

  it('deduplicates occurrence keys and does not mix currencies', () => {
    const plan = payment({ recurrence: { freq: 'weekly', interval: 1 } });
    const result = buildSafeToSpend({ availableBalance: 2000, remainingBudget: 0, goals: [], now,
      plannedPayments: [plan, plan, payment({ id: 'usd', currency: 'USD', amount: 9999 })] });
    expect(result.plannedOutflows).toBe(500);
    expect(new Set(result.upcoming.map((item) => item.occurrenceKey)).size).toBe(5);
  });

  it('interprets date-only income on the last horizon date in local calendar time', () => {
    const result = buildSafeToSpend({ availableBalance: 0, remainingBudget: 0, goals: [],
      now: new Date(2026, 2, 8, 12), horizonDays: 1,
      plannedPayments: [payment({ direction: 'in', dueDate: '2026-03-08' })] });
    expect(result.plannedInflows).toBe(100);
  });
});

describe('buildSafeToSpend', () => {
  it('subtracts budgets, goal pace and planned outflows, then adds planned inflows', () => {
    const result = buildSafeToSpend({
      availableBalance: 10000,
      remainingBudget: 2000,
      goals: [goal({})],
      plannedPayments: [
        payment({ id: 'out', amount: 500 }),
        payment({ id: 'in', amount: 2000, direction: 'in', dueDate: at(2026, 10, 29) }),
      ],
      buffer: 500,
      now,
    });

    expect(result.goalCommitments).toBe(1000);
    expect(result.plannedOutflows).toBe(500);
    expect(result.plannedInflows).toBe(2000);
    expect(result.safeToSpend).toBe(8000);
    expect(result.shortfall).toBe(0);
    expect(result.upcoming.map((item) => item.id)).toEqual(['out', 'in']);
  });

  it('keeps overdue outflows but ignores overdue inflows and far-future payments', () => {
    const result = buildSafeToSpend({
      availableBalance: 10000,
      remainingBudget: 0,
      goals: [],
      plannedPayments: [
        payment({ id: 'past', dueDate: at(2026, 10, 23), amount: 900 }),
        payment({
          id: 'past-in',
          dueDate: at(2026, 10, 23),
          amount: 500,
          direction: 'in',
        }),
        payment({ id: 'soon', dueDate: at(2026, 10, 24), amount: 100 }),
        payment({ id: 'far', dueDate: at(2026, 12, 1), amount: 800 }),
      ],
      now,
    });

    expect(result.plannedOutflows).toBe(1000);
    expect(result.plannedInflows).toBe(0);
    expect(result.safeToSpend).toBe(9000);
    expect(result.upcoming.map((item) => item.id)).toEqual(['past', 'soon']);
  });

  it('includes payments through the end of the 30-day horizon', () => {
    const result = buildSafeToSpend({
      availableBalance: 10000,
      remainingBudget: 0,
      goals: [],
      plannedPayments: [
        payment({ id: 'last-day', dueDate: at(2026, 11, 22), amount: 100 }),
        payment({ id: 'day-after', dueDate: at(2026, 11, 23), amount: 200 }),
      ],
      now,
    });

    expect(result.upcoming.map((item) => item.id)).toEqual(['last-day']);
    expect(result.plannedOutflows).toBe(100);
  });

  it('clamps a negative result to zero and reports the shortfall', () => {
    const result = buildSafeToSpend({
      availableBalance: 1000,
      remainingBudget: 400,
      goals: [goal({ targetAmount: 2000 })],
      plannedPayments: [payment({ amount: 300 })],
      buffer: 100,
      now,
    });

    expect(result.safeToSpend).toBe(0);
    expect(result.shortfall).toBe(1800);
  });

  it('does not reserve money for completed goals', () => {
    const result = buildSafeToSpend({
      availableBalance: 1000,
      remainingBudget: 0,
      goals: [goal({ savedAmount: 1000 })],
      plannedPayments: [],
      now,
    });

    expect(result.goalCommitments).toBe(0);
    expect(result.safeToSpend).toBe(1000);
  });

  it('flags when there are no upcoming planned payments', () => {
    const result = buildSafeToSpend({
      availableBalance: 1000,
      remainingBudget: 0,
      goals: [],
      plannedPayments: [],
      now,
    });

    expect(result.missingPlannedPayments).toBe(true);
    expect(result.upcoming).toEqual([]);
  });

  it('applies a temporary what-if outflow without changing other inputs', () => {
    const result = buildSafeToSpend({
      availableBalance: 10000,
      remainingBudget: 2000,
      goals: [goal({})],
      plannedPayments: [payment({ amount: 500 })],
      buffer: 500,
      whatIfOutflow: 3000,
      now,
    });

    expect(result.safeToSpend).toBe(3000);
    expect(result.shortfall).toBe(0);
    expect(result.buffer).toBe(500);
  });

  it('treats negative what-if outflow as zero', () => {
    const result = buildSafeToSpend({
      availableBalance: 1000,
      remainingBudget: 0,
      goals: [],
      plannedPayments: [],
      whatIfOutflow: -250,
      now,
    });

    expect(result.safeToSpend).toBe(1000);
    expect(result.shortfall).toBe(0);
  });

  it('reports shortfall when what-if outflow exceeds available room', () => {
    const result = buildSafeToSpend({
      availableBalance: 1000,
      remainingBudget: 100,
      goals: [],
      plannedPayments: [],
      whatIfOutflow: 1200,
      now,
    });

    expect(result.safeToSpend).toBe(0);
    expect(result.shortfall).toBe(300);
  });
});
