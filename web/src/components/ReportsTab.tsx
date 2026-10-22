import React, { useState } from 'react';
import { sound } from '../utils/audio';
import {
  TrendingUp,
  Download,
  CheckCircle2,
} from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'Q1' | 'Q2' | 'YTD'>('Q2');

  const handleExportStatement = () => {
    sound.success();
    alert('Generating Sanchay Apex Certified Audit Statement (PDF). Downloading...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Treasury & Audit Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise compliance, cash burn runway, tax provisions, and fiscal statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-white/10 text-xs">
            {(['Q1', 'Q2', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.click();
                  setActiveRange(r);
                }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                  activeRange === r
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button onClick={handleExportStatement} className="btn-primary text-xs py-2">
            <Download size={14} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Cash Runway
          </span>
          <div className="mt-2 text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
            22.4 Mo
          </div>
          <div className="mt-1 text-xs text-emerald-500 font-bold flex items-center gap-1">
            <TrendingUp size={12} /> +3.2 mo runway added
          </div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Net Cash Burn
          </span>
          <div className="mt-2 text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
            $24,650<span className="text-sm text-slate-400">/mo</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">Stable within Q2 threshold</div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tax Provision Reserve
          </span>
          <div className="mt-2 text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
            $118,400
          </div>
          <div className="mt-1 text-xs text-emerald-500 font-bold">100% Fully collateralized</div>
        </div>

        <div className="glass-panel p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gross Margin (EBITDA)
          </span>
          <div className="mt-2 text-3xl font-black font-mono-numbers text-orange-500">
            68.4%
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono-numbers">+4.2% vs target</div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Expense Allocation Matrix
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Engineering & Cloud Infrastructure (AWS / GCP / Cloudflare)', pct: 42, amt: '$104,200', color: '#FF5722' },
              { label: 'Core Team Payroll & Executive Retainers', pct: 28, amt: '$69,400', color: '#38BDF8' },
              { label: 'Marketing, Growth & User Acquisition', pct: 16, amt: '$39,600', color: '#10B981' },
              { label: 'Legal, Compliance & Banking Reserve', pct: 14, amt: '$34,700', color: '#F59E0B' },
            ].map((row) => (
              <div key={row.label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{row.label}</span>
                  <span className="font-bold font-mono-numbers text-slate-900 dark:text-white">{row.amt} ({row.pct}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Audit Certifications</h3>
            <p className="text-xs text-slate-400 mb-4">
              Cryptographically verified by Sanchay Decentralized Trust Node.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={16} />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={16} />
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={16} />
                <span>Automated Form 1099 & W8-BEN Generator</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 text-center">
            <span className="text-[11px] text-slate-400">
              Last audited: Today at 04:30 PM UTC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
