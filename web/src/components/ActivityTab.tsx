import React, { useMemo, useState } from 'react';
import type { Account, Category, CategoryDefinition, Currency, Transaction } from '../types/finance';
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
  Plus,
} from 'lucide-react';
import { formatMoney, relativeDay } from '../utils/money';
import { categoryLabel } from '../utils/categories';
import {
  computeReportTotals,
  DEFAULT_CURRENCY,
  reportCurrencies,
  reportsAccountMap,
  scopeToCurrency,
  transactionCurrency,
  transactionMatchesSearch,
} from '../utils/reporting';

interface ActivityTabProps {
  transactions: Transaction[];
  accounts: Account[];
  categoryDefinitions?: CategoryDefinition[];
  onAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

type StatusFilter = 'All' | 'Completed' | 'Pending' | 'Failed';
type DirectionFilter = 'All' | 'In' | 'Out' | 'Saved';

export const ActivityTab: React.FC<ActivityTabProps> = ({
  transactions,
  accounts,
  categoryDefinitions = [],
  onAddTransaction,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [currencyFilter, setCurrencyFilter] = useState<Currency | null>(null);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const accountsById = useMemo(() => reportsAccountMap(accounts), [accounts]);

  const availableCurrencies = useMemo(
    () => reportCurrencies(transactions, accountsById),
    [transactions, accountsById]
  );
  const currency: Currency =
    currencyFilter && availableCurrencies.includes(currencyFilter)
      ? currencyFilter
      : availableCurrencies[0] ?? DEFAULT_CURRENCY;
  const scoped = useMemo(
    () => scopeToCurrency(transactions, accountsById, currency),
    [transactions, accountsById, currency]
  );

  const categories = useMemo(() => {
    const ids = new Set<Category>();
    scoped.forEach((tx) => ids.add(tx.category));
    return Array.from(ids)
      .map((id) => ({ id, label: categoryLabel(id, categoryDefinitions) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [scoped, categoryDefinitions]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim();

    return scoped.filter((tx) => {
      if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;

      if (directionFilter === 'In' && tx.kind !== 'income' && tx.kind !== 'refund') return false;
      if (directionFilter === 'Out' && tx.kind !== 'expense') return false;
      if (directionFilter === 'Saved' && !(tx.kind === 'transfer' && tx.type === 'debit')) {
        return false;
      }

      return transactionMatchesSearch(tx, query, accountsById, categoryDefinitions);
    });
  }, [
    scoped,
    statusFilter,
    categoryFilter,
    directionFilter,
    searchTerm,
    accountsById,
    categoryDefinitions,
  ]);

  const totals = useMemo(() => computeReportTotals(filtered, currency), [filtered, currency]);

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
          <select
            aria-label="Activity currency"
            value={currency}
            onChange={(event) => {
              sound.click();
              setCurrencyFilter(event.target.value as Currency);
            }}
            className="pill-select"
            style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700 }}
          >
            {availableCurrencies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              sound.click();
              onAddTransaction();
            }}
            className="btn-action-dark"
            style={{ padding: '9px 14px', fontSize: '12px' }}
          >
            <Plus size={14} />
            Add
          </button>
          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: '#10b981' }}>
              In
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              +{formatMoney(totals.income, currency)}
            </div>
          </div>

          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: 'var(--text-muted)' }}>
              Out
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              −{formatMoney(totals.spending, currency)}
            </div>
          </div>

          <div className="activity-metric-box">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: 'var(--accent-orange)' }}>
              Saved
            </div>
            <div className="font-mono-numbers" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-orange)', marginTop: '2px' }}>
              {formatMoney(totals.saved, currency)}
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
                <option key={category.id} value={category.id}>
                  {category.label}
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
                  const isTransfer = tx.kind === 'transfer';
                  const isCredit =
                    tx.kind === 'income' ||
                    tx.kind === 'refund' ||
                    (isTransfer && tx.type === 'credit');

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
                              isCredit
                                ? 'tx-kind-income'
                                : isTransfer
                                ? 'tx-kind-transfer'
                                : 'tx-kind-expense'
                            }`}
                          >
                            {isCredit ? (
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
                          {categoryLabel(tx.category, categoryDefinitions)}
                        </span>
                      </td>

                      <td className="activity-td font-mono-numbers" style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: isCredit ? '#10b981' : 'var(--text-main)',
                          }}
                        >
                          {isCredit ? '+' : '−'}
                          {formatMoney(tx.amount, transactionCurrency(tx, accountsById))}
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

