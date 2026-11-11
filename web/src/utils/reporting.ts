import type { Account, Currency, Transaction } from '../types/finance';
import { addMoney, formatDate, subtractMoney, sumMoney } from './money';

export const DEFAULT_CURRENCY: Currency = 'INR';

export interface ReportTotals {
  income: number;
  spending: number;
  saved: number;
  net: number;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
}

export interface PayeeSlice {
  name: string;
  amount: number;
  count: number;
}

export function transactionCurrency(
  tx: Transaction,
  accountsById: ReadonlyMap<string, Account>
): Currency {
  if (tx.currency) return tx.currency;
  const account = tx.accountId ? accountsById.get(tx.accountId) : undefined;
  return account?.currency ?? DEFAULT_CURRENCY;
}

export function reportsAccountMap(accounts: readonly Account[]): Map<string, Account> {
  return new Map(accounts.map((account) => [account.id, account]));
}

export function reportCurrencies(
  transactions: readonly Transaction[],
  accountsById: ReadonlyMap<string, Account>
): Currency[] {
  const seen: Currency[] = [];
  transactions.forEach((tx) => {
    const currency = transactionCurrency(tx, accountsById);
    if (!seen.includes(currency)) seen.push(currency);
  });
  return seen;
}

export function scopeToCurrency(
  transactions: readonly Transaction[],
  accountsById: ReadonlyMap<string, Account>,
  currency: Currency
): Transaction[] {
  return transactions.filter((tx) => transactionCurrency(tx, accountsById) === currency);
}

export function computeReportTotals(
  transactions: readonly Transaction[],
  currency: Currency = DEFAULT_CURRENCY
): ReportTotals {
  let income = 0;
  let spending = 0;
  let saved = 0;
  transactions.forEach((tx) => {
    if (tx.status !== 'Completed') return;
    if (tx.kind === 'transfer') {
      if (tx.type === 'debit') saved = addMoney(saved, tx.amount, currency);
      return;
    }
    if (tx.kind === 'refund') {
      spending = subtractMoney(spending, tx.amount, currency);
      return;
    }
    if (tx.type === 'credit') income = addMoney(income, tx.amount, currency);
    else spending = addMoney(spending, tx.amount, currency);
  });
  return {
    income,
    spending,
    saved,
    net: subtractMoney(subtractMoney(income, spending, currency), saved, currency),
  };
}

export function computeCategoryBreakdown(
  transactions: readonly Transaction[],
  currency: Currency = DEFAULT_CURRENCY
): CategorySlice[] {
  const map = new Map<string, number>();
  transactions
    .filter((tx) => tx.status === 'Completed' && tx.type === 'debit' && tx.kind !== 'transfer')
    .forEach((tx) => {
      map.set(tx.category, addMoney(map.get(tx.category) ?? 0, tx.amount, currency));
    });
  const total = sumMoney(map.values(), currency);
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computePayeeBreakdown(
  transactions: readonly Transaction[],
  currency: Currency = DEFAULT_CURRENCY,
  limit = 5
): PayeeSlice[] {
  const map = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((tx) => tx.type === 'debit' && tx.kind !== 'transfer' && tx.status === 'Completed')
    .forEach((tx) => {
      const name = tx.counterparty ?? tx.title;
      const current = map.get(name) ?? { amount: 0, count: 0 };
      map.set(name, {
        amount: addMoney(current.amount, tx.amount, currency),
        count: current.count + 1,
      });
    });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildStatementCsv(
  transactions: readonly Transaction[],
  accountsById: ReadonlyMap<string, Account>
): string {
  const header = [
    'Date',
    'Title',
    'Category',
    'Direction',
    'Status',
    'Amount',
    'Currency',
    'Account',
    'Reference',
    'Counterparty',
    'Note',
  ];
  const rows = transactions.map((tx) => {
    const account = tx.accountId ? accountsById.get(tx.accountId) : undefined;
    return [
      formatDate(tx.date),
      tx.title,
      tx.category,
      tx.type,
      tx.status,
      tx.amount.toFixed(2),
      transactionCurrency(tx, accountsById),
      account ? `${account.name} (${account.currency})` : '',
      tx.reference ?? '',
      tx.counterparty ?? '',
      tx.note ?? '',
    ]
      .map(csvCell)
      .join(',');
  });
  return [header.map(csvCell).join(','), ...rows].join('\r\n');
}


