import React, { useState, useEffect } from 'react';
import { initialWallets, initialTransactions, initialContacts, initialGoals } from './data/mockData';
import type { Wallet, Transaction, Contact, SavingsGoal } from './types/finance';
import { sound } from './utils/audio';
import { OverviewTab } from './components/OverviewTab';
import { CardsTab } from './components/CardsTab';
import { TransfersTab } from './components/TransfersTab';
import { GoalsTab } from './components/GoalsTab';
import { ReportsTab } from './components/ReportsTab';
import { TransactionDrawer } from './components/TransactionDrawer';
import { ThreeDOrb } from './components/ThreeDOrb';
import {
  Sun,
  Moon,
  LayoutGrid,
  CreditCard,
  Users,
  Target,
  Settings,
  LogOut,
  Search,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type MainTab = 'Overview' | 'Activity' | 'Manage' | 'Program' | 'Account' | 'Reports';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Overview');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Core financial state
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);

  const [spendingLimit, setSpendingLimit] = useState<number>(5500);
  const [monthlySpent, setMonthlySpent] = useState<number>(1635.57);
  const [isCardFrozen, setIsCardFrozen] = useState(false);

  // Inspector and modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrbPreview, setShowOrbPreview] = useState(false);

  // Initialize theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // Quick money transfer handler
  const handleExecuteTransfer = (recipient: Contact, amount: number) => {
    // 1. Deduct from USD wallet
    setWallets((prev) =>
      prev.map((w) =>
        w.currency === 'USD' ? { ...w, balance: Math.max(0, w.balance - amount) } : w
      )
    );

    // 2. Increase monthly spent
    setMonthlySpent((prev) => prev + amount);

    // 3. Add to activity ledger
    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      orderId: 'INV_00' + Math.floor(2700 + Math.random() * 800),
      title: `Instant Wire to ${recipient.name}`,
      category: 'Payroll',
      amount: amount,
      type: 'debit',
      status: 'Completed',
      date: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipient: recipient.name,
      wallet: 'USD',
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleAddMoneyToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g))
    );
    setMonthlySpent((prev) => prev + amount);
  };

  const handleAddNewGoal = (newGoal: SavingsGoal) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleAddContact = (newContact: Contact) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 flex items-start justify-center transition-colors duration-300">
      {/* Outer Executive Tablet / Desktop Curved Chassis */}
      <div className="w-full max-w-[1580px] rounded-[36px] bg-slate-100/90 dark:bg-[#0c0e12] border border-slate-300/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] p-4 md:p-6 lg:p-8 relative">
        <div className="flex gap-6 items-start">
          {/* 1. Left Sidebar Navigation Capsule */}
          <aside className="hidden md:flex flex-col items-center gap-4 py-4 px-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm sticky top-8 z-30">
            {/* Theme Sun/Moon Capsule */}
            <div className="flex flex-col items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 gap-1 border border-slate-200/60 dark:border-white/5">
              <button
                onClick={() => toggleTheme(false)}
                title="Light Mode"
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
                title="Dark Mode"
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-950 text-orange-400 shadow-sm scale-110'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon size={15} />
              </button>
            </div>

            {/* Core Navigation Icons Capsule */}
            <div className="flex flex-col items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
              <button
                onClick={() => {
                  sound.click();
                  setActiveTab('Overview');
                }}
                title="Overview"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  activeTab === 'Overview'
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={18} />
              </button>

              <button
                onClick={() => {
                  sound.click();
                  setActiveTab('Program');
                }}
                title="Planning & Goals"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  activeTab === 'Program'
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Target size={18} />
              </button>

              <button
                onClick={() => {
                  sound.click();
                  setActiveTab('Manage');
                }}
                title="Cards & Limits"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  activeTab === 'Manage'
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <CreditCard size={18} />
              </button>

              <button
                onClick={() => {
                  sound.click();
                  setActiveTab('Account');
                }}
                title="Contacts & Transfers"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  activeTab === 'Account'
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Users size={18} />
              </button>

              <button
                onClick={() => {
                  sound.click();
                  setActiveTab('Reports');
                }}
                title="Reports & Audit"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  activeTab === 'Reports'
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Bottom Actions Capsule */}
            <div className="flex flex-col items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 mt-auto">
              <button
                onClick={() => {
                  sound.click();
                  setShowOrbPreview(!showOrbPreview);
                }}
                title="3D Global Nexus Mesh"
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  showOrbPreview ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-orange-500'
                }`}
              >
                <Sparkles size={18} />
              </button>

              <button
                onClick={() => {
                  sound.click();
                  alert('Session secured. Enterprise credentials active.');
                }}
                title="Log Out / Lock"
                className="p-3 rounded-full text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            </div>
          </aside>

          {/* 2. Main Content Canvas */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Top Bar Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              {/* Brand Logo */}
              <div
                onClick={() => {
                  sound.click();
                  setActiveTab('Overview');
                }}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform shadow-orange-500/30">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white flex items-center gap-1">
                    Vertix
                    <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      PRO
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                    Sanchay Wealth Suite
                  </span>
                </div>
              </div>

              {/* Navigation Pill Menu */}
              <nav className="flex items-center p-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm overflow-x-auto">
                {(['Overview', 'Activity', 'Manage', 'Program', 'Account', 'Reports'] as MainTab[]).map(
                  (tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          sound.click();
                          setActiveTab(tab);
                        }}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md scale-102'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  }
                )}
              </nav>

              {/* Quick Actions & Profile */}
              <div className="flex items-center gap-3">
                {/* Search icon button */}
                <button
                  onClick={() => {
                    sound.click();
                    const q = prompt('Search anything in Sanchay Treasury (Transactions, Payees, Wallets):');
                    if (q) alert(`Searching for "${q}"...`);
                  }}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
                  title="Search (Cmd+K)"
                >
                  <Search size={16} />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sound.click();
                      setShowNotifications(!showNotifications);
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm relative cursor-pointer"
                  >
                    <Bell size={16} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl z-50 animate-fade-in text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                        <span className="font-bold text-slate-900 dark:text-white">Audit Alerts</span>
                        <span className="text-[10px] text-orange-500 font-bold">Mark all read</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <div className="font-bold">Dividend Received</div>
                          <div className="text-[11px] opacity-80">+$8,750.00 from Apex Capital Ventures</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                          <div className="font-bold">Spending Limit Warning</div>
                          <div className="text-[11px] opacity-80">Monthly budget reached 30% of threshold.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sound FX Toggle */}
                <button
                  onClick={toggleAudio}
                  title={isAudioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all shadow-sm cursor-pointer"
                >
                  {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                {/* User Profile Pill */}
                <div
                  onClick={() => sound.click()}
                  className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm cursor-pointer hover:border-orange-500/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    CX
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Code XR
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      hello@codexr.studio
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400" />
                </div>
              </div>
            </header>

            {/* Optional 3D Global Liquidity Mesh Banner */}
            {showOrbPreview && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-black text-white border border-orange-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                <div className="max-w-lg z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-2">
                    <Sparkles size={14} />
                    <span>SANCHAY GLOBAL LIQUIDITY QUANTUM ORB</span>
                  </div>
                  <h3 className="text-2xl font-black font-display text-white">
                    Real-time 3D Cross-Border Settlement Grid
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Visualizing instant liquidity routing across New York, London, Tokyo, and Zurich nodes at 12ms latency.
                  </p>
                  <div className="mt-4 flex gap-3 text-xs font-mono-numbers">
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">TPS: 4,820</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Network: Optimal</span>
                  </div>
                </div>

                <div className="w-48 h-48 shrink-0">
                  <ThreeDOrb />
                </div>
              </div>
            )}

            {/* Active Tab Screen Routing */}
            {activeTab === 'Overview' && (
              <OverviewTab
                wallets={wallets}
                transactions={transactions}
                spendingLimit={spendingLimit}
                monthlySpent={monthlySpent}
                onSetSpendingLimit={setSpendingLimit}
                onOpenTransfer={() => setActiveTab('Account')}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Manage' && (
              <CardsTab
                isFrozen={isCardFrozen}
                onToggleFreeze={() => setIsCardFrozen(!isCardFrozen)}
                spendingLimit={spendingLimit}
                monthlySpent={monthlySpent}
                onSetSpendingLimit={setSpendingLimit}
              />
            )}

            {activeTab === 'Account' && (
              <TransfersTab
                contacts={contacts}
                onExecuteTransfer={handleExecuteTransfer}
                onAddContact={handleAddContact}
              />
            )}

            {activeTab === 'Program' && (
              <GoalsTab
                goals={goals}
                onAddMoneyToGoal={handleAddMoneyToGoal}
                onAddNewGoal={handleAddNewGoal}
              />
            )}

            {activeTab === 'Activity' && (
              <OverviewTab
                wallets={wallets}
                transactions={transactions}
                spendingLimit={spendingLimit}
                monthlySpent={monthlySpent}
                onSetSpendingLimit={setSpendingLimit}
                onOpenTransfer={() => setActiveTab('Account')}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'Reports' && <ReportsTab />}
          </main>
        </div>
      </div>

      {/* Slide-over Transaction Inspector */}
      <TransactionDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};

export default App;
