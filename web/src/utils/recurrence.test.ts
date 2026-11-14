import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlannedPaymentsSection } from '../components/PlannedPaymentsSection';
import type { PlannedPayment } from '../types/finance';
import { expandOccurrences, isValidRecurrence, localCalendarDate } from './recurrence';

const payment = (overrides: Partial<PlannedPayment> = {}): PlannedPayment => ({
  id: 'rent', title: 'Rent', category: 'Rent', amount: 100, direction: 'out',
  dueDate: '2026-01-31', recurrence: { freq: 'monthly', interval: 1 }, ...overrides,
});
const date = (value: string) => new Date(`${value}T12:00:00`);
const dates = (plan: PlannedPayment, start: string, end: string) =>
  expandOccurrences(plan, date(start), date(end)).occurrences.map((item) => item.date);

describe('calendar recurrence', () => {
  it('preserves the original monthly day after clamping', () => {
    expect(dates(payment(), '2026-01-01', '2026-05-01')).toEqual([
      '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
    ]);
  });
  it('restores leap day in the next leap year', () => {
    expect(dates(payment({ dueDate: '2028-02-29', recurrence: { freq: 'yearly', interval: 1 } }), '2028-01-01', '2032-03-01')).toEqual([
      '2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29',
    ]);
  });
  it.each([
    ['daily', '2026-03-07', 2, ['2026-03-07', '2026-03-09', '2026-03-11']],
    ['weekly', '2026-03-01', 2, ['2026-03-01', '2026-03-15', '2026-03-29']],
    ['monthly', '2026-01-31', 2, ['2026-01-31', '2026-03-31', '2026-05-31']],
    ['yearly', '2028-02-29', 2, ['2028-02-29', '2030-02-28', '2032-02-29']],
  ] as const)('steps %s by calendar intervals', (freq, anchor, interval, expected) => {
    expect(dates(payment({ dueDate: anchor, recurrence: { freq, interval } }), anchor, expected[2])).toEqual(expected);
  });
  it('honors inclusive window and end date boundaries', () => {
    const plan = payment({ dueDate: '2026-03-07', recurrence: { freq: 'daily', interval: 1, endDate: '2026-03-09' } });
    expect(dates(plan, '2026-03-08', '2026-03-15')).toEqual(['2026-03-08', '2026-03-09']);
    expect(dates(plan, '2026-03-01', '2026-03-07')).toEqual(['2026-03-07']);
    expect(dates(plan, '2026-03-10', '2026-03-01')).toEqual([]);
  });
  it('uses local calendar parts for legacy ISO anchors and preserves one-time strings', () => {
    const iso = new Date(2026, 0, 31, 12).toISOString();
    expect(localCalendarDate(iso)).toBe('2026-01-31');
    expect(dates(payment({ dueDate: iso }), '2026-02-01', '2026-03-31')).toEqual(['2026-02-28', '2026-03-31']);
    expect(dates(payment({ dueDate: iso, recurrence: undefined }), '2026-01-31', '2026-01-31')).toEqual([iso]);
  });
  it('omits paused series and resumes the original anchor, with durable skipped dates', () => {
    const plan = payment({ skippedDates: ['2026-02-28', '2026-02-28', '2026-02-27'] });
    expect(dates({ ...plan, paused: true }, '2026-01-01', '2026-04-30')).toEqual([]);
    expect(dates({ ...plan, paused: false }, '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-03-31', '2026-04-30']);
    expect(expandOccurrences(plan, date('2026-01-01'), date('2026-04-30')).totalCount).toBe(3);
  });
  it('keeps keys stable across windows and series title/amount edits without mutating the plan', () => {
    const plan = Object.freeze(payment());
    const first = expandOccurrences(plan, date('2026-01-01'), date('2026-02-28')).occurrences[1];
    const edited = expandOccurrences({ ...plan, title: 'New rent', amount: 200 }, date('2026-02-01'), date('2026-02-28')).occurrences[0];
    expect(first).toEqual(edited);
    expect(first.occurrenceKey).toBe('rent:2026-02-28');
    expect(plan.amount).toBe(100);
  });
  it('caps display only, reports exact total with skipped dates, and warns when truncated', () => {
    const plan = payment({ dueDate: '2024-01-01', recurrence: { freq: 'daily', interval: 1 }, skippedDates: ['2024-01-02', '2024-01-02'] });
    const result = expandOccurrences(plan, date('2024-01-01'), date('2026-01-01'), 2);
    expect(result.occurrences.map((item) => item.date)).toEqual(['2024-01-01', '2024-01-03']);
    expect(result.totalCount).toBe(731);
    expect(result.truncated).toBe(true);
    expect(result.warning).toBeTruthy();
    expect(expandOccurrences(plan, date('2024-01-01'), date('2026-01-01'), Infinity).occurrences).toHaveLength(400);
  });
  it('can seek to a distant window without using up the display cap', () => {
    expect(dates(payment({ dueDate: '0001-01-01', recurrence: { freq: 'daily', interval: 1 } }), '9999-12-30', '9999-12-31')).toEqual(['9999-12-30', '9999-12-31']);
  });
  it('does not flag exactly-cap results and can count without emitting rows', () => {
    const result = expandOccurrences(payment(), date('2026-01-01'), date('2026-02-28'), 2);
    expect(result.truncated).toBe(false);
    expect(result.warning).toBeUndefined();
    expect(expandOccurrences(payment(), date('2026-01-01'), date('2026-02-28'), 0).totalCount).toBe(2);
  });
  it('returns warnings rather than silently accepting invalid rules or dates', () => {
    expect(expandOccurrences(payment({ recurrence: { freq: 'daily', interval: 0 } }), date('2026-01-01'), date('2026-12-31')).warning).toBeTruthy();
    expect(expandOccurrences(payment({ dueDate: '2026-02-30' }), date('2026-01-01'), date('2026-12-31')).warning).toBeTruthy();
  });
});

