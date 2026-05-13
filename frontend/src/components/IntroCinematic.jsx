import React, { useEffect, useState } from 'react';

const MAYTRADALIS_ART = 'https://customer-assets.emergentagent.com/job_gothic-action-beats/artifacts/eqvwwi5o_611d4b76933a75a5a6923ea9856fcd49.webp';

/**
 * Pre-menu cinematic.
 * Maytradalis silhouette walks from left into a glowing rift on the right,
 * then a bright white wipe transitions to the main menu.
 *
 * Duration: ~6s. Skippable via SKIP button or any click.
 */
export default function IntroCinematic({ onComplete }) {
  const [phase, setPhase] = useState('walk');   // 'walk' | 'flash' | 'done'
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    // Walk for 4.2s, then flash for 1.4s, then done
    const t1 = setTimeout(() => setPhase('flash'), 4200);
    const t2 = setTimeout(() => { setPhase('done'); onComplete(); }, 5800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    setPhase('flash');
    setTimeout(() => onComplete(), 700);
  };

  return (
    <div
      data-testid="intro-cinematic"
      onClick={handleSkip}
      style={{
        position: 'fixed', inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: 200,
        userSelect: 'none',
      }}
    >
      {/* Far-back starfield */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[...Array(60)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 137.5) % 100}%`, top: `${(i * 97.3) % 100}%`,
            width: `${(i % 3) * 0.55 + 0.45}px`, height: `${(i % 3) * 0.55 + 0.45}px`,
            borderRadius: '50%', background: '#fff',
            opacity: (i % 7) * 0.07 + 0.08,
            animation: `twinkle ${2 + (i % 5) * 0.6}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 0.13) % 3}s`,
          }} />
        ))}
      </div>

      {/* Ground horizon */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '32%',
        background: 'linear-gradient(to top, rgba(80,30,140,0.45) 0%, rgba(40,10,80,0.2) 60%, transparent 100%)',
      }} />

      {/* Ground line */}
      <div style={{
        position: 'absolute', bottom: '28%', left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.6) 50%, transparent)',
        boxShadow: '0 0 14px rgba(168,85,247,0.7)',
      }} />

      {/* The light rift on the right */}
      <div style={{
        position: 'absolute',
        right: '12%', bottom: '24%',
        width: 'min(46vh, 380px)',
        height: 'min(78vh, 660px)',
        transform: 'translateY(8%)',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(192,132,252,0.55) 22%, rgba(124,58,237,0.32) 45%, transparent 80%)',
        filter: 'blur(2px)',
        animation: 'riftPulse 2.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Rift inner glow */}
      <div style={{
        position: 'absolute',
        right: '17%', bottom: '24%',
        width: 'min(22vh, 180px)',
        height: 'min(60vh, 480px)',
        transform: 'translateY(6%)',
        background: 'radial-gradient(ellipse at center, #ffffff 0%, #f0e6ff 30%, transparent 80%)',
        filter: 'blur(1px)',
        animation: 'riftCore 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Rift particles drifting in */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            right: `${15 + (i % 5) * 4}%`,
            bottom: `${28 + ((i * 17) % 50)}%`,
            width: 3, height: 3,
            borderRadius: '50%',
            background: i % 2 ? '#c084fc' : '#fff',
            boxShadow: '0 0 8px #c084fc',
            animation: `floatParticle ${3 + (i % 4) * 0.5}s ease-in-out infinite`,
            animationDelay: `${(i * 0.21) % 3}s`,
          }} />
        ))}
      </div>

      {/* Maytradalis walking */}
      <div
        data-testid="intro-maytradalis"
        style={{
          position: 'absolute',
          bottom: '26%',
          left: 0,
          width: 'min(36vh, 320px)',
          height: 'min(72vh, 620px)',
          animation: skipped ? 'none' : 'maytradalisWalk 4.5s ease-in forwards',
          willChange: 'transform, filter',
        }}
      >
        <img
          src={MAYTRADALIS_ART}
          alt="Maytradalis"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: 'brightness(0.85) drop-shadow(0 0 26px rgba(168,85,247,0.7))',
            animation: skipped ? 'none' : 'maytraBob 0.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* White flash overlay */}
      {(phase === 'flash' || skipped) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 75% 50%, #fff 0%, #fff 25%, transparent 75%)',
          animation: 'flashWipe 1.4s ease-in forwards',
          zIndex: 5,
        }} />
      )}

      {/* Lower caption */}
      <div style={{
        position: 'absolute',
        bottom: '8%', left: '50%', transform: 'translateX(-50%)',
        color: '#a855f7',
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: 'clamp(0.95rem, 2.3vw, 1.4rem)',
        textShadow: '0 0 12px rgba(168,85,247,0.8)',
        textAlign: 'center',
        letterSpacing: '0.05em',
        opacity: skipped ? 0 : 1,
        animation: skipped ? 'none' : 'captionFade 5.2s ease-out forwards',
        pointerEvents: 'none',
      }}>
        She steps into the Endless…
      </div>

      {/* Skip button */}
      <button
        data-testid="skip-intro-button"
        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
        style={{
          position: 'absolute',
          bottom: 20, right: 20,
          background: 'transparent',
          color: '#ffffff66',
          border: '1px solid #ffffff33',
          padding: '6px 16px',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          zIndex: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#ffffff66'; e.currentTarget.style.borderColor = '#ffffff33'; }}
      >
        SKIP ▸
      </button>

      <style>{`
        @keyframes maytradalisWalk {
          0%   { transform: translateX(-10vw); filter: brightness(0.7); }
          60%  { transform: translateX(40vw); filter: brightness(1.0); }
          90%  { transform: translateX(58vw); filter: brightness(1.5); }
          100% { transform: translateX(64vw); filter: brightness(3); opacity: 0; }
        }
        @keyframes maytraBob {
          0%, 100% { transform: translateY(0) rotate(-0.3deg); }
          50%      { transform: translateY(-6px) rotate(0.3deg); }
        }
        @keyframes riftPulse {
          0%, 100% { transform: translateY(8%) scale(1);   opacity: 0.85; }
          50%      { transform: translateY(8%) scale(1.06); opacity: 1; }
        }
        @keyframes riftCore {
          0%, 100% { transform: translateY(6%) scale(1);   opacity: 0.9; }
          50%      { transform: translateY(6%) scale(1.12); opacity: 1; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%      { transform: translateY(-20px); opacity: 1; }
        }
        @keyframes captionFade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flashWipe {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes twinkle {
          from { opacity: 0.06; } to { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
