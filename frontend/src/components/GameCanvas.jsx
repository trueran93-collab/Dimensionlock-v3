import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine.js';
import { getRandomUpgrades } from '../game/upgrades.js';
import UpgradeScreen from './UpgradeScreen.jsx';
import BossWarning from './BossWarning.jsx';
import MobileControls from './MobileControls.jsx';

const useIsTouch = () => {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () => {
      const hasTouch = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        window.matchMedia('(pointer: coarse)').matches;
      const smallScreen = window.innerWidth <= 900;
      setIsTouch(!!(hasTouch || smallScreen));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isTouch;
};

export default function GameCanvas({ onGameOver, onReturnToMenu, onFloorComplete, paused: externallyPaused, continueSignal }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);
  const isTouch = useIsTouch();

  // HUD scaling factor (1 = canvas at native 1280px width; smaller on phones)
  const [hudScale, setHudScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth || 1280;
      // Clamp scale between 0.45 (small phones) and 1
      setHudScale(Math.max(0.45, Math.min(1, w / 1280)));
    };
    updateScale();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateScale);
      ro.observe(el);
    } else {
      window.addEventListener('resize', updateScale);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateScale);
    };
  }, []);

  const [stats, setStats] = useState({
    hp: 100, maxHp: 100, sp: 100, maxSp: 100,
    combo: 0, floor: 1, score: 0, wave: 1, maxWaves: 3,
    ultimateCharge: 0, maxUltimateCharge: 100,
    ultimateActive: false, dashCooldown: 0, spReady: true
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [usedUpgrades, setUsedUpgrades] = useState([]);
  // Ref version keeps the callback identity stable so the engine is NEVER recreated on upgrade
  const usedUpgradesRef = useRef([]);
  const [mobileControlsOn, setMobileControlsOn] = useState(false);
  const [paused, setPaused] = useState(false);

  // Sync default visibility once isTouch is detected
  useEffect(() => { setMobileControlsOn(isTouch); }, [isTouch]);

  const handlePauseToggle = useCallback(() => {
    setPaused(prev => {
      const next = !prev;
      if (engineRef.current) {
        if (next) engineRef.current.pause();
        else engineRef.current.resume();
      }
      return next;
    });
  }, []);

  const handleResume = useCallback(() => {
    setPaused(false);
    if (engineRef.current) engineRef.current.resume();
  }, []);

  const handlePauseClick = useCallback(() => {
    setPaused(true);
    if (engineRef.current) engineRef.current.pause();
  }, []);

  // Keep ref in sync
  useEffect(() => { usedUpgradesRef.current = usedUpgrades; }, [usedUpgrades]);

  const handleFloorClear = useCallback((floor) => {
    const options = getRandomUpgrades(3, usedUpgradesRef.current); // read from ref — stable
    setUpgradeOptions(options);
    setShowUpgrade(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps → identity never changes → engine is never recreated

  const handleEngineFloorComplete = useCallback((info) => {
    if (onFloorComplete) onFloorComplete(info);
  }, [onFloorComplete]);

  // When App tells us to continue (after FloorComplete screen),
  // show the upgrade picker. The engine is still paused; advanceFloor will resume it.
  useEffect(() => {
    if (continueSignal && continueSignal > 0) {
      const options = getRandomUpgrades(3, usedUpgradesRef.current);
      setUpgradeOptions(options);
      setShowUpgrade(true);
    }
  }, [continueSignal]);

  // Pause/resume engine when App externally requests it (floor-complete overlay)
  useEffect(() => {
    if (!engineRef.current) return;
    if (externallyPaused) {
      engineRef.current.pause();
    } else if (!paused) {
      engineRef.current.resume();
    }
  }, [externallyPaused]); // eslint-disable-line react-hooks/exhaustive-deps

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
      onFloorComplete: handleEngineFloorComplete,
      onBossWarning: handleBossWarning,
      onGameOver: handleGameOver,
      onPauseToggle: handlePauseToggle,
    });
    engineRef.current = engine;
    engine.start();

    return () => { engine.stop(); };
  }, [handleFloorClear, handleEngineFloorComplete, handleBossWarning, handleGameOver, handlePauseToggle]);

  const hpPct = Math.max(0, (stats.hp / stats.maxHp) * 100);
  const spPct = Math.max(0, (stats.sp / stats.maxSp) * 100);
  const ultPct = Math.max(0, (stats.ultimateCharge / stats.maxUltimateCharge) * 100);
  const hpColor = hpPct > 50 ? '#a855f7' : hpPct > 25 ? '#f59e0b' : '#ff3366';

  return (
    <div
      ref={containerRef}
      data-testid="game-canvas-container"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        background: '#0a0a0f',
        touchAction: 'none'
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
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
          {/* Top-left: HP / SP / Ult bars */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            transform: `scale(${hudScale})`, transformOrigin: 'top left',
          }}>
            {/* HP Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ color: '#ff3366', fontSize: 11, minWidth: 22, textShadow: '0 0 8px #ff3366' }}>HP</span>
              <div style={{ width: 150, height: 11, background: '#1a0a2e', border: '1px solid #7c3aed55' }}>
                <div
                  data-testid="hp-bar"
                  style={{
                    height: '100%', width: `${hpPct}%`, background: hpColor,
                    boxShadow: `0 0 8px ${hpColor}`, transition: 'width 0.1s, background 0.3s'
                  }}
                />
              </div>
              <span style={{ color: '#fff', fontSize: 10 }}>{stats.hp}/{stats.maxHp}</span>
            </div>
            {/* SP Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ color: '#00ffcc', fontSize: 11, minWidth: 22, textShadow: '0 0 8px #00ffcc' }}>SP</span>
              <div style={{ width: 150, height: 8, background: '#1a0a2e', border: '1px solid #7c3aed33' }}>
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
            {/* Ultimate Charge Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                color: ultPct >= 100 ? '#fbbf24' : '#c084fc',
                fontSize: 11, minWidth: 22,
                textShadow: ultPct >= 100 ? '0 0 12px #fbbf24' : '0 0 8px #a855f7'
              }}>ULT</span>
              <div
                style={{
                  width: 150, height: 10,
                  background: '#1a0a2e',
                  border: `1px solid ${ultPct >= 100 ? '#fbbf24' : '#7c3aed55'}`,
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div
                  data-testid="ultimate-bar"
                  style={{
                    height: '100%',
                    width: `${ultPct}%`,
                    background: ultPct >= 100
                      ? 'linear-gradient(90deg, #fbbf24, #ff6600, #fbbf24)'
                      : 'linear-gradient(90deg, #a855f7, #c084fc)',
                    boxShadow: ultPct >= 100 ? '0 0 14px #fbbf24' : '0 0 6px #a855f7',
                    transition: 'width 0.2s',
                    backgroundSize: '200% 100%',
                    animation: ultPct >= 100 ? 'ultPulse 1s linear infinite' : 'none'
                  }}
                />
              </div>
              <span style={{
                color: ultPct >= 100 ? '#fbbf24' : '#888',
                fontSize: 10,
                textShadow: ultPct >= 100 ? '0 0 6px #fbbf24' : 'none'
              }}>
                {ultPct >= 100 ? 'READY' : `${Math.floor(ultPct)}%`}
              </span>
            </div>
          </div>

          {/* Top-right: Floor + Score */}
          <div style={{
            position: 'absolute', top: 12, right: 12, textAlign: 'right',
            transform: `scale(${hudScale})`, transformOrigin: 'top right',
          }}>
            <div data-testid="floor-display" style={{ color: '#00ffcc', fontSize: 13, textShadow: '0 0 10px #00ffcc', marginBottom: 3 }}>
              FLOOR {stats.floor}
            </div>
            <div style={{ color: '#a855f7', fontSize: 10, textShadow: '0 0 8px #a855f7' }}>
              WAVE {stats.wave}/{stats.maxWaves}
            </div>
            <div data-testid="score-display" style={{ color: '#ffffff88', fontSize: 10, marginTop: 3 }}>
              SCORE: {stats.score}
            </div>
          </div>

          {/* Combo counter */}
          {stats.combo >= 3 && (
            <div
              data-testid="combo-display"
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: `translate(-50%, -60%) scale(${hudScale})`,
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

          {/* Ultimate active flash */}
          {stats.ultimateActive && (
            <div
              data-testid="ultimate-active"
              style={{
                position: 'absolute', top: '20%', left: '50%',
                transform: `translateX(-50%) scale(${hudScale})`,
                color: '#fbbf24', fontSize: 28,
                textShadow: '0 0 30px #fbbf24, 0 0 60px #ff6600',
                fontWeight: 'bold', letterSpacing: '0.2em',
                pointerEvents: 'none',
                fontFamily: "'Cormorant Garamond', serif"
              }}
            >
              SOUL HARVEST
            </div>
          )}

          {/* Controls hint (desktop only) */}
          {!isTouch && (
            <div style={{
              position: 'absolute', bottom: 8, left: 16,
              color: '#ffffff44', fontSize: 10, lineHeight: '1.6',
              transform: `scale(${hudScale})`, transformOrigin: 'bottom left',
            }}>
              <span>Move: A/D</span>
              <span style={{ marginLeft: 10 }}>Jump: W/Space (2x)</span>
              <span style={{ marginLeft: 10 }}>Dash: Shift</span>
              <span style={{ marginLeft: 10 }}>J/K: Light/Heavy</span>
              <span style={{ marginLeft: 10 }}>L: Dark Aura (30SP)</span>
              <span style={{ marginLeft: 10, color: '#fbbf24' }}>U: Ultimate</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile controls toggle button (top-right, below floor) */}
      {isTouch && !showUpgrade && !showBossWarning && (
        <button
          data-testid="toggle-mobile-controls"
          onClick={() => setMobileControlsOn(v => !v)}
          style={{
            position: 'absolute', top: 12, right: 12,
            opacity: 0,
            width: 100, height: 80,
            background: 'transparent', border: 'none',
            pointerEvents: 'auto'
          }}
          aria-label="Toggle mobile controls"
        />
      )}

      {/* Mobile Controls Overlay */}
      <MobileControls
        engineRef={engineRef}
        stats={stats}
        visible={mobileControlsOn && !showUpgrade && !showBossWarning}
      />

      {/* Pause Button (top-center) */}
      {!showUpgrade && !showBossWarning && !paused && (
        <button
          data-testid="pause-button"
          onClick={handlePauseClick}
          style={{
            position: 'absolute', top: 12, left: '50%',
            transform: `translateX(-50%) scale(${hudScale})`,
            transformOrigin: 'top center',
            background: 'rgba(8,4,16,0.7)',
            border: '1px solid #7c3aed55',
            color: '#a855f7',
            padding: '6px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.2em',
            cursor: 'pointer',
            zIndex: 20,
            textShadow: '0 0 8px #a855f7'
          }}
          aria-label="Pause game"
        >
          ❚❚ PAUSE
        </button>
      )}

      {/* Pause Menu */}
      {paused && (
        <div
          data-testid="pause-menu"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(4,2,14,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 60,
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          <p style={{
            color: '#a855f7', fontSize: 11, letterSpacing: '0.6em',
            textTransform: 'uppercase', marginBottom: 12,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: '0 0 14px #a855f7'
          }}>
            THE REAPER RESTS
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#fff', fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700, margin: '0 0 40px',
            textShadow: '0 0 28px #a855f7',
            letterSpacing: '0.04em'
          }}>
            Paused
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 240 }}>
            <button
              data-testid="resume-button"
              onClick={handleResume}
              style={{
                background: 'transparent', color: '#00ffcc',
                border: '2px solid #00ffcc',
                padding: '12px 36px', fontSize: 13,
                fontWeight: 700, letterSpacing: '0.3em',
                textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 0 14px rgba(0,255,204,0.25)'
              }}
            >
              Resume
            </button>
            <button
              data-testid="pause-menu-button"
              onClick={onReturnToMenu}
              style={{
                background: 'transparent', color: '#7c3aed',
                border: '2px solid #7c3aed55',
                padding: '12px 36px', fontSize: 13,
                fontWeight: 700, letterSpacing: '0.3em',
                textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              Main Menu
            </button>
          </div>

          <p style={{ color: '#ffffff33', fontSize: 10, marginTop: 36, letterSpacing: '0.2em' }}>
            ESC / P to resume
          </p>
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

      <style>{`
        @keyframes ultPulse {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }
      `}</style>
    </div>
  );
}
