import type {
  Account,
  Currency,
  NewTransactionInput,
  SavingsGoal,
  Transaction,
  UpdateTransactionInput,
} from '../types/finance';
import {
  addMoney,
  compareMoney,
  formatMoney,
  fromMinorUnits,
  isValidAmount,
  minorDigits,
  subtractMoney,
  toMinorUnits,
} from './money';
import {
  applyTransactionToBalance,
  balanceAfterTransactionEdit,
  reverseTransactionFromBalance,
} from './ledger';

export interface LedgerState {
  accounts: Account[];
  transactions: Transaction[];
  goals: SavingsGoal[];
}

export type LedgerOpResult =
  | { ok: true; state: LedgerState; transaction: Transaction }
  | { ok: false; error: string };

export type DeleteOpResult =
  | { ok: true; state: LedgerState; transaction: Transaction; companions: Transaction[] }
  | { ok: false; error: string };

export type TransferOpResult =
  | { ok: true; state: LedgerState; legs: Transaction[] }
  | { ok: false; error: string };

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  title?: string;
  note?: string;
  rate?: number;
}

export interface TransferUpdateInput {
  transferId: string;
  amount?: number;
  date?: string;
  title?: string;
  note?: string;
}

export type LedgerStateResult =
  | { ok: true; state: LedgerState }
  | { ok: false; error: string };

function cloneState(state: LedgerState): LedgerState {
  return {
    accounts: [...state.accounts],
    transactions: [...state.transactions],
    goals: [...state.goals],
  };
}

function findAccount(state: LedgerState, accountId: string): Account | undefined {
  return state.accounts.find((item) => item.id === accountId);
}

