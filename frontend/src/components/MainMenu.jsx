import React, { useState, useEffect, useRef } from 'react';

const MAYTRADALIS_ART = 'https://customer-assets.emergentagent.com/job_gothic-action-beats/artifacts/eqvwwi5o_611d4b76933a75a5a6923ea9856fcd49.webp';
const TITLE_ART = 'https://customer-assets.emergentagent.com/job_mobile-ui-demon-fix/artifacts/i0t28uzi_DLDS-White-1.png';

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

// ── Hook: viewport size tracking ──────────────────────────────
function useViewport() {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return { vw, isMobile: vw < 768, isCompact: vw < 1024 };
}

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

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#030108');
      bg.addColorStop(0.5, '#060212');
      bg.addColorStop(1, '#030108');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const HR = Math.max(36, Math.min(W, H) * 0.06);
      const hW  = HR * 2 * 0.866;
      const hH  = HR * 1.5;
      const cx  = W * 0.5;
      const cy  = H * 0.45;

      for (let row = -2; row < H / hH + 2; row++) {
        for (let col = -2; col < W / hW + 2; col++) {
          const hx = col * hW + (row % 2 === 0 ? 0 : hW * 0.5);
          const hy = row * hH;
          const dist = Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2);
          const wave = Math.sin(dist * 0.01 - frame * 0.035) * 0.5 + 0.5;
          const a = 0.025 + wave * 0.055;

          const seed = (row * 31 + col * 17) % 100;
          const isPulsing = seed < 4 && Math.sin(frame * 0.04 + seed * 0.7) > 0.7;
          hex(hx, hy, HR - 3, isPulsing ? a * 3 : a,
              isPulsing ? (seed < 2 ? '168,85,247' : '0,230,160') : false);
        }
      }

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

      ctx.save();
      ctx.globalAlpha = 0.025;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, W, 1);
      }
      ctx.restore();

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

// ── Corner brackets ──────────────────────────────────────
function CornerBrackets({ compact }) {
  const sz = compact ? 22 : 36;
  const inset = compact ? 8 : 16;
  const style = (pos) => ({ position: 'absolute', ...pos, width: sz, height: sz, pointerEvents: 'none', zIndex: 2 });
  const corner = (flip) => (
    <svg width={sz} height={sz} viewBox="0 0 36 36" fill="none"
      style={{ transform: `scale(${flip.x ? -1 : 1}, ${flip.y ? -1 : 1})` }}>
      <polyline points="36,2 2,2 2,36" stroke="#7c3aed" strokeWidth="1.5" opacity="0.8"/>
      <polyline points="36,2 2,2 2,36" stroke="#a855f7" strokeWidth="0.5" opacity="0.5"/>
    </svg>
  );
  return (
    <>
      <div style={style({ top: inset, left: inset })}>{corner({ x: false, y: false })}</div>
      <div style={style({ top: inset, right: inset })}>{corner({ x: true, y: false })}</div>
      <div style={style({ bottom: inset, left: inset })}>{corner({ x: false, y: true })}</div>
      <div style={style({ bottom: inset, right: inset })}>{corner({ x: true, y: true })}</div>
    </>
  );
}

