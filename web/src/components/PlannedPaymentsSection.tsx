import React, { useMemo, useState } from 'react';
import type { Account, Category, PlannedPayment } from '../types/finance';
import { sound } from '../utils/audio';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate, formatMoney, parseMoneyInput, sumMoney } from '../utils/money';

interface PlannedPaymentsSectionProps {
  plannedPayments: PlannedPayment[];
  accounts: Account[];
  onAdd: (payment: PlannedPayment) => void;
  onDelete: (paymentId: string) => void;
}

const EXPENSE_CATEGORIES: Category[] = [
  'Rent',
  'Bills',
  'Groceries',
  'Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Travel',
  'Other',
];

const INCOME_CATEGORIES: Category[] = ['Income', 'Payroll', 'Client Payment', 'Other'];

function dateValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function todayValue(): string {
  return dateValue(new Date());
}

function tomorrowValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dateValue(date);
}

function dueDateIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

function dueLabel(payment: PlannedPayment): { text: string; tone: string } {
  const due = new Date(payment.dueDate);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const days = Math.round((startDue.getTime() - startToday.getTime()) / 86_400_000);

  if (days < 0) return { text: `Past due \u00b7 ${formatDate(payment.dueDate)}`, tone: '#ef4444' };
  if (days === 0) return { text: 'Due today', tone: '#b45309' };
  if (days <= 7) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: '#b45309' };
  return { text: formatDate(payment.dueDate), tone: 'var(--text-muted)' };
}

export const PlannedPaymentsSection: React.FC<PlannedPaymentsSectionProps> = ({
  plannedPayments,
  accounts,
  onAdd,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(tomorrowValue);
  const [direction, setDirection] = useState<PlannedPayment['direction']>('out');
  const [category, setCategory] = useState<Category>('Rent');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');

  const sorted = useMemo(
    () =>
      [...plannedPayments].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [plannedPayments]
  );

  const activeAccounts = accounts.filter(
    (account) => account.status === 'Active' && account.currency === 'INR'
  );
  const categories = direction === 'out' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(tomorrowValue());
    setDirection('out');
    setCategory('Rent');
    setAccountId('');
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleDirection = (next: PlannedPayment['direction']) => {
    setDirection(next);
    setCategory(next === 'out' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    const parsed = parseMoneyInput(amount);
    if (!trimmed) {
      setError('Give this payment a name.');
      return;
    }
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (!dueDate) {
      setError('Choose a due date.');
      return;
    }
    if (dueDate < todayValue()) {
      setError('Choose today or a future date.');
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      title: trimmed,
      amount: parsed.amount,
      direction,
      dueDate: dueDateIso(dueDate),
      category,
      accountId: accountId || undefined,
    });
    sound.success();
    closeForm();
  };

  const outflows = sumMoney(
    sorted.filter((payment) => payment.direction === 'out').map((payment) => payment.amount)
  );
  const inflows = sumMoney(
    sorted.filter((payment) => payment.direction === 'in').map((payment) => payment.amount)
  );

  return (
    <div className="s-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            Planned payments
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Estimates for money expected in or out. They never change your ledger.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-light"
          style={{ padding: '8px 13px', fontSize: '11px' }}
          onClick={() => {
            sound.click();
            setShowForm(true);
          }}
        >
          <Plus size={13} />
          Add payment
        </button>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            padding: '22px 16px',
            borderRadius: '16px',
            background: 'var(--bg-pill)',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <CalendarDays size={20} color="var(--text-muted)" />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Add rent, bills or expected income to make the safe-to-spend estimate more useful.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            <span>Out {formatMoney(outflows)}</span>
            <span>In {formatMoney(inflows)}</span>
          </div>
          {sorted.map((payment) => {
            const isIncome = payment.direction === 'in';
            const due = dueLabel(payment);
            const account = accounts.find((item) => item.id === payment.accountId);
            const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
            return (
              <div
                key={payment.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isIncome ? 'rgba(16,185,129,0.12)' : 'rgba(255,87,34,0.1)',
                    color: isIncome ? '#10b981' : 'var(--accent-orange)',
                  }}
                >
                  <Icon size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {payment.title}
                  </div>
                  <div style={{ fontSize: '10px', color: due.tone, marginTop: '2px' }}>
                    {payment.category}
                    {account ? ` \u00b7 ${account.name}` : ''} {'\u00b7'} {due.text}
                  </div>
                </div>
                <div
                  className="font-mono-numbers"
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isIncome ? '#10b981' : 'var(--text-main)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isIncome ? '+' : '-'}
                  {formatMoney(payment.amount)}
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${payment.title}`}
                  onClick={() => onDelete(payment.id)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          className="sanchay-modal-overlay"
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
          onClick={closeForm}
        >
          <div
            className="s-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planned-payment-title"
            style={{ maxWidth: '420px', width: '100%', maxHeight: '86vh', overflowY: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div>
                <h3
                  id="planned-payment-title"
                  style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}
                >
                  Add planned payment
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  A dated estimate. Overdue and next-30-day payments affect safe-to-spend; nothing
                  is recorded as spent.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close planned payment form"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-pill)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700 }}>
                Name
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Monthly rent"
                  autoFocus
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '5px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <label style={{ fontSize: '11px', fontWeight: 700 }}>
                  Amount
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="22000"
                    className="font-mono-numbers"
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </label>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>
                  Due date
                  <input
                    type="date"
                    value={dueDate}
                    min={todayValue()}
                    onChange={(event) => setDueDate(event.target.value)}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <label style={{ fontSize: '11px', fontWeight: 700 }}>
                  Direction
                  <select
                    value={direction}
                    onChange={(event) =>
                      handleDirection(event.target.value as PlannedPayment['direction'])
                    }
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    <option value="out">Money out</option>
                    <option value="in">Money in</option>
                  </select>
                </label>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as Category)}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '5px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginTop: '12px' }}>
                Account (optional)
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '5px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="">No specific account</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </option>
                  ))}
                </select>
              </label>

              {error && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', fontWeight: 700 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '9px 0' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-dark"
                  style={{ flex: 1.4, padding: '9px 0' }}
                >
                  Add payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