describe('planned payment controls', () => {
  it('offers series editing, pause/resume and a dated next-occurrence skip without ledger actions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 1, 12));
    try {
      const html = renderToStaticMarkup(createElement(PlannedPaymentsSection, {
        plannedPayments: [payment(), payment({ id: 'paused', title: 'Gym', paused: true })],
        accounts: [], onAdd: () => {}, onDelete: () => {}, onUpdate: () => {},
      }));
      expect(html).toContain('aria-label="Edit Rent series"');
      expect(html).toContain('aria-label="Pause Rent"');
      expect(html).toContain('aria-label="Resume Gym"');
      expect(html).toContain('aria-label="Skip Rent on 2026-02-28"');
      expect(html).toContain('next on');
      expect(html).not.toContain('Record as paid');
    } finally { vi.useRealTimers(); }
  });
  it('renders category names for stored ids and an explicit warning for capped displays', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12));
    try {
      const html = renderToStaticMarkup(createElement(PlannedPaymentsSection, {
        plannedPayments: [payment({ category: 'custom-bill', dueDate: '2024-01-01', recurrence: { freq: 'daily', interval: 1 } })],
        categories: [{ id: 'custom-bill', name: 'Utilities', type: 'expense', color: '#123456', icon: 'wallet' }],
        accounts: [], onAdd: () => {}, onDelete: () => {},
      }));
      expect(html).toContain('Utilities');
      expect(html).toContain('role="status"');
      expect(html).toContain('all are included in totals');
    } finally { vi.useRealTimers(); }
  });
});

describe('recurrence persistence validation', () => {
  it.each(['daily', 'weekly', 'monthly', 'yearly'])('accepts %s and an inclusive date-only end', (freq) => {
    expect(isValidRecurrence({ freq, interval: 2, endDate: '2028-02-29' })).toBe(true);
  });
  it.each([null, [], {}, { freq: 'hourly', interval: 1 }, { freq: 'daily', interval: 0 },
    { freq: 'daily', interval: -1 }, { freq: 'daily', interval: 1.5 }, { freq: 'daily', interval: Infinity },
    { freq: 'daily', interval: '1' }, { freq: 'daily', interval: 1, endDate: '2026-02-29' },
    { freq: 'daily', interval: 1, endDate: '' }, { freq: 'daily', interval: 1, endDate: '2026-01-01T12:00:00Z' },
  ])('rejects malformed rules: %j', (value) => {
    expect(isValidRecurrence(value)).toBe(false);
  });
});
