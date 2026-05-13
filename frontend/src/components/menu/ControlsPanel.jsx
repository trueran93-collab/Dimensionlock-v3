import React from 'react';
import MenuButton from './MenuButton';
import { CONTROLS } from './constants';

// "Controls" tab panel: list of all key bindings with the Walk → Run highlight.
export default function ControlsPanel({ onBack, compact = false }) {
  return (
    <div data-testid="controls-panel" style={{ animation: 'fadeSlide 0.3s ease', width: '100%' }}>
      <div style={{
        background: 'rgba(8,4,20,0.88)',
        border: '1px solid rgba(124,58,237,0.4)',
        padding: compact ? '14px 16px' : '24px 28px',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        marginBottom: 16,
        textAlign: 'left',
      }}>
        {CONTROLS.map(({ action, key }) => (
          <div key={action} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: compact ? '5px 0' : '7px 0',
            borderBottom: '1px solid rgba(124,58,237,0.1)',
            gap: 8,
          }}>
            <span style={{
              color: action === 'Walk → Run' ? '#00ffcc' : '#9888c0',
              fontSize: compact ? 11 : 12, letterSpacing: '0.08em',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {action === 'Walk → Run' && '◈ '}{action}
            </span>
            <span style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#c4b5fd',
              padding: compact ? '2px 8px' : '3px 10px', borderRadius: 2,
              fontSize: compact ? 10 : 11, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}>{key}</span>
          </div>
        ))}
      </div>
      <MenuButton testId="controls-back-button" onClick={onBack} variant="secondary" compact={compact}>← Back</MenuButton>
    </div>
  );
}
