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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Activity
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every payment, deposit and transfer in one searchable ledger.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
              In
            </div>
            <div className="text-sm font-black font-mono-numbers text-emerald-600 dark:text-emerald-400">
              {formatMoney(totals.income, 'INR', { decimals: false })}
            </div>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-slate-500/10 border border-slate-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Out
            </div>
            <div className="text-sm font-black font-mono-numbers text-slate-700 dark:text-slate-200">
              {formatMoney(totals.expense, 'INR', { decimals: false })}
            </div>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400">
              Saved
            </div>
            <div className="text-sm font-black font-mono-numbers text-orange-600 dark:text-orange-400">
              {formatMoney(totals.saved, 'INR', { decimals: false })}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, account, note or reference…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-white/10 text-xs">
              {(['All', 'In', 'Out', 'Saved'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    sound.click();
                    setDirectionFilter(value);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    directionFilter === value
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-white/10 text-xs">
              {(['All', 'Completed', 'Pending', 'Failed'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    sound.click();
                    setStatusFilter(value);
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                    statusFilter === value
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => {
                sound.click();
                setCategoryFilter(event.target.value as 'All' | Category);
              }}
              className="appearance-none bg-slate-100 dark:bg-slate-800/80 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
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
                className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Filter size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-3 md:p-5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Search size={20} />
            </div>
            <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No transactions match
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Try a different search term or clear the filters.
            </div>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 btn-secondary py-1.5 px-4 text-xs"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400">
                  <th className="py-3 px-3 font-semibold">Transaction</th>
                  <th className="py-3 px-3 font-semibold">Account</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Amount</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((tx) => {
                  const account = tx.accountId ? accountById.get(tx.accountId) : undefined;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        sound.click();
                        onSelectTransaction(tx);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.kind === 'income'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : tx.kind === 'transfer'
                                  ? 'bg-orange-500/10 text-orange-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {tx.kind === 'income' ? (
                              <ArrowDownLeft size={16} />
                            ) : tx.kind === 'transfer' ? (
                              <ArrowLeftRight size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                              {tx.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tx.counterparty} · {tx.reference}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {account?.name ?? 'Unknown account'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono-numbers font-bold whitespace-nowrap">
                        <span
                          className={
                            tx.kind === 'income'
                              ? 'text-emerald-500'
                              : 'text-slate-900 dark:text-slate-200'
                          }
                        >
                          {tx.kind === 'income' ? '+' : '−'}
                          {formatMoney(tx.amount, account?.currency ?? 'INR')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tx.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.status === 'Completed' ? (
                            <CheckCircle2 size={11} />
                          ) : tx.status === 'Pending' ? (
                            <Clock size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono-numbers whitespace-nowrap">
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
