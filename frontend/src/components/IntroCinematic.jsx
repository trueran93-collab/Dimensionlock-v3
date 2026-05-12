import React, { useState, useEffect, useCallback, useRef } from 'react';

const MAYTRADALIS_IMG = 'https://customer-assets.emergentagent.com/job_c1138fce-9759-4254-b7df-5009813f2eea/artifacts/rqp9hfld_694daec83256ed840148d9505e779707.webp';
const LURKER_IMG = '/intro/lurker.png';
const MASTER_DEATH_IMG = '/intro/master_death.png';
const FLYBUTT_IMG = '/intro/flybutt.png';

const SCENES = [
  { id: 'scene_death',  duration: 4200, char: 'death',       text: '"Maytradalis… the Grim Reaper Ava has been taken into the Endless."' },
  { id: 'scene_death2', duration: 3800, char: 'death',       text: '"The Lurker — that plagued shadow — holds her captive beyond the veil."' },
  { id: 'scene_mayt',  duration: 4000, char: 'maytradalis', text: '"Then I\'ll find her and bring her back. Whatever lives in the dark between… I\'ll cut through it all."' },
  { id: 'scene_fly',   duration: 3300, char: 'flybutt',     text: '"Bzzt! Flybutt knows the Endless! I\'ll guide you through the void, boss!"' },
  { id: 'lurker',      duration: 3500, char: 'lurker',      text: '"…The Lurker stirs in the deep dark between worlds…"' },
  { id: 'cta',         duration: 99999 },
];

