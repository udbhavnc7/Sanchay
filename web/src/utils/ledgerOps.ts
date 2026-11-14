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

// Operations are immutable: a failed checked balance never publishes a partial ledger.
function checkedOperation<A extends unknown[], R>(operation: (...args: A) => R) {
  return (...args: A): R | { ok: false; error: string } => {
    try {
      return operation(...args);
    } catch (error) {
      if (error instanceof RangeError) return { ok: false, error: error.message };
      throw error;
    }
  };
}

function validAmount(amount: number, currency: Currency): boolean {
  return isValidAmount(amount, currency) && toMinorUnits(amount, currency) > 0 &&
    (currency !== 'JPY' || Number.isInteger(amount));
}

export function normalizeTransactionTags(tags?: string[]): string[] | undefined {
  if (!tags) return undefined;
  const seen = new Set<string>();
  const normalized = tags.map((tag) => tag.trim()).filter((tag) => {
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return normalized.length > 0 ? normalized : undefined;
}

interface DateResult {
  date?: Date;
  error?: string;
}

function parseCompletedDate(value: string, now: Date): DateResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { error: 'Choose a valid date.' };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(`${value}T12:00:00`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    year < 1 ||
    year > 9999
  ) {
    return { error: 'Choose a valid date.' };
  }
  const today = new Date(now.getTime());
  today.setHours(23, 59, 59, 999);
  if (parsed.getTime() > today.getTime()) {
    return { error: 'Use today or an earlier date.' };
  }
  return { date: parsed };
}

/** Device-local calendar day of an ISO instant, matching how entries were created. */
function localDateKey(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isRefundable(transaction: Transaction): boolean {
  return transaction.status === 'Completed' && transaction.type === 'debit' &&
    (!transaction.kind || transaction.kind === 'expense') &&
    !transaction.refundOfId && !transaction.transferId && !transaction.goalId;
}

function currencyOf(state: LedgerState, transaction: Transaction): Currency {
  return state.accounts.find((account) => account.id === transaction.accountId)?.currency ??
    transaction.currency ?? 'INR';
}

function refundIntegrity(state: LedgerState): string | null {
  const totals = new Map<string, bigint>();
  for (const refund of state.transactions.filter((item) => item.refundOfId)) {
    const original = state.transactions.find((item) => item.id === refund.refundOfId);
    if (!original || !isRefundable(original)) {
      return 'Refunds must remain linked to a completed expense.';
    }
    const currency = currencyOf(state, original);
    const refundDay = localDateKey(refund.date);
    const originalDay = localDateKey(original.date);
    if (
      refund.type !== 'credit' ||
      currencyOf(state, refund) !== currency ||
      refund.category !== original.category ||
      !validAmount(refund.amount, currency) ||
      !validAmount(original.amount, currency) ||
      !refundDay ||
      !originalDay ||
      refundDay < originalDay
    ) {
      return 'This change would break the linked refunds. Keep their currency, category and expense date consistent.';
    }
    const total = (totals.get(original.id) ?? 0n) + BigInt(toMinorUnits(refund.amount, currency));
    if (total > BigInt(toMinorUnits(original.amount, currency))) {
      return 'Refund amount exceeds the remaining refundable amount.';
    }
    totals.set(original.id, total);
  }
  return null;
}

function transferIntegrity(state: LedgerState, ids: ReadonlySet<string>): string | null {
  for (const transferId of ids) {
    const legs = state.transactions.filter((item) => item.transferId === transferId);
    if (legs.length === 0) continue;
    const complete = legs.length === 2 &&
      legs.some((leg) => leg.type === 'debit') &&
      legs.some((leg) => leg.type === 'credit');
    if (!complete) return 'That transfer record is incomplete and cannot be restored.';
  }
  return null;
}

function applyForRestored(next: LedgerState, leg: Transaction): void {
  if (leg.status !== 'Completed' || !leg.accountId) return;
  const account = next.accounts.find((item) => item.id === leg.accountId);
  if (!account) return;
  next.accounts = next.accounts.map((item) =>
    item.id === account.id
      ? { ...item, balance: applyTransactionToBalance(item.balance, leg, item.currency) }
      : item
  );
}

function reverseForRemoved(next: LedgerState, leg: Transaction): void {
  if (leg.status !== 'Completed' || !leg.accountId) return;
  const account = next.accounts.find((item) => item.id === leg.accountId);
  if (!account) return;
  next.accounts = next.accounts.map((item) =>
    item.id === account.id
      ? { ...item, balance: reverseTransactionFromBalance(item.balance, leg, item.currency) }
      : item
  );
}

function addGoalContribution(next: LedgerState, leg: Transaction): void {
  if (!leg.goalId) return;
  next.goals = next.goals.map((goal) =>
    goal.id === leg.goalId
      ? { ...goal, savedAmount: addMoney(goal.savedAmount, leg.amount, leg.currency) }
      : goal
  );
}

function removeGoalContribution(next: LedgerState, leg: Transaction): void {
  if (!leg.goalId) return;
  next.goals = next.goals.map((goal) => {
    if (goal.id !== leg.goalId) return goal;
    const nextSaved = subtractMoney(goal.savedAmount, leg.amount, leg.currency);
    return {
      ...goal,
      savedAmount: compareMoney(nextSaved, 0, leg.currency) < 0 ? 0 : nextSaved,
    };
  });
}

export const addTransaction = checkedOperation(function addTransaction(
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
  if (!validAmount(input.amount, account.currency)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }

  const amount = fromMinorUnits(toMinorUnits(input.amount, account.currency), account.currency);
  if (input.type === 'expense' && compareMoney(account.balance, amount, account.currency) < 0) {
    return {
      ok: false,
      error: `Not enough in ${account.name}. Available ${formatMoney(account.balance)}.`,
    };
  }

  const dateResult = parseCompletedDate(input.date, now);
  if (dateResult.error || !dateResult.date) {
    return { ok: false, error: dateResult.error ?? 'Choose a valid date.' };
  }

  const tags = normalizeTransactionTags(input.tags);
  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reference: `ADD-${String(Date.now()).slice(-8)}`,
    title: input.title.trim() || input.category,
    category: input.category,
    amount,
    currency: account.currency,
    type: input.type === 'expense' ? 'debit' : 'credit',
    status: 'Completed',
    date: dateResult.date.toISOString(),
    accountId: account.id,
    counterparty: input.title.trim() || input.category,
    note: input.note?.trim() || undefined,
    kind: input.type,
    ...(tags ? { tags } : {}),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const next = cloneState(state);
  next.transactions = [transaction, ...next.transactions];
  next.accounts = next.accounts.map((item) =>
    item.id === account.id
      ? { ...item, balance: applyTransactionToBalance(item.balance, transaction, item.currency) }
      : item
  );
  return { ok: true, state: next, transaction };
});

export const updateTransaction = checkedOperation(function updateTransaction(
  state: LedgerState,
  input: UpdateTransactionInput,
  now: Date = new Date()
): LedgerOpResult {
  const existing = state.transactions.find((item) => item.id === input.id);
  if (!existing) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }
  if (existing.kind === 'transfer' && !existing.refundOfId) {
    return { ok: false, error: 'Savings transfers cannot be edited here.' };
  }

  const account = findAccount(state, input.accountId);
  if (!account) {
    return { ok: false, error: 'Choose an account for this transaction.' };
  }
  const movingAccount = existing.accountId !== account.id;
  if (movingAccount && account.status !== 'Active') {
    return { ok: false, error: `${account.name} is not active right now.` };
  }
  if (!validAmount(input.amount, account.currency)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }
  const amount = fromMinorUnits(toMinorUnits(input.amount, account.currency), account.currency);

  const dateResult = parseCompletedDate(input.date, now);
  if (dateResult.error || !dateResult.date) {
    return { ok: false, error: dateResult.error ?? 'Choose a valid date.' };
  }
  const occurredAt = dateResult.date;
  const tags = normalizeTransactionTags(input.tags);

  if (existing.refundOfId) {
    const parent = state.transactions.find((item) => item.id === existing.refundOfId);
    if (!parent || !isRefundable(parent)) {
      return { ok: false, error: 'Refunds must remain linked to a completed expense.' };
    }
    const parentCurrency = currencyOf(state, parent);
    if (input.type !== 'income') {
      return { ok: false, error: 'A refund stays a credit; record a new expense instead.' };
    }
    if (account.currency !== parentCurrency) {
      return { ok: false, error: 'A refund must stay in the original expense currency.' };
    }
    if (input.category !== parent.category) {
      return { ok: false, error: 'A refund must stay in the original expense category.' };
    }
    const parentDay = localDateKey(parent.date);
    const refundDay = localDateKey(occurredAt);
    if (!parentDay || !refundDay || refundDay < parentDay) {
      return { ok: false, error: 'A refund cannot be dated before the original expense.' };
    }

    const updated: Transaction = {
      ...existing,
      title: input.title.trim() || existing.title,
      category: parent.category,
      amount,
      currency: parentCurrency,
      type: 'credit',
      status: existing.status,
      date: occurredAt.toISOString(),
      accountId: account.id,
      note: input.note?.trim() || undefined,
      kind: 'refund',
      tags,
      updatedAt: now.toISOString(),
    };

    const next = cloneState(state);
    next.transactions = next.transactions.map((item) =>
      item.id === updated.id ? updated : item
    );
    if (existing.status === 'Completed') {
      if (movingAccount && existing.accountId) {
        const previousAccount = findAccount(next, existing.accountId);
        if (previousAccount) {
          next.accounts = next.accounts.map((item) =>
            item.id === previousAccount.id
              ? { ...item, balance: reverseTransactionFromBalance(item.balance, existing, item.currency) }
              : item
          );
        }
      }
      next.accounts = next.accounts.map((item) => {
        if (item.id !== account.id) return item;
        return {
          ...item,
          balance: movingAccount
            ? applyTransactionToBalance(item.balance, updated, item.currency)
            : balanceAfterTransactionEdit(item.balance, existing, updated, item.currency),
        };
      });
    }
    const integrity = refundIntegrity(next);
    if (integrity) return { ok: false, error: integrity };
    return { ok: true, state: next, transaction: updated };
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
      nextEffect,
      account.currency
    );
    if (input.type === 'expense' && compareMoney(resultingBalance, 0, account.currency) < 0) {
      return {
        ok: false,
        error: `Not enough in ${account.name}. This change would leave ${formatMoney(
          resultingBalance,
          account.currency
        )}.`,
      };
    }
  }

  const title = input.title.trim() || input.category;
  const updated: Transaction = {
    ...existing,
    title,
    category: input.category,
    amount,
    currency: account.currency,
    type: nextEffect.type,
    date: occurredAt.toISOString(),
    accountId: account.id,
    counterparty: existing.reference?.startsWith('ADD-')
      ? title
      : existing.counterparty ?? title,
    note: input.note?.trim() || undefined,
    kind: input.type,
    goalId: undefined,
    tags,
    updatedAt: now.toISOString(),
  };

  const next = cloneState(state);
  next.transactions = next.transactions.map((item) => (item.id === updated.id ? updated : item));
  if (affectsBalance) {
    if (movingAccount && existing.accountId) {
      const previousAccount = findAccount(next, existing.accountId);
      if (previousAccount) {
        next.accounts = next.accounts.map((item) =>
          item.id === previousAccount.id
            ? { ...item, balance: reverseTransactionFromBalance(item.balance, existing, item.currency) }
            : item
        );
      }
    }
    next.accounts = next.accounts.map((item) => {
      if (item.id !== account.id) return item;
      return {
        ...item,
        balance: previousOnAccount
          ? balanceAfterTransactionEdit(item.balance, previousOnAccount, nextEffect, item.currency)
          : applyTransactionToBalance(item.balance, nextEffect, item.currency),
      };
    });
  }
  const integrity = refundIntegrity(next);
  if (integrity) return { ok: false, error: integrity };
  return { ok: true, state: next, transaction: updated };
});

