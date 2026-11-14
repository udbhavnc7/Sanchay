import type { Account, CategoryDefinition, Currency, Transaction } from '../types/finance';
import { addMoney, formatDate, minorDigits, subtractMoney, sumMoney } from './money';
import { categoryLabel } from './categories';

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

export interface StatementOptions {
  categoryDefinitions?: CategoryDefinition[];
  includeTags?: boolean;
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
      // Only completed goal contributions count as saved. Internal account
      // transfers move money without changing net worth or spending.
      if (tx.goalId && tx.type === 'debit') saved = addMoney(saved, tx.amount, currency);
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

/**
 * Net completed spending per category in one currency:
 * transfers are excluded, refunds reduce their category, spending is positive.
 */
export function computeCategorySpending(
  transactions: readonly Transaction[],
  currency: Currency = DEFAULT_CURRENCY
): Map<string, number> {
  const map = new Map<string, number>();
  transactions.forEach((tx) => {
    if (tx.status !== 'Completed') return;
    if (tx.kind === 'transfer') return;
    if (tx.kind === 'refund') {
      map.set(tx.category, subtractMoney(map.get(tx.category) ?? 0, tx.amount, currency));
      return;
    }
    if (tx.type === 'debit') {
      map.set(tx.category, addMoney(map.get(tx.category) ?? 0, tx.amount, currency));
    }
  });
  return map;
}

export function computeCategoryBreakdown(
  transactions: readonly Transaction[],
  currency: Currency = DEFAULT_CURRENCY
): CategorySlice[] {
  const map = computeCategorySpending(transactions, currency);
  const entries = Array.from(map.entries()).filter(([, amount]) => amount > 0);
  const total = sumMoney(
    entries.map(([, amount]) => amount),
    currency
  );
  return entries
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
  transactions.forEach((tx) => {
    if (tx.status !== 'Completed' || tx.kind === 'transfer') return;
    const name = tx.counterparty ?? tx.title;
    const current = map.get(name);
    if (tx.type === 'debit') {
      map.set(name, {
        amount: addMoney(current?.amount ?? 0, tx.amount, currency),
        count: (current?.count ?? 0) + 1,
      });
      return;
    }
    // Refunds reduce what the payee actually took, without adding a payment.
    if ((tx.kind === 'refund' || tx.refundOfId) && current) {
      map.set(name, {
        amount: subtractMoney(current.amount, tx.amount, currency),
        count: current.count,
      });
    }
  });
  return Array.from(map.entries())
    .filter(([, value]) => value.amount > 0)
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/** True when any searchable field, readable category label or tag matches. */
export function transactionMatchesSearch(
  transaction: Transaction,
  query: string,
  accountsById: ReadonlyMap<string, Account>,
  categoryDefinitions: CategoryDefinition[] = []
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const account = transaction.accountId ? accountsById.get(transaction.accountId) : undefined;
  return [
    transaction.title,
    transaction.counterparty ?? '',
    transaction.recipient ?? '',
    transaction.category,
    categoryLabel(transaction.category, categoryDefinitions),
    transaction.reference ?? '',
    transaction.note ?? '',
    account?.name ?? '',
    ...(transaction.tags ?? []),
  ].some((value) => value.toLowerCase().includes(normalized));
}

const FORMULA_LEAD = /^\s*[=+\-@\t\r\n]/;

function csvCell(value: string | number): string {
  let text = String(value ?? '');
  // Neutralize spreadsheet formulas without losing the original text.
  if (FORMULA_LEAD.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildStatementCsv(
  transactions: readonly Transaction[],
  accountsById: ReadonlyMap<string, Account>,
  options: StatementOptions = {}
): string {
  const { categoryDefinitions = [], includeTags = true } = options;
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
    ...(includeTags ? ['Tags'] : []),
  ];
  const rows = transactions.map((tx) => {
    const account = tx.accountId ? accountsById.get(tx.accountId) : undefined;
    const currency = transactionCurrency(tx, accountsById);
    const digits = minorDigits(currency);
    const amount = digits === 0 ? String(Math.round(tx.amount)) : tx.amount.toFixed(digits);
    return [
      formatDate(tx.date),
      tx.title,
      categoryLabel(tx.category, categoryDefinitions),
      tx.type,
      tx.status,
      amount,
      currency,
      account ? `${account.name} (${account.currency})` : '',
      tx.reference ?? '',
      tx.counterparty ?? '',
      tx.note ?? '',
      ...(includeTags ? [(tx.tags ?? []).join('; ')] : []),
    ]
      .map(csvCell)
      .join(',');
  });
  return [header.map(csvCell).join(','), ...rows].join('\r\n');
}