export function addTransaction(
  state: LedgerState,
  input: NewTransactionInput,
  now: Date = new Date()
): LedgerOpResult {
  const account = findAccount(state, input.accountId);
  if (!account) {
    return { ok: false, error: 'Choose an account for this transaction.' };
  }
  if (account.status !== 'Active') {
    return { ok: false, error: `${account.name} is not active right now.` };
  }
  if (account.currency !== 'INR') {
    return { ok: false, error: 'Quick entry currently supports INR accounts only.' };
  }
  if (!isValidAmount(input.amount)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }

  const amount = fromMinorUnits(toMinorUnits(input.amount));
  if (input.type === 'expense' && compareMoney(account.balance, amount) < 0) {
    return {
      ok: false,
      error: `Not enough in ${account.name}. Available ${formatMoney(account.balance)}.`,
    };
  }

  const occurredAt = new Date(`${input.date}T12:00:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, error: 'Choose a valid date.' };
  }
  const today = new Date(now.getTime());
  today.setHours(23, 59, 59, 999);
  if (occurredAt > today) {
    return { ok: false, error: 'Use today or an earlier date.' };
  }

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reference: `ADD-${String(Date.now()).slice(-8)}`,
    title: input.title.trim() || input.category,
    category: input.category,
    amount,
    currency: account.currency,
    type: input.type === 'expense' ? 'debit' : 'credit',
    status: 'Completed',
    date: occurredAt.toISOString(),
    accountId: account.id,
    counterparty: input.title.trim() || input.category,
    note: input.note?.trim() || undefined,
    kind: input.type,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const next = cloneState(state);
  next.transactions = [transaction, ...next.transactions];
  next.accounts = next.accounts.map((item) =>
    item.id === account.id
      ? {
          ...item,
          balance:
            input.type === 'expense'
              ? subtractMoney(item.balance, amount)
              : addMoney(item.balance, amount),
        }
      : item
  );
  return { ok: true, state: next, transaction };
}

export function updateTransaction(
  state: LedgerState,
  input: UpdateTransactionInput,
  now: Date = new Date()
): LedgerOpResult {
  const existing = state.transactions.find((item) => item.id === input.id);
  if (!existing) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }
  if (existing.kind === 'transfer') {
    return { ok: false, error: 'Savings transfers cannot be edited here.' };
  }
  const existingAccount = existing.accountId
    ? findAccount(state, existing.accountId)
    : undefined;
  if (existingAccount && existingAccount.currency !== 'INR') {
    return { ok: false, error: 'Only INR transactions can be edited here.' };
  }

  const account = findAccount(state, input.accountId);
  if (!account) {
    return { ok: false, error: 'Choose an account for this transaction.' };
  }
  if (account.status !== 'Active' && account.id !== existing.accountId) {
    return { ok: false, error: `${account.name} is not active right now.` };
  }
  if (account.currency !== 'INR') {
    return { ok: false, error: 'Transaction editing currently supports INR accounts only.' };
  }
  if (!isValidAmount(input.amount)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }

  const amount = fromMinorUnits(toMinorUnits(input.amount));
  const occurredAt = new Date(`${input.date}T12:00:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, error: 'Choose a valid date.' };
  }
  const today = new Date(now.getTime());
  today.setHours(23, 59, 59, 999);
  if (occurredAt > today) {
    return { ok: false, error: 'Use today or an earlier date.' };
  }

  const nextEffect = {
    type: input.type === 'expense' ? ('debit' as const) : ('credit' as const),
    amount,
  };
  const affectsBalance = existing.status === 'Completed';
  const previousOnAccount = affectsBalance && existing.accountId === account.id ? existing : null;
  if (affectsBalance) {
    const resultingBalance = balanceAfterTransactionEdit(
      account.balance,
      previousOnAccount,
      nextEffect
    );
    if (input.type === 'expense' && compareMoney(resultingBalance, 0) < 0) {
      return {
        ok: false,
        error: `Not enough in ${account.name}. This change would leave ${formatMoney(resultingBalance)}.`,
      };
    }
  }

  const title = input.title.trim() || input.category;
  const updated: Transaction = {
    ...existing,
    title,
    category: input.category,
    amount,
    type: nextEffect.type,
    date: occurredAt.toISOString(),
    accountId: account.id,
    counterparty: existing.reference?.startsWith('ADD-')
      ? title
      : existing.counterparty ?? title,
    note: input.note?.trim() || undefined,
    kind: input.type,
    goalId: undefined,
    updatedAt: now.toISOString(),
  };

  const next = cloneState(state);
  next.transactions = next.transactions.map((item) => (item.id === updated.id ? updated : item));
  if (affectsBalance) {
    next.accounts = next.accounts.map((item) => {
      if (
        existing.accountId &&
        item.id === existing.accountId &&
        item.id !== account.id
      ) {
        return {
          ...item,
          balance: reverseTransactionFromBalance(item.balance, existing),
        };
      }
      if (item.id === account.id) {
        return {
          ...item,
          balance: balanceAfterTransactionEdit(
            item.balance,
            previousOnAccount,
            nextEffect
          ),
        };
      }
      return item;
    });
  }
  return { ok: true, state: next, transaction: updated };
}

export function deleteTransaction(state: LedgerState, id: string): DeleteOpResult {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }

  const companions = transaction.transferId
    ? state.transactions.filter(
        (item) => item.transferId === transaction.transferId && item.id !== transaction.id
      )
  : [];
  const removed = [transaction, ...companions];

  const next = cloneState(state);
  for (const leg of removed) {
    if (leg.status === 'Completed' && leg.accountId) {
      next.accounts = next.accounts.map((item) =>
        item.id === leg.accountId
          ? {
              ...item,
              balance: reverseTransactionFromBalance(item.balance, leg),
            }
          : item
      );
    }
    if (leg.goalId) {
      next.goals = next.goals.map((goal) => {
        if (goal.id !== leg.goalId) return goal;
        const nextSaved = subtractMoney(goal.savedAmount, leg.amount, leg.currency);
        return {
          ...goal,
          savedAmount: compareMoney(nextSaved, 0, leg.currency) < 0 ? 0 : nextSaved,
        };
      });
    }
  }

  const removedIds = new Set(removed.map((item) => item.id));
  next.transactions = next.transactions.filter((item) => !removedIds.has(item.id));
  return { ok: true, state: next, transaction, companions };
}

