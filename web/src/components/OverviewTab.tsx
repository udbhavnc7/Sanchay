import React, { useState } from 'react';
import type { Wallet, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Trash2,
  TrendingUp,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface OverviewTabProps {
  wallets: Wallet[];
  transactions: Transaction[];
  spendingLimit: number;
  monthlySpent: number;
  onSetSpendingLimit: (val: number) => void;
  onOpenTransfer: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  wallets,
  transactions,
  spendingLimit,
  monthlySpent,
  onSetSpendingLimit,
  onOpenTransfer,
  onSelectTransaction,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Profit and loss chart data
  const chartData = [
    { month: 'Jan', profit: 34, loss: 12 },
    { month: 'Feb', profit: 42, loss: 15 },
    { month: 'Mar', profit: 28, loss: 10 },
    { month: 'Apr', profit: 39, loss: 16 },
    { month: 'May', profit: 24, loss: 19 },
    { month: 'Jun', profit: 31, loss: 14 },
    { month: 'Jul', profit: 18, loss: 11 },
    { month: 'Aug', profit: 22, loss: 8 },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const spentRatio = Math.min(100, (monthlySpent / spendingLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Good morning, Code XR
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Treasury Mesh Synchronized
          </div>
        </div>
      </div>

      {/* Primary Row: Total Balance + 4 KPIs + Profit & Loss Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Total Balance & Wallets (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Total Balance
              </span>

              {/* Currency Dropdown */}
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => {
                    sound.click();
                    setSelectedCurrency(e.target.value);
                  }}
                  className="appearance-none bg-slate-100 dark:bg-slate-800/80 text-xs font-bold px-3 py-1.5 pr-6 rounded-full border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                >
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="INR">🇮🇳 INR</option>
                </select>
                <ChevronRight
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Huge Balance */}
            <div className="mt-3 flex items-baseline gap-3">
              <h2 className="text-4xl md:text-5xl font-black font-mono-numbers text-slate-900 dark:text-white tracking-tight">
                $568,527.00
              </h2>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight size={13} /> +5%
              </span>
              <span className="text-xs text-slate-400">than last month</span>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sound.click();
                  onOpenTransfer();
                }}
                className="btn-primary"
              >
                <ArrowUpRight size={16} />
                <span>Transfer</span>
              </button>

              <button
                onClick={() => {
                  sound.click();
                  alert('Generating Sanchay Payment Request Link...');
                }}
                className="btn-secondary"
              >
                <ArrowDownLeft size={16} />
                <span>Request</span>
              </button>
            </div>

            {/* Wallets Horizontal Carousel */}
            <div className="mt-8 border-t border-slate-200/60 dark:border-white/10 pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Wallets | Total {wallets.length} wallets
                </span>
                <span className="text-xs text-slate-400 hover:text-orange-500 cursor-pointer font-medium">
                  Manage &rarr;
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {wallets.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    onClick={() => sound.click()}
                    className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-white/5 hover:border-orange-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{w.flag}</span>
                      <span>{w.currency}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-extrabold font-mono-numbers text-slate-900 dark:text-white truncate">
                      {w.symbol}
                      {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold ${
                          w.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {w.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">{w.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: 4 Business Metric Cards (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          {/* 1. Total Earnings (Signature Orange Card) */}
          <div className="orange-card p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Total earnings
              </span>
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                <Calendar size={14} className="text-white" />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black font-mono-numbers text-white">$749</div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full w-fit">
              <TrendingUp size={12} /> +7% this month
            </div>
          </div>

          {/* 2. Total Spending */}
          <div className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Spending
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Trash2 size={14} />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
                $487
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full w-fit">
              &darr; 5% this month
            </div>
          </div>

          {/* 3. Total Income */}
          <div className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total income
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <DollarSign size={14} />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
                $604
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
              &uarr; 8% this month
            </div>
          </div>

          {/* 4. Total Revenue */}
          <div className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Revenue
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <TrendingUp size={14} />
              </div>
            </div>

            <div className="my-4">
              <div className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
                $360
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
              &uarr; 4% this month
            </div>
          </div>
        </div>

        {/* Right Column: Profit & Loss Stacked Bar Chart (4 cols) */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Total Income</h3>
                  <p className="text-xs text-slate-400">View your income in a certain period of time</p>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Profit and Loss</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5722]" />
                    <span className="text-slate-500 text-[11px]">Profit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 dark:bg-slate-600" />
                    <span className="text-slate-500 text-[11px]">Loss</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive SVG / Bar visualization */}
            <div className="mt-6 h-48 flex items-end justify-between gap-2 px-1 relative">
              {/* Y-axis grid labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none">
                <span>50k</span>
                <span>40k</span>
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
              </div>

              <div className="w-full pl-7 flex items-end justify-between gap-1.5 h-full">
                {chartData.map((d, idx) => (
                  <div
                    key={d.month}
                    onMouseEnter={() => {
                      sound.click();
                      setHoveredMonth(idx);
                    }}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    {hoveredMonth === idx && (
                      <div className="absolute -top-7 px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono-numbers z-20 shadow-lg pointer-events-none whitespace-nowrap">
                        Profit: +${d.profit}k | Loss: -${d.loss}k
                      </div>
                    )}

                    {/* Stacked Bars */}
                    <div className="w-full max-w-[28px] flex flex-col gap-0.5 items-stretch transition-transform group-hover:scale-105">
                      {/* Profit bar (Orange with angled texture) */}
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${d.profit * 2.2}px`,
                          backgroundColor: '#FF5722',
                          backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px)',
                        }}
                      />
                      {/* Loss bar (Black / Dark Slate) */}
                      <div
                        className="w-full rounded-b-md bg-slate-900 dark:bg-slate-700 transition-all duration-300"
                        style={{
                          height: `${d.loss * 2.2}px`,
                        }}
                      />
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-orange-500">
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Monthly Spending Limit + Recent Activities Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Spending Limit Interactive Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Monthly Spending Limit
                </span>
                <span className="text-xs font-mono-numbers font-bold text-orange-500">
                  {spentRatio.toFixed(0)}% used
                </span>
              </div>

              {/* Progress Bar with striped track */}
              <div className="mt-5 relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
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
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-slate-400 ml-1">spent out of</span>
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white">
                  ${spendingLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Interactive Limit Slider */}
            <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Fine-tune Cap:</span>
                <span className="font-bold font-mono-numbers text-orange-600 dark:text-orange-400">
                  ${spendingLimit.toLocaleString()}
                </span>
              </div>
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
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono-numbers">
                <span>$1,000</span>
                <span>$10,000</span>
                <span>$20,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Interactive Ledger Table (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activities</h3>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-white/10 text-xs">
                  {(['All', 'Completed', 'Pending'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        sound.click();
                        setStatusFilter(s);
                      }}
                      className={`px-3 py-1 rounded-full font-medium transition-all ${
                        statusFilter === s
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Order ID</th>
                    <th className="py-2.5 px-3 font-semibold">Activity</th>
                    <th className="py-2.5 px-3 font-semibold">Price</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        sound.click();
                        onSelectTransaction(tx);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-mono-numbers font-medium text-slate-600 dark:text-slate-300">
                        {tx.orderId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">
                          {tx.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{tx.recipient}</div>
                      </td>
                      <td className="py-3 px-3 font-mono-numbers font-bold">
                        <span
                          className={
                            tx.type === 'credit'
                              ? 'text-emerald-500 font-extrabold'
                              : 'text-slate-900 dark:text-slate-200'
                          }
                        >
                          {tx.type === 'credit' ? '+' : '-'}$
                          {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {tx.status === 'Completed' ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <Clock size={11} />
                          )}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] font-mono-numbers">
                        {tx.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
