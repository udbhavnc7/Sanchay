import { describe, expect, it } from 'vitest';
import type { Account, SavingsGoal, Transaction } from '../types/finance';
import {
  addTransaction,
  createTransfer,
  deleteAccount,
  deleteTransaction,
  recordRefund,
  undoAddTransaction,
  undoDeleteTransaction,
  updateTransaction,
  updateTransfer,
  type LedgerState,
} from './ledgerOps';
import type { NewTransactionInput } from '../types/finance';

const NOW = new Date('2026-11-10T10:00:00');

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc1',
    name: 'HDFC',
    type: 'Bank',
    currency: 'INR',
    balance: 1000,
    status: 'Active',
    change: '+0%',
    ...overrides,
  };
}

function state(overrides: Partial<LedgerState> = {}): LedgerState {
  return {
    accounts: [account(), account({ id: 'acc2', name: 'Wallet', balance: 500 })],
    transactions: [],
    goals: [],
    ...overrides,
  };
}

function expenseInput(overrides: Partial<NewTransactionInput> = {}): NewTransactionInput {
  return {
    type: 'expense',
    title: 'Coffee',
    category: 'Dining',
    amount: 100,
    accountId: 'acc1',
    date: '2026-11-10',
    ...overrides,
  };
}

function goal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: 'goal1',
    title: 'Laptop',
    icon: 'laptop',
    savedAmount: 500,
    targetAmount: 1000,
    targetDate: '2027-01-01',
    color: '#3b82f6',
    ...overrides,
  };
}

