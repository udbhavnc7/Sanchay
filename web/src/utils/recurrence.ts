import type { PlannedPayment, RecurrenceRule } from '../types/finance';

export const MAX_DISPLAY_OCCURRENCES = 400;

export interface PaymentOccurrence {
  date: string;
  occurrenceKey: string;
}

export interface OccurrenceExpansion {
  occurrences: PaymentOccurrence[];
  /** Exact count, including occurrences omitted from the bounded display list. */
  totalCount: number;
  truncated: boolean;
  warning?: string;
}

function utcDate(year: number, month: number, day: number): Date {
  const result = new Date(0);
  result.setUTCFullYear(year, month, day);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const result = utcDate(year, month - 1, day);
  return year >= 1 && result.getUTCFullYear() === year &&
    result.getUTCMonth() === month - 1 && result.getUTCDate() === day ? result : null;
}

/** Date-only values are calendar dates; legacy ISO instants use the device's local day. */
export function localCalendarDate(value: string | Date): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseDateOnly(value) ? value : null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const year = date.getFullYear();
  if (year < 1 || year > 9999) return null;
  return `${String(year).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidRecurrence(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Record<string, unknown>;
  return ['daily', 'weekly', 'monthly', 'yearly'].includes(rule.freq as string) &&
    Number.isSafeInteger(rule.interval) && (rule.interval as number) >= 1 &&
    (rule.endDate === undefined || parseDateOnly(rule.endDate) !== null);
}

/**
 * Pure estimates only: never writes ledger entries. All stepping uses UTC calendar
 * parts, not elapsed local hours. Each month/year is derived from the original anchor.
 * Binary searches count even centuries of overdue obligations without enumerating them.
 */
export function expandOccurrences(
  payment: PlannedPayment,
  windowStart: Date,
  windowEnd: Date,
  cap = MAX_DISPLAY_OCCURRENCES
): OccurrenceExpansion {
  const empty: OccurrenceExpansion = { occurrences: [], totalCount: 0, truncated: false };
  if (payment.paused) return empty;
  const anchorDay = localCalendarDate(payment.dueDate);
  const startDay = localCalendarDate(windowStart);
  const endDay = localCalendarDate(windowEnd);
  if (!anchorDay || !startDay || !endDay) return { ...empty, warning: 'Invalid planned-payment calendar date.' };
  if (payment.recurrence !== undefined && !isValidRecurrence(payment.recurrence)) {
    return { ...empty, warning: 'Invalid planned-payment recurrence rule.' };
  }
  if (startDay > endDay) return empty;
  const limit = Number.isFinite(cap) ? Math.max(0, Math.min(MAX_DISPLAY_OCCURRENCES, Math.floor(cap))) : MAX_DISPLAY_OCCURRENCES;
  const skipped = new Set(payment.skippedDates ?? []);
  const occurrence = (day: string, date = day): PaymentOccurrence => ({
    date, occurrenceKey: `${payment.id}:${day}`,
  });
  const finish = (occurrences: PaymentOccurrence[], totalCount: number): OccurrenceExpansion => {
    const truncated = totalCount > occurrences.length;
    return {
      occurrences, totalCount, truncated,
      ...(truncated ? { warning: `Showing ${occurrences.length} of ${totalCount} occurrences; all are included in totals.` } : {}),
    };
  };

  if (!payment.recurrence) {
    if (anchorDay < startDay || anchorDay > endDay || skipped.has(anchorDay)) return empty;
    return finish(limit ? [occurrence(anchorDay, payment.dueDate)] : [], 1);
  }

  const rule: RecurrenceRule = payment.recurrence;
  const lastDay = rule.endDate && rule.endDate < endDay ? rule.endDate : endDay;
  if (lastDay < anchorDay || lastDay < startDay) return empty;
  const anchor = parseDateOnly(anchorDay)!;
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const dateAt = (index: number): string | null => {
    const step = index * rule.interval;
    if (!Number.isSafeInteger(step)) return null;
    let next: Date;
    if (rule.freq === 'daily' || rule.freq === 'weekly') {
      const days = step * (rule.freq === 'weekly' ? 7 : 1);
      if (days > 3_652_059) return null;
      next = utcDate(year, month, day + days);
    } else {
      const months = step * (rule.freq === 'yearly' ? 12 : 1);
      if (months > 120_000) return null;
      const targetYear = year + Math.floor((month + months) / 12);
      const targetMonth = (month + months) % 12;
      const lastDate = utcDate(targetYear, targetMonth + 1, 0).getUTCDate();
      next = utcDate(targetYear, targetMonth, Math.min(day, lastDate));
    }
    if (next.getUTCFullYear() > 9999) return null;
    return next.toISOString().slice(0, 10);
  };

  // No valid four-digit-year series can have more than this many daily dates.
  const bound = (target: string, after = false): number => {
    let low = 0;
    let high = 3_652_059;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const next = dateAt(mid);
      if (next !== null && (next < target || (after && next === target))) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  const first = bound(startDay);
  const end = bound(lastDay, true);
  let totalCount = Math.max(0, end - first);
  for (const skip of skipped) {
    if (skip < startDay || skip > lastDay || !parseDateOnly(skip)) continue;
    const index = bound(skip);
    if (index >= first && index < end && dateAt(index) === skip) totalCount -= 1;
  }
  const occurrences: PaymentOccurrence[] = [];
  for (let index = first; index < end && occurrences.length < limit; index += 1) {
    const next = dateAt(index)!;
    if (!skipped.has(next)) occurrences.push(occurrence(next));
  }
  return finish(occurrences, totalCount);
}
