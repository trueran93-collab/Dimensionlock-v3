import React, { useEffect, useState } from 'react';
import { soundEngine } from '../game/sound.js';

/**
 * Shown when the player walks through the cathedral door on a cleared floor.
 * Displays stats + flavor text + upgrade prompt.
 */
const FLAVOR_TEXTS = [
  '"The Endless shudders. Another layer falls."',
  '"Souls harvested. The Lurker hears your steps."',
  '"Sorrow-Eater drinks deep. The threshold parts."',
  '"Death\'s grip weakens. Ava\'s breath returns, faint."',
  '"Worlds collapse behind you. Walk forward, Reaper."',
  '"The veil cracks. You are closer than they wished."',
];

export default function FloorComplete({ result, onContinue, onMenu }) {
  const [visible, setVisible] = useState(false);
  const [flavor] = useState(() => FLAVOR_TEXTS[(result?.floor || 1) % FLAVOR_TEXTS.length]);

  useEffect(() => {
    soundEngine.playFloorCompleteSting && soundEngine.playFloorCompleteSting();
    soundEngine.pauseMusic && soundEngine.pauseMusic();
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      data-testid="floor-complete"
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(20,8,40,0.95) 0%, rgba(0,0,0,0.95) 75%)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 80,
        fontFamily: "'Outfit', sans-serif",
        color: '#e8e0f0',
        userSelect: 'none',
        padding: '24px 16px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* Top decorative rule */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -10}px)`,
        transition: 'all 0.7s ease 0.15s',
      }}>
        <div style={{ height: 1, width: 80, background: 'linear-gradient(to right, transparent, #a855f7)' }} />
        <div style={{ width: 10, height: 10, background: '#a855f7', transform: 'rotate(45deg)', boxShadow: '0 0 20px #a855f7' }} />
        <div style={{ height: 1, width: 80, background: 'linear-gradient(to left, transparent, #a855f7)' }} />
      </div>

      {/* Floor cleared tag */}
      <p style={{
        color: '#7c3aed',
        fontSize: 'clamp(11px, 1.4vw, 13px)',
        letterSpacing: '0.6em',
        textTransform: 'uppercase',
        margin: '0 0 12px',
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: '0 0 16px #a855f7',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -8}px)`,
        transition: 'all 0.7s ease 0.3s',
      }}>
        FLOOR {result?.floor || 1} CLEARED
      </p>

      {/* Big title */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        color: '#fff',
        fontSize: 'clamp(2.6rem, 7vw, 5rem)',
        fontWeight: 700,
        margin: '0 0 6px',
        textShadow: '0 0 36px #a855f7, 0 0 80px rgba(168,85,247,0.4)',
        letterSpacing: '0.06em',
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 12}px)`,
        transition: 'all 0.8s ease 0.4s',
        textAlign: 'center',
      }}>
        The Veil Parts
      </h1>

      {/* Flavor */}
      <p style={{
        color: '#9888c0',
        fontStyle: 'italic',
        fontSize: 'clamp(13px, 1.6vw, 16px)',
        fontFamily: "'Cormorant Garamond', serif",
        margin: '14px 0 36px',
        maxWidth: 540,
        textAlign: 'center',
        lineHeight: 1.6,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 6}px)`,
        transition: 'all 0.8s ease 0.6s',
      }}>
        {flavor}
      </p>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(80px, 130px))',
        gap: 20,
        marginBottom: 40,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 10}px)`,
        transition: 'all 0.8s ease 0.7s',
      }}>
        {[
          ['SCORE', result?.score || 0],
          ['KILLS', result?.kills || 0],
          ['COMBO', result?.bestCombo || 0],
        ].map(([label, val]) => (
          <div key={label} style={{
            background: 'rgba(8,4,20,0.85)',
            border: '1px solid rgba(124,58,237,0.35)',
            padding: '14px 10px',
            textAlign: 'center',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}>
            <div style={{
              color: '#7c3aed', fontSize: 10, letterSpacing: '0.3em',
              fontFamily: "'JetBrains Mono', monospace", marginBottom: 6,
            }}>{label}</div>
            <div style={{
              color: '#fff', fontSize: 'clamp(18px, 3vw, 26px)',
              fontWeight: 700, textShadow: '0 0 12px #a855f7',
              fontFamily: "'JetBrains Mono', monospace",
            }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 14}px)`,
        transition: 'all 0.8s ease 0.85s',
      }}>
        <button
          data-testid="floor-continue-button"
          onClick={onContinue}
          style={{
            background: 'transparent', color: '#00ffcc',
            border: '2px solid #00ffcc',
            padding: '14px 48px', fontSize: 14,
            fontWeight: 700, letterSpacing: '0.35em',
            textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '0 0 22px rgba(0,255,204,0.3)',
            fontFamily: "'Outfit', sans-serif",
            minWidth: 260,
            transition: 'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,204,0.1)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,255,204,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = '0 0 22px rgba(0,255,204,0.3)'; }}
        >
          Descend Deeper
        </button>
        <button
          data-testid="floor-menu-button"
          onClick={onMenu}
          style={{
            background: 'transparent', color: '#7c3aed',
            border: '2px solid #7c3aed55',
            padding: '12px 40px', fontSize: 12,
            fontWeight: 700, letterSpacing: '0.3em',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            minWidth: 260,
            transition: 'all 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.borderColor = '#a855f7'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#7c3aed55'; }}
        >
          Abandon Run
        </button>
      </div>

      {/* Floor counter dust at bottom */}
      <div style={{
        marginTop: 36,
        color: '#3a2a55',
        fontSize: 10,
        letterSpacing: '0.4em',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease 1.2s',
      }}>
        ◆ THE ENDLESS DESCENDS ◆
      </div>
    </div>
  );
}
