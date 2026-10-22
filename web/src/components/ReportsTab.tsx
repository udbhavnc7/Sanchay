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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-main)' }}>
            Treasury & Audit Reports
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enterprise compliance, cash burn runway, tax provisions, and fiscal statements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', padding: '3px', borderRadius: '9999px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
            {(['Q1', 'Q2', 'YTD'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.click();
                  setActiveRange(r);
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeRange === r ? '#111317' : 'transparent',
                  color: activeRange === r ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button onClick={handleExportStatement} className="btn-action-dark" style={{ padding: '8px 16px', fontSize: '12px' }}>
            <Download size={14} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="s-card">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cash Runway
          </span>
          <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', marginTop: '6px' }}>
            22.4 Mo
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            <TrendingUp size={12} /> +3.2 mo runway added
          </div>
        </div>

        <div className="s-card">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net Cash Burn
          </span>
          <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', marginTop: '6px' }}>
            $24,650<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Stable within Q2 threshold
          </div>
        </div>

        <div className="s-card">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tax Provision Reserve
          </span>
          <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', marginTop: '6px' }}>
            $118,400
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            100% Fully collateralized
          </div>
        </div>

        <div className="s-card">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gross Margin (EBITDA)
          </span>
          <div className="font-mono-numbers" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-orange)', marginTop: '6px' }}>
            68.4%
          </div>
          <div className="font-mono-numbers" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            +4.2% vs target
          </div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <div className="s-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            Expense Allocation Matrix
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Engineering & Cloud Infrastructure (AWS / GCP / Cloudflare)', pct: 42, amt: '$104,200', color: '#ff5722' },
              { label: 'Core Team Payroll & Executive Retainers', pct: 28, amt: '$69,400', color: '#38bdf8' },
              { label: 'Marketing, Growth & User Acquisition', pct: 16, amt: '$39,600', color: '#10b981' },
              { label: 'Legal, Compliance & Banking Reserve', pct: 14, amt: '$34,700', color: '#f59e0b' },
            ].map((row) => (
              <div key={row.label} style={{ padding: '14px', borderRadius: '16px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.label}</span>
                  <span className="font-mono-numbers" style={{ fontWeight: 800, color: 'var(--text-main)' }}>{row.amt} ({row.pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', borderRadius: '9999px', backgroundColor: row.color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="s-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>Audit Certifications</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Cryptographically verified by Sanchay Decentralized Trust Node.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Automated Form 1099 & W8-BEN Generator</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            Last audited: Today at 04:30 PM UTC
          </div>
        </div>
      </div>
    </div>
  );
};
