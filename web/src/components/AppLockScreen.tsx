import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';
import { Lock, Delete, AlertCircle } from 'lucide-react';

interface AppLockScreenProps {
  verify: (pin: string) => Promise<boolean>;
  failures: number;
  lockedUntil: number;
  onFailure: () => void;
  userName: string;
  onUnlock: () => void;
  onResetData?: () => void;
}

const keypadButtonStyle: React.CSSProperties = {
  height: '60px',
  borderRadius: '50%',
  fontSize: '20px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  verify,
  failures,
  lockedUntil,
  onFailure,
  userName,
  onUnlock,
  onResetData,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lockedUntil <= Date.now()) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (lockedUntil <= current) {
        window.clearInterval(timer);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const remainingMs = Math.max(0, lockedUntil - now);
  const isLockedOut = remainingMs > 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isInputDisabled = isLockedOut || isVerifying;

  const submitPin = async (candidate: string) => {
    setIsVerifying(true);
    let unlocked = false;
    try {
      unlocked = await verify(candidate);
    } catch {
      unlocked = false;
    }
    setIsVerifying(false);

    if (unlocked) {
      sound.success();
      onUnlock();
      return;
    }

    sound.error();
    onFailure();
    setError('Incorrect PIN. Please try again.');
    setIsShaking(true);
    window.setTimeout(() => {
      setEnteredPin('');
      setIsShaking(false);
    }, 600);
  };

  const handleDigit = (digit: string) => {
    if (isInputDisabled) return;
    sound.click();
    setError('');
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === 4) {
        void submitPin(next);
      }
    }
  };

  const handleDelete = () => {
    if (isInputDisabled) return;
    sound.click();
    setError('');
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-main, #07090e)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '340px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 87, 34, 0.12)',
            border: '1px solid rgba(255, 87, 34, 0.3)',
            color: '#FF5722',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Lock size={28} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          Welcome back, {userName}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Enter your 4-digit PIN to access Sanchay
        </p>
        <p
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: '2px',
            marginBottom: '24px',
            opacity: 0.8,
          }}
        >
          Access barrier only. This PIN does not encrypt your data.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            transform: isShaking ? 'translateX(6px)' : 'none',
            transition: 'transform 0.1s',
          }}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: isFilled ? '2px solid #FF5722' : '2px solid var(--border-subtle)',
                  background: isFilled ? '#FF5722' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>

        {isLockedOut ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f59e0b',
              fontSize: '12px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={14} />
            <span>
              Too many attempts ({failures}). Try again in {remainingSeconds}s.
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ef4444',
              fontSize: '12px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={14} />
            <span>{isVerifying ? 'Checking PIN...' : error}</span>
          </div>
        ) : (
          <div style={{ height: '18px', marginBottom: '18px' }} />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            width: '100%',
            maxWidth: '280px',
            opacity: isInputDisabled ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={isInputDisabled}
              className="btn-action-light"
              style={keypadButtonStyle}
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={isInputDisabled}
            className="btn-action-light"
            style={keypadButtonStyle}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isInputDisabled}
            className="btn-action-light"
            style={{ ...keypadButtonStyle, fontSize: '16px' }}
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        {onResetData && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'This clears all local data on this device, including the ledger and the PIN. This cannot be undone. Continue?'
                )
              ) {
                onResetData();
              }
            }}
            style={{
              marginTop: '32px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Forgot PIN? Reset local data
          </button>
        )}
      </div>
    </div>
  );
};