import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, X } from 'lucide-react';
import { sound } from '../utils/audio';
import { BACKUP_MIN_PASSWORD_LENGTH } from '../utils/backupCrypto';

interface BackupPasswordModalProps {
  mode: 'export' | 'import';
  fileName?: string;
  busy: boolean;
  error: string;
  onSubmit: (password: string) => void | Promise<void>;
  onClose: () => void;
}

export const BackupPasswordModal: React.FC<BackupPasswordModalProps> = ({
  mode,
  fileName,
  busy,
  error,
  onSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    if (!password) {
      setLocalError('Enter the backup password.');
      return;
    }
    if (mode === 'export') {
      if (password.length < BACKUP_MIN_PASSWORD_LENGTH) {
        setLocalError(
          `Use at least ${BACKUP_MIN_PASSWORD_LENGTH} characters. This password cannot be recovered.`
        );
        return;
      }
      if (password !== confirm) {
        setLocalError('The two passwords do not match.');
        return;
      }
    }
    sound.click();
    void onSubmit(password);
  };

  return (
    <div
      className="sanchay-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="s-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-password-title"
        style={{ maxWidth: '420px', width: '100%', padding: '24px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h3
              id="backup-password-title"
              style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}
            >
              {mode === 'export' ? 'Encrypt this backup' : 'Unlock this backup'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {mode === 'export'
                ? 'The file is encrypted with AES-256-GCM. Store the password separately — without it the backup cannot be opened.'
                : `Enter the password used when ${fileName ? fileName : 'this backup'} was created.`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close backup password"
            className="dock-btn"
            style={{ width: '32px', height: '32px', flexShrink: 0 }}
            onClick={onClose}
            disabled={busy}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div>
            <label htmlFor="backup-password" style={labelStyle}>
              {mode === 'export' ? 'New backup password' : 'Backup password'}
            </label>
            <input
              ref={inputRef}
              id="backup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setLocalError('');
              }}
              style={inputStyle}
            />
          </div>
          {mode === 'export' && (
            <div>
              <label htmlFor="backup-password-confirm" style={labelStyle}>
                Confirm password
              </label>
              <input
                id="backup-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => {
                  setConfirm(event.target.value);
                  setLocalError('');
                }}
                style={inputStyle}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '7px',
              fontSize: '10px',
              lineHeight: 1.5,
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              {mode === 'export'
                ? 'The password is used only on this device and is never stored or sent anywhere.'
                : 'A wrong password and an altered file produce the same error. Nothing is restored until the file is verified.'}
            </span>
          </div>

          {(localError || error) && (
            <p role="alert" style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
              {localError || error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '9px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn-action-light"
              style={{ flex: 1, padding: '10px 0' }}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-action-dark"
              style={{ flex: 1.4, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="spin" /> : <KeyRound size={14} />}
              {busy
                ? mode === 'export'
                  ? 'Encrypting…'
                  : 'Unlocking…'
                : mode === 'export'
                  ? 'Encrypt & save'
                  : 'Unlock backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '12px',
  backgroundColor: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-main)',
  outline: 'none',
};