export const deleteTransaction = checkedOperation(function deleteTransaction(
  state: LedgerState,
  id: string
): DeleteOpResult {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }
  if (state.transactions.some((item) => item.refundOfId === id)) {
    return { ok: false, error: 'Delete the linked refunds first so the history stays consistent.' };
  }

  const companions = transaction.transferId
    ? state.transactions.filter(
        (item) => item.transferId === transaction.transferId && item.id !== transaction.id
      )
    : [];
  const removed = [transaction, ...companions];

  const next = cloneState(state);
  const transferIds = new Set<string>();
  for (const leg of removed) {
    reverseForRemoved(next, leg);
    removeGoalContribution(next, leg);
    if (leg.transferId) transferIds.add(leg.transferId);
  }
  const transferProblem = transferIntegrity(next, transferIds);
  if (transferProblem) return { ok: false, error: transferProblem };

  const removedIds = new Set(removed.map((item) => item.id));
  next.transactions = next.transactions.filter((item) => !removedIds.has(item.id));
  return { ok: true, state: next, transaction, companions };
});

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
  try {
    const next = cloneState(state);
    next.transactions = [...missing, ...next.transactions];
    for (const leg of missing) {
      applyForRestored(next, leg);
      addGoalContribution(next, leg);
    }
    const transferIds = new Set(
      missing.map((leg) => leg.transferId).filter((value): value is string => Boolean(value))
    );
    if (transferIntegrity(next, transferIds)) return state;
    if (refundIntegrity(next)) return state;
    return next;
  } catch (error) {
    if (error instanceof RangeError) return state;
    throw error;
  }
}

