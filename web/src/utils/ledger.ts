import type { Currency, Transaction } from '../types/finance';
import { fromMinorUnits, isValidAmount, toMinorUnits } from './money';

function safeMinor(amount: number, currency: Currency): number {
  const minor = toMinorUnits(amount, currency);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(minor)) {
    throw new RangeError('That amount or resulting balance is too large.');
  }
  return minor;
}

function checkedBalance(minor: bigint, currency: Currency): number {
  const value = Number(minor);
  const balance = fromMinorUnits(value, currency);
  if (!Number.isSafeInteger(value) || toMinorUnits(balance, currency) !== value) {
    throw new RangeError('That amount or resulting balance is too large.');
  }
  return balance;
}

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
  if (!isValidAmount(transaction.amount, ccy) ||
      (ccy === 'JPY' && !Number.isInteger(transaction.amount))) {
    throw new RangeError('Enter a valid amount in the account currency.');
  }
  const minor = safeMinor(transaction.amount, ccy);
  if (minor <= 0) throw new RangeError('Enter an amount greater than zero.');
  return transaction.type === 'credit' ? minor : -minor;
}

export function applyTransactionToBalance(
  balance: number,
  transaction: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(transaction, currency);
  return checkedBalance(
    BigInt(safeMinor(balance, ccy)) + BigInt(transactionMinorDelta(transaction, ccy)),
    ccy
  );
}

export function reverseTransactionFromBalance(
  balance: number,
  transaction: TransactionEffect,
  currency?: Currency
): number {
  const ccy = effectCurrency(transaction, currency);
  return checkedBalance(
    BigInt(safeMinor(balance, ccy)) - BigInt(transactionMinorDelta(transaction, ccy)),
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
  return checkedBalance(
    BigInt(safeMinor(balance, ccy)) -
      BigInt(transactionMinorDelta(previous, ccy)) +
      BigInt(transactionMinorDelta(next, ccy)),
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
