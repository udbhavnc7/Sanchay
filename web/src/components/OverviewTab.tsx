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
  ChevronDown,
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Greeting Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-main)' }}>
            Good morning, Code XR
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '11px', fontWeight: 700 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          Treasury Mesh Synchronized
        </div>
      </div>

      {/* 2. Top Grid: Total Balance + 4 Metrics + Total Income Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Card 1: Total Balance & Wallets */}
        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Balance
              </span>

              {/* Currency Dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedCurrency}
                  onChange={(e) => {
                    sound.click();
                    setSelectedCurrency(e.target.value);
                  }}
                  style={{
                    appearance: 'none',
                    background: 'var(--bg-pill)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 24px 5px 10px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="GBP">🇬🇧 GBP</option>
                  <option value="JPY">🇯🇵 JPY</option>
                  <option value="INR">🇮🇳 INR</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div className="font-mono-numbers" style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                $568,527.00
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '9999px' }}>
                  <ArrowUpRight size={12} /> +5%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>than last month</span>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}>
              <button
                onClick={() => {
                  sound.click();
                  onOpenTransfer();
                }}
                className="btn-action-dark"
              >
                <ArrowUpRight size={15} />
                <span>Transfer</span>
              </button>

              <button
                onClick={() => {
                  sound.click();
                  alert('Sanchay Direct Payment Request Link copied to clipboard.');
                }}
                className="btn-action-light"
              >
                <ArrowDownLeft size={15} />
                <span>Request</span>
              </button>
            </div>
          </div>

          {/* Wallets Carousel inside Balance card */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Wallets | Total {wallets.length} wallets
              </span>
              <span onClick={() => sound.click()} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-orange)', cursor: 'pointer' }}>
                Manage &rarr;
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {wallets.slice(0, 3).map((w) => (
                <div
                  key={w.id}
                  onClick={() => sound.click()}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                    <span>{w.flag}</span>
                    <span>{w.currency}</span>
                  </div>
                  <div className="font-mono-numbers" style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.symbol}{w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: w.status === 'Active' ? '#10b981' : 'var(--text-muted)' }}>
                      {w.status}
                    </span>
                    <span className="font-mono-numbers" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {w.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: 4 Metric Cards (2x2 Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Earnings */}
          <div className="orange-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.85)' }}>
                Total earnings
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)' }}>
                <Calendar size={13} color="#ffffff" />
              </div>
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', margin: '12px 0' }}>
              $749
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '9999px', width: 'fit-content' }}>
              <TrendingUp size={11} /> +7% this month
            </div>
          </div>

          {/* Spending */}
          <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Total Spending
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--bg-pill)', color: 'var(--text-muted)' }}>
                <Trash2 size={13} />
              </div>
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', margin: '12px 0' }}>
              $487
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 8px', borderRadius: '9999px', width: 'fit-content' }}>
              &darr; 5% this month
            </div>
          </div>

          {/* Income */}
          <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Total income
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--bg-pill)', color: 'var(--text-muted)' }}>
                <DollarSign size={13} />
              </div>
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', margin: '12px 0' }}>
              $604
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '9999px', width: 'fit-content' }}>
              &uarr; 8% this month
            </div>
          </div>

          {/* Revenue */}
          <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Total Revenue
              </span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--bg-pill)', color: 'var(--text-muted)' }}>
                <TrendingUp size={13} />
              </div>
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', margin: '12px 0' }}>
              $360
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '9999px', width: 'fit-content' }}>
              &uarr; 4% this month
            </div>
          </div>
        </div>

        {/* Card 3: Total Income Chart */}
        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Total Income</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View your income in a certain period of time</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Profit and Loss</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-orange)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Profit</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#111317' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Loss</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', marginTop: '16px', position: 'relative' }}>
            {chartData.map((d, idx) => (
              <div
                key={d.month}
                onMouseEnter={() => {
                  sound.click();
                  setHoveredMonth(idx);
                }}
                onMouseLeave={() => setHoveredMonth(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                {hoveredMonth === idx && (
                  <div style={{ position: 'absolute', top: '0', background: '#111317', color: '#ffffff', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 10 }}>
                    Profit: +${d.profit}k | Loss: -${d.loss}k
                  </div>
                )}

                <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div
                    style={{
                      height: `${d.profit * 2.2}px`,
                      borderRadius: '4px 4px 0 0',
                      backgroundColor: 'var(--accent-orange)',
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)',
                    }}
                  />
                  <div
                    style={{
                      height: `${d.loss * 2.2}px`,
                      borderRadius: '0 0 4px 4px',
                      backgroundColor: '#111317',
                    }}
                  />
                </div>

                <span style={{ fontSize: '10px', fontWeight: 600, color: hoveredMonth === idx ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Spending Limit + Recent Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Monthly Spending Limit */}
        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Monthly Spending Limit
              </span>
              <span className="font-mono-numbers" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-orange)' }}>
                {spentRatio.toFixed(0)}% used
              </span>
            </div>

            {/* Visual Progress Track */}
            <div style={{ width: '100%', height: '14px', borderRadius: '9999px', backgroundColor: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginTop: '16px' }}>
              <div
                style={{
                  width: `${spentRatio}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #ff7043, #ff5722)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
              <div>
                <span className="font-mono-numbers" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                  ${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>spent out of</span>
              </div>
              <div className="font-mono-numbers" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                ${spendingLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Interactive Cap Slider */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Fine-tune Cap:</span>
              <span className="font-mono-numbers" style={{ fontWeight: 800, color: 'var(--accent-orange)' }}>
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
              style={{ width: '100%' }}
            />

            <div className="font-mono-numbers" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>$1,000</span>
              <span>$10,000</span>
              <span>$20,000</span>
            </div>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="s-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Recent Activities</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 28px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    width: '180px',
                  }}
                />
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', padding: '2px', borderRadius: '9999px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
                {(['All', 'Completed', 'Pending'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      sound.click();
                      setStatusFilter(s);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: statusFilter === s ? '#111317' : 'transparent',
                      color: statusFilter === s ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Activity</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => {
                      sound.click();
                      onSelectTransaction(tx);
                    }}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td className="font-mono-numbers" style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {tx.orderId}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tx.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tx.recipient}</div>
                    </td>
                    <td className="font-mono-numbers" style={{ padding: '12px 10px', fontWeight: 800 }}>
                      <span style={{ color: tx.type === 'credit' ? '#10b981' : 'var(--text-main)' }}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: tx.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: tx.status === 'Completed' ? '#10b981' : '#f59e0b',
                      }}>
                        {tx.status === 'Completed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="font-mono-numbers" style={{ padding: '12px 10px', fontSize: '10px', color: 'var(--text-muted)' }}>
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
  );
};
