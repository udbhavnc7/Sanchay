import type { CategoryDefinition, Contact, Currency, PaymentAttempt } from '../types/finance';
import { initialsFromName } from './money';

export interface ContactDraft {
  name: string;
  handle?: string;
  bank: string;
  accountNumber?: string;
  upiId?: string;
  type: Contact['type'];
  currency: Currency;
  isFavorite: boolean;
}

export const CONTACT_LIMITS = { name: 100, handle: 64, bank: 100, accountNumber: 64, upiId: 128 } as const;
export type ContactErrors = Partial<Record<keyof ContactDraft | 'id', string>>;
export interface ContactDuplicate {
  contact: Contact;
  fields: ('upiId' | 'accountNumber')[];
}
export type ContactSaveResult =
  | { ok: true; contact: Contact }
  | { ok: false; errors: ContactErrors; duplicates: ContactDuplicate[] };

const CURRENCIES: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
// Control and bidi-override characters are rejected on purpose: payee handles are
// displayed verbatim and must not smuggle invisible direction changes.
// oxlint-disable-next-line no-control-regex
const UNSAFE_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/;

/** Local syntax check only; it never verifies a recipient or contacts a provider. */
function upiSyntaxError(value: string): string {
  if (value.length > CONTACT_LIMITS.upiId) return `Use at most ${CONTACT_LIMITS.upiId} characters.`;
  if (UNSAFE_TEXT.test(value) || !/^[a-z0-9._-]+@[a-z0-9]+$/i.test(value.trim())) {
    return 'Use UPI ID syntax such as name@bank. This does not verify the recipient.';
  }
  return '';
}

export function validateContactDraft(draft: ContactDraft): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of Object.keys(CONTACT_LIMITS) as (keyof typeof CONTACT_LIMITS)[]) {
    const value = draft[field] ?? '';
    if (value.length > CONTACT_LIMITS[field]) {
      errors[field] = `Use at most ${CONTACT_LIMITS[field]} characters.`;
    } else if (UNSAFE_TEXT.test(value)) {
      errors[field] = 'Remove hidden control characters.';
    }
  }
  if (!draft.name.trim()) errors.name = 'Enter a payee name.';
  if (!draft.accountNumber?.trim() && !draft.upiId?.trim()) {
    errors.accountNumber = 'Enter an account reference or UPI ID.';
    errors.upiId = 'Enter a UPI ID or account reference.';
  } else if (draft.upiId?.trim() && !errors.upiId) {
    const error = upiSyntaxError(draft.upiId);
    if (error) errors.upiId = error;
  }
  if (!['Person', 'Business'].includes(draft.type)) errors.type = 'Choose Person or Business.';
  if (!CURRENCIES.includes(draft.currency)) errors.currency = 'Choose a supported currency.';
  return errors;
}

export function findContactDuplicates(
  draft: ContactDraft,
  contacts: readonly Contact[],
  excludeId?: string
): ContactDuplicate[] {
  const upi = draft.upiId?.trim().toLowerCase();
  const account = draft.accountNumber?.replace(/\s/g, '').toLowerCase();
  return contacts.flatMap((contact) => {
    if (contact.id === excludeId) return [];
    const fields: ContactDuplicate['fields'] = [];
    if (upi && upi === contact.upiId?.trim().toLowerCase()) fields.push('upiId');
    if (account && account === contact.accountNumber?.replace(/\s/g, '').toLowerCase()) fields.push('accountNumber');
    return fields.length ? [{ contact, fields }] : [];
  });
}

function normalizedFields(draft: ContactDraft) {
  const accountNumber = draft.accountNumber?.trim() || undefined;
  const upiId = draft.upiId?.trim() || undefined;
  return {
    name: draft.name.trim(),
    handle: draft.handle?.trim() || `••${(accountNumber || upiId || '').slice(-4)}`,
    bank: draft.bank.trim(), accountNumber, upiId,
    type: draft.type, currency: draft.currency, isFavorite: draft.isFavorite,
    initials: initialsFromName(draft.name) || 'CO',
  };
}