describe('addTransaction', () => {
  it('debits the account and records a completed expense', () => {
    const result = addTransaction(state(), expenseInput(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(900);
    expect(result.state.transactions).toHaveLength(1);
    const tx = result.transaction;
    expect(tx.type).toBe('debit');
    expect(tx.kind).toBe('expense');
    expect(tx.status).toBe('Completed');
    expect(tx.accountId).toBe('acc1');
    expect(tx.currency).toBe('INR');
    expect(tx.createdAt).toBe(NOW.toISOString());
    expect(tx.reference?.startsWith('ADD-')).toBe(true);
  });

  it('credits the account for income', () => {
    const result = addTransaction(state(), expenseInput({ type: 'income', title: 'Salary' }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(1100);
    expect(result.transaction.type).toBe('credit');
  });

  it('rejects an unknown account', () => {
    const result = addTransaction(state(), expenseInput({ accountId: 'nope' }), NOW);
    expect(result).toEqual({ ok: false, error: 'Choose an account for this transaction.' });
  });

  it('rejects an inactive account', () => {
    const base = state({
      accounts: [account({ status: 'Inactive' }), account({ id: 'acc2', balance: 500 })],
    });
    const result = addTransaction(base, expenseInput(), NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('not active');
  });

  it.each(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const)('records transactions in %s', (currency) => {
    const base = state({ accounts: [account({ currency })] });
    const result = addTransaction(base, expenseInput(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transaction.currency).toBe(currency);
    expect(result.state.accounts[0].balance).toBe(900);
  });

  it.each([0, -5, Number.NaN])('rejects invalid amount %s', (amount) => {
    const result = addTransaction(state(), expenseInput({ amount }), NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Enter an amount greater than zero.');
  });

  it('rejects an expense above the available balance', () => {
    const result = addTransaction(state(), expenseInput({ amount: 1001 }), NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Not enough in HDFC');
  });

  it('allows spending the exact balance', () => {
    const result = addTransaction(state(), expenseInput({ amount: 1000 }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(0);
  });

  it('rejects a future-dated transaction', () => {
    const result = addTransaction(state(), expenseInput({ date: '2026-11-11' }), NOW);
    expect(result).toEqual({ ok: false, error: 'Use today or an earlier date.' });
  });

  it('allows a transaction dated today', () => {
    const result = addTransaction(state(), expenseInput({ date: '2026-11-10' }), NOW);
    expect(result.ok).toBe(true);
  });

  it('rejects a malformed date', () => {
    const result = addTransaction(state(), expenseInput({ date: 'not-a-date' }), NOW);
    expect(result).toEqual({ ok: false, error: 'Choose a valid date.' });
  });

  it('falls back to the category when the title is blank', () => {
    const result = addTransaction(state(), expenseInput({ title: '   ' }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transaction.title).toBe('Dining');
  });
});

describe('updateTransaction', () => {
  function added(overrides: Partial<NewTransactionInput> = {}) {
    const result = addTransaction(state(), expenseInput(overrides), NOW);
    if (!result.ok) throw new Error('setup failed');
    return result;
  }

  it('updates the amount and the balance together', () => {
    const start = added();
    const result = updateTransaction(
      start.state,
      { ...expenseInput({ amount: 200 }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(800);
    expect(result.transaction.amount).toBe(200);
    expect(result.transaction.updatedAt).toBe(NOW.toISOString());
  });

  it('moves balance correctly when the account changes', () => {
    const start = added();
    const result = updateTransaction(
      start.state,
      { ...expenseInput({ accountId: 'acc2' }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(1000);
    expect(result.state.accounts[1].balance).toBe(400);
    expect(result.state.transactions[0].accountId).toBe('acc2');
  });

  it('flips expense to income without double counting', () => {
    const start = added();
    const result = updateTransaction(
      start.state,
      { ...expenseInput({ type: 'income' }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(1100);
    expect(result.state.transactions[0].type).toBe('credit');
  });

  it('rejects an edit that would overdraw the account', () => {
    const start = added();
    const result = updateTransaction(
      start.state,
      { ...expenseInput({ amount: 1500 }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('would leave');
    expect(start.state.accounts[0].balance).toBe(900);
    expect(start.state.transactions[0].amount).toBe(100);
  });

  it('rejects an unknown transaction', () => {
    const result = updateTransaction(state(), { ...expenseInput(), id: 'missing' }, NOW);
    expect(result).toEqual({ ok: false, error: 'That transaction no longer exists.' });
  });

  it('rejects editing a savings transfer', () => {
    const transfer: Transaction = {
      id: 'tx_t',
      title: 'Moved to Laptop',
      category: 'Savings',
      amount: 100,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'transfer',
      goalId: 'goal1',
    };
    const base = state({ transactions: [transfer] });
    const result = updateTransaction(
      base,
      { ...expenseInput(), id: 'tx_t' },
      NOW
    );
    expect(result).toEqual({ ok: false, error: 'Savings transfers cannot be edited here.' });
  });

  it('rejects future dates and invalid amounts', () => {
    const start = added();
    const future = updateTransaction(
      start.state,
      { ...expenseInput({ date: '2026-12-01' }), id: start.transaction.id },
      NOW
    );
    expect(future).toEqual({ ok: false, error: 'Use today or an earlier date.' });
    const badAmount = updateTransaction(
      start.state,
      { ...expenseInput({ amount: 0 }), id: start.transaction.id },
      NOW
    );
    expect(badAmount).toEqual({ ok: false, error: 'Enter an amount greater than zero.' });
  });

  it('keeps historical edits allowed on an inactive account', () => {
    const start = added();
    const base: LedgerState = {
      ...start.state,
      accounts: start.state.accounts.map((item) =>
        item.id === 'acc1' ? { ...item, status: 'Inactive' as const } : item
      ),
    };
    const result = updateTransaction(
      base,
      { ...expenseInput({ amount: 150 }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(850);
  });

  it('rejects moving to a different inactive account', () => {
    const start = added();
    const base: LedgerState = {
      ...start.state,
      accounts: start.state.accounts.map((item) =>
        item.id === 'acc2' ? { ...item, status: 'Inactive' as const } : item
      ),
    };
    const result = updateTransaction(
      base,
      { ...expenseInput({ accountId: 'acc2' }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('not active');
  });

  it('does not touch the balance when editing a pending transaction', () => {
    const start = added();
    const base: LedgerState = {
      ...start.state,
      transactions: start.state.transactions.map((item) => ({ ...item, status: 'Pending' as const })),
    };
    const result = updateTransaction(
      base,
      { ...expenseInput({ amount: 500 }), id: start.transaction.id },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(900);
    expect(result.state.transactions[0].amount).toBe(500);
  });
});

describe('deleteTransaction and undo', () => {
  it('restores the balance when a completed transaction is deleted', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const result = deleteTransaction(start.state, start.transaction.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(1000);
    expect(result.state.transactions).toHaveLength(0);
  });

  it('does not change the balance when a pending transaction is deleted', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const base: LedgerState = {
      ...start.state,
      transactions: start.state.transactions.map((item) => ({ ...item, status: 'Pending' as const })),
    };
    const result = deleteTransaction(base, start.transaction.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(900);
  });

  it('reduces the linked goal when a goal transfer is deleted', () => {
    const transfer: Transaction = {
      id: 'tx_goal',
      title: 'Moved to Laptop',
      category: 'Savings',
      amount: 100,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'transfer',
      goalId: 'goal1',
    };
    const base = state({ transactions: [transfer], goals: [goal()] });
    const result = deleteTransaction(base, 'tx_goal');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.goals[0].savedAmount).toBe(400);
    expect(result.state.accounts[0].balance).toBe(1100);
  });

  it('floors the goal at zero instead of going negative', () => {
    const transfer: Transaction = {
      id: 'tx_goal',
      title: 'Moved',
      category: 'Savings',
      amount: 800,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'transfer',
      goalId: 'goal1',
    };
    const base = state({ transactions: [transfer], goals: [goal({ savedAmount: 500 })] });
    const result = deleteTransaction(base, 'tx_goal');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.goals[0].savedAmount).toBe(0);
  });

  it('rejects deleting an unknown transaction', () => {
    const result = deleteTransaction(state(), 'missing');
    expect(result).toEqual({ ok: false, error: 'That transaction no longer exists.' });
  });

  it('undo after delete restores transaction, balance and goal', () => {
    const transfer: Transaction = {
      id: 'tx_goal',
      title: 'Moved',
      category: 'Savings',
      amount: 100,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'transfer',
      goalId: 'goal1',
    };
    const base = state({ transactions: [transfer], goals: [goal()] });
    const deleted = deleteTransaction(base, 'tx_goal');
    if (!deleted.ok) throw new Error('setup failed');
    const undone = undoDeleteTransaction(deleted.state, deleted.transaction);
    expect(undone.transactions).toHaveLength(1);
    expect(undone.accounts[0].balance).toBe(1000);
    expect(undone.goals[0].savedAmount).toBe(500);
  });

  it('undo after delete is idempotent (no duplicate writes)', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const deleted = deleteTransaction(start.state, start.transaction.id);
    if (!deleted.ok) throw new Error('setup failed');
    const once = undoDeleteTransaction(deleted.state, deleted.transaction);
    const twice = undoDeleteTransaction(once, deleted.transaction);
    expect(twice).toBe(once);
    expect(once.accounts[0].balance).toBe(900);
  });
});

describe('undoAdd', () => {
  it('reverses the balance of the added transaction', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const undone = undoAddTransaction(start.state, start.transaction);
    expect(undone.transactions).toHaveLength(0);
    expect(undone.accounts[0].balance).toBe(1000);
  });

  it('also reverses the linked goal contribution', () => {
    const transfer: Transaction = {
      id: 'tx_goal',
      title: 'Moved',
      category: 'Savings',
      amount: 100,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'transfer',
      goalId: 'goal1',
      createdAt: NOW.toISOString(),
    };
    const base = state({ transactions: [transfer], goals: [goal()] });
    const undone = undoAddTransaction(base, transfer);
    expect(undone.transactions).toHaveLength(0);
    expect(undone.accounts[0].balance).toBe(1100);
    expect(undone.goals[0].savedAmount).toBe(400);
  });

  it('is a no-op when the transaction is already gone', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const gone = undoAddTransaction(start.state, start.transaction);
    const again = undoAddTransaction(gone, start.transaction);
    expect(again).toBe(gone);
    expect(again.accounts[0].balance).toBe(1000);
  });
});

describe('account lifecycle', () => {
  it('deletes an account that has no linked transactions', () => {
    const base = state({
      accounts: [account(), account({ id: 'acc2', balance: 500 }), account({ id: 'acc3' })],
    });
    const result = deleteAccount(base, 'acc3');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts.map((item) => item.id)).toEqual(['acc1', 'acc2']);
  });

  it('refuses to delete an account with linked transactions and points to archive', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const result = deleteAccount(start.state, 'acc1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('1 transaction');
    expect(result.error).toContain('Archive');
    expect(result.error).toContain('HDFC');
  });

  it('counts every linked transaction in the message', () => {
    const first = addTransaction(state(), expenseInput(), NOW);
    if (!first.ok) throw new Error('setup failed');
    const second = addTransaction(first.state, expenseInput({ title: 'Lunch' }), NOW);
    if (!second.ok) throw new Error('setup failed');
    const result = deleteAccount(second.state, 'acc1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('2 transactions');
  });

  it('refuses to delete an archived account that still has history', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const base: LedgerState = {
      ...start.state,
      accounts: start.state.accounts.map((item) =>
        item.id === 'acc1' ? { ...item, status: 'Inactive' as const } : item
      ),
    };
    const result = deleteAccount(base, 'acc1');
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown account', () => {
    const result = deleteAccount(state(), 'missing');
    expect(result).toEqual({ ok: false, error: 'That account no longer exists.' });
  });
});

describe('round-trip balance consistency', () => {
  it('add → undo → add → delete returns to the original balance exactly', () => {
    let current = state();
    const original = current.accounts[0].balance;

    const first = addTransaction(current, expenseInput(), NOW);
    if (!first.ok) throw new Error('setup failed');
    current = first.state;
    expect(current.accounts[0].balance).toBe(900);

    current = undoAddTransaction(current, first.transaction);
    expect(current.accounts[0].balance).toBe(original);

    const second = addTransaction(current, expenseInput({ amount: 333.33 }), NOW);
    if (!second.ok) throw new Error('setup failed');
    current = second.state;
    expect(current.accounts[0].balance).toBe(666.67);

    const deleted = deleteTransaction(current, second.transaction.id);
    if (!deleted.ok) throw new Error('setup failed');
    current = deleted.state;
    expect(current.accounts[0].balance).toBe(original);
    expect(Number.isInteger(Math.round(current.accounts[0].balance * 100))).toBe(true);
  });

  it('edit → delete restores the pre-edit balance through both steps', () => {
    const start = addTransaction(state(), expenseInput(), NOW);
    if (!start.ok) throw new Error('setup failed');
    const edited = updateTransaction(
      start.state,
      { ...expenseInput({ amount: 250 }), id: start.transaction.id },
      NOW
    );
    if (!edited.ok) throw new Error('setup failed');
    expect(edited.state.accounts[0].balance).toBe(750);

    const deleted = deleteTransaction(edited.state, edited.transaction.id);
    if (!deleted.ok) throw new Error('setup failed');
    expect(deleted.state.accounts[0].balance).toBe(1000);

    const undone = undoDeleteTransaction(deleted.state, deleted.transaction);
    expect(undone.accounts[0].balance).toBe(750);
  });
});

describe('transfers', () => {
  const transferDate = '2026-11-10';

  it('creates two legs linked by a shared transfer id', () => {
    const start = state();
    const result = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, date: transferDate, title: 'Move to wallet' },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legs).toHaveLength(2);
    expect(result.legs[0].kind).toBe('transfer');
    expect(result.legs[0].type).toBe('debit');
    expect(result.legs[1].type).toBe('credit');
    expect(result.legs[0].transferId).toBe(result.legs[1].transferId);
    expect(result.legs[0].accountId).toBe('acc1');
    expect(result.legs[1].accountId).toBe('acc2');
    expect(result.state.accounts[0].balance).toBe(900);
    expect(result.state.accounts[1].balance).toBe(600);
    expect(result.state.transactions).toHaveLength(2);
  });

  it('converts across currencies with an explicit rate and rounds to destination minor units', () => {
    const start = state({
      accounts: [
        account(),
        account({ id: 'acc2', name: 'Savings USD', type: 'Savings', currency: 'USD', balance: 50 }),
      ],
    });
    const result = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 1000, date: transferDate, rate: 0.012 },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legs[0].amount).toBe(1000);
    expect(result.legs[0].currency).toBe('INR');
    expect(result.legs[1].amount).toBe(12);
    expect(result.legs[1].currency).toBe('USD');
    expect(result.legs[0].transferRate).toBe(0.012);
    expect(result.state.accounts[0].balance).toBe(0);
    expect(result.state.accounts[1].balance).toBe(62);
  });

  it('rounds cross-currency conversions to the destination currency precision', () => {
    const start = state({
      accounts: [
        account(),
        account({ id: 'acc2', name: 'Savings USD', type: 'Savings', currency: 'USD', balance: 50 }),
      ],
    });
    const result = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 333.33, date: transferDate, rate: 0.012 },
      NOW
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.legs[1].amount).toBe(4);
  });

  it('rejects a transfer above the source balance', () => {
    const result = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 1001, date: transferDate },
      NOW
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Not enough');
  });

  it('rejects a transfer between the same account', () => {
    const result = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc1', amount: 10, date: transferDate },
      NOW
    );
    expect(result.ok).toBe(false);
  });

  it('requires an exchange rate when currencies differ', () => {
    const start = state({
      accounts: [
        account(),
        account({ id: 'acc2', name: 'Savings USD', type: 'Savings', currency: 'USD', balance: 5 }),
      ],
    });
    const result = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10, date: transferDate },
      NOW
    );
    expect(result.ok).toBe(false);
  });

  it('rejects future or malformed transfer dates', () => {
    const start = state();
    const future = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10, date: '2026-11-11' },
      NOW
    );
    expect(future).toEqual({ ok: false, error: 'Use today or an earlier date.' });
    const bad = createTransfer(
      start,
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10, date: 'nope' },
      NOW
    );
    expect(bad).toEqual({ ok: false, error: 'Choose a valid date.' });
  });

  it('deletes both transfer legs and restores both balances', () => {
    const created = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, date: transferDate },
      NOW
    );
    if (!created.ok) throw new Error('setup failed');
    const deleted = deleteTransaction(created.state, created.legs[0].id);
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.companions.map((c) => c.id)).toEqual([created.legs[1].id]);
    expect(deleted.state.transactions).toHaveLength(0);
    expect(deleted.state.accounts[0].balance).toBe(1000);
    expect(deleted.state.accounts[1].balance).toBe(500);
  });

  it('restores both legs after deleting a transfer', () => {
    const created = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, date: transferDate },
      NOW
    );
    if (!created.ok) throw new Error('setup failed');
    const deleted = deleteTransaction(created.state, created.legs[0].id);
    if (!deleted.ok) throw new Error('setup failed');
    const legs = [deleted.transaction, ...deleted.companions];
    const undone = undoDeleteTransaction(deleted.state, legs);
    expect(undone.transactions).toHaveLength(2);
    expect(undone.accounts[0].balance).toBe(900);
    expect(undone.accounts[1].balance).toBe(600);
  });

  it('is idempotent when undoing an already-restored transfer', () => {
    const created = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, date: transferDate },
      NOW
    );
    if (!created.ok) throw new Error('setup failed');
    const deleted = deleteTransaction(created.state, created.legs[0].id);
    if (!deleted.ok) throw new Error('setup failed');
    const legs = [deleted.transaction, ...deleted.companions];
    const once = undoDeleteTransaction(deleted.state, legs);
    const twice = undoDeleteTransaction(once, legs);
    expect(twice).toBe(once);
  });

  it('updates both legs atomically when the transfer amount changes', () => {
    const created = createTransfer(
      state(),
      { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, date: transferDate, title: 'Move to savings' },
      NOW
    );
    if (!created.ok) throw new Error('setup failed');
    const updated = updateTransfer(created.state, { transferId: created.legs[0].transferId ?? created.legs[1].transferId ?? '', amount: 250 }, NOW);
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.legs[0].amount).toBe(250);
    expect(updated.legs[1].amount).toBe(250);
    expect(updated.state.accounts[0].balance).toBe(750);
    expect(updated.state.accounts[1].balance).toBe(750);
  });

  it('rejects updating an incomplete transfer', () => {
    const result = updateTransfer(state(), { transferId: 'tr_missing', amount: 10 }, NOW);
    expect(result).toEqual({ ok: false, error: 'That transfer record is incomplete and cannot be edited.' });
  });
});


describe('currency completion safeguards', () => {
  it.each([
    ['INR', 0.1, 0.2, 999.9, 999.8],
    ['USD', 0.1, 0.2, 999.9, 999.8],
    ['EUR', 0.1, 0.2, 999.9, 999.8],
    ['GBP', 0.1, 0.2, 999.9, 999.8],
    ['JPY', 1, 2, 999, 998],
  ] as const)('%s add/edit/delete/undo stays exact', (currency, amount, editedAmount, afterAdd, afterEdit) => {
    const base = state({ accounts: [account({ currency })] });
    const added = addTransaction(base, expenseInput({ amount }), NOW);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.state.accounts[0].balance).toBe(afterAdd);
    expect(undoAddTransaction(added.state, added.transaction).accounts[0].balance).toBe(1000);
    const edited = updateTransaction(added.state, { ...expenseInput({ amount: editedAmount }), id: added.transaction.id }, NOW);
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.state.accounts[0].balance).toBe(afterEdit);
    const deleted = deleteTransaction(edited.state, edited.transaction.id);
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.state.accounts[0].balance).toBe(1000);
    const undone = undoDeleteTransaction(deleted.state, deleted.transaction);
    expect(undone.accounts[0].balance).toBe(afterEdit);
    expect(undoDeleteTransaction(undone, deleted.transaction)).toBe(undone);
    const income = updateTransaction(undone, { ...expenseInput({ amount, type: 'income' }), id: edited.transaction.id }, NOW);
    expect(income.ok).toBe(true);
    if (!income.ok) return;
    expect(income.state.accounts[0].balance).toBe(currency === 'JPY' ? 1001 : 1000.1);
    expect(undoAddTransaction(income.state, added.transaction).accounts[0].balance).toBe(1000);
  });

  it('moves an expense from USD to JPY and back using each account currency', () => {
    const base = state({ accounts: [account({ currency: 'USD' }), account({ id: 'acc2', currency: 'JPY', balance: 500 })] });
    const added = addTransaction(base, expenseInput({ amount: 10.25 }), NOW);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const moved = updateTransaction(added.state, { ...expenseInput({ amount: 200, accountId: 'acc2' }), id: added.transaction.id }, NOW);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.transaction).toMatchObject({ currency: 'JPY', amount: 200, accountId: 'acc2' });
    expect(moved.state.accounts.map(a => a.balance)).toEqual([1000, 300]);
    const back = updateTransaction(moved.state, { ...expenseInput({ amount: 0.25 }), id: added.transaction.id }, NOW);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.state.accounts.map(a => a.balance)).toEqual([999.75, 500]);
    expect(back.transaction.currency).toBe('USD');
  });

  it.each(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const)('%s permits history edits but not new inactive entries', currency => {
    const tx: Transaction = { id: 'history', title: 'Old', category: 'Dining', amount: 10, type: 'debit', status: 'Completed', date: NOW.toISOString(), accountId: 'acc1' };
    const base = state({ accounts: [account({ currency, status: 'Inactive' }), account({ id: 'acc2', currency, status: 'Inactive' })], transactions: [tx] });
    expect(addTransaction(base, expenseInput(), NOW).ok).toBe(false);
    const edited = updateTransaction(base, { ...expenseInput({ amount: 20 }), id: tx.id }, NOW);
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.state.accounts[0].balance).toBe(990);
    expect(updateTransaction(base, { ...expenseInput({ accountId: 'acc2' }), id: tx.id }, NOW).ok).toBe(false);
  });

  it.each([0, -1, NaN, Infinity, 1.01, 1.000000001, Number.MAX_SAFE_INTEGER + 1])('rejects invalid JPY amount %s without mutation', amount => {
    const base = state({ accounts: [account({ currency: 'JPY' })] });
    expect(addTransaction(base, expenseInput({ amount }), NOW).ok).toBe(false);
    expect(base.accounts[0].balance).toBe(1000);
    const tx: Transaction = { id: 'tx', title: 'Old', category: 'Dining', amount: 10, type: 'debit', status: 'Completed', date: NOW.toISOString(), accountId: 'acc1' };
    expect(updateTransaction({ ...base, transactions: [tx] }, { ...expenseInput({ amount }), id: tx.id }, NOW).ok).toBe(false);
  });

  it.each(['2026-02-30', '2026-04-31', '2025-02-29', '2026-2-01', '2026-11-11'])('rejects invalid completed dates %s for add/edit/transfer', date => {
    expect(addTransaction(state(), expenseInput({ date }), NOW).ok).toBe(false);
    const added = addTransaction(state(), expenseInput(), NOW);
    if (!added.ok) throw new Error(added.error);
    expect(updateTransaction(added.state, { ...expenseInput({ date }), id: added.transaction.id }, NOW).ok).toBe(false);
    expect(createTransfer(state(), { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10, date }, NOW).ok).toBe(false);
  });

  it('accepts a real leap day', () => {
    expect(addTransaction(state(), expenseInput({ date: '2024-02-29' }), NOW).ok).toBe(true);
  });

  it('rejects unsafe resulting balances rather than losing precision', () => {
    const base = state({ accounts: [account({ balance: 90071992547409.9 })] });
    expect(addTransaction(base, expenseInput({ type: 'income', amount: 1 }), NOW).ok).toBe(false);
    const tx: Transaction = { id: 'tx', title: 'Old', category: 'Dining', amount: 1, type: 'debit', status: 'Completed', date: NOW.toISOString(), accountId: 'acc1' };
    const withTx = { ...base, transactions: [tx] };
    expect(deleteTransaction(withTx, tx.id).ok).toBe(false);
    expect(updateTransaction(withTx, { ...expenseInput({ type: 'income', amount: 1 }), id: tx.id }, NOW).ok).toBe(false);
    expect(undoAddTransaction(withTx, tx)).toBe(withTx);
    expect(undoDeleteTransaction(base, { ...tx, type: 'credit' })).toBe(base);
  });

  it('normalizes tags on add/edit without replacing custom category ids', () => {
    const input = { ...expenseInput(), category: 'custom-food' as NewTransactionInput['category'], tags: [' work ', '', 'work', 'Travel', 'travel'] };
    const added = addTransaction(state(), input, NOW);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.transaction).toMatchObject({ category: 'custom-food', tags: ['work', 'Travel'] });
    const edited = updateTransaction(added.state, { ...input, tags: ['  home '], id: added.transaction.id }, NOW);
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.transaction).toMatchObject({ tags: ['home'] });
  });

  it('undoing either transfer leg removes the linked pair atomically', () => {
    const made = createTransfer(state(), { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10, date: '2026-11-10' }, NOW);
    if (!made.ok) throw new Error(made.error);
    const undone = undoAddTransaction(made.state, made.legs[1]);
    expect(undone.transactions).toHaveLength(0);
    expect(undone.accounts.map(a => a.balance)).toEqual([1000, 500]);
    const deleted = deleteTransaction(made.state, made.legs[0].id);
    if (!deleted.ok) throw new Error(deleted.error);
    expect(undoDeleteTransaction(deleted.state, deleted.transaction)).toBe(deleted.state);
  });

  it('rejects transfer balance/conversion overflow and fractional JPY source amounts', () => {
    const base = state({ accounts: [account({ currency: 'JPY' }), account({ id: 'acc2', currency: 'USD', balance: 90071992547409.9 })] });
    for (const [amount, rate] of [[1, 1], [1.000000001, 1], [100, Number.MAX_VALUE]]) {
      expect(createTransfer(base, { fromAccountId: 'acc1', toAccountId: 'acc2', amount, rate, date: '2026-11-10' }, NOW).ok).toBe(false);
    }
  });
});

