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

export type MainTab =
  | 'Overview'
  | 'Activity'
  | 'Manage'
  | 'Program'
  | 'Account'
  | 'Reports'
  | 'Plan'
  | 'Payees'
  | 'Accounts';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Overview');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Financial state
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

  const handleExecuteTransfer = (recipient: Contact, amount: number) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.currency === 'USD' ? { ...w, balance: Math.max(0, w.balance - amount) } : w
      )
    );
    setMonthlySpent((prev) => prev + amount);

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
    <div style={{ minHeight: '100vh', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      {/* Outer Executive Chassis Frame */}
      <div className="chassis-frame">
        {/* 1. Left Vertical Dock */}
        <aside className="vertical-dock">
          {/* Theme Pill */}
          <div className="dock-pill">
            <button
              onClick={() => toggleTheme(false)}
              className={`dock-btn ${!isDarkMode ? 'active' : ''}`}
              title="Light Mode"
            >
              <Sun size={15} />
            </button>
            <button
              onClick={() => toggleTheme(true)}
              className={`dock-btn ${isDarkMode ? 'active' : ''}`}
              title="Dark Mode"
            >
              <Moon size={15} />
            </button>
          </div>

          {/* Navigation Pill */}
          <div className="dock-pill">
            <button
              onClick={() => {
                sound.click();
                setActiveTab('Overview');
              }}
              className={`dock-btn ${activeTab === 'Overview' ? 'active' : ''}`}
              title="Overview"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveTab('Program');
              }}
              className={`dock-btn ${activeTab === 'Program' ? 'active' : ''}`}
              title="Savings & Goals"
            >
              <Target size={17} />
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveTab('Manage');
              }}
              className={`dock-btn ${activeTab === 'Manage' ? 'active' : ''}`}
              title="Manage Cards"
            >
              <CreditCard size={17} />
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveTab('Account');
              }}
              className={`dock-btn ${activeTab === 'Account' ? 'active' : ''}`}
              title="Contacts & Wire"
            >
              <Users size={17} />
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveTab('Reports');
              }}
              className={`dock-btn ${activeTab === 'Reports' ? 'active' : ''}`}
              title="Reports & Audit"
            >
              <Settings size={17} />
            </button>
          </div>

          {/* Bottom Dock Pill */}
          <div className="dock-pill" style={{ marginTop: 'auto' }}>
            <button
              onClick={() => {
                sound.click();
                setShowOrbPreview(!showOrbPreview);
              }}
              className={`dock-btn ${showOrbPreview ? 'active' : ''}`}
              title="3D Global Nexus Orb"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={() => {
                sound.click();
                alert('Session Secured with Sanchay Cryptographic Key.');
              }}
              className="dock-btn"
              title="Lock Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* 2. Main Executive Content Area */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header Bar */}
          <header className="header-bar">
            {/* Brand Logo */}
            <div
              className="brand-badge"
              onClick={() => {
                sound.click();
                setActiveTab('Overview');
              }}
            >
              <div className="brand-logo-icon">V</div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  Vertix
                </div>
              </div>
            </div>

            {/* Center Navigation Pill */}
            <nav className="top-nav-capsule">
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
                      className={`top-nav-item ${isActive ? 'active' : ''}`}
                    >
                      {tab}
                    </button>
                  );
                }
              )}
            </nav>

            {/* Actions & Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search */}
              <button
                onClick={() => {
                  sound.click();
                  const q = prompt('Search Sanchay Treasury:');
                  if (q) alert(`Searching for "${q}"...`);
                }}
                className="dock-btn"
                style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                title="Search"
              >
                <Search size={15} />
              </button>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    sound.click();
                    setShowNotifications(!showNotifications);
                  }}
                  className="dock-btn"
                  style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', position: 'relative' }}
                  title="Notifications"
                >
                  <Bell size={15} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-orange)' }} />
                </button>

                {showNotifications && (
                  <div className="s-card" style={{ position: 'absolute', right: 0, top: '48px', width: '280px', zIndex: 50, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Alerts</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-orange)', fontWeight: 600, cursor: 'pointer' }}>Clear</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600 }}>
                        +$8,750 Dividend Received
                      </div>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 87, 34, 0.1)', color: 'var(--accent-orange)', fontWeight: 600 }}>
                        Card Limit 30% reached
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                onClick={toggleAudio}
                className="dock-btn"
                style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Profile Pill */}
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
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111317', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                  CX
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.1, color: 'var(--text-main)' }}>
                    Code XR
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.1 }}>
                    hello@codexr.studio
                  </span>
                </div>
                <ChevronDown size={12} color="var(--text-muted)" />
              </div>
            </div>
          </header>

          {/* Optional 3D Orb Banner */}
          {showOrbPreview && (
            <div className="s-card" style={{ marginBottom: '24px', background: '#0a0d14', color: '#ffffff', border: '1px solid rgba(255,87,34,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#ff7043', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Sparkles size={13} />
                  <span>Sanchay Global Liquidity Mesh (Three.js WebGL)</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '6px' }}>
                  Live Multi-Node Quantum Settlement
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
                  Real-time visual node mesh streaming cross-border liquidity routes. Average latency 14ms across global vaults.
                </p>
              </div>
              <div style={{ width: '180px', height: '180px' }}>
                <ThreeDOrb />
              </div>
            </div>
          )}

          {/* Screen Content Views */}
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
              accounts={wallets}
              isFrozen={isCardFrozen}
              onToggleFreeze={() => setIsCardFrozen(!isCardFrozen)}
              monthlyBudget={spendingLimit}
              monthlySpent={monthlySpent}
              onOpenPlan={() => setActiveTab('Program')}
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

      {/* Transaction Slide-over Drawer */}
      <TransactionDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};

export default App;
