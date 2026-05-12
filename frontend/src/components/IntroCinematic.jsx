import React, { useState, useEffect, useCallback } from 'react';

const MAYTRADALIS_IMG = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/wquopldx_611d4b76933a75a5a6923ea9856fcd49.webp';
const LURKER_IMG = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/t6cwtfcm_result-1768706346582-4.png';
const MASTER_DEATH_IMG = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/5iwshpfm_Illustration53-11.jpg';
const FLYBUTT_IMG = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/7a3boklz_Illustration12_10-1.png';

const SCENES = [
  { id: 'blackout', duration: 800 },
  { id: 'title1', duration: 1800 },
  { id: 'title2', duration: 1600 },
  { id: 'scene_death', duration: 4000,
    char: 'death',
    text: '"Maytradalis... the Grim Reaper Ava has been taken into the Endless."' },
  { id: 'scene_death2', duration: 3500,
    char: 'death',
    text: '"The Lurker — that plagued shadow — holds her captive beyond the veil."' },
  { id: 'scene_mayt', duration: 3500,
    char: 'maytradalis',
    text: '"Then I\'ll find her and bring her back. Whatever lives in the dark between... I\'ll cut through it all."' },
  { id: 'scene_flybutt', duration: 3000,
    char: 'flybutt',
    text: '"Bzzt! Flybutt knows the Endless! I\'ll guide you through the void, boss!"' },
  { id: 'lurker', duration: 3200,
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

function TitleReveal({ text, color = '#a855f7', delay = 0 }) {
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setVisibleCount(i);
        if (i >= text.length) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  return (
    <span>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          opacity: i < visibleCount ? 1 : 0,
          transform: i < visibleCount ? 'none' : 'translateY(-10px)',
          display: 'inline-block',
          transition: 'all 0.3s ease',
          color: ch === ' ' ? 'transparent' : color,
          textShadow: i < visibleCount ? `0 0 20px ${color}, 0 0 40px ${color}66` : 'none',
          marginRight: ch === ' ' ? '0.3em' : '0'
        }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
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

  const isTitle = scene.id === 'title1' || scene.id === 'title2';
  const isBlackout = scene.id === 'blackout';
  const isScene = scene.id.startsWith('scene_');
  const isLurker = scene.id === 'lurker';
  const isCta = scene.id === 'cta';

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

      {/* Blackout: just dark */}
      {isBlackout && <div />}

      {/* TITLE REVEAL */}
      {scene.id === 'title1' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            fontWeight: 700, margin: 0,
            letterSpacing: '0.1em'
          }}>
            <TitleReveal text="DIMENSIONLOCK" color="#a855f7" delay={200} />
          </h1>
        </div>
      )}

      {scene.id === 'title2' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            fontWeight: 700, margin: '0 0 12px',
            letterSpacing: '0.1em',
            color: '#a855f7',
            textShadow: '0 0 40px #a855f7, 0 0 80px #7c3aed44'
          }}>
            DIMENSIONLOCK
          </h1>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400, fontStyle: 'italic',
            margin: 0, letterSpacing: '0.5em',
            fontSize: 'clamp(1.2rem, 3vw, 2.5rem)',
          }}>
            <TitleReveal text="DEATHLY STORIES" color="#ff3366" delay={300} />
          </h2>
        </div>
      )}

      {/* DIALOGUE SCENES */}
      {(isScene || isLurker) && (
        <div style={{
          position: 'relative', width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.6s ease'
        }}>
          {/* Character portrait area */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            position: 'relative', overflow: 'hidden'
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

            {/* Character images */}
            {scene.char === 'maytradalis' && (
              <img src={MAYTRADALIS_IMG} alt="Maytradalis"
                style={{
                  height: '70vh', objectFit: 'contain',
                  mixBlendMode: 'screen',
                  filter: 'brightness(1.1) saturate(1.2)',
                  position: 'relative', zIndex: 1
                }}
              />
            )}
            {scene.char === 'death' && (
              <div style={{ position: 'relative', height: '70vh', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '85%', height: '100%',
                  background: 'radial-gradient(ellipse at 50% 40%, rgba(20,30,25,0.8) 30%, transparent 75%)',
                  zIndex: 0
                }} />
                <img src={MASTER_DEATH_IMG} alt="Master Death"
                  style={{
                    height: '70vh', objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    filter: 'brightness(0.6) contrast(1.3) saturate(0.7) sepia(0.2)',
                    position: 'relative', zIndex: 1
                  }}
                />
              </div>
            )}
            {scene.char === 'flybutt' && (
              <div style={{ position: 'relative', height: '55vh', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '80%', height: '90%',
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(40,35,0,0.7) 20%, transparent 70%)',
                  zIndex: 0
                }} />
                <img src={FLYBUTT_IMG} alt="Flybutt"
                  style={{
                    height: '55vh', objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    filter: 'brightness(0.65) saturate(1.8)',
                    position: 'relative', zIndex: 1
                  }}
                />
              </div>
            )}
            {scene.char === 'lurker' && (
              <div style={{ position: 'relative', height: '65vh', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '90%', height: '100%',
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(60,0,0,0.5) 20%, transparent 70%)',
                  zIndex: 0
                }} />
                <img src={LURKER_IMG} alt="The Lurker"
                  style={{
                    height: '65vh', objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    filter: 'brightness(0.55) saturate(2) contrast(1.4) hue-rotate(-15deg)',
                    position: 'relative', zIndex: 1,
                    animation: 'lurkerPulse 2s ease-in-out infinite'
                  }}
                />
              </div>
            )}
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

      {/* CTA */}
      {isCta && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#fff', fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700, marginBottom: 16,
            textShadow: '0 0 30px #a855f7'
          }}>
            DIMENSIONLOCK
          </h1>
          <p style={{
            color: '#a855f7', fontSize: 14,
            letterSpacing: '0.4em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 48
          }}>
            Deathly Stories
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
            BEGIN YOUR JOURNEY
          </button>
          <p style={{ color: '#ffffff33', fontSize: 11, marginTop: 24, letterSpacing: '0.2em' }}>
            or press any key
          </p>
        </div>
      )}

      {/* Skip button */}
      {!isCta && !isBlackout && (
        <button
          data-testid="skip-intro-button"
          onClick={(e) => { e.stopPropagation(); setFadeOut(true); setTimeout(onComplete, 500); }}
          style={{
            position: 'absolute', bottom: isScene || isLurker ? 140 : 24, right: 24,
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
        @keyframes lurkerPulse {
          0%, 100% { transform: scale(1); filter: brightness(0.7) saturate(1.5); }
          50% { transform: scale(1.03); filter: brightness(0.5) saturate(2) hue-rotate(-20deg); }
        }
      `}</style>
    </div>
  );
}
