import { describe, expect, it } from 'vitest';
import type { Account, Transaction } from '../types/finance';
import { buildRecentTemplates } from './transactionTemplates';

const accounts: Account[] = [
  {
    id: 'a1',
    name: 'Everyday',
    type: 'Bank',
    currency: 'INR',
    balance: 1000,
    status: 'Active',
    change: 0,
  },
  {
    id: 'a2',
    name: 'Dollars',
    type: 'Bank',
    currency: 'USD',
    balance: 100,
    status: 'Active',
    change: 0,
  },
  {
    id: 'a3',
    name: 'Old account',
    type: 'Bank',
    currency: 'INR',
    balance: 0,
    status: 'Inactive',
    change: 0,
  },
];

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    title: 'Transaction',
    category: 'Other',
    amount: 100,
    type: 'debit',
    status: 'Completed',
    date: '2026-10-20T10:00:00.000Z',
    accountId: 'a1',
    ...overrides,
  };
}

describe('buildRecentTemplates', () => {
  it('keeps the newest completed income or expense per title, category and account', () => {
    const templates = buildRecentTemplates(
      [
        transaction({ id: 'old', title: 'Groceries', category: 'Groceries', amount: 100 }),
        transaction({
          id: 'new',
          title: 'Groceries',
          category: 'Groceries',
          amount: 150,
          date: '2026-10-22T10:00:00.000Z',
        }),
      ],
      accounts,
      'expense'
    );

    expect(templates).toEqual([
      {
        id: 'new',
        title: 'Groceries',
        category: 'Groceries',
        amount: 150,
        accountId: 'a1',
      },
    ]);
  });

  it('excludes transfers, pending rows, unavailable currencies and inactive accounts', () => {
    const templates = buildRecentTemplates(
      [
        transaction({ id: 'transfer', kind: 'transfer', category: 'Savings' }),
        transaction({ id: 'pending', status: 'Pending' }),
        transaction({ id: 'usd', accountId: 'a2' }),
        transaction({ id: 'inactive', accountId: 'a3' }),
        transaction({ id: 'valid', title: 'Coffee', category: 'Dining' }),
      ],
      accounts,
      'expense'
    );

    expect(templates.map((template) => template.id)).toEqual(['valid']);
  });

  it('keeps income and expense suggestions separate and respects the limit', () => {
    const transactions = [
      transaction({ id: 'expense-1', title: 'Rent', category: 'Rent', amount: 20000 }),
      transaction({ id: 'expense-2', title: 'Fuel', category: 'Transport' }),
      transaction({ id: 'income-1', title: 'Salary', category: 'Payroll', type: 'credit' }),
    ];

    expect(buildRecentTemplates(transactions, accounts, 'income')).toEqual([
      {
        id: 'income-1',
        title: 'Salary',
        category: 'Payroll',
        amount: 100,
        accountId: 'a1',
      },
    ]);
    expect(buildRecentTemplates(transactions, accounts, 'expense', 1)).toHaveLength(1);
  });

  it('falls back to the category when a transaction has no title', () => {
    const templates = buildRecentTemplates(
      [transaction({ id: 'untitled', title: '   ', category: 'Bills' })],
      accounts,
      'expense'
    );

    expect(templates[0].title).toBe('Bills');
  });
});