export function undoAddTransaction(state: LedgerState, transaction: Transaction): LedgerState {
  const current = state.transactions.find((item) => item.id === transaction.id);
  if (!current) {
    return state;
  }
  try {
    const removed = current.transferId
      ? state.transactions.filter((item) => item.transferId === current.transferId)
      : [current];
    const next = cloneState(state);
    for (const leg of removed) {
      reverseForRemoved(next, leg);
      removeGoalContribution(next, leg);
    }
    const removedIds = new Set(removed.map((item) => item.id));
    next.transactions = next.transactions.filter((item) => !removedIds.has(item.id));
    const transferIds = new Set(
      removed.map((leg) => leg.transferId).filter((value): value is string => Boolean(value))
    );
    if (transferIntegrity(next, transferIds)) return state;
    if (refundIntegrity(next)) return state;
    return next;
  } catch (error) {
    if (error instanceof RangeError) return state;
    throw error;
  }
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

const createTransferChecked = checkedOperation(function createTransfer(
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
  if (!validAmount(input.amount, from.currency)) {
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
  if (!validAmount(destAmount, to.currency)) {
    return {
      ok: false,
      error: 'That amount is too small to convert at this exchange rate.',
    };
  }

  const dateResult = parseCompletedDate(input.date, now);
  if (dateResult.error || !dateResult.date) {
    return { ok: false, error: dateResult.error ?? 'Choose a valid date.' };
  }

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
    date: dateResult.date.toISOString(),
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
      return { ...item, balance: applyTransactionToBalance(item.balance, sourceLeg, item.currency) };
    }
    if (item.id === to.id) {
      return { ...item, balance: applyTransactionToBalance(item.balance, destinationLeg, item.currency) };
    }
    return item;
  });
  return { ok: true, state: next, legs: [sourceLeg, destinationLeg] };
});

