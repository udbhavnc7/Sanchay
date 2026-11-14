import { describe, expect, it } from 'vitest';
import * as persistence from './persistence';
import type { PersistedStateInput, StorageLike } from './persistence';

function fixture(): PersistedStateInput {
  return {
    accounts: [{ id: 'a', name: 'Cash', type: 'Cash', currency: 'INR', balance: 1000, openingBalance: 1000, status: 'Active', change: 0 }],
    transactions: [], contacts: [], goals: [], budgets: [], plannedPayments: [], paymentAttempts: [],
    preferences: { isDarkMode: false, isAudioEnabled: false, isCardFrozen: false },
  };
}
function memory(raw: string | null = null): StorageLike {
  let value = raw;
  return { getItem: () => value, setItem: (_key, next) => { value = next; }, removeItem: () => { value = null; } };
}
const parse = (value: unknown) => persistence.parsePersistedState(JSON.stringify(value));

describe('recovery-safe local storage', () => {
  it('distinguishes an unreadable existing ledger from a genuinely blank install without rewriting it', () => {
    const storage = memory('{broken financial data');
    expect(persistence.readPersistedState(storage)).toEqual({ status: 'invalid', raw: '{broken financial data' });
    expect(storage.getItem(persistence.STORAGE_KEY)).toBe('{broken financial data');
    expect(persistence.readPersistedState(memory())).toEqual({ status: 'missing' });
    expect(persistence.readPersistedState(null)).toMatchObject({ status: 'unavailable' });
  });

  it('does not replace a saved ledger with invalid financial state', () => {
    const storage = memory('previous ledger');
    const invalid = fixture();
    invalid.accounts[0].balance = Number.POSITIVE_INFINITY;
    expect(persistence.savePersistedState(invalid, storage).ok).toBe(false);
    expect(storage.getItem(persistence.STORAGE_KEY)).toBe('previous ledger');
  });

  it('rejects duplicated entity IDs that would make edits affect several records', () => {
    const state = persistence.createPersistedState(fixture());
    state.accounts.push({ ...state.accounts[0] });
    expect(parse(state)).toBeNull();
  });

  it('restores demo metadata and categories but preserves the device lock instead of importing one', () => {
    const backup = persistence.createPersistedState({ ...fixture(), categories: [{ id: 'custom_pet', name: 'Pets', type: 'expense', color: '#123456', icon: 'gift' }], preferences: { ...fixture().preferences, demoMode: true, appLockPin: '1111' } });
    const storage = memory();
    const result = persistence.restorePersistedState(backup, { ...fixture().preferences, appLockPin: '9876', appLockFailures: 2 }, storage);
    expect(result.ok).toBe(true);
    const loaded = persistence.loadPersistedState(storage);
    expect(loaded?.preferences.appLockPin).toBe('9876');
    expect(loaded?.preferences.appLockFailures).toBe(2);
    expect(loaded?.preferences.demoMode).toBe(true);
    expect(loaded?.categories?.[0].id).toBe('custom_pet');
  });

  it('leaves the previous snapshot intact if an atomic restore hits storage quota', () => {
    const previous = JSON.stringify(persistence.createPersistedState(fixture()));
    const storage: StorageLike = { getItem: () => previous, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('must not clear first'); } };
    const result = persistence.restorePersistedState(persistence.createPersistedState(fixture()), fixture().preferences, storage);
    expect(result.ok).toBe(false);
    expect(storage.getItem(persistence.STORAGE_KEY)).toBe(previous);
  });
});

describe('roadmap backup schema compatibility', () => {
  it('loads old v1 snapshots with an empty category extension', () => {
    const state = persistence.createPersistedState(fixture());
    delete (state as Partial<typeof state>).categories;
    expect(parse(state)?.categories).toEqual([]);
  });

  it('rejects malformed optional roadmap fields instead of accepting unusable data', () => {
    const state = persistence.createPersistedState(fixture());
    const badCategories = [{ id: 'custom_pet', name: 'Pets', type: 'unexpected', color: '#123456', icon: 'gift' }];
    expect(parse({ ...state, categories: badCategories })).toBeNull();
    const payment = { id: 'p', title: 'Rent', amount: 10, direction: 'out', category: 'Rent', dueDate: '2026-11-14', recurrence: { freq: 'monthly', interval: 0 } };
    expect(parse({ ...state, plannedPayments: [payment] })).toBeNull();
    expect(parse({ ...state, plannedPayments: [{ ...payment, recurrence: { freq: 'monthly', interval: 1 }, paused: 'yes' }] })).toBeNull();
    expect(parse({ ...state, plannedPayments: [{ ...payment, recurrence: undefined, dueDate: '2026-02-30' }] })).toBeNull();
    expect(parse({ ...state, goals: [{ id: 'g', title: 'Goal', icon: 'gift', color: '#123456', savedAmount: 0, targetAmount: 100, targetDate: '2027-01', status: 'lost' }] })).toBeNull();
  });

  it('round-trips recurring schedules, goal states, archived contacts and category definitions', () => {
    const state = persistence.createPersistedState({ ...fixture(), categories: [{ id: 'custom_pet', name: 'Pets', type: 'expense', color: '#123456', icon: 'gift' }], plannedPayments: [{ id: 'p', title: 'Food', amount: 100, direction: 'out', dueDate: '2026-11-14', category: 'custom_pet', recurrence: { freq: 'weekly', interval: 2, endDate: '2027-01-31' }, skippedDates: ['2026-11-28'], paused: false }] });
    expect(parse(state)?.plannedPayments[0].recurrence?.interval).toBe(2);
    expect(parse(state)?.categories?.[0].name).toBe('Pets');
  });
});
