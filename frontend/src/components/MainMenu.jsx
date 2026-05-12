import React, { useState, useEffect, useRef } from 'react';

const MAYTRADALIS_IMG = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/wquopldx_611d4b76933a75a5a6923ea9856fcd49.webp';

function TitleChar({ ch, visible, index, color }) {
  return (
    <span style={{
      display: 'inline-block',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-24px)',
      transition: `opacity 0.35s ease ${index * 0.06}s, transform 0.35s ease ${index * 0.06}s`,
      color,
      textShadow: visible ? `0 0 25px ${color}, 0 0 50px ${color}55` : 'none',
      marginRight: ch === ' ' ? '0.25em' : '0'
    }}>
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  );
}

export default function MainMenu({ onPlay }) {
  const [phase, setPhase] = useState(0); // 0=hidden, 1=title1, 2=title2, 3=content
  const [loreIdx, setLoreIdx] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const lorePhrases = [
    '"Between the folds of reality lies the Endless..."',
    '"Reaper Ava has been taken by the Lurker\'s plague..."',
    '"Master Death\'s apprentice must descend into the void..."',
    '"Armed with her scythe, Maytradalis enters the darkness..."',
    '"Flybutt guides the way through the Endless depths..."'
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setLoreIdx(i => (i + 1) % lorePhrases.length), 4000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.3, spd: Math.random() * 0.2 + 0.05,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#04020e');
      g.addColorStop(0.5, '#0d0520');
      g.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebulae
      for (let i = 0; i < 4; i++) {
        const nx = 200 + i * 250, ny = 150 + i * 100;
        const r = ctx.createRadialGradient(nx, ny, 0, nx, ny, 180);
        const colors = ['#7c3aed', '#00ffcc', '#a855f7', '#1d4ed8'];
        r.addColorStop(0, colors[i] + '22');
        r.addColorStop(1, 'transparent');
        ctx.fillStyle = r;
        ctx.beginPath();
        ctx.ellipse(nx + Math.sin(frame * 0.006 + i) * 10, ny, 180, 100, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (const s of stars) {
        s.x -= s.spd;
        if (s.x < 0) s.x = canvas.width;
        const tw = s.alpha * (0.5 + 0.5 * Math.sin(frame * 0.02 + s.y));
        ctx.save();
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ground glow
      const mg = ctx.createLinearGradient(0, canvas.height - 120, 0, canvas.height);
      mg.addColorStop(0, 'transparent');
      mg.addColorStop(1, 'rgba(100,40,200,0.15)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const title1 = 'DIMENSIONLOCK';
  const title2 = 'DEATHLY STORIES';

  return (
    <div
      data-testid="main-menu"
      style={{
        minHeight: '100vh', width: '100%',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        width={1280} height={720}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0
        }}
      />

      {/* Maytradalis silhouette right side */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0, height: '100vh',
        display: 'flex', alignItems: 'flex-end',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateX(0)' : 'translateX(60px)',
        transition: 'all 0.9s ease 0.4s',
        zIndex: 1, pointerEvents: 'none'
      }}>
        <img
          src={MAYTRADALIS_IMG}
          alt="Maytradalis"
          style={{
            height: '88vh', objectFit: 'contain',
            mixBlendMode: 'screen',
            filter: 'brightness(0.85) saturate(1.1)',
            marginRight: '-2%'
          }}
        />
      </div>

      {/* Left gradient vignette */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '55%',
        background: 'linear-gradient(to right, rgba(4,2,14,0.95) 0%, rgba(4,2,14,0.6) 60%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 3,
        maxWidth: 700, padding: '0 48px',
        alignSelf: 'center', marginRight: 'auto', marginLeft: '4%'
      }}>
        {/* Series label */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 0.6s ease',
          marginBottom: 16
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.55em', textTransform: 'uppercase',
            color: '#7c3aed', textShadow: '0 0 12px #7c3aed'
          }}>
            A DIMENSIONLOCK STORY
          </span>
        </div>

        {/* Main title reveal */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(3rem, 7vw, 5.5rem)',
          fontWeight: 700, margin: '0 0 4px',
          letterSpacing: '0.04em', lineHeight: 1
        }}>
          {title1.split('').map((ch, i) => (
            <TitleChar key={i} ch={ch} visible={phase >= 1} index={i} color="#ffffff" />
          ))}
        </h1>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)',
          fontWeight: 400, fontStyle: 'italic',
          margin: '0 0 48px', letterSpacing: '0.12em'
        }}>
          {title2.split('').map((ch, i) => (
            <TitleChar key={i} ch={ch} visible={phase >= 2} index={i} color="#a855f7" />
          ))}
        </h2>

        {/* Content area */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'none' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.3s'
        }}>
          {/* Divider */}
          <div style={{
            width: 50, height: 2,
            background: 'linear-gradient(to right, #a855f7, #00ffcc)',
            marginBottom: 24,
            boxShadow: '0 0 10px #a855f7'
          }} />

          {/* Lore text */}
          <p style={{
            color: '#ffffff88', fontSize: 14, lineHeight: 1.8,
            fontStyle: 'italic', marginBottom: 40,
            fontFamily: "'Cormorant Garamond', serif",
            transition: 'opacity 0.5s ease',
            minHeight: 50
          }}>
            {lorePhrases[loreIdx]}
          </p>

          {/* Play button */}
          <button
            data-testid="play-button"
            onClick={onPlay}
            style={{
              background: 'transparent', color: '#00ffcc',
              border: '2px solid #00ffcc',
              padding: '16px 56px', fontSize: 15,
              fontWeight: 700, letterSpacing: '0.35em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 0 20px rgba(0,255,204,0.2)',
              transition: 'all 0.3s ease', marginBottom: 20,
              display: 'block', width: 'fit-content'
            }}
            onMouseEnter={e => {
              e.target.style.background = '#00ffcc';
              e.target.style.color = '#04020e';
              e.target.style.boxShadow = '0 0 40px rgba(0,255,204,0.6)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#00ffcc';
              e.target.style.boxShadow = '0 0 20px rgba(0,255,204,0.2)';
            }}
          >
            ENTER THE ENDLESS
          </button>

          {/* Controls quick ref */}
          <div style={{
            background: 'rgba(10,2,20,0.7)',
            border: '1px solid #7c3aed33',
            padding: '14px 22px',
            maxWidth: 440
          }}>
            <p style={{
              color: '#7c3aed', fontSize: 10, letterSpacing: '0.35em',
              marginBottom: 10, fontFamily: "'JetBrains Mono', monospace"
            }}>
              CONTROLS
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px' }}>
              {[
                ['Move', 'Arrow / WASD'],
                ['Jump (2x)', 'Space / W'],
                ['Dash (i-frames)', 'Shift'],
                ['Light Attack', 'J / Z'],
                ['Heavy Attack', 'K / X'],
                ['Dark Aura (30SP)', 'L / C'],
                ['Soul Harvest (ULT)', 'U / R']
              ].map(([a, k]) => (
                <div key={a} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#ffffff55', fontSize: 11 }}>{a}</span>
                  <span style={{ color: '#00ffcc', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
