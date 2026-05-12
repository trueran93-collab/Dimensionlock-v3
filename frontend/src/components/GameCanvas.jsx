import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine.js';
import { getRandomUpgrades } from '../game/upgrades.js';
import UpgradeScreen from './UpgradeScreen.jsx';
import BossWarning from './BossWarning.jsx';

export default function GameCanvas({ onGameOver, onReturnToMenu }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [stats, setStats] = useState({ hp: 100, maxHp: 100, sp: 100, maxSp: 100, combo: 0, floor: 1, score: 0, wave: 1, maxWaves: 3 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [usedUpgrades, setUsedUpgrades] = useState([]);

  const handleFloorClear = useCallback((floor) => {
    const options = getRandomUpgrades(3, usedUpgrades);
    setUpgradeOptions(options);
    setShowUpgrade(true);
  }, [usedUpgrades]);

  const handleBossWarning = useCallback(() => {
    setShowBossWarning(true);
    setTimeout(() => setShowBossWarning(false), 3500);
  }, []);

  const handleGameOver = useCallback((result) => {
    onGameOver(result);
  }, [onGameOver]);

  const handleUpgradeSelect = useCallback((upgradeId) => {
    setShowUpgrade(false);
    if (upgradeId) {
      setUsedUpgrades(prev => [...prev, upgradeId]);
    }
    if (engineRef.current) {
      engineRef.current.advanceFloor(upgradeId);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onStatsUpdate: setStats,
      onFloorClear: handleFloorClear,
      onBossWarning: handleBossWarning,
      onGameOver: handleGameOver,
    });
    engineRef.current = engine;
    engine.start();

    return () => { engine.stop(); };
  }, [handleFloorClear, handleBossWarning, handleGameOver]);

  const hpPct = Math.max(0, (stats.hp / stats.maxHp) * 100);
  const spPct = Math.max(0, (stats.sp / stats.maxSp) * 100);
  const hpColor = hpPct > 50 ? '#a855f7' : hpPct > 25 ? '#f59e0b' : '#ff3366';

  return (
    <div
      data-testid="game-canvas-container"
      style={{ position: 'relative', width: '100%', maxWidth: '1280px', margin: '0 auto', background: '#0a0a0f' }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }}
      />

      {/* HUD */}
      {!showUpgrade && !showBossWarning && (
        <div
          data-testid="game-hud"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          {/* Top-left: HP / SP bars */}
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            {/* HP Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#ff3366', fontSize: 12, minWidth: 24, textShadow: '0 0 8px #ff3366' }}>HP</span>
              <div style={{ width: 160, height: 12, background: '#1a0a2e', border: '1px solid #7c3aed55' }}>
                <div
                  data-testid="hp-bar"
                  style={{
                    height: '100%', width: `${hpPct}%`, background: hpColor,
                    boxShadow: `0 0 8px ${hpColor}`, transition: 'width 0.1s, background 0.3s'
                  }}
                />
              </div>
              <span style={{ color: '#fff', fontSize: 11 }}>{stats.hp}/{stats.maxHp}</span>
            </div>
            {/* SP Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#00ffcc', fontSize: 12, minWidth: 24, textShadow: '0 0 8px #00ffcc' }}>SP</span>
              <div style={{ width: 160, height: 8, background: '#1a0a2e', border: '1px solid #7c3aed33' }}>
                <div
                  data-testid="sp-bar"
                  style={{
                    height: '100%', width: `${spPct}%`, background: '#00ffcc',
                    boxShadow: '0 0 6px #00ffcc', transition: 'width 0.15s'
                  }}
                />
              </div>
              <span style={{ color: '#888', fontSize: 10 }}>{Math.floor(stats.sp)}/{stats.maxSp}</span>
            </div>
          </div>

          {/* Top-right: Floor + Score */}
          <div style={{ position: 'absolute', top: 16, right: 16, textAlign: 'right' }}>
            <div data-testid="floor-display" style={{ color: '#00ffcc', fontSize: 14, textShadow: '0 0 10px #00ffcc', marginBottom: 4 }}>
              FLOOR {stats.floor}
            </div>
            <div style={{ color: '#a855f7', fontSize: 11, textShadow: '0 0 8px #a855f7' }}>
              WAVE {stats.wave}/{stats.maxWaves}
            </div>
            <div data-testid="score-display" style={{ color: '#ffffff88', fontSize: 11, marginTop: 4 }}>
              SCORE: {stats.score}
            </div>
          </div>

          {/* Combo counter */}
          {stats.combo >= 3 && (
            <div
              data-testid="combo-display"
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -60%)',
                color: '#fbbf24', fontSize: 28,
                textShadow: '0 0 20px #fbbf24, 0 0 40px #f59e0b',
                fontWeight: 'bold', letterSpacing: '0.1em',
                animation: 'none',
                pointerEvents: 'none'
              }}
            >
              {stats.combo}x COMBO
            </div>
          )}

          {/* Controls hint (small, bottom) */}
          <div style={{
            position: 'absolute', bottom: 8, left: 16,
            color: '#ffffff33', fontSize: 10, lineHeight: '1.6'
          }}>
            <span>Arrow/WASD: Move</span>
            <span style={{ marginLeft: 12 }}>Space/W: Jump</span>
            <span style={{ marginLeft: 12 }}>Shift: Dash</span>
            <span style={{ marginLeft: 12 }}>J: Light</span>
            <span style={{ marginLeft: 12 }}>K: Heavy</span>
            <span style={{ marginLeft: 12 }}>L: Special (30SP)</span>
          </div>

          {/* SP warning */}
          {stats.sp < 30 && (
            <div style={{
              position: 'absolute', bottom: 28, right: 16,
              color: '#ff3366', fontSize: 11,
              textShadow: '0 0 8px #ff3366'
            }}>
              LOW SP
            </div>
          )}
        </div>
      )}

      {/* Upgrade Screen */}
      {showUpgrade && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <UpgradeScreen
            options={upgradeOptions}
            floor={stats.floor}
            onSelect={handleUpgradeSelect}
          />
        </div>
      )}

      {/* Boss Warning */}
      {showBossWarning && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <BossWarning floor={stats.floor} />
        </div>
      )}
    </div>
  );
}
