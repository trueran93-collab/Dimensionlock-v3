import React, { useState } from 'react';

// Styled menu button with hover state, clip-path corners, and primary/secondary variants.
export default function MenuButton({
  children, onClick, variant = 'primary', large = false, testId, compact = false,
}) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === 'primary';
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: hover
          ? (isPrimary ? 'rgba(168,85,247,0.22)' : 'rgba(0,255,204,0.1)')
          : 'rgba(8,4,20,0.85)',
        border: `1px solid ${hover
          ? (isPrimary ? '#a855f7' : '#00ffcc')
          : (isPrimary ? '#7c3aed66' : '#00ffcc44')}`,
        color: hover
          ? (isPrimary ? '#e8d5ff' : '#00ffcc')
          : '#b8a8d8',
        padding: large
          ? (compact ? '13px 28px' : '16px 48px')
          : (compact ? '10px 18px' : '12px 32px'),
        fontSize: large ? (compact ? 13 : 16) : (compact ? 11 : 13),
        fontWeight: 700,
        letterSpacing: compact ? '0.22em' : '0.35em',
        textTransform: 'uppercase',
        fontFamily: "'Outfit', 'JetBrains Mono', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        maxWidth: large ? (compact ? 320 : 340) : (compact ? 260 : 280),
        boxShadow: hover
          ? `0 0 24px ${isPrimary ? 'rgba(168,85,247,0.35)' : 'rgba(0,255,204,0.25)'}, inset 0 0 14px ${isPrimary ? 'rgba(168,85,247,0.08)' : 'rgba(0,255,204,0.06)'}`
          : 'none',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {isPrimary && (
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          background: hover ? '#a855f7' : '#7c3aed66',
          transform: 'rotate(45deg)',
          transition: 'background 0.2s',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}
