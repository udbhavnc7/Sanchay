import React, { useEffect, useMemo, useState } from 'react';
import type {
  Account,
  Budget,
  GoalDepositInput,
  GoalIcon,
  MoneyResult,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Plus,
  Laptop,
  Plane,
  Shield,
  Car,
  Gift,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowLeftRight,
} from 'lucide-react';
import { formatMoney, startOfMonth } from '../utils/money';

interface GoalsTabProps {
  goals: SavingsGoal[];
  accounts: Account[];
  budgets: Budget[];
  transactions: Transaction[];
  onDepositToGoal: (input: GoalDepositInput) => MoneyResult;
  onAddNewGoal: (newGoal: SavingsGoal) => void;
  onUpdateBudget: (budgetId: string, limit: number) => void;
}

const GOAL_ICONS: GoalIcon[] = ['laptop', 'plane', 'shield', 'car', 'gift'];
const GOAL_COLORS = ['#FF5722', '#38BDF8', '#10B981', '#8B5CF6', '#EC4899'];

function GoalGlyph({ icon, color }: { icon: GoalIcon; color: string }) {
  const Icon =
    icon === 'laptop'
      ? Laptop
      : icon === 'plane'
        ? Plane
        : icon === 'shield'
          ? Shield
          : icon === 'car'
            ? Car
            : Gift;
  return <Icon size={16} style={{ color }} />;
}

