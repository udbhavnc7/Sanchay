import React, { useMemo } from 'react';
import type { Account, Budget, SavingsGoal, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  PiggyBank,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatMoney, relativeDay, startOfMonth } from '../utils/money';

interface OverviewTabProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  monthlySpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  availableBalance: number;
  goalBalance: number;
  freeToSpend: number;
  netWorth: number;
  onOpenPayees: () => void;
  onOpenPlan: () => void;
  onOpenActivity: () => void;
  onRequestMoney: () => void;
  onAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

const CATEGORY_COLORS = [
  '#ff5722',
  '#38bdf8',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#64748b',
];

const ACCOUNT_ICONS: Record<Account['type'], typeof Wallet> = {
  Bank: Wallet,
  Cash: ReceiptText,
  Savings: PiggyBank,
  Card: Wallet,
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  accounts,
  transactions,
  budgets,
  goals,
  monthlySpent,
  monthlyBudget,
  remainingBudget,
  availableBalance,
  goalBalance,
  freeToSpend,
  netWorth,
  onOpenPayees,
  onOpenPlan,
  onOpenActivity,
  onRequestMoney,
  onAddTransaction,
  onSelectTransaction,
}) => {
  const monthStart = useMemo(() => startOfMonth(), []);

  const monthTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => new Date(tx.date) >= monthStart && tx.status === 'Completed'
      ),
    [transactions, monthStart]
  );

  const monthlyIncome = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === 'credit' && tx.kind !== 'transfer')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  );

  const monthlySaved = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.kind === 'transfer' && tx.category === 'Savings')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  );

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    monthTransactions
      .filter((tx) => tx.type === 'debit' && tx.kind !== 'transfer')
      .forEach((tx) => {
        totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
      });
    const rows = Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return rows.map((row, index) => ({
      ...row,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [monthTransactions]);

  const budgetHealth = useMemo(() => {
    const spend = new Map<string, number>();
    monthTransactions
      .filter((tx) => tx.type === 'debit' && tx.kind !== 'transfer')
      .forEach((tx) => {
        spend.set(tx.category, (spend.get(tx.category) ?? 0) + tx.amount);
      });
    return budgets
      .map((budget) => {
        const spent = spend.get(budget.category) ?? 0;
        return {
          ...budget,
          spent,
          pct: budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [budgets, monthTransactions]);

  const budgetUsedPct = monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0;
  const savingsRate =
    monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlySpent) / monthlyIncome) * 100) : 0;

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [transactions]
  );

  const topGoals = useMemo(
    () =>
      [...goals]
        .map((goal) => ({
          ...goal,
          pct: Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 3),
    [goals]
  );

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
            {greeting()}, Udbhav
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Here is where your money stands today — no jargon, no surprises.
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={13} />
          Private &amp; stored on this device
        </div>
      </div>

      <div
        className="overview-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
        }}
      >
        <div
          className="orange-stat-card overview-balance-card"
          style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.85,
              }}
            >
              Available balance
            </div>
            <div
              className="font-mono-numbers"
              style={{ fontSize: '36px', fontWeight: 900, marginTop: '6px', lineHeight: 1.1 }}
            >
              {formatMoney(availableBalance)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
              across {accounts.filter((account) => account.status === 'Active').length} active accounts
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.24)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span style={{ opacity: 0.85 }}>Free after budgets</span>
              <span className="font-mono-numbers" style={{ fontSize: '15px', fontWeight: 900 }}>
                {formatMoney(freeToSpend)}
              </span>
            </div>
            <details className="calc-note calc-note-inverse">
              <summary>How these are calculated</summary>
              <p>
                Available balance sums active INR accounts only. Free after budgets subtracts{' '}
                {formatMoney(remainingBudget)} still budgeted this month. Future bills and goal
                money are not deducted.
              </p>
            </details>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => {
                sound.click();
                onOpenPayees();
              }}
              className="btn-action-light"
              style={{
                flex: '1 1 74px',
                padding: '10px 10px',
                background: '#ffffff',
                color: '#111317',
                fontSize: '12px',
              }}
            >
              <Send size={14} />
              Send
            </button>
            <button
              onClick={() => {
                sound.click();
                onAddTransaction();
              }}
              className="btn-action-dark"
              style={{
                flex: '1 1 74px',
                padding: '10px 10px',
                fontSize: '12px',
              }}
            >
              <Plus size={14} />
              Add
            </button>
            <button
              onClick={() => {
                sound.click();
                onRequestMoney();
              }}
              style={{
                flex: '1 1 74px',
                padding: '10px 10px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.16)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <ArrowDownLeft size={14} />
              Request
            </button>
          </div>
        </div>

        <StatCard
          label="Spent this month"
          value={formatMoney(monthlySpent)}
          hint={`${budgetUsedPct}% of ${formatMoney(monthlyBudget)} budget`}
          icon={ArrowUpRight}
          tone={monthlySpent > monthlyBudget ? 'warn' : 'neutral'}
          explanation="Completed expenses dated this month, excluding savings transfers. Pending payments are not counted."
        />
        <StatCard
          label="Income this month"
          value={formatMoney(monthlyIncome)}
          hint={`${savingsRate >= 0 ? '+' : ''}${savingsRate}% savings rate`}
          icon={TrendingUp}
          tone="good"
          explanation="Completed income dated this month, excluding transfers. Transfers between your own accounts are not income."
        />
        <StatCard
          label="Set aside for goals"
          value={formatMoney(goalBalance)}
          hint={`${formatMoney(monthlySaved)} added this month`}
          icon={Target}
          explanation="Savings held in goals. The monthly figure counts completed transfers to Savings this month."
        />
      </div>

      <div className="s-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Your accounts
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Net worth {formatMoney(netWorth)} including goals.
            </p>
          </div>
          <button
            onClick={() => {
              sound.click();
              onOpenPlan();
            }}
            className="btn-action-light"
            style={{ padding: '8px 14px', fontSize: '11px' }}
          >
            <Plus size={13} />
            Plan
          </button>
        </div>

        <div
          className="overview-accounts-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '12px',
          }}
        >
          {accounts.map((account) => {
            const Icon = ACCOUNT_ICONS[account.type];
            return (
              <div
                key={account.id}
                className="overview-account-card"
                style={{
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '11px',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-main)',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      background: account.status === 'Active' ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
                      color: account.status === 'Active' ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {account.status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{account.name}</div>
                <div
                  className="font-mono-numbers"
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    marginTop: '2px',
                  }}
                >
                  {formatMoney(account.balance, account.currency)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {account.type} · {account.currency}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        <div className="s-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Where the money went
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This month</span>
          </div>

          {categoryBreakdown.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No spending recorded this month yet.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryBreakdown.map((row) => {
              const pct = monthlySpent > 0 ? Math.round((row.amount / monthlySpent) * 100) : 0;
              return (
                <div key={row.category}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.category}</span>
                    <span className="font-mono-numbers" style={{ color: 'var(--text-muted)' }}>
                      {formatMoney(row.amount)} · {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '9999px',
                      background: 'var(--bg-pill)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: row.color,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
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
              marginBottom: '18px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Budget health
            </h2>
            <button
              onClick={() => {
                sound.click();
                onOpenPlan();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-orange)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Adjust <ChevronRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {budgetHealth.map((budget) => {
              const over = budget.spent > budget.limit;
              return (
                <div key={budget.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {budget.category}
                    </span>
                    <span
                      className="font-mono-numbers"
                      style={{ color: over ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}
                    >
                      {formatMoney(budget.spent)} / {formatMoney(budget.limit)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '9999px',
                      background: 'var(--bg-pill)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, budget.pct)}%`,
                        height: '100%',
                        background: over ? '#ef4444' : budget.color,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        <div className="s-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Recent activity
            </h2>
            <button
              onClick={() => {
                sound.click();
                onOpenActivity();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-orange)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTransactions.map((tx, index) => {
              const isCredit = tx.type === 'credit';
              const isTransfer = tx.kind === 'transfer';
              return (
                <button
                  key={tx.id}
                  onClick={() => {
                    sound.click();
                    onSelectTransaction(tx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 0',
                    border: 'none',
                    borderBottom:
                      index === recentTransactions.length - 1
                        ? 'none'
                        : '1px solid var(--border-subtle)',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isTransfer
                        ? 'rgba(168, 85, 247, 0.12)'
                        : isCredit
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(255, 87, 34, 0.12)',
                      color: isTransfer ? '#a855f7' : isCredit ? '#10b981' : 'var(--accent-orange)',
                    }}
                  >
                    {isTransfer ? (
                      <Target size={15} />
                    ) : isCredit ? (
                      <ArrowDownLeft size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
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
                      {tx.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {tx.category} · {relativeDay(tx.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="font-mono-numbers"
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isCredit ? '#10b981' : 'var(--text-main)',
                      }}
                    >
                      {isCredit ? '+' : '−'}
                      {formatMoney(tx.amount)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{tx.status}</div>
                  </div>
                </button>
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
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Goals closest to done
            </h2>
            <button
              onClick={() => {
                sound.click();
                onOpenPlan();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-orange)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              All goals <ChevronRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topGoals.map((goal) => (
              <div
                key={goal.id}
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
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {goal.title}
                  </span>
                  <span className="font-mono-numbers" style={{ fontSize: '11px', fontWeight: 800 }}>
                    {goal.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: '7px',
                    borderRadius: '9999px',
                    background: 'var(--bg-card)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${goal.pct}%`,
                      height: '100%',
                      background: goal.color,
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {formatMoney(goal.savedAmount)} of {formatMoney(goal.targetAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  tone?: 'neutral' | 'good' | 'warn';
  explanation?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  explanation,
}) => {
  const toneColor = tone === 'good' ? '#10b981' : tone === 'warn' ? '#ef4444' : 'var(--text-muted)';
  return (
    <div
      className="s-card stat-card"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-pill)',
            color: toneColor,
          }}
        >
          <Icon size={15} />
        </div>
      </div>
      <div>
        <div
          className="font-mono-numbers"
          style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)' }}
        >
          {value}
        </div>
        <div style={{ fontSize: '11px', color: toneColor, marginTop: '4px', fontWeight: 600 }}>
          {hint}
        </div>
        {explanation && (
          <details className="calc-note">
            <summary>How calculated</summary>
            <p>{explanation}</p>
          </details>
        )}
      </div>
    </div>
  );
};