export function undoDeleteTransaction(
  state: LedgerState,
  input: Transaction | Transaction[]
): LedgerState {
  const legs = Array.isArray(input) ? input : [input];
  const missing = legs.filter(
    (leg) => !state.transactions.some((item) => item.id === leg.id)
  );
  if (missing.length === 0) {
    return state;
  }
  const next = cloneState(state);
  next.transactions = [...missing, ...next.transactions];
  for (const leg of missing) {
    if (leg.status === 'Completed' && leg.accountId) {
      next.accounts = next.accounts.map((item) =>
        item.id === leg.accountId
          ? {
              ...item,
              balance: applyTransactionToBalance(item.balance, leg),
            }
          : item
      );
    }
    if (leg.goalId) {
      next.goals = next.goals.map((goal) =>
        goal.id === leg.goalId
          ? { ...goal, savedAmount: addMoney(goal.savedAmount, leg.amount, leg.currency) }
          : goal
      );
    }
  }
  return next;
}

export function undoAddTransaction(state: LedgerState, transaction: Transaction): LedgerState {
  if (!state.transactions.some((item) => item.id === transaction.id)) {
    return state;
  }
  const next = cloneState(state);
  next.transactions = next.transactions.filter((item) => item.id !== transaction.id);
  if (transaction.status === 'Completed' && transaction.accountId) {
    next.accounts = next.accounts.map((item) =>
      item.id === transaction.accountId
        ? {
            ...item,
            balance: reverseTransactionFromBalance(item.balance, transaction),
          }
        : item
    );
  }
  if (transaction.goalId) {
    next.goals = next.goals.map((goal) => {
      if (goal.id !== transaction.goalId) return goal;
      const nextSaved = subtractMoney(goal.savedAmount, transaction.amount);
      return {
        ...goal,
        savedAmount: compareMoney(nextSaved, 0) < 0 ? 0 : nextSaved,
      };
    });
  }
  return next;
}

export function deleteAccount(state: LedgerState, accountId: string): LedgerStateResult {
  const account = findAccount(state, accountId);
  if (!account) {
    return { ok: false, error: 'That account no longer exists.' };
  }
  const linkedCount = state.transactions.filter((item) => item.accountId === accountId).length;
  if (linkedCount > 0) {
    const verb = linkedCount === 1 ? 'references' : 'reference';
    return {
      ok: false,
      error:
        `Cannot delete "${account.name}" — ${linkedCount} transaction${linkedCount === 1 ? '' : 's'} ` +
        `${verb} it. Archive the account instead so its history stays intact.`,
    };
  }
  const next = cloneState(state);
  next.accounts = next.accounts.filter((item) => item.id !== accountId);
  return { ok: true, state: next };
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number
): number {
  if (from === to) {
    return fromMinorUnits(toMinorUnits(amount, from), from);
  }
  const srcMinor = toMinorUnits(amount, from);
  const destMinor = Math.round(
    srcMinor * rate * 10 ** (minorDigits(to) - minorDigits(from))
  );
  return fromMinorUnits(destMinor, to);
}

