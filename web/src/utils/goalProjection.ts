import type { SavingsGoal } from '../types/finance';
import {
  compareMoney,
  fromMinorUnits,
  subtractMoney,
  toMinorUnits,
} from './money';

export type GoalProjectionStatus = 'complete' | 'planned' | 'past-due' | 'no-date';

export interface GoalProjection {
  remaining: number;
  monthsRemaining: number | null;
  requiredMonthly: number | null;
  status: GoalProjectionStatus;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function parseTargetMonth(value: string): { year: number; month: number } | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? { year, month } : null;
  }

  const named = /^([A-Za-z]{3})\s+(\d{4})$/.exec(trimmed);
  if (!named) return null;
  const month = MONTHS[named[1].toLowerCase()];
  if (!month) return null;
  return { year: Number(named[2]), month };
}

export function goalTargetMonthValue(targetDate: string): string {
  const target = parseTargetMonth(targetDate);
  if (!target) return '';
  return `${target.year}-${String(target.month).padStart(2, '0')}`;
}

export function buildGoalProjection(
  goal: Pick<SavingsGoal, 'savedAmount' | 'targetAmount' | 'targetDate'>,
  now = new Date()
): GoalProjection {
  const remaining = subtractMoney(goal.targetAmount, goal.savedAmount);
  if (compareMoney(remaining, 0) <= 0) {
    return {
      remaining: 0,
      monthsRemaining: null,
      requiredMonthly: null,
      status: 'complete',
    };
  }

  const target = parseTargetMonth(goal.targetDate);
  if (!target) {
    return {
      remaining,
      monthsRemaining: null,
      requiredMonthly: null,
      status: 'no-date',
    };
  }

  const monthsRemaining =
    (target.year - now.getFullYear()) * 12 + (target.month - (now.getMonth() + 1)) + 1;

  if (monthsRemaining <= 0) {
    return {
      remaining,
      monthsRemaining,
      requiredMonthly: null,
      status: 'past-due',
    };
  }

  const requiredMonthly = fromMinorUnits(
    Math.ceil(toMinorUnits(remaining) / monthsRemaining)
  );

  return {
    remaining,
    monthsRemaining,
    requiredMonthly,
    status: 'planned',
  };
}
