import React, { useEffect, useMemo, useState } from 'react';
import {
  initialAccounts,
  initialTransactions,
  initialContacts,
  initialGoals,
  initialBudgets,
} from './data/mockData';
import type {
  Account,
  Budget,
  Contact,
  GoalDepositInput,
  MoneyResult,
  PaymentInput,
  SavingsGoal,
  Transaction,
} from './types/finance';
import { formatMoney, isValidAmount, startOfMonth } from './utils/money';
import { sound } from './utils/audio';
import { OverviewTab } from './components/OverviewTab';
import { CardsTab } from './components/CardsTab';
import { TransfersTab } from './components/TransfersTab';
import { GoalsTab } from './components/GoalsTab';
import { ReportsTab } from './components/ReportsTab';
import { ActivityTab } from './components/ActivityTab';
import { TransactionDrawer } from './components/TransactionDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { RequestMoneyModal } from './components/RequestMoneyModal';
import {
  Sun,
  Moon,
  LayoutGrid,
  Wallet,
  Users,
  Target,
  PieChart,
  Search,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  List,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  X,
} from 'lucide-react';

export type MainTab = 'Overview' | 'Activity' | 'Accounts' | 'Plan' | 'Payees' | 'Reports';

const NAV_ITEMS: { tab: MainTab; label: string; icon: typeof LayoutGrid }[] = [
  { tab: 'Overview', label: 'Overview', icon: LayoutGrid },
  { tab: 'Activity', label: 'Activity', icon: List },
  { tab: 'Accounts', label: 'Accounts', icon: Wallet },
  { tab: 'Plan', label: 'Plan', icon: Target },
  { tab: 'Payees', label: 'Payees', icon: Users },
  { tab: 'Reports', label: 'Reports', icon: PieChart },
];

