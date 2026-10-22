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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            See every account, freeze your card, and keep spending on track.
          </p>
        </div>

        <button onClick={onOpenPlan} className="btn-primary">
          <span>Review budgets</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your card</h2>
              <span className="text-xs text-slate-400 font-semibold">{cardsList.length} cards</span>
            </div>

            <ThreeDCard
              isFrozen={isFrozen}
              onToggleFreeze={onToggleFreeze}
              spendingLimit={monthlyBudget}
              monthlySpent={monthlySpent}
            />

            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {cardsList.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      sound.click();
                      setActiveCardIndex(index);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono-numbers transition-all cursor-pointer ${
                      activeCardIndex === index
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-sm ${
                        index === 0 ? 'bg-slate-800 border border-slate-600' : 'bg-orange-500'
                      }`}
                    />
                    <span>
                      {card.type} •••• {card.last4}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400">Tap card to rotate & examine</div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Card controls
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isFrozen
                    ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}
              >
                {isFrozen ? 'Frozen' : 'Active'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Online payments
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Shops, subscriptions and in-app purchases
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setOnlinePayments, onlinePayments)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    onlinePayments ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle online payments"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      onlinePayments ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Radio size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Contactless
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tap to pay up to ₹5,000 per payment
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setContactless, contactless)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    contactless ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle contactless payments"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      contactless ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      ATM withdrawals
                    </div>
                    <div className="text-[11px] text-slate-400">Up to ₹25,000 per day</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setAtmWithdrawals, atmWithdrawals)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    atmWithdrawals ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle ATM withdrawals"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      atmWithdrawals ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Use abroad
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Payments outside your home currency zone
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setUseAbroad, useAbroad)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    useAbroad ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle use abroad"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      useAbroad ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Card controls are a preview here; no real card is connected.</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  All accounts
                </h2>
                <p className="text-xs text-slate-400">Balances update as you spend and save.</p>
              </div>
              <Wallet size={16} className="text-slate-400" />
            </div>

            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-sm">
                      {renderAccountIcon(account)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {account.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {account.type} · {account.currency} ·{' '}
                        <span
                          className={
                            account.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'
                          }
                        >
                          {account.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono-numbers text-slate-900 dark:text-white">
                      {formatMoney(account.balance, account.currency, { decimals: false })}
                    </div>
                    <div
                      className={`text-[10px] font-mono-numbers ${
                        Number(account.change) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatPercent(Number(account.change))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Monthly spending limit
              </span>
              <span className="text-xs font-mono-numbers font-bold text-orange-500">
                {spentRatio.toFixed(0)}% used
              </span>
            </div>

            <div className="mt-4 relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${spentRatio}%`,
                  background:
                    spentRatio > 80
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, #ff7043, #ff5722)',
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-mono-numbers">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {formatMoney(monthlySpent, 'INR', { decimals: false })} spent
              </span>
              <span className="text-slate-400">
                of {formatMoney(monthlyBudget, 'INR', { decimals: false })}
              </span>
            </div>

            <button
              onClick={onOpenPlan}
              className="mt-4 w-full btn-secondary py-2.5 text-xs"
            >
              <span>Adjust category budgets</span>
              <ChevronRight size={14} />
            </button>

            <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Only completed payments count toward your budget.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
