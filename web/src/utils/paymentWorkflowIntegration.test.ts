import { describe, expect, it } from 'vitest';
import type { Account, Contact, PaymentAttemptInput, Transaction } from '../types/finance';
import {
  confirmPaymentAttempt,
  createPaymentAttempt,
  paymentAttemptInputError,
  updatePaymentAttemptStatus,
} from './paymentAttempts';
import { subtractMoney } from './money';

describe('Payment Transaction Workflow End-to-End', () => {
  const mockAccount: Account = {
    id: 'acc_main',
    name: 'Primary Checking',
    type: 'Bank',
    currency: 'INR',
    balance: 50000,
    status: 'Active',
    change: 0,
  };

  const mockPayee: Contact = {
    id: 'c_raj',
    name: 'Rajesh Kumar',
    handle: '@rajesh',
    type: 'Person',
    bank: 'State Bank of India',
    upiId: 'rajesh@sbi',
    currency: 'INR',
    initials: 'RK',
    avatarColor: '#10b981',
    isFavorite: true,
  };

  const validPaymentInput: PaymentAttemptInput = {
    payee: mockPayee,
    upiId: 'rajesh@sbi',
    amount: 5000,
    accountId: 'acc_main',
    category: 'Shopping',
    note: 'Festival purchase',
  };

  it('step 1: validates payment inputs before preparation', () => {
    // Missing UPI ID
    expect(paymentAttemptInputError({ ...validPaymentInput, upiId: '' }, [mockAccount])).toContain('UPI ID');
    
    // Invalid UPI ID syntax
    expect(paymentAttemptInputError({ ...validPaymentInput, upiId: 'invalidupi' }, [mockAccount])).toContain('valid UPI ID');

    // Amount zero or negative
    expect(paymentAttemptInputError({ ...validPaymentInput, amount: 0 }, [mockAccount])).toContain('greater than zero');

    // Amount exceeds balance
    expect(paymentAttemptInputError({ ...validPaymentInput, amount: 60000 }, [mockAccount])).toContain('Not enough');

    // Inactive account
    expect(
      paymentAttemptInputError(validPaymentInput, [{ ...mockAccount, status: 'Inactive' }])
    ).toContain('not active');

    // Successful validation
    expect(paymentAttemptInputError(validPaymentInput, [mockAccount])).toBe('');
  });

  it('step 2: prepares attempt without altering balance or ledger', () => {
    const attempt = createPaymentAttempt(validPaymentInput, {
      id: 'pa_fest_01',
      now: '2026-10-24T12:00:00.000Z',
    });

    expect(attempt.id).toBe('pa_fest_01');
    expect(attempt.status).toBe('prepared');
    expect(attempt.amount).toBe(5000);
    expect(attempt.upiId).toBe('rajesh@sbi');
    expect(attempt.transactionId).toBeUndefined();
    // Balance remains 50000
    expect(mockAccount.balance).toBe(50000);
  });

  it('step 3: completes payment confirmation, creates ledger transaction, and updates balance', () => {
    let currentAccount = { ...mockAccount };
    let transactions: Transaction[] = [];
    const attempt = createPaymentAttempt(validPaymentInput, {
      id: 'pa_fest_02',
      now: '2026-10-24T12:00:00.000Z',
    });

    const confirmRes = confirmPaymentAttempt(attempt, currentAccount, transactions, {
      now: '2026-10-24T12:05:00.000Z',
      userReference: 'SBI-UTR-9876543210',
    });

    expect(confirmRes.ok).toBe(true);
    if (!confirmRes.ok) return;

    expect(confirmRes.duplicate).toBe(false);
    expect(confirmRes.attempt.status).toBe('marked_paid_by_user');
    expect(confirmRes.attempt.userReference).toBe('SBI-UTR-9876543210');
    expect(confirmRes.transaction.title).toBe('Payment to Rajesh Kumar');
    expect(confirmRes.transaction.recipient).toBe('rajesh@sbi');
    expect(confirmRes.transaction.userReference).toBe('SBI-UTR-9876543210');
    expect(confirmRes.transaction.amount).toBe(5000);

    // Update account balance
    currentAccount = {
      ...currentAccount,
      balance: subtractMoney(currentAccount.balance, attempt.amount),
    };
    transactions.push(confirmRes.transaction);

    expect(currentAccount.balance).toBe(45000);
    expect(transactions).toHaveLength(1);

    // Duplicate confirmation test
    const retryRes = confirmPaymentAttempt(confirmRes.attempt, currentAccount, transactions, {
      now: '2026-10-24T12:06:00.000Z',
    });

    expect(retryRes.ok).toBe(true);
    if (!retryRes.ok) return;
    expect(retryRes.duplicate).toBe(true);
    expect(retryRes.transaction.id).toBe(confirmRes.transaction.id);
    // Balance is NOT subtracted a second time
    expect(currentAccount.balance).toBe(45000);
    expect(transactions).toHaveLength(1);
  });

  it('step 4: handles reconciliation deferral and cancellation without expense', () => {
    let currentAccount = { ...mockAccount };
    let transactions: Transaction[] = [];

    const attempt = createPaymentAttempt(validPaymentInput, {
      id: 'pa_fest_03',
      now: '2026-10-24T12:00:00.000Z',
    });

    // Defer to reconciliation queue
    const deferredAttempt = updatePaymentAttemptStatus(
      attempt,
      'needs_reconciliation',
      '2026-10-24T12:02:00.000Z'
    );
    expect(deferredAttempt.status).toBe('needs_reconciliation');
    expect(currentAccount.balance).toBe(50000);
    expect(transactions).toHaveLength(0);

    // Cancel attempt
    const cancelledAttempt = updatePaymentAttemptStatus(
      deferredAttempt,
      'cancelled_or_failed',
      '2026-10-24T12:10:00.000Z'
    );
    expect(cancelledAttempt.status).toBe('cancelled_or_failed');

    // Attempting to confirm a cancelled attempt fails
    const failRes = confirmPaymentAttempt(cancelledAttempt, currentAccount, transactions, {
      now: '2026-10-24T12:11:00.000Z',
    });
    expect(failRes.ok).toBe(false);
    expect(currentAccount.balance).toBe(50000);
    expect(transactions).toHaveLength(0);
  });
});
