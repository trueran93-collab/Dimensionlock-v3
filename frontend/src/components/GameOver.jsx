import React, { useState, useEffect } from 'react';
import { computeRank, shardsFromRun, fetchProgress, saveProgress } from '../services/progress.js';

const RANK_THEMES = {
  SS: { color: '#fbbf24', glow: '#ff6600', label: 'SOUL SOVEREIGN' },
  S:  { color: '#fbbf24', glow: '#fbbf24', label: 'SOUL EATER' },
  A:  { color: '#ff3366', glow: '#ff3366', label: 'BLOODBOUND' },
  B:  { color: '#c084fc', glow: '#a855f7', label: 'VOIDWALKER' },
  C:  { color: '#00ffcc', glow: '#00ffcc', label: 'REAPER-TRAINEE' },
  D:  { color: '#9888c0', glow: '#7c3aed', label: 'WANDERER' },
  F:  { color: '#7c3aed', glow: '#3a1a55', label: 'LOST SOUL' },
};

export default function GameOver({ result, onRestart, onMenu }) {
  const [visible, setVisible] = useState(false);
  const [persistState, setPersistState] = useState({ saving: true, shardsEarned: 0, newRecord: false });

  const { floor = 1, score = 0, kills = 0, bestCombo = 0 } = result || {};
  const rank = computeRank({ floor, score, kills, bestCombo });
  const theme = RANK_THEMES[rank] || RANK_THEMES.F;
  const shardsEarned = shardsFromRun({
    kills, floor: Math.max(0, floor - 1), bestCombo,
    perfectFloors: result?.perfectFloors || 0,
    bossKills: result?.bossKills || 0,
  });

  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  // Persist to backend (additive update)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const current = await fetchProgress();
        const newShards = (current.death_shards || 0) + shardsEarned;
        const prevBest = current.best_run || {};
        const newRecord = (floor > (prevBest.floor || 0)) ||
                          (floor === (prevBest.floor || 0) && score > (prevBest.score || 0));
        await saveProgress({
          death_shards: newShards,
          best_run: { floor, score, kills, rank, best_combo: bestCombo },
          total_runs: (current.total_runs || 0) + 1,
          total_kills: (current.total_kills || 0) + kills,
          total_floors_cleared: (current.total_floors_cleared || 0) + Math.max(0, floor - 1),
        });
        if (alive) setPersistState({ saving: false, shardsEarned, newRecord });
      } catch (_) {
        if (alive) setPersistState({ saving: false, shardsEarned, newRecord: false });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        zIndex: 100,
        padding: 24,
        overflowY: 'auto',
      }}
    >
      {/* Top red glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent, #ff3366, transparent)',
        boxShadow: '0 0 20px #ff3366'
      }} />

      <p style={{
        color: '#ff3366', fontSize: 11, letterSpacing: '0.6em',
        textTransform: 'uppercase', marginBottom: 8,
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: '0 0 15px #ff3366',
        animation: 'pulse-red 2s ease-in-out infinite'
      }}>
        THE ENDLESS CLAIMED YOU
      </p>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        color: '#fff', fontSize: 'clamp(2.4rem, 6vw, 4rem)',
        fontWeight: 700, margin: '0 0 24px',
        textShadow: '0 0 30px #ff3366, 0 0 60px #a855f744',
        letterSpacing: '-0.02em'
      }}>
        Game Over
      </h1>

      {/* RANK CARD */}
      <div
        data-testid="rank-card"
        style={{
          background: 'rgba(8,4,18,0.92)',
          border: `2px solid ${theme.color}`,
          padding: '20px 36px',
          marginBottom: 24,
          minWidth: 320,
          textAlign: 'center',
          boxShadow: `0 0 40px ${theme.glow}55, inset 0 0 24px ${theme.glow}22`,
          clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        }}
      >
        <div style={{
          color: theme.color, fontSize: 10, letterSpacing: '0.5em',
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: `0 0 10px ${theme.glow}`,
          marginBottom: 4,
        }}>
          FINAL RANK
        </div>
        <div
          data-testid="rank-letter"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: theme.color,
            fontSize: 96, fontWeight: 700, lineHeight: 1,
            textShadow: `0 0 36px ${theme.glow}, 0 0 80px ${theme.glow}77`,
            animation: 'rankReveal 0.8s cubic-bezier(.16,.91,.38,1.13)',
          }}
        >
          {rank}
        </div>
        <div style={{
          color: theme.color, fontSize: 12, letterSpacing: '0.4em',
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: `0 0 8px ${theme.glow}`,
          marginTop: 4,
        }}>
          {theme.label}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        background: '#1a0a2e',
        border: '1px solid #7c3aed44',
        padding: '20px 36px',
        marginBottom: 24,
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px 36px',
        minWidth: 320, maxWidth: 420,
      }}>
        {[
          { label: 'FLOOR REACHED', value: floor, color: '#00ffcc' },
          { label: 'SCORE', value: score.toLocaleString(), color: '#a855f7' },
          { label: 'SOULS REAPED', value: kills, color: '#ff3366' },
          { label: 'BEST COMBO', value: bestCombo, color: '#fbbf24' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{
              color: '#ffffff55', fontSize: 10, letterSpacing: '0.18em',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {label}
            </span>
            <span style={{
              color, fontSize: 18, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: `0 0 10px ${color}`
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Shards earned */}
      <div
        data-testid="shards-earned"
        style={{
          background: 'rgba(40,28,4,0.7)',
          border: '1px solid #fbbf24',
          padding: '10px 24px',
          marginBottom: 8,
          minWidth: 280,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          boxShadow: '0 0 20px rgba(251,191,36,0.25)',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
        }}
      >
        <span style={{
          color: '#fbbf24', fontSize: 10, letterSpacing: '0.4em',
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 8px #fbbf24',
        }}>
          ◈ DEATH SHARDS
        </span>
        <span style={{
          color: '#fbbf24', fontSize: 22, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 14px #fbbf24, 0 0 28px #ff6600',
        }}>
          +{persistState.saving ? '…' : shardsEarned}
        </span>
      </div>

      {persistState.newRecord && (
        <p data-testid="new-record" style={{
          color: '#fbbf24', fontSize: 12, letterSpacing: '0.4em',
          margin: '6px 0 14px', fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 16px #fbbf24',
          animation: 'pulse-red 1.5s ease-in-out infinite',
        }}>
          ★ NEW PERSONAL BEST ★
        </p>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
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
        position: 'absolute', bottom: 18,
        color: '#ffffff22', fontSize: 11, fontStyle: 'italic',
        fontFamily: "'Cormorant Garamond', serif",
        textAlign: 'center', padding: '0 16px',
      }}>
        "The Endless remembers every soul that walks its paths..."
      </p>

      <style>{`
        @keyframes pulse-red {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes rankReveal {
          0%   { transform: scale(0.4); opacity: 0; filter: blur(20px); }
          60%  { transform: scale(1.25); opacity: 1; filter: blur(0); }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
