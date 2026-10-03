import React from 'react';

interface NiramayaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const NiramayaLogoIcon: React.FC<{ size?: number }> = ({ size = 38 }) => {
  const [imgError, setImgError] = React.useState(false);

  if (!imgError) {
    return (
      <img
        src="/niramaya-emblem.png"
        alt="Niramaya Hospital Emblem"
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: '50%',
        }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#ffffff" />

      {/* Two Parent Heads (Magenta) */}
      <circle cx="34" cy="18" r="9" fill="#E6007E" />
      <circle cx="62" cy="18" r="9" fill="#E6007E" />

      {/* Baby Head (Magenta) */}
      <circle cx="84" cy="52" r="5.5" fill="#E6007E" />

      {/* Left Figure */}
      <path
        d="M12 85 L28 30 L42 30 L49 52 C45 62 38 68 32 68 C27 68 22 74 12 85 Z"
        fill="#00A896"
      />

      {/* Right Figure and Cradle */}
      <path
        d="M55 30 L67 30 L64 52 C63 64 74 65 88 54 L92 60 C76 75 58 72 56 50 Z"
        fill="#00A896"
      />

      {/* Lower swoop */}
      <path
        d="M42 85 L50 85 L54 74 C50 71 45 68 41 62 C46 68 53 71 58 72 C68 74 82 72 95 62 L94 67 C78 79 62 78 52 74 Z"
        fill="#00A896"
      />
    </svg>
  );
};

export const NiramayaLogo: React.FC<NiramayaLogoProps> = ({
  size = 'md',
  showSubtext = true,
}) => {
  const iconSize = size === 'sm' ? 34 : size === 'lg' ? 48 : 40;
  const titleSize = size === 'sm' ? '1.18rem' : size === 'lg' ? '1.5rem' : '1.32rem';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        userSelect: 'none',
        minWidth: 0,
      }}
    >
      {/* Stylized Family Icon */}
      <div
        style={{
          width: `${iconSize + 6}px`,
          height: `${iconSize + 6}px`,
          borderRadius: '50%',
          background: '#ffffff',
          border: '1.5px solid rgba(0, 194, 203, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 194, 203, 0.22)',
          flexShrink: 0,
          overflow: 'hidden',
          padding: '2px',
        }}
      >
        <NiramayaLogoIcon size={iconSize} />
      </div>

      {/* Typography Stack */}
      <div className="niramaya-logo-text" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Brand Name */}
        <div
          className="niramaya-logo-title"
          style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: '#00C2CB', fontWeight: 900 }}>Niramaya</span>
          <span
            className="niramaya-logo-hospital"
            style={{
              fontSize: '0.68em',
              fontWeight: 800,
              color: '#FF2A85',
              letterSpacing: '0.12em',
              marginLeft: '0.35rem',
              textTransform: 'uppercase',
            }}
          >
            HOSPITAL
          </span>
        </div>

        {/* Tagline / Subtitle */}
        {showSubtext && (
          <div
            className="niramaya-logo-subtext"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '3px',
            }}
          >
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#FF2A85',
                letterSpacing: '0.04em',
                background: 'rgba(255, 42, 133, 0.1)',
                padding: '0.1rem 0.4rem',
                borderRadius: '3px',
                border: '1px solid rgba(255, 42, 133, 0.2)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Multispeciality • Laparoscopy • Fertility
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
