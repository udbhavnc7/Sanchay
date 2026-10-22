import React, { useState } from 'react';
import type { Account } from '../types/finance';
import { ThreeDCard } from './ThreeDCard';
import { sound } from '../utils/audio';
import {
  Globe,
  Radio,
  Landmark,
  CreditCard,
  Wallet,
  Banknote,
  PiggyBank,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { formatMoney, formatPercent } from '../utils/money';

interface CardsTabProps {
  accounts: Account[];
  isFrozen: boolean;
  onToggleFreeze: () => void;
  monthlyBudget: number;
  monthlySpent: number;
  onOpenPlan: () => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({
  accounts,
  isFrozen,
  onToggleFreeze,
  monthlyBudget,
  monthlySpent,
  onOpenPlan,
}) => {
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [atmWithdrawals, setAtmWithdrawals] = useState(true);
  const [useAbroad, setUseAbroad] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const cardsList = [
    { id: 'card1', last4: '6782', type: 'Everyday card', primary: true },
    { id: 'card2', last4: '4356', type: 'Travel card', primary: false },
  ];

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    sound.click();
    setter(!current);
  };

  const spentRatio = monthlyBudget > 0 ? Math.min(100, (monthlySpent / monthlyBudget) * 100) : 0;

  const renderAccountIcon = (account: Account) => {
    if (account.type === 'Bank') return <Landmark size={16} />;
    if (account.type === 'Cash') return <Banknote size={16} />;
    if (account.type === 'Card') return <CreditCard size={16} />;
    return <PiggyBank size={16} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            Accounts
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            See every account, freeze your card, and keep spending on track.
          </p>
        </div>

        <button onClick={onOpenPlan} className="btn-action-dark" style={{ padding: '10px 22px', fontSize: '13px' }}>
          <span>Review budgets</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '28px' }}>
        {/* Left Column: 3D Card Studio + Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="s-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Your card</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{cardsList.length} cards</span>
            </div>

            <ThreeDCard
              isFrozen={isFrozen}
              onToggleFreeze={onToggleFreeze}
              spendingLimit={monthlyBudget}
              monthlySpent={monthlySpent}
            />

            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cardsList.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      sound.click();
                      setActiveCardIndex(index);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: activeCardIndex === index ? 'var(--text-main)' : 'var(--bg-pill)',
                      color: activeCardIndex === index ? 'var(--bg-chassis)' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: index === 0 ? '#38bdf8' : 'var(--accent-orange)',
                      }}
                    />
                    <span>
                      {card.type} •••• {card.last4}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap card to rotate & examine</div>
            </div>
          </div>

          {/* Card Controls */}
          <div className="s-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                Card controls
              </h2>
              <span
                className={`badge-status ${
                  isFrozen ? 'badge-status-failed' : 'badge-status-completed'
                }`}
              >
                {isFrozen ? 'Frozen' : 'Active'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="control-card-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Online payments
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Shops, subscriptions and in-app purchases
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(setOnlinePayments, onlinePayments)}
                  className={`switch-track ${onlinePayments ? 'checked' : ''}`}
                  aria-label="Toggle online payments"
                >
                  <div className="switch-thumb" />
                </button>
              </div>

              <div className="control-card-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                    <Radio size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Contactless
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tap to pay up to ₹5,000 per payment
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(setContactless, contactless)}
                  className={`switch-track ${contactless ? 'checked' : ''}`}
                  aria-label="Toggle contactless payments"
                >
                  <div className="switch-thumb" />
                </button>
              </div>

              <div className="control-card-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                    <Landmark size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ATM withdrawals
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Up to ₹25,000 per day
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(setAtmWithdrawals, atmWithdrawals)}
                  className={`switch-track ${atmWithdrawals ? 'checked' : ''}`}
                  aria-label="Toggle ATM withdrawals"
                >
                  <div className="switch-thumb" />
                </button>
              </div>

              <div className="control-card-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Use abroad
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Payments outside your home currency zone
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(setUseAbroad, useAbroad)}
                  className={`switch-track ${useAbroad ? 'checked' : ''}`}
                  aria-label="Toggle use abroad"
                >
                  <div className="switch-thumb" />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Card controls are a preview here; no real card is connected.</span>
            </div>
          </div>
        </div>

        {/* Right Column: All Accounts + Spending Limit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* All Accounts */}
          <div className="s-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  All accounts
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Balances update as you spend and save.
                </p>
              </div>
              <Wallet size={18} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {accounts.map((account) => (
                <div key={account.id} className="account-card-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}>
                      {renderAccountIcon(account)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {account.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {account.type} · {account.currency} ·{' '}
                        <span style={{ color: account.status === 'Active' ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                          {account.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono-numbers" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatMoney(account.balance, account.currency, { decimals: false })}
                    </div>
                    <div
                      className="font-mono-numbers"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: Number(account.change) >= 0 ? '#10b981' : '#f43f5e',
                        marginTop: '2px',
                      }}
                    >
                      {formatPercent(Number(account.change))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Spending Limit */}
          <div className="s-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Monthly spending limit
              </span>
              <span className="font-mono-numbers" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-orange)' }}>
                {spentRatio.toFixed(0)}% used
              </span>
            </div>

            <div
              style={{
                marginTop: '12px',
                width: '100%',
                height: '12px',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-pill)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  width: `${spentRatio}%`,
                  background:
                    spentRatio > 80
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #ff7043, #ff5722)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }} className="font-mono-numbers">
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                {formatMoney(monthlySpent, 'INR', { decimals: false })} spent
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                of {formatMoney(monthlyBudget, 'INR', { decimals: false })}
              </span>
            </div>

            <button
              onClick={onOpenPlan}
              className="btn-action-light"
              style={{ marginTop: '18px', width: '100%', padding: '12px 16px', fontSize: '13px', justifyContent: 'center' }}
            >
              <span>Adjust category budgets</span>
              <ChevronRight size={15} />
            </button>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Only completed payments count toward your budget.</span>
            </div>
          </div>
        </div>
      </div>
  );
};
