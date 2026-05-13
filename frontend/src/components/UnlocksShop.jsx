// UnlocksShop — main-menu panel where players spend Death Shards on permanent buffs.
// Reads/writes via /api/progress.
import React, { useEffect, useState } from 'react';
import { fetchProgress, purchaseUnlock, UNLOCK_DEFS } from '../services/progress.js';

export default function UnlocksShop({ onBack, compact = false }) {
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await fetchProgress();
      if (alive) setProgress(p);
    })();
    return () => { alive = false; };
  }, []);

  const buy = async (unlockId) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await purchaseUnlock(unlockId);
      setProgress(next);
    } catch (e) {
      setError(e.message || 'Purchase failed');
      setTimeout(() => setError(null), 3500);
    } finally {
      setBusy(false);
    }
  };

  if (!progress) {
    return (
      <div data-testid="unlocks-shop-loading" style={{
        color: '#9888c0', padding: 24, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, letterSpacing: '0.3em', textAlign: 'center',
      }}>
        SYNCING SOUL RECORD...
      </div>
    );
  }

  const shards = progress.death_shards || 0;
  const unlocks = progress.unlocks || {};

  return (
    <div data-testid="unlocks-shop-panel" style={{
      animation: 'fadeSlide 0.3s ease',
      width: '100%',
      textAlign: 'left',
    }}>
      {/* Shard balance header */}
      <div style={{
        background: 'rgba(8,4,20,0.92)',
        border: '1px solid rgba(168,85,247,0.4)',
        padding: compact ? '12px 14px' : '14px 22px',
        marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      }}>
        <div style={{
          color: '#9888c0', fontSize: 10, letterSpacing: '0.35em',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ◈ DEATH SHARDS
        </div>
        <div
          data-testid="death-shards-balance"
          style={{
            color: '#fbbf24', fontSize: compact ? 22 : 28, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: '0 0 12px #fbbf24, 0 0 24px #ff6600',
          }}
        >
          {shards.toLocaleString()}
        </div>
      </div>

      {/* Unlock cards */}
      <div style={{
        background: 'rgba(8,4,20,0.88)',
        border: '1px solid rgba(124,58,237,0.4)',
        padding: compact ? '10px 12px' : '16px 18px',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        marginBottom: 14,
      }}>
        {Object.entries(UNLOCK_DEFS).map(([id, def]) => {
          const level   = unlocks[id] || 0;
          const maxLvl  = def.costs.length;
          const maxed   = level >= maxLvl;
          const cost    = maxed ? 0 : def.costs[level];
          const canAfford = !maxed && shards >= cost;
          return (
            <div
              key={id}
              data-testid={`unlock-row-${id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: compact ? '8px 0' : '10px 0',
                borderBottom: '1px solid rgba(124,58,237,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: compact ? 18 : 22,
                  color: def.color,
                  textShadow: `0 0 10px ${def.color}`,
                  width: 28, textAlign: 'center',
                }}>{def.icon}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    color: def.color, fontSize: compact ? 11 : 12,
                    letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace",
                    textShadow: `0 0 8px ${def.color}66`,
                  }}>
                    {def.label}
                    <span style={{
                      marginLeft: 8, color: '#9888c0', fontSize: 9, letterSpacing: '0.15em',
                    }}>
                      LV {level}/{maxLvl}
                    </span>
                  </div>
                  <div style={{
                    color: '#9888c0', fontSize: compact ? 10 : 11, marginTop: 2,
                    fontStyle: 'italic',
                  }}>
                    {def.description}
                  </div>
                  {/* Level dots */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {Array.from({ length: maxLvl }).map((_, i) => (
                      <div key={i} style={{
                        width: 12, height: 4,
                        background: i < level ? def.color : 'rgba(124,58,237,0.25)',
                        boxShadow: i < level ? `0 0 6px ${def.color}` : 'none',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              <button
                data-testid={`unlock-buy-${id}`}
                disabled={busy || maxed || !canAfford}
                onClick={() => buy(id)}
                style={{
                  background: maxed ? 'transparent'
                    : canAfford ? `${def.color}22` : 'transparent',
                  border: `1px solid ${maxed ? '#7c3aed44' : canAfford ? def.color : '#7c3aed44'}`,
                  color: maxed ? '#7c3aed' : canAfford ? def.color : '#7c3aed88',
                  padding: compact ? '6px 10px' : '8px 14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: compact ? 10 : 11, letterSpacing: '0.2em',
                  cursor: maxed || !canAfford || busy ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textShadow: canAfford && !maxed ? `0 0 8px ${def.color}` : 'none',
                  transition: 'all 0.2s',
                  minWidth: 86,
                }}
              >
                {maxed ? 'MAXED' : `${cost} ◈`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Best run summary */}
      {progress.best_run && progress.best_run.score > 0 && (
        <div data-testid="best-run-summary" style={{
          background: 'rgba(8,4,20,0.7)',
          border: '1px solid rgba(124,58,237,0.25)',
          padding: '10px 14px',
          marginBottom: 14,
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8,
        }}>
          <Stat label="BEST FLOOR" value={progress.best_run.floor} color="#00ffcc" />
          <Stat label="BEST SCORE" value={(progress.best_run.score || 0).toLocaleString()} color="#a855f7" />
          <Stat label="RANK" value={progress.best_run.rank} color="#fbbf24" />
        </div>
      )}

      {error && (
        <div data-testid="shop-error" style={{
          color: '#ff3366', fontSize: 11, letterSpacing: '0.18em',
          textAlign: 'center', marginBottom: 12,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 8px #ff3366',
        }}>
          {error.toUpperCase()}
        </div>
      )}

      <button
        data-testid="shop-back-button"
        onClick={onBack}
        style={{
          background: 'transparent', color: '#a855f7',
          border: '1px solid rgba(168,85,247,0.55)',
          padding: '10px 22px', fontSize: 11,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
          cursor: 'pointer',
          width: '100%',
        }}
      >
        ← Back
      </button>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 72 }}>
      <div style={{
        color: '#7c3aed', fontSize: 9, letterSpacing: '0.3em',
        fontFamily: "'JetBrains Mono', monospace",
      }}>{label}</div>
      <div style={{
        color, fontSize: 18, fontWeight: 700, marginTop: 2,
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: `0 0 8px ${color}55`,
      }}>{value}</div>
    </div>
  );
}
