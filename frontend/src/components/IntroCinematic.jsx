import React, { useState, useEffect, useCallback } from 'react';

// Clean cinematic single-character portraits.
// Maytradalis = clean reference asset. Others = AI-generated from reference sheets.
const MAYTRADALIS_IMG = 'https://customer-assets.emergentagent.com/job_c1138fce-9759-4254-b7df-5009813f2eea/artifacts/rqp9hfld_694daec83256ed840148d9505e779707.webp';
const LURKER_IMG = '/intro/lurker.png';
const MASTER_DEATH_IMG = '/intro/master_death.png';
const FLYBUTT_IMG = '/intro/flybutt.png';

const SCENES = [
  { id: 'scene_death', duration: 4200,
    char: 'death',
    text: '"Maytradalis... the Grim Reaper Ava has been taken into the Endless."' },
  { id: 'scene_death2', duration: 3800,
    char: 'death',
    text: '"The Lurker — that plagued shadow — holds her captive beyond the veil."' },
  { id: 'scene_mayt', duration: 4000,
    char: 'maytradalis',
    text: '"Then I\'ll find her and bring her back. Whatever lives in the dark between... I\'ll cut through it all."' },
  { id: 'scene_flybutt', duration: 3300,
    char: 'flybutt',
    text: '"Bzzt! Flybutt knows the Endless! I\'ll guide you through the void, boss!"' },
  { id: 'lurker', duration: 3500,
    char: 'lurker',
    text: '"...The Lurker stirs in the deep dark between worlds..."' },
  { id: 'cta', duration: 99999 }
];

function TypewriterText({ text, speed = 28 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayed}</span>;
}