// ── Styled menu button ─────────────────────────────────────
function MenuButton({ children, onClick, variant = 'primary', large = false, testId, compact = false }) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === 'primary';
  return (
    <button
      data-testid={testId}
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
        padding: large
          ? (compact ? '13px 28px' : '16px 48px')
          : (compact ? '10px 18px' : '12px 32px'),
        fontSize: large ? (compact ? 13 : 16) : (compact ? 11 : 13),
        fontWeight: 700,
        letterSpacing: compact ? '0.22em' : '0.35em',
        textTransform: 'uppercase',
        fontFamily: "'Outfit', 'JetBrains Mono', sans-serif",
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        maxWidth: large ? (compact ? 320 : 340) : (compact ? 260 : 280),
        boxShadow: hover
          ? `0 0 24px ${isPrimary ? 'rgba(168,85,247,0.35)' : 'rgba(0,255,204,0.25)'}, inset 0 0 14px ${isPrimary ? 'rgba(168,85,247,0.08)' : 'rgba(0,255,204,0.06)'}`
          : 'none',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        WebkitTapHighlightColor: 'transparent',
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

// ── Title artwork ───────────────────────────────────────────
function TitleArt({ compact }) {
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
      {/* Glitch overlay */}
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

// ── Main Menu ──────────────────────────────────────────────
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
      {/* Animated background canvas */}
      <BgCanvas />

      {/* Corner decorations */}
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

        {/* ── Left panel / Top section (mobile) ──────── */}
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

          {/* Title artwork */}
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
                <MenuButton testId="controls-button" onClick={() => setTab('controls')} variant="secondary" compact={isCompact}>
                  Controls
                </MenuButton>
                <MenuButton testId="lore-button" onClick={() => setTab('lore')} variant="secondary" compact={isCompact}>
                  Lore
                </MenuButton>
              </div>
            )}

            {tab === 'controls' && (
              <div data-testid="controls-panel" style={{ animation: 'fadeSlide 0.3s ease', width: '100%' }}>
                <div style={{
                  background: 'rgba(8,4,20,0.88)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  padding: isCompact ? '14px 16px' : '24px 28px',
                  clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                  marginBottom: 16,
                  textAlign: 'left',
                }}>
                  {CONTROLS.map(({ action, key }) => (
                    <div key={action} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: isCompact ? '5px 0' : '7px 0',
                      borderBottom: '1px solid rgba(124,58,237,0.1)',
                      gap: 8,
                    }}>
                      <span style={{
                        color: action === 'Walk → Run' ? '#00ffcc' : '#9888c0',
                        fontSize: isCompact ? 11 : 12, letterSpacing: '0.08em',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {action === 'Walk → Run' && '◈ '}{action}
                      </span>
                      <span style={{
                        background: 'rgba(124,58,237,0.15)',
                        border: '1px solid rgba(124,58,237,0.35)',
                        color: '#c4b5fd',
                        padding: isCompact ? '2px 8px' : '3px 10px', borderRadius: 2,
                        fontSize: isCompact ? 10 : 11, fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}>{key}</span>
                    </div>
                  ))}
                </div>
                <MenuButton testId="controls-back-button" onClick={() => setTab('main')} variant="secondary" compact={isCompact}>← Back</MenuButton>
              </div>
            )}

            {tab === 'lore' && (
              <div data-testid="lore-panel" style={{ animation: 'fadeSlide 0.3s ease', width: '100%' }}>
                <div style={{
                  background: 'rgba(8,4,20,0.88)',
                  border: '1px solid rgba(124,58,237,0.35)',
                  padding: isCompact ? '18px 16px' : '28px 28px',
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
                  {[
                    ['THE ENDLESS', 'A dimension born from collapsed realities. Time fragments here. Death does not hold.'],
                    ['MAYTRADALIS', 'A Reaper of the 7th Void. Her scythe Sorrow-Eater harvests souls across broken worlds.'],
                    ['THE LURKER', 'Ancient plague-herald who imprisons Ava. Its presence corrupts the fabric of worlds.'],
                    ['AVA, GRIM REAPER', 'Master Death\'s champion, taken captive. Her absence unravels the boundary between life and death.'],
                  ].map(([title, text]) => (
                    <div key={title} style={{ marginBottom: 16 }}>
                      <div style={{
                        color: '#a855f7', fontSize: 10, letterSpacing: '0.3em',
                        marginBottom: 5, fontFamily: "'JetBrains Mono', monospace",
                      }}>{title}</div>
                      <div style={{ color: '#9888c0', fontSize: isCompact ? 12 : 13, lineHeight: 1.65, fontStyle: 'italic' }}>
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
                <MenuButton testId="lore-back-button" onClick={() => setTab('main')} variant="secondary" compact={isCompact}>← Back</MenuButton>
              </div>
            )}
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

        {/* ── Right panel — Character art ────────────── */}
        {!isCompact && (
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
        )}

        {/* ── Mobile character art (smaller, below buttons) ── */}
        {isCompact && tab === 'main' && (
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
        )}
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

      {/* ── Keyframes ───────────────────────────────────── */}
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
