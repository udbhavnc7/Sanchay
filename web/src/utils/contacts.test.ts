import { describe, expect, it } from 'vitest';
import type { CategoryDefinition, Contact } from '../types/finance';
import {
  contactAttemptError,
  contactForPaymentAttempt,
  createContact,
  findContactDuplicates,
  payeeCategoryLabel,
  payeeCategoryOptions,
  setContactArchived,
  updateContact,
  validateContactDraft,
} from './contacts';
import { confirmPaymentAttempt, createPaymentAttempt, paymentDetailsText } from './paymentAttempts';

const draft = {
  name: ' Ayesha Khan ', handle: ' @ayesha ', bank: ' HDFC ',
  accountNumber: ' 00123456 ', upiId: ' ayesha.k@okhdfcbank ',
  type: 'Person' as const, currency: 'INR' as const, isFavorite: true,
};
const contact: Contact = {
  ...draft, id: 'c1', name: 'Ayesha Khan', handle: '@ayesha', bank: 'HDFC',
  accountNumber: '00123456', upiId: 'ayesha.k@okhdfcbank',
  initials: 'AK', avatarColor: '#ff9800', lastTransfer: 'Yesterday',
};
const options = { id: 'c2', avatarColor: '#3b82f6' };

// These tests catch invalid saved details, silent merging, unstable IDs and rewritten history.
describe('payee validation and creation', () => {
  it('trims fields without losing account leading zeroes', () => {
    const result = createContact(draft, [], options);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected a saved contact');
    expect(result.contact).toMatchObject({
      id: 'c2', name: 'Ayesha Khan', handle: '@ayesha', bank: 'HDFC',
      accountNumber: '00123456', upiId: 'ayesha.k@okhdfcbank', initials: 'AK',
      isFavorite: true, lastTransfer: 'Never paid',
    });
    expect(draft.name).toBe(' Ayesha Khan ');
  });

  it('accepts account-only and UPI-only contacts without claiming bank affiliation', () => {
    const accountOnly = createContact({ ...draft, handle: '', bank: '', upiId: '' }, [], options);
    expect(accountOnly.ok).toBe(true);
    if (!accountOnly.ok) throw new Error('Expected account-only contact');
    expect(accountOnly.contact.handle).toBe('••3456');
    expect(accountOnly.contact.bank).toBe('');
    expect(accountOnly.contact.upiId).toBeUndefined();
    expect(validateContactDraft({ ...draft, accountNumber: '' })).toEqual({});
  });

  it('rejects missing name and missing payment references inline', () => {
    const result = createContact({ ...draft, name: ' ', accountNumber: '', upiId: '' }, [], options);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected validation errors');
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.accountNumber).toBeTruthy();
    expect(result.errors.upiId).toBeTruthy();
  });

  it.each(['a@bank@other', '@bank', 'a@', 'a b@bank', 'upi://pay?pa=a@bank', 'a/evil@bank', 'a@bank\nnext'])('rejects malformed UPI syntax: %s', (upiId) => {
    expect(validateContactDraft({ ...draft, upiId }).upiId).toBeTruthy();
  });

  it.each(['a@bank', 'first.last-1_2@okhdfcbank', '9876543210@upi'])('accepts basic UPI syntax only: %s', (upiId) => {
    expect(validateContactDraft({ ...draft, upiId })).toEqual({});
  });

  it.each([
    ['name', 100], ['handle', 64], ['bank', 100], ['accountNumber', 64], ['upiId', 128],
  ] as const)('enforces the %s maximum without truncating', (field, limit) => {
    const value = field === 'upiId' ? `${'a'.repeat(limit - 5)}@bank` : 'a'.repeat(limit);
    expect(validateContactDraft({ ...draft, [field]: value })[field]).toBeUndefined();
    expect(validateContactDraft({ ...draft, [field]: `${value}a` })[field]).toBeTruthy();
  });

  it('rejects hidden control characters and invalid enum values', () => {
    expect(validateContactDraft({ ...draft, name: 'A\u0000B' }).name).toBeTruthy();
    expect(validateContactDraft({ ...draft, bank: 'Bank\u202eX' }).bank).toBeTruthy();
    expect(validateContactDraft({ ...draft, type: 'Other' as 'Person' }).type).toBeTruthy();
    expect(validateContactDraft({ ...draft, currency: 'XYZ' as 'INR' }).currency).toBeTruthy();
  });
});

describe('explicit duplicate decisions', () => {
  it('finds case-insensitive UPI and spaced account references, including archived contacts', () => {
    const archived = { ...contact, archived: true };
    const matches = findContactDuplicates({ ...draft, upiId: 'AYESHA.K@OKHDFCBANK', accountNumber: '00 123 456' }, [archived]);
    expect(matches).toEqual([{ contact: archived, fields: ['upiId', 'accountNumber'] }]);
  });

  it('does not match empty references, names alone, or partial account numbers', () => {
    expect(findContactDuplicates({ ...draft, upiId: '', accountNumber: '123456' }, [contact])).toEqual([]);
    expect(findContactDuplicates({ ...draft, upiId: '', accountNumber: '' }, [{ ...contact, upiId: undefined, accountNumber: undefined }])).toEqual([]);
  });

  it('blocks creation until deliberate duplicate add is chosen', () => {
    const blocked = createContact(draft, [contact], options);
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error('Expected duplicate decision');
    expect(blocked.duplicates[0].contact.id).toBe('c1');
    const allowed = createContact(draft, [contact], { ...options, allowDuplicate: true });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) throw new Error('Expected deliberate add');
    expect(allowed.contact.id).toBe('c2');
    expect(contact.id).toBe('c1');
  });

  it('never bypasses invalid input or reuses an existing ID with duplicate consent', () => {
    expect(createContact({ ...draft, upiId: 'bad' }, [contact], { ...options, allowDuplicate: true }).ok).toBe(false);
    expect(createContact(draft, [contact], { ...options, id: 'c1', allowDuplicate: true }).ok).toBe(false);
  });

  it('excludes the edited contact but detects collisions with another payee', () => {
    expect(updateContact(contact, draft, [contact]).ok).toBe(true);
    const another = { ...contact, id: 'other', upiId: 'other@bank', accountNumber: '222' };
    const changed = { ...draft, upiId: 'other@bank' };
    expect(updateContact(contact, changed, [contact, another]).ok).toBe(false);
    expect(updateContact(contact, changed, [contact, another], true).ok).toBe(true);
  });
});

