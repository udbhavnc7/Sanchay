import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  PaymentInput,
  SavingsGoal,
  Transaction,
} from './types/finance';
import { sound } from './utils/audio';
import { formatMoney, isValidAmount, startOfMonth } from './utils/money';
import { OverviewTab } from './components/OverviewTab';
import { ActivityTab } from './components/ActivityTab';
import { CardsTab } from './components/CardsTab';
import { TransfersTab } from './components/TransfersTab';
import { GoalsTab } from './components/GoalsTab';
import { ReportsTab } from './components/ReportsTab';
import { TransactionDrawer } from './components/TransactionDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { RequestMoneyModal } from './components/RequestMoneyModal';
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
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

  const monthStart = useMemo(() => startOfMonth(), []);

  const monthlySpent = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            tx.status === 'Completed' &&
            tx.type === 'debit' &&
            tx.kind !== 'transfer' &&
            new Date(tx.date) >= monthStart
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, monthStart]
  );

  const monthlyBudget = useMemo(
    () => budgets.reduce((sum, budget) => sum + budget.limit, 0),
    [budgets]
  );

  const availableBalance = useMemo(
    () =>
      accounts
        .filter((account) => account.status === 'Active' && account.currency === 'INR')
        .reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  const goalBalance = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.savedAmount, 0),
    [goals]
  );

  const netWorth = availableBalance + goalBalance;

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
        spendByCategory.set(tx.category, (spendByCategory.get(tx.category) ?? 0) + tx.amount);
      });

    budgets.forEach((budget) => {
      const spent = spendByCategory.get(budget.category) ?? 0;
      if (spent > budget.limit) {
        list.push({
          tone: 'warn',
          text: `${budget.category} is ${formatMoney(spent - budget.limit)} over budget`,
        });
      } else if (budget.limit > 0 && spent / budget.limit >= 0.8) {
        list.push({
          tone: 'info',
          text: `${budget.category} is at ${Math.round((spent / budget.limit) * 100)}% of its budget`,
        });
      }
    });

    goals.forEach((goal) => {
      const remaining = goal.targetAmount - goal.savedAmount;
      if (remaining > 0 && remaining <= goal.targetAmount * 0.1) {
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
    if (account.balance < input.amount) {
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
        item.id === account.id ? { ...item, balance: item.balance - input.amount } : item
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
    if (account.balance < input.amount) {
      return {
        ok: false,
        error: `Insufficient balance in ${account.name}. Available ${formatMoney(account.balance)}.`,
      };
    }
    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
    if (input.amount > remaining) {
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
    };

    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id ? { ...item, balance: item.balance - input.amount } : item
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    setGoals((prev) =>
      prev.map((item) =>
        item.id === goal.id ? { ...item, savedAmount: item.savedAmount + input.amount } : item
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
    setBudgets((prev) =>
      prev.map((budget) => (budget.id === budgetId ? { ...budget, limit } : budget))
    );
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
                onClick={() => {
                  sound.click();
                  setShowPrivacy(true);
                }}
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
                <SanchayLogo size="md" />
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  className="btn-action-dark"
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
                      className="s-card"
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
                  className="dock-btn"
                  style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                  title={isAudioEnabled ? 'Mute sounds' : 'Enable sounds'}
                >
                  {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                <div
                  onClick={() => sound.click()}
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
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
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
                availableBalance={availableBalance}
                goalBalance={goalBalance}
                netWorth={netWorth}
                onOpenPayees={() => navigate('Payees')}
                onOpenPlan={() => navigate('Plan')}
                onOpenActivity={() => navigate('Activity')}
                onRequestMoney={() => setShowRequest(true)}
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
            onClick={() => setShowPrivacy(false)}
          >
            <div
              className="s-card"
              style={{ maxWidth: '460px', width: '100%' }}
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
                This prototype keeps every account, payment, budget and goal in local state on this
                device. Nothing is uploaded. Search, reports and receipts are generated locally.
              </p>
              <button
                onClick={() => {
                  sound.click();
                  setShowPrivacy(false);
                }}
                className="btn-action-dark"
                style={{ width: '100%', marginTop: '20px' }}
              >
                Got it
              </button>
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
