import { describe, expect, it } from 'vitest';
import type { Category, Transaction } from '../types/finance';
import { suggestCategory } from './categorySuggestion';

const EXPENSE_CATEGORIES: Category[] = [
  'Groceries',
  'Dining',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Rent',
  'Travel',
  'Other',
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
    ...overrides,
  };
}

describe('suggestCategory', () => {
  it('suggests the most recent matching category for a title fragment', () => {
    const result = suggestCategory(
      [
        transaction({
          id: 'older',
          title: 'Weekly groceries',
          category: 'Groceries',
          date: '2026-10-01T10:00:00.000Z',
        }),
        transaction({
          id: 'newer',
          title: 'Weekly groceries',
          category: 'Groceries',
          date: '2026-10-20T10:00:00.000Z',
        }),
      ],
      'expense',
      'grocer',
      EXPENSE_CATEGORIES
    );

    expect(result).toEqual({
      category: 'Groceries',
      matchCount: 2,
      matchedText: 'Weekly groceries',
    });
  });

  it('matches a counterparty and prefers an exact match', () => {
    const result = suggestCategory(
      [
        transaction({
          id: 'partial',
          title: 'Coffee run',
          counterparty: 'Blue Tokai',
          category: 'Dining',
        }),
        transaction({
          id: 'exact',
          title: 'Coffee beans',
          counterparty: 'Blue Tokai',
          category: 'Groceries',
          date: '2026-10-22T10:00:00.000Z',
        }),
      ],
      'expense',
      'blue tokai',
      EXPENSE_CATEGORIES
    );

    expect(result?.category).toBe('Groceries');
    expect(result?.matchedText).toBe('Blue Tokai');
  });

  it('keeps income and expense suggestions separate', () => {
    const transactions = [
      transaction({ id: 'expense', title: 'Client lunch', category: 'Dining' }),
      transaction({
        id: 'income',
        title: 'Client payment',
        category: 'Client Payment',
        type: 'credit',
      }),
    ];

    expect(
      suggestCategory(transactions, 'expense', 'client', EXPENSE_CATEGORIES)?.category
    ).toBe('Dining');
    expect(
      suggestCategory(transactions, 'income', 'client', ['Income', 'Payroll', 'Client Payment'])?.category
    ).toBe('Client Payment');
  });

  it('ignores short queries, transfers, pending rows and unsupported categories', () => {
    const transactions = [
      transaction({ id: 'transfer', title: 'Grocery savings', kind: 'transfer' }),
      transaction({ id: 'pending', title: 'Grocery order', status: 'Pending' }),
      transaction({
        id: 'unsupported',
        title: 'Grocery refund',
        category: 'Income',
      }),
      transaction({ id: 'valid', title: 'Grocery basket', category: 'Groceries' }),
    ];

    expect(suggestCategory(transactions, 'expense', 'gr', EXPENSE_CATEGORIES)).toBeNull();
    expect(
      suggestCategory(transactions, 'expense', 'grocery', EXPENSE_CATEGORIES)
    ).toEqual({
      category: 'Groceries',
      matchCount: 1,
      matchedText: 'Grocery basket',
    });
  });
});
