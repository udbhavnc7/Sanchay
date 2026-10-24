import React, { useState } from 'react';
import type { Account, ConnectAccountInput, Currency } from '../types/finance';
import { sound } from '../utils/audio';
import { X, AlertCircle } from 'lucide-react';
import { parseMoneyInput } from '../utils/money';

interface ConnectAccountModalProps {
  onConnect: (account: ConnectAccountInput) => void;
  onClose: () => void;
}

const POPULAR_PROVIDERS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Paytm Payments Bank',
  'Cash Wallet',
];

const CURRENCIES: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

export const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  onConnect,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('Bank');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [balanceInput, setBalanceInput] = useState('10000');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter an account or bank name.');
      return;
    }

    const parsed = parseMoneyInput(balanceInput, currency);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    sound.success();
    onConnect({
      name: trimmedName,
      type,
      currency,
      balance: parsed.amount,
      status: 'Active',
    });
    onClose();
  };

  const handleSelectProvider = (provider: string) => {
    sound.click();
    setName(provider);
    if (provider.toLowerCase().includes('cash')) {
      setType('Cash');
    } else {
      setType('Bank');
    }
  };

  return (
    <div
      className="sanchay-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
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
        style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              Connect an account
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Add a bank, card, or wallet to your private local ledger.
            </p>
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

        {/* Quick provider pills */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Popular providers
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {POPULAR_PROVIDERS.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleSelectProvider(provider)}
                className="btn-action-light"
                style={{
                  fontSize: '11px',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  border: name === provider ? '1px solid #FF5722' : '1px solid var(--border-subtle)',
                  background: name === provider ? 'rgba(255,87,34,0.1)' : 'var(--bg-pill)',
                  color: name === provider ? '#FF5722' : 'var(--text-main)',
                }}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Account Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Salary Account, SBI Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Account['type'])}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-pill)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                }}
              >
                <option value="Bank">Bank Account</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash Wallet</option>
                <option value="Savings">Savings Vault</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-pill)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                }}
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Starting Balance ({currency})
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 25000"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-pill)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
                fontSize: '11px',
                marginTop: '2px',
              }}
            >
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              marginTop: '4px',
            }}
          >
            Accounts are stored privately in your device&apos;s local storage. Sanchay does not require bank credentials or net banking passwords.
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-action-light"
              style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-action-dark"
              style={{ flex: 1, padding: '10px 0', fontSize: '12px', fontWeight: 700 }}
            >
              Connect Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
