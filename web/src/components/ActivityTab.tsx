import React, { useMemo, useState } from 'react';
import type { Account, Category, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeftRight,
  Filter,
} from 'lucide-react';
import { formatMoney, relativeDay } from '../utils/money';

interface ActivityTabProps {
  transactions: Transaction[];
  accounts: Account[];
  onSelectTransaction: (tx: Transaction) => void;
}

type StatusFilter = 'All' | 'Completed' | 'Pending' | 'Failed';
type DirectionFilter = 'All' | 'In' | 'Out' | 'Saved';

export const ActivityTab: React.FC<ActivityTabProps> = ({
  transactions,
  accounts,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const categories = useMemo(() => {
    const set = new Set<Category>();
    transactions.forEach((tx) => set.add(tx.category));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;

      if (directionFilter === 'In' && tx.kind !== 'income') return false;
      if (directionFilter === 'Out' && tx.kind !== 'expense') return false;
      if (directionFilter === 'Saved' && tx.kind !== 'transfer') return false;

      if (!query) return true;

      const account = tx.accountId ? accountById.get(tx.accountId) : undefined;
      return [tx.title, tx.counterparty, tx.category, tx.reference, tx.note ?? '', account?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [transactions, statusFilter, categoryFilter, directionFilter, searchTerm, accountById]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let saved = 0;

    filtered.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (tx.kind === 'income') income += tx.amount;
      else if (tx.kind === 'transfer') saved += tx.amount;
      else expense += tx.amount;
    });

    return { income, expense, saved };
  }, [filtered]);

  const hasFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'All' ||
    directionFilter !== 'All' ||
    categoryFilter !== 'All';

  const resetFilters = () => {
    sound.click();
    setSearchTerm('');
    setStatusFilter('All');
    setDirectionFilter('All');
    setCategoryFilter('All');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Title & Metrics Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            Activity
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Every payment, deposit and transfer in one searchable ledger.
          </p>
        </div>

        <div className="activity-metrics" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: '#10b981' }}>
              In
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              +{formatMoney(totals.income, 'INR', { decimals: false })}
            </div>
          </div>

          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: 'var(--text-muted)' }}>
              Out
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              −{formatMoney(totals.expense, 'INR', { decimals: false })}
            </div>
          </div>

          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: 'var(--accent-orange)' }}>
              Saved
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-orange)', marginTop: '2px' }}>
              {formatMoney(totals.saved, 'INR', { decimals: false })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="s-card activity-filter-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Search Input */}
          <div className="activity-search" style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transactions or notes"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-pill-input"
            />
          </div>

          {/* Filter Pills Row */}
          <div className="activity-filter-pills" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {/* Direction Filter */}
            <div className="pill-group">
              {(['All', 'In', 'Out', 'Saved'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    sound.click();
                    setDirectionFilter(value);
                  }}
                  className={`pill-option ${directionFilter === value ? 'active' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="pill-group">
              {(['All', 'Completed', 'Pending', 'Failed'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    sound.click();
                    setStatusFilter(value);
                  }}
                  className={`pill-option ${statusFilter === value ? 'active' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(event) => {
                sound.click();
                setCategoryFilter(event.target.value as 'All' | Category);
              }}
              className="pill-select"
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-orange)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 12px',
                }}
              >
                <Filter size={13} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Table Card */}
      <div className="s-card activity-table-card" style={{ padding: '8px 12px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--bg-pill)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Search size={22} />
            </div>
            <div style={{ marginTop: '14px', fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              No transactions match
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Try a different search term or clear the active filters.
            </div>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="btn-action-light"
                style={{ marginTop: '16px', padding: '8px 20px', fontSize: '12px' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="activity-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="activity-th">Transaction</th>
                  <th className="activity-th">Account</th>
                  <th className="activity-th">Category</th>
                  <th className="activity-th">Amount</th>
                  <th className="activity-th">Status</th>
                  <th className="activity-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const account = tx.accountId ? accountById.get(tx.accountId) : undefined;
                  const isIncome = tx.kind === 'income';
                  const isTransfer = tx.kind === 'transfer';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        sound.click();
                        onSelectTransaction(tx);
                      }}
                      className="activity-tr"
                    >
                      <td className="activity-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            className={`tx-kind-icon ${
                              isIncome
                                ? 'tx-kind-income'
                                : isTransfer
                                ? 'tx-kind-transfer'
                                : 'tx-kind-expense'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft size={18} />
                            ) : isTransfer ? (
                              <ArrowLeftRight size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {tx.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {tx.counterparty} · {tx.reference}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="activity-td" style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {account?.name ?? 'Unknown account'}
                      </td>

                      <td className="activity-td">
                        <span className="badge-category">
                          {tx.category}
                        </span>
                      </td>

                      <td className="activity-td font-mono-numbers" style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: isIncome ? '#10b981' : 'var(--text-main)',
                          }}
                        >
                          {isIncome ? '+' : '−'}
                          {formatMoney(tx.amount, account?.currency ?? 'INR')}
                        </span>
                      </td>

                      <td className="activity-td">
                        <span
                          className={`badge-status ${
                            tx.status === 'Completed'
                              ? 'badge-status-completed'
                              : tx.status === 'Pending'
                              ? 'badge-status-pending'
                              : 'badge-status-failed'
                          }`}
                        >
                          {tx.status === 'Completed' ? (
                            <CheckCircle2 size={12} />
                          ) : tx.status === 'Pending' ? (
                            <Clock size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {tx.status}
                        </span>
                      </td>

                      <td className="activity-td font-mono-numbers" style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {relativeDay(tx.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

