import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Account, Contact, SavingsGoal, Transaction } from '../types/finance';
import type { MainTab } from '../App';
import { sound } from '../utils/audio';
import {
  Search,
  X,
  ArrowRight,
  LayoutGrid,
  List,
  Target,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
} from 'lucide-react';
import { formatMoney, relativeDay } from '../utils/money';

interface SearchOverlayProps {
  open: boolean;
  transactions: Transaction[];
  contacts: Contact[];
  goals: SavingsGoal[];
  accounts: Account[];
  onClose: () => void;
  onNavigate: (tab: MainTab) => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

const QUICK_LINKS: { tab: MainTab; label: string; icon: typeof LayoutGrid }[] = [
  { tab: 'Overview', label: 'Overview', icon: LayoutGrid },
  { tab: 'Activity', label: 'Full activity', icon: List },
  { tab: 'Plan', label: 'Goals & budgets', icon: Target },
  { tab: 'Payees', label: 'Payees', icon: Users },
  { tab: 'Accounts', label: 'Accounts', icon: Wallet },
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  open,
  transactions,
  contacts,
  goals,
  accounts,
  onClose,
  onNavigate,
  onSelectTransaction,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuery('');
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const goTo = (tab: MainTab) => {
    setQuery('');
    onNavigate(tab);
    onClose();
  };

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const normalized = query.trim().toLowerCase();

  const results = useMemo(() => {
    const matches = (value?: string) => (value ?? '').toLowerCase().includes(normalized);

    const tx = normalized
      ? transactions.filter((transaction) =>
          [
            transaction.title,
            transaction.counterparty ?? '',
            transaction.category,
            transaction.reference ?? '',
            transaction.note ?? '',
            (transaction.accountId ? accountById.get(transaction.accountId)?.name : '') ?? '',
          ].some(matches)
        )
      : transactions;

    return {
      transactions: tx.slice(0, 6),
      contacts: (normalized
        ? contacts.filter((contact) =>
            [contact.name, contact.handle, contact.bank].some(matches)
          )
        : contacts
      ).slice(0, 4),
      goals: (normalized
        ? goals.filter((goal) => goal.title.toLowerCase().includes(normalized))
        : goals
      ).slice(0, 3),
      accounts: (normalized
        ? accounts.filter((account) =>
            [account.name, account.type, account.currency].some(matches)
          )
        : accounts
      ).slice(0, 3),
    };
  }, [normalized, transactions, contacts, goals, accounts, accountById]);

  const hasResults =
    results.transactions.length > 0 ||
    results.contacts.length > 0 ||
    results.goals.length > 0 ||
    results.accounts.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions, payees, goals, accounts…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={close}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
          <span className="hidden sm:inline text-[10px] font-mono-numbers font-bold text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10">
            ESC
          </span>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {!normalized && (
            <div className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Go to
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUICK_LINKS.map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => {
                      sound.click();
                      goTo(tab);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Icon size={14} className="text-orange-500" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasResults && (
            <div className="py-12 text-center text-xs text-slate-400">
              Nothing matches “{query.trim()}”.
            </div>
          )}

          {results.transactions.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {normalized ? 'Transactions' : 'Recent transactions'}
              </div>
              {results.transactions.map((transaction) => {
                const account = transaction.accountId
                  ? accountById.get(transaction.accountId)
                  : undefined;
                return (
                  <button
                    key={transaction.id}
                    onClick={() => {
                      sound.click();
                      setQuery('');
                      onSelectTransaction(transaction);
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        transaction.kind === 'income'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : transaction.kind === 'transfer'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {transaction.kind === 'income' ? (
                        <ArrowDownLeft size={14} />
                      ) : transaction.kind === 'transfer' ? (
                        <ArrowLeftRight size={14} />
                      ) : (
                        <ArrowUpRight size={14} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {transaction.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {transaction.counterparty} · {account?.name ?? 'Unknown'} ·{' '}
                        {relativeDay(transaction.date)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono-numbers shrink-0 ${
                        transaction.kind === 'income'
                          ? 'text-emerald-500'
                          : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {transaction.kind === 'income' ? '+' : '−'}
                      {formatMoney(transaction.amount, account?.currency ?? 'INR', {
                        decimals: false,
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {results.contacts.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payees
              </div>
              {results.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    sound.click();
                    goTo('Payees');
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-tr ${contact.avatarColor}`}
                  >
                    {contact.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {contact.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {contact.bank} · {contact.accountNumber}
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {results.goals.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Goals
              </div>
              {results.goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    sound.click();
                    goTo('Plan');
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {goal.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatMoney(goal.savedAmount, 'INR', { decimals: false })} of{' '}
                      {formatMoney(goal.targetAmount, 'INR', { decimals: false })}
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {results.accounts.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Accounts
              </div>
              {results.accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    sound.click();
                    goTo('Accounts');
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <Wallet size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {account.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {account.type} · {account.currency}
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono-numbers text-slate-900 dark:text-white shrink-0">
                    {formatMoney(account.balance, account.currency, { decimals: false })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
