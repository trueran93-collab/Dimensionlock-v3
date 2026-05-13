import React, { useState, useEffect, useRef, useCallback } from 'react';

const MAYTRADALIS_ART = 'https://customer-assets.emergentagent.com/job_gothic-action-beats/artifacts/eqvwwi5o_611d4b76933a75a5a6923ea9856fcd49.webp';

const LORE_LINES = [
  '"Between the folds of reality, where death has no dominion, she hunts."',
  '"The Endless is not a place. It is what remains when worlds collapse."',
  '"Every soul consumed feeds the Lurker. Every floor cleared weakens its grip."',
  '"Maytradalis does not fear death. She IS the scythe that cuts through it."',
  '"The Grim Reaper Ava waits. The Endless watches. The count begins."',
];

const CONTROLS = [
  { action: 'Move',          key: '← → / A D'       },
  { action: 'Walk → Run',    key: 'Hold direction'   },
  { action: 'Jump',          key: 'Z / Space / ↑'    },
  { action: 'Double Jump',   key: 'Z / Space (air)'  },
  { action: 'Dash',          key: 'X / Shift'        },
  { action: 'Light Attack',  key: 'A / J'            },
  { action: 'Heavy Attack',  key: 'S / K'            },
  { action: 'Special',       key: 'D / L'            },
  { action: 'Ultimate',      key: 'Q / U'            },
  { action: 'Pause',         key: 'Esc / P'          },
];

// ── Hex grid + particle background canvas ─────────────────
function BgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let frame = 0;
    const particles = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn ambient particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.5,
        size: 0.8 + Math.random() * 1.6,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() < 0.6 ? '168,85,247' : '0,255,180',
        life: Math.random(),
      });
    }

    const hex = (x, y, r, alpha, fill = false) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = `rgba(${fill},${alpha * 0.25})`;
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(100,60,180,${alpha})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    };

    const draw = () => {
      frame++;
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      // ── Base gradient ──────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#030108');
      bg.addColorStop(0.5, '#060212');
      bg.addColorStop(1, '#030108');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Hex grid ──────────────────────────────────────
      const HR = 52;
      const hW  = HR * 2 * 0.866; // col step
      const hH  = HR * 1.5;       // row step
      const cx  = W * 0.5;
      const cy  = H * 0.45;

      for (let row = -2; row < H / hH + 2; row++) {
        for (let col = -2; col < W / hW + 2; col++) {
          const hx = col * hW + (row % 2 === 0 ? 0 : hW * 0.5);
          const hy = row * hH;
          const dist = Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2);
          const wave = Math.sin(dist * 0.01 - frame * 0.035) * 0.5 + 0.5;
          const a = 0.025 + wave * 0.055;

          // Occasionally light up a hex
          const seed = (row * 31 + col * 17) % 100;
          const isPulsing = seed < 4 && Math.sin(frame * 0.04 + seed * 0.7) > 0.7;
          hex(hx, hy, HR - 3, isPulsing ? a * 3 : a,
              isPulsing ? (seed < 2 ? '168,85,247' : '0,230,160') : false);
        }
      }

      // ── Diagonal energy lines ──────────────────────────
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const progress = ((frame * 0.006 + i * 0.25) % 1);
        const lineX = -W * 0.3 + progress * W * 1.6;
        const alpha = Math.sin(progress * Math.PI) * 0.12;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = i % 2 === 0 ? '#a855f7' : '#00ffcc';
        ctx.lineWidth = i % 2 === 0 ? 1 : 0.6;
        ctx.beginPath();
        ctx.moveTo(lineX, 0); ctx.lineTo(lineX + H * 0.6, H);
        ctx.stroke();
      }
      ctx.restore();

      // ── Particles ─────────────────────────────────────
      ctx.save();
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.life += 0.004;
        if (p.y < -10 || p.life > 1) {
          p.x = Math.random() * W;
          p.y = H + 5;
          p.life = 0;
        }
        const a = Math.sin(p.life * Math.PI) * p.alpha;
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${p.color})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── Scanline overlay ──────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.025;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, W, 1);
      }
      ctx.restore();

      // ── Vignette ──────────────────────────────────────
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// ── Corner bracket decoration ──────────────────────────────
function CornerBrackets() {
  const style = (pos) => ({
    position: 'absolute', ...pos,
    width: 36, height: 36,
    pointerEvents: 'none', zIndex: 2,
  });
  const lineH = { position: 'absolute', height: 1, background: '#7c3aed', opacity: 0.7 };
  const lineV = { position: 'absolute', width: 1, background: '#7c3aed', opacity: 0.7 };
  const corner = (flip) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
      style={{ transform: `scale(${flip.x ? -1 : 1}, ${flip.y ? -1 : 1})` }}>
      <polyline points="36,2 2,2 2,36" stroke="#7c3aed" strokeWidth="1.5" opacity="0.8"/>
      <polyline points="36,2 2,2 2,36" stroke="#a855f7" strokeWidth="0.5" opacity="0.5"/>
    </svg>
  );
  return (
    <>
      <div style={style({ top: 16, left: 16 })}>{corner({ x: false, y: false })}</div>
      <div style={style({ top: 16, right: 16 })}>{corner({ x: true, y: false })}</div>
      <div style={style({ bottom: 16, left: 16 })}>{corner({ x: false, y: true })}</div>
      <div style={style({ bottom: 16, right: 16 })}>{corner({ x: true, y: true })}</div>
      {/* Top & bottom thin lines */}
      <div style={{ ...lineH, top: 18, left: 56, right: 56, zIndex: 2, opacity: 0.3 }} />
      <div style={{ ...lineH, bottom: 18, left: 56, right: 56, zIndex: 2, opacity: 0.3 }} />
    </>
  );
}

