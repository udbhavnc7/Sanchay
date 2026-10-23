import { describe, expect, it } from 'vitest';
import {
  applyTransactionToBalance,
  replaceTransactionOnBalance,
  reverseTransactionFromBalance,
  transactionMinorDelta,
} from './ledger';

describe('ledger balance effects', () => {
  it('treats credits as money in and debits as money out', () => {
    expect(transactionMinorDelta({ type: 'credit', amount: 125.5 })).toBe(12550);
    expect(transactionMinorDelta({ type: 'debit', amount: 125.5 })).toBe(-12550);

    expect(applyTransactionToBalance(1000, { type: 'credit', amount: 125.5 })).toBe(1125.5);
    expect(applyTransactionToBalance(1000, { type: 'debit', amount: 125.5 })).toBe(874.5);
  });

  it('reverses an applied transaction without floating-point drift', () => {
    const balance = 874.5;
    const transaction = { type: 'debit' as const, amount: 0.1 };

    expect(applyTransactionToBalance(balance, transaction)).toBe(874.4);
    expect(reverseTransactionFromBalance(874.4, transaction)).toBe(874.5);
    expect(reverseTransactionFromBalance(1000, { type: 'credit', amount: 0.2 })).toBe(999.8);
  });

  it('replaces a transaction by removing its old effect before applying the new one', () => {
    expect(
      replaceTransactionOnBalance(
        1000,
        { type: 'debit', amount: 100 },
        { type: 'debit', amount: 250 }
      )
    ).toBe(850);

    expect(
      replaceTransactionOnBalance(
        1000,
        { type: 'credit', amount: 100 },
        { type: 'debit', amount: 250 }
      )
    ).toBe(650);
  });

  it('handles decimal balances consistently', () => {
    expect(applyTransactionToBalance(1000, { type: 'credit', amount: 100.4 })).toBe(1100.4);
    expect(applyTransactionToBalance(1000, { type: 'debit', amount: 100.4 })).toBe(899.6);
  });
});
