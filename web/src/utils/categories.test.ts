import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CategoriesModal } from '../components/CategoriesModal';
import type { CategoryDefinition } from '../types/finance';
import {
  BUILT_IN_CATEGORIES,
  archiveCategory,
  categoryLabel,
  categoryOptions,
  deleteCategory,
  saveCategory,
  type CategoryState,
} from './categories';

const pets: CategoryDefinition = {
  id: 'custom_pets', name: 'Pets', type: 'expense', color: '#2563eb', icon: 'heart',
};
const vet: CategoryDefinition = {
  id: 'custom_vet', name: 'Veterinary', type: 'expense', color: '#16a34a', icon: 'shield',
};
const bonus: CategoryDefinition = {
  id: 'custom_bonus', name: 'Bonus', type: 'income', color: '#16a34a', icon: 'wallet',
};

function state(): CategoryState & { preferences: { demoMode: boolean } } {
  return {
    categories: [pets, vet, bonus],
    transactions: [
      { id: 'tx', title: 'Vet visit', category: 'custom_pets', amount: 100, type: 'debit', status: 'Completed', date: '2026-11-01' },
      { id: 'other', title: 'Food', category: 'Groceries', amount: 50, type: 'debit', status: 'Pending', date: '2026-11-01' },
    ],
    budgets: [{ id: 'budget', category: 'custom_pets', limit: 500, color: '#2563eb', archived: true, history: [{ id: 'period', limit: 400, effectiveFrom: '2026-10-01', createdAt: '2026-10-01' }] }],
    plannedPayments: [{ id: 'plan', title: 'Vet', category: 'custom_pets', amount: 100, direction: 'out', dueDate: '2026-12-01' }],
    paymentAttempts: [{ id: 'attempt', payeeId: 'vet', payeeName: 'Vet', upiId: 'vet@upi', amount: 100, currency: 'INR', accountId: 'account', category: 'custom_pets', status: 'marked_paid_by_user', createdAt: '2026-11-01', updatedAt: '2026-11-01', transactionId: 'tx' }],
    preferences: { demoMode: false },
  };
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

describe('CategoriesModal', () => {
  function render(categories: CategoryDefinition[] = []) {
    return renderToStaticMarkup(createElement(CategoriesModal, {
      categories,
      onSave: () => ({ ok: true }),
      onArchive: () => {},
      onDelete: () => ({ ok: true }),
      onClose: () => {},
    }));
  }

  it('renders a labelled modal with labelled category inputs and close control', () => {
    const html = render();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toContain('aria-label="Close categories"');
    for (const label of ['Category name', 'Category type', 'Category color', 'Category icon']) {
      expect(html).toMatch(new RegExp(`<label[^>]+for="[^"]+"[^>]*>${label}</label>`));
    }
    expect(html).toContain('Create category');
  });

  it('offers archive for active custom categories and restore for archived history', () => {
    const html = render([pets, { ...vet, archived: true }]);
    expect(html).toContain('aria-label="Edit Pets"');
    expect(html).toContain('aria-label="Archive Pets"');
    expect(html).toContain('aria-label="Restore Veterinary"');
    expect(html).toContain('aria-label="Delete Veterinary"');
    expect(html).toContain('Archived');
  });

  it('distinguishes built-ins without offering archive or delete actions', () => {
    const html = render();
    expect(html).toContain('Built-in categories');
    expect(html).toContain('aria-label="Edit Dining"');
    expect(html).not.toContain('aria-label="Delete Dining"');
    expect(html).not.toContain('aria-label="Archive Dining"');
  });
});

describe('category labels and choices', () => {
  it('resolves stable IDs, archived labels, legacy names and unknown legacy values', () => {
    expect(categoryLabel('custom_pets', [{ ...pets, archived: true }])).toBe('Pets');
    expect(categoryLabel('Pets', [pets])).toBe('Pets');
    expect(categoryLabel('Dining', [])).toBe('Dining');
    expect(categoryLabel('Retired legacy category', [])).toBe('Retired legacy category');
  });

  it('keeps built-in name IDs unique and available without persisted definitions', () => {
    expect(new Set(BUILT_IN_CATEGORIES.map((item) => item.id)).size).toBe(16);
    expect(BUILT_IN_CATEGORIES.every((item) => item.id === item.name && item.builtIn)).toBe(true);
    expect(categoryOptions([], 'expense').map((item) => item.id)).toContain('Infrastructure');
    expect(categoryOptions([], 'income').map((item) => item.id)).toEqual(['Income', 'Payroll', 'Client Payment', 'Other']);
  });

  it('excludes archived custom choices and categories of the other type', () => {
    const options = categoryOptions([pets, { ...vet, archived: true }, bonus], 'expense');
    expect(options.map((item) => item.id)).toContain('custom_pets');
    expect(options.map((item) => item.id)).not.toContain('custom_vet');
    expect(options.map((item) => item.id)).not.toContain('custom_bonus');
    expect(categoryOptions([pets, bonus], 'income').map((item) => item.id)).toContain('custom_bonus');
  });

  it('does not let persisted flags hide or rename a built-in choice', () => {
    const options = categoryOptions([{ id: 'Dining', name: 'Hidden', type: 'income', color: '#123456', icon: 'tag', archived: true }], 'expense');
    expect(options.find((item) => item.id === 'Dining')).toMatchObject({ name: 'Dining', type: 'expense', archived: false, builtIn: true });
    expect(options.filter((item) => item.id === 'Dining')).toHaveLength(1);
  });
});

describe('saveCategory', () => {
  it('creates trimmed names with unique custom IDs, never a name as the stored value', () => {
    const input = { name: '  Pets  ', type: 'expense' as const, color: '#2563eb', icon: 'heart' };
    const first = saveCategory([], input);
    const second = saveCategory([], input);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.definition.id).toMatch(/^custom_.+/);
    expect(first.definition.id).not.toBe(second.definition.id);
    expect(first.definition.name).toBe('Pets');
    expect(first.categories).toContainEqual(first.definition);
  });

  it('accepts a generated full definition from the modal on first save', () => {
    const result = saveCategory([], pets);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.definition.id).toBe('custom_pets');
  });

  it.each(['pets', ' PETS ', 'PeTs'])('rejects case-insensitive duplicates: %s', (name) => {
    const original = freezeDeep([pets]);
    const result = saveCategory(original, { ...vet, name });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already exists/i);
    expect(original).toEqual([pets]);
  });

  it('reserves archived names and built-in names, including shared Other', () => {
    expect(saveCategory([{ ...pets, archived: true }], { ...vet, name: 'PETS' }).ok).toBe(false);
    expect(saveCategory([], { ...vet, name: 'dining' }).ok).toBe(false);
    expect(saveCategory([], { ...bonus, name: 'other' }).ok).toBe(false);
  });

  it('allows the same name in different types', () => {
    expect(saveCategory([pets], { ...bonus, name: 'Pets' }).ok).toBe(true);
  });

  it('renames and recolors without altering IDs or any historical references', () => {
    const original = freezeDeep(state());
    const result = saveCategory(original.categories, { ...pets, name: 'Pet care', color: '#abcdef', icon: 'shield' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.definition).toMatchObject({ id: 'custom_pets', name: 'Pet care', color: '#abcdef', icon: 'shield' });
    expect(categoryLabel(original.transactions[0].category, result.categories)).toBe('Pet care');
    expect(original.transactions[0].category).toBe('custom_pets');
    expect(original.budgets[0].category).toBe('custom_pets');
    expect(original.plannedPayments[0].category).toBe('custom_pets');
    expect(original.paymentAttempts[0].category).toBe('custom_pets');
    expect(original.categories[0].name).toBe('Pets');
  });

  it.each([
    { name: '' }, { name: '   ' }, { name: 'x'.repeat(61) },
    { color: 'red' }, { color: '#12345g' }, { icon: '' },
    { id: 'Pets' }, { id: 'custom_' }, { id: 'custom_bad id' },
  ])('rejects malformed category fields %j', (patch) => {
    expect(saveCategory([], { ...pets, ...patch }).ok).toBe(false);
  });

  it('rejects changing an existing category type, but allows built-in appearance changes', () => {
    expect(saveCategory([pets], { ...pets, type: 'income' }).ok).toBe(false);
    expect(saveCategory([], { id: 'Dining', name: 'Eating out', type: 'expense', color: '#123456', icon: 'tag' }).ok).toBe(false);
    const result = saveCategory([], { id: 'Dining', name: 'Dining', type: 'expense', color: '#123456', icon: 'tag' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.definition).toMatchObject({ id: 'Dining', name: 'Dining', color: '#123456', builtIn: true });
  });
});

