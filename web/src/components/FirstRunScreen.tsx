import React from 'react';
import type { FirstRunChoice } from '../data/firstRun';
import { SanchayLogo } from './SanchayLogo';

interface FirstRunScreenProps {
  onChoose: (choice: FirstRunChoice) => void;
}

/**
 * First-launch gate. Blank ledger is the default path; sample data is an
 * explicit, clearly labeled opt-in (release checklist: no fake records in
 * the normal first-run experience).
 */
export const FirstRunScreen: React.FC<FirstRunScreenProps> = ({ onChoose }) => {
  return (
    <div
      className="first-run-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-main, #f6f4ef)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, rgba(17, 19, 23, 0.08))',
          borderRadius: '20px',
          padding: '28px 26px',
          boxShadow: '0 18px 50px rgba(17, 19, 23, 0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <SanchayLogo size="md" className="brand-logo" />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #6b7280)' }}>
            Private finance
          </span>
        </div>

        <h1 id="first-run-title" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main, #111317)', margin: '0 0 8px' }}>
          Welcome to Sanchay
        </h1>
        <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-muted, #6b7280)', margin: '0 0 20px' }}>
          Sanchay keeps your records on this device only — no account, no cloud.
          Choose how to start. You can change this later in Profile settings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={() => onChoose('blank')}
            className="btn-action-dark"
            style={{ padding: '14px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Start with a blank ledger</span>
            <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.75 }}>
              Recommended — nothing exists until you record it yourself.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChoose('sample')}
            className="btn-action-light"
            style={{ padding: '14px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Explore with sample data</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted, #6b7280)' }}>
              Loads fictional demo records, clearly labeled everywhere. Never presented as real finances.
            </span>
          </button>
        </div>

        <p style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)', marginTop: '16px', marginBottom: 0, lineHeight: 1.5 }}>
          Sample data can be removed at any time with “Reset all local data” in Profile settings,
          which returns you to a blank ledger.
        </p>
      </div>
    </div>
  );
};
