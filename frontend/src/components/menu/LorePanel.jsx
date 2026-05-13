import React from 'react';
import MenuButton from './MenuButton';

const LORE_BLOCKS = [
  ['THE ENDLESS',     'A dimension born from collapsed realities. Time fragments here. Death does not hold.'],
  ['MAYTRADALIS',     'A Reaper of the 7th Void. Her scythe Sorrow-Eater harvests souls across broken worlds.'],
  ['THE LURKER',      'Ancient plague-herald who imprisons Ava. Its presence corrupts the fabric of worlds.'],
  ['AVA, GRIM REAPER',"Master Death's champion, taken captive. Her absence unravels the boundary between life and death."],
];

// "Lore" tab panel: world-building blurbs for the four core entities.
export default function LorePanel({ onBack, compact = false }) {
  return (
    <div data-testid="lore-panel" style={{ animation: 'fadeSlide 0.3s ease', width: '100%' }}>
      <div style={{
        background: 'rgba(8,4,20,0.88)',
        border: '1px solid rgba(124,58,237,0.35)',
        padding: compact ? '18px 16px' : '28px 28px',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        marginBottom: 20,
        textAlign: 'left',
      }}>
        <div style={{
          color: '#7c3aed', fontSize: 10,
          letterSpacing: '0.4em', marginBottom: 18,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ◆ DIMENSIONAL ARCHIVE
        </div>
        {LORE_BLOCKS.map(([title, text]) => (
          <div key={title} style={{ marginBottom: 16 }}>
            <div style={{
              color: '#a855f7', fontSize: 10, letterSpacing: '0.3em',
              marginBottom: 5, fontFamily: "'JetBrains Mono', monospace",
            }}>{title}</div>
            <div style={{ color: '#9888c0', fontSize: compact ? 12 : 13, lineHeight: 1.65, fontStyle: 'italic' }}>
              {text}
            </div>
          </div>
        ))}
      </div>
      <MenuButton testId="lore-back-button" onClick={onBack} variant="secondary" compact={compact}>← Back</MenuButton>
    </div>
  );
}
