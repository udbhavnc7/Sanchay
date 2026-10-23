import { describe, expect, it } from 'vitest';
import {
  clearPersistedState,
  loadPersistedState,
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

  it('clears saved data', () => {
    const storage = new MemoryStorage();
    savePersistedState(snapshot(), storage);
    expect(loadPersistedState(storage)).not.toBeNull();

    clearPersistedState(storage);
    expect(loadPersistedState(storage)).toBeNull();
  });
});
