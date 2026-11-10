import { describe, expect, it } from 'vitest';
import { ledgerForChoice } from './firstRun';
import {
  initialAccounts,
  initialBudgets,
  initialContacts,
  initialGoals,
  initialPlannedPayments,
  initialTransactions,
} from './mockData';

describe('first-run ledger choice', () => {
  it('blank start contains zero records and is not demo mode', () => {
    const blank = ledgerForChoice('blank');

    expect(blank.accounts).toEqual([]);
    expect(blank.transactions).toEqual([]);
    expect(blank.contacts).toEqual([]);
    expect(blank.goals).toEqual([]);
    expect(blank.budgets).toEqual([]);
    expect(blank.plannedPayments).toEqual([]);
    expect(blank.paymentAttempts).toEqual([]);
    expect(blank.demoMode).toBe(false);
  });

  it('sample start loads the fictional seed and enables the demo indicator', () => {
    const sample = ledgerForChoice('sample');

    expect(sample.accounts).toHaveLength(initialAccounts.length);
    expect(sample.transactions).toHaveLength(initialTransactions.length);
    expect(sample.contacts).toHaveLength(initialContacts.length);
    expect(sample.goals).toHaveLength(initialGoals.length);
    expect(sample.budgets).toHaveLength(initialBudgets.length);
    expect(sample.plannedPayments).toHaveLength(initialPlannedPayments.length);
    expect(sample.demoMode).toBe(true);
  });

  it('sample and blank never share record references (no silent mixing)', () => {
    const blank = ledgerForChoice('blank');
    const sample = ledgerForChoice('sample');

    expect(sample.transactions.length).toBeGreaterThan(blank.transactions.length);
    expect(blank.transactions).not.toBe(sample.transactions);
    expect(blank.accounts).not.toBe(sample.accounts);
  });

  it('blank seed is stable across repeated calls (reset cannot accumulate stale records)', () => {
    const first = ledgerForChoice('blank');
    const second = ledgerForChoice('blank');

    expect(first).toEqual(second);
    expect(second.transactions).toEqual([]);
    expect(second.demoMode).toBe(false);
  });
});
