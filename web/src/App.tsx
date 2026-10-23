import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  initialAccounts,
  initialBudgets,
  initialContacts,
  initialGoals,
  initialTransactions,
} from './data/mockData';
import type {
  Account,
  Budget,
  Contact,
  GoalDepositInput,
  MoneyResult,
  NewTransactionInput,
  PaymentInput,
  SavingsGoal,
  Transaction,
  UpdateTransactionInput,
} from './types/finance';
import { sound } from './utils/audio';
import {
  addMoney,
  compareMoney,
  formatMoney,
  fromMinorUnits,
  isValidAmount,
  startOfMonth,
  subtractMoney,
  sumMoney,
  toMinorUnits,
} from './utils/money';
import {
  clearPersistedState,
  createPersistedState,
  loadPersistedState,
  parsePersistedState,
  savePersistedState,
  type PersistedState,
} from './data/persistence';
import {
  applyTransactionToBalance,
  replaceTransactionOnBalance,
  reverseTransactionFromBalance,
} from './utils/ledger';
import { OverviewTab } from './components/OverviewTab';
import { ActivityTab } from './components/ActivityTab';
import { CardsTab } from './components/CardsTab';
import { TransfersTab } from './components/TransfersTab';
import { GoalsTab } from './components/GoalsTab';
import { ReportsTab } from './components/ReportsTab';
import { TransactionDrawer } from './components/TransactionDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { RequestMoneyModal } from './components/RequestMoneyModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SanchaySplash } from './components/SanchaySplash';
import { SanchayLogo } from './components/SanchayLogo';
import {
  Sun,
  Moon,
  LayoutGrid,
  List,
  CreditCard,
  Users,
  Target,
  BarChart3,
  ShieldCheck,
  Search,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  ArrowDownLeft,
  CheckCircle2,
  Undo2,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';

export type MainTab = 'Overview' | 'Activity' | 'Accounts' | 'Plan' | 'Payees' | 'Reports';

const TABS: MainTab[] = ['Overview', 'Activity', 'Accounts', 'Plan', 'Payees', 'Reports'];

const DOCK_ICONS: Record<MainTab, typeof LayoutGrid> = {
  Overview: LayoutGrid,
  Activity: List,
  Accounts: CreditCard,
  Plan: Target,
  Payees: Users,
  Reports: BarChart3,
};

type AlertTone = 'warn' | 'info' | 'good';

interface Alert {
  tone: AlertTone;
  text: string;
}

const ALERT_STYLES: Record<AlertTone, { background: string; color: string }> = {
  warn: { background: 'rgba(245, 158, 11, 0.12)', color: '#b45309' },
  info: { background: 'rgba(56, 189, 248, 0.12)', color: '#0369a1' },
  good: { background: 'rgba(16, 185, 129, 0.12)', color: '#047857' },
};

export const App: React.FC = () => {
  const [initialSnapshot] = useState(loadPersistedState);
  const [isDarkMode, setIsDarkMode] = useState(
    initialSnapshot?.preferences.isDarkMode ?? false
  );
  const [activeTab, setActiveTab] = useState<MainTab>('Overview');
  const [isAudioEnabled, setIsAudioEnabled] = useState(
    initialSnapshot?.preferences.isAudioEnabled ?? true
  );

  const [accounts, setAccounts] = useState<Account[]>(
    initialSnapshot?.accounts ?? initialAccounts
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialSnapshot?.transactions ?? initialTransactions
  );
  const [contacts, setContacts] = useState<Contact[]>(
    initialSnapshot?.contacts ?? initialContacts
  );
  const [goals, setGoals] = useState<SavingsGoal[]>(initialSnapshot?.goals ?? initialGoals);
  const [budgets, setBudgets] = useState<Budget[]>(initialSnapshot?.budgets ?? initialBudgets);

  const [isCardFrozen, setIsCardFrozen] = useState(
    initialSnapshot?.preferences.isCardFrozen ?? false
  );
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null);
  const [lastAdded, setLastAdded] = useState<Transaction | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Transaction | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).has('splash')) return true;
      return sessionStorage.getItem('sanchay-splash-seen') !== 'seen';
    } catch {
      return true;
    }
  });

  const handleEnterApp = useCallback(() => {
    try {
      sessionStorage.setItem('sanchay-splash-seen', 'seen');
    } catch {
      // Session storage can be unavailable in strict privacy modes.
    }
    setShowSplash(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowSearch((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    sound.enabled = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    const result = savePersistedState({
      accounts,
      transactions,
      contacts,
      goals,
      budgets,
      preferences: {
        isDarkMode,
        isAudioEnabled,
        isCardFrozen,
      },
    });
    queueMicrotask(() => setStorageError(result.ok ? '' : result.error));
  }, [
    accounts,
    transactions,
    contacts,
    goals,
    budgets,
    isDarkMode,
    isAudioEnabled,
    isCardFrozen,
  ]);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(() => setLastAdded(null), 8000);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  useEffect(() => {
    if (!lastDeleted) return;
    const timer = window.setTimeout(() => setLastDeleted(null), 8000);
    return () => window.clearTimeout(timer);
  }, [lastDeleted]);

  const monthStart = useMemo(() => startOfMonth(), []);

  const monthlySpent = useMemo(
    () =>
      sumMoney(
        transactions
          .filter(
            (tx) =>
              tx.status === 'Completed' &&
              tx.type === 'debit' &&
              tx.kind !== 'transfer' &&
              new Date(tx.date) >= monthStart
          )
          .map((tx) => tx.amount)
      ),
    [transactions, monthStart]
  );

  const monthlyBudget = useMemo(
    () => sumMoney(budgets.map((budget) => budget.limit)),
    [budgets]
  );

  const availableBalance = useMemo(
    () =>
      sumMoney(
        accounts
          .filter((account) => account.status === 'Active' && account.currency === 'INR')
          .map((account) => account.balance)
      ),
    [accounts]
  );

  const goalBalance = useMemo(
    () => sumMoney(goals.map((goal) => goal.savedAmount)),
    [goals]
  );

  const netWorth = useMemo(
    () => addMoney(availableBalance, goalBalance),
    [availableBalance, goalBalance]
  );

  const remainingBudget = useMemo(() => {
    const remaining = subtractMoney(monthlyBudget, monthlySpent);
    return compareMoney(remaining, 0) < 0 ? 0 : remaining;
  }, [monthlyBudget, monthlySpent]);

  const freeToSpend = useMemo(() => {
    const free = subtractMoney(availableBalance, remainingBudget);
    return compareMoney(free, 0) < 0 ? 0 : free;
  }, [availableBalance, remainingBudget]);

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    const month = startOfMonth();
    const spendByCategory = new Map<string, number>();

    transactions
      .filter(
        (tx) =>
          tx.status === 'Completed' &&
          tx.type === 'debit' &&
          tx.kind !== 'transfer' &&
          new Date(tx.date) >= month
      )
      .forEach((tx) => {
        spendByCategory.set(
          tx.category,
          addMoney(spendByCategory.get(tx.category) ?? 0, tx.amount)
        );
      });

    budgets.forEach((budget) => {
      const spent = spendByCategory.get(budget.category) ?? 0;
      if (compareMoney(spent, budget.limit) > 0) {
        list.push({
          tone: 'warn',
          text: `${budget.category} is ${formatMoney(subtractMoney(spent, budget.limit))} over budget`,
        });
      } else if (budget.limit > 0 && spent / budget.limit >= 0.8) {
        list.push({
          tone: 'info',
          text: `${budget.category} is at ${Math.round((spent / budget.limit) * 100)}% of its budget`,
        });
      }
    });

    goals.forEach((goal) => {
      const remaining = subtractMoney(goal.targetAmount, goal.savedAmount);
      if (compareMoney(remaining, 0) > 0 && remaining <= goal.targetAmount * 0.1) {
        list.push({
          tone: 'good',
          text: `${goal.title} is almost funded — ${formatMoney(remaining)} to go`,
        });
      }
    });

    const pending = transactions.filter((tx) => tx.status === 'Pending').length;
    if (pending > 0) {
      list.push({
        tone: 'info',
        text: `${pending} payment${pending === 1 ? '' : 's'} still pending`,
      });
    }

    if (list.length === 0) {
      list.push({ tone: 'good', text: 'All budgets are on track this month.' });
    }

    return list.slice(0, 5);
  }, [transactions, budgets, goals]);

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

  const navigate = (tab: MainTab) => {
    sound.click();
    setActiveTab(tab);
    setShowNotifications(false);
  };

  const handleSendPayment = (input: PaymentInput): MoneyResult => {
    const account = accounts.find((item) => item.id === input.accountId);
    if (!account) {
      return { ok: false, error: 'Choose an account to pay from.' };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is not active right now.` };
    }
    if (account.currency !== (input.payee.currency ?? 'INR')) {
      return {
        ok: false,
        error: `${input.payee.name} receives ${input.payee.currency ?? 'INR'}. Pick a matching account.`,
      };
    }
    if (compareMoney(account.balance, input.amount) < 0) {
      return {
        ok: false,
        error: `Insufficient balance in ${account.name}. Available ${formatMoney(account.balance, account.currency)}.`,
      };
    }

    const reference = `PAY-${String(Date.now()).slice(-8)}`;
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      reference,
      title: `Payment to ${input.payee.name}`,
      category: input.category,
      amount: input.amount,
      type: 'debit',
      status: 'Completed',
      date: new Date().toISOString(),
      accountId: account.id,
      counterparty: input.payee.name,
      note: input.note?.trim() || undefined,
      kind: 'expense',
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id
          ? { ...item, balance: subtractMoney(item.balance, input.amount) }
          : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === input.payee.id ? { ...contact, lastTransfer: 'Just now' } : contact
      )
    );

    return { ok: true, transaction };
  };

  const handleDepositToGoal = (input: GoalDepositInput): MoneyResult => {
    const goal = goals.find((item) => item.id === input.goalId);
    const account = accounts.find((item) => item.id === input.accountId);
    if (!goal) {
      return { ok: false, error: 'That goal no longer exists.' };
    }
    if (!account) {
      return { ok: false, error: 'Choose an account to move money from.' };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is not active right now.` };
    }
    if (account.currency !== 'INR') {
      return { ok: false, error: 'Goals are held in INR. Pick an INR account.' };
    }
    if (compareMoney(account.balance, input.amount) < 0) {
      return {
        ok: false,
        error: `Insufficient balance in ${account.name}. Available ${formatMoney(account.balance)}.`,
      };
    }
    const remaining = subtractMoney(goal.targetAmount, goal.savedAmount);
    if (compareMoney(input.amount, remaining) > 0) {
      return {
        ok: false,
        error: `That is more than the ${formatMoney(remaining)} left to fully fund this goal.`,
      };
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      reference: `SAV-${String(Date.now()).slice(-8)}`,
      title: `Moved to ${goal.title}`,
      category: 'Savings',
      amount: input.amount,
      type: 'debit',
      status: 'Completed',
      date: new Date().toISOString(),
      accountId: account.id,
      counterparty: goal.title,
      note: 'Savings transfer — not counted as spending.',
      kind: 'transfer',
      goalId: goal.id,
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id
          ? { ...item, balance: subtractMoney(item.balance, input.amount) }
          : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    setGoals((prev) =>
      prev.map((item) =>
        item.id === goal.id
          ? { ...item, savedAmount: addMoney(item.savedAmount, input.amount) }
          : item
      )
    );

    return { ok: true, transaction };
  };

  const handleAddGoal = (goal: SavingsGoal) => {
    setGoals((prev) => [...prev, goal]);
  };

  const handleAddContact = (contact: Contact) => {
    setContacts((prev) => [contact, ...prev]);
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
    const normalized = compareMoney(limit, 0) < 0 ? 0 : fromMinorUnits(toMinorUnits(limit));
    setBudgets((prev) =>
      prev.map((budget) =>
        budget.id === budgetId ? { ...budget, limit: normalized } : budget
      )
    );
  };

  const handleAddTransaction = (input: NewTransactionInput): MoneyResult => {
    const account = accounts.find((item) => item.id === input.accountId);
    if (!account) {
      return { ok: false, error: 'Choose an account for this transaction.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is not active right now.` };
    }
    if (account.currency !== 'INR') {
      return { ok: false, error: 'Quick entry currently supports INR accounts only.' };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }

    const amount = fromMinorUnits(toMinorUnits(input.amount));
    if (input.type === 'expense' && compareMoney(account.balance, amount) < 0) {
      return {
        ok: false,
        error: `Not enough in ${account.name}. Available ${formatMoney(account.balance)}.`,
      };
    }

    const occurredAt = new Date(`${input.date}T12:00:00`);
    if (Number.isNaN(occurredAt.getTime())) {
      return { ok: false, error: 'Choose a valid date.' };
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (occurredAt > today) {
      return { ok: false, error: 'Use today or an earlier date.' };
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reference: `ADD-${String(Date.now()).slice(-8)}`,
      title: input.title.trim() || input.category,
      category: input.category,
      amount,
      type: input.type === 'expense' ? 'debit' : 'credit',
      status: 'Completed',
      date: occurredAt.toISOString(),
      accountId: account.id,
      counterparty: input.title.trim() || input.category,
      note: input.note?.trim() || undefined,
      kind: input.type,
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id
          ? {
              ...item,
              balance:
                input.type === 'expense'
                  ? subtractMoney(item.balance, amount)
                  : addMoney(item.balance, amount),
            }
          : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    setLastAdded(transaction);

    return { ok: true, transaction };
  };

  const handleUpdateTransaction = (input: UpdateTransactionInput): MoneyResult => {
    const existing = transactions.find((item) => item.id === input.id);
    if (!existing) {
      return { ok: false, error: 'That transaction no longer exists.' };
    }
    if (existing.kind === 'transfer') {
      return { ok: false, error: 'Savings transfers cannot be edited here.' };
    }

    const account = accounts.find((item) => item.id === input.accountId);
    if (!account) {
      return { ok: false, error: 'Choose an account for this transaction.' };
    }
    if (account.status !== 'Active') {
      return { ok: false, error: `${account.name} is not active right now.` };
    }
    if (account.currency !== 'INR') {
      return { ok: false, error: 'Transaction editing currently supports INR accounts only.' };
    }
    if (!isValidAmount(input.amount)) {
      return { ok: false, error: 'Enter an amount greater than zero.' };
    }

    const amount = fromMinorUnits(toMinorUnits(input.amount));
    const occurredAt = new Date(`${input.date}T12:00:00`);
    if (Number.isNaN(occurredAt.getTime())) {
      return { ok: false, error: 'Choose a valid date.' };
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (occurredAt > today) {
      return { ok: false, error: 'Use today or an earlier date.' };
    }

    const nextEffect = {
      type: input.type === 'expense' ? ('debit' as const) : ('credit' as const),
      amount,
    };
    const affectsBalance = existing.status === 'Completed';
    if (affectsBalance) {
      const resultingBalance =
        existing.accountId === account.id
          ? replaceTransactionOnBalance(account.balance, existing, nextEffect)
          : applyTransactionToBalance(account.balance, nextEffect);
      if (input.type === 'expense' && compareMoney(resultingBalance, 0) < 0) {
        return {
          ok: false,
          error: `Not enough in ${account.name}. This change would leave ${formatMoney(resultingBalance)}.`,
        };
      }
    }

    const title = input.title.trim() || input.category;
    const updated: Transaction = {
      ...existing,
      title,
      category: input.category,
      amount,
      type: nextEffect.type,
      date: occurredAt.toISOString(),
      accountId: account.id,
      counterparty: existing.reference?.startsWith('ADD-')
        ? title
        : existing.counterparty ?? title,
      note: input.note?.trim() || undefined,
      kind: input.type,
      goalId: undefined,
    };

    setTransactions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (affectsBalance) {
      setAccounts((prev) =>
        prev.map((item) => {
          if (
            existing.accountId &&
            item.id === existing.accountId &&
            item.id !== account.id
          ) {
            return {
              ...item,
              balance: reverseTransactionFromBalance(item.balance, existing),
            };
          }
          if (item.id === account.id) {
            return {
              ...item,
              balance:
                existing.accountId === account.id
                  ? replaceTransactionOnBalance(item.balance, existing, nextEffect)
                  : applyTransactionToBalance(item.balance, nextEffect),
            };
          }
          return item;
        })
      );
    }

    setSelectedTransaction(null);
    setEditingTransaction(null);
    setLastAdded(null);
    sound.success();
    return { ok: true, transaction: updated };
  };

  const handleDeleteTransaction = (id: string): MoneyResult => {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) {
      return { ok: false, error: 'That transaction no longer exists.' };
    }

    if (transaction.status === 'Completed' && transaction.accountId) {
      setAccounts((prev) =>
        prev.map((item) =>
          item.id === transaction.accountId
            ? {
                ...item,
                balance: reverseTransactionFromBalance(item.balance, transaction),
              }
            : item
        )
      );
    }
    if (transaction.goalId) {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id !== transaction.goalId) return goal;
          const nextSaved = subtractMoney(goal.savedAmount, transaction.amount);
          return {
            ...goal,
            savedAmount: compareMoney(nextSaved, 0) < 0 ? 0 : nextSaved,
          };
        })
      );
    }

    setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    setSelectedTransaction(null);
    setEditingTransaction(null);
    setLastAdded(null);
    setLastDeleted(transaction);
    sound.success();
    return { ok: true, transaction };
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const transaction = lastDeleted;

    setTransactions((prev) =>
      prev.some((item) => item.id === transaction.id)
        ? prev
        : [transaction, ...prev]
    );
    if (transaction.status === 'Completed' && transaction.accountId) {
      setAccounts((prev) =>
        prev.map((item) =>
          item.id === transaction.accountId
            ? {
                ...item,
                balance: applyTransactionToBalance(item.balance, transaction),
              }
            : item
        )
      );
    }
    if (transaction.goalId) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === transaction.goalId
            ? { ...goal, savedAmount: addMoney(goal.savedAmount, transaction.amount) }
            : goal
        )
      );
    }

    setLastDeleted(null);
    sound.success();
  };

  const handleUndoAdd = () => {
    if (!lastAdded) return;
    const transaction = lastAdded;
    setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    if (transaction.status === 'Completed' && transaction.accountId) {
      setAccounts((prev) =>
        prev.map((item) =>
          item.id === transaction.accountId
            ? {
                ...item,
                balance: reverseTransactionFromBalance(item.balance, transaction),
              }
            : item
        )
      );
    }
    setLastAdded(null);
    sound.click();
  };

  const handleOpenPrivacy = () => {
    sound.click();
    setConfirmReset(false);
    setPendingImport(null);
    setBackupStatus('');
    setShowPrivacy(true);
  };

  const handleClosePrivacy = () => {
    setShowPrivacy(false);
    setConfirmReset(false);
    setPendingImport(null);
    setBackupStatus('');
  };

  const handleExportBackup = () => {
    const state = createPersistedState({
      accounts,
      transactions,
      contacts,
      goals,
      budgets,
      preferences: {
        isDarkMode,
        isAudioEnabled,
        isCardFrozen,
      },
    });
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanchay-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupStatus(`Backup downloaded with ${transactions.length} transactions.`);
    sound.success();
  };

  const handleBackupFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setStorageError('');
    setBackupStatus('');
    setPendingImport(null);

    if (file.size > 5_000_000) {
      setStorageError('That backup is larger than 5 MB. Choose a Sanchay JSON backup.');
      return;
    }

    try {
      const parsed = parsePersistedState(await file.text());
      if (!parsed) {
        setStorageError('That file is not a valid Sanchay backup.');
        return;
      }
      setPendingImport(parsed);
    } catch {
      setStorageError('That backup could not be read.');
    }
  };

  const handleRestoreBackup = () => {
    if (!pendingImport) return;

    setAccounts(pendingImport.accounts);
    setTransactions(pendingImport.transactions);
    setContacts(pendingImport.contacts);
    setGoals(pendingImport.goals);
    setBudgets(pendingImport.budgets);
    setIsDarkMode(pendingImport.preferences.isDarkMode);
    setIsAudioEnabled(pendingImport.preferences.isAudioEnabled);
    setIsCardFrozen(pendingImport.preferences.isCardFrozen);
    sound.enabled = pendingImport.preferences.isAudioEnabled;
    setStorageError('');
    setPendingImport(null);
    setConfirmReset(false);
    setLastAdded(null);
    setLastDeleted(null);
    setSelectedTransaction(null);
    setEditingTransaction(null);
    setBackupStatus(
      `Backup restored with ${pendingImport.transactions.length} transactions.`
    );
    sound.success();
  };

  const handleResetLocalData = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    clearPersistedState();
    setAccounts(initialAccounts);
    setTransactions(initialTransactions);
    setContacts(initialContacts);
    setGoals(initialGoals);
    setBudgets(initialBudgets);
    setIsDarkMode(false);
    setIsAudioEnabled(true);
    setIsCardFrozen(false);
    sound.enabled = true;
    setStorageError('');
    setBackupStatus('');
    setPendingImport(null);
    setLastAdded(null);
    setLastDeleted(null);
    setSelectedTransaction(null);
    setEditingTransaction(null);
    setShowPrivacy(false);
    setConfirmReset(false);
    sound.success();
  };

  const selectedAccount = selectedTransaction?.accountId
    ? accounts.find((account) => account.id === selectedTransaction.accountId)
    : undefined;

  return (
    <>
      {showSplash && <SanchaySplash onEnter={handleEnterApp} />}
      <div
        className="app-shell-root"
        aria-hidden={showSplash || undefined}
      >
        <div className="chassis-frame">
          <aside className="vertical-dock">
            <div className="dock-pill">
              <button
                onClick={() => toggleTheme(false)}
                className={`dock-btn ${!isDarkMode ? 'active' : ''}`}
                title="Light mode"
              >
                <Sun size={15} />
              </button>
              <button
                onClick={() => toggleTheme(true)}
                className={`dock-btn ${isDarkMode ? 'active' : ''}`}
                title="Dark mode"
              >
                <Moon size={15} />
              </button>
            </div>

            <div className="dock-pill">
              {TABS.map((tab) => {
                const Icon = DOCK_ICONS[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => navigate(tab)}
                    className={`dock-btn ${activeTab === tab ? 'active' : ''}`}
                    title={tab}
                  >
                    <Icon size={17} />
                  </button>
                );
              })}
            </div>

            <div className="dock-pill" style={{ marginTop: 'auto' }}>
              <button
                onClick={() => {
                  sound.click();
                  setShowSearch(true);
                }}
                className="dock-btn"
                title="Search (Ctrl/Cmd + K)"
              >
                <Search size={16} />
              </button>
              <button
                onClick={handleOpenPrivacy}
                className="dock-btn"
                title="Privacy"
              >
                <ShieldCheck size={16} />
              </button>
            </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <header className="header-bar">
              <div className="brand-badge" onClick={() => navigate('Overview')}>
                <SanchayLogo size="md" className="brand-logo" />
              </div>

              <nav className="top-nav-capsule">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => navigate(tab)}
                    className={`top-nav-item ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => toggleTheme(!isDarkMode)}
                  className="dock-btn mobile-theme-btn"
                  style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                  title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
                >
                  {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                <button
                  onClick={() => {
                    sound.click();
                    setShowSearch(true);
                  }}
                  className="dock-btn"
                  style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                  title="Search"
                >
                  <Search size={15} />
                </button>

                <button
                  onClick={() => {
                    sound.click();
                    setShowRequest(true);
                  }}
                  className="btn-action-dark header-request"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  <ArrowDownLeft size={14} />
                  <span>Request</span>
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      sound.click();
                      setShowNotifications(!showNotifications);
                    }}
                    className="dock-btn"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      position: 'relative',
                    }}
                    title="Notifications"
                  >
                    <Bell size={15} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '9px',
                        right: '9px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--accent-orange)',
                      }}
                    />
                  </button>

                  {showNotifications && (
                    <div
                      className="s-card notifications-popover"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '48px',
                        width: '300px',
                        zIndex: 50,
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>Alerts</span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => setShowNotifications(false)}
                        >
                          Close
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {alerts.map((alert) => (
                          <div
                            key={alert.text}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: ALERT_STYLES[alert.tone].background,
                              color: ALERT_STYLES[alert.tone].color,
                            }}
                          >
                            {alert.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleAudio}
                  className="dock-btn header-audio"
                  style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                  title={isAudioEnabled ? 'Mute sounds' : 'Enable sounds'}
                >
                  {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                <div
                  onClick={() => sound.click()}
                  className="header-profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px 4px 6px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#111317',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    U
                  </div>
                  <div className="header-profile-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        color: 'var(--text-main)',
                      }}
                    >
                      Udbhav
                    </span>
                    <span
                      style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.1 }}
                    >
                      hello@sanchay.app
                    </span>
                  </div>
                  <ChevronDown size={12} color="var(--text-muted)" />
                </div>
              </div>
            </header>

            {activeTab === 'Overview' && (
              <OverviewTab
                accounts={accounts}
                transactions={transactions}
                budgets={budgets}
                goals={goals}
                monthlySpent={monthlySpent}
                monthlyBudget={monthlyBudget}
                remainingBudget={remainingBudget}
                availableBalance={availableBalance}
                goalBalance={goalBalance}
                freeToSpend={freeToSpend}
                netWorth={netWorth}
                onOpenPayees={() => navigate('Payees')}
                onOpenPlan={() => navigate('Plan')}
                onOpenActivity={() => navigate('Activity')}
                onRequestMoney={() => setShowRequest(true)}
                onAddTransaction={() => setShowAddTransaction(true)}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Activity' && (
              <ActivityTab
                transactions={transactions}
                accounts={accounts}
                onAddTransaction={() => setShowAddTransaction(true)}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Accounts' && (
              <CardsTab
                accounts={accounts}
                isFrozen={isCardFrozen}
                onToggleFreeze={() => setIsCardFrozen(!isCardFrozen)}
                monthlyBudget={monthlyBudget}
                monthlySpent={monthlySpent}
                onOpenPlan={() => navigate('Plan')}
              />
            )}

            {activeTab === 'Plan' && (
              <GoalsTab
                goals={goals}
                budgets={budgets}
                accounts={accounts}
                transactions={transactions}
                onDepositToGoal={handleDepositToGoal}
                onAddGoal={handleAddGoal}
                onUpdateBudget={handleUpdateBudget}
              />
            )}

            {activeTab === 'Payees' && (
              <TransfersTab
                accounts={accounts}
                contacts={contacts}
                onSendPayment={handleSendPayment}
                onAddContact={handleAddContact}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === 'Reports' && (
              <ReportsTab transactions={transactions} accounts={accounts} />
            )}
          </main>
        </div>

        <TransactionDrawer
          transaction={selectedTransaction}
          account={selectedAccount}
          onEdit={(transaction) => {
            setSelectedTransaction(null);
            setEditingTransaction(transaction);
          }}
          onDelete={handleDeleteTransaction}
          onClose={() => setSelectedTransaction(null)}
        />

        <SearchOverlay
          open={showSearch}
          transactions={transactions}
          contacts={contacts}
          goals={goals}
          accounts={accounts}
          onClose={() => setShowSearch(false)}
          onNavigate={navigate}
          onSelectTransaction={(transaction) => {
            setShowSearch(false);
            setSelectedTransaction(transaction);
          }}
        />

        {showRequest && (
          <RequestMoneyModal contacts={contacts} onClose={() => setShowRequest(false)} />
        )}

        {showAddTransaction && (
          <AddTransactionModal
            accounts={accounts}
            onAdd={handleAddTransaction}
            onClose={() => setShowAddTransaction(false)}
          />
        )}

        {editingTransaction && (
          <AddTransactionModal
            key={editingTransaction.id}
            transaction={editingTransaction}
            accounts={accounts}
            onAdd={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            onClose={() => setEditingTransaction(null)}
          />
        )}

        {lastAdded && (
          <div className="sanchay-toast" role="status" aria-live="polite">
            <div className="sanchay-toast-icon">
              <CheckCircle2 size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                Transaction added
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lastAdded.title} · {formatMoney(lastAdded.amount)}
              </div>
            </div>
            <button type="button" onClick={handleUndoAdd} className="sanchay-toast-undo">
              <Undo2 size={13} />
              Undo
            </button>
          </div>
        )}

        {lastDeleted && (
          <div className="sanchay-toast sanchay-toast-danger" role="status" aria-live="polite">
            <div className="sanchay-toast-icon sanchay-toast-icon-danger">
              <Trash2 size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                Transaction deleted
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lastDeleted.title} · {formatMoney(lastDeleted.amount)}
              </div>
            </div>
            <button type="button" onClick={handleUndoDelete} className="sanchay-toast-undo">
              <Undo2 size={13} />
              Undo
            </button>
          </div>
        )}

        {showPrivacy && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '16px',
            }}
            onClick={handleClosePrivacy}
          >
            <div
              className="s-card privacy-panel"
              style={{ maxWidth: '480px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                Your data stays with you
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  lineHeight: 1.6,
                }}
              >
                Your accounts, transactions, budgets and goals are saved in this browser&apos;s
                local storage on this device. Nothing is uploaded or synced. Search, reports and
                receipts are generated locally.
              </p>

              <div className="privacy-data-actions">
                <button type="button" onClick={handleExportBackup} className="btn-action-light">
                  <Download size={14} />
                  Export backup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    backupInputRef.current?.click();
                  }}
                  className="btn-action-light"
                >
                  <Upload size={14} />
                  Import backup
                </button>
              </div>
              <input
                ref={backupInputRef}
                className="privacy-file-input"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void handleBackupFile(event);
                }}
              />
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '7px',
                  lineHeight: 1.5,
                }}
              >
                The JSON backup includes accounts, transactions, payees, goals, budgets and
                preferences. Importing replaces the data on this device.
              </p>

              {backupStatus && (
                <div
                  role="status"
                  style={{
                    marginTop: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {backupStatus}
                </div>
              )}

              {pendingImport && (
                <div className="privacy-import-preview">
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Restore this backup?
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      lineHeight: 1.5,
                    }}
                  >
                    Saved {pendingImport.savedAt.slice(0, 10)}. Contains{' '}
                    {pendingImport.transactions.length} transactions,{' '}
                    {pendingImport.accounts.length} accounts, {pendingImport.goals.length} goals
                    and {pendingImport.contacts.length} payees.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        sound.click();
                        setPendingImport(null);
                      }}
                      className="btn-action-light"
                      style={{ flex: 1, padding: '8px 0' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreBackup}
                      className="btn-action-dark"
                      style={{ flex: 1.3, padding: '8px 0' }}
                    >
                      Restore backup
                    </button>
                  </div>
                </div>
              )}

              {storageError && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {storageError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={handleClosePrivacy}
                  className="btn-action-dark"
                  style={{ flex: 1 }}
                >
                  Got it
                </button>
                <button
                  onClick={handleResetLocalData}
                  className="btn-action-light"
                  style={{
                    flex: confirmReset ? 1.4 : 1,
                    color: confirmReset ? '#ef4444' : undefined,
                  }}
                >
                  {confirmReset ? 'Confirm reset' : 'Reset local data'}
                </button>
              </div>
              {confirmReset && (
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    textAlign: 'right',
                  }}
                >
                  This replaces saved changes with the demo data.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modern Mobile Bottom Navigation Dock */}
        <nav className="mobile-bottom-dock" aria-label="Mobile Navigation">
          {TABS.map((tab) => {
            const Icon = DOCK_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => navigate(tab)}
                className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              >
                <div className="mobile-tab-icon-wrap">
                  <Icon size={19} />
                </div>
                <span className="mobile-tab-label">{tab}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default App;