const BudgetRow: React.FC<{
  budget: Budget;
  spent: number;
  onUpdate: (budgetId: string, limit: number) => void;
}> = ({ budget, spent, onUpdate }) => {
  const [value, setValue] = useState(String(budget.limit));

  useEffect(() => {
    setValue(String(budget.limit));
  }, [budget.limit]);

  const limit = Number.parseFloat(value);
  const effectiveLimit = Number.isFinite(limit) && limit >= 0 ? limit : budget.limit;
  const ratio = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : spent > 0 ? 100 : 0;
  const over = ratio > 100;

  const commit = () => {
    if (Number.isFinite(limit) && limit >= 0) {
      onUpdate(budget.id, limit);
    } else {
      setValue(String(budget.limit));
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
      <div className="flex items-center justify-between gap-3 text-xs mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: budget.color }}
          />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {budget.category}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-mono-numbers font-bold ${
              over ? 'text-rose-500' : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatMoney(spent, 'INR', { decimals: false })}
          </span>
          <span className="text-slate-400">/</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => setValue(event.target.value.replace(/[^0-9]/g, ''))}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              className="w-16 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] font-mono-numbers font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(2, Math.min(100, ratio))}%`,
            backgroundColor: over ? '#ef4444' : budget.color,
          }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span className={over ? 'text-rose-500 font-semibold' : ''}>
          {over
            ? `${formatMoney(spent - effectiveLimit, 'INR', { decimals: false })} over`
            : `${formatMoney(Math.max(0, effectiveLimit - spent), 'INR', { decimals: false })} left`}
        </span>
        <span>{effectiveLimit > 0 ? `${Math.round(ratio)}%` : 'No limit'}</span>
      </div>
    </div>
  );
};

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  accounts,
  budgets,
  transactions,
  onDepositToGoal,
  onAddNewGoal,
  onUpdateBudget,
}) => {
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState('1000');
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositError, setDepositError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('50000');
  const [goalDate, setGoalDate] = useState(
    new Date(new Date().getFullYear() + 1, new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [goalIcon, setGoalIcon] = useState<GoalIcon>('shield');
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [goalError, setGoalError] = useState('');

  const monthStart = startOfMonth().getTime();

  const totals = useMemo(() => {
    let spent = 0;
    let savedThisMonth = 0;

    transactions.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (new Date(tx.date).getTime() < monthStart) return;
      if (tx.kind === 'expense') spent += tx.amount;
      if (tx.kind === 'transfer') savedThisMonth += tx.amount;
    });

    return { spent, savedThisMonth };
  }, [transactions, monthStart]);

  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (tx.kind !== 'expense') return;
      if (new Date(tx.date).getTime() < monthStart) return;
      map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
    });
    return map;
  }, [transactions, monthStart]);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const overallPercentage =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const budgetTotal = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  const eligibleAccounts = accounts.filter(
    (account) => account.status === 'Active' && account.currency === 'INR'
  );

  const depositGoal = goals.find((goal) => goal.id === depositGoalId);
  const depositAccount = eligibleAccounts.find((account) => account.id === depositAccountId);
  const depositAmount = Number.parseFloat(depositAmountInput);
  const depositRemaining = depositGoal
    ? Math.max(0, depositGoal.targetAmount - depositGoal.savedAmount)
    : 0;

  const openDeposit = (goal: SavingsGoal) => {
    sound.click();
    setDepositGoalId(goal.id);
    setDepositAmountInput('1000');
    setDepositAccountId(eligibleAccounts[0]?.id ?? '');
    setDepositError('');
  };

  const handleDeposit = () => {
    if (!depositGoal) return;

    const result = onDepositToGoal({
      goalId: depositGoal.id,
      amount: depositAmount,
      accountId: depositAccountId,
    });

    if (!result.ok) {
      setDepositError(result.error ?? 'Could not move the money.');
      return;
    }

    sound.success();
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.62 },
      colors: [depositGoal.color, '#FF5722', '#10B981'],
    });
    setFeedback(
      `Moved ${formatMoney(depositAmount, 'INR')} from ${
        depositAccount?.name ?? 'your account'
      } to ${depositGoal.title}. This is a transfer, not spending.`
    );
    setDepositGoalId(null);
    setDepositError('');
  };

  const handleCreateGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const title = goalTitle.trim();
    const target = Number.parseFloat(goalTarget);

    if (!title) {
      setGoalError('Give this goal a name.');
      return;
    }
    if (!Number.isFinite(target) || target < 100) {
      setGoalError('Set a target of at least ₹100.');
      return;
    }

    const targetDate = new Date(goalDate);
    const formattedDate = Number.isNaN(targetDate.getTime())
      ? 'Dec 2027'
      : targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const newGoal: SavingsGoal = {
      id: `g_${Date.now()}`,
      title,
      icon: goalIcon,
      savedAmount: 0,
      targetAmount: Math.round(target),
      targetDate: formattedDate,
      color: goalColor,
    };

    onAddNewGoal(newGoal);
    setShowNewGoalModal(false);
    setGoalTitle('');
    setGoalTarget('50000');
    setGoalIcon('shield');
    setGoalColor(GOAL_COLORS[0]);
    setGoalError('');
    sound.success();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Give every rupee a job — savings goals and monthly limits.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            setShowNewGoalModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>New goal</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{feedback}</span>
          <button
            onClick={() => setFeedback('')}
            className="text-emerald-600/70 hover:text-emerald-700 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total saved
                </span>
                <div className="mt-2 text-4xl md:text-5xl font-black font-mono-numbers text-slate-900 dark:text-white">
                  {formatMoney(totalSaved, 'INR', { decimals: false })}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  <TrendingUp size={13} />
                  {formatMoney(totals.savedThisMonth, 'INR', { decimals: false })} moved this month
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold">Across {goals.length} goals</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono-numbers">
                <span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {overallPercentage}%
                  </span>{' '}
                  of {formatMoney(totalTarget, 'INR', { decimals: false })}
                </span>
                <span>{formatMoney(totalTarget - totalSaved, 'INR', { decimals: false })} to go</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Spent this month
                </div>
                <div className="mt-1 text-lg font-black font-mono-numbers text-slate-900 dark:text-white">
                  {formatMoney(totals.spent, 'INR', { decimals: false })}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Budgeted
                </div>
                <div className="mt-1 text-lg font-black font-mono-numbers text-slate-900 dark:text-white">
                  {formatMoney(budgetTotal, 'INR', { decimals: false })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly budgets
                </h2>
                <p className="text-xs text-slate-400">Edit any limit — it saves immediately.</p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  totals.spent > budgetTotal
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {budgetTotal > 0 ? Math.round((totals.spent / budgetTotal) * 100) : 0}% used
              </span>
            </div>

            <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
              {budgets.map((budget) => (
                <BudgetRow
                  key={budget.id}
                  budget={budget}
                  spent={spendByCategory[budget.category] ?? 0}
                  onUpdate={onUpdateBudget}
                />
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-400">
              <Shield size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Only completed payments count toward a budget. Pending ones wait.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          const radius = 42;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <div
              key={goal.id}
              className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex flex-col justify-between group hover:border-orange-500/40 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center">
                    <GoalGlyph icon={goal.icon} color={goal.color} />
                  </div>
                  <span className="text-[11px] font-mono-numbers font-medium text-slate-400">
                    {goal.targetDate}
                  </span>
                </div>

                <div className="flex flex-col items-center my-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        fill="transparent"
                        stroke={goal.color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-extrabold font-mono-numbers text-slate-900 dark:text-white">
                        {pct}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {pct >= 100 ? 'funded' : 'saved'}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-center text-slate-900 dark:text-white truncate">
                  {goal.title}
                </h3>

                <div className="mt-1 text-center text-xs font-mono-numbers text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatMoney(goal.savedAmount, 'INR', { decimals: false })}
                  </span>{' '}
                  of {formatMoney(goal.targetAmount, 'INR', { decimals: false })}
                </div>
              </div>

              <button
                onClick={() => openDeposit(goal)}
                disabled={goal.savedAmount >= goal.targetAmount}
                className="mt-5 w-full py-2 rounded-xl text-xs font-bold bg-slate-200/80 dark:bg-slate-700/80 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-200/80 disabled:hover:text-slate-700"
              >
                {goal.savedAmount >= goal.targetAmount ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Fully funded</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Add money</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add to {depositGoal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {formatMoney(depositGoal.savedAmount, 'INR', { decimals: false })} of{' '}
                  {formatMoney(depositGoal.targetAmount, 'INR', { decimals: false })} ·{' '}
                  {formatMoney(depositRemaining, 'INR', { decimals: false })} to go
                </p>
              </div>
              <button
                onClick={() => setDepositGoalId(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono-numbers">
              <span className="text-3xl font-black text-slate-900 dark:text-white">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={depositAmountInput}
                onChange={(event) =>
                  setDepositAmountInput(event.target.value.replace(/[^0-9.]/g, ''))
                }
                className="text-3xl font-black text-slate-900 dark:text-white bg-transparent w-36 text-center focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {[500, 1000, 2500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    sound.click();
                    setDepositAmountInput(String(amount));
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold font-mono-numbers cursor-pointer ${
                    depositAmount === amount
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  +{formatMoney(amount, 'INR', { decimals: false })}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Move money from
              </label>
              <select
                value={depositAccountId}
                onChange={(event) => {
                  sound.click();
                  setDepositAccountId(event.target.value);
                }}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {eligibleAccounts.length === 0 && <option value="">No eligible account</option>}
                {eligibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {formatMoney(account.balance, account.currency)}
                  </option>
                ))}
              </select>
            </div>

            {depositAccount && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                <ArrowLeftRight size={13} className="shrink-0 mt-0.5 text-orange-500" />
                <span>
                  {formatMoney(depositAccount.balance, depositAccount.currency)} available. This
                  reduces {depositAccount.name} but is not counted as spending.
                </span>
              </div>
            )}

            {depositError && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{depositError}</span>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDepositGoalId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={!depositAccount || !Number.isFinite(depositAmount) || depositAmount <= 0}
                className="flex-1 btn-primary py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move {Number.isFinite(depositAmount) ? formatMoney(depositAmount, 'INR') : '—'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create a savings goal
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pick a target and a date. You can add money whenever you like.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Goal name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japan trip"
                  value={goalTitle}
                  onChange={(event) => setGoalTitle(event.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Target (₹)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={goalTarget}
                    onChange={(event) => setGoalTarget(event.target.value.replace(/[^0-9]/g, ''))}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Target date</label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(event) => setGoalDate(event.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Icon</label>
                <div className="flex gap-2 mt-1">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={() => setGoalIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        goalIcon === icon
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <GoalGlyph icon={icon} color={goalIcon === icon ? '#ff5722' : '#94a3b8'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Colour</label>
                <div className="flex gap-2 mt-1">
                  {GOAL_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setGoalColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        goalColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Use colour ${color}`}
                    />
                  ))}
                </div>
              </div>

              {goalError && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{goalError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewGoalModal(false);
                    setGoalError('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2 text-xs">
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
