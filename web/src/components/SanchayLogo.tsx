import React from 'react';

interface SanchayLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const SanchayLogo: React.FC<SanchayLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const markDimensions = {
    sm: { width: 28, height: 35 },
    md: { width: 36, height: 45 },
    lg: { width: 44, height: 55 },
    xl: { width: 56, height: 70 },
  }[size];

  const fontSize = {
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}
    >
      {/* Official Gold Compass Mark */}
      <img
        src="/sanchay-mark.png"
        alt="Sanchay Mark"
        className="brand-mark"
        style={{
          width: `${markDimensions.width}px`,
          height: `${markDimensions.height}px`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 8px rgba(162, 131, 64, 0.25))',
        }}
      />

      {showText && (
        <div className="brand-copy" style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            className="brand-name"
            style={{
              fontSize,
              fontWeight: 900,
              letterSpacing: '0.06em',
              lineHeight: 1,
              color: 'var(--text-main)',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            SANCHAY
          </span>
          <span
            className="brand-tagline"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginTop: '3px',
            }}
          >
            Personal finance, privately
          </span>
        </div>
      )}
    </div>
  );
};
