// ToastOverlay — renders engine.toastQueue from stats as floating banner stack
import React from 'react';

const COMBO_RANKS = [
  { min: 30, label: 'SS', color: '#fbbf24', glow: '#ff6600' },
  { min: 22, label: 'S',  color: '#fbbf24', glow: '#fbbf24' },
  { min: 15, label: 'A',  color: '#ff3366', glow: '#ff3366' },
  { min: 10, label: 'B',  color: '#c084fc', glow: '#a855f7' },
  { min: 6,  label: 'C',  color: '#00ffcc', glow: '#00ffcc' },
  { min: 3,  label: 'D',  color: '#ffffff', glow: '#7c3aed' },
];

export function getComboRank(combo) {
  for (const r of COMBO_RANKS) {
    if (combo >= r.min) return r;
  }
  return null;
}

export default function ToastOverlay({ toasts = [], scale = 1 }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      data-testid="toast-overlay"
      style={{
        position: 'absolute', top: '18%', left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: 'top center',
        display: 'flex', flexDirection: 'column',
        gap: 8, pointerEvents: 'none', zIndex: 25,
        fontFamily: "'JetBrains Mono', monospace",
        alignItems: 'center',
      }}
    >
      {toasts.map((t, idx) => {
        const phase = t.age / t.ttl;
        const opacity = phase < 0.1 ? phase / 0.1 : phase > 0.85 ? (1 - (phase - 0.85) / 0.15) : 1;
        const y = phase < 0.1 ? (1 - phase / 0.1) * -20 : 0;
        return (
          <div
            key={`${t.text}-${idx}-${t.age}`}
            data-testid={`toast-${t.text.toLowerCase().replace(/\s+/g, '-')}`}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              background: 'rgba(8,4,18,0.85)',
              border: `1px solid ${t.color}55`,
              padding: '8px 22px',
              minWidth: 220,
              textAlign: 'center',
              color: t.color,
              fontSize: 14,
              letterSpacing: '0.3em',
              fontWeight: 700,
              textShadow: `0 0 14px ${t.color}`,
              boxShadow: `0 0 28px ${t.color}33, inset 0 0 14px ${t.color}11`,
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            <div>{t.text}</div>
            {t.sub && (
              <div style={{
                color: '#ffffff88', fontSize: 9, marginTop: 3,
                letterSpacing: '0.2em', textShadow: 'none'
              }}>{t.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