export function createTransfer(
  state: LedgerState,
  input: TransferInput,
  now: Date = new Date()
): TransferOpResult {
  return createTransferChecked(state, input, now);
}

const updateTransferChecked = checkedOperation(function updateTransfer(
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
    if (!validAmount(input.amount, from.currency)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    nextSrcAmount = fromMinorUnits(toMinorUnits(input.amount, from.currency), from.currency);
  }
  const nextDestAmount = convertAmount(nextSrcAmount, from.currency, to.currency, rate);
  if (!validAmount(nextDestAmount, to.currency)) {
    return {
      ok: false,
      error: 'That amount is too small to convert at this exchange rate.',
    };
  }

  const legDate = localDateKey(sourceLeg.date) ?? localDateKey(now) ?? '1970-01-01';
  const nextDate = input.date ?? legDate;
  const dateResult = parseCompletedDate(nextDate, now);
  if (dateResult.error || !dateResult.date) {
    return { ok: false, error: dateResult.error ?? 'Choose a valid date.' };
  }

  const next = cloneState(state);
  for (const leg of [sourceLeg, destinationLeg]) {
    reverseForRemoved(next, leg);
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
    date: dateResult.date.toISOString(),
    title: input.title?.trim() || sourceLeg.title,
    note: input.note?.trim() || undefined,
    updatedAt: stamp,
  };
  const updatedDestination: Transaction = {
    ...destinationLeg,
    amount: nextDestAmount,
    date: dateResult.date.toISOString(),
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
      return { ...item, balance: applyTransactionToBalance(item.balance, updatedSource, item.currency) };
    }
    if (item.id === to.id) {
      return { ...item, balance: applyTransactionToBalance(item.balance, updatedDestination, item.currency) };
    }
    return item;
  });
  return { ok: true, state: next, legs: [updatedSource, updatedDestination] };
});

