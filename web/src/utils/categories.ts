import type {
  Budget,
  CategoryDefinition,
  PaymentAttempt,
  PlannedPayment,
  Transaction,
} from '../types/finance';

/** Built-in values remain names so existing ledger records need no migration. */
export const BUILT_IN_CATEGORIES: CategoryDefinition[] = [
  { id: 'Income', name: 'Income', type: 'income', color: '#16a34a', icon: 'wallet', builtIn: true },
  { id: 'Groceries', name: 'Groceries', type: 'expense', color: '#16a34a', icon: 'shopping-cart', builtIn: true },
  { id: 'Dining', name: 'Dining', type: 'expense', color: '#ea580c', icon: 'utensils', builtIn: true },
  { id: 'Transport', name: 'Transport', type: 'expense', color: '#2563eb', icon: 'car', builtIn: true },
  { id: 'Shopping', name: 'Shopping', type: 'expense', color: '#9333ea', icon: 'shopping-bag', builtIn: true },
  { id: 'Bills', name: 'Bills', type: 'expense', color: '#d97706', icon: 'receipt', builtIn: true },
  { id: 'Entertainment', name: 'Entertainment', type: 'expense', color: '#db2777', icon: 'music', builtIn: true },
  { id: 'Health', name: 'Health', type: 'expense', color: '#dc2626', icon: 'heart', builtIn: true },
  { id: 'Rent', name: 'Rent', type: 'expense', color: '#0d9488', icon: 'house', builtIn: true },
  { id: 'Savings', name: 'Savings', type: 'expense', color: '#16a34a', icon: 'piggy-bank', builtIn: true },
  { id: 'Payroll', name: 'Payroll', type: 'income', color: '#059669', icon: 'briefcase', builtIn: true },
  { id: 'Infrastructure', name: 'Infrastructure', type: 'expense', color: '#4f46e5', icon: 'building', builtIn: true },
  { id: 'Client Payment', name: 'Client Payment', type: 'income', color: '#0d9488', icon: 'wallet', builtIn: true },
  { id: 'Equipment', name: 'Equipment', type: 'expense', color: '#64748b', icon: 'laptop', builtIn: true },
  { id: 'Travel', name: 'Travel', type: 'expense', color: '#0284c7', icon: 'plane', builtIn: true },
  { id: 'Other', name: 'Other', type: 'expense', color: '#64748b', icon: 'tag', builtIn: true },
];

export type CategoryDraft = Omit<CategoryDefinition, 'id' | 'builtIn'> & { id?: string };
export type CategorySaveResult =
  | { ok: true; definition: CategoryDefinition; categories: CategoryDefinition[] }
  | { ok: false; error: string };

export interface CategoryState {
  categories: CategoryDefinition[];
  transactions: Transaction[];
  budgets: Budget[];
  plannedPayments: PlannedPayment[];
  paymentAttempts: PaymentAttempt[];
}

export type CategoryDeleteResult<S extends CategoryState = CategoryState> =
  | { ok: true; state: S }
  | { ok: false; error: string };

function allCategories(definitions: CategoryDefinition[]): CategoryDefinition[] {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const builtIns = BUILT_IN_CATEGORIES.map((builtIn) => {
    const saved = byId.get(builtIn.id);
    byId.delete(builtIn.id);
    return { ...builtIn, color: saved?.color ?? builtIn.color, icon: saved?.icon ?? builtIn.icon, archived: false };
  });
  return [...builtIns, ...byId.values()];
}

function matchesType(definition: CategoryDefinition, type: 'income' | 'expense'): boolean {
  // Other was historically offered for both directions; keep its one legacy ID.
  return definition.type === type || definition.id === 'Other';
}

export function categoryLabel(value: string, definitions: CategoryDefinition[]): string {
  const categories = allCategories(definitions);
  return (categories.find((definition) => definition.id === value)
    ?? categories.find((definition) => definition.name === value))?.name ?? value;
}

export function categoryOptions(definitions: CategoryDefinition[], type: 'income' | 'expense'): CategoryDefinition[] {
  return allCategories(definitions).filter((definition) => !definition.archived && matchesType(definition, type));
}

