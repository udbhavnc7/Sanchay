import React, { useMemo, useState } from 'react';
import type {
  Account,
  Budget,
  CategoryDefinition,
  GoalDepositInput,
  MoneyResult,
  PlannedPayment,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Archive,
  Car,
  CheckCircle2,
  Gift,
  Laptop,
  Pause,
  Pencil,
  PiggyBank,
  Plane,
  Play,
  Plus,
  RotateCcw,
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
import { buildGoalProjection, goalTargetMonthValue } from '../utils/goalProjection';
import {
  activeBudgets,
  archivedBudgets,
  budgetLimitForMonth,
  buildBudgetHistory,
  formatBudgetMonth,
} from '../utils/budgetHistory';
import {
  computeCategorySpending,
  DEFAULT_CURRENCY,
  reportsAccountMap,
  scopeToCurrency,
} from '../utils/reporting';
import { PlannedPaymentsSection } from './PlannedPaymentsSection';
import { categoryLabel } from '../utils/categories';

interface GoalsTabProps {
  goals: SavingsGoal[];
  budgets: Budget[];
  accounts: Account[];
  transactions: Transaction[];
  plannedPayments: PlannedPayment[];
  categoryDefinitions?: CategoryDefinition[];
  onDepositToGoal: (input: GoalDepositInput) => MoneyResult;
  onAddGoal: (goal: SavingsGoal) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onUpdateBudget: (budgetId: string, limit: number) => void;
  onArchiveBudget: (budgetId: string, archived: boolean) => void;
  onAddPlannedPayment: (payment: PlannedPayment) => void;
  onUpdatePlannedPayment: (payment: PlannedPayment) => void;
  onDeletePlannedPayment: (paymentId: string) => void;
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

function currentMonthValue(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthValue(value: string): string {
  const [year, month] = value.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 'No date set';
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  budgets,
  accounts,
  transactions,
  plannedPayments,
  categoryDefinitions = [],
  onDepositToGoal,
  onAddGoal,
  onUpdateGoal,
  onUpdateBudget,
  onArchiveBudget,
  onAddPlannedPayment,
  onUpdatePlannedPayment,
  onDeletePlannedPayment,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositInput, setDepositInput] = useState('1000');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [depositResult, setDepositResult] = useState<MoneyResult | null>(null);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('50000');
  const [goalDate, setGoalDate] = useState('2027-06');
  const [goalIcon, setGoalIcon] = useState('shield');
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [goalNote, setGoalNote] = useState('');
  const [goalError, setGoalError] = useState('');

  const monthStart = useMemo(() => startOfMonth(), []);
  const currentMonth = useMemo(() => monthKey(monthStart), [monthStart]);
  const accountsById = useMemo(() => reportsAccountMap(accounts), [accounts]);
  const liveBudgets = useMemo(() => activeBudgets(budgets), [budgets]);
  const pausedBudgets = useMemo(() => archivedBudgets(budgets), [budgets]);

  const monthSpendByCategory = useMemo(() => {
    const inrThisMonth = scopeToCurrency(transactions, accountsById, DEFAULT_CURRENCY).filter(
      (tx) => new Date(tx.date) >= monthStart
    );
    return computeCategorySpending(inrThisMonth, DEFAULT_CURRENCY);
  }, [transactions, accountsById, monthStart]);

  const budgetLimitByBudgetId = useMemo(() => {
    const limits = new Map<string, number>();
    budgets.forEach((budget) => {
      const forMonth = budgetLimitForMonth(budget, currentMonth);
      limits.set(budget.id, forMonth?.limit ?? budget.limit);
    });
    return limits;
  }, [budgets, currentMonth]);

  const budgetHistoryRows = useMemo(
    () => buildBudgetHistory(budgets, transactions, accounts, currentMonth, 6),
    [budgets, transactions, accounts, currentMonth]
  );
  const hasBudgetHistory = budgetHistoryRows.some(
    (row) => row.budgetedCategories > 0 || row.spent > 0
  );

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

  const editingGoal = goals.find((goal) => goal.id === editingGoalId) ?? null;
  const parsedGoalTarget = parseMoneyInput(goalTarget);
  const goalPreview = buildGoalProjection({
    savedAmount: editingGoal?.savedAmount ?? 0,
    targetAmount: parsedGoalTarget.ok ? parsedGoalTarget.amount : 0,
    targetDate: goalDate,
  });

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

  const resetGoalForm = () => {
    setShowNewGoal(false);
    setEditingGoalId(null);
    setGoalError('');
    setGoalTitle('');
    setGoalTarget('50000');
    setGoalDate('2027-06');
    setGoalIcon('shield');
    setGoalColor(GOAL_COLORS[0]);
    setGoalNote('');
  };

  const openNewGoal = () => {
    sound.click();
    resetGoalForm();
    setShowNewGoal(true);
  };

  const openEditGoal = (goal: SavingsGoal) => {
    sound.click();
    setEditingGoalId(goal.id);
    setGoalTitle(goal.title);
    setGoalTarget(String(goal.targetAmount));
    setGoalDate(goalTargetMonthValue(goal.targetDate) || currentMonthValue());
    setGoalIcon(goal.icon);
    setGoalColor(goal.color);
    setGoalNote(goal.note ?? '');
    setGoalError('');
    setShowNewGoal(true);
  };

  const handleSaveGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedTarget = parseMoneyInput(goalTarget);
    if (!goalTitle.trim()) {
      setGoalError('Give this goal a name.');
      return;
    }
    if (!parsedTarget.ok) {
      setGoalError(parsedTarget.error);
      return;
    }
    if (!goalDate) {
      setGoalError('Choose a target month.');
      return;
    }
    if (editingGoalId && !editingGoal) {
      setGoalError('This goal is no longer available.');
      return;
    }
    const preview = buildGoalProjection({
      savedAmount: editingGoal?.savedAmount ?? 0,
      targetAmount: parsedTarget.amount,
      targetDate: goalDate,
    });
    if (preview.status === 'past-due') {
      setGoalError('Choose this month or a later month.');
      return;
    }
    if (preview.status === 'no-date') {
      setGoalError('Choose a valid target month.');
      return;
    }

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        title: goalTitle.trim(),
        icon: goalIcon,
        targetAmount: parsedTarget.amount,
        targetDate: formatMonthValue(goalDate),
        color: goalColor,
        note: goalNote.trim() || undefined,
      });
    } else {
      onAddGoal({
        id: `g_${crypto.randomUUID()}`,
        title: goalTitle.trim(),
        icon: goalIcon,
        savedAmount: 0,
        targetAmount: parsedTarget.amount,
        targetDate: formatMonthValue(goalDate),
        color: goalColor,
        note: goalNote.trim() || undefined,
      });
    }

    sound.success();
    resetGoalForm();
  };

  const updateGoalStatus = (
    goal: SavingsGoal,
    status: NonNullable<SavingsGoal['status']>
  ) => {
    sound.click();
    onUpdateGoal({ ...goal, status });
  };

  const visibleGoals = goals.filter((goal) => goal.status !== 'archived');
  const archivedGoals = goals.filter((goal) => goal.status === 'archived');

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

        <button onClick={openNewGoal} className="btn-action-dark">
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
            {formatMoney(
              sumMoney(liveBudgets.map((budget) => budgetLimitByBudgetId.get(budget.id) ?? budget.limit))
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {liveBudgets.length} categories
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
              {goals.filter((goal) => goal.status !== 'archived' && goal.savedAmount >= goal.targetAmount).length} complete
            </span>
          </div>

          {visibleGoals.length === 0 ? (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '14px',
                borderRadius: '12px',
                background: 'var(--bg-pill)',
              }}
            >
              No goals yet. Create one to start setting money aside.
            </p>
          ) : (
          <div
            className="goals-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            {visibleGoals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.savedAmount / goal.targetAmount) * 100)
              );
              const Icon = GOAL_ICONS[goal.icon] ?? Target;
              const projection = buildGoalProjection(goal);
              const projectionLabel =
                projection.status === 'complete'
                  ? 'Fully funded'
                  : projection.status === 'completed'
                    ? 'Marked complete'
                    : projection.status === 'paused'
                      ? 'Paused — no monthly pace'
                      : projection.status === 'archived'
                        ? 'Archived'
                        : projection.status === 'planned' && projection.requiredMonthly !== null
                          ? `${formatMoney(projection.requiredMonthly)}/month to reach ${goal.targetDate}`
                          : projection.status === 'past-due'
                            ? 'Target month has passed'
                            : 'Set a target month for a monthly pace';
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
                    <div
                      style={{
                        fontSize: '9px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {projectionLabel}
                    </div>
                    {goal.note && (
                      <div
                        style={{
                          fontSize: '9px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          lineHeight: 1.4,
                          fontStyle: 'italic',
                        }}
                      >
                        {goal.note}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      onClick={() => openEditGoal(goal)}
                      className="btn-action-light"
                      aria-label={`Edit ${goal.title}`}
                      style={{ padding: '8px 10px', fontSize: '11px' }}
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openDeposit(goal)}
                      className="btn-action-light"
                      style={{ flex: 1, padding: '8px 0', fontSize: '11px' }}
                    >
                      <Plus size={12} />
                      <span>Add money</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {goal.status === 'paused' ? (
                      <button
                        type="button"
                        onClick={() => updateGoalStatus(goal, 'active')}
                        className="btn-action-light"
                        style={{ padding: '6px 9px', fontSize: '10px' }}
                      >
                        <Play size={11} />
                        Resume
                      </button>
                    ) : goal.status === 'completed' ? (
                      <button
                        type="button"
                        onClick={() => updateGoalStatus(goal, 'active')}
                        className="btn-action-light"
                        style={{ padding: '6px 9px', fontSize: '10px' }}
                      >
                        <RotateCcw size={11} />
                        Reopen
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(goal, 'paused')}
                          className="btn-action-light"
                          aria-label={`Pause ${goal.title}`}
                          style={{ padding: '6px 9px', fontSize: '10px' }}
                        >
                          <Pause size={11} />
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(goal, 'completed')}
                          className="btn-action-light"
                          aria-label={`Mark ${goal.title} complete`}
                          style={{ padding: '6px 9px', fontSize: '10px' }}
                        >
                          <CheckCircle2 size={11} />
                          Complete
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => updateGoalStatus(goal, 'archived')}
                      className="btn-action-light"
                      aria-label={`Archive ${goal.title}`}
                      style={{ padding: '6px 9px', fontSize: '10px', marginLeft: 'auto' }}
                    >
                      <Archive size={11} />
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
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

      {archivedGoals.length > 0 && (
        <div className="s-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Archived goals
            </h2>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              {archivedGoals.length} archived
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Archived goals keep their history and can be restored at any time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {archivedGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{goal.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono-numbers" style={{ color: 'var(--text-muted)' }}>
                    {formatMoney(goal.savedAmount)} of {formatMoney(goal.targetAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateGoalStatus(goal, 'active')}
                    className="btn-action-light"
                    aria-label={`Restore ${goal.title}`}
                    style={{ padding: '5px 9px', fontSize: '10px' }}
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              Limits apply from {formatBudgetMonth(currentMonth)}. Edits record a new period, so
              earlier months keep their limits.
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
            {liveBudgets.length} categories
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {liveBudgets.map((budget) => {
            const limit = budgetLimitByBudgetId.get(budget.id) ?? budget.limit;
            const label = categoryLabel(budget.category, categoryDefinitions);
            const rawSpent = monthSpendByCategory.get(budget.category) ?? 0;
            const spent = rawSpent > 0 ? rawSpent : 0;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const over = spent > limit;
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
                    {label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                      aria-label={`${label} monthly limit`}
                      value={limit}
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
                    <button
                      type="button"
                      onClick={() => onArchiveBudget(budget.id, true)}
                      aria-label={`Archive ${label} budget`}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Archive
                    </button>
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
                      ? `${formatMoney(subtractMoney(spent, limit))} over`
                      : `${formatMoney(subtractMoney(limit, spent))} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pausedBudgets.length > 0 && (
        <div
          style={{
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Archived budgets
            </h2>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
              {pausedBudgets.length} hidden from this month
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Archived limits stop counting toward this month but stay in the history below.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {pausedBudgets.map((budget) => {
              const limit = budgetLimitForMonth(budget, currentMonth)?.limit ?? budget.limit;
              const label = categoryLabel(budget.category, categoryDefinitions);
              return (
                <div
                  key={budget.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="font-mono-numbers">{formatMoney(limit)}</span>
                    <button
                      type="button"
                      onClick={() => onArchiveBudget(budget.id, false)}
                      aria-label={`Restore ${label} budget`}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '16px',
          borderRadius: '18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            Budget history
          </h2>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
            Last 6 months
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Only categories that had a limit that month are counted. Refunds reduce spending and
          transfers are excluded.
        </p>
        {!hasBudgetHistory ? (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--bg-pill)',
            }}
          >
            No budget history yet. Limits you set and spending you record will appear here as the
            months pass.
          </p>
        ) : (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '86px 1fr 1fr 1.2fr',
                gap: '6px',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              <span>Month</span>
              <span style={{ textAlign: 'right' }}>Budgeted</span>
              <span style={{ textAlign: 'right' }}>Spent</span>
              <span style={{ textAlign: 'right' }}>Result</span>
            </div>
            {budgetHistoryRows.map((row) => {
              const noBudget = row.budgetedCategories === 0;
              const diff = subtractMoney(row.spent, row.budgeted);
              return (
                <div
                  key={row.month}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '86px 1fr 1fr 1.2fr',
                    gap: '6px',
                    fontSize: '11px',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-subtle)',
                    color: noBudget ? 'var(--text-muted)' : 'var(--text-main)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {row.month === currentMonth ? 'This month' : formatBudgetMonth(row.month)}
                  </span>
                  <span className="font-mono-numbers" style={{ textAlign: 'right' }}>
                    {noBudget ? '—' : formatMoney(row.budgeted)}
                  </span>
                  <span className="font-mono-numbers" style={{ textAlign: 'right' }}>
                    {formatMoney(row.spent)}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: noBudget ? 'var(--text-muted)' : row.over ? '#ef4444' : '#10b981',
                    }}
                  >
                    {noBudget
                      ? 'No budget recorded'
                      : row.over
                        ? `${formatMoney(diff)} over`
                        : `${formatMoney(subtractMoney(row.budgeted, row.spent))} left`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PlannedPaymentsSection
        plannedPayments={plannedPayments}
        accounts={accounts}
        categories={categoryDefinitions}
        onAdd={onAddPlannedPayment}
        onUpdate={onUpdatePlannedPayment}
        onDelete={onDeletePlannedPayment}
      />

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
          onClick={resetGoalForm}
        >
          <div
            className="s-card"
            style={{ maxWidth: '440px', width: '100%' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              {editingGoal ? 'Edit savings goal' : 'New savings goal'}
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '3px',
                marginBottom: '16px',
              }}
            >
              {editingGoal
                ? 'Update the target or date and the monthly pace recalculates.'
                : 'Give it a name, a target, and a date you are aiming for.'}
            </p>

            <form
              onSubmit={handleSaveGoal}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={goalLabelStyle}>Goal name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japan trip"
                  value={goalTitle}
                  onChange={(event) => {
                    setGoalTitle(event.target.value);
                    setGoalError('');
                  }}
                  style={goalInputStyle}
                />
              </div>

              <div>
                <label style={goalLabelStyle}>Note (optional)</label>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="e.g. Book flights by March"
                  value={goalNote}
                  onChange={(event) => setGoalNote(event.target.value)}
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
                    onChange={(event) => {
                      setGoalTarget(event.target.value);
                      setGoalError('');
                    }}
                    style={goalInputStyle}
                    className="font-mono-numbers"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={goalLabelStyle}>Target date</label>
                  <input
                    type="month"
                    value={goalDate}
                    min={currentMonthValue()}
                    onChange={(event) => {
                      setGoalDate(event.target.value);
                      setGoalError('');
                    }}
                    style={goalInputStyle}
                  />
                </div>
              </div>

              {parsedGoalTarget.ok && goalDate && (
                <p
                  style={{
                    fontSize: '11px',
                    color:
                      goalPreview.status === 'past-due' ? '#ef4444' : 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {goalPreview.status === 'planned' && goalPreview.requiredMonthly !== null
                    ? `About ${formatMoney(goalPreview.requiredMonthly)}/month reaches ${formatMonthValue(goalDate)}.`
                    : goalPreview.status === 'complete'
                      ? 'This goal is already fully funded.'
                      : goalPreview.status === 'past-due'
                        ? 'Choose this month or a later month.'
                        : 'Choose a target month to estimate a monthly pace.'}
                </p>
              )}

              {goalError && (
                <p role="alert" style={{ fontSize: '11px', color: '#ef4444' }}>
                  {goalError}
                </p>
              )}

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
                  onClick={resetGoalForm}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '10px 0' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-dark" style={{ flex: 1, padding: '10px 0' }}>
                  {editingGoal ? 'Save changes' : 'Create goal'}
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
