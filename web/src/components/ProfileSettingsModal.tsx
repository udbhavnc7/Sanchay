import React, { useState } from 'react';
import type {
  Account,
  PreferredUpiApp,
  UserProfile,
} from '../types/finance';
import { sound } from '../utils/audio';
import {
  User,
  Shield,
  CreditCard,
  Lock,
  Plus,
  Trash2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Check,
  X,
  Smartphone,
  CheckCircle2,
  Landmark,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { formatMoney } from '../utils/money';

interface ProfileSettingsModalProps {
  userProfile: UserProfile;
  accounts: Account[];
  isDarkMode: boolean;
  isAudioEnabled: boolean;
  appLockPin?: string;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdatePreferences: (updates: {
    isDarkMode?: boolean;
    isAudioEnabled?: boolean;
    isCardFrozen?: boolean;
    appLockPin?: string;
  }) => void;
  onToggleAccountStatus: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetData: () => void;
  onLockApp: () => void;
  onClose: () => void;
  onOpenConnectModal: () => void;
}

type SettingsTab = 'profile' | 'accounts' | 'upi' | 'security' | 'data';

const UPI_APPS: PreferredUpiApp[] = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'BHIM',
  'Cred',
  'Navi',
  'Other',
];

const AVATAR_COLORS = [
  '#111317',
  '#FF5722',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  userProfile,
  accounts,
  isDarkMode,
  isAudioEnabled,
  appLockPin,
  onUpdateProfile,
  onUpdatePreferences,
  onToggleAccountStatus,
  onDeleteAccount,
  onExportBackup,
  onImportBackup,
  onResetData,
  onLockApp,
  onClose,
  onOpenConnectModal,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile form state
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [upiId, setUpiId] = useState(userProfile.upiId ?? '');
  const [preferredUpiApp, setPreferredUpiApp] = useState<PreferredUpiApp>(
    userProfile.preferredUpiApp ?? 'Google Pay'
  );
  const [avatarColor, setAvatarColor] = useState(userProfile.avatarColor ?? '#111317');
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Reset confirmation
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.success();
    onUpdateProfile({
      name: name.trim() || 'User',
      email: email.trim() || 'user@sanchay.local',
      upiId: upiId.trim() || undefined,
      preferredUpiApp,
      avatarColor,
    });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits (0-9).');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    sound.success();
    onUpdatePreferences({ appLockPin: newPin });
    setNewPin('');
    setConfirmPin('');
    setPinSuccess('PIN lock configured successfully.');
  };

  const handleRemovePin = () => {
    sound.click();
    onUpdatePreferences({ appLockPin: '' });
    setPinSuccess('PIN lock removed.');
    setNewPin('');
    setConfirmPin('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
    }
  };

  return (
    <div
      className="sanchay-modal-overlay"
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
      onClick={onClose}
    >
      <div
        className="s-card animate-fade-in"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: avatarColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              {name.trim()[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                {name || 'User Profile'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {email || 'Account & Preferences'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dock-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-pill)',
            overflowX: 'auto',
          }}
        >
          {(
            [
              { id: 'profile', label: 'Profile', icon: <User size={13} /> },
              { id: 'accounts', label: `Accounts (${accounts.length})`, icon: <CreditCard size={13} /> },
              { id: 'upi', label: 'UPI Apps', icon: <Smartphone size={13} /> },
              { id: 'security', label: 'Security & PIN', icon: <Shield size={13} /> },
              { id: 'data', label: 'Preferences & Backup', icon: <Download size={13} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.click();
                setActiveTab(tab.id);
              }}
              style={{
                padding: '11px 16px',
                fontSize: '11px',
                fontWeight: 700,
                color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid #FF5722' : '2px solid transparent',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Avatar Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {AVATAR_COLORS.map((col) => (
                    <div
                      key={col}
                      onClick={() => setAvatarColor(col)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: col,
                        cursor: 'pointer',
                        border: avatarColor === col ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: avatarColor === col ? '0 0 0 2px #FF5722' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Udbhav"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. hello@sanchay.app"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Your Primary UPI ID (optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. udbhav@okhdfcbank"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Used for prefilling your details in request money text messages.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                {profileSaved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px' }}>
                    <CheckCircle2 size={14} />
                    <span>Profile saved!</span>
                  </div>
                ) : <div />}
                <button
                  type="submit"
                  className="btn-action-dark"
                  style={{ padding: '9px 20px', fontSize: '12px', fontWeight: 700 }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Accounts */}
          {activeTab === 'accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Connected Accounts ({accounts.length})
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Active accounts are included in net balance and transaction options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    onOpenConnectModal();
                  }}
                  className="btn-action-dark"
                  style={{ padding: '7px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Plus size={13} />
                  Connect Account
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {accounts.map((account) => {
                  const getIcon = () => {
                    if (account.type === 'Bank') return <Landmark size={15} />;
                    if (account.type === 'Cash') return <Wallet size={15} />;
                    if (account.type === 'Card') return <CreditCard size={15} />;
                    return <PiggyBank size={15} />;
                  };

                  return (
                    <div
                      key={account.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'var(--bg-pill)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: account.status === 'Active' ? 1 : 0.6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FF5722',
                          }}
                        >
                          {getIcon()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {account.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {account.type} · {account.currency}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-mono-numbers" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                            {formatMoney(account.balance, account.currency)}
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleAccountStatus(account.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: account.status === 'Active' ? '#10b981' : '#ef4444',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {account.status}
                          </button>
                        </div>

                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete account "${account.name}"?`)) {
                                onDeleteAccount(account.id);
                              }
                            }}
                            className="dock-btn"
                            style={{ width: '28px', height: '28px', color: '#ef4444' }}
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UPI Apps */}
          {activeTab === 'upi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Preferred UPI App
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Choose which UPI app you prefer to use when authorising external payments.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {UPI_APPS.map((app) => {
                  const isSelected = preferredUpiApp === app;
                  return (
                    <div
                      key={app}
                      onClick={() => {
                        sound.click();
                        setPreferredUpiApp(app);
                        onUpdateProfile({
                          ...userProfile,
                          preferredUpiApp: app,
                        });
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(255, 87, 34, 0.08)' : 'var(--bg-pill)',
                        border: isSelected ? '1px solid #FF5722' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={16} color={isSelected ? '#FF5722' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)' }}>
                          {app}
                        </span>
                      </div>
                      {isSelected && <Check size={14} color="#FF5722" />}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 152, 0, 0.08)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                  Path A Payment Assistance Model:
                </div>
                Sanchay provides payment assistance by copying payee details for entry into your external UPI app. Sanchay does not connect directly to the UPI network or process money transfers.
              </div>
            </div>
          )}

          {/* TAB 4: Security & PIN */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  App Lock & Privacy PIN
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Protect your financial ledger with an optional 4-digit PIN lock.
                </p>
              </div>

              {appLockPin ? (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={18} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        PIN Lock is Active
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        4-digit security code enabled
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onLockApp}
                      className="btn-action-dark"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Lock Now
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="btn-action-light"
                      style={{ padding: '6px 12px', fontSize: '11px', color: '#ef4444' }}
                    >
                      Remove PIN
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Create 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-pill)',
                          color: 'var(--text-main)',
                          fontSize: '16px',
                          textAlign: 'center',
                          letterSpacing: '8px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-pill)',
                          color: 'var(--text-main)',
                          fontSize: '16px',
                          textAlign: 'center',
                          letterSpacing: '8px',
                        }}
                      />
                    </div>
                  </div>

                  {pinError && (
                    <div style={{ color: '#ef4444', fontSize: '11px' }}>{pinError}</div>
                  )}
                  {pinSuccess && (
                    <div style={{ color: '#10b981', fontSize: '11px' }}>{pinSuccess}</div>
                  )}

                  <button
                    type="submit"
                    className="btn-action-dark"
                    style={{ alignSelf: 'flex-start', padding: '9px 18px', fontSize: '12px', fontWeight: 700 }}
                  >
                    Set PIN Lock
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: Preferences & Backup */}
          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Appearance & Audio
                </h4>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onUpdatePreferences({ isDarkMode: !isDarkMode });
                    }}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}
                  >
                    {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      onUpdatePreferences({ isAudioEnabled: !isAudioEnabled });
                    }}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}
                  >
                    {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    <span>{isAudioEnabled ? 'Audio On' : 'Muted'}</span>
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Local Backup & Restore
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '10px' }}>
                  All data is stored locally in this browser. Export a JSON backup to transfer or save your data.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <Download size={14} />
                    Export Backup
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <Upload size={14} />
                    Import Backup
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                  Reset Device Data
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '10px' }}>
                  Clear all local data and restore initial demo balances and categories.
                </p>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="btn-action-light"
                    style={{ color: '#ef4444', padding: '8px 14px', fontSize: '11px' }}
                  >
                    Reset to Demo Data
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        sound.click();
                        setConfirmReset(false);
                        onResetData();
                      }}
                      className="btn-action-dark"
                      style={{ background: '#ef4444', padding: '8px 14px', fontSize: '11px' }}
                    >
                      Yes, reset all data
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="btn-action-light"
                      style={{ padding: '8px 14px', fontSize: '11px' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
