import React from 'react';
import { TITLE_ART } from './constants';

// Animated title artwork. Floats subtly and shows occasional RGB-split glitches.
export default function TitleArt({ compact }) {
  return (
    <div data-testid="title-art" style={{
      position: 'relative',
      width: '100%',
      maxWidth: compact ? 360 : 580,
      margin: '0 0 14px',
      lineHeight: 0,
      userSelect: 'none',
      animation: 'titleFloat 6s ease-in-out infinite',
    }}>
      <img
        src={TITLE_ART}
        alt="Dimensionlock: Deathly Stories"
        draggable={false}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 22px rgba(168,85,247,0.55)) drop-shadow(0 0 44px rgba(168,85,247,0.22))',
          pointerEvents: 'none',
        }}
      />
      {/* Glitch overlay — red channel */}
      <img
        src={TITLE_ART}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: 'auto', objectFit: 'contain',
          mixBlendMode: 'screen',
          opacity: 0,
          animation: 'titleGlitchRed 8s steps(1) infinite',
          filter: 'hue-rotate(-50deg) saturate(2.5) brightness(1.1)',
          pointerEvents: 'none',
        }}
      />
      {/* Glitch overlay — cyan channel */}
      <img
        src={TITLE_ART}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: 'auto', objectFit: 'contain',
          mixBlendMode: 'screen',
          opacity: 0,
          animation: 'titleGlitchCyan 8s steps(1) infinite',
          filter: 'hue-rotate(140deg) saturate(2) brightness(1.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