// Fixtures intentionally predate the operation: bad existing refund kind must not evade caps.
function refundableState(currency: Account['currency'] = 'INR'): LedgerState {
  return state({ accounts: [account({ currency })], transactions: [{
    id: 'original', title: 'Purchase', category: 'Dining', amount: 100, type: 'debit',
    status: 'Completed', date: '2026-10-01T12:00:00.000Z', accountId: 'acc1', kind: 'expense', currency,
  }] });
}

describe('refund integrity', () => {
  it.each(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const)('%s supports the transactionId API, partial caps, edit and undo', currency => {
    const base = refundableState(currency);
    const first = recordRefund(base, { transactionId: 'original', amount: 40, date: '2026-11-01', note: ' returned ' }, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.transaction).toMatchObject({ amount: 40, currency, kind: 'refund', refundOfId: 'original', note: 'returned' });
    expect(first.state.accounts[0].balance).toBe(1040);
    const edited = updateTransaction(first.state, { ...expenseInput({ type: 'income', amount: 60 }), id: first.transaction.id }, NOW);
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.transaction).toMatchObject({ amount: 60, kind: 'refund', refundOfId: 'original', type: 'credit' });
    expect(edited.state.accounts[0].balance).toBe(1060);
    const second = recordRefund(edited.state, { transactionId: 'original', amount: 40, date: '2026-11-10' }, NOW);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(recordRefund(second.state, { transactionId: 'original', amount: 1, date: '2026-11-10' }, NOW).ok).toBe(false);
    expect(updateTransaction(second.state, { ...expenseInput({ type: 'income', amount: 61 }), id: first.transaction.id }, NOW).ok).toBe(false);
    const deleted = deleteTransaction(second.state, first.transaction.id);
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.state.accounts[0].balance).toBe(1040);
    expect(undoDeleteTransaction(deleted.state, deleted.transaction).accounts[0].balance).toBe(1100);
    expect(undoAddTransaction(second.state, second.transaction).accounts[0].balance).toBe(1060);
  });

  it.each([0, -5, NaN, Infinity, 0.000000001, 1.001, 90071992547410])('rejects bad refund amount %s', amount => {
    expect(recordRefund(refundableState(), { originalTransactionId: 'original', amount, date: '2026-11-01' }, NOW).ok).toBe(false);
  });

  it.each(['2026-02-30', '2026-11-11', '2026-09-30'])('rejects impossible, future or pre-expense refund date %s', date => {
    expect(recordRefund(refundableState(), { originalTransactionId: 'original', amount: 1, date }, NOW).ok).toBe(false);
  });

  it('only refunds completed expenses into active same-currency accounts', () => {
    const base = refundableState();
    for (const patch of [{ type: 'credit' as const, kind: 'income' as const }, { status: 'Pending' as const }, { kind: 'transfer' as const }, { kind: 'refund' as const }]) {
      expect(recordRefund({ ...base, transactions: [{ ...base.transactions[0], ...patch }] }, { originalTransactionId: 'original', amount: 1 }, NOW).ok).toBe(false);
    }
    for (const patch of [{ status: 'Inactive' as const }, { id: 'missing' }]) {
      expect(recordRefund({ ...base, accounts: [account(patch)] }, { originalTransactionId: 'original', amount: 1 }, NOW).ok).toBe(false);
    }
    expect(recordRefund({ ...base, accounts: [...base.accounts, account({ id: 'usd', currency: 'USD' })] }, { originalTransactionId: 'original', amount: 1, accountId: 'usd' }, NOW).ok).toBe(false);
    expect(recordRefund(refundableState('JPY'), { originalTransactionId: 'original', amount: 1.000000001 }, NOW).ok).toBe(false);
  });

  it('guards parent edits/deletes and stale undo against orphaning or exceeding refunds', () => {
    const base = refundableState();
    const first = recordRefund(base, { originalTransactionId: 'original', amount: 60, date: '2026-11-01' }, NOW);
    if (!first.ok) throw new Error(first.error);
    expect(deleteTransaction(first.state, 'original').ok).toBe(false);
    expect(undoAddTransaction(first.state, base.transactions[0])).toBe(first.state);
    for (const patch of [{ amount: 59 }, { type: 'income' as const }, { category: 'Other' as const }, { date: '2026-11-02' }]) {
      expect(updateTransaction(first.state, { ...expenseInput(), ...patch, id: 'original' }, NOW).ok).toBe(false);
    }
    const safeEdit = updateTransaction(first.state, { ...expenseInput({ amount: 60, date: '2026-10-01', title: 'Corrected' }), id: 'original' }, NOW);
    expect(safeEdit.ok).toBe(true);
    const deleted = deleteTransaction(first.state, first.transaction.id);
    if (!deleted.ok) throw new Error(deleted.error);
    const replacement = recordRefund(deleted.state, { originalTransactionId: 'original', amount: 100, date: '2026-11-01' }, NOW);
    if (!replacement.ok) throw new Error(replacement.error);
    expect(undoDeleteTransaction(replacement.state, first.transaction)).toBe(replacement.state);
    expect(undoDeleteTransaction(state(), first.transaction).transactions).toHaveLength(0);
  });

  it('counts every refundOfId link and never allows refund conversion to an expense', () => {
    const base = refundableState();
    const legacy: Transaction = { ...base.transactions[0], id: 'legacy-refund', refundOfId: 'original', type: 'credit', kind: 'income', amount: 90 };
    const withRefund = { ...base, transactions: [...base.transactions, legacy] };
    expect(recordRefund(withRefund, { originalTransactionId: 'original', amount: 11 }, NOW).ok).toBe(false);
    expect(updateTransaction(withRefund, { ...expenseInput({ amount: 90 }), id: legacy.id }, NOW).ok).toBe(false);
    const edited = updateTransaction(withRefund, { ...expenseInput({ type: 'income', amount: 80 }), id: legacy.id }, NOW);
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.transaction.kind).toBe('refund');
  });
});