export function updateTransfer(
  state: LedgerState,
  input: TransferUpdateInput,
  now: Date = new Date()
): TransferOpResult {
  return updateTransferChecked(state, input, now);
}

export interface RefundInput {
  originalTransactionId?: string;
  transactionId?: string;
  amount: number;
  date?: string;
  title?: string;
  note?: string;
  accountId?: string;
}

export type RefundOpResult =
  | { ok: true; state: LedgerState; transaction: Transaction }
  | { ok: false; error: string };

export const recordRefund = checkedOperation(function recordRefund(
  state: LedgerState,
  input: RefundInput,
  now: Date = new Date()
): RefundOpResult {
  const originalId = input.transactionId ?? input.originalTransactionId;
  const original = originalId
    ? state.transactions.find((item) => item.id === originalId)
    : undefined;
  if (!original) {
    return { ok: false, error: 'That transaction no longer exists.' };
  }
  if (!isRefundable(original)) {
    return { ok: false, error: 'Only completed expenses can be refunded.' };
  }

  const originalCurrency = currencyOf(state, original);
  if (!validAmount(input.amount, originalCurrency)) {
    return { ok: false, error: 'Enter an amount greater than zero.' };
  }
  const originalMinor = toMinorUnits(original.amount, originalCurrency);
  const refundMinor = toMinorUnits(input.amount, originalCurrency);
  if (refundMinor > originalMinor) {
    return { ok: false, error: 'Refund amount exceeds the original transaction.' };
  }
  const refundedSoFarMinor = state.transactions
    .filter((item) => item.refundOfId === original.id)
    .reduce(
      (sum, item) => sum + toMinorUnits(item.amount, currencyOf(state, item)),
      0
    );
  if (refundMinor + refundedSoFarMinor > originalMinor) {
    return { ok: false, error: 'Refund amount exceeds the remaining refundable amount.' };
  }

  const originalDay = localDateKey(original.date);
  if (!originalDay) {
    return { ok: false, error: 'Choose a valid date.' };
  }
  const requestedDate = input.date ?? originalDay;
  const dateResult = parseCompletedDate(requestedDate, now);
  if (dateResult.error || !dateResult.date) {
    return { ok: false, error: dateResult.error ?? 'Choose a valid date.' };
  }
  const refundDay = localDateKey(dateResult.date);
  if (!refundDay || refundDay < originalDay) {
    return { ok: false, error: 'A refund cannot be dated before the original expense.' };
  }

  const account = input.accountId
    ? findAccount(state, input.accountId)
    : original.accountId
      ? findAccount(state, original.accountId)
      : undefined;
  if (!account) {
    return { ok: false, error: 'Choose an account for this refund.' };
  }
  if (account.status !== 'Active') {
    return { ok: false, error: `${account.name} is not active right now.` };
  }
  if (account.currency !== originalCurrency) {
    return {
      ok: false,
      error: `A refund must go to an active ${originalCurrency} account.`,
    };
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
    date: dateResult.date.toISOString(),
    accountId: account.id,
    counterparty: original.counterparty,
    note: input.note?.trim() || undefined,
    kind: 'refund',
    refundOfId: original.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const next = cloneState(state);
  next.transactions = [transaction, ...next.transactions];
  next.accounts = next.accounts.map((item) =>
    item.id === account.id
      ? { ...item, balance: applyTransactionToBalance(item.balance, transaction, item.currency) }
      : item
  );
  const integrity = refundIntegrity(next);
  if (integrity) return { ok: false, error: integrity };
  return { ok: true, state: next, transaction };
});
