import React, { useMemo, useState } from 'react';
import type { Account, Category, CategoryDefinition, PlannedPayment } from '../types/finance';
import { sound } from '../utils/audio';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pause,
  Pencil,
  Play,
  Plus,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate, formatMoney, parseMoneyInput, sumMoney } from '../utils/money';
import { categoryLabel, categoryOptions } from '../utils/categories';
import { expandOccurrences, localCalendarDate } from '../utils/recurrence';

interface PlannedPaymentsSectionProps {
  plannedPayments: PlannedPayment[];
  accounts: Account[];
  categories?: CategoryDefinition[];
  onAdd: (payment: PlannedPayment) => void;
  onDelete: (paymentId: string) => void;
  onUpdate?: (payment: PlannedPayment) => void;
}

type RecurrenceFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const HORIZON_YEARS = 10;

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

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function horizonEnd(start: Date): Date {
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + HORIZON_YEARS);
  return end;
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

interface NextOccurrence {
  date?: string;
  warning?: string;
}

function nextOccurrence(payment: PlannedPayment, start: Date, end: Date): NextOccurrence {
  if (payment.paused) return {};
  const expansion = expandOccurrences(payment, start, end);
  return { date: expansion.occurrences[0]?.date, warning: expansion.warning };
}

function frequencyLabel(payment: PlannedPayment): string {
  if (!payment.recurrence) return 'One time';
  const { freq, interval } = payment.recurrence;
  const unit = freq.charAt(0).toUpperCase() + freq.slice(1);
  return interval === 1 ? `Every ${unit.toLowerCase()}` : `Every ${interval} ${unit.toLowerCase()}`;
}

export const PlannedPaymentsSection: React.FC<PlannedPaymentsSectionProps> = ({
  plannedPayments,
  accounts,
  categories = [],
  onAdd,
  onDelete,
  onUpdate,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(tomorrowValue);
  const [direction, setDirection] = useState<PlannedPayment['direction']>('out');
  const [category, setCategory] = useState<Category>('Rent');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('once');
  const [interval, setInterval] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const start = startOfToday();
  const end = horizonEnd(start);

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
  const options = categoryOptions(categories, direction === 'out' ? 'expense' : 'income');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDueDate(tomorrowValue());
    setDirection('out');
    setCategory('Rent');
    setAccountId('');
    setFrequency('once');
    setInterval('1');
    setEndDate('');
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleDirection = (next: PlannedPayment['direction']) => {
    setDirection(next);
    const nextOptions = categoryOptions(categories, next === 'out' ? 'expense' : 'income');
    setCategory(nextOptions[0]?.id ?? (next === 'out' ? 'Rent' : 'Income'));
  };

  const openEdit = (payment: PlannedPayment) => {
    sound.click();
    setEditingId(payment.id);
    setTitle(payment.title);
    setAmount(String(payment.amount));
    setDueDate(localCalendarDate(payment.dueDate) ?? dateValue(new Date(payment.dueDate)));
    setDirection(payment.direction);
    setCategory(payment.category);
    setAccountId(payment.accountId ?? '');
    setFrequency(payment.recurrence?.freq ?? 'once');
    setInterval(String(payment.recurrence?.interval ?? 1));
    setEndDate(payment.recurrence?.endDate ?? '');
    setError('');
    setShowForm(true);
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
    if (frequency !== 'once') {
      const every = Number(interval);
      if (!Number.isSafeInteger(every) || every < 1) {
        setError('Repeat every whole number of days, weeks, months or years.');
        return;
      }
      if (endDate && endDate < dueDate) {
        setError('Choose an end date on or after the first due date.');
        return;
      }
    }

    const editing = editingId ? plannedPayments.find((item) => item.id === editingId) : undefined;
    const payment: PlannedPayment = {
      id: editing?.id ?? crypto.randomUUID(),
      title: trimmed,
      amount: parsed.amount,
      direction,
      dueDate: dueDateIso(dueDate),
      category,
      accountId: accountId || undefined,
      recurrence:
        frequency === 'once'
          ? undefined
          : { freq: frequency, interval: Number(interval), ...(endDate ? { endDate } : {}) },
      paused: editing?.paused,
      skippedDates: editing?.skippedDates,
    };

    if (editing && onUpdate) onUpdate(payment);
    else onAdd(payment);
    sound.success();
    closeForm();
  };

  const togglePaused = (payment: PlannedPayment) => {
    if (!onUpdate) return;
    sound.click();
    onUpdate({ ...payment, paused: !payment.paused });
  };

  const skipNext = (payment: PlannedPayment, date: string) => {
    if (!onUpdate) return;
    sound.click();
    const skipped = Array.from(new Set([...(payment.skippedDates ?? []), date]));
    onUpdate({ ...payment, skippedDates: skipped });
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
            resetForm();
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
            const next = nextOccurrence(payment, start, end);
            return (
              <div
                key={payment.id}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      {categoryLabel(payment.category, categories)}
                      {account ? ` \u00b7 ${account.name}` : ''} {'\u00b7'} {due.text}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {frequencyLabel(payment)}
                      {payment.paused
                        ? ' \u00b7 Paused'
                        : next.date
                          ? ` \u00b7 next on ${formatDate(`${next.date}T12:00:00`)}`
                          : ''}
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
                    {formatMoney(payment.amount, payment.currency ?? 'INR')}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '6px',
                  }}
                >
                  {onUpdate && (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit ${payment.title} series`}
                        title="Edit series"
                        className="planned-icon-button"
                        onClick={() => openEdit(payment)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label={
                          payment.paused ? `Resume ${payment.title}` : `Pause ${payment.title}`
                        }
                        title={payment.paused ? 'Resume series' : 'Pause series'}
                        className="planned-icon-button"
                        onClick={() => togglePaused(payment)}
                      >
                        {payment.paused ? <Play size={13} /> : <Pause size={13} />}
                      </button>
                      {!payment.paused && next.date && payment.recurrence && (
                        <button
                          type="button"
                          aria-label={`Skip ${payment.title} on ${next.date}`}
                          title="Skip this occurrence"
                          className="planned-icon-button"
                          onClick={() => skipNext(payment, next.date!)}
                        >
                          <SkipForward size={13} />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${payment.title}`}
                    title="Delete"
                    className="planned-icon-button"
                    onClick={() => onDelete(payment.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {next.warning && (
                  <p
                    role="status"
                    style={{ fontSize: '10px', color: '#b45309', marginTop: '6px', fontWeight: 700 }}
                  >
                    {next.warning}
                  </p>
                )}
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
                  {editingId ? 'Edit planned payment' : 'Add planned payment'}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  A dated estimate. Overdue and upcoming payments affect safe-to-spend; nothing
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
                    onChange={(event) => setCategory(event.target.value)}
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
                    {options.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
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
                  Repeats
                  <select
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}
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
                    <option value="once">One time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>
                  Every
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={interval}
                    disabled={frequency === 'once'}
                    onChange={(event) => setInterval(event.target.value)}
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
                      opacity: frequency === 'once' ? 0.5 : 1,
                    }}
                  />
                </label>
              </div>

              {frequency !== 'once' && (
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginTop: '12px' }}>
                  End date (optional)
                  <input
                    type="date"
                    value={endDate}
                    min={dueDate}
                    onChange={(event) => setEndDate(event.target.value)}
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
              )}

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
                  {editingId ? 'Save changes' : 'Add payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