describe('refunds', () => {
  function originalExpense(): Transaction {
    return {
      id: 'tx_orig',
      title: 'Groceries',
      category: 'Groceries',
      amount: 100,
      type: 'debit',
      status: 'Completed',
      date: '2026-11-10T12:00:00.000Z',
      accountId: 'acc1',
      kind: 'expense',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
  }

  it('records a full refund linked to the original expense', () => {
    const start = state();
    const original = originalExpense();
    const withOriginal = {
      ...start,
      transactions: [original],
    };
    const result = recordRefund(withOriginal, { originalTransactionId: 'tx_orig', amount: 100 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transaction.kind).toBe('refund');
    expect(result.transaction.type).toBe('credit');
    expect(result.transaction.refundOfId).toBe('tx_orig');
    expect(result.transaction.category).toBe('Groceries');
    expect(result.state.accounts[0].balance).toBe(1100);
  });

  it('records a partial refund', () => {
    const start = state();
    const original = { ...originalExpense(), amount: 100 };
    const withOriginal = { ...start, transactions: [original] };
    const result = recordRefund(withOriginal, { originalTransactionId: 'tx_orig', amount: 40 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.accounts[0].balance).toBe(1040);
  });

  it('blocks a refund larger than the original', () => {
    const withOriginal = state({ transactions: [originalExpense()] });
    const result = recordRefund(withOriginal, { originalTransactionId: 'tx_orig', amount: 150 });
    expect(result).toEqual({ ok: false, error: 'Refund amount exceeds the original transaction.' });
  });

  it('blocks a refund that exceeds the remaining refundable amount', () => {
    const withOriginal = state({ transactions: [originalExpense()] });
    const first = recordRefund(withOriginal, { originalTransactionId: 'tx_orig', amount: 60 });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('setup failed');
    const second = recordRefund(first.state, { originalTransactionId: 'tx_orig', amount: 50 });
    expect(second).toEqual({ ok: false, error: 'Refund amount exceeds the remaining refundable amount.' });
  });

  it('rejects a refund for an unknown original transaction', () => {
    const result = recordRefund(state(), { originalTransactionId: 'nope', amount: 10 });
    expect(result).toEqual({ ok: false, error: 'That transaction no longer exists.' });
  });
});