// Single-character cinematic portrait — clean AI-generated/asset images with
// floating animation, soft aura glow, and parallax bobbing.
function CharacterPortrait({ src, char }) {
  const tuning = {
    maytradalis: {
      height: '78vh', width: '36vw',
      filter: 'brightness(1.05) saturate(1.15) drop-shadow(0 0 32px rgba(168,85,247,0.6))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.5) 0%, transparent 65%)'
    },
    death: {
      height: '78vh', width: '40vw',
      filter: 'brightness(1.0) saturate(1.1) drop-shadow(0 0 28px rgba(0,255,204,0.55))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(0,200,180,0.45) 0%, transparent 65%)'
    },
    flybutt: {
      height: '60vh', width: '36vw',
      filter: 'brightness(1.08) saturate(1.4) drop-shadow(0 0 28px rgba(212,168,0,0.6))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,0,0.5) 0%, transparent 65%)'
    },
    lurker: {
      height: '74vh', width: '40vw',
      filter: 'brightness(1.0) saturate(1.25) contrast(1.05) drop-shadow(0 0 32px rgba(255,51,102,0.65))',
      aura: 'radial-gradient(ellipse at 50% 50%, rgba(180,30,30,0.5) 0%, transparent 65%)'
    }
  };
  const t = tuning[char] || tuning.maytradalis;
  // Combat-ready characters get a subtle scythe-swing / breathing sway
  const swayKey = char === 'lurker' ? 'lurkerWrithe' : char === 'flybutt' ? 'flybuttHover' : 'charFloat';

  return (
    <div style={{
      position: 'relative',
      width: t.width,
      height: t.height,
      maxWidth: 760,
      animation: `${swayKey} 4.5s ease-in-out infinite`,
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Soft aura behind */}
      <div style={{
        position: 'absolute', inset: '-20%',
        background: t.aura,
        animation: 'auraPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

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
          userSelect: 'none'
        }}
      />
    </div>
  );
}

export default function IntroCinematic({ onComplete }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const scene = SCENES[sceneIdx];

  const advance = useCallback(() => {
    if (sceneIdx >= SCENES.length - 1) {
      setFadeOut(true);
      setTimeout(onComplete, 700);
      return;
    }
    setSceneIdx(i => i + 1);
  }, [sceneIdx, onComplete]);

  useEffect(() => {
    if (scene.id === 'cta') return;
    const t = setTimeout(advance, scene.duration);
    return () => clearTimeout(t);
  }, [sceneIdx, scene, advance]);

  const isScene = scene.id.startsWith('scene_');
  const isLurker = scene.id === 'lurker';
  const isCta = scene.id === 'cta';

  const charSrc = {
    maytradalis: MAYTRADALIS_IMG,
    death: MASTER_DEATH_IMG,
    flybutt: FLYBUTT_IMG,
    lurker: LURKER_IMG
  }[scene.char];

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
        zIndex: 200
      }}
    >
      {/* Ambient background stars */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(80)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 0.5}px`, height: `${Math.random() * 2 + 0.5}px`,
            borderRadius: '50%', background: '#fff',
            opacity: Math.random() * 0.5 + 0.1,
            animation: `tw ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
            animationDelay: `${Math.random() * 3}s`
          }} />
        ))}
      </div>

      {/* DIALOGUE SCENES */}
      {(isScene || isLurker) && (
        <div
          key={scene.id}
          style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.6s ease'
          }}
        >
          {/* Character portrait area */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            paddingBottom: 32
          }}>
            {/* Background color wash */}
            <div style={{
              position: 'absolute', inset: 0,
              background: scene.char === 'lurker'
                ? 'radial-gradient(circle at 50% 60%, #1a0000 0%, #000 70%)'
                : scene.char === 'maytradalis'
                  ? 'radial-gradient(circle at 50% 60%, #0a0020 0%, #000 70%)'
                  : scene.char === 'death'
                    ? 'radial-gradient(circle at 50% 60%, #020808 0%, #000 70%)'
                    : 'radial-gradient(circle at 50% 60%, #060a00 0%, #000 70%)'
            }} />

            <CharacterPortrait src={charSrc} char={scene.char} />
          </div>

          {/* Dialogue box */}
          <div style={{
            background: 'rgba(8,4,16,0.96)',
            borderTop: '1px solid rgba(168,85,247,0.3)',
            padding: '28px 48px 32px',
            minHeight: 120,
            position: 'relative'
          }}>
            {/* Speaker indicator */}
            <div style={{
              position: 'absolute', top: -14, left: 40,
              background: '#0a0015',
              border: '1px solid #7c3aed55',
              padding: '4px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.3em',
              color: scene.char === 'lurker' ? '#ff3366'
                : scene.char === 'flybutt' ? '#d4a800'
                : scene.char === 'maytradalis' ? '#a855f7' : '#00ffcc',
              textTransform: 'uppercase',
              textShadow: `0 0 10px currentColor`
            }}>
              {scene.char === 'death' ? 'Master Death'
                : scene.char === 'maytradalis' ? 'Maytradalis'
                : scene.char === 'flybutt' ? 'Flybutt'
                : 'The Lurker'}
            </div>

            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
              fontStyle: 'italic',
              color: '#e8e0f0',
              margin: 0, lineHeight: 1.7,
              maxWidth: 900
            }}>
              <TypewriterText text={scene.text} speed={30} />
            </p>

            <p style={{
              position: 'absolute', right: 40, bottom: 12,
              color: '#ffffff33', fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.2em'
            }}>
              CLICK TO CONTINUE
            </p>
          </div>
        </div>
      )}

      {/* CTA — clean button without title duplicate (main menu owns the title reveal) */}
      {isCta && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
          <p style={{
            color: '#a855f7', fontSize: 12,
            letterSpacing: '0.5em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 36,
            textShadow: '0 0 14px #a855f7'
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
              transition: 'all 0.3s ease'
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
            transition: 'all 0.2s', zIndex: 10
          }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#fff'; }}
          onMouseLeave={e => { e.target.style.color = '#ffffff33'; e.target.style.borderColor = '#ffffff22'; }}
        >
          SKIP
        </button>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tw { from { opacity: 0.1; } to { opacity: 0.7; } }
        @keyframes charFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-0.6deg); }
        }
        @keyframes flybuttHover {
          0%, 100% { transform: translate(0, 0) rotate(-2deg); }
          25%      { transform: translate(8px, -8px) rotate(2deg); }
          50%      { transform: translate(-6px, -16px) rotate(-1deg); }
          75%      { transform: translate(-8px, -6px) rotate(3deg); }
        }
        @keyframes lurkerWrithe {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
          25%      { transform: translateY(-8px) scale(1.015) skewX(0.6deg); }
          50%      { transform: translateY(-4px) scale(1.03) skewX(-0.8deg); }
          75%      { transform: translateY(-10px) scale(1.01) skewX(0.4deg); }
        }
        @keyframes auraPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
