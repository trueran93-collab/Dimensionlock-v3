import React, { useState, useEffect } from 'react';

export default function GameOver({ result, onRestart, onMenu }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  const { floor = 1, score = 0, kills = 0 } = result || {};

  return (
    <div
      data-testid="game-over-screen"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,10,15,0.95)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        backdropFilter: 'blur(12px)',
        zIndex: 100
      }}
    >
      {/* Top red glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent, #ff3366, transparent)',
        boxShadow: '0 0 20px #ff3366'
      }} />

      {/* Death text */}
      <p style={{
        color: '#ff3366', fontSize: 11, letterSpacing: '0.6em',
        textTransform: 'uppercase', marginBottom: 12,
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: '0 0 15px #ff3366',
        animation: 'pulse-red 2s ease-in-out infinite'
      }}>
        THE ENDLESS CLAIMED YOU
      </p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        color: '#fff', fontSize: 'clamp(3rem, 8vw, 5.5rem)',
        fontWeight: 700, margin: '0 0 48px',
        textShadow: '0 0 30px #ff3366, 0 0 60px #a855f744',
        letterSpacing: '-0.02em'
      }}>
        Game Over
      </h1>

      {/* Stats */}
      <div style={{
        background: '#1a0a2e',
        border: '1px solid #7c3aed44',
        padding: '32px 56px',
        marginBottom: 48,
        display: 'flex', flexDirection: 'column', gap: 20,
        minWidth: 320
      }}>
        <p style={{
          color: '#7c3aed', fontSize: 11, letterSpacing: '0.4em',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: 8,
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          SOUL RECORD
        </p>

        {[
          { label: 'FLOOR REACHED', value: floor, color: '#00ffcc' },
          { label: 'SCORE', value: score.toLocaleString(), color: '#a855f7' },
          { label: 'SOULS REAPED', value: kills, color: '#ff3366' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40 }}>
            <span style={{
              color: '#ffffff55', fontSize: 12, letterSpacing: '0.2em',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {label}
            </span>
            <span style={{
              color, fontSize: 22, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: `0 0 10px ${color}`
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          data-testid="restart-button"
          onClick={onRestart}
          style={{
            background: 'transparent', color: '#00ffcc',
            border: '2px solid #00ffcc',
            padding: '14px 44px', fontSize: 14,
            fontWeight: 700, letterSpacing: '0.3em',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 0 15px rgba(0,255,204,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.target.style.background = '#00ffcc';
            e.target.style.color = '#0a0a0f';
            e.target.style.boxShadow = '0 0 30px rgba(0,255,204,0.5)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#00ffcc';
            e.target.style.boxShadow = '0 0 15px rgba(0,255,204,0.2)';
          }}
        >
          TRY AGAIN
        </button>

        <button
          data-testid="menu-button"
          onClick={onMenu}
          style={{
            background: 'transparent', color: '#7c3aed',
            border: '2px solid #7c3aed44',
            padding: '14px 44px', fontSize: 14,
            fontWeight: 700, letterSpacing: '0.3em',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = '#7c3aed22'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#7c3aed44'; e.target.style.background = 'transparent'; }}
        >
          MAIN MENU
        </button>
      </div>

      {/* Bottom atmospheric text */}
      <p style={{
        position: 'absolute', bottom: 32,
        color: '#ffffff22', fontSize: 12, fontStyle: 'italic',
        fontFamily: "'Cormorant Garamond', serif"
      }}>
        "The Endless remembers every soul that walks its paths..."
      </p>

      <style>{`
        @keyframes pulse-red {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
