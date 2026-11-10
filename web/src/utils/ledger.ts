import type { Currency, Transaction } from '../types/finance';
import { fromMinorUnits, toMinorUnits } from './money';

type TransactionEffect = Pick<Transaction, 'type' | 'amount'> &
  Partial<Pick<Transaction, 'currency'>>;

function effectCurrency(
  transaction: TransactionEffect,
  currency?: Currency
): Currency {
  return currency ?? transaction.currency ?? 'INR';
}

export function transactionMinorDelta(
  transaction: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(transaction, currency);
  return transaction.type === 'credit'
    ? toMinorUnits(transaction.amount, ccy)
    : -toMinorUnits(transaction.amount, ccy);
}

export function applyTransactionToBalance(
  balance: number,
  transaction: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(transaction, currency);
  return fromMinorUnits(
    toMinorUnits(balance, ccy) + transactionMinorDelta(transaction, ccy),
    ccy
  );
}

export function reverseTransactionFromBalance(
  balance: number,
  transaction: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(transaction, currency);
  return fromMinorUnits(
    toMinorUnits(balance, ccy) - transactionMinorDelta(transaction, ccy),
    ccy
  );
}

export function replaceTransactionOnBalance(
  balance: number,
  previous: TransactionEffect,
  next: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(next, currency ?? previous.currency);
  return fromMinorUnits(
    toMinorUnits(balance, ccy) -
      transactionMinorDelta(previous, ccy) +
      transactionMinorDelta(next, ccy),
    ccy
  );
}

export function balanceAfterTransactionEdit(
  balance: number,
  previous: TransactionEffect | null,
  next: TransactionEffect,
  currency?: Currency
): number {
  return previous
    ? replaceTransactionOnBalance(balance, previous, next, currency)
    : applyTransactionToBalance(balance, next, currency);
}
