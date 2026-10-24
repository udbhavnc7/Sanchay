import type {
  Account,
  PaymentAttempt,
  PaymentAttemptInput,
  PaymentAttemptStatus,
  Transaction,
} from '../types/finance';
import { compareMoney, formatMoney, isValidAmount } from './money';

export const PAYMENT_ATTEMPT_STATUSES: PaymentAttemptStatus[] = [
  'prepared',
  'needs_reconciliation',
  'marked_paid_by_user',
  'cancelled_or_failed',
];

export function isPaymentAttemptStatus(value: unknown): value is PaymentAttemptStatus {
  return (
    typeof value === 'string' &&
    PAYMENT_ATTEMPT_STATUSES.includes(value as PaymentAttemptStatus)
  );
}

export function isPaymentAttemptUnresolved(attempt: PaymentAttempt): boolean {
  return attempt.status === 'prepared' || attempt.status === 'needs_reconciliation';
}

export function paymentAttemptStatusLabel(status: PaymentAttemptStatus): string {
  switch (status) {
    case 'prepared':
      return 'Prepared — pay in your UPI app';
    case 'needs_reconciliation':
      return 'Outcome not confirmed';
    case 'marked_paid_by_user':
      return 'Marked paid by you — not verified by Sanchay';
    case 'cancelled_or_failed':
      return 'Cancelled or failed';
  }
}

export function isLikelyUpiId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.includes('@')) return false;
  const [name, handle] = trimmed.split('@');
  return name.length > 0 && handle.length > 0 && !/\s/.test(trimmed);
}

export function paymentAttemptInputError(
  input: PaymentAttemptInput,
  accounts: Account[]
): string {
  if (!input.payee) return 'Choose someone to pay.';
  if (!input.upiId.trim()) return 'Enter the UPI ID you were given.';
  if (!isValidAmount(input.amount)) return 'Enter an amount greater than zero.';

  const account = accounts.find((item) => item.id === input.accountId);
  if (!account) return `You have no active ${input.payee.currency ?? 'INR'} account to pay from.`;
  if (account.status !== 'Active') return `${account.name} is not active right now.`;
  if (account.currency !== (input.payee.currency ?? 'INR')) {
    return `${input.payee.name} receives ${input.payee.currency ?? 'INR'}. Pick a matching account.`;
  }
  if (compareMoney(account.balance, input.amount) < 0) {
    return `Not enough in ${account.name}. Available ${formatMoney(
      account.balance,
      account.currency
    )}.`;
  }

  return '';
}

export function createPaymentAttempt(
  input: PaymentAttemptInput,
  options: { id: string; now: string }
): PaymentAttempt {
  return {
    id: options.id,
    payeeId: input.payee.id,
    payeeName: input.payee.name,
    upiId: input.upiId.trim(),
    amount: input.amount,
    currency: input.payee.currency ?? 'INR',
    accountId: input.accountId,
    category: input.category,
    note: input.note?.trim() || undefined,
    status: 'prepared',
    createdAt: options.now,
    updatedAt: options.now,
  };
}

export function linkedTransactionForAttempt(
  transactions: Transaction[],
  attemptId: string
): Transaction | undefined {
  return transactions.find((transaction) => transaction.paymentAttemptId === attemptId);
}

export interface ConfirmPaymentAttemptOptions {
  now: string;
  userReference?: string;
}

export type ConfirmPaymentAttemptResult =
  | {
      ok: true;
      attempt: PaymentAttempt;
      transaction: Transaction;
      duplicate: boolean;
    }
  | { ok: false; error: string; attempt: PaymentAttempt };

export function confirmPaymentAttempt(
  attempt: PaymentAttempt,
  account: Account | undefined,
  transactions: Transaction[],
  options: ConfirmPaymentAttemptOptions
): ConfirmPaymentAttemptResult {
  const linked = linkedTransactionForAttempt(transactions, attempt.id);

  if (attempt.status === 'marked_paid_by_user' || attempt.transactionId) {
    if (linked) {
      return { ok: true, attempt, transaction: linked, duplicate: true };
    }
    return {
      ok: false,
      error: 'This payment is already marked paid, but its ledger entry could not be found.',
      attempt,
    };
  }

  if (attempt.status === 'cancelled_or_failed') {
    return {
      ok: false,
      error: 'This payment was cancelled or failed, so it cannot be recorded as paid.',
      attempt,
    };
  }

  if (!account) {
    return { ok: false, error: 'Choose the account this payment came from.', attempt };
  }
  if (account.status !== 'Active') {
    return { ok: false, error: `${account.name} is not active right now.`, attempt };
  }
  if (account.currency !== attempt.currency) {
    return {
      ok: false,
      error: `This payment is in ${attempt.currency}, but ${account.name} is ${account.currency}.`,
      attempt,
    };
  }
  if (!isValidAmount(attempt.amount)) {
    return { ok: false, error: 'Enter an amount greater than zero.', attempt };
  }
  if (compareMoney(account.balance, attempt.amount) < 0) {
    return {
      ok: false,
      error: `Not enough in ${account.name}. Available ${formatMoney(
        account.balance,
        account.currency
      )}.`,
      attempt,
    };
  }

  const userReference = options.userReference?.trim() || attempt.userReference;
  const transaction: Transaction = {
    id: `tx_${attempt.id}`,
    reference: `PAY-${attempt.id.replace(/^pa_/, '').slice(-8).toUpperCase()}`,
    title: `Payment to ${attempt.payeeName}`,
    category: attempt.category,
    amount: attempt.amount,
    type: 'debit',
    status: 'Completed',
    date: options.now,
    accountId: account.id,
    counterparty: attempt.payeeName,
    recipient: attempt.upiId,
    note: attempt.note,
    kind: 'expense',
    paymentAttemptId: attempt.id,
    userReference,
  };

  return {
    ok: true,
    attempt: {
      ...attempt,
      status: 'marked_paid_by_user',
      updatedAt: options.now,
      transactionId: transaction.id,
      userReference,
    },
    transaction,
    duplicate: false,
  };
}

export function updatePaymentAttemptStatus(
  attempt: PaymentAttempt,
  status: 'needs_reconciliation' | 'cancelled_or_failed',
  now: string
): PaymentAttempt {
  return { ...attempt, status, updatedAt: now };
}

export function paymentDetailsText(attempt: PaymentAttempt): string {
  return [
    `Pay ${formatMoney(attempt.amount, attempt.currency)} to ${attempt.payeeName}`,
    `UPI ID: ${attempt.upiId}`,
    attempt.note ? `Note: ${attempt.note}` : '',
    'Open your own UPI app and enter these details there.',
    'Check the recipient name and amount before authorising.',
    'Sanchay does not send money and cannot verify this payment.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPaymentRequestText(input: {
  payerName: string;
  amount: number;
  currency: PaymentAttempt['currency'];
  note?: string;
  myUpiId: string;
  reference: string;
}): string {
  const notePart = input.note?.trim() ? ` for ${input.note.trim()}` : '';
  return [
    `Hi ${input.payerName}, could you send me ${formatMoney(
      input.amount,
      input.currency
    )}${notePart}?`,
    `My UPI ID: ${input.myUpiId.trim() || '[add your UPI ID]'}`,
    'Please pay using your own UPI app and check the recipient name before authorising.',
    'This is a plain text request from Sanchay, not a UPI Collect request.',
    `Sanchay request reference: ${input.reference}`,
  ].join('\n');
}
