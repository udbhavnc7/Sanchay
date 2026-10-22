import React, { useState } from 'react';
import type { SavingsGoal } from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Plus,
  RefreshCw,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface GoalsTabProps {
  goals: SavingsGoal[];
  onAddMoneyToGoal: (goalId: string, amount: number) => void;
  onAddNewGoal: (newGoal: SavingsGoal) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  onAddMoneyToGoal,
  onAddNewGoal,
}) => {
  const [roundUps, setRoundUps] = useState(true);
  const [paydayBoost, setPaydayBoost] = useState(true);
  const [weeklyTransfer, setWeeklyTransfer] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  // New goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(2500);
  const [goalIcon, setGoalIcon] = useState('🎯');

  const monthlyContributions = [
    { month: 'Nov', amount: 3200 },
    { month: 'Dec', amount: 4800 },
    { month: 'Jan', amount: 5600 },
    { month: 'Feb', amount: 6200 },
    { month: 'Mar', amount: 7100 },
    { month: 'Apr', amount: 8900, isCurrent: true },
  ];

  const totalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPercentage = Math.round((totalSaved / totalTarget) * 100);

  const handleDeposit = () => {
    if (!selectedGoal || depositAmount <= 0) return;
    sound.success();
    confetti({
      particleCount: 70,
      spread: 50,
      origin: { y: 0.6 },
      colors: [selectedGoal.color, '#FF5722', '#10B981'],
    });
    onAddMoneyToGoal(selectedGoal.id, depositAmount);
    setSelectedGoal(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || goalTarget <= 0) return;
    sound.success();
    const newG: SavingsGoal = {
      id: 'g_' + Date.now(),
      title: goalTitle,
      icon: goalIcon,
      savedAmount: 0,
      targetAmount: goalTarget,
      targetDate: 'Dec 2026',
      color: '#FF5722',
    };
    onAddNewGoal(newG);
    setShowNewGoalModal(false);
    setGoalTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savings & Goals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set money aside for the things that matter — and watch it grow.
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

      {/* Top Split: Total Saved + Monthly Contributions & Auto-Save Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Saved & Chart (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total saved
                </span>
                <div className="mt-2 text-4xl md:text-5xl font-black font-mono-numbers text-slate-900 dark:text-white">
                  ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  <TrendingUp size={13} /> +12% more than last quarter
                </div>
              </div>

              {/* Monthly contributions indicator */}
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold">Monthly contributions</span>
              </div>
            </div>

            {/* Contributions Bar Chart */}
            <div className="mt-8 flex items-end justify-between gap-3 h-36 px-2">
              {monthlyContributions.map((item) => {
                const heightPct = (item.amount / 9000) * 100;
                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-full max-w-[36px] h-28 flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 ${
                          item.isCurrent
                            ? 'bg-[#FF5722] shadow-[0_0_15px_rgba(255,87,34,0.4)]'
                            : 'bg-slate-200 dark:bg-slate-700/80 group-hover:bg-slate-300'
                        }`}
                        style={{
                          height: `${heightPct}%`,
                          backgroundImage: item.isCurrent
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px)'
                            : undefined,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        item.isCurrent
                          ? 'text-orange-500 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Overall progress indicator bar */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10">
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono-numbers">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {overallPercentage}%
                </span>{' '}
                of ${totalTarget.toLocaleString()} across {goals.length} goals
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Save Rules Box (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Auto-save</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  2 on
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. Round-ups */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                      <RefreshCw size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Round-ups</div>
                      <div className="text-[11px] text-slate-400">
                        Round every card payment up to next dollar.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.click();
                      setRoundUps(!roundUps);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                      roundUps ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        roundUps ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Payday Boost */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Payday boost</div>
                      <div className="text-[11px] text-slate-400">
                        Move 10% of every salary into goals automatically.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.click();
                      setPaydayBoost(!paydayBoost);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                      paydayBoost ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        paydayBoost ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Weekly $50 */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Weekly $50</div>
                      <div className="text-[11px] text-slate-400">
                        A small transfer every Monday morning.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.click();
                      setWeeklyTransfer(!weeklyTransfer);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                      weeklyTransfer ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        weeklyTransfer ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
              <Sparkles size={16} className="text-orange-500 shrink-0" />
              <div className="text-xs text-orange-600 dark:text-orange-300">
                Auto-save accelerates your goals by <strong>2.8x</strong> on average.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Cards Grid with Circular Progress Indicators */}
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
                {/* Header with Icon and Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-sm">
                    {goal.icon}
                  </div>
                  <span className="text-[11px] font-mono-numbers font-medium text-slate-400">
                    {goal.targetDate}
                  </span>
                </div>

                {/* Circular Progress Gauge */}
                <div className="flex flex-col items-center my-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      {/* Animated Progress circle */}
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
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">saved</span>
                    </div>
                  </div>
                </div>

                {/* Goal Title */}
                <h3 className="font-bold text-sm text-center text-slate-900 dark:text-white truncate">
                  {goal.title}
                </h3>

                {/* Amounts */}
                <div className="mt-1 text-center text-xs font-mono-numbers text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ${goal.savedAmount.toLocaleString()}
                  </span>{' '}
                  of ${goal.targetAmount.toLocaleString()}
                </div>
              </div>

              {/* Add Money Button */}
              <button
                onClick={() => {
                  sound.click();
                  setSelectedGoal(goal);
                }}
                className="mt-5 w-full py-2 rounded-xl text-xs font-bold bg-slate-200/80 dark:bg-slate-700/80 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={13} />
                <span>Add money</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Deposit Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add to {selectedGoal.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Currently saved: ${selectedGoal.savedAmount} of ${selectedGoal.targetAmount}
            </p>

            <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 font-mono-numbers">
              <span className="text-3xl font-black text-slate-900 dark:text-white">$</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="text-3xl font-black text-slate-900 dark:text-white bg-transparent w-36 text-center focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold font-mono-numbers ${
                    depositAmount === amt
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  +${amt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedGoal(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button onClick={handleDeposit} className="flex-1 btn-primary py-2 text-xs">
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create Financial Goal
            </h3>
            <p className="text-xs text-slate-400 mb-4">Set target milestone and automated allocation.</p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Tech Summit"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Target Amount ($)</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono-numbers"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Emoji Icon</label>
                <div className="flex gap-2 mt-1">
                  {['🎯', '🚀', '🏡', '💎', '🏖️', '⚡'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setGoalIcon(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        goalIcon === emoji
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2 text-xs">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