/** Upsert a definition. Omit id to generate a stable custom_ ID; updates keep it. */
export function saveCategory(definitions: CategoryDefinition[], input: CategoryDraft): CategorySaveResult {
  const categories = allCategories(definitions);
  const existing = categories.find((definition) => definition.id === input.id);
  const builtIn = BUILT_IN_CATEGORIES.find((definition) => definition.id === input.id);
  const name = input.name.trim();
  if (!name || name.length > 60) {
    return { ok: false, error: 'Enter a category name between 1 and 60 characters.' };
  }
  if (input.type !== 'income' && input.type !== 'expense') {
    return { ok: false, error: 'Choose income or expense.' };
  }
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) {
    return { ok: false, error: 'Choose a valid six-digit hex color.' };
  }
  if (!input.icon.trim() || input.icon.trim().length > 40) {
    return { ok: false, error: 'Choose a category icon (1 to 40 characters).' };
  }
  if (input.id !== undefined && !builtIn && !/^custom_[a-z0-9_-]+$/i.test(input.id)) {
    return { ok: false, error: 'Custom category IDs must start with custom_ and contain only letters, numbers, underscores or hyphens.' };
  }
  if (existing && existing.type !== input.type) {
    return { ok: false, error: 'A category type cannot be changed. Create a new category instead.' };
  }
  if (builtIn && (name !== builtIn.name || input.archived)) {
    return { ok: false, error: 'Built-in categories cannot be renamed or archived.' };
  }
  if (categories.some((item) => item.id !== input.id
    && matchesType(item, input.type)
    && item.name.trim().toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'A category with this name already exists for this type, including archived categories.' };
  }
  const definition: CategoryDefinition = {
    id: input.id ?? `custom_${crypto.randomUUID()}`,
    name,
    type: input.type,
    color: input.color,
    icon: input.icon.trim(),
    archived: input.archived ?? existing?.archived ?? false,
    builtIn: existing?.builtIn ?? false,
  };
  return {
    ok: true,
    definition,
    categories: existing
      ? categories.map((item) => item.id === definition.id ? definition : item)
      : [...categories, definition],
  };
}

export function archiveCategory(definitions: CategoryDefinition[], id: string, archived: boolean): CategorySaveResult {
  const definition = allCategories(definitions).find((item) => item.id === id);
  if (!definition) return { ok: false, error: 'Category not found.' };
  return saveCategory(definitions, { ...definition, archived });
}

/** Return one replacement state only after validating the entire deletion. Never mutate input. */
export function deleteCategory<S extends CategoryState>(state: S, id: string, reassignTo?: string): CategoryDeleteResult<S> {
  const definition = allCategories(state.categories).find((item) => item.id === id);
  if (!definition) return { ok: false, error: 'Category not found.' };
  if (BUILT_IN_CATEGORIES.some((item) => item.id === id)) {
    return { ok: false, error: 'Built-in categories cannot be deleted.' };
  }
  if (reassignTo !== undefined) {
    const target = categoryOptions(state.categories, definition.type).find((item) => item.id === reassignTo);
    if (!target || target.id === id) {
      return { ok: false, error: 'Reassign to a different, available category of the same type.' };
    }
  }
  const references = [state.transactions, state.budgets, state.plannedPayments, state.paymentAttempts];
  const referenced = references.some((items) => items.some((item) => item.category === id));
  if (referenced && !reassignTo) {
    return { ok: false, error: 'This category is in use. Choose a category to reassign all references, or archive it to preserve history.' };
  }
  const reassign = <T extends { category: string }>(items: T[]): T[] => {
    if (!reassignTo || !items.some((item) => item.category === id)) return items;
    return items.map((item) => item.category === id ? { ...item, category: reassignTo } : item);
  };
  return {
    ok: true,
    state: {
      ...state,
      categories: state.categories.filter((item) => item.id !== id),
      transactions: reassign(state.transactions),
      budgets: reassign(state.budgets),
      plannedPayments: reassign(state.plannedPayments),
      paymentAttempts: reassign(state.paymentAttempts),
    },
  };
}
