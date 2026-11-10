import React, { useMemo, useState } from 'react';
import type { Account, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import { X, ArrowLeftRight } from 'lucide-react';
import { formatMoney, minorDigits, parseMoneyInput } from '../utils/money';
import { convertAmount } from '../utils/ledgerOps';
import type { TransferInput, TransferOpResult, TransferUpdateInput } from '../utils/ledgerOps';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '7px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '14px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  outline: 'none',
};

interface TransferModalProps {
  accounts: Account[];
  editing?: { transferId: string; legs: Transaction[] } | null;
  onCreate?: (input: TransferInput) => TransferOpResult;
  onUpdate?: (input: TransferUpdateInput) => TransferOpResult;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  accounts,
  editing,
  onCreate,
  onUpdate,
  onClose,
}) => {
  const activeAccounts = useMemo(
    () => accounts.filter((item) => item.status === 'Active'),
    [accounts]
  );

  const sourceLeg = editing?.legs.find((item) => item.type === 'debit') ?? editing?.legs[0];
  const destinationLeg = editing?.legs.find((item) => item.type === 'credit') ?? editing?.legs[1];

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amountInput, setAmountInput] = useState('0');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${mm}-${dd}`;
  });
  const [note, setNote] = useState('');
  const [rateInput, setRateInput] = useState('1');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editing) {
      const src = sourceLeg;
      const dst = destinationLeg;
      if (src) {
        setFromId(src.accountId ?? '');
        setToId(dst?.accountId ?? '');
        setAmountInput(src.amount.toFixed(minorDigits(src.currency)));
        setTitle(src.title === 'Transfer' ? '' : src.title);
        const srcDate = new Date(src.date);
        const mm = String(srcDate.getMonth() + 1).padStart(2, '0');
        const dd = String(srcDate.getDate()).padStart(2, '0');
        setDate(`${srcDate.getFullYear()}-${mm}-${dd}`);
        setNote(src.note ?? '');
        setRateInput(src.transferRate ? String(src.transferRate) : '1');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const fromAccount = accounts.find((item) => item.id === fromId);
  const toAccount = accounts.find((item) => item.id === toId);
  const sourceCurrency = fromAccount?.currency ?? 'INR';
  const destinationCurrency = toAccount?.currency ?? 'INR';
  const crossCurrency = sourceCurrency !== destinationCurrency;
  const rateValue = crossCurrency ? Number(rateInput) : 1;
  const parsedAmount = parseMoneyInput(amountInput, sourceCurrency);
  const destinationAmount = crossCurrency
    ? convertAmount(parsedAmount.ok ? parsedAmount.amount : 0, sourceCurrency, destinationCurrency, rateValue)
    : parsedAmount.ok
      ? parsedAmount.amount
      : 0;

  const isReady = Boolean(editing) || (Boolean(fromAccount) && Boolean(toAccount));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isReady) {
      setError('Choose both accounts to make this transfer.');
      return;
    }
    const input: TransferInput = {
      fromAccountId: fromAccount?.id ?? '',
      toAccountId: toAccount?.id ?? '',
      amount: parsedAmount.ok ? parsedAmount.amount : 0,
      date,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
      rate: crossCurrency ? rateValue : undefined,
    };
    let result: TransferOpResult;
    if (editing && onUpdate) {
      result = onUpdate({ transferId: editing.transferId, ...input });
    } else if (onCreate) {
      result = onCreate(input);
    } else {
      setError('This transfer cannot be saved right now.');
      return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    sound.success();
    onClose();
  };

  const canSubmit = isReady && parsedAmount.ok && destinationAmount > 0;

  return (
    <div
      className="sanchay-modal-overlay"
      role="presentation"
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
    >
      <div
        className="modal-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
        style={{ maxWidth: '460px', padding: '24px', width: '100%' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={16} style={{ color: '#FF5722' }} />
            <h3 id="transfer-title" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              {editing ? 'Edit transfer' : 'Transfer between accounts'}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close transfer" style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>From account</label>
              <select
                value={fromId}
                onChange={(event) => {
                  setFromId(event.target.value);
                  setError('');
                }}
                style={inputStyle}
                disabled={Boolean(editing)}
              >
                {activeAccounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ArrowLeftRight size={14} />
            </div>
            <div>
              <label style={labelStyle}>To account</label>
              <select
                value={toId}
                onChange={(event) => {
                  setToId(event.target.value);
                  setError('');
                }}
                style={inputStyle}
                disabled={Boolean(editing)}
              >
                {activeAccounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Amount</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <input
                    autoFocus={!editing}
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => {
                      setAmountInput(event.target.value.replace(/[^0-9.,]/g, ''));
                      setError('');
                    }}
                    placeholder="0.00"
                    className="font-mono-numbers"
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      minWidth: 0,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {sourceCurrency}
                </span>
              </div>
              {crossCurrency && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateInput}
                    onChange={(event) => {
                      setRateInput(event.target.value.replace(/[^0-9.]/g, ''));
                      setError('');
                    }}
                    style={inputStyle}
                    aria-label="Exchange rate"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    1 {sourceCurrency} = {rateValue ? rateValue : '…'} {destinationCurrency}
                  </span>
                </div>
              )}
              {crossCurrency && parsedAmount.ok && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Moves ≈ {formatMoney(destinationAmount, destinationCurrency)} into{' '}
                  {toAccount?.name ?? 'the destination account'}.
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setError(''); }} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <input type="text" value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Move to savings" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Note (optional)</label>
              <input type="text" value={note} maxLength={120} onChange={(event) => setNote(event.target.value)} style={inputStyle} />
            </div>
          </div>

          {error && (
            <div role="alert" style={{ marginTop: '12px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="dock-btn" style={{ padding: '10px 16px', fontSize: '12px' }}>
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit} className="btn-action-dark" style={{ padding: '10px 18px', fontSize: '12px', opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'default' }}>
              {editing ? 'Save transfer' : 'Create transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  padding: 4,
};

