import { describe, expect, it } from 'vitest';
import {
  clearPersistedState,
  createPersistedState,
  loadPersistedState,
  parsePersistedState,
  savePersistedState,
  STORAGE_KEY,
  STORAGE_VERSION,
  type PersistedStateInput,
  type StorageLike,
} from './persistence';
import {
  initialAccounts,
  initialBudgets,
  initialContacts,
  initialGoals,
  initialPlannedPayments,
  initialTransactions,
} from './mockData';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  raw(key: string): string | null {
    return this.getItem(key);
  }
}

function snapshot(): PersistedStateInput {
  return {
    accounts: initialAccounts,
    transactions: initialTransactions,
    contacts: initialContacts,
    goals: initialGoals,
    budgets: initialBudgets,
    plannedPayments: initialPlannedPayments,
    preferences: {
      isDarkMode: true,
      isAudioEnabled: false,
      isCardFrozen: true,
    },
  };
}

describe('local persistence', () => {
  it('round-trips a complete snapshot', () => {
    const storage = new MemoryStorage();
    const input = snapshot();

    expect(savePersistedState(input, storage)).toEqual({ ok: true });
    const loaded = loadPersistedState(storage);

    expect(loaded?.version).toBe(STORAGE_VERSION);
    expect(loaded?.accounts).toHaveLength(initialAccounts.length);
    expect(loaded?.transactions).toHaveLength(initialTransactions.length);
    expect(loaded?.plannedPayments).toHaveLength(initialPlannedPayments.length);
    expect(loaded?.preferences.isDarkMode).toBe(true);
    expect(loaded?.preferences.isAudioEnabled).toBe(false);
    expect(loaded?.savedAt).toEqual(expect.any(String));
    expect(storage.raw(STORAGE_KEY)).toContain(`"version":${STORAGE_VERSION}`);
  });

  it('returns null for missing, malformed or wrong-version data', () => {
    const storage = new MemoryStorage();
    expect(loadPersistedState(storage)).toBeNull();

    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadPersistedState(storage)).toBeNull();

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadPersistedState(storage)).toBeNull();
  });

  it('rejects snapshots with invalid nested entities', () => {
    const storage = new MemoryStorage();
    savePersistedState(snapshot(), storage);
    const parsed = JSON.parse(storage.raw(STORAGE_KEY) ?? '{}') as {
      accounts: Array<{ balance: unknown }>;
    };
    parsed.accounts[0].balance = 'not-a-number';
    storage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    expect(loadPersistedState(storage)).toBeNull();
  });

  it('fails safely when storage is unavailable or full', () => {
    expect(loadPersistedState(null)).toBeNull();
    expect(savePersistedState(snapshot(), null)).toMatchObject({ ok: false });

    const failingStorage: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };

    expect(loadPersistedState(failingStorage)).toBeNull();
    expect(savePersistedState(snapshot(), failingStorage)).toMatchObject({ ok: false });
    expect(() => clearPersistedState(failingStorage)).not.toThrow();
  });

  it('creates and parses an exportable backup', () => {
    const input = snapshot();
    const created = createPersistedState(input);
    const raw = JSON.stringify(created);

    expect(created.version).toBe(STORAGE_VERSION);
    expect(created.savedAt).toEqual(expect.any(String));
    expect(parsePersistedState(raw)).toEqual(created);
    expect(parsePersistedState('{broken')).toBeNull();
    expect(parsePersistedState(JSON.stringify({ version: STORAGE_VERSION }))).toBeNull();
  });

  it('accepts linked goal references but rejects malformed ones', () => {
    const input = snapshot();
    input.transactions = input.transactions.map((transaction, index) =>
      index === 0 ? { ...transaction, goalId: 'g1' } : transaction
    );

    const raw = JSON.stringify(createPersistedState(input));
    expect(parsePersistedState(raw)?.transactions[0].goalId).toBe('g1');

    const invalid = JSON.parse(raw) as {
      transactions: Array<{ goalId: unknown }>;
    };
    invalid.transactions[0].goalId = 42;
    expect(parsePersistedState(JSON.stringify(invalid))).toBeNull();
  });

  it('loads older backups without planned payments as an empty list', () => {
    const state = createPersistedState(snapshot()) as unknown as Record<string, unknown>;
    delete state.plannedPayments;

    const parsed = parsePersistedState(JSON.stringify(state));
    expect(parsed?.plannedPayments).toEqual([]);
  });

  it('rejects malformed planned payments', () => {
    const raw = JSON.parse(JSON.stringify(createPersistedState(snapshot()))) as {
      plannedPayments: Array<{ direction: unknown; amount: unknown }>;
    };
    raw.plannedPayments[0].direction = 'sideways';
    expect(parsePersistedState(JSON.stringify(raw))).toBeNull();

    raw.plannedPayments[0].direction = 'out';
    raw.plannedPayments[0].amount = 'not-a-number';
    expect(parsePersistedState(JSON.stringify(raw))).toBeNull();

    raw.plannedPayments[0].amount = 0;
    expect(parsePersistedState(JSON.stringify(raw))).toBeNull();
  });

  it('clears saved data', () => {
    const storage = new MemoryStorage();
    savePersistedState(snapshot(), storage);
    expect(loadPersistedState(storage)).not.toBeNull();

    clearPersistedState(storage);
    expect(loadPersistedState(storage)).toBeNull();
  });
});
