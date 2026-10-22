import React from 'react';
import type { Transaction } from '../types/finance';
import { sound } from '../utils/audio';
import {
  X,
  CheckCircle2,
  Download,
  FileCheck,
  Shield,
} from 'lucide-react';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const handleDownload = () => {
    sound.success();
    alert(`Downloaded Official Tax Invoice for ${transaction.orderId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-white/10">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/10">
            <span className="text-xs font-mono-numbers font-bold text-slate-400">
              {transaction.orderId}
            </span>
            <button
              onClick={() => {
                sound.click();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Receipt Header */}
          <div className="my-6 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-orange-500/10 text-orange-500 mb-3">
              <FileCheck size={28} />
            </div>

            <h2 className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
              {transaction.type === 'credit' ? '+' : '-'}$
              {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>

            <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {transaction.title}
            </div>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Cleared & Settled</span>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Beneficiary</span>
              <span className="font-bold text-slate-900 dark:text-white">{transaction.recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category</span>
              <span className="font-semibold text-slate-900 dark:text-white">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Settlement Wallet</span>
              <span className="font-semibold text-slate-900 dark:text-white">{transaction.wallet} Corporate Treasury</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timestamp</span>
              <span className="font-mono-numbers text-slate-700 dark:text-slate-300">{transaction.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Network Fee</span>
              <span className="font-mono-numbers text-emerald-500 font-bold">$0.00 (Zero Sanchay Enterprise Fee)</span>
            </div>
          </div>

          {/* Simulated Cryptographic Hash */}
          <div className="mt-6 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-500" />
              <span>Immutable Ledger Verification</span>
            </div>
            <div className="font-mono text-[10px] break-all opacity-70">
              0x8f3c7e4b912a7d6e15904bc3fa2e9d7210bc89456e
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-200/70 dark:border-white/10 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 btn-primary py-3 text-xs"
          >
            <Download size={14} />
            <span>Download Invoice PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
