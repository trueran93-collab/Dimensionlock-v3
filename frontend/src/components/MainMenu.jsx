import React, { useState, useEffect } from 'react';

export default function MainMenu({ onPlay }) {
  const [visible, setVisible] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);

  const loreLines = [
    "In the space between realities lies the Endless...",
    "Maytradalis, reaper-in-training, walks its void corridors.",
    "Her master Death has given her a sacred mission:",
    "Save the Grim Reaper Ava from the Lurker.",
    "A plague doctor entity that warps all it touches.",
    "Armed with her scythe and guided by Flybutt,",
    "she descends deeper into the Endless..."
  ];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const total = loreLines.length;
    const interval = setInterval(() => {
      setLineIdx(prev => (prev + 1) % total);
    }, 3500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-testid="main-menu"
      style={{
        minHeight: '100vh', width: '100%',
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(60)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            borderRadius: '50%',
            background: '#fff',
            opacity: Math.random() * 0.7 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
            animationDelay: `${Math.random() * 3}s`
          }} />
        ))}
      </div>

      {/* Floating void orbs */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${80 + i * 40}px`,
          height: `${80 + i * 40}px`,
          borderRadius: '50%',
          border: '1px solid #7c3aed33',
          background: 'radial-gradient(circle, #7c3aed11 0%, transparent 70%)',
          left: `${[10, 75, 5, 80, 40][i]}%`,
          top: `${[20, 15, 65, 70, 45][i]}%`,
          animation: `float ${4 + i}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.7}s`,
          pointerEvents: 'none'
        }} />
      ))}

      {/* Series title */}
      <p style={{
        color: '#7c3aed', fontSize: 12, letterSpacing: '0.5em',
        textTransform: 'uppercase', marginBottom: 16,
        fontFamily: "'JetBrains Mono', monospace",
        textShadow: '0 0 10px #7c3aed'
      }}>
        DIMENSIONLOCK: DEATHLY STORIES
      </p>

      {/* Main title */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        fontWeight: 700,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 1.1,
        margin: '0 0 8px',
        textShadow: '0 0 30px #a855f7, 0 0 60px #7c3aed44',
        letterSpacing: '-0.02em'
      }}>
        The Endless
      </h1>

      {/* Subtitle */}
      <p style={{
        color: '#a855f7', fontSize: 14, letterSpacing: '0.3em',
        textTransform: 'uppercase', marginBottom: 40,
        textShadow: '0 0 15px #a855f7'
      }}>
        Maytradalis - Reaper in Training
      </p>

      {/* Character silhouette area */}
      <div style={{
        width: 2, height: 60, background: 'linear-gradient(to bottom, #7c3aed, transparent)',
        marginBottom: 40
      }} />

      {/* Lore text */}
      <div style={{
        maxWidth: 520, textAlign: 'center', marginBottom: 48,
        minHeight: 60, padding: '0 20px'
      }}>
        <p style={{
          color: '#ffffff88', fontSize: 14, lineHeight: 1.7,
          fontStyle: 'italic', transition: 'opacity 0.5s',
          fontFamily: "'Outfit', sans-serif"
        }}>
          "{loreLines[lineIdx]}"
        </p>
      </div>

      {/* Play button */}
      <button
        data-testid="play-button"
        onClick={onPlay}
        style={{
          background: 'transparent',
          color: '#00ffcc',
          border: '2px solid #00ffcc',
          padding: '16px 56px',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 0 20px rgba(0,255,204,0.25)',
          transition: 'all 0.3s ease',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => {
          e.target.style.background = '#00ffcc';
          e.target.style.color = '#0a0a0f';
          e.target.style.boxShadow = '0 0 35px rgba(0,255,204,0.6)';
        }}
        onMouseLeave={e => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#00ffcc';
          e.target.style.boxShadow = '0 0 20px rgba(0,255,204,0.25)';
        }}
      >
        ENTER THE ENDLESS
      </button>

      {/* Controls */}
      <div style={{
        background: '#1a0a2e88',
        border: '1px solid #7c3aed33',
        padding: '16px 28px',
        maxWidth: 540,
        width: '100%'
      }}>
        <p style={{ color: '#7c3aed', fontSize: 11, letterSpacing: '0.3em', textAlign: 'center', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          CONTROLS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
          {[
            ['Move', 'Arrow Keys / WASD'],
            ['Jump / Double Jump', 'Space / W'],
            ['Dash (invincible)', 'Shift'],
            ['Light Attack', 'J / Z'],
            ['Heavy Attack', 'K / X'],
            ['Special (30 SP)', 'L / C'],
          ].map(([action, key]) => (
            <div key={action} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#ffffff66', fontSize: 11 }}>{action}</span>
              <span style={{ color: '#00ffcc', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
        @keyframes float { from { transform: translateY(-8px); } to { transform: translateY(8px); } }
      `}</style>
    </div>
  );
}