function validateTransferDate(date: string, now: Date): string | null {
  const occurredAt = new Date(`${date}T12:00:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return 'Choose a valid date.';
  }
  const today = new Date(now.getTime());
  today.setHours(23, 59, 59, 999);
  if (occurredAt > today) {
    return 'Use today or an earlier date.';
  }
  return null;
}

export function createTransfer(
  state: LedgerState,
  input: TransferInput,
  now: Date = new Date()
): TransferOpResult {
  const from = findAccount(state, input.fromAccountId);
  const to = findAccount(state, input.toAccountId);
  if (!from) {
    return { ok: false, error: 'Choose the account to move money from.' };
  }
  if (!to) {
    return { ok: false, error: 'Choose the account to move money to.' };
  }
  if (from.id === to.id) {
    return { ok: false, error: 'Choose two different accounts.' };
  }
  if (from.status !== 'Active') {
    return { ok: false, error: `${from.name} is not active right now.` };
  }
  if (to.status !== 'Active') {
    return { ok: false, error: `${to.name} is not active right now.` };
  }
  if (!isValidAmount(input.amount, from.currency)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }

  const sameCurrency = from.currency === to.currency;
  let rate = 1;
  if (!sameCurrency) {
    if (!input.rate || !Number.isFinite(input.rate) || input.rate <= 0) {
      return {
        ok: false,
        error: `Enter an exchange rate: 1 ${from.currency} equals how many ${to.currency}?`,
      };
    }
    rate = input.rate;
  }

  const srcAmount = fromMinorUnits(toMinorUnits(input.amount, from.currency), from.currency);
  if (compareMoney(from.balance, srcAmount, from.currency) < 0) {
    return {
      ok: false,
      error: `Not enough in ${from.name}. Available ${formatMoney(from.balance, from.currency)}.`,
    };
  }

  const destAmount = convertAmount(srcAmount, from.currency, to.currency, rate);
  if (!isValidAmount(destAmount, to.currency)) {
    return {
      ok: false,
      error: 'That amount is too small to convert at this exchange rate.',
    };
  }

  const dateError = validateTransferDate(input.date, now);
  if (dateError) {
    return { ok: false, error: dateError };
  }
  const occurredAt = new Date(`${input.date}T12:00:00`);

  const transferId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const reference = `TRF-${String(Date.now()).slice(-8)}`;
  const title = input.title?.trim() || 'Transfer';
  const note = input.note?.trim() || undefined;
  const stamp = now.toISOString();

  const sourceLeg: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reference,
    title,
    category: 'Other',
    amount: srcAmount,
    currency: from.currency,
    type: 'debit',
    status: 'Completed',
    date: occurredAt.toISOString(),
    accountId: from.id,
    counterparty: to.name,
    note,
    kind: 'transfer',
    transferId,
    transferRate: sameCurrency ? undefined : rate,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const destinationLeg: Transaction = {
    ...sourceLeg,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount: destAmount,
    currency: to.currency,
    type: 'credit',
    accountId: to.id,
    counterparty: from.name,
  };

  const next = cloneState(state);
  next.transactions = [destinationLeg, sourceLeg, ...next.transactions];
  next.accounts = next.accounts.map((item) => {
    if (item.id === from.id) {
      return { ...item, balance: subtractMoney(item.balance, srcAmount, from.currency) };
    }
    if (item.id === to.id) {
      return { ...item, balance: addMoney(item.balance, destAmount, to.currency) };
    }
    return item;
  });
  return { ok: true, state: next, legs: [sourceLeg, destinationLeg] };
}

export function updateTransfer(
  state: LedgerState,
  input: TransferUpdateInput,
  now: Date = new Date()
): TransferOpResult {
  const legs = state.transactions.filter((item) => item.transferId === input.transferId);
  const sourceLeg = legs.find((item) => item.type === 'debit');
  const destinationLeg = legs.find((item) => item.type === 'credit');
  if (!sourceLeg || !destinationLeg) {
    return {
      ok: false,
      error: 'That transfer record is incomplete and cannot be edited.',
    };
  }
  const from = sourceLeg.accountId ? findAccount(state, sourceLeg.accountId) : undefined;
  const to = destinationLeg.accountId
    ? findAccount(state, destinationLeg.accountId)
    : undefined;
  if (!from || !to) {
    return {
      ok: false,
      error: 'One of the transfer accounts no longer exists.',
    };
  }

  const rate = sourceLeg.transferRate ?? 1;
  let nextSrcAmount = sourceLeg.amount;
  if (input.amount !== undefined) {
    if (!isValidAmount(input.amount, from.currency)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    nextSrcAmount = fromMinorUnits(toMinorUnits(input.amount, from.currency), from.currency);
  }
  const nextDestAmount = convertAmount(nextSrcAmount, from.currency, to.currency, rate);
  if (!isValidAmount(nextDestAmount, to.currency)) {
    return {
      ok: false,
      error: 'That amount is too small to convert at this exchange rate.',
    };
  }

  const legDate = new Date(sourceLeg.date);
  const nextDate =
    input.date ??
    `${legDate.getFullYear()}-${String(legDate.getMonth() + 1).padStart(2, '0')}-${String(
      legDate.getDate()
    ).padStart(2, '0')}`;
  const dateError = validateTransferDate(nextDate, now);
  if (dateError) {
    return { ok: false, error: dateError };
  }
  const occurredAt = new Date(`${nextDate}T12:00:00`);

  const next = cloneState(state);
  for (const leg of [sourceLeg, destinationLeg]) {
    if (leg.status === 'Completed' && leg.accountId) {
      next.accounts = next.accounts.map((item) =>
        item.id === leg.accountId
          ? { ...item, balance: reverseTransactionFromBalance(item.balance, leg) }
          : item
      );
    }
  }

  const fromBalance = next.accounts.find((item) => item.id === from.id)?.balance ?? 0;
  if (compareMoney(fromBalance, nextSrcAmount, from.currency) < 0) {
    return {
      ok: false,
      error: `Not enough in ${from.name}. This change would leave ${formatMoney(
        fromBalance,
        from.currency
      )}.`,
    };
  }

  const stamp = now.toISOString();
  const updatedSource: Transaction = {
    ...sourceLeg,
    amount: nextSrcAmount,
    date: occurredAt.toISOString(),
    title: input.title?.trim() || sourceLeg.title,
    note: input.note?.trim() || undefined,
    updatedAt: stamp,
  };
  const updatedDestination: Transaction = {
    ...destinationLeg,
    amount: nextDestAmount,
    date: occurredAt.toISOString(),
    title: updatedSource.title,
    note: updatedSource.note,
    updatedAt: stamp,
  };

  next.transactions = next.transactions.map((item) => {
    if (item.id === updatedSource.id) return updatedSource;
    if (item.id === updatedDestination.id) return updatedDestination;
    return item;
  });
  next.accounts = next.accounts.map((item) => {
    if (item.id === from.id) {
      return { ...item, balance: subtractMoney(item.balance, nextSrcAmount, from.currency) };
    }
    if (item.id === to.id) {
      return { ...item, balance: addMoney(item.balance, nextDestAmount, to.currency) };
    }
    return item;
  });
  return { ok: true, state: next, legs: [updatedSource, updatedDestination] };
}


export interface RefundInput {
  originalTransactionId: string;
  amount: number;
  date?: string;
  title?: string;
  note?: string;
  accountId?: string;
}

export type RefundOpResult =
  | { ok: true; state: LedgerState; transaction: Transaction }
  | { ok: false; error: string };

export function recordRefund(
  state: LedgerState,
  input: RefundInput,
  now: Date = new Date()
): RefundOpResult {
  const original = state.transactions.find((item) => item.id === input.originalTransactionId);
  if (!original) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }
  const originalCurrency = original.currency ?? 'INR';
  const originalMinor = toMinorUnits(original.amount, originalCurrency);
  const refundMinor = toMinorUnits(input.amount, originalCurrency);
  if (refundMinor > originalMinor) {
    return { ok: false, error: 'Refund amount exceeds the original transaction.' };
  }
  const refundedSoFarMinor = state.transactions
    .filter((item) => item.refundOfId === original.id && item.kind === 'refund')
    .reduce((sum, item) => sum + toMinorUnits(item.amount, item.currency ?? originalCurrency), 0);
  if (refundMinor + refundedSoFarMinor > originalMinor) {
    return { ok: false, error: 'Refund amount exceeds the remaining refundable amount.' };
  }
  const occurredAt = new Date(`${input.date ?? original.date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, error: 'Choose a valid date.' };
  }
  const today = new Date(now.getTime());
  today.setHours(23, 59, 59, 999);
  if (occurredAt > today) {
    return { ok: false, error: 'Use today or an earlier date.' };
  }
  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reference: `RFD-${String(Date.now()).slice(-8)}`,
    title: input.title?.trim() || `Refund - ${original.title}`,
    category: original.category,
    amount: fromMinorUnits(refundMinor, originalCurrency),
    currency: originalCurrency,
    type: 'credit',
    status: 'Completed',
    date: occurredAt.toISOString(),
    accountId: input.accountId ?? original.accountId,
    counterparty: original.counterparty,
    note: input.note?.trim() || undefined,
    kind: 'refund',
    refundOfId: original.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const next = cloneState(state);
  next.transactions = [transaction, ...next.transactions];
  if (transaction.accountId) {
    next.accounts = next.accounts.map((item) =>
      item.id === transaction.accountId
        ? { ...item, balance: addMoney(item.balance, transaction.amount, transaction.currency) }
        : item
    );
  }
  return { ok: true, state: next, transaction };
};