import React, { useMemo, useState } from 'react';
import type { Account, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Download,
  PiggyBank,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatMoney, monthKey, shortMonth, startOfMonth, startOfYear } from '../utils/money';

interface ReportsTabProps {
  transactions: Transaction[];
  accounts: Account[];
}

type RangeKey = 'month' | 'quarter' | 'year';

const RANGE_LABELS: Record<RangeKey, string> = {
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

const CHART_COLORS = ['#ff5722', '#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#64748b'];

function rangeStart(range: RangeKey): Date {
  if (range === 'year') return startOfYear();
  if (range === 'quarter') {
    const now = new Date();
    return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  }
  return startOfMonth();
}

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ transactions, accounts }) => {
  const [range, setRange] = useState<RangeKey>('month');

  const start = useMemo(() => rangeStart(range), [range]);
  const currentMonth = useMemo(() => startOfMonth(), []);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, `${account.name} (${account.currency})`])),
    [accounts]
  );

  const filtered = useMemo(
    () =>
      transactions
        .filter((tx) => new Date(tx.date) >= start && tx.status !== 'Failed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, start]
  );

  const totals = useMemo(() => {
    let income = 0;
    let spending = 0;
    let saved = 0;
    filtered.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (tx.kind === 'transfer') {
        if (tx.type === 'debit') saved += tx.amount;
        return;
      }
      if (tx.type === 'credit') income += tx.amount;
      else spending += tx.amount;
    });
    return { income, spending, saved, net: income - spending - saved };
  }, [filtered]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    filtered
      .filter(
        (tx) => tx.status === 'Completed' && tx.type === 'debit' && tx.kind !== 'transfer'
      )
      .forEach((tx) => {
        map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
      });
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
      .map((row, index) => ({ ...row, color: CHART_COLORS[index % CHART_COLORS.length] }));
  }, [filtered]);

  const payees = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    filtered
      .filter((tx) => tx.type === 'debit' && tx.kind !== 'transfer' && tx.status === 'Completed')
      .forEach((tx) => {
        const name = tx.counterparty ?? tx.title;
        const current = map.get(name) ?? { amount: 0, count: 0 };
        map.set(name, { amount: current.amount + tx.amount, count: current.count + 1 });
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered]);

  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - (5 - index),
        1
      );
      return { key: monthKey(date), label: shortMonth(date), income: 0, spending: 0 };
    });
    const byKey = new Map(months.map((month) => [month.key, month]));
    transactions
      .filter((tx) => tx.status === 'Completed')
      .forEach((tx) => {
        const bucket = byKey.get(monthKey(new Date(tx.date)));
        if (!bucket || tx.kind === 'transfer') return;
        if (tx.type === 'credit') bucket.income += tx.amount;
        else bucket.spending += tx.amount;
      });
    return months;
  }, [transactions, currentMonth]);

  const maxTrend = Math.max(1, ...trend.map((month) => Math.max(month.income, month.spending)));

  const handleExport = () => {
    sound.success();
    const header = [
      'Date',
      'Title',
      'Category',
      'Direction',
      'Status',
      'Amount',
      'Currency',
      'Account',
      'Reference',
      'Counterparty',
      'Note',
    ];
    const rows = filtered.map((tx) => {
      const account = tx.accountId ? accounts.find((item) => item.id === tx.accountId) : undefined;
      return [
        formatDate(tx.date),
        tx.title,
        tx.category,
        tx.type,
        tx.status,
        tx.amount.toFixed(2),
        account?.currency ?? 'INR',
        tx.accountId ? accountNames.get(tx.accountId) ?? '' : '',
        tx.reference ?? '',
        tx.counterparty ?? '',
        tx.note ?? '',
      ]
        .map(csvCell)
        .join(',');
    });
    const csv = [header.map(csvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanchay-${range}-statement.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--text-main)',
            }}
          >
            Reports
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Your own numbers, calculated from this device. Export a clean statement any time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '9999px',
              background: 'var(--bg-pill)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {(['month', 'quarter', 'year'] as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  sound.click();
                  setRange(key);
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: range === key ? '#111317' : 'transparent',
                  color: range === key ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="btn-action-dark"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          label="Money in"
          value={formatMoney(totals.income)}
          hint={`${filtered.filter((tx) => tx.type === 'credit').length} incoming entries`}
          icon={ArrowDownLeft}
          tone="#10b981"
        />
        <MetricCard
          label="Money out"
          value={formatMoney(totals.spending)}
          hint={`${filtered.filter((tx) => tx.type === 'debit' && tx.kind !== 'transfer').length} payments`}
          icon={ArrowUpRight}
          tone="#ef4444"
        />
        <MetricCard
          label="Moved to goals"
          value={formatMoney(totals.saved)}
          hint="Savings transfers, not spending"
          icon={PiggyBank}
          tone="#a855f7"
        />
        <MetricCard
          label="Net cash flow"
          value={formatMoney(totals.net)}
          hint={totals.net >= 0 ? 'You kept more than you spent' : 'Spending outpaced income'}
          icon={TrendingUp}
          tone={totals.net >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        <div className="s-card" style={{ gridColumn: 'span 2' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Spending by category
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {RANGE_LABELS[range]}
            </span>
          </div>

          {categories.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No completed spending in this range.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categories.map((row) => (
                <div
                  key={row.category}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.category}
                    </span>
                    <span
                      className="font-mono-numbers"
                      style={{ fontWeight: 800, color: 'var(--text-main)' }}
                    >
                      {formatMoney(row.amount)} · {row.pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '9999px',
                      background: 'var(--bg-card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${row.pct}%`,
                        height: '100%',
                        borderRadius: '9999px',
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="s-card">
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '16px',
            }}
          >
            Top payees
          </h2>

          {payees.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No outgoing payments in this range.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payees.map((payee, index) => (
                <div
                  key={payee.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingBottom: index === payees.length - 1 ? 0 : '12px',
                    borderBottom:
                      index === payees.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '10px',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {payee.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {payee.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {payee.count} payment{payee.count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div
                    className="font-mono-numbers"
                    style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}
                  >
                    {formatMoney(payee.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="s-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Income vs spending
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Savings transfers are excluded so the comparison stays honest.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '10px', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}
              />
              Income
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5722' }}
              />
              Spending
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            height: '180px',
          }}
        >
          {trend.map((month) => {
            const incomeHeight = (month.income / maxTrend) * 100;
            const spendingHeight = (month.spending / maxTrend) * 100;
            return (
              <div
                key={month.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '4px',
                    height: '130px',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '30%',
                      maxWidth: '22px',
                      height: `${Math.max(2, incomeHeight)}%`,
                      borderRadius: '6px 6px 0 0',
                      background: '#10b981',
                    }}
                    title={`Income ${formatMoney(month.income)}`}
                  />
                  <div
                    style={{
                      width: '30%',
                      maxWidth: '22px',
                      height: `${Math.max(2, spendingHeight)}%`,
                      borderRadius: '6px 6px 0 0',
                      background: '#ff5722',
                    }}
                    title={`Spending ${formatMoney(month.spending)}`}
                  />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {month.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="s-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            Statement preview
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {filtered.length} entries · CSV
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Nothing to export in this range yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  {['Date', 'Description', 'Category', 'Account', 'Status', 'Amount'].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: '8px 10px',
                          fontWeight: 700,
                          borderBottom: '1px solid var(--border-subtle)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((tx) => {
                  const account = tx.accountId
                    ? accounts.find((item) => item.id === tx.accountId)
                    : undefined;
                  return (
                    <tr key={tx.id}>
                      <td
                        style={{
                          padding: '9px 10px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(tx.date)}
                      </td>
                      <td style={{ padding: '9px 10px', fontWeight: 600 }}>{tx.title}</td>
                      <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>
                        {tx.category}
                      </td>
                      <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>
                        {account?.name ?? '—'}
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background:
                              tx.status === 'Completed'
                                ? 'rgba(16,185,129,0.12)'
                                : 'rgba(245,158,11,0.12)',
                            color: tx.status === 'Completed' ? '#10b981' : '#b45309',
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className="font-mono-numbers"
                        style={{
                          padding: '9px 10px',
                          fontWeight: 800,
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.type === 'credit' ? '+' : '−'}
                        {formatMoney(tx.amount, account?.currency ?? 'INR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          padding: '0 4px',
        }}
      >
        <ReceiptText size={13} />
        <span>Reports are generated locally from the transactions in this prototype.</span>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: typeof BarChart3;
  tone: string;
}> = ({ label, value, hint, icon: Icon, tone }) => (
  <div className="s-card">
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '10px',
          background: 'var(--bg-pill)',
          color: tone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} />
      </div>
    </div>
    <div
      className="font-mono-numbers"
      style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)' }}
    >
      {value}
    </div>
    <div style={{ fontSize: '11px', color: tone, marginTop: '4px', fontWeight: 600 }}>{hint}</div>
  </div>
);
