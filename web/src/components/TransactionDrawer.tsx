import React, { useEffect, useState } from 'react';
import type { Account, MoneyResult, Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ShieldCheck,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatDateTime, formatMoney } from '../utils/money';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  account?: Account;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => MoneyResult;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  account,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!transaction) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const currency = account?.currency ?? 'INR';
  const isIncome = transaction.kind === 'income';
  const isTransfer = transaction.kind === 'transfer';
  const canEdit = !isTransfer && currency === 'INR';

  const handleDelete = () => {
    sound.click();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setDeleteError('');
      return;
    }

    const result = onDelete(transaction.id);
    if (!result.ok) {
      setDeleteError(result.error ?? 'Could not delete this transaction.');
      return;
    }
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transaction.reference ?? transaction.id);
      setCopied(true);
      sound.click();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const lines = [
      'SANCHAY — TRANSACTION RECORD',
      '============================',
      '',
      `Reference:    ${transaction.reference}`,
      `Status:       ${transaction.status}`,
      `Type:         ${isIncome ? 'Income' : isTransfer ? 'Savings transfer' : 'Expense'}`,
      `Amount:       ${formatMoney(transaction.amount, currency)}`,
      `Title:        ${transaction.title}`,
      `Counterparty: ${transaction.counterparty}`,
      `Account:      ${account?.name ?? 'Unknown account'}`,
      `Category:     ${transaction.category}`,
      `Date:         ${formatDateTime(transaction.date)}`,
      `Fee:          ${formatMoney(transaction.fee ?? 0, currency)}`,
      `Note:         ${transaction.note ?? '—'}`,
      '',
      'Generated locally by Sanchay. No bank connection was used.',
    ];

    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanchay-${transaction.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    sound.success();
  };

  const statusStyles =
    transaction.status === 'Completed'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : transaction.status === 'Pending'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  const StatusIcon =
    transaction.status === 'Completed'
      ? CheckCircle2
      : transaction.status === 'Pending'
        ? Clock
        : XCircle;

  return (
    <div
      className="transaction-drawer-overlay fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="transaction-drawer-panel w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/10">
            <span className="text-xs font-mono-numbers font-bold text-slate-400">
              {transaction.reference}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
                title="Copy reference"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => {
                  sound.click();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Close transaction details"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="my-6 text-center">
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : isTransfer
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {isIncome ? (
                <ArrowDownLeft size={26} />
              ) : isTransfer ? (
                <ArrowLeftRight size={26} />
              ) : (
                <ArrowUpRight size={26} />
              )}
            </div>

            <h2 className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
              {isIncome ? '+' : '−'}
              {formatMoney(transaction.amount, currency)}
            </h2>

            <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {transaction.title}
            </div>

            <div
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles}`}
            >
              <StatusIcon size={13} />
              <span>{transaction.status}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-3.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Counterparty</span>
              <span className="font-bold text-slate-900 dark:text-white text-right">
                {transaction.counterparty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {transaction.category}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Account</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">
                {account?.name ?? 'Unknown account'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Recorded</span>
              <span className="font-mono-numbers text-slate-700 dark:text-slate-300 text-right">
                {formatDateTime(transaction.date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fee</span>
              <span className="font-bold text-emerald-500">
                {formatMoney(transaction.fee ?? 0, currency)}
              </span>
            </div>
            {transaction.note && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Note</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right">
                  {transaction.note}
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck size={13} />
              <span>Local record</span>
            </div>
            This entry exists only in this browser. No bank was contacted and no money moved.
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/70 dark:border-white/10">
          <div className="transaction-drawer-actions">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  onEdit(transaction);
                }}
                className="btn-action-light"
                style={{ flex: 1, padding: '10px 0' }}
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="btn-action-light"
              style={{
                flex: 1,
                padding: '10px 0',
                color: confirmDelete ? '#ef4444' : undefined,
                borderColor: confirmDelete ? 'rgba(239, 68, 68, 0.35)' : undefined,
              }}
            >
              <Trash2 size={14} />
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          </div>

          {confirmDelete && (
            <div className="transaction-delete-warning">
              <AlertTriangle size={13} />
              <span>
                This removes the entry and reverses its account balance. Linked goal progress is
                also reversed.
              </span>
            </div>
          )}
          {deleteError && (
            <div className="transaction-delete-warning" style={{ color: '#ef4444' }}>
              <AlertTriangle size={13} />
              <span>{deleteError}</span>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="w-full btn-primary py-3 text-xs"
            style={{ marginTop: '10px' }}
          >
            <Download size={14} />
            <span>Download receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
