import type {
  Account,
  Budget,
  Category,
  Contact,
  Currency,
  PlannedPayment,
  SavingsGoal,
  Transaction,
} from '../types/finance';

export const STORAGE_KEY = 'sanchay.local.v1';
export const STORAGE_VERSION = 1;

export interface PersistedPreferences {
  isDarkMode: boolean;
  isAudioEnabled: boolean;
  isCardFrozen: boolean;
}

export interface PersistedState {
  version: typeof STORAGE_VERSION;
  savedAt: string;
  accounts: Account[];
  transactions: Transaction[];
  contacts: Contact[];
  goals: SavingsGoal[];
  budgets: Budget[];
  plannedPayments: PlannedPayment[];
  preferences: PersistedPreferences;
}

export type PersistedStateInput = Omit<
  PersistedState,
  'version' | 'savedAt' | 'plannedPayments'
> & {
  plannedPayments?: PlannedPayment[];
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

const CURRENCIES: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
const ACCOUNT_TYPES: Account['type'][] = ['Bank', 'Cash', 'Savings', 'Card'];
const ACCOUNT_STATUSES: Account['status'][] = ['Active', 'Inactive'];
const CONTACT_TYPES: Contact['type'][] = ['Person', 'Business'];
const TRANSACTION_TYPES: Transaction['type'][] = ['credit', 'debit'];
const TRANSACTION_STATUSES: Transaction['status'][] = [
  'Completed',
  'Pending',
  'Failed',
  'Flagged',
];
const TRANSACTION_KINDS: NonNullable<Transaction['kind']>[] = ['expense', 'income', 'transfer'];
const PLANNED_DIRECTIONS: PlannedPayment['direction'][] = ['in', 'out'];

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCurrency(value: unknown): value is Currency {
  return isString(value) && CURRENCIES.includes(value as Currency);
}

function isCategory(value: unknown): value is Category {
  return isString(value) && value.trim().length > 0;
}

function isAccount(value: unknown): value is Account {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.type) &&
    ACCOUNT_TYPES.includes(value.type as Account['type']) &&
    isCurrency(value.currency) &&
    isNumber(value.balance) &&
    isString(value.status) &&
    ACCOUNT_STATUSES.includes(value.status as Account['status']) &&
    (isNumber(value.change) || isString(value.change))
  );
}

function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isCategory(value.category) &&
    isNumber(value.amount) &&
    isString(value.type) &&
    TRANSACTION_TYPES.includes(value.type as Transaction['type']) &&
    isString(value.status) &&
    TRANSACTION_STATUSES.includes(value.status as Transaction['status']) &&
    isString(value.date) &&
    !Number.isNaN(Date.parse(value.date)) &&
    (value.accountId === undefined || isString(value.accountId)) &&
    (value.kind === undefined ||
      (isString(value.kind) &&
        TRANSACTION_KINDS.includes(value.kind as NonNullable<Transaction['kind']>))) &&
    (value.fee === undefined || isNumber(value.fee)) &&
    (value.goalId === undefined || isString(value.goalId))
  );
}

function isContact(value: unknown): value is Contact {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.handle) &&
    isString(value.type) &&
    CONTACT_TYPES.includes(value.type as Contact['type']) &&
    isString(value.bank) &&
    isString(value.initials) &&
    isString(value.avatarColor) &&
    typeof value.isFavorite === 'boolean' &&
    (value.currency === undefined || isCurrency(value.currency))
  );
}

function isGoal(value: unknown): value is SavingsGoal {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.icon) &&
    isNumber(value.savedAmount) &&
    isNumber(value.targetAmount) &&
    isString(value.targetDate) &&
    isString(value.color)
  );
}

function isBudget(value: unknown): value is Budget {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isCategory(value.category) &&
    isNumber(value.limit) &&
    isString(value.color)
  );
}

function isPlannedPayment(value: unknown): value is PlannedPayment {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isNumber(value.amount) &&
    value.amount > 0 &&
    isString(value.direction) &&
    PLANNED_DIRECTIONS.includes(value.direction as PlannedPayment['direction']) &&
    isString(value.dueDate) &&
    !Number.isNaN(Date.parse(value.dueDate)) &&
    isCategory(value.category) &&
    (value.accountId === undefined || isString(value.accountId)) &&
    (value.note === undefined || isString(value.note))
  );
}

function isPreferences(value: unknown): value is PersistedPreferences {
  if (!isRecord(value)) return false;
  return (
    typeof value.isDarkMode === 'boolean' &&
    typeof value.isAudioEnabled === 'boolean' &&
    typeof value.isCardFrozen === 'boolean'
  );
}

type PersistedStateBase = Omit<PersistedState, 'plannedPayments'> & {
  plannedPayments?: PlannedPayment[];
};

function isPersistedStateBase(value: unknown): value is PersistedStateBase {
  if (!isRecord(value)) return false;
  return (
    value.version === STORAGE_VERSION &&
    isString(value.savedAt) &&
    Array.isArray(value.accounts) &&
    value.accounts.every(isAccount) &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isTransaction) &&
    Array.isArray(value.contacts) &&
    value.contacts.every(isContact) &&
    Array.isArray(value.goals) &&
    value.goals.every(isGoal) &&
    Array.isArray(value.budgets) &&
    value.budgets.every(isBudget) &&
    (value.plannedPayments === undefined ||
      (Array.isArray(value.plannedPayments) &&
        value.plannedPayments.every(isPlannedPayment))) &&
    isPreferences(value.preferences)
  );
}

export function createPersistedState(input: PersistedStateInput): PersistedState {
  return {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    ...input,
    plannedPayments: input.plannedPayments ?? [],
  };
}

export function parsePersistedState(raw: string): PersistedState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedStateBase(parsed)) return null;
    return { ...parsed, plannedPayments: parsed.plannedPayments ?? [] };
  } catch {
    return null;
  }
}

export function loadPersistedState(storage: StorageLike | null = browserStorage()): PersistedState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parsePersistedState(raw);
  } catch {
    return null;
  }
}

export function savePersistedState(
  input: PersistedStateInput,
  storage: StorageLike | null = browserStorage()
): SaveResult {
  if (!storage) {
    return { ok: false, error: 'Local storage is unavailable in this browser.' };
  }

  const state = createPersistedState(input);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Changes could not be saved. Device storage may be full or unavailable.',
    };
  }
}

export function clearPersistedState(storage: StorageLike | null = browserStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
