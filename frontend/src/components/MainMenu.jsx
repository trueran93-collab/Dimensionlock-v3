import React, { useEffect, useState } from 'react';
import UnlocksShop from './UnlocksShop.jsx';

import BgCanvas       from './menu/BgCanvas.jsx';
import CornerBrackets from './menu/CornerBrackets.jsx';
import MenuButton     from './menu/MenuButton.jsx';
import TitleArt       from './menu/TitleArt.jsx';
import ControlsPanel  from './menu/ControlsPanel.jsx';
import LorePanel      from './menu/LorePanel.jsx';
import { CharacterArtDesktop, CharacterArtMobile } from './menu/CharacterArt.jsx';
import { useViewport } from './menu/useViewport.js';
import { LORE_LINES }  from './menu/constants.js';

// Main Menu — composition shell that wires the menu sub-modules together.
// Heavy lifting (background canvas, title art, character art, panels) lives in
// /components/menu/* so this file stays focused on layout + tab state.
export default function MainMenu({ onPlay }) {
  const [tab, setTab]         = useState('main');
  const [loreIdx, setLoreIdx] = useState(0);
  const { isMobile, isCompact } = useViewport();

  useEffect(() => {
    const id = setInterval(() => setLoreIdx(i => (i + 1) % LORE_LINES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div data-testid="main-menu" style={{
      position: 'fixed', inset: 0,
      fontFamily: "'Outfit', sans-serif",
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
      color: '#e8e0f0',
      userSelect: 'none',
    }}>
      <BgCanvas />
      <CornerBrackets compact={isCompact} />

      {/* ── Top system bar ──────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: isCompact ? 28 : 36,
        background: 'rgba(10,5,25,0.92)',
        borderBottom: '1px solid rgba(124,58,237,0.3)',
        display: 'flex', alignItems: 'center',
        padding: isCompact ? '0 16px' : '0 60px',
        gap: isCompact ? 12 : 32, zIndex: 10,
      }}>
        <span style={{ color: '#7c3aed', fontSize: isCompact ? 9 : 10, letterSpacing: isCompact ? '0.18em' : '0.3em', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
          ◆ SYS:DL-7.3
        </span>
        {!isCompact && (
          <span style={{ color: '#444', fontSize: 10, letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace" }}>|</span>
        )}
        <span style={{
          color: '#ff4466',
          fontSize: isCompact ? 9 : 10,
          letterSpacing: isCompact ? '0.18em' : '0.25em',
          fontFamily: "'JetBrains Mono', monospace",
          animation: 'statusBlink 1.8s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}>
          ● RIFT UNSTABLE
        </span>
        <div style={{ flex: 1 }} />
        {!isMobile && (
          <span style={{ color: '#4a3a6a', fontSize: 10, letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
            BUILD 1.0.0 ◆ VOID ENGINE
          </span>
        )}
      </div>

      {/* ── Main layout ─────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex',
        flexDirection: isCompact ? 'column' : 'row',
        alignItems: isCompact ? 'center' : 'stretch',
        minHeight: '100vh',
        paddingTop: isCompact ? 36 : 44,
        paddingBottom: isCompact ? 56 : 44,
      }}>
        {/* ── Left panel ─────────────────── */}
        <div style={{
          flex: isCompact ? 'unset' : '0 0 52%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: isCompact ? 'center' : 'flex-start',
          padding: isCompact ? '8px 16px 0' : '0 5% 0 7%',
          textAlign: isCompact ? 'center' : 'left',
          gap: 0,
        }}>
          {/* Tag line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: isCompact ? 8 : 16,
            justifyContent: isCompact ? 'center' : 'flex-start',
          }}>
            <div style={{ height: 1, width: isCompact ? 24 : 36, background: 'rgba(168,85,247,0.5)' }} />
            <span style={{
              color: '#7c3aed',
              fontSize: isCompact ? 9 : 10,
              letterSpacing: isCompact ? '0.32em' : '0.45em',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              A GlobalComix Series
            </span>
            <div style={{ height: 1, width: isCompact ? 24 : 0, background: 'rgba(168,85,247,0.5)' }} />
          </div>

          <TitleArt compact={isCompact} />

          {/* Subtitle rule */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: isCompact ? '4px 0 18px' : '4px 0 28px',
            width: '100%',
            maxWidth: isCompact ? 360 : 580,
          }}>
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, rgba(168,85,247,0.6), transparent)' }} />
            <div style={{ width: 6, height: 6, background: '#a855f7', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, flex: 0.4, background: 'linear-gradient(to left, rgba(168,85,247,0.3), transparent)' }} />
          </div>

          {/* Tab content */}
          <div style={{ width: '100%', maxWidth: isCompact ? 360 : 380, display: 'flex', justifyContent: isCompact ? 'center' : 'flex-start' }}>
            {tab === 'main' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: isCompact ? 'center' : 'flex-start' }}>
                <MenuButton testId="enter-endless-button" large onClick={onPlay} variant="primary" compact={isCompact}>
                  Enter the Endless
                </MenuButton>
                <MenuButton testId="shop-button" onClick={() => setTab('shop')} variant="secondary" compact={isCompact}>
                  Soul Shop
                </MenuButton>
                <MenuButton testId="controls-button" onClick={() => setTab('controls')} variant="secondary" compact={isCompact}>
                  Controls
                </MenuButton>
                <MenuButton testId="lore-button" onClick={() => setTab('lore')} variant="secondary" compact={isCompact}>
                  Lore
                </MenuButton>
              </div>
            )}

            {tab === 'shop'     && <UnlocksShop  onBack={() => setTab('main')} compact={isCompact} />}
            {tab === 'controls' && <ControlsPanel onBack={() => setTab('main')} compact={isCompact} />}
            {tab === 'lore'     && <LorePanel     onBack={() => setTab('main')} compact={isCompact} />}
          </div>

          {/* Lore ticker (desktop only on main tab) */}
          {tab === 'main' && !isCompact && (
            <div style={{ marginTop: 36, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ color: '#4a3a6a', fontSize: 16, marginTop: 1 }}>❝</div>
              <p style={{
                color: '#6a5a8a', fontSize: 12,
                fontStyle: 'italic', lineHeight: 1.6,
                margin: 0, maxWidth: 400,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                transition: 'opacity 0.6s ease',
                animation: 'loreFade 5s ease-in-out infinite',
              }}>
                {LORE_LINES[loreIdx]}
              </p>
            </div>
          )}
        </div>

        {/* ── Right / Bottom — Character art ───────── */}
        {!isCompact && <CharacterArtDesktop />}
        {isCompact && tab === 'main' && <CharacterArtMobile isMobile={isMobile} />}
      </div>

      {/* ── Bottom status bar ───────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: isCompact ? 28 : 32,
        background: 'rgba(8,4,20,0.92)',
        borderTop: '1px solid rgba(124,58,237,0.25)',
        display: 'flex', alignItems: 'center',
        padding: isCompact ? '0 16px' : '0 60px',
        gap: isCompact ? 12 : 24, zIndex: 10,
      }}>
        <span style={{
          color: '#4a3a6a',
          fontSize: isCompact ? 9 : 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.15em',
          flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {LORE_LINES[loreIdx]}
        </span>
        {!isMobile && (
          <span style={{
            color: '#7c3aed',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.2em', flexShrink: 0,
          }}>
            ◆ VOID ENGINE v1.0
          </span>
        )}
      </div>

      {/* ── Keyframes (shared by all menu sub-modules) ─── */}
      <style>{`
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes titleGlitchRed {
          0%, 87%, 100% { opacity: 0; transform: translateX(0); }
          88% { opacity: 0.55; transform: translateX(-5px); clip-path: inset(35% 0 30% 0); }
          90% { opacity: 0.3; transform: translateX(3px); clip-path: inset(10% 0 60% 0); }
          91% { opacity: 0; }
        }
        @keyframes titleGlitchCyan {
          0%, 88%, 100% { opacity: 0; transform: translateX(0); }
          89% { opacity: 0.4; transform: translateX(5px); clip-path: inset(55% 0 10% 0); }
          91% { opacity: 0.22; transform: translateX(-3px); clip-path: inset(5% 0 70% 0); }
          92% { opacity: 0; }
        }
        @keyframes statusBlink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.45; }
        }
        @keyframes auraBreath {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes charIdle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(-0.3deg); }
        }
        @keyframes beamFlicker {
          0%, 100% { opacity: 0.6; } 45% { opacity: 1; } 70% { opacity: 0.75; }
        }
        @keyframes groundPulse {
          0%, 100% { transform: translateX(-50%) scaleX(1);   opacity: 0.6; }
          50%      { transform: translateX(-50%) scaleX(1.15); opacity: 1; }
        }
        @keyframes loreFade {
          0%, 85%, 100% { opacity: 1; } 90% { opacity: 0; } 95% { opacity: 1; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