describe('payee lifecycle and immutable history', () => {
  it('updates saved fields but preserves identity, history metadata and archive state', () => {
    const original = Object.freeze({ ...contact, archived: true });
    const result = updateContact(original, { ...draft, name: 'New Name', handle: 'New alias', accountNumber: '', upiId: 'new@bank', currency: 'USD', type: 'Business', isFavorite: false }, [original]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected edit');
    expect(result.contact).toMatchObject({ id: 'c1', name: 'New Name', initials: 'NN', handle: 'New alias', upiId: 'new@bank', currency: 'USD', type: 'Business', isFavorite: false, avatarColor: '#ff9800', lastTransfer: 'Yesterday', archived: true });
    expect(result.contact.accountNumber).toBeUndefined();
    expect(original.name).toBe('Ayesha Khan');
  });

  it('archives and restores without deleting or changing other contact fields', () => {
    const archived = setContactArchived(Object.freeze(contact), true);
    expect(archived).toEqual({ ...contact, archived: true });
    expect(setContactArchived(archived, false)).toEqual({ ...contact, archived: false });
    expect(contact.archived).toBeUndefined();
  });

  it('blocks archived/missing contacts and invalid overrides for new attempts', () => {
    expect(contactAttemptError(setContactArchived(contact, true), 'a@bank')).toContain('archived');
    expect(contactAttemptError(undefined, 'a@bank')).toBeTruthy();
    expect(contactAttemptError(contact, 'a@bank@evil')).toBeTruthy();
    expect(contactAttemptError(contact, `${'a'.repeat(128)}@bank`)).toBeTruthy();
    expect(contactAttemptError(contact, '')).toBeTruthy();
    expect(contactAttemptError(contact, 'a@bank')).toBe('');
  });

  it('keeps old attempt details and reconciliation after editing or archiving', () => {
    const attempt = Object.freeze(createPaymentAttempt({ payee: contact, upiId: contact.upiId!, amount: 500, accountId: 'a1', category: 'Other' }, { id: 'pa1', now: '2026-10-24T10:00:00.000Z' }));
    const edited = updateContact(contact, { ...draft, name: 'Changed Name', upiId: 'new@bank', currency: 'USD' }, [contact]);
    if (!edited.ok) throw new Error('Expected valid edit');
    const archived = setContactArchived(edited.contact, true);
    const snapshot = contactForPaymentAttempt(attempt, archived);
    expect(snapshot).toMatchObject({ id: 'c1', name: 'Ayesha Khan', upiId: 'ayesha.k@okhdfcbank', currency: 'INR' });
    expect(contactForPaymentAttempt(attempt)).toMatchObject({ id: 'c1', name: 'Ayesha Khan' });
    expect(attempt.payeeName).toBe('Ayesha Khan');
    expect(paymentDetailsText(attempt)).toContain('ayesha.k@okhdfcbank');
    const confirmed = confirmPaymentAttempt(attempt, { id: 'a1', name: 'Bank', type: 'Bank', currency: 'INR', balance: 1000, status: 'Active', change: 0 }, [], { now: '2026-10-25T10:00:00.000Z' });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) throw new Error('Expected historical reconciliation');
    expect(confirmed.transaction.counterparty).toBe('Ayesha Khan');
    expect(confirmed.transaction.recipient).toBe('ayesha.k@okhdfcbank');
  });
});

const definitions: CategoryDefinition[] = [
  { id: 'custom_pet', name: 'Pet care', type: 'expense', color: '#fff', icon: 'paw' },
  { id: 'custom_old', name: 'Old category', type: 'expense', color: '#fff', icon: 'box', archived: true },
  { id: 'Salary', name: 'Salary', type: 'income', color: '#fff', icon: 'bank' },
  { id: 'Bills', name: 'Household bills', type: 'expense', color: '#fff', icon: 'home', builtIn: true },
];

describe('payee expense category options', () => {
  it('offers active expense IDs with labels and preserves built-in fallbacks', () => {
    const items = payeeCategoryOptions(definitions);
    expect(items).toContainEqual({ value: 'custom_pet', label: 'Pet care' });
    expect(items).toContainEqual({ value: 'Bills', label: 'Household bills' });
    expect(items).toContainEqual({ value: 'Other', label: 'Other' });
    expect(items.some((item) => item.value === 'Salary' || item.value === 'custom_old')).toBe(false);
  });

  it('keeps unavailable current values visible but disabled, with legacy label fallbacks', () => {
    expect(payeeCategoryOptions(definitions, 'custom_old')).toContainEqual({ value: 'custom_old', label: 'Old category (unavailable)', disabled: true });
    expect(payeeCategoryOptions(definitions, 'Legacy')).toContainEqual({ value: 'Legacy', label: 'Legacy' });
    expect(payeeCategoryLabel('custom_pet', definitions)).toBe('Pet care');
    expect(payeeCategoryLabel('Legacy', definitions)).toBe('Legacy');
    expect(payeeCategoryOptions([{ ...definitions[3], archived: true }]).some((item) => item.value === 'Bills')).toBe(false);
  });
});
