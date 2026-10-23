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
});