export function createContact(
  draft: ContactDraft,
  contacts: readonly Contact[],
  options: { id: string; avatarColor: string; allowDuplicate?: boolean }
): ContactSaveResult {
  const errors = validateContactDraft(draft);
  if (!options.id.trim() || contacts.some((contact) => contact.id === options.id)) {
    errors.id = 'A new, unique payee ID is required.';
  }
  const duplicates = findContactDuplicates(draft, contacts);
  if (Object.keys(errors).length || (duplicates.length && !options.allowDuplicate)) {
    return { ok: false, errors, duplicates };
  }
  return { ok: true, contact: { ...normalizedFields(draft), id: options.id, avatarColor: options.avatarColor, lastTransfer: 'Never paid' } };
}

export function updateContact(
  contact: Contact,
  draft: ContactDraft,
  contacts: readonly Contact[],
  allowDuplicate = false
): ContactSaveResult {
  const errors = validateContactDraft(draft);
  const duplicates = findContactDuplicates(draft, contacts, contact.id);
  if (Object.keys(errors).length || (duplicates.length && !allowDuplicate)) {
    return { ok: false, errors, duplicates };
  }
  // No attempts are accepted or rewritten: past payments retain their snapshots.
  return { ok: true, contact: { ...contact, ...normalizedFields(draft) } };
}

export function setContactArchived(contact: Contact, archived: boolean): Contact {
  return { ...contact, archived };
}

export function contactAttemptError(contact: Contact | undefined, upiId: string): string {
  if (!contact) return 'Choose someone to pay.';
  if (contact.archived) return 'This payee is archived. Restore them before preparing a new attempt.';
  if (!upiId.trim()) return 'Enter the payee UPI ID you were given.';
  return upiSyntaxError(upiId);
}

/** Compatibility with the legacy ledger callback, using the attempt rather than today's payee. */
export function contactForPaymentAttempt(attempt: PaymentAttempt, contact?: Contact): Contact {
  return {
    ...(contact?.id === attempt.payeeId ? contact : undefined),
    id: attempt.payeeId, name: attempt.payeeName, upiId: attempt.upiId, currency: attempt.currency,
    handle: attempt.upiId, bank: '', accountNumber: undefined,
    type: contact?.id === attempt.payeeId ? contact.type : 'Person',
    initials: initialsFromName(attempt.payeeName) || 'CO',
    avatarColor: contact?.avatarColor ?? '#ff9800', isFavorite: contact?.isFavorite ?? false,
  };
}

const PAYMENT_CATEGORIES = ['Other', 'Groceries', 'Dining', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Rent', 'Travel'];
export interface PayeeCategoryOption { value: string; label: string; disabled?: boolean }

export function payeeCategoryLabel(value: string, definitions: readonly CategoryDefinition[] = []): string {
  return definitions.find((item) => item.id === value)?.name || value;
}

export function payeeCategoryOptions(
  definitions: readonly CategoryDefinition[] = [],
  current?: string
): PayeeCategoryOption[] {
  const ids = [...new Set([...PAYMENT_CATEGORIES, ...definitions.map((item) => item.id)])];
  const options: PayeeCategoryOption[] = ids.flatMap((value) => {
    const definition = definitions.find((item) => item.id === value);
    if (definition && (definition.archived || definition.type !== 'expense')) return [];
    return [{ value, label: payeeCategoryLabel(value, definitions) }];
  });
  if (current && !options.some((item) => item.value === current)) {
    const unavailable = definitions.some((item) => item.id === current);
    options.push(unavailable
      ? { value: current, label: `${payeeCategoryLabel(current, definitions)} (unavailable)`, disabled: true }
      : { value: current, label: current });
  }
  return options;
}
