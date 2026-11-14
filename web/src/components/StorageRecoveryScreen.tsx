import React, { useState } from 'react';
import { AlertTriangle, Download, FileWarning, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface StorageRecoveryScreenProps {
  raw: string;
  onDownload: () => void;
  onStartFresh: () => void;
}

export const StorageRecoveryScreen: React.FC<StorageRecoveryScreenProps> = ({
  raw,
  onDownload,
  onStartFresh,
}) => {
  const [confirmFresh, setConfirmFresh] = useState(false);
  const preview = raw.length > 600 ? `${raw.slice(0, 600)}…` : raw;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-app, #f6f4ef)',
      }}
    >
      <div
        className="s-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="storage-recovery-title"
        style={{ maxWidth: '560px', width: '100%', padding: '26px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#b45309',
              flexShrink: 0,
            }}
          >
            <FileWarning size={20} />
          </div>
          <div>
            <h1 id="storage-recovery-title" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
              Your saved ledger could not be read
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Sanchay has not overwritten it. Choose what happens next.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: '18px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            fontSize: '11px',
            lineHeight: 1.55,
            color: 'var(--text-main)',
          }}
        >
          The snapshot in local storage is not valid Sanchay data. It may have been corrupted by a
          partial write, a browser extension, or an older tool. Automatic saving is paused so the
          original bytes stay intact.
        </div>

        <pre
          style={{
            marginTop: '12px',
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            fontSize: '10px',
            lineHeight: 1.5,
            color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '180px',
            overflow: 'auto',
          }}
        >
          {preview || '(empty snapshot)'}
        </pre>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          {raw.length.toLocaleString('en-US')} characters in the stored snapshot.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '18px' }}>
          <button
            type="button"
            className="btn-action-light"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '11px 0' }}
            onClick={() => {
              sound.click();
              onDownload();
            }}
          >
            <Download size={14} />
            Download the unreadable snapshot
          </button>

          {!confirmFresh ? (
            <button
              type="button"
              className="btn-action-light"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '11px 0', color: '#b45309' }}
              onClick={() => {
                sound.click();
                setConfirmFresh(true);
              }}
            >
              <RefreshCw size={14} />
              Start a blank ledger instead
            </button>
          ) : (
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '11px', color: '#b91c1c', lineHeight: 1.5 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  This permanently discards the unreadable snapshot and starts empty. Download it
                  first if you want to try recovering it elsewhere.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-action-light"
                  style={{ flex: 1, padding: '8px 0' }}
                  onClick={() => setConfirmFresh(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-action-dark"
                  style={{ flex: 1.3, padding: '8px 0', background: '#ef4444' }}
                  onClick={() => {
                    sound.click();
                    onStartFresh();
                  }}
                >
                  Discard and start blank
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
