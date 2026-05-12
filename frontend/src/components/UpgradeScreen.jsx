import React, { useState, useEffect } from 'react';
import { soundEngine } from '../game/sound.js';

const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#a855f7',
  rare: '#fbbf24'
};

const ICON_MAP = {
  heart: '♥', sword: '⚔', zap: '⚡', expand: '↔', shield: '◈',
  droplets: '◉', star: '★', wind: '≋', timer: '⏱', gem: '◆',
  flask: '◈', flame: '🔥'
};

export default function UpgradeScreen({ options, floor, onSelect }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const handleSelect = (idx) => {
    setSelectedIdx(idx);
    soundEngine.playUpgradeSelect();
    setTimeout(() => onSelect(options[idx].id), 400);
  };

  return (
    <div
      data-testid="upgrade-screen"
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,10,15,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        backdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{
          color: '#00ffcc', fontSize: 11, letterSpacing: '0.5em', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
          textShadow: '0 0 10px #00ffcc'
        }}>
          FLOOR {floor} CLEARED
        </p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 3rem)',
          fontWeight: 700, margin: 0,
          textShadow: '0 0 20px #a855f7'
        }}>
          Choose Your Path
        </h2>
        <p style={{ color: '#ffffff55', fontSize: 13, marginTop: 8 }}>
          Master Death offers wisdom between the voids
        </p>
      </div>

      {/* Upgrade cards */}
      <div style={{
        display: 'flex', gap: 24, padding: '0 24px',
        flexWrap: 'wrap', justifyContent: 'center'
      }}>
        {options.map((upg, i) => {
          const isHovered = hoveredIdx === i;
          const isSelected = selectedIdx === i;
          const rarityColor = RARITY_COLORS[upg.rarity] || '#9ca3af';
          const delay = `${i * 0.1}s`;

          return (
            <button
              key={upg.id}
              data-testid={`upgrade-card-${i}`}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: isSelected
                  ? `${upg.color}22`
                  : isHovered
                    ? '#1a0a2e'
                    : '#13091f',
                border: `1px solid ${isHovered || isSelected ? upg.color : '#7c3aed44'}`,
                padding: '28px 24px',
                width: 220,
                minHeight: 220,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 12, textAlign: 'center',
                transition: 'all 0.25s ease',
                boxShadow: isHovered || isSelected ? `0 0 25px ${upg.color}44` : 'none',
                transform: isHovered ? 'translateY(-6px)' : isSelected ? 'scale(0.97)' : 'none',
                animationDelay: delay,
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Rarity indicator */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 2, background: rarityColor,
                boxShadow: `0 0 8px ${rarityColor}`
              }} />

              {/* Rarity label */}
              <span style={{
                fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase',
                color: rarityColor, fontFamily: "'JetBrains Mono', monospace"
              }}>
                {upg.rarity}
              </span>

              {/* Icon */}
              <div style={{
                fontSize: 36,
                filter: `drop-shadow(0 0 12px ${upg.color})`,
                color: upg.color,
                lineHeight: 1
              }}>
                {ICON_MAP[upg.icon] || '◆'}
              </div>

              {/* Name */}
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#fff', fontSize: 20, fontWeight: 700,
                margin: 0, lineHeight: 1.2,
                textShadow: isHovered ? `0 0 12px ${upg.color}` : 'none'
              }}>
                {upg.name}
              </h3>

              {/* Description */}
              <p style={{
                color: '#00ffcc', fontSize: 13, fontWeight: 600,
                margin: 0, fontFamily: "'JetBrains Mono', monospace"
              }}>
                {upg.description}
              </p>

              {/* Flavor text */}
              <p style={{
                color: '#ffffff44', fontSize: 11, fontStyle: 'italic',
                margin: 0, lineHeight: 1.5
              }}>
                "{upg.flavor}"
              </p>
            </button>
          );
        })}
      </div>

      {/* Skip option */}
      <button
        data-testid="skip-upgrade-button"
        onClick={() => onSelect(null)}
        style={{
          marginTop: 36,
          background: 'transparent', color: '#ffffff44',
          border: '1px solid #ffffff22',
          padding: '8px 28px', fontSize: 12,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.target.style.color = '#ffffff88'; e.target.style.borderColor = '#ffffff44'; }}
        onMouseLeave={e => { e.target.style.color = '#ffffff44'; e.target.style.borderColor = '#ffffff22'; }}
      >
        Continue Without Upgrade
      </button>
    </div>
  );
}
