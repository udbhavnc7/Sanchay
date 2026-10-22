import React, { useState } from 'react';
import { ThreeDCard } from './ThreeDCard';
import { sound } from '../utils/audio';
import {
  Globe,
  Radio,
  Landmark,
  Plus,
} from 'lucide-react';

interface CardsTabProps {
  isFrozen: boolean;
  onToggleFreeze: () => void;
  spendingLimit: number;
  monthlySpent: number;
  onSetSpendingLimit: (val: number) => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({
  isFrozen,
  onToggleFreeze,
  spendingLimit,
  monthlySpent,
  onSetSpendingLimit,
}) => {
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [contactless, setContactless] = useState(true);
  const [atmWithdrawals, setAtmWithdrawals] = useState(true);
  const [useAbroad, setUseAbroad] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const cardsList = [
    { id: 'card1', last4: '6782', type: 'Titanium Obsidian', primary: true },
    { id: 'card2', last4: '4356', type: 'Virtual Solar Orange', primary: false },
  ];

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    sound.click();
    setter(!current);
  };

  const spentRatio = Math.min(100, (monthlySpent / spendingLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Freeze cards, fine-tune limits and decide which wallets stay switched on.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            alert('Virtual Titanium Card Request submitted to Sanchay Vault. Ready in 2 minutes.');
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>New card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3D Interactive Card & Card Switcher (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your cards</h2>
              <span className="text-xs text-slate-400 font-semibold">{cardsList.length} cards</span>
            </div>

            {/* Three.js 3D WebGL Canvas */}
            <ThreeDCard
              isFrozen={isFrozen}
              onToggleFreeze={onToggleFreeze}
              spendingLimit={spendingLimit}
              monthlySpent={monthlySpent}
            />

            {/* Multiple Cards Pills */}
            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cardsList.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      sound.click();
                      setActiveCardIndex(idx);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono-numbers transition-all ${
                      activeCardIndex === idx
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-sm ${
                        idx === 0 ? 'bg-slate-800 border border-slate-600' : 'bg-orange-500'
                      }`}
                    />
                    <span>•• {c.last4}</span>
                  </button>
                ))}

                <button
                  onClick={() => {
                    sound.click();
                    alert('Create a disposable virtual card with automatic 24-hour expiry.');
                  }}
                  className="w-7 h-7 rounded-full border border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all text-sm font-bold"
                >
                  +
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Tap card to rotate & examine
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Card Controls & Limit Settings (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Card controls</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="space-y-4">
              {/* 1. Online Payments */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Online payments</div>
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
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      onlinePayments ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Contactless */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Radio size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Contactless</div>
                    <div className="text-[11px] text-slate-400">Tap to pay up to $250 per payment</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setContactless, contactless)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    contactless ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      contactless ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. ATM Withdrawals */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">ATM withdrawals</div>
                    <div className="text-[11px] text-slate-400">Up to $1,000 per day</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setAtmWithdrawals, atmWithdrawals)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    atmWithdrawals ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      atmWithdrawals ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Use Abroad */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Use abroad</div>
                    <div className="text-[11px] text-slate-400">
                      Payments outside home currency zone
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(setUseAbroad, useAbroad)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    useAbroad ? 'bg-[#FF5722]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      useAbroad ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Monthly Spending Limit Slider */}
            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Monthly spending limit</span>
                <span className="text-xl font-black font-mono-numbers text-slate-900 dark:text-white">
                  ${spendingLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Slider */}
              <div className="mt-4">
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="500"
                  value={spendingLimit}
                  onChange={(e) => {
                    sound.click();
                    onSetSpendingLimit(Number(e.target.value));
                  }}
                  className="w-full"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono-numbers">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>{' '}
                  used ({spentRatio.toFixed(0)}%)
                </div>
                <span>$20,000 max</span>
              </div>

              {/* Dynamic Spent progress bar */}
              <div className="mt-2 w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${spentRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
