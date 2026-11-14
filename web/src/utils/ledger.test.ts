import { describe, expect, it } from 'vitest';
import {
  applyTransactionToBalance,
  balanceAfterTransactionEdit,
  replaceTransactionOnBalance,
  reverseTransactionFromBalance,
  transactionMinorDelta,
} from './ledger';

describe('ledger balance effects', () => {
  it('rejects unsafe balances and amounts rather than returning a rounded ledger', () => {
    expect(() => applyTransactionToBalance(90071992547409.9, { type: 'credit', amount: 1 })).toThrow();
    expect(() => reverseTransactionFromBalance(90071992547409.9, { type: 'debit', amount: 1 })).toThrow();
    expect(() => applyTransactionToBalance(100, { type: 'credit', amount: NaN })).toThrow();
    expect(() => applyTransactionToBalance(100, { type: 'debit', amount: 1.000000001, currency: 'JPY' })).toThrow();
  });

  it('replaces large safe amounts without unsafe intermediate arithmetic', () => {
    expect(replaceTransactionOnBalance(90071992547409.9, { type: 'debit', amount: 1000 }, { type: 'debit', amount: 1000 })).toBe(90071992547409.9);
  });

  it.each(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const)('honors explicit %s currency for legacy transaction effects', currency => {
    expect(applyTransactionToBalance(100, { type: 'debit', amount: 1 }, currency)).toBe(99);
    expect(reverseTransactionFromBalance(99, { type: 'debit', amount: 1 }, currency)).toBe(100);
    expect(transactionMinorDelta({ type: 'debit', amount: 1 }, currency)).toBe(currency === 'JPY' ? -1 : -100);
  });

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

  it('previews an edit by replacing the old effect only on the same account', () => {
    const previous = { type: 'debit' as const, amount: 100 };

    expect(
      balanceAfterTransactionEdit(1000, previous, { type: 'debit', amount: 250 })
    ).toBe(850);
    expect(
      balanceAfterTransactionEdit(1000, null, { type: 'debit', amount: 250 })
    ).toBe(750);
    expect(
      balanceAfterTransactionEdit(1000, previous, { type: 'credit', amount: 100 })
    ).toBe(1200);
  });
});
