import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Account,
  Category,
  CategoryDefinition,
  Currency,
  MoneyResult,
  NewTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../types/finance';
import { sound } from '../utils/audio';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CURRENCY_SYMBOL,
  compareMoney,
  formatMoney,
  minorDigits,
  parseMoneyInput,
} from '../utils/money';
import { balanceAfterTransactionEdit } from '../utils/ledger';
import { buildRecentTemplates } from '../utils/transactionTemplates';
import { suggestCategory } from '../utils/categorySuggestion';
import { categoryLabel, categoryOptions } from '../utils/categories';

interface AddTransactionModalProps {
  accounts: Account[];
  transactions: Transaction[];
  categoryDefinitions?: CategoryDefinition[];
  transaction?: Transaction | null;
  onAdd: (input: NewTransactionInput) => MoneyResult;
  onUpdate?: (input: UpdateTransactionInput) => MoneyResult;
  onClose: () => void;
}

function todayDateValue(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function dateValueFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return todayDateValue();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function amountText(amount: number, currency: Currency): string {
  return amount.toFixed(minorDigits(currency));
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  accounts,
  transactions,
  categoryDefinitions = [],
  transaction,
  onAdd,
  onUpdate,
  onClose,
}) => {
  const isEditing = Boolean(transaction);
  const initialType: 'expense' | 'income' =
    transaction?.kind === 'income' || transaction?.type === 'credit' ? 'income' : 'expense';

  const eligibleAccounts = useMemo(() => {
    const usable = accounts.filter(
      (account) => account.status === 'Active' || account.id === transaction?.accountId
    );
    if (!transaction) return usable;
    // A saved amount has no conversion rate, so edits stay in its own currency.
    const txCurrency =
      transaction.currency ??
      accounts.find((account) => account.id === transaction.accountId)?.currency ??
      'INR';
    return usable.filter((account) => account.currency === txCurrency);
  }, [accounts, transaction]);

  const initialCurrency =
    transaction?.currency ??
    accounts.find((account) => account.id === transaction?.accountId)?.currency ??
    eligibleAccounts[0]?.currency ??
    'INR';

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amountInput, setAmountInput] = useState(
    transaction ? amountText(transaction.amount, initialCurrency) : ''
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? eligibleAccounts[0]?.id ?? ''
  );
  const [category, setCategory] = useState<Category>(
    transaction?.category ??
      categoryOptions(categoryDefinitions, initialType)[0]?.id ??
      (initialType === 'expense' ? 'Other' : 'Income')
  );
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [date, setDate] = useState(
    transaction ? dateValueFromIso(transaction.date) : todayDateValue()
  );
  const [note, setNote] = useState(transaction?.note ?? '');
  const [tagsInput, setTagsInput] = useState((transaction?.tags ?? []).join(', '));
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  const account =
    eligibleAccounts.find((item) => item.id === accountId) ?? eligibleAccounts[0];
  const currency = account?.currency ?? initialCurrency;

  const baseCategoryOptions = useMemo(
    () => categoryOptions(categoryDefinitions, type),
    [categoryDefinitions, type]
  );

  const categories = useMemo(() => {
    if (
      transaction?.category &&
      !baseCategoryOptions.some((definition) => definition.id === transaction.category)
    ) {
      return [
        {
          id: transaction.category,
          name: categoryLabel(transaction.category, categoryDefinitions),
          type,
          color: '#64748b',
          icon: 'tag',
        } as CategoryDefinition,
        ...baseCategoryOptions,
      ];
    }
    return baseCategoryOptions;
  }, [baseCategoryOptions, categoryDefinitions, transaction, type]);

  const recentTemplates = useMemo(
    () => (isEditing ? [] : buildRecentTemplates(transactions, eligibleAccounts, type)),
    [eligibleAccounts, isEditing, transactions, type]
  );
  const categorySuggestion = useMemo(
    () =>
      isEditing
        ? null
        : suggestCategory(
            transactions,
            type,
            title,
            categories.map((definition) => definition.id)
          ),
    [categories, isEditing, title, transactions, type]
  );
  const parsedAmount = parseMoneyInput(amountInput, currency);
  const amount = parsedAmount.ok ? parsedAmount.amount : 0;
  const nextEffect = {
    type: type === 'expense' ? ('debit' as const) : ('credit' as const),
    amount,
  };

  const previousOnAccount =
    transaction?.status === 'Completed' && transaction.accountId === account?.id
      ? transaction
      : null;
  const balanceAfter =
    account && parsedAmount.ok
      ? transaction && transaction.status !== 'Completed'
        ? account.balance
        : balanceAfterTransactionEdit(
            account.balance,
            previousOnAccount,
            nextEffect,
            account.currency
          )
      : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const chooseType = (next: 'expense' | 'income') => {
    sound.click();
    setType(next);
    setCategory(
      categoryOptions(categoryDefinitions, next)[0]?.id ??
        (next === 'expense' ? 'Other' : 'Income')
    );
    setError('');
  };

  const applyTemplate = (template: (typeof recentTemplates)[number]) => {
    sound.click();
    const templateAccount = accounts.find((item) => item.id === template.accountId);
    setAmountInput(
      amountText(template.amount, templateAccount?.currency ?? currency)
    );
    setTitle(template.title);
    setCategory(template.category);
    setAccountId(template.accountId);
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }
    if (!account) {
      setError(
        isEditing
          ? 'Choose an account before saving this transaction.'
          : 'Add an active account before recording a transaction.'
      );
      return;
    }
    if (!parsedAmount.ok) {
      setError(parsedAmount.error);
      return;
    }
    if (
      type === 'expense' &&
      balanceAfter !== null &&
      compareMoney(balanceAfter, 0, account.currency) < 0
    ) {
      setError(
        `Not enough in ${account.name}. This change would leave ${formatMoney(
          balanceAfter,
          account.currency
        )}.`
      );
      return;
    }
    if (!date) {
      setError('Choose the date this happened.');
      return;
    }

    const payload = {
      type,
      title:
        title.trim() ||
        (type === 'income' ? `${category} received` : `${category} expense`),
      category,
      amount,
      accountId: account.id,
      date,
      note: note.trim() || undefined,
      tags: tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (isEditing && (!transaction || !onUpdate)) {
      setError('This transaction cannot be edited right now.');
      return;
    }

    submittingRef.current = true;
    const result =
      isEditing && transaction && onUpdate
        ? onUpdate({ ...payload, id: transaction.id })
        : onAdd(payload);

    if (!result.ok) {
      submittingRef.current = false;
      setError(
        result.error ??
          (isEditing ? 'Could not save this transaction.' : 'Could not add this transaction.')
      );
      return;
    }

    sound.success();
    onClose();
  };

  return (
    <div
      className="sanchay-modal-overlay"
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog-panel add-transaction-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        style={{ maxWidth: '460px', padding: '24px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h3
              id="add-transaction-title"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
              }}
            >
              {isEditing ? 'Edit transaction' : 'Add transaction'}
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                lineHeight: 1.5,
              }}
            >
              {isEditing
                ? 'Update the details and Sanchay will correct the affected balances.'
                : 'Record money that already moved. Your account balance updates with it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add transaction"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-pill)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            marginTop: '18px',
            borderRadius: '14px',
            background: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => chooseType('expense')}
            style={typeButtonStyle(type === 'expense', '#ff5722')}
          >
            <ArrowUpRight size={14} />
            Expense
          </button>
          <button
            type="button"
            onClick={() => chooseType('income')}
            style={typeButtonStyle(type === 'income', '#10b981')}
          >
            <ArrowDownLeft size={14} />
            Income
          </button>
        </div>

        {!isEditing && recentTemplates.length > 0 && (
          <div className="recent-templates">
            <span className="recent-templates-label">Use a recent</span>
            <div className="recent-templates-list">
              {recentTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="recent-template"
                  onClick={() => applyTemplate(template)}
                  aria-label={`Use ${template.title} for ${formatMoney(
                    template.amount,
                    accounts.find((item) => item.id === template.accountId)?.currency ?? currency
                  )}`}
                >
                  <span className="recent-template-title">{template.title}</span>
                  <span className="recent-template-meta">
                    {formatMoney(
                      template.amount,
                      accounts.find((item) => item.id === template.accountId)?.currency ?? currency
                    )}{' '}
                    · {categoryLabel(template.category, categoryDefinitions)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '18px' }}>
            <div>
              <label style={labelStyle}>Amount</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {CURRENCY_SYMBOL[currency]}
                  </span>
                  <input
                    autoFocus
                    type="text"
                    inputMode={minorDigits(currency) === 0 ? 'numeric' : 'decimal'}
                    value={amountInput}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/[^0-9.,]/g, '');
                      setAmountInput(
                        minorDigits(currency) === 0 ? raw.replace(/[.,]/g, '') : raw
                      );
                      setError('');
                    }}
                    placeholder={minorDigits(currency) === 0 ? '0' : '0.00'}
                    className="font-mono-numbers"
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      minWidth: 0,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {currency}
                </span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={title}
                maxLength={60}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={type === 'income' ? 'e.g. Salary' : 'e.g. Grocery run'}
                style={inputStyle}
              />
            </div>

            <div className="add-transaction-row">
              <div>
                <label style={labelStyle}>Account</label>
                <select
                  value={account?.id ?? ''}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setError('');
                  }}
                  style={inputStyle}
                  disabled={eligibleAccounts.length === 0}
                >
                  {eligibleAccounts.length === 0 && (
                    <option value="">No active account</option>
                  )}
                  {eligibleAccounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setError('');
                  }}
                  style={inputStyle}
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {categorySuggestion && categorySuggestion.category !== category && (
              <div
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.24)',
                  color: 'var(--text-main)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Sparkles size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800 }}>
                      Suggested: {categoryLabel(categorySuggestion.category, categoryDefinitions)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Based on {categorySuggestion.matchCount} earlier{' '}
                      {categorySuggestion.matchCount === 1 ? 'entry' : 'entries'} like{' '}
                      {categorySuggestion.matchedText}.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    setCategory(categorySuggestion.category);
                    setError('');
                  }}
                  className="btn-action-light"
                  style={{ padding: '6px 10px', fontSize: '10px', flexShrink: 0 }}
                >
                  Use
                </button>
              </div>
            )}

            <div className="add-transaction-row">
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={date}
                  max={todayDateValue()}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setError('');
                  }}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  maxLength={80}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What was it for?"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Tags (optional)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="e.g. work, reimbursable"
                  style={inputStyle}
                />
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Separate tags with commas.
                </span>
              </div>
            </div>

            {account && parsedAmount.ok && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                <span>{account.name} balance after</span>
                <span
                  className="font-mono-numbers"
                  style={{ color: 'var(--text-main)', fontWeight: 800 }}
                >
                  {formatMoney(balanceAfter ?? account.balance, account.currency)}
                </span>
              </div>
            )}

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '11px',
                  color: '#ef4444',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '7px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                This is recorded only on this device. It does not contact a bank or move real
                money.
              </span>
            </div>
          </div>

          <div className="add-transaction-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-action-light"
              style={{ flex: 1, padding: '11px 0' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-action-dark"
              style={{ flex: 1, padding: '11px 0' }}
            >
              {isEditing ? 'Save changes' : 'Add transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  marginBottom: '4px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '12px',
  backgroundColor: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-main)',
  outline: 'none',
};

function typeButtonStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 0',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    background: active ? accent : 'transparent',
    color: active ? '#ffffff' : 'var(--text-muted)',
  };
}