describe('archiveCategory', () => {
  it('archives without losing the label or references and can restore choices', () => {
    const original = freezeDeep(state());
    const result = archiveCategory(original.categories, pets.id, true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(categoryLabel('custom_pets', result.categories)).toBe('Pets');
    expect(categoryOptions(result.categories, 'expense').some((item) => item.id === pets.id)).toBe(false);
    expect(original.transactions[0].category).toBe('custom_pets');
    expect(original.categories[0].archived).toBeUndefined();
    const restored = archiveCategory(result.categories, pets.id, false);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(categoryOptions(restored.categories, 'expense').some((item) => item.id === pets.id)).toBe(true);
  });

  it('rejects archiving built-ins or unknown IDs', () => {
    expect(archiveCategory([], 'Dining', true).ok).toBe(false);
    expect(archiveCategory([], 'custom_missing', true).ok).toBe(false);
  });
});

describe('deleteCategory', () => {
  it('atomically reassigns all four arrays, including archived budgets and completed attempts', () => {
    const original = freezeDeep(state());
    const result = deleteCategory(original, pets.id, vet.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.categories.some((item) => item.id === pets.id)).toBe(false);
    expect(result.state.transactions[0]).toEqual({ ...original.transactions[0], category: 'custom_vet' });
    expect(result.state.budgets[0]).toEqual({ ...original.budgets[0], category: 'custom_vet' });
    expect(result.state.plannedPayments[0]).toEqual({ ...original.plannedPayments[0], category: 'custom_vet' });
    expect(result.state.paymentAttempts[0]).toEqual({ ...original.paymentAttempts[0], category: 'custom_vet' });
    expect(result.state.transactions[1]).toBe(original.transactions[1]);
    expect(result.state.preferences).toBe(original.preferences);
    expect(original.transactions[0].category).toBe('custom_pets');
  });

  it.each(['transactions', 'budgets', 'plannedPayments', 'paymentAttempts'] as const)(
    'requires reassignment even when only %s references the category', (key) => {
      const original = state();
      original.transactions = [];
      original.budgets = [];
      original.plannedPayments = [];
      original.paymentAttempts = [];
      Object.assign(original, { [key]: state()[key] });
      freezeDeep(original);
      const before = JSON.stringify(original);
      const result = deleteCategory(original, pets.id);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/reassign/i);
      expect(JSON.stringify(original)).toBe(before);
      expect(result).not.toHaveProperty('state');
    }
  );

  it.each(['custom_pets', 'custom_missing', 'custom_bonus', 'custom_vet'])(
    'rejects self, missing, cross-type and archived targets without mutating: %s', (target) => {
      const original = state();
      original.categories[1] = { ...vet, archived: true };
      freezeDeep(original);
      const before = JSON.stringify(original);
      expect(deleteCategory(original, pets.id, target).ok).toBe(false);
      expect(JSON.stringify(original)).toBe(before);
    }
  );

  it('allows reassigning to an available built-in name ID', () => {
    const result = deleteCategory(state(), pets.id, 'Other');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.transactions[0].category).toBe('Other');
    expect(result.state.paymentAttempts[0].category).toBe('Other');
  });

  it('deletes an unreferenced category without rewriting unrelated arrays', () => {
    const original = freezeDeep(state());
    const result = deleteCategory(original, bonus.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.categories.some((item) => item.id === bonus.id)).toBe(false);
    expect(result.state.transactions).toBe(original.transactions);
    expect(result.state.budgets).toBe(original.budgets);
  });

  it('prohibits built-in deletion regardless of persisted flags and rejects unknown IDs', () => {
    const original = state();
    original.categories.push({ id: 'Dining', name: 'Dining', type: 'expense', icon: 'tag', color: '#123456', builtIn: false });
    expect(deleteCategory(original, 'Dining', 'Other').ok).toBe(false);
    expect(deleteCategory(original, 'custom_missing', 'Other').ok).toBe(false);
  });
});
