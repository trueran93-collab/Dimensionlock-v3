import React, { useEffect, useState } from 'react';

/**
 * On-screen touch controls.
 * Hidden via CSS on desktop (pointer: fine). Shown on touch devices.
 * Uses pointer events with passive: false handlers to prevent scrolling.
 */

const HoldButton = ({ label, color, glow, testId, onPress, onRelease, large = false, sub, size = 1 }) => {
  const handleDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPress();
  };
  const handleUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRelease();
  };
  const base = large ? 64 : 50;
  const dim = Math.round(base * size);
  return (
    <button
      data-testid={testId}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: `radial-gradient(circle at 30% 30%, ${color}55, ${color}11 70%, #0a0a0f)`,
        color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: large ? 11 : 9,
        letterSpacing: '0.05em',
        textShadow: `0 0 10px ${glow}`,
        boxShadow: `0 0 18px ${glow}88, inset 0 0 10px ${color}66`,
        userSelect: 'none',
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        padding: 0
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ fontSize: 7, opacity: 0.7, marginTop: 1 }}>{sub}</span>}
    </button>
  );
};

export default function MobileControls({ engineRef, stats, visible }) {
  const send = (action, value) => {
    if (engineRef.current) engineRef.current.setTouch(action, value);
  };

  // Track viewport for adaptive button sizing
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!visible) return null;

  const ultimateReady = stats.ultimateCharge >= stats.maxUltimateCharge;
  const specialReady = stats.sp >= 30;
  const dashReady = stats.dashCooldown <= 0;

  // Scale: 1 on large phones/tablets, 0.78 on small (~360px wide)
  const btnSize = vw < 380 ? 0.78 : vw < 520 ? 0.88 : 1;
  const btnGap = vw < 380 ? 6 : 8;
  const edgeInset = vw < 380 ? 8 : 12;
  const bottomInset = vw < 380 ? 36 : 60;

  return (
    <div
      data-testid="mobile-controls"
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      {/* Left side: D-pad */}
      <div style={{
        position: 'absolute', left: edgeInset, bottom: bottomInset,
        display: 'flex', gap: btnGap,
        pointerEvents: 'auto'
      }}>
        <HoldButton
          label="◀"
          color="#a855f7" glow="#a855f7"
          testId="mobile-left"
          onPress={() => send('left', true)}
          onRelease={() => send('left', false)}
          large
          size={btnSize}
        />
        <HoldButton
          label="▶"
          color="#a855f7" glow="#a855f7"
          testId="mobile-right"
          onPress={() => send('right', true)}
          onRelease={() => send('right', false)}
          large
          size={btnSize}
        />
      </div>

      {/* Right side: Action buttons - 2 rows x 3 cols */}
      <div style={{
        position: 'absolute', right: edgeInset, bottom: bottomInset,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, auto)',
        gridTemplateRows: 'repeat(2, auto)',
        gap: btnGap,
        pointerEvents: 'auto',
        alignItems: 'center',
        justifyItems: 'center'
      }}>
        {/* Row 1: JUMP, DASH, ULT */}
        <HoldButton
          label="JUMP"
          color="#00ffcc" glow="#00ffcc"
          testId="mobile-jump"
          onPress={() => send('jumpPressed', true)}
          onRelease={() => send('jumpPressed', false)}
          size={btnSize}
        />
        <HoldButton
          label="DASH"
          color={dashReady ? '#fbbf24' : '#555'}
          glow={dashReady ? '#fbbf24' : '#222'}
          testId="mobile-dash"
          onPress={() => send('dashPressed', true)}
          onRelease={() => send('dashPressed', false)}
          size={btnSize}
        />
        <HoldButton
          label="ULT"
          sub={ultimateReady ? 'READY!' : `${Math.floor(stats.ultimateCharge)}%`}
          color={ultimateReady ? '#fbbf24' : '#444'}
          glow={ultimateReady ? '#fbbf24' : '#111'}
          testId="mobile-ultimate"
          onPress={() => send('ultimatePressed', true)}
          onRelease={() => send('ultimatePressed', false)}
          large
          size={btnSize}
        />
        {/* Row 2: LIGHT, HEAVY, DARK */}
        <HoldButton
          label="LIGHT"
          color="#00ffcc" glow="#00ffcc"
          testId="mobile-light"
          onPress={() => send('lightPressed', true)}
          onRelease={() => send('lightPressed', false)}
          size={btnSize}
        />
        <HoldButton
          label="HEAVY"
          color="#a855f7" glow="#a855f7"
          testId="mobile-heavy"
          onPress={() => send('heavyPressed', true)}
          onRelease={() => send('heavyPressed', false)}
          size={btnSize}
        />
        <HoldButton
          label="DARK"
          sub={specialReady ? 'AURA' : 'LOW SP'}
          color={specialReady ? '#c084fc' : '#555'}
          glow={specialReady ? '#c084fc' : '#222'}
          testId="mobile-special"
          onPress={() => send('specialPressed', true)}
          onRelease={() => send('specialPressed', false)}
          size={btnSize}
        />
      </div>
    </div>
  );
}
