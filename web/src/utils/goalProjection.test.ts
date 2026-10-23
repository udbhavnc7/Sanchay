import { describe, expect, it } from 'vitest';
import { buildGoalProjection, goalTargetMonthValue } from './goalProjection';

const now = new Date(2026, 9, 23, 12, 0, 0);

function goal(overrides: Partial<{ savedAmount: number; targetAmount: number; targetDate: string }> = {}) {
  return {
    savedAmount: 85000,
    targetAmount: 150000,
    targetDate: 'Jun 2027',
    ...overrides,
  };
}

describe('buildGoalProjection', () => {
  it('calculates the monthly amount needed for a named target month', () => {
    const result = buildGoalProjection(goal(), now);

    expect(result.status).toBe('planned');
    expect(result.remaining).toBe(65000);
    expect(result.monthsRemaining).toBe(9);
    expect(result.requiredMonthly).toBe(7222.23);
  });

  it('accepts an ISO month value', () => {
    const result = buildGoalProjection(goal({ targetDate: '2027-06' }), now);

    expect(result.status).toBe('planned');
    expect(result.monthsRemaining).toBe(9);
    expect(result.requiredMonthly).toBe(7222.23);
  });

  it('counts the current month as one contribution month', () => {
    const result = buildGoalProjection(goal({ targetDate: 'Oct 2026' }), now);

    expect(result.status).toBe('planned');
    expect(result.monthsRemaining).toBe(1);
    expect(result.requiredMonthly).toBe(65000);
  });

  it('marks a fully funded goal complete', () => {
    const result = buildGoalProjection(
      goal({ savedAmount: 150000, targetAmount: 150000 }),
      now
    );

    expect(result).toEqual({
      remaining: 0,
      monthsRemaining: null,
      requiredMonthly: null,
      status: 'complete',
    });
  });

  it('converts stored target labels into month input values', () => {
    expect(goalTargetMonthValue('Jun 2027')).toBe('2027-06');
    expect(goalTargetMonthValue('2027-12')).toBe('2027-12');
    expect(goalTargetMonthValue('No date set')).toBe('');
  });

  it('flags a past target month and a missing date', () => {
    expect(buildGoalProjection(goal({ targetDate: 'Sep 2026' }), now).status).toBe('past-due');
    expect(buildGoalProjection(goal({ targetDate: 'No date set' }), now).status).toBe('no-date');
  });
});
