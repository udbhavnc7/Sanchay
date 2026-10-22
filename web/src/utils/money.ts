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

export function formatMoney(
  amount: number,
  currency: Currency = 'INR',
  options: FormatOptions = {}
): string {
  const { decimals = true, compact = false } = options;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  }).format(Number.isFinite(amount) ? amount : 0);
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

export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
