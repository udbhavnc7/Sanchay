import React, { useMemo, useState } from 'react';
import type {
  Account,
  Budget,
  GoalDepositInput,
  MoneyResult,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Gift,
  Laptop,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  addMoney,
  compareMoney,
  formatMoney,
  monthKey,
  parseMoneyInput,
  shortMonth,
  startOfMonth,
  subtractMoney,
  sumMoney,
} from '../utils/money';

interface GoalsTabProps {
  goals: SavingsGoal[];
  budgets: Budget[];
  accounts: Account[];
  transactions: Transaction[];
  onDepositToGoal: (input: GoalDepositInput) => MoneyResult;
  onAddGoal: (goal: SavingsGoal) => void;
  onUpdateBudget: (budgetId: string, limit: number) => void;
}

const GOAL_ICONS: Record<string, typeof Target> = {
  laptop: Laptop,
  plane: Plane,
  shield: ShieldCheck,
  car: Car,
  gift: Gift,
  wallet: Wallet,
};

const GOAL_COLORS = ['#ff5722', '#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'];

const ICON_CHOICES = ['laptop', 'plane', 'shield', 'car', 'gift', 'wallet'];

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  budgets,
  accounts,
  transactions,
  onDepositToGoal,
  onAddGoal,
  onUpdateBudget,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositInput, setDepositInput] = useState('1000');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [depositResult, setDepositResult] = useState<MoneyResult | null>(null);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('50000');
  const [goalDate, setGoalDate] = useState('2027-06');
  const [goalIcon, setGoalIcon] = useState('shield');
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);

  const monthStart = useMemo(() => startOfMonth(), []);

  const monthSpendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter(
        (tx) =>
          tx.status === 'Completed' &&
          tx.type === 'debit' &&
          tx.kind !== 'transfer' &&
          new Date(tx.date) >= monthStart
      )
      .forEach((tx) => {
        map.set(tx.category, addMoney(map.get(tx.category) ?? 0, tx.amount));
      });
    return map;
  }, [transactions, monthStart]);

  const totalSaved = useMemo(
    () => sumMoney(goals.map((goal) => goal.savedAmount)),
    [goals]
  );
  const totalTarget = useMemo(
    () => sumMoney(goals.map((goal) => goal.targetAmount)),
    [goals]
  );
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const monthlySaved = useMemo(
    () =>
      sumMoney(
        transactions
          .filter(
            (tx) =>
              tx.kind === 'transfer' &&
              tx.category === 'Savings' &&
              tx.status === 'Completed' &&
              new Date(tx.date) >= monthStart
          )
          .map((tx) => tx.amount)
      ),
    [transactions, monthStart]
  );

  const savingsTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() - (5 - index),
        1
      );
      return { key: monthKey(date), label: shortMonth(date), amount: 0 };
    });
    const byKey = new Map(months.map((month) => [month.key, month]));
    transactions
      .filter((tx) => tx.kind === 'transfer' && tx.category === 'Savings' && tx.status === 'Completed')
      .forEach((tx) => {
        const bucket = byKey.get(monthKey(new Date(tx.date)));
        if (bucket) bucket.amount = addMoney(bucket.amount, tx.amount);
      });
    return months;
  }, [transactions, monthStart]);

  const maxTrend = Math.max(1, ...savingsTrend.map((month) => month.amount));

  const inrAccounts = accounts.filter(
    (account) => account.currency === 'INR' && account.status === 'Active'
  );

  const depositAccount =
    inrAccounts.find((account) => account.id === sourceAccountId) ?? inrAccounts[0];

  const parsedDeposit = parseMoneyInput(depositInput);
  const depositAmount = parsedDeposit.ok ? parsedDeposit.amount : 0;
  const depositError = (() => {
    if (!selectedGoal) return '';
    if (!parsedDeposit.ok) return parsedDeposit.error;
    if (!depositAccount) return 'Add an active INR account to move money from.';
    const remaining = subtractMoney(selectedGoal.targetAmount, selectedGoal.savedAmount);
    if (compareMoney(depositAmount, remaining) > 0) {
      return `Only ${formatMoney(remaining)} is left to fund this goal.`;
    }
    if (compareMoney(depositAccount.balance, depositAmount) < 0) {
      return `Not enough in ${depositAccount.name}. Available ${formatMoney(depositAccount.balance)}.`;
    }
    return '';
  })();

  const openDeposit = (goal: SavingsGoal) => {
    sound.click();
    setSelectedGoal(goal);
    setSourceAccountId('');
    setDepositResult(null);
    setDepositInput('1000');
  };

  const closeDeposit = () => {
    setSelectedGoal(null);
    setDepositResult(null);
    setDepositInput('1000');
  };

  const handleDeposit = () => {
    if (!selectedGoal || !depositAccount || depositError) return;

    const result = onDepositToGoal({
      goalId: selectedGoal.id,
      amount: depositAmount,
      accountId: depositAccount.id,
    });

    setDepositResult(result);
    if (result.ok) {
      sound.success();
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
        colors: [selectedGoal.color, '#FF5722', '#10B981'],
      });
    }
  };

  const handleCreateGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedTarget = parseMoneyInput(goalTarget);
    if (!goalTitle.trim() || !parsedTarget.ok) return;

    const [year, month] = goalDate.split('-').map(Number);
    const targetDate = Number.isFinite(year) && Number.isFinite(month)
      ? new Date(year, month - 1, 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : 'No date set';

    onAddGoal({
      id: `g_${Date.now()}`,
      title: goalTitle.trim(),
      icon: goalIcon,
      savedAmount: 0,
      targetAmount: parsedTarget.amount,
      targetDate,
      color: goalColor,
    });

    sound.success();
    setShowNewGoal(false);
    setGoalTitle('');
    setGoalTarget('50000');
    setGoalDate('2027-06');
    setGoalIcon('shield');
    setGoalColor(GOAL_COLORS[0]);
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
            Goals &amp; budgets
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Set money aside for what matters and decide where each month should go.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            setShowNewGoal(true);
          }}
          className="btn-action-dark"
        >
          <Plus size={15} />
          <span>New goal</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div className="orange-stat-card">
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.85,
            }}
          >
            Total saved
          </div>
          <div
            className="font-mono-numbers"
            style={{ fontSize: '34px', fontWeight: 900, marginTop: '6px' }}
          >
            {formatMoney(totalSaved)}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
            {overallPct}% of {formatMoney(totalTarget)} across {goals.length} goals
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.25)',
              overflow: 'hidden',
              marginTop: '14px',
            }}
          >
            <div
              style={{
                width: `${overallPct}%`,
                height: '100%',
                background: '#ffffff',
                borderRadius: '9999px',
              }}
            />
          </div>
        </div>

        <div className="s-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
            }}
          >
            <PiggyBank size={14} />
            Added this month
          </div>
          <div
            className="font-mono-numbers"
            style={{
              fontSize: '30px',
              fontWeight: 900,
              color: 'var(--text-main)',
              marginTop: '8px',
            }}
          >
            {formatMoney(monthlySaved)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Savings transfers never count as spending.
          </div>
        </div>

        <div className="s-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
            }}
          >
            <TrendingUp size={14} />
            Budgeted this month
          </div>
          <div
            className="font-mono-numbers"
            style={{
              fontSize: '30px',
              fontWeight: 900,
              color: 'var(--text-main)',
              marginTop: '8px',
            }}
          >
            {formatMoney(budgets.reduce((sum, budget) => sum + budget.limit, 0))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {budgets.length} categories
          </div>
        </div>
      </div>

      <div
        className="goals-split-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}
      >
        <div className="s-card goals-list-card" style={{ gridColumn: 'span 2' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Your goals
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {goals.filter((goal) => goal.savedAmount >= goal.targetAmount).length} complete
            </span>
          </div>

          <div
            className="goals-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            {goals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.savedAmount / goal.targetAmount) * 100)
              );
              const Icon = GOAL_ICONS[goal.icon] ?? Target;
              const radius = 34;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;

              return (
                <div
                  key={goal.id}
                  style={{
                    padding: '16px',
                    borderRadius: '20px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'var(--bg-card)',
                          color: goal.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <span
                        className="font-mono-numbers"
                        style={{ fontSize: '9px', color: 'var(--text-muted)' }}
                      >
                        {goal.targetDate}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '10px 0',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '88px',
                          height: '88px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="44"
                            cy="44"
                            r={radius}
                            fill="transparent"
                            stroke="var(--bg-card)"
                            strokeWidth="7"
                          />
                          <circle
                            cx="44"
                            cy="44"
                            r={radius}
                            fill="transparent"
                            stroke={goal.color}
                            strokeWidth="7"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                          />
                        </svg>
                        <span
                          className="font-mono-numbers"
                          style={{
                            position: 'absolute',
                            fontSize: '15px',
                            fontWeight: 900,
                            color: 'var(--text-main)',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>

                    <h3
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        textAlign: 'center',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {goal.title}
                    </h3>
                    <div
                      className="font-mono-numbers"
                      style={{
                        fontSize: '10px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                        {formatMoney(goal.savedAmount)}
                      </span>{' '}
                      of {formatMoney(goal.targetAmount)}
                    </div>
                  </div>

                  <button
                    onClick={() => openDeposit(goal)}
                    className="btn-action-light"
                    style={{ width: '100%', padding: '8px 0', fontSize: '11px', marginTop: '14px' }}
                  >
                    <Plus size={12} />
                    <span>Add money</span>
                  </button>
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
              Savings momentum
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '10px',
              height: '140px',
            }}
          >
            {savingsTrend.map((month, index) => {
              const height = month.amount > 0 ? Math.max(8, (month.amount / maxTrend) * 100) : 4;
              const isCurrent = index === savingsTrend.length - 1;
              return (
                <div
                  key={month.key}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    className="font-mono-numbers"
                    style={{ fontSize: '9px', color: 'var(--text-muted)' }}
                  >
                    {month.amount > 0 ? formatMoney(month.amount, 'INR', { decimals: false }) : '—'}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: '100px',
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        borderRadius: '7px 7px 0 0',
                        background: isCurrent ? 'var(--accent-orange)' : 'var(--bg-pill)',
                        border: isCurrent ? 'none' : '1px solid var(--border-subtle)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: isCurrent ? 'var(--accent-orange)' : 'var(--text-muted)',
                    }}
                  >
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'rgba(255,87,34,0.08)',
              color: 'var(--accent-orange)',
              fontSize: '11px',
              marginTop: '16px',
              lineHeight: 1.5,
            }}
          >
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>Moving money into a goal reduces your spendable balance, not your net worth.</span>
          </div>
        </div>
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
              Monthly budgets
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Edit any limit — progress updates from completed payments this month.
            </p>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'var(--bg-pill)',
              color: 'var(--text-muted)',
            }}
          >
            {budgets.length} categories
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {budgets.map((budget) => {
            const spent = monthSpendByCategory.get(budget.category) ?? 0;
            const pct = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
            const over = spent > budget.limit;
            return (
              <div
                key={budget.id}
                style={{
                  padding: '14px',
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
                    gap: '12px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {budget.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="font-mono-numbers"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: over ? '#ef4444' : 'var(--text-muted)',
                      }}
                    >
                      {formatMoney(spent)} spent
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>limit</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={budget.limit}
                      onChange={(event) => {
                        const next = parseMoneyInput(event.target.value);
                        onUpdateBudget(budget.id, next.ok ? next.amount : 0);
                      }}
                      className="font-mono-numbers"
                      style={{
                        width: '104px',
                        padding: '5px 8px',
                        borderRadius: '9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        outline: 'none',
                      }}
                    />
                  </div>
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
                      width: `${Math.min(100, pct)}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      background: over ? '#ef4444' : budget.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: over ? '#ef4444' : 'var(--text-muted)',
                    marginTop: '6px',
                    fontWeight: 600,
                  }}
                >
                  <span>{pct}% used</span>
                  <span>
                    {over
                      ? `${formatMoney(subtractMoney(spent, budget.limit))} over`
                      : `${formatMoney(subtractMoney(budget.limit, spent))} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedGoal && (
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
          onClick={closeDeposit}
        >
          <div
            className="s-card"
            style={{ maxWidth: '390px', width: '100%' }}
            onClick={(event) => event.stopPropagation()}
          >
            {depositResult?.ok ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Money moved
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {formatMoney(depositAmount)} is now part of {selectedGoal.title}. It was not
                  counted as spending.
                </p>
                <button
                  onClick={closeDeposit}
                  className="btn-action-dark"
                  style={{ width: '100%', marginTop: '18px', padding: '11px 0' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Add to {selectedGoal.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {formatMoney(
                    subtractMoney(selectedGoal.targetAmount, selectedGoal.savedAmount)
                  )}{' '}
                  left to reach {formatMoney(selectedGoal.targetAmount)}.
                </p>

                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginTop: '16px',
                  }}
                >
                  Move from
                </label>
                <select
                  value={depositAccount?.id ?? ''}
                  onChange={(event) => setSourceAccountId(event.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                >
                  {inrAccounts.length === 0 && <option value="">No active INR account</option>}
                  {inrAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} — {formatMoney(account.balance)}
                    </option>
                  ))}
                </select>

                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginTop: '12px',
                  }}
                >
                  Amount
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositInput}
                  onChange={(event) =>
                    setDepositInput(event.target.value.replace(/[^0-9.]/g, ''))
                  }
                  className="font-mono-numbers"
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 900,
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />

                {depositError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      marginTop: '10px',
                      fontSize: '10px',
                      color: '#b45309',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span>{depositError}</span>
                  </div>
                )}

                {depositResult && !depositResult.ok && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      marginTop: '10px',
                      fontSize: '10px',
                      color: '#b91c1c',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span>{depositResult.error}</span>
                  </div>
                )}

                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  This is a savings transfer, so it will not appear in your spending totals.
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <button
                    onClick={closeDeposit}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px 0' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={Boolean(depositError)}
                    className="btn-action-dark"
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      opacity: depositError ? 0.5 : 1,
                      cursor: depositError ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Move money
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showNewGoal && (
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
          onClick={() => setShowNewGoal(false)}
        >
          <div
            className="s-card"
            style={{ maxWidth: '440px', width: '100%' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              New savings goal
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '3px',
                marginBottom: '16px',
              }}
            >
              Give it a name, a target, and a date you are aiming for.
            </p>

            <form
              onSubmit={handleCreateGoal}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={goalLabelStyle}>Goal name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japan trip"
                  value={goalTitle}
                  onChange={(event) => setGoalTitle(event.target.value)}
                  style={goalInputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={goalLabelStyle}>Target amount</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={goalTarget}
                    onChange={(event) => setGoalTarget(event.target.value)}
                    style={goalInputStyle}
                    className="font-mono-numbers"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={goalLabelStyle}>Target date</label>
                  <input
                    type="month"
                    value={goalDate}
                    onChange={(event) => setGoalDate(event.target.value)}
                    style={goalInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={goalLabelStyle}>Icon</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {ICON_CHOICES.map((iconKey) => {
                    const Icon = GOAL_ICONS[iconKey] ?? Target;
                    const active = goalIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setGoalIcon(iconKey)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: active ? 'var(--accent-orange)' : 'var(--bg-pill)',
                          border: active
                            ? '1px solid var(--accent-orange)'
                            : '1px solid var(--border-subtle)',
                          color: active ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={goalLabelStyle}>Colour</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setGoalColor(color)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: color,
                        border: goalColor === color ? '2px solid #111317' : '2px solid transparent',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewGoal(false)}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '10px 0' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-dark" style={{ flex: 1, padding: '10px 0' }}>
                  Create goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const goalLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-muted)',
};

const goalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  background: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  outline: 'none',
  marginTop: '4px',
};
