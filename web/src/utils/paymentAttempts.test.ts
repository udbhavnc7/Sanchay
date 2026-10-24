import { describe, expect, it } from 'vitest';
import type { Account, Contact, PaymentAttempt, PaymentAttemptInput, Transaction } from '../types/finance';
import {
  buildPaymentRequestText,
  confirmPaymentAttempt,
  createPaymentAttempt,
  isLikelyUpiId,
  linkedTransactionForAttempt,
  paymentAttemptInputError,
  paymentAttemptStatusLabel,
  paymentDetailsText,
  updatePaymentAttemptStatus,
} from './paymentAttempts';

const payee: Contact = {
  id: 'c1',
  name: 'Ayesha Khan',
  handle: '@ayesha.k',
  type: 'Person',
  bank: 'HDFC Bank',
  upiId: 'ayesha.k@okhdfcbank',
  currency: 'INR',
  initials: 'AK',
  avatarColor: '#f59e0b',
  isFavorite: true,
};

const account: Account = {
  id: 'a1',
  name: 'Everyday account',
  type: 'Bank',
  currency: 'INR',
  balance: 10000,
  status: 'Active',
  change: 0,
};

const input: PaymentAttemptInput = {
  payee,
  upiId: 'ayesha.k@okhdfcbank',
  amount: 1200,
  accountId: 'a1',
  category: 'Other',
  note: 'Dinner',
};

function preparedAttempt(overrides: Partial<PaymentAttempt> = {}): PaymentAttempt {
  return {
    ...createPaymentAttempt(input, { id: 'pa_test_1', now: '2026-10-24T10:00:00.000Z' }),
    ...overrides,
  };
}

describe('Path A payment attempts', () => {
  it('creates a prepared attempt without a ledger transaction', () => {
    const attempt = preparedAttempt();
    expect(attempt.status).toBe('prepared');
    expect(attempt.transactionId).toBeUndefined();
    expect(attempt.upiId).toBe('ayesha.k@okhdfcbank');
  });

  it('validates the account, amount and UPI ID before preparing', () => {
    expect(paymentAttemptInputError(input, [account])).toBe('');
    expect(paymentAttemptInputError({ ...input, upiId: '  ' }, [account])).toContain('UPI ID');
    expect(paymentAttemptInputError({ ...input, amount: 0 }, [account])).toContain('amount');
    expect(paymentAttemptInputError({ ...input, accountId: 'missing' }, [account])).toContain(
      'account'
    );
    expect(paymentAttemptInputError(input, [{ ...account, status: 'Inactive' }])).toContain(
      'not active'
    );
    expect(paymentAttemptInputError({ ...input, amount: 12000 }, [account])).toContain(
      'Not enough'
    );
  });

  it('treats UPI ID syntax as a format check only', () => {
    expect(isLikelyUpiId('ayesha.k@okhdfcbank')).toBe(true);
    expect(isLikelyUpiId('ayesha.k')).toBe(false);
    expect(isLikelyUpiId('')).toBe(false);
  });

  it('confirms once and links exactly one ledger transaction', () => {
    const attempt = preparedAttempt();
    const result = confirmPaymentAttempt(attempt, account, [], {
      now: '2026-10-24T10:05:00.000Z',
      userReference: 'UTR-123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.duplicate).toBe(false);
    expect(result.attempt.status).toBe('marked_paid_by_user');
    expect(result.attempt.transactionId).toBe(result.transaction.id);
    expect(result.transaction.paymentAttemptId).toBe(attempt.id);
    expect(result.transaction.recipient).toBe(attempt.upiId);
    expect(result.transaction.userReference).toBe('UTR-123');
    expect(result.transaction.amount).toBe(attempt.amount);
    expect(linkedTransactionForAttempt([result.transaction], attempt.id)).toEqual(
      result.transaction
    );
  });

  it('does not create a second transaction when confirmation is retried', () => {
    const attempt = preparedAttempt();
    const first = confirmPaymentAttempt(attempt, account, [], {
      now: '2026-10-24T10:05:00.000Z',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const retry = confirmPaymentAttempt(first.attempt, account, [first.transaction], {
      now: '2026-10-24T10:06:00.000Z',
    });

    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.duplicate).toBe(true);
    expect(retry.transaction).toEqual(first.transaction);
  });

  it('reports a broken link instead of duplicating an already-paid attempt', () => {
    const attempt = preparedAttempt({
      status: 'marked_paid_by_user',
      transactionId: 'tx_pa_test_1',
    });
    const result = confirmPaymentAttempt(attempt, account, [], {
      now: '2026-10-24T10:05:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('ledger entry could not be found');
  });

  it('never records an expense for cancelled or failed attempts', () => {
    const attempt = updatePaymentAttemptStatus(
      preparedAttempt(),
      'cancelled_or_failed',
      '2026-10-24T10:04:00.000Z'
    );
    const result = confirmPaymentAttempt(attempt, account, [], {
      now: '2026-10-24T10:05:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('cancelled or failed');
  });

  it('allows an unresolved attempt to be confirmed later', () => {
    const attempt = updatePaymentAttemptStatus(
      preparedAttempt(),
      'needs_reconciliation',
      '2026-10-24T10:04:00.000Z'
    );
    const result = confirmPaymentAttempt(attempt, account, [], {
      now: '2026-10-24T10:05:00.000Z',
    });

    expect(result.ok).toBe(true);
  });

  it('uses accurate status labels and copy text without a UPI URI or QR', () => {
    const attempt = preparedAttempt();
    expect(paymentAttemptStatusLabel('marked_paid_by_user')).toBe(
      'Marked paid by you — not verified by Sanchay'
    );

    const details = paymentDetailsText(attempt);
    expect(details).toContain('ayesha.k@okhdfcbank');
    expect(details).toContain('Sanchay does not send money');
    expect(details).not.toContain('upi://');
    expect(details.toLowerCase()).not.toContain('qr');

    const request = buildPaymentRequestText({
      payerName: 'Rafiq',
      amount: 500,
      currency: 'INR',
      note: 'Lunch',
      myUpiId: 'sanchay.user@okicici',
      reference: 'REQ-123',
    });
    expect(request).toContain('plain text request');
    expect(request).toContain('not a UPI Collect request');
    expect(request).not.toContain('upi://');
  });

  it('keeps existing transactions unaffected by the attempt model', () => {
    const existing: Transaction = {
      id: 'tx_old',
      title: 'Old expense',
      category: 'Other',
      amount: 10,
      type: 'debit',
      status: 'Completed',
      date: '2026-10-01T00:00:00.000Z',
    };
    expect(linkedTransactionForAttempt([existing], 'pa_test_1')).toBeUndefined();
  });
});
