import React, { useEffect, useState } from 'react';
import type {
  Account,
  CategoryDefinition,
  MoneyResult,
  Transaction,
} from '../types/finance';
import type { RefundInput } from '../utils/ledgerOps';
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
  RotateCcw,
} from 'lucide-react';
import { formatDateTime, formatMoney, minorDigits, parseMoneyInput } from '../utils/money';
import { saveTextFile } from '../utils/fileSave';
import { categoryLabel } from '../utils/categories';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  account?: Account;
  categoryDefinitions?: CategoryDefinition[];
  refundableAmount?: number;
  onRefund?: (input: RefundInput) => MoneyResult;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => MoneyResult;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  account,
  categoryDefinitions,
  refundableAmount = 0,
  onRefund,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    if (!transaction) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const currency = account?.currency ?? transaction.currency ?? 'INR';
  const isIncome = transaction.kind === 'income';
  const isTransfer = transaction.kind === 'transfer';
  const isRefund = transaction.kind === 'refund' || Boolean(transaction.refundOfId);
  const canEdit = isTransfer ? Boolean(transaction.transferId) : Boolean(transaction.accountId);
  const categoryName = categoryLabel(transaction.category, categoryDefinitions ?? []);
  const canRefund =
    Boolean(onRefund) &&
    refundableAmount > 0 &&
    transaction.type === 'debit' &&
    transaction.status === 'Completed' &&
    !isTransfer &&
    !isRefund &&
    Boolean(transaction.accountId);

  const submitRefund = () => {
    if (!onRefund) return;
    const parsed = parseMoneyInput(refundAmount, currency);
    if (!parsed.ok) {
      setRefundError(parsed.error ?? `Enter a valid ${currency} amount.`);
      return;
    }
    if (parsed.amount > refundableAmount) {
      setRefundError(`You can refund up to ${formatMoney(refundableAmount, currency)}.`);
      return;
    }
    const result = onRefund({
      transactionId: transaction.id,
      amount: parsed.amount,
      note: refundNote,
    });
    if (!result.ok) {
      setRefundError(result.error ?? 'Could not record this refund.');
      return;
    }
    sound.success();
    onClose();
  };

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
      `Type:         ${isIncome ? 'Income' : isRefund ? 'Refund' : isTransfer ? (transaction.transferId ? 'Transfer' : 'Savings transfer') : 'Expense'}`,
      `Amount:       ${formatMoney(transaction.amount, currency)}`,
      `Title:        ${transaction.title}`,
      `Counterparty: ${transaction.counterparty}`,
      `Account:      ${account?.name ?? 'Unknown account'}`,
      `Category:     ${categoryName}`,
      `Date:         ${formatDateTime(transaction.date)}`,
      `Fee:          ${formatMoney(transaction.fee ?? 0, currency)}`,
      transaction.tags?.length ? `Tags:         ${transaction.tags.join(', ')}` : '',
      transaction.recipient ? `Payee UPI ID: ${transaction.recipient}` : '',
      transaction.userReference ? `User Reference / UTR: ${transaction.userReference}` : '',
      transaction.paymentAttemptId ? `Payment Attempt ID: ${transaction.paymentAttemptId}` : '',
      `Note:         ${transaction.note ?? '—'}`,
      '',
      transaction.paymentAttemptId
        ? 'Notice: Recorded in Sanchay; marked paid by you; not bank-verified.'
        : 'Generated locally by Sanchay. No bank connection was used.',
    ].filter(Boolean);

    saveTextFile(`sanchay-${transaction.reference}.txt`, lines.join('\r\n'), 'text/plain');
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
                {categoryName}
              </span>
            </div>
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Tags</span>
                <span className="flex flex-wrap justify-end gap-1">
                  {transaction.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
            )}
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
            {transaction.recipient && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Payee UPI ID</span>
                <span className="font-mono-numbers font-semibold text-slate-900 dark:text-white text-right">
                  {transaction.recipient}
                </span>
              </div>
            )}
            {transaction.userReference && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Reference / UTR</span>
                <span className="font-mono-numbers font-semibold text-slate-900 dark:text-white text-right">
                  {transaction.userReference}
                </span>
              </div>
            )}
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
              <span>
                {transaction.paymentAttemptId
                  ? 'Marked paid by you — not verified by Sanchay'
                  : 'Local record'}
              </span>
            </div>
            {transaction.paymentAttemptId
              ? 'Recorded in Sanchay based on your confirmation. Sanchay does not connect to the UPI network and has not independently verified settlement with your bank.'
              : 'This entry exists only in this browser. No bank was contacted and no money moved.'}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/70 dark:border-white/10">
          {canRefund && (
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
              {!showRefund ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    setShowRefund(true);
                    setRefundAmount(
                      refundableAmount.toFixed(minorDigits(currency))
                    );
                    setRefundError('');
                  }}
                  className="btn-action-light w-full"
                  style={{ padding: '10px 0' }}
                >
                  <RotateCcw size={14} />
                  Record a refund
                </button>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitRefund();
                  }}
                  className="space-y-2.5"
                >
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Refund up to {formatMoney(refundableAmount, currency)} to{' '}
                    {account?.name ?? 'the original account'}.
                  </div>
                  <input
                    value={refundAmount}
                    onChange={(event) => {
                      setRefundAmount(event.target.value);
                      setRefundError('');
                    }}
                    inputMode="decimal"
                    placeholder={`0.${'0'.repeat(Math.max(1, minorDigits(currency)))}`}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono-numbers bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    aria-label="Refund amount"
                  />
                  <input
                    value={refundNote}
                    onChange={(event) => setRefundNote(event.target.value)}
                    placeholder="Note (optional)"
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    aria-label="Refund note"
                  />
                  {refundError && (
                    <div className="transaction-delete-warning" style={{ color: '#ef4444' }}>
                      <AlertTriangle size={13} />
                      <span>{refundError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 py-2.5 text-xs">
                      Save refund
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.click();
                        setShowRefund(false);
                        setRefundError('');
                      }}
                      className="btn-action-light flex-1 py-2.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
