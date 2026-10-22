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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request money</h3>
            <p className="text-xs text-slate-400 mt-1">
              Write a clear request and copy it to send yourself.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            aria-label="Close request"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Request from</label>
            <select
              value={contactId}
              onChange={(event) => {
                sound.click();
                setContactId(event.target.value);
                setError('');
              }}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {contacts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.bank} · {item.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Amount</label>
            <div className="mt-1 flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1 font-mono-numbers">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
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
                  className="text-2xl font-black text-slate-900 dark:text-white bg-transparent w-36 focus:outline-none"
                />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {contact?.currency ?? 'INR'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">What is it for? (optional)</label>
            <input
              type="text"
              value={note}
              maxLength={60}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. split dinner"
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {requestText && (
            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-2">
                <ArrowDownLeft size={12} />
                Request preview · {reference}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {requestText}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Nothing is sent automatically. Copy the message and share it however you like.
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => {
              setAmountInput('1000');
              setNote('');
              setCopied(false);
              setError('');
            }}
            className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={handleCopy}
            disabled={!amountValid || !contact}
            className="flex-1 btn-primary py-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied request' : 'Copy request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