// ── Glitch title ───────────────────────────────────────────
function GlitchTitle() {
  return (
    <div style={{ position: 'relative', lineHeight: 1, marginBottom: 4 }}>
      {/* Base */}
      <h1 style={{
        fontFamily: "'Cinzel Decorative', 'Cinzel', 'Times New Roman', serif",
        fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        color: '#f0eaff',
        textShadow: '0 0 40px rgba(168,85,247,0.85), 0 0 80px rgba(168,85,247,0.35), 0 2px 0 #4c1d95',
        margin: 0,
        animation: 'titleGlitch 8s steps(1) infinite',
        userSelect: 'none',
      }}>
        DIMENSIONLOCK
      </h1>
      {/* Glitch layer 1 */}
      <h1 aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0,
        fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
        fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        color: '#ff3366',
        margin: 0,
        opacity: 0,
        animation: 'glitchLayer1 8s steps(1) infinite',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        DIMENSIONLOCK
      </h1>
      {/* Glitch layer 2 */}
      <h1 aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0,
        fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
        fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        color: '#00ffcc',
        margin: 0,
        opacity: 0,
        animation: 'glitchLayer2 8s steps(1) infinite',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        DIMENSIONLOCK
      </h1>
    </div>
  );
}

// ── Styled menu button ─────────────────────────────────────
function MenuButton({ children, onClick, variant = 'primary', large = false }) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: hover
          ? (isPrimary ? 'rgba(168,85,247,0.22)' : 'rgba(0,255,204,0.1)')
          : 'rgba(8,4,20,0.85)',
        border: `1px solid ${hover
          ? (isPrimary ? '#a855f7' : '#00ffcc')
          : (isPrimary ? '#7c3aed66' : '#00ffcc44')}`,
        color: hover
          ? (isPrimary ? '#e8d5ff' : '#00ffcc')
          : '#b8a8d8',
        padding: large ? '16px 48px' : '12px 32px',
        fontSize: large ? 16 : 13,
        fontWeight: 700,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        fontFamily: "'Outfit', 'JetBrains Mono', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: large ? 280 : 220,
        boxShadow: hover
          ? `0 0 24px ${isPrimary ? 'rgba(168,85,247,0.35)' : 'rgba(0,255,204,0.25)'}, inset 0 0 14px ${isPrimary ? 'rgba(168,85,247,0.08)' : 'rgba(0,255,204,0.06)'}`
          : 'none',
        // Angular cut on one corner
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}
    >
      {isPrimary && (
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          background: hover ? '#a855f7' : '#7c3aed66',
          transform: 'rotate(45deg)',
          transition: 'background 0.2s',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

// ── Main Menu ──────────────────────────────────────────────
export default function MainMenu({ onPlay }) {
  const [tab, setTab]         = useState('main'); // 'main' | 'controls' | 'lore'
  const [loreIdx, setLoreIdx] = useState(0);
  const [systemStatus]        = useState(() => ['RIFT UNSTABLE', 'THREAT: CRITICAL', 'SOULS DETECTED'][0]);

  // Cycle lore lines
  useEffect(() => {
    const id = setInterval(() => setLoreIdx(i => (i + 1) % LORE_LINES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      fontFamily: "'Outfit', sans-serif",
      overflow: 'hidden',
      color: '#e8e0f0',
      userSelect: 'none',
    }}>
      {/* Animated background canvas */}
      <BgCanvas />

      {/* Corner decorations */}
      <CornerBrackets />

      {/* ── Top system bar ──────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 36,
        background: 'rgba(10,5,25,0.92)',
        borderBottom: '1px solid rgba(124,58,237,0.3)',
        display: 'flex', alignItems: 'center',
        padding: '0 60px',
        gap: 32, zIndex: 10,
      }}>
        <span style={{ color: '#7c3aed', fontSize: 10, letterSpacing: '0.3em', fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ SYS:DIMENSIONLOCK-7.3
        </span>
        <span style={{ color: '#444', fontSize: 10, letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace" }}>|</span>
        <span style={{ color: '#ff4466', fontSize: 10, letterSpacing: '0.25em', fontFamily: "'JetBrains Mono', monospace",
          animation: 'statusBlink 1.8s ease-in-out infinite' }}>
          ● {systemStatus}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#4a3a6a', fontSize: 10, letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace" }}>
          BUILD 1.0.0 ◆ VOID ENGINE
        </span>
      </div>

      {/* ── Main layout ─────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex',
        alignItems: 'stretch',
        height: '100%',
        paddingTop: 36,
      }}>

        {/* ── Left panel ──────────────────────────────── */}
        <div style={{
          flex: '0 0 52%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 5% 0 7%',
          gap: 0,
        }}>

          {/* Tag line */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16,
          }}>
            <div style={{ height: 1, width: 36, background: 'rgba(168,85,247,0.5)' }} />
            <span style={{
              color: '#7c3aed', fontSize: 10, letterSpacing: '0.45em',
              fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
            }}>
              DEATHLY STORIES
            </span>
          </div>

          {/* Glitch title */}
          <GlitchTitle />

          {/* Subtitle rule */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 36px',
          }}>
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, rgba(168,85,247,0.6), transparent)' }} />
            <div style={{ width: 6, height: 6, background: '#a855f7', transform: 'rotate(45deg)' }} />
            <div style={{ height: 1, width: 40, background: 'rgba(168,85,247,0.3)' }} />
          </div>

          {/* Tab content */}
          {tab === 'main' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <MenuButton large onClick={onPlay} variant="primary">
                Enter the Endless
              </MenuButton>
              <MenuButton onClick={() => setTab('controls')} variant="secondary">
                Controls
              </MenuButton>
              <MenuButton onClick={() => setTab('lore')} variant="secondary">
                Lore
              </MenuButton>
            </div>
          )}

          {tab === 'controls' && (
            <div style={{ animation: 'fadeSlide 0.3s ease' }}>
              <div style={{
                background: 'rgba(8,4,20,0.88)',
                border: '1px solid rgba(124,58,237,0.4)',
                padding: '24px 28px',
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                marginBottom: 16,
              }}>
                {CONTROLS.map(({ action, key }) => (
                  <div key={action} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(124,58,237,0.1)',
                  }}>
                    <span style={{
                      color: action === 'Walk → Run' ? '#00ffcc' : '#9888c0',
                      fontSize: 12, letterSpacing: '0.08em',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {action === 'Walk → Run' && '◈ '}{action}
                    </span>
                    <span style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.35)',
                      color: '#c4b5fd',
                      padding: '3px 10px', borderRadius: 2,
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.05em',
                    }}>{key}</span>
                  </div>
                ))}
              </div>
              <MenuButton onClick={() => setTab('main')} variant="secondary">← Back</MenuButton>
            </div>
          )}

          {tab === 'lore' && (
            <div style={{ animation: 'fadeSlide 0.3s ease' }}>
              <div style={{
                background: 'rgba(8,4,20,0.88)',
                border: '1px solid rgba(124,58,237,0.35)',
                padding: '28px 28px',
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                marginBottom: 20,
                minHeight: 260,
              }}>
                <div style={{
                  color: '#7c3aed', fontSize: 10,
                  letterSpacing: '0.4em', marginBottom: 20,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ◆ DIMENSIONAL ARCHIVE
                </div>
                {[
                  ['THE ENDLESS', 'A dimension born from collapsed realities. Time fragments here. Death does not hold.'],
                  ['MAYTRADALIS', 'A Reaper of the 7th Void. Her scythe Sorrow-Eater harvests souls across broken worlds.'],
                  ['THE LURKER', 'Ancient plague-herald who imprisons Ava. Its presence corrupts the fabric of worlds.'],
                  ['AVA, GRIM REAPER', 'Master Death\'s champion, taken captive. Her absence unravels the boundary between life and death.'],
                ].map(([title, text]) => (
                  <div key={title} style={{ marginBottom: 18 }}>
                    <div style={{
                      color: '#a855f7', fontSize: 10, letterSpacing: '0.3em',
                      marginBottom: 5, fontFamily: "'JetBrains Mono', monospace",
                    }}>{title}</div>
                    <div style={{ color: '#9888c0', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>
                      {text}
                    </div>
                  </div>
                ))}
              </div>
              <MenuButton onClick={() => setTab('main')} variant="secondary">← Back</MenuButton>
            </div>
          )}

          {/* Lore ticker */}
          {tab === 'main' && (
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

        {/* ── Right panel — Character art ────────────── */}
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
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
      </div>

      {/* ── Bottom status bar ───────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 32,
        background: 'rgba(8,4,20,0.92)',
        borderTop: '1px solid rgba(124,58,237,0.25)',
        display: 'flex', alignItems: 'center',
        padding: '0 60px',
        gap: 24, zIndex: 10,
      }}>
        <span style={{
          color: '#4a3a6a', fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.15em',
          flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {LORE_LINES[loreIdx]}
        </span>
        <span style={{
          color: '#7c3aed', fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.2em', flexShrink: 0,
        }}>
          ◆ VOID ENGINE v1.0
        </span>
      </div>

      {/* ── Keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes titleGlitch {
          0%, 87%, 100% { transform: translateX(0); }
          88% { transform: translateX(-3px) skewX(-1deg); }
          90% { transform: translateX(3px); }
          92% { transform: translateX(0); }
        }
        @keyframes glitchLayer1 {
          0%, 87%, 93%, 100% { opacity: 0; transform: translateX(0); }
          88% { opacity: 0.65; transform: translateX(-4px); clip-path: inset(45% 0 25% 0); }
          90% { opacity: 0.35; transform: translateX(2px); clip-path: inset(15% 0 60% 0); }
          91% { opacity: 0; }
        }
        @keyframes glitchLayer2 {
          0%, 88%, 93%, 100% { opacity: 0; transform: translateX(0); }
          89% { opacity: 0.5; transform: translateX(4px); clip-path: inset(60% 0 10% 0); }
          91% { opacity: 0.25; transform: translateX(-2px); clip-path: inset(5% 0 75% 0); }
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
