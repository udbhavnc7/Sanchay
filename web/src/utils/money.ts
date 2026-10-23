import type { Currency } from '../types/finance';

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

interface FormatOptions {
  decimals?: boolean;
  compact?: boolean;
}

export type MoneyParseResult =
  | {
      ok: true;
      amount: number;
      minorUnits: number;
      currency: Currency;
    }
  | {
      ok: false;
      amount: 0;
      minorUnits: 0;
      currency: Currency;
      error: string;
    };

const MINOR_DIGITS: Record<Currency, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

export function minorDigits(currency: Currency = 'INR'): number {
  return MINOR_DIGITS[currency];
}

export function toMinorUnits(amount: number, currency: Currency = 'INR'): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 10 ** minorDigits(currency));
}

export function fromMinorUnits(minorUnits: number, currency: Currency = 'INR'): number {
  if (!Number.isFinite(minorUnits)) return 0;
  return minorUnits / 10 ** minorDigits(currency);
}

export function sumMoney(amounts: Iterable<number>, currency: Currency = 'INR'): number {
  let total = 0;
  for (const amount of amounts) {
    total += toMinorUnits(amount, currency);
  }
  return fromMinorUnits(total, currency);
}

export function addMoney(a: number, b: number, currency: Currency = 'INR'): number {
  return fromMinorUnits(toMinorUnits(a, currency) + toMinorUnits(b, currency), currency);
}

export function subtractMoney(a: number, b: number, currency: Currency = 'INR'): number {
  return fromMinorUnits(toMinorUnits(a, currency) - toMinorUnits(b, currency), currency);
}

export function compareMoney(a: number, b: number, currency: Currency = 'INR'): number {
  return toMinorUnits(a, currency) - toMinorUnits(b, currency);
}

export function parseMoneyInput(
  input: string,
  currency: Currency = 'INR'
): MoneyParseResult {
  const digits = minorDigits(currency);
  const normalized = input.trim().replace(/[,\s₹$€£¥]/g, '');

  if (!normalized) {
    return { ok: false, amount: 0, minorUnits: 0, currency, error: 'Enter an amount.' };
  }

  const pattern =
    digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{0,${digits}})?$`);

  if (!pattern.test(normalized)) {
    return {
      ok: false,
      amount: 0,
      minorUnits: 0,
      currency,
      error: digits === 0 ? 'Use a whole number.' : `Use at most ${digits} decimal places.`,
    };
  }

  const [whole, fraction = ''] = normalized.split('.');
  const wholeNumber = Number(whole);
  if (!Number.isSafeInteger(wholeNumber)) {
    return {
      ok: false,
      amount: 0,
      minorUnits: 0,
      currency,
      error: 'That amount is too large.',
    };
  }

  const factor = 10 ** digits;
  const minorUnits = wholeNumber * factor + Number(fraction.padEnd(digits, '0') || '0');

  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    return {
      ok: false,
      amount: 0,
      minorUnits: 0,
      currency,
      error: 'Enter an amount greater than zero.',
    };
  }

  return {
    ok: true,
    amount: fromMinorUnits(minorUnits, currency),
    minorUnits,
    currency,
  };
}

export function formatMoney(
  amount: number,
  currency: Currency = 'INR',
  options: FormatOptions = {}
): string {
  const { decimals = minorDigits(currency) > 0, compact = false } = options;
  const normalized = Number.isFinite(amount)
    ? fromMinorUnits(toMinorUnits(amount, currency), currency)
    : 0;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  }).format(normalized);
}

export function formatSigned(
  amount: number,
  type: 'credit' | 'debit',
  currency: Currency = 'INR'
): string {
  const sign = type === 'credit' ? '+' : '−';
  return `${sign}${formatMoney(amount, currency)}`;
}

export function formatPercent(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfYear(date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shortMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return formatDate(iso);
}

export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isValidAmount(value: number, currency: Currency = 'INR'): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  const factor = 10 ** minorDigits(currency);
  const scaled = value * factor;
  return (
    Number.isSafeInteger(toMinorUnits(value, currency)) &&
    Math.abs(scaled - Math.round(scaled)) < 1e-6
  );
}