// ──────────────────────────────────────────────────────────
// Typewriter
// ──────────────────────────────────────────────────────────
function TypewriterText({ text, speed = 28 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

// ──────────────────────────────────────────────────────────
// Character Particle Canvas overlay
// ──────────────────────────────────────────────────────────
const PARTICLE_CONFIGS = {
  maytradalis: {
    spawnRate:  0.45,
    colors:     ['rgba(168,85,247,', 'rgba(139,92,246,', 'rgba(196,132,252,', 'rgba(221,160,255,'],
    minSize: 1.2, maxSize: 3.8,
    minLife: 0.45, maxLife: 1.1,
    region: 'wide',
    vxRange: [-1.4, 1.4],
    vyRange: [-2.6, -0.5],
    glow: null,
    extraFx: 'energyRing',
  },
  death: {
    spawnRate:  0.3,
    colors:     ['rgba(0,255,204,', 'rgba(0,210,180,', 'rgba(120,255,230,'],
    minSize: 0.9, maxSize: 3.2,
    minLife: 0.38, maxLife: 0.95,
    region: 'sides',
    vxRange: [-0.7, 0.7],
    vyRange: [-2.1, -0.3],
    glow: 'rgba(0,255,204,0.07)',
    extraFx: 'wispTrails',
  },
  flybutt: {
    spawnRate:  0.6,
    colors:     ['rgba(212,168,0,', 'rgba(255,200,20,', 'rgba(255,230,100,', 'rgba(255,245,150,'],
    minSize: 0.8, maxSize: 2.8,
    minLife: 0.18, maxLife: 0.6,
    region: 'center',
    vxRange: [-3.2, 3.2],
    vyRange: [-3.2, -0.4],
    glow: null,
    extraFx: 'buzzTrails',
  },
  lurker: {
    spawnRate:  0.38,
    colors:     ['rgba(255,51,102,', 'rgba(200,0,50,', 'rgba(160,10,10,', 'rgba(255,80,80,'],
    minSize: 1.4, maxSize: 5.2,
    minLife: 0.4, maxLife: 1.2,
    region: 'bottom',
    vxRange: [-0.9, 0.9],
    vyRange: [-1.4, -0.15],
    glow: 'rgba(180,0,0,0.07)',
    extraFx: 'glitchLines',
  },
};

function CharacterParticles({ char }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = 600;
    canvas.height = 800;

    const ctx = canvas.getContext('2d');
    const cfg = PARTICLE_CONFIGS[char] || PARTICLE_CONFIGS.maytradalis;

    let rafId;
    let frame = 0;
    let particles = [];

    const W = canvas.width;
    const H = canvas.height;

    const spawn = () => {
      let x, y;
      switch (cfg.region) {
        case 'wide':
          x = Math.random() * W;
          y = H * 0.65 + Math.random() * (H * 0.35);
          break;
        case 'sides':
          x = Math.random() < 0.5
            ? Math.random() * W * 0.22
            : W * 0.78 + Math.random() * W * 0.22;
          y = H * 0.25 + Math.random() * (H * 0.55);
          break;
        case 'center':
          x = W * 0.28 + Math.random() * W * 0.44;
          y = H * 0.38 + Math.random() * H * 0.44;
          break;
        case 'bottom':
          x = W * 0.08 + Math.random() * W * 0.84;
          y = H * 0.72 + Math.random() * H * 0.28;
          break;
        default:
          x = Math.random() * W;
          y = H * 0.5 + Math.random() * H * 0.5;
      }

      const life = cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife);
      particles.push({
        x, y,
        vx: cfg.vxRange[0] + Math.random() * (cfg.vxRange[1] - cfg.vxRange[0]),
        vy: cfg.vyRange[0] + Math.random() * (cfg.vyRange[1] - cfg.vyRange[0]),
        life,
        maxLife: life,
        size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        spin: (Math.random() - 0.5) * 0.06,
      });
    };

    const drawParticle = (p) => {
      const progress = p.life / p.maxLife; // 1 → 0
      // Fade in fast, then fade out
      const fadeIn = Math.min(1, (1 - progress) * 5);
      const alpha = Math.min(fadeIn, progress * 3, 1);
      const curSize = p.size * (0.3 + progress * 0.7);

      // Soft glow
      const r = curSize * 3.5;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0,   p.color + alpha + ')');
      grad.addColorStop(0.4, p.color + alpha * 0.55 + ')');
      grad.addColorStop(1,   p.color + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      ctx.fillStyle = p.color + Math.min(1, alpha * 1.4) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, curSize * 0.4), 0, Math.PI * 2);
      ctx.fill();
    };

    // ── Special FX per character ──────────────────────────

    const drawEnergyRing = () => {
      // Maytradalis: expanding energy pulse rings
      if (frame % 55 < 1) {
        // start a new ring stored in external state — simpler: draw at fixed intervals
      }
      // Constant subtle ring
      const progress = (frame % 90) / 90;
      const radius = progress * W * 0.42;
      const alpha = 0.25 * (1 - progress);
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.52, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Second ring offset
      const p2 = ((frame + 45) % 90) / 90;
      const r2 = p2 * W * 0.42;
      const a2 = 0.18 * (1 - p2);
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.52, r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(196,132,252,${a2})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawWispTrails = () => {
      // Master Death: ghostly wisp streaks on sides
      if (frame % 3 === 0) {
        const isLeft = frame % 6 < 3;
        const startX = isLeft ? W * 0.12 : W * 0.88;
        const startY = H * 0.2 + Math.random() * H * 0.55;
        const len = 18 + Math.random() * 35;
        const angle = isLeft ? (Math.random() * 0.5 + 0.1) : (Math.PI - Math.random() * 0.5 - 0.1);
        ctx.strokeStyle = `rgba(0,255,204,${0.08 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.7 + Math.random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * len, startY - Math.sin(angle) * len * 0.5);
        ctx.stroke();
      }
    };

    const drawBuzzTrails = () => {
      // Flybutt: erratic wing sparkle lines
      if (frame % 2 === 0) {
        const cx = W * 0.35 + Math.random() * W * 0.3;
        const cy = H * 0.32 + Math.random() * H * 0.35;
        const len = 5 + Math.random() * 20;
        const ang = Math.random() * Math.PI * 2;
        ctx.strokeStyle = `rgba(255,200,20,${0.2 + Math.random() * 0.3})`;
        ctx.lineWidth = 0.8 + Math.random();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }
    };

    const drawGlitchLines = () => {
      // Lurker: scanline glitch distortion
      if (frame % 38 < 4) {
        const numLines = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numLines; i++) {
          const y = Math.random() * H;
          const h = 1.5 + Math.random() * 5;
          const offset = (Math.random() - 0.5) * 30;
          // Glitch shift
          ctx.fillStyle = `rgba(255,51,102,${0.12 + Math.random() * 0.2})`;
          ctx.fillRect(offset, y, W, h);
        }
        // RGB split artifact
        ctx.fillStyle = `rgba(255,0,0,0.06)`;
        ctx.fillRect(Math.random() * 40 - 20, H * 0.1, W, H * 0.8);
        ctx.fillStyle = `rgba(0,255,255,0.04)`;
        ctx.fillRect(-(Math.random() * 40 - 20), H * 0.1, W, H * 0.8);
      }
    };

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Background atmospheric glow
      if (cfg.glow) {
        const bg = ctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.48);
        bg.addColorStop(0, cfg.glow);
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }

      // Spawn
      if (Math.random() < cfg.spawnRate) spawn();
      if (char === 'flybutt' && Math.random() < 0.35) spawn(); // extra buzz density

      // Special FX (drawn under particles)
      switch (cfg.extraFx) {
        case 'energyRing':  drawEnergyRing();  break;
        case 'wispTrails':  drawWispTrails();  break;
        case 'buzzTrails':  drawBuzzTrails();  break;
        case 'glitchLines': drawGlitchLines(); break;
        default: break;
      }

      // Particles
      ctx.save();
      particles = particles.filter(p => p.life > 0.01);
      for (const p of particles) {
        p.x  += p.vx + p.spin;
        p.y  += p.vy;
        p.vy -= 0.012; // gentle upward acceleration
        p.vx += (Math.random() - 0.5) * 0.04;
        p.life -= 0.017;
        drawParticle(p);
      }
      ctx.restore();

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [char]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────
// Character Portrait — image + particle overlay + aura
// ──────────────────────────────────────────────────────────
function CharacterPortrait({ src, char }) {
  const tuning = {
    maytradalis: {
      height: '78vh', width: '36vw',
      filter: 'brightness(1.06) saturate(1.18) drop-shadow(0 0 36px rgba(168,85,247,0.65))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.52) 0%, transparent 65%)',
      anim: 'charFloat',
      imgAnim: 'maytShimmer',
    },
    death: {
      height: '78vh', width: '40vw',
      filter: 'brightness(1.0) saturate(1.12) drop-shadow(0 0 30px rgba(0,255,204,0.58))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(0,200,180,0.46) 0%, transparent 65%)',
      anim: 'charFloat',
      imgAnim: 'deathPulse',
    },
    flybutt: {
      height: '60vh', width: '36vw',
      filter: 'brightness(1.1) saturate(1.45) drop-shadow(0 0 30px rgba(212,168,0,0.65))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,0,0.52) 0%, transparent 65%)',
      anim: 'flybuttHover',
      imgAnim: 'flybuttGlow',
    },
    lurker: {
      height: '74vh', width: '40vw',
      filter: 'brightness(1.0) saturate(1.28) contrast(1.06) drop-shadow(0 0 34px rgba(255,51,102,0.68))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(180,30,30,0.52) 0%, transparent 65%)',
      anim: 'lurkerWrithe',
      imgAnim: 'lurkerGlitch',
    },
  };

  const t = tuning[char] || tuning.maytradalis;

  return (
    <div style={{
      position: 'relative',
      width: t.width,
      height: t.height,
      maxWidth: 760,
      animation: `${t.anim} 4.5s ease-in-out infinite`,
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Aura layer */}
      <div style={{
        position: 'absolute', inset: '-20%',
        background: t.aura,
        animation: 'auraPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Character image */}
      <img
        src={src}
        alt={char}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center bottom',
          filter: t.filter,
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
          animation: `${t.imgAnim} 5s ease-in-out infinite`,
        }}
      />

      {/* Particle canvas overlay */}
      <CharacterParticles char={char} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────
export default function IntroCinematic({ onComplete }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const scene   = SCENES[sceneIdx];
  const isScene = scene.id.startsWith('scene_');
  const isLurker = scene.id === 'lurker';
  const isCta    = scene.id === 'cta';

  const advance = useCallback(() => {
    if (sceneIdx >= SCENES.length - 1) {
      setFadeOut(true);
      setTimeout(onComplete, 700);
      return;
    }
    setSceneIdx(i => i + 1);
  }, [sceneIdx, onComplete]);

  useEffect(() => {
    if (isCta) return;
    const t = setTimeout(advance, scene.duration);
    return () => clearTimeout(t);
  }, [sceneIdx, scene, advance, isCta]);

  const charSrc = {
    maytradalis: MAYTRADALIS_IMG,
    death:       MASTER_DEATH_IMG,
    flybutt:     FLYBUTT_IMG,
    lurker:      LURKER_IMG,
  }[scene.char];

  const bgColor = {
    lurker:      'radial-gradient(circle at 50% 60%, #1a0000 0%, #000 70%)',
    maytradalis: 'radial-gradient(circle at 50% 60%, #0a0020 0%, #000 70%)',
    death:       'radial-gradient(circle at 50% 60%, #020808 0%, #000 70%)',
    flybutt:     'radial-gradient(circle at 50% 60%, #060a00 0%, #000 70%)',
  }[scene.char] || '#000';

  return (
    <div
      data-testid="intro-cinematic"
      onClick={isCta ? undefined : advance}
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: isCta ? 'default' : 'pointer',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.7s ease',
        overflow: 'hidden',
        zIndex: 200,
      }}
    >
      {/* Ambient star field */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(80)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 137.5) % 100}%`,
            top:  `${(i * 97.3)  % 100}%`,
            width:  `${(i % 3) * 0.6 + 0.5}px`,
            height: `${(i % 3) * 0.6 + 0.5}px`,
            borderRadius: '50%', background: '#fff',
            opacity: (i % 7) * 0.07 + 0.05,
            animation: `tw ${2 + (i % 5) * 0.7}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 0.13) % 3}s`,
          }} />
        ))}
      </div>

      {/* Dialogue scenes */}
      {(isScene || isLurker) && (
        <div
          key={scene.id}
          style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.55s ease',
          }}
        >
          {/* Portrait area */}
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            paddingBottom: 32,
          }}>
            {/* Scene background */}
            <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

            {/* Atmospheric ground mist */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '28%',
              background: `linear-gradient(to top, ${
                scene.char === 'lurker'    ? 'rgba(100,0,0,0.35)' :
                scene.char === 'maytradalis' ? 'rgba(80,0,120,0.28)' :
                scene.char === 'death'    ? 'rgba(0,80,60,0.22)' :
                                             'rgba(60,80,0,0.18)'
              }, transparent)`,
              pointerEvents: 'none',
              zIndex: 0,
            }} />

            {/* Vertical light beam behind character */}
            <div style={{
              position: 'absolute',
              top: '5%', bottom: '10%',
              left: '50%', transform: 'translateX(-50%)',
              width: '22%',
              background: `linear-gradient(to bottom, transparent 0%, ${
                scene.char === 'lurker'    ? 'rgba(255,51,102,0.07)' :
                scene.char === 'maytradalis' ? 'rgba(168,85,247,0.08)' :
                scene.char === 'death'    ? 'rgba(0,255,204,0.06)' :
                                             'rgba(212,168,0,0.06)'
              } 40%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'lightBeamPulse 4s ease-in-out infinite',
            }} />

            <CharacterPortrait src={charSrc} char={scene.char} />
          </div>

          {/* Dialogue box */}
          <div style={{
            background: 'rgba(8,4,16,0.97)',
            borderTop: '1px solid rgba(168,85,247,0.28)',
            padding: '28px 48px 32px',
            minHeight: 120,
            position: 'relative',
          }}>
            {/* Speaker badge */}
            <div style={{
              position: 'absolute', top: -14, left: 40,
              background: '#0a0015',
              border: '1px solid #7c3aed55',
              padding: '4px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.3em',
              color: scene.char === 'lurker'    ? '#ff3366'
                   : scene.char === 'flybutt'   ? '#d4a800'
                   : scene.char === 'maytradalis' ? '#a855f7' : '#00ffcc',
              textTransform: 'uppercase',
              textShadow: '0 0 10px currentColor',
            }}>
              {scene.char === 'death' ? 'Master Death'
                : scene.char === 'maytradalis' ? 'Maytradalis'
                : scene.char === 'flybutt'     ? 'Flybutt'
                : 'The Lurker'}
            </div>

            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
              fontStyle: 'italic',
              color: '#e8e0f0',
              margin: 0, lineHeight: 1.7,
              maxWidth: 900,
            }}>
              <TypewriterText text={scene.text} speed={30} />
            </p>

            <p style={{
              position: 'absolute', right: 40, bottom: 12,
              color: '#ffffff33', fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.2em',
            }}>
              CLICK TO CONTINUE
            </p>
          </div>
        </div>
      )}

      {/* CTA screen */}
      {isCta && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
          <p style={{
            color: '#a855f7', fontSize: 12,
            letterSpacing: '0.5em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 36,
            textShadow: '0 0 14px #a855f7',
          }}>
            The Endless awaits…
          </p>
          <button
            data-testid="begin-adventure-button"
            onClick={() => { setFadeOut(true); setTimeout(onComplete, 700); }}
            style={{
              background: 'transparent', color: '#00ffcc',
              border: '2px solid #00ffcc', padding: '16px 60px',
              fontSize: 16, fontWeight: 700, letterSpacing: '0.4em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 0 25px rgba(0,255,204,0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.target.style.background = '#00ffcc'; e.target.style.color = '#000'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#00ffcc'; }}
          >
            Continue
          </button>
          <p style={{ color: '#ffffff33', fontSize: 11, marginTop: 24, letterSpacing: '0.2em' }}>
            or press any key
          </p>
        </div>
      )}

      {/* Skip button */}
      {!isCta && (
        <button
          data-testid="skip-intro-button"
          onClick={(e) => { e.stopPropagation(); setFadeOut(true); setTimeout(onComplete, 500); }}
          style={{
            position: 'absolute', bottom: 140, right: 24,
            background: 'transparent', color: '#ffffff33',
            border: '1px solid #ffffff22', padding: '6px 16px',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s', zIndex: 10,
          }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#fff'; }}
          onMouseLeave={e => { e.target.style.color = '#ffffff33'; e.target.style.borderColor = '#ffffff22'; }}
        >
          SKIP
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tw {
          from { opacity: 0.08; }
          to   { opacity: 0.72; }
        }

        /* Container float animations */
        @keyframes charFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(-0.5deg); }
        }
        @keyframes flybuttHover {
          0%   { transform: translate(0, 0) rotate(-2deg); }
          25%  { transform: translate(9px, -9px) rotate(2deg); }
          50%  { transform: translate(-7px, -17px) rotate(-1deg); }
          75%  { transform: translate(-9px, -6px) rotate(3deg); }
          100% { transform: translate(0, 0) rotate(-2deg); }
        }
        @keyframes lurkerWrithe {
          0%, 100% { transform: translateY(0) scale(1) skewX(0deg); }
          25%      { transform: translateY(-9px) scale(1.016) skewX(0.7deg); }
          50%      { transform: translateY(-4px) scale(1.032) skewX(-0.9deg); }
          75%      { transform: translateY(-11px) scale(1.012) skewX(0.45deg); }
        }
        @keyframes auraPulse {
          0%, 100% { opacity: 0.68; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.09); }
        }

        /* Per-image animations */
        @keyframes maytShimmer {
          0%, 100% { filter: brightness(1.06) saturate(1.18) drop-shadow(0 0 36px rgba(168,85,247,0.65)); }
          35%      { filter: brightness(1.14) saturate(1.28) drop-shadow(0 0 52px rgba(196,132,252,0.85)); }
          70%      { filter: brightness(1.04) saturate(1.12) drop-shadow(0 0 28px rgba(139,92,246,0.55)); }
        }
        @keyframes deathPulse {
          0%, 100% { filter: brightness(1.0) saturate(1.12) drop-shadow(0 0 30px rgba(0,255,204,0.58)) opacity(1); }
          50%      { filter: brightness(0.94) saturate(1.05) drop-shadow(0 0 18px rgba(0,200,160,0.35)) opacity(0.9); }
        }
        @keyframes flybuttGlow {
          0%, 100% { filter: brightness(1.1) saturate(1.45) drop-shadow(0 0 30px rgba(212,168,0,0.65)); }
          33%      { filter: brightness(1.2) saturate(1.6) drop-shadow(0 0 48px rgba(255,215,0,0.9)); }
          66%      { filter: brightness(1.08) saturate(1.38) drop-shadow(0 0 24px rgba(200,155,0,0.55)); }
        }
        @keyframes lurkerGlitch {
          0%, 88%, 100% {
            filter: brightness(1.0) saturate(1.28) contrast(1.06) drop-shadow(0 0 34px rgba(255,51,102,0.68));
            transform: translateX(0) scaleX(1);
          }
          89% {
            filter: brightness(1.35) saturate(2.0) contrast(1.4) drop-shadow(0 0 50px rgba(255,51,102,1));
            transform: translateX(-5px) scaleX(1.02);
          }
          90% {
            filter: brightness(0.7) saturate(0.6) hue-rotate(25deg) drop-shadow(0 0 12px rgba(0,200,200,0.5));
            transform: translateX(5px) scaleX(0.98);
          }
          91% {
            filter: brightness(1.5) saturate(2.5) contrast(1.5) drop-shadow(0 0 60px rgba(255,0,50,1));
            transform: translateX(-3px) scaleX(1.01);
          }
          93% {
            filter: brightness(0.9) saturate(1.1) contrast(1.0) drop-shadow(0 0 20px rgba(255,51,102,0.5));
            transform: translateX(2px);
          }
          95% {
            filter: brightness(1.0) saturate(1.28) contrast(1.06) drop-shadow(0 0 34px rgba(255,51,102,0.68));
            transform: translateX(0);
          }
        }

        /* Atmospheric light beam */
        @keyframes lightBeamPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%      { opacity: 1.0; transform: translateX(-50%) scaleX(1.18); }
        }
      `}</style>
    </div>
  );
}