interface Alert {
  id: string;
  tone: 'warning' | 'info' | 'success';
  title: string;
  detail: string;
}

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Overview');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [isCardFrozen, setIsCardFrozen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowSearch(true);
      }
      if (event.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowPrivacy(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const monthStart = startOfMonth().getTime();

  const monthlyTotals = useMemo(() => {
    let expense = 0;
    let income = 0;
    let saved = 0;
    const byCategory: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.status !== 'Completed') return;
      if (new Date(tx.date).getTime() < monthStart) return;
      if (tx.kind === 'income') {
        income += tx.amount;
      } else if (tx.kind === 'transfer') {
        saved += tx.amount;
      } else {
        expense += tx.amount;
        byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount;
      }
    });

    return { expense, income, saved, byCategory };
  }, [transactions, monthStart]);

  const budgetsTotal = useMemo(
    () => budgets.reduce((sum, budget) => sum + budget.limit, 0),
    [budgets]
  );

  const availableBalance = useMemo(
    () =>
      accounts
        .filter((account) => account.status === 'Active')
        .reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  const goalBalance = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.savedAmount, 0),
    [goals]
  );

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];

    budgets.forEach((budget) => {
      const spent = monthlyTotals.byCategory[budget.category] ?? 0;
      const ratio = budget.limit > 0 ? spent / budget.limit : 0;
      if (ratio >= 1) {
        list.push({
          id: `budget-over-${budget.id}`,
          tone: 'warning',
          title: `${budget.category} budget exceeded`,
          detail: `${formatMoney(spent, 'INR', { decimals: false })} spent of ${formatMoney(
            budget.limit,
            'INR',
            { decimals: false }
          )}.`,
        });
      } else if (ratio >= 0.8) {
        list.push({
          id: `budget-near-${budget.id}`,
          tone: 'warning',
          title: `${budget.category} is at ${Math.round(ratio * 100)}%`,
          detail: `${formatMoney(budget.limit - spent, 'INR', { decimals: false })} left this month.`,
        });
      }
    });

    transactions
      .filter((tx) => tx.status === 'Pending')
      .slice(0, 2)
      .forEach((tx) => {
        list.push({
          id: `pending-${tx.id}`,
          tone: 'info',
          title: 'Payment pending',
          detail: `${tx.counterparty} · ${formatMoney(tx.amount, 'INR')}`,
        });
      });

    goals.forEach((goal) => {
      const ratio = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
      if (ratio >= 0.8 && ratio < 1) {
        list.push({
          id: `goal-${goal.id}`,
          tone: 'success',
          title: `${goal.title} is almost funded`,
          detail: `${Math.round(ratio * 100)}% saved.`,
        });
      }
    });

    return list.slice(0, 5);
  }, [budgets, monthlyTotals.byCategory, transactions, goals]);

  const toggleTheme = (dark: boolean) => {
    sound.click();
    setIsDarkMode(dark);
  };

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    sound.enabled = next;
    if (next) sound.click();
  };

  const openTab = (tab: MainTab) => {
    sound.click();
    setActiveTab(tab);
    setShowNotifications(false);
  };

  const handleSendPayment = (input: PaymentInput): MoneyResult => {
    const account = accountById.get(input.accountId);

    if (!account) {
      return { ok: false, error: 'Choose an account to pay from.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is inactive. Choose another account.` };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    if (account.currency !== input.payee.currency) {
      return {
        ok: false,
        error: `${input.payee.name} receives ${input.payee.currency}. Choose a ${input.payee.currency} account.`,
      };
    }

    const fee = 0;
    if (input.amount + fee > account.balance) {
      return {
        ok: false,
        error: `Not enough money in ${account.name}. Available ${formatMoney(
          account.balance,
          account.currency
        )}.`,
      };
    }

    const timestamp = new Date().toISOString();
    const now = Date.now();
    const transaction: Transaction = {
      id: `tx_${now}`,
      reference: `PAY-${String(now).slice(-6)}`,
      title: `Payment to ${input.payee.name}`,
      category: input.category,
      amount: input.amount,
      type: 'debit',
      status: 'Completed',
      date: timestamp,
      accountId: account.id,
      counterparty: input.payee.name,
      note: input.note?.trim() || undefined,
      kind: 'expense',
      fee,
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id ? { ...item, balance: item.balance - input.amount - fee } : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === input.payee.id
          ? {
              ...contact,
              lastTransfer: `Today · ${formatMoney(input.amount, account.currency)}`,
            }
          : contact
      )
    );

    return { ok: true, transaction };
  };

  const handleDepositToGoal = (input: GoalDepositInput): MoneyResult => {
    const account = accountById.get(input.accountId);
    const goal = goals.find((item) => item.id === input.goalId);

    if (!goal) {
      return { ok: false, error: 'That goal no longer exists.' };
    }
    if (!account) {
      return { ok: false, error: 'Choose an account to move money from.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is inactive. Choose another account.` };
    }
    if (account.currency !== 'INR') {
      return { ok: false, error: 'Goals are held in INR. Choose an INR account.' };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    if (input.amount > account.balance) {
      return {
        ok: false,
        error: `Not enough money in ${account.name}. Available ${formatMoney(
          account.balance,
          account.currency
        )}.`,
      };
    }
    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
    if (remaining === 0) {
      return { ok: false, error: 'This goal is already fully funded.' };
    }
    if (input.amount > remaining) {
      return {
        ok: false,
        error: `Only ${formatMoney(remaining, 'INR')} left to fully fund ${goal.title}.`,
      };
    }

    const timestamp = new Date().toISOString();
    const now = Date.now();
    const transaction: Transaction = {
      id: `tx_${now}`,
      reference: `SAV-${String(now).slice(-6)}`,
      title: `Moved to ${goal.title}`,
      category: 'Savings',
      amount: input.amount,
      type: 'debit',
      status: 'Completed',
      date: timestamp,
      accountId: account.id,
      counterparty: goal.title,
      note: 'Savings transfer',
      kind: 'transfer',
      fee: 0,
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id ? { ...item, balance: item.balance - input.amount } : item
      )
    );
    setGoals((prev) =>
      prev.map((item) =>
        item.id === goal.id ? { ...item, savedAmount: item.savedAmount + input.amount } : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);

    return { ok: true, transaction };
  };

  const handleAddNewGoal = (newGoal: SavingsGoal) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleAddContact = (newContact: Contact) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  const handleToggleFavorite = (contactId: string) => {
    sound.click();
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, isFavorite: !contact.isFavorite } : contact
      )
    );
  };

  const handleUpdateBudget = (budgetId: string, limit: number) => {
    setBudgets((prev) =>
      prev.map((budget) =>
        budget.id === budgetId
          ? { ...budget, limit: Math.max(0, Math.round(limit)) }
          : budget
      )
    );
  };

  const activeAlertCount = alerts.length;

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 flex items-start justify-center transition-colors duration-300">
      <div className="w-full max-w-[1580px] rounded-[36px] bg-slate-100/90 dark:bg-[#0c0e12] border border-slate-300/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] p-4 md:p-6 lg:p-8 relative">
        <div className="flex gap-6 items-start">
          <aside className="hidden md:flex flex-col items-center gap-4 py-4 px-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm sticky top-8 z-30">
            <div className="flex flex-col items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 gap-1 border border-slate-200/60 dark:border-white/5">
              <button
                onClick={() => toggleTheme(false)}
                title="Light mode"
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-orange-500 shadow-sm scale-110'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sun size={15} />
              </button>
              <button
                onClick={() => toggleTheme(true)}
                title="Dark mode"
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-950 text-orange-400 shadow-sm scale-110'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon size={15} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
              {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
                <button
                  key={tab}
                  onClick={() => openTab(tab)}
                  title={label}
                  className={`p-3 rounded-full transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 mt-auto">
              <button
                onClick={() => {
                  sound.click();
                  setShowSearch(true);
                }}
                title="Search (Ctrl/Cmd + K)"
                className="p-3 rounded-full text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => {
                  sound.click();
                  setShowPrivacy(true);
                }}
                title="How your data is handled"
                className="p-3 rounded-full text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <ShieldCheck size={18} />
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div
                onClick={() => openTab('Overview')}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform shadow-orange-500/30">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white flex items-center gap-1">
                    Sanchay
                    <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      PERSONAL
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                    Your money, clearly
                  </span>
                </div>
              </div>

              <nav className="flex items-center p-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-x-auto">
                {NAV_ITEMS.map(({ tab }) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => openTab(tab)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    sound.click();
                    setShowSearch(true);
                  }}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
                  title="Search (Ctrl/Cmd + K)"
                >
                  <Search size={16} />
                </button>

                <div className="relative">
                  <button
                    onClick={() => {
                      sound.click();
                      setShowNotifications(!showNotifications);
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm relative cursor-pointer"
                    title="Alerts"
                  >
                    <Bell size={16} />
                    {activeAlertCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {activeAlertCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl z-50 animate-fade-in text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          What needs attention
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {activeAlertCount} item{activeAlertCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {alerts.length === 0 ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <div className="font-bold">You're all caught up</div>
                          <div className="text-[11px] opacity-80">
                            No budget or payment issues right now.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {alerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={`p-2.5 rounded-xl border ${
                                alert.tone === 'warning'
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
                                  : alert.tone === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              <div className="font-bold flex items-center gap-1.5">
                                {alert.tone === 'warning' ? (
                                  <AlertTriangle size={12} />
                                ) : alert.tone === 'success' ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <Clock3 size={12} />
                                )}
                                {alert.title}
                              </div>
                              <div className="text-[11px] opacity-80 mt-0.5">{alert.detail}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleAudio}
                  title={isAudioEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all shadow-sm cursor-pointer"
                >
                  {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  onClick={() => {
                    sound.click();
                    setShowPrivacy(true);
                  }}
                  className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-orange-500/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    U
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Udbhav
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">Local profile</span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>
              </div>
            </header>

            {activeTab === 'Overview' && (
              <OverviewTab
                accounts={accounts}
                transactions={transactions}
                goals={goals}
                budgets={budgets}
                monthlySpent={monthlyTotals.expense}
                monthlyIncome={monthlyTotals.income}
                monthlySaved={monthlyTotals.saved}
                monthlyBudget={budgetsTotal}
                availableBalance={availableBalance}
                goalBalance={goalBalance}
                onOpenTransfer={() => openTab('Payees')}
                onOpenRequest={() => {
                  sound.click();
                  setShowRequest(true);
                }}
                onOpenActivity={() => openTab('Activity')}
                onOpenPlan={() => openTab('Plan')}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Activity' && (
              <ActivityTab
                transactions={transactions}
                accounts={accounts}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Accounts' && (
              <CardsTab
                accounts={accounts}
                isFrozen={isCardFrozen}
                onToggleFreeze={() => {
                  setIsCardFrozen(!isCardFrozen);
                  if (!isCardFrozen) sound.laser();
                }}
                monthlyBudget={budgetsTotal}
                monthlySpent={monthlyTotals.expense}
                onOpenPlan={() => openTab('Plan')}
              />
            )}

            {activeTab === 'Payees' && (
              <TransfersTab
                contacts={contacts}
                accounts={accounts}
                onSendPayment={handleSendPayment}
                onAddContact={handleAddContact}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === 'Plan' && (
              <GoalsTab
                goals={goals}
                accounts={accounts}
                budgets={budgets}
                transactions={transactions}
                onDepositToGoal={handleDepositToGoal}
                onAddNewGoal={handleAddNewGoal}
                onUpdateBudget={handleUpdateBudget}
              />
            )}

            {activeTab === 'Reports' && (
              <ReportsTab transactions={transactions} accounts={accounts} />
            )}
          </main>
        </div>
      </div>

      <TransactionDrawer
        transaction={selectedTransaction}
        account={
          selectedTransaction ? accountById.get(selectedTransaction.accountId) : undefined
        }
        onClose={() => setSelectedTransaction(null)}
      />

      <SearchOverlay
        open={showSearch}
        transactions={transactions}
        contacts={contacts}
        goals={goals}
        accounts={accounts}
        onClose={() => setShowSearch(false)}
        onNavigate={(tab) => {
          setShowSearch(false);
          openTab(tab);
        }}
        onSelectTransaction={(transaction) => {
          setShowSearch(false);
          setSelectedTransaction(transaction);
        }}
      />

      {showRequest && (
        <RequestMoneyModal
          contacts={contacts}
          onClose={() => {
            setShowRequest(false);
          }}
        />
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Close privacy details"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Your ledger stays yours
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This Sanchay prototype runs entirely in your browser. It does not connect to a bank,
              ask for credentials, or send your transactions to a server.
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>No bank login or account linking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>No money movement — payments are simulated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Balances and budgets stay on this device</span>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacy(false)}
              className="mt-6 w-full btn-primary py-3 text-xs"
            >
              <span>Got it</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
