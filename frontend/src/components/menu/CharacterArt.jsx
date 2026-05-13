import React from 'react';
import { MAYTRADALIS_ART } from './constants';

// Right-side panel showing Maytradalis with glow, light beam, and ground pulse.
// Two variants: desktop (full-height stage) and mobile (smaller, below buttons).
export function CharacterArtDesktop() {
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: 480,
    }}>
      {/* Background glow radial */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.22) 0%, rgba(0,255,204,0.04) 40%, transparent 70%)',
        animation: 'auraBreath 4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Vertical light beam */}
      <div style={{
        position: 'absolute',
        top: '5%', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '35%',
        background: 'linear-gradient(to bottom, transparent, rgba(168,85,247,0.08) 35%, rgba(168,85,247,0.04) 70%, transparent)',
        pointerEvents: 'none',
        animation: 'beamFlicker 5s ease-in-out infinite',
      }} />

      {/* Ground circle */}
      <div style={{
        position: 'absolute', bottom: '6%',
        left: '50%', transform: 'translateX(-50%)',
        width: '55%', height: 55,
        background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'groundPulse 3.5s ease-in-out infinite',
      }} />

      {/* Character art */}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 100px)',
        maxWidth: 520,
        animation: 'charIdle 5s ease-in-out infinite',
      }}>
        <img
          src={MAYTRADALIS_ART}
          alt="Maytradalis"
          draggable={false}
          style={{
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: 'brightness(1.05) saturate(1.2) drop-shadow(0 0 32px rgba(168,85,247,0.65)) drop-shadow(0 0 60px rgba(168,85,247,0.25))',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Character label */}
      <div style={{
        position: 'absolute',
        bottom: '8%', right: '8%',
        background: 'rgba(8,4,20,0.85)',
        border: '1px solid rgba(168,85,247,0.3)',
        padding: '8px 16px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: '0.35em',
        color: '#7c3aed',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
      }}>
        MAYTRADALIS ◆ VOID REAPER
      </div>
    </div>
  );
}

export function CharacterArtMobile({ isMobile }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      marginTop: 28,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: '-10% 0',
        background: 'radial-gradient(ellipse at 50% 75%, rgba(124,58,237,0.25) 0%, transparent 65%)',
      }} />
      <img
        src={MAYTRADALIS_ART}
        alt="Maytradalis"
        draggable={false}
        style={{
          position: 'relative',
          height: isMobile ? 260 : 340,
          maxWidth: '85vw',
          objectFit: 'contain',
          objectPosition: 'bottom',
          filter: 'brightness(1.05) drop-shadow(0 0 22px rgba(168,85,247,0.55))',
          animation: 'charIdle 5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
