import React, { useMemo, useState } from 'react';
import type { Contact } from '../types/finance';
import { sound } from '../utils/audio';
import {
  X,
  Copy,
  Check,
  ArrowDownLeft,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatMoney, isValidAmount } from '../utils/money';

interface RequestMoneyModalProps {
  contacts: Contact[];
  onClose: () => void;
}

export const RequestMoneyModal: React.FC<RequestMoneyModalProps> = ({
  contacts,
  onClose,
}) => {
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [amountInput, setAmountInput] = useState('1000');
  const [note, setNote] = useState('');
  const [reference] = useState(() => `REQ-${String(Date.now()).slice(-6)}`);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const contact = contacts.find((item) => item.id === contactId);
  const amount = Number.parseFloat(amountInput);
  const amountValid = isValidAmount(amount);

  const requestText = useMemo(() => {
    if (!contact || !amountValid) return '';
    const notePart = note.trim() ? ` for ${note.trim()}` : '';
    return `Hi ${contact.name}, could you send me ${formatMoney(
      amount,
      contact.currency
    )}${notePart}? Reference: ${reference}.`;
  }, [contact, amount, amountValid, note, reference]);

  const handleCopy = async () => {
    if (!amountValid) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!requestText) return;

    try {
      await navigator.clipboard.writeText(requestText);
      setCopied(true);
      sound.success();
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy. Select the request text and copy it manually.');
    }
  };

  return (
    <div
      className="modal-overlay-backdrop animate-fade-in"
      onClick={onClose}
    >
      <div
        className="modal-dialog-panel request-modal-panel"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Request money
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Write a clear request and copy it to send yourself.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-pill)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            aria-label="Close request"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Request from
            </label>
            <select
              value={contactId}
              onChange={(event) => {
                sound.click();
                setContactId(event.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {contacts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.bank} · {item.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Amount
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderRadius: '18px',
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)' }}>
                  {contact?.currency === 'USD' ? '$' : contact?.currency === 'EUR' ? '€' : '₹'}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) => {
                    setAmountInput(event.target.value.replace(/[^0-9.]/g, ''));
                    setError('');
                  }}
                  className="font-mono-numbers"
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: 'var(--text-main)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '160px',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {contact?.currency ?? 'INR'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              What is it for? (optional)
            </label>
            <input
              type="text"
              value={note}
              maxLength={60}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. split dinner"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '16px',
                fontSize: '13px',
                backgroundColor: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>

          {requestText && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '18px',
                backgroundColor: 'rgba(255, 87, 34, 0.06)',
                border: '1px solid rgba(255, 87, 34, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-orange)',
                  marginBottom: '8px',
                }}
              >
                <ArrowDownLeft size={13} />
                <span>Request preview · {reference}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                {requestText}
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '12px',
                color: '#ef4444',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>
              Nothing is sent automatically. Copy the message and share it however you like.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
          <button
            onClick={() => {
              setAmountInput('1000');
              setNote('');
              setCopied(false);
              setError('');
            }}
            className="btn-action-light"
            style={{ padding: '13px 20px', gap: '6px', fontSize: '13px' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!amountValid || !contact}
            className="btn-action-dark"
            style={{ flex: 1, padding: '13px 24px', fontSize: '13px', gap: '8px', opacity: !amountValid || !contact ? 0.4 : 1 }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied to clipboard' : 'Copy request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
