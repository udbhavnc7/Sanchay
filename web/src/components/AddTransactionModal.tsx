import React, { useEffect, useMemo, useState } from 'react';
import type {
  Account,
  Category,
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
  Check,
  ShieldCheck,
  X,
} from 'lucide-react';
import { compareMoney, formatMoney, parseMoneyInput } from '../utils/money';
import {
  applyTransactionToBalance,
  replaceTransactionOnBalance,
} from '../utils/ledger';
import { buildRecentTemplates } from '../utils/transactionTemplates';

interface AddTransactionModalProps {
  accounts: Account[];
  transactions: Transaction[];
  transaction?: Transaction | null;
  onAdd: (input: NewTransactionInput) => MoneyResult;
  onUpdate?: (input: UpdateTransactionInput) => MoneyResult;
  onClose: () => void;
}

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

const INCOME_CATEGORIES: Category[] = ['Income', 'Payroll', 'Client Payment', 'Other'];

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

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  accounts,
  transactions,
  transaction,
  onAdd,
  onUpdate,
  onClose,
}) => {
  const isEditing = Boolean(transaction);
  const initialType: 'expense' | 'income' =
    transaction?.kind === 'income' || transaction?.type === 'credit' ? 'income' : 'expense';

  const inrAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.currency === 'INR' &&
          (account.status === 'Active' || account.id === transaction?.accountId)
      ),
    [accounts, transaction?.accountId]
  );

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amountInput, setAmountInput] = useState(
    transaction ? transaction.amount.toFixed(2) : ''
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? inrAccounts[0]?.id ?? ''
  );
  const [category, setCategory] = useState<Category>(
    transaction?.category ??
      (initialType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0])
  );
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [date, setDate] = useState(
    transaction ? dateValueFromIso(transaction.date) : todayDateValue()
  );
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState('');

  const categoryOptions = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categories =
    transaction?.category && !categoryOptions.includes(transaction.category)
      ? [transaction.category, ...categoryOptions]
      : categoryOptions;

  const account = inrAccounts.find((item) => item.id === accountId) ?? inrAccounts[0];
  const recentTemplates = useMemo(
    () => (isEditing ? [] : buildRecentTemplates(transactions, inrAccounts, type)),
    [inrAccounts, isEditing, transactions, type]
  );
  const parsedAmount = parseMoneyInput(amountInput);
  const amount = parsedAmount.ok ? parsedAmount.amount : 0;
  const nextEffect = {
    type: type === 'expense' ? ('debit' as const) : ('credit' as const),
    amount,
  };

  const balanceAfter =
    account && parsedAmount.ok
      ? transaction
        ? transaction.status === 'Completed'
          ? transaction.accountId === account.id
            ? replaceTransactionOnBalance(account.balance, transaction, nextEffect)
            : applyTransactionToBalance(account.balance, nextEffect)
          : account.balance
        : applyTransactionToBalance(account.balance, nextEffect)
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
    setCategory(next === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
    setError('');
  };

  const applyTemplate = (template: (typeof recentTemplates)[number]) => {
    sound.click();
    setAmountInput(template.amount.toFixed(2));
    setTitle(template.title);
    setCategory(template.category);
    setAccountId(template.accountId);
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) {
      setError(
        isEditing
          ? 'Choose an INR account before saving this transaction.'
          : 'Add an active INR account before recording a transaction.'
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
      compareMoney(balanceAfter, 0) < 0
    ) {
      setError(
        `Not enough in ${account.name}. This change would leave ${formatMoney(balanceAfter)}.`
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
    };

    if (isEditing && (!transaction || !onUpdate)) {
      setError('This transaction cannot be edited right now.');
      return;
    }

    const result =
      isEditing && transaction && onUpdate
        ? onUpdate({ ...payload, id: transaction.id })
        : onAdd(payload);

    if (!result.ok) {
      setError(
        result.error ?? (isEditing ? 'Could not save this transaction.' : 'Could not add this transaction.')
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
                  aria-label={`Use ${template.title} for ${formatMoney(template.amount)}`}
                >
                  <span className="recent-template-title">{template.title}</span>
                  <span className="recent-template-meta">
                    {formatMoney(template.amount)} · {template.category}
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
                    ₹
                  </span>
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => {
                      setAmountInput(event.target.value.replace(/[^0-9.,]/g, ''));
                      setError('');
                    }}
                    placeholder="0.00"
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
                  INR
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
                  disabled={inrAccounts.length === 0}
                >
                  {inrAccounts.length === 0 && <option value="">No active INR account</option>}
                  {inrAccounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as Category);
                    setError('');
                  }}
                  style={inputStyle}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                  {formatMoney(balanceAfter ?? account.balance)}
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
              style={{ flex: 1.4, padding: '11px 0', gap: '6px' }}
            >
              <Check size={15} />
              {isEditing ? 'Save changes' : `Add ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function typeButtonStyle(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 10px',
    borderRadius: '11px',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? color : 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 800,
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
  };
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '7px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '14px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  outline: 'none',
};
