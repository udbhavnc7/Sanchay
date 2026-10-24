import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Lock, Delete, AlertCircle } from 'lucide-react';

interface AppLockScreenProps {
  pin: string;
  userName: string;
  onUnlock: () => void;
  onResetData?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  pin,
  userName,
  onUnlock,
  onResetData,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleDigit = (digit: string) => {
    sound.click();
    setError('');
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);

      if (next.length === 4) {
        if (next === pin) {
          sound.success();
          onUnlock();
        } else {
          sound.error();
          setError('Incorrect PIN. Please try again.');
          setIsShaking(true);
          window.setTimeout(() => {
            setEnteredPin('');
            setIsShaking(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
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
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '28px' }}>
          Enter your 4-digit PIN to access Sanchay
        </p>

        {/* PIN indicator dots */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '28px',
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

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            width: '100%',
            maxWidth: '280px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="btn-action-light"
              style={{
                height: '60px',
                borderRadius: '50%',
                fontSize: '20px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="btn-action-light"
            style={{
              height: '60px',
              borderRadius: '50%',
              fontSize: '20px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-action-light"
            style={{
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        {onResetData && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Resetting data will clear this device storage. Are you sure?')) {
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
