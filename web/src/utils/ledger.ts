import type { Transaction } from '../types/finance';
import { fromMinorUnits, toMinorUnits } from './money';

type TransactionEffect = Pick<Transaction, 'type' | 'amount'>;

export function transactionMinorDelta(transaction: TransactionEffect): number {
  return transaction.type === 'credit'
    ? toMinorUnits(transaction.amount)
    : -toMinorUnits(transaction.amount);
}

export function applyTransactionToBalance(
  balance: number,
  transaction: TransactionEffect
): number {
  return fromMinorUnits(toMinorUnits(balance) + transactionMinorDelta(transaction));
}

export function reverseTransactionFromBalance(
  balance: number,
  transaction: TransactionEffect
): number {
  return fromMinorUnits(toMinorUnits(balance) - transactionMinorDelta(transaction));
}

export function replaceTransactionOnBalance(
  balance: number,
  previous: TransactionEffect,
  next: TransactionEffect
): number {
  return fromMinorUnits(
    toMinorUnits(balance) - transactionMinorDelta(previous) + transactionMinorDelta(next)
  );
}
