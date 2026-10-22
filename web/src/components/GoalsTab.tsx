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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-main)' }}>
            Savings & Goals
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Set money aside for the things that matter — and watch it grow.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            setShowNewGoalModal(true);
          }}
          className="btn-action-dark"
        >
          <Plus size={15} />
          <span>New goal</span>
        </button>
      </div>

      {/* Top Split: Total Saved + Auto Save */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        {/* Total Saved & Monthly contributions */}
        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Total saved
                </span>
                <div className="font-mono-numbers" style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>
                  ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '9999px', marginTop: '4px' }}>
                  <TrendingUp size={12} /> +12% more than last quarter
                </div>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Monthly contributions
              </span>
            </div>

            {/* Contributions Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '120px', marginTop: '24px', padding: '0 8px' }}>
              {monthlyContributions.map((item) => {
                const heightPct = (item.amount / 9000) * 100;
                return (
                  <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <div style={{ width: '100%', maxWidth: '32px', height: '90px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          borderRadius: '6px 6px 0 0',
                          backgroundColor: item.isCurrent ? 'var(--accent-orange)' : 'var(--bg-pill)',
                          border: item.isCurrent ? 'none' : '1px solid var(--border-subtle)',
                          backgroundImage: item.isCurrent
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)'
                            : undefined,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: item.isCurrent ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall progress indicator bar */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-pill)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${overallPercentage}%`, height: '100%', background: 'var(--accent-orange)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{overallPercentage}%</span> of ${totalTarget.toLocaleString()} across {goals.length} goals
            </div>
          </div>
        </div>

        {/* Auto-save Rules */}
        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Auto-save</h2>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                2 on
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Round-ups */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <RefreshCw size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Round-ups</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Round every card payment up to next dollar.</div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    sound.click();
                    setRoundUps(!roundUps);
                  }}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: roundUps ? 'var(--accent-orange)' : '#cbd5e1',
                    padding: '2px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    transform: roundUps ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }} />
                </div>
              </div>

              {/* Payday boost */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <Zap size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Payday boost</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Move 10% of every salary into goals automatically.</div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    sound.click();
                    setPaydayBoost(!paydayBoost);
                  }}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: paydayBoost ? 'var(--accent-orange)' : '#cbd5e1',
                    padding: '2px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    transform: paydayBoost ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }} />
                </div>
              </div>

              {/* Weekly $50 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    <Calendar size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Weekly $50</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>A small transfer every Monday morning.</div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    sound.click();
                    setWeeklyTransfer(!weeklyTransfer);
                  }}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: weeklyTransfer ? 'var(--accent-orange)' : '#cbd5e1',
                    padding: '2px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    transform: weeklyTransfer ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,87,34,0.1)', color: 'var(--accent-orange)', fontSize: '11px', marginTop: '16px' }}>
            <Sparkles size={14} style={{ flexShrink: 0 }} />
            <span>Auto-save accelerates your goals by <strong>2.8x</strong> on average.</span>
          </div>
        </div>
      </div>

      {/* 5 Circular Progress Goals Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <div
              key={goal.id}
              className="s-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    {goal.icon}
                  </div>
                  <span className="font-mono-numbers" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {goal.targetDate}
                  </span>
                </div>

                {/* SVG Ring Gauge */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                  <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="transparent"
                        stroke="var(--bg-pill)"
                        strokeWidth="7"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="transparent"
                        stroke={goal.color}
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>

                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="font-mono-numbers" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>saved</span>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {goal.title}
                </h3>
                <div className="font-mono-numbers" style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>${goal.savedAmount.toLocaleString()}</span> of ${goal.targetAmount.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => {
                  sound.click();
                  setSelectedGoal(goal);
                }}
                className="btn-action-light"
                style={{ width: '100%', padding: '8px 0', fontSize: '11px', marginTop: '16px' }}
              >
                <Plus size={12} />
                <span>Add money</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Deposit Modal */}
      {selectedGoal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="s-card" style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Add to {selectedGoal.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Target: ${selectedGoal.targetAmount}
            </p>

            <div style={{ padding: '14px', borderRadius: '16px', background: 'var(--bg-pill)', marginBottom: '16px' }}>
              <div className="font-mono-numbers" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)' }}>
                ${depositAmount}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[50, 100, 250].map((a) => (
                <button
                  key={a}
                  onClick={() => setDepositAmount(a)}
                  className="font-mono-numbers"
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: depositAmount === a ? '#111317' : 'var(--bg-pill)',
                    color: depositAmount === a ? '#ffffff' : 'var(--text-main)',
                  }}
                >
                  +${a}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="btn-action-light"
                style={{ flex: 1, padding: '10px 0' }}
              >
                Cancel
              </button>
              <button onClick={handleDeposit} className="btn-action-dark" style={{ flex: 1, padding: '10px 0' }}>
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {showNewGoalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="s-card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Create New Goal
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Set a savings milestone with automated treasury allocations.
            </p>

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Series A Reserve"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Target Amount ($)</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '10px 0' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-dark" style={{ flex: 1, padding: '10px 0' }}>
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
