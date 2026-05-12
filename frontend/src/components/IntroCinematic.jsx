import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Character image sources ─────────────────────────────────
const CHAR_IMGS = {
  maytradalis: 'https://customer-assets.emergentagent.com/job_gothic-action-beats/artifacts/9we5xmy8_694daec83256ed840148d9505e779707.webp',
  maytradalis_r: 'https://customer-assets.emergentagent.com/job_gothic-action-beats/artifacts/eqvwwi5o_611d4b76933a75a5a6923ea9856fcd49.webp',
  death:       '/intro/master_death.png',
  flybutt:     '/intro/flybutt.png',
  lurker:      '/intro/lurker.png',
};

const SCENES = [
  { id: 'scene_death',  duration: 4600, char: 'death',       text: '"Maytradalis… the Grim Reaper Ava has been taken into the Endless."' },
  { id: 'scene_death2', duration: 4200, char: 'death',       text: '"The Lurker — that plagued shadow — holds her captive beyond the veil."' },
  { id: 'scene_mayt',  duration: 4500, char: 'maytradalis', text: '"Then I\'ll find her and bring her back. Whatever lives in the dark between… I\'ll cut through it all."' },
  { id: 'scene_fly',   duration: 3800, char: 'flybutt',     text: '"Bzzt! Flybutt knows the Endless! I\'ll guide you through the void, boss!"' },
  { id: 'lurker',      duration: 4000, char: 'lurker',      text: '"…The Lurker stirs in the deep dark between worlds…"' },
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
// Helpers
// ──────────────────────────────────────────────────────────
function drawImageFit(ctx, img, x, y, w, h) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// ──────────────────────────────────────────────────────────
// Animated character canvas
// ──────────────────────────────────────────────────────────

// Maytradalis — purple gothic girl with scythe
function drawMaytradalis(ctx, img, t, W, H) {
  const sway    = Math.sin(t * 0.65) * 5;
  const breathe = Math.sin(t * 1.15) * 0.009;
  const hairW   = Math.sin(t * 2.8);

  ctx.save();
  ctx.translate(W / 2 + sway, H / 2);
  ctx.scale(1 + breathe, 1);
  ctx.translate(-W / 2, -H / 2);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // ── Scythe blade glow ──────────────────────────────────
  const bladeGlow = 0.28 + Math.sin(t * 1.8) * 0.14;
  ctx.save();
  ctx.shadowBlur = 22;
  ctx.shadowColor = `rgba(168,85,247,${bladeGlow})`;
  ctx.strokeStyle = `rgba(168,85,247,${bladeGlow * 0.7})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Approximate scythe blade position (upper-left area)
  const bladeArcX = W * 0.22 + sway;
  const bladeArcY = H * 0.1;
  const swingOff = Math.sin(t * 0.55) * 0.08;
  ctx.save();
  ctx.translate(bladeArcX, bladeArcY);
  ctx.rotate(swingOff);
  ctx.arc(0, 0, H * 0.2, -Math.PI * 0.15, Math.PI * 0.45);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // ── Floating hair strands ──────────────────────────────
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const bx = W * 0.44 + i * 14 + sway;
    const by = H * 0.08;
    const windX = Math.sin(t * 2.2 + i * 0.6) * (10 + i * 2.5) + hairW * 4;
    const windY = Math.cos(t * 1.6 + i * 0.4) * 6;
    const alpha = 0.6 - i * 0.08;
    ctx.strokeStyle = `rgba(196,132,252,${alpha})`;
    ctx.lineWidth = 2.8 - i * 0.35;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + windX * 0.5, by + 12, bx + windX, by + 22 + windY);
    ctx.stroke();
  }
  ctx.restore();

  // ── Purple energy embers rising ───────────────────────
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const phase = (t * 0.7 + i * 0.78) % 1;
    const ex = W * 0.25 + Math.sin(i * 1.3 + t) * W * 0.25;
    const ey = H * (0.9 - phase * 0.65);
    const alpha = Math.sin(phase * Math.PI) * 0.55;
    const sz = 2.5 + Math.sin(i * 0.9) * 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${i % 2 === 0 ? '168,85,247' : '196,132,252'},${alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(168,85,247,0.5)';
    ctx.fill();
  }
  ctx.restore();
}

// Master Death — skeletal plague-reaper in tall robes
function drawMasterDeath(ctx, img, t, W, H) {
  const sway   = Math.sin(t * 0.45) * 4;
  const cloak  = Math.sin(t * 0.7) * 6;
  const tilt   = Math.sin(t * 0.38) * 0.018; // radians — subtle head tilt
  const bob    = Math.sin(t * 1.1) * 3;

  ctx.save();

  // Lower robe (widest billow)
  ctx.save();
  ctx.translate(cloak * 0.5, 0);
  const clip1 = new Path2D();
  clip1.rect(0, H * 0.62, W, H * 0.38);
  ctx.clip(clip1);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // Mid torso
  ctx.save();
  ctx.translate(sway * 0.6, 0);
  const clip2 = new Path2D();
  clip2.rect(0, H * 0.28, W, H * 0.38);
  ctx.clip(clip2);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // Head (tilted)
  ctx.save();
  ctx.translate(W * 0.5 + sway, H * 0.16 + bob);
  ctx.rotate(tilt);
  ctx.translate(-W * 0.5, -H * 0.16);
  const clip3 = new Path2D();
  clip3.rect(0, 0, W, H * 0.3);
  ctx.clip(clip3);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  ctx.restore();

  // ── Teal eye glow ─────────────────────────────────────
  const eyeGlow = 0.55 + Math.sin(t * 2.2) * 0.3;
  const ex = W * 0.5 + sway;
  const ey = H * 0.155 + bob;
  ctx.save();
  const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 22);
  eg.addColorStop(0,   `rgba(0,255,204,${eyeGlow})`);
  eg.addColorStop(0.5, `rgba(0,200,170,${eyeGlow * 0.5})`);
  eg.addColorStop(1,   'rgba(0,255,204,0)');
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(ex, ey, 22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Scythe arc glow ────────────────────────────────────
  ctx.save();
  const scytheAngle = Math.sin(t * 0.42) * 0.06;
  const sx = W * 0.22;
  const sy = H * 0.12;
  ctx.translate(sx, sy);
  ctx.rotate(scytheAngle);
  ctx.strokeStyle = `rgba(0,255,204,${0.2 + Math.sin(t * 1.5) * 0.1})`;
  ctx.lineWidth = 2; ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(0,255,204,0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, H * 0.18, -0.2, 1.1);
  ctx.stroke();
  ctx.restore();

  // ── Cloak hem wave ─────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.3;
  const hemY = H * 0.88;
  ctx.strokeStyle = 'rgba(0,200,160,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 4) {
    const yo = Math.sin(x * 0.018 + t * 1.8) * (5 + Math.cos(t * 0.9) * 2);
    x === 0 ? ctx.moveTo(x, hemY + yo) : ctx.lineTo(x, hemY + yo);
  }
  ctx.stroke();
  ctx.restore();

  // ── Floating teal wisps ───────────────────────────────
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const phase = (t * 0.5 + i * 0.9) % 1;
    const side  = i % 2 === 0;
    const wx = side ? W * 0.1 + Math.random() * W * 0.15 : W * 0.75 + Math.random() * W * 0.15;
    const wy = H * (0.75 - phase * 0.45);
    const a  = Math.sin(phase * Math.PI) * 0.4;
    ctx.beginPath(); ctx.arc(wx, wy, 2.5 + Math.sin(i) * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,204,${a})`;
    ctx.fill();
  }
  ctx.restore();
}

// Flybutt — buzzing bee companion
function drawFlybutt(ctx, img, t, W, H) {
  // Erratic bee hover (multiple harmonic sine waves = natural insect flight)
  const hoverY = Math.sin(t * 4.2) * 7 + Math.sin(t * 11.3) * 3 + Math.sin(t * 2.1) * 4;
  const hoverX = Math.sin(t * 3.5) * 5 + Math.cos(t * 6.8) * 2.5;
  const tiltZ  = Math.sin(t * 2.8) * 5; // degrees

  ctx.save();
  ctx.translate(W / 2 + hoverX, H / 2 + hoverY);
  ctx.rotate((tiltZ * Math.PI) / 180);
  ctx.translate(-W / 2, -H / 2);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // ── Wing flutter (drawn over image as translucent ellipses) ──
  const wingFlap = Math.sin(t * 22) * 0.18; // fast wing beat
  const wingBase = { x: W * 0.5 + hoverX, y: H * 0.42 + hoverY };

  ctx.save();
  // Left wing
  ctx.save();
  ctx.translate(wingBase.x - W * 0.18, wingBase.y);
  ctx.rotate(-0.45 + wingFlap * 1.5);
  const lwg = ctx.createRadialGradient(-25, 0, 0, -25, 0, 95);
  lwg.addColorStop(0,   'rgba(255,235,100,0.55)');
  lwg.addColorStop(0.5, 'rgba(212,168,0,0.28)');
  lwg.addColorStop(1,   'rgba(255,220,0,0)');
  ctx.fillStyle = lwg;
  ctx.beginPath(); ctx.ellipse(-25, 0, 95, 38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Right wing
  ctx.save();
  ctx.translate(wingBase.x + W * 0.18, wingBase.y);
  ctx.rotate(0.45 - wingFlap * 1.4);
  const rwg = ctx.createRadialGradient(25, 0, 0, 25, 0, 95);
  rwg.addColorStop(0,   'rgba(255,235,100,0.55)');
  rwg.addColorStop(0.5, 'rgba(212,168,0,0.28)');
  rwg.addColorStop(1,   'rgba(255,220,0,0)');
  ctx.fillStyle = rwg;
  ctx.beginPath(); ctx.ellipse(25, 0, 95, 38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();

  // ── Antenna wave ───────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = 'rgba(212,168,0,0.85)';
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const antBase = { x: W * 0.5 + hoverX, y: H * 0.24 + hoverY };

  // Left
  const alWx = Math.sin(t * 3.5 + 0.4) * 12;
  ctx.beginPath();
  ctx.moveTo(antBase.x - 22, antBase.y);
  ctx.quadraticCurveTo(antBase.x - 30 + alWx, antBase.y - 22, antBase.x - 32 + alWx * 0.5, antBase.y - 45);
  ctx.stroke();
  // Left dot
  ctx.beginPath(); ctx.arc(antBase.x - 32 + alWx * 0.5, antBase.y - 48, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212,168,0,0.9)'; ctx.fill();

  // Right
  const arWx = Math.sin(t * 3.5 - 0.4) * 12;
  ctx.beginPath();
  ctx.moveTo(antBase.x + 22, antBase.y);
  ctx.quadraticCurveTo(antBase.x + 30 + arWx, antBase.y - 22, antBase.x + 32 + arWx * 0.5, antBase.y - 45);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(antBase.x + 32 + arWx * 0.5, antBase.y - 48, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212,168,0,0.9)'; ctx.fill();
  ctx.restore();

  // ── Yellow pollen sparkles ─────────────────────────────
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const phase = (t * 1.1 + i * 0.62) % 1;
    const spx = W * 0.2 + Math.sin(i * 1.9 + t * 2) * W * 0.55;
    const spy = H * (0.8 - phase * 0.55);
    const a = Math.sin(phase * Math.PI) * 0.6;
    ctx.beginPath(); ctx.arc(spx, spy, 1.8 + Math.sin(i) * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,0,${a})`; ctx.fill();
  }
  ctx.restore();
}

// Lurker — plague doctor sorcerer in green robes, T-pose, beak mask
function drawLurker(ctx, img, t, W, H) {
  const sway   = Math.sin(t * 0.35) * 5;  // very slow, ominous sway
  const breathe = Math.sin(t * 0.9) * 0.008;
  const armFloat = Math.sin(t * 0.5) * 4; // arms slowly float

  ctx.save();
  ctx.translate(W / 2 + sway, H / 2);
  ctx.scale(1 + breathe, 1 + breathe * 0.4);
  ctx.translate(-W / 2, -H / 2);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // ── Arm position hints (translucent shadow clones slightly offset) ──
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(t * 0.6) * 0.06;
  ctx.translate(W / 2 + sway + armFloat, H / 2);
  ctx.scale(1 + breathe * 2, 1);
  ctx.translate(-W / 2, -H / 2 + armFloat);
  drawImageFit(ctx, img, 0, 0, W, H);
  ctx.restore();

  // ── Green beak-eye glow ───────────────────────────────
  const eyeGlow = 0.4 + Math.sin(t * 1.6) * 0.28;
  const ex = W * 0.5 + sway;
  const ey = H * 0.17;
  ctx.save();
  // Two distinct eye gleams (one per eye of the beak mask)
  [-12, 12].forEach(offX => {
    const eg = ctx.createRadialGradient(ex + offX, ey, 0, ex + offX, ey, 16);
    eg.addColorStop(0,   `rgba(80,255,80,${eyeGlow})`);
    eg.addColorStop(0.4, `rgba(40,200,40,${eyeGlow * 0.5})`);
    eg.addColorStop(1,   'rgba(0,180,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(ex + offX, ey, 16, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  // ── Dark green robe hem tendrils ──────────────────────
  ctx.save();
  ctx.globalAlpha = 0.4;
  const hemY = H * 0.87;
  for (let i = 0; i < 5; i++) {
    const tx = W * 0.15 + i * W * 0.18 + sway;
    const tendrilH = 18 + Math.sin(t * 1.2 + i * 0.8) * 12;
    const cx = tx + Math.sin(t * 0.9 + i * 1.1) * 12;
    ctx.strokeStyle = `rgba(0,${80 + i * 18},0,0.45)`;
    ctx.lineWidth = 2.5 + Math.sin(t + i) * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, hemY);
    ctx.quadraticCurveTo(cx, hemY + tendrilH * 0.5, tx + Math.sin(t * 0.7 + i) * 6, hemY + tendrilH);
    ctx.stroke();
  }
  ctx.restore();

  // ── Corruption vignette ────────────────────────────────
  ctx.save();
  const corrAlpha = 0.08 + Math.sin(t * 0.6) * 0.04;
  const corrGrad = ctx.createRadialGradient(W * 0.5, H * 0.4, W * 0.12, W * 0.5, H * 0.4, W * 0.55);
  corrGrad.addColorStop(0, `rgba(0,40,0,0)`);
  corrGrad.addColorStop(0.6, `rgba(0,60,0,${corrAlpha})`);
  corrGrad.addColorStop(1,   `rgba(0,0,0,${corrAlpha * 2})`);
  ctx.fillStyle = corrGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── Gem crystal glow (belt crystals in reference) ─────
  ctx.save();
  const gemColors = ['255,0,0', '0,255,0', '0,0,255', '255,255,0', '255,0,255'];
  gemColors.forEach((col, i) => {
    const gx = W * 0.38 + i * W * 0.06 + sway;
    const gy = H * 0.42;
    const gAlpha = 0.3 + Math.sin(t * 1.8 + i * 0.7) * 0.2;
    const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 7);
    gg.addColorStop(0, `rgba(${col},${gAlpha})`);
    gg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(gx, gy, 7, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

// ──────────────────────────────────────────────────────────
// Animated Character Canvas
// ──────────────────────────────────────────────────────────
function AnimatedCharCanvas({ char }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  const drawFns = { maytradalis: drawMaytradalis, death: drawMasterDeath, flybutt: drawFlybutt, lurker: drawLurker };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = 600;
    canvas.height = 800;

    const ctx = canvas.getContext('2d');
    let rafId;
    let frame = 0;
    const W = 600, H = 800;

    // Load source image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    imgRef.current = img;

    const src = CHAR_IMGS[char] || CHAR_IMGS.maytradalis;
    img.src = src;

    const drawFn = drawFns[char] || drawMaytradalis;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      const t = frame / 60;
      drawFn(ctx, img, t, W, H);
      rafId = requestAnimationFrame(animate);
    };

    // Start immediately (image may not be loaded yet, drawImageFit guards against that)
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      img.src = ''; // abort load
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        position: 'relative',
        zIndex: 1,
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────
// Character container with aura
// ──────────────────────────────────────────────────────────
const CHAR_STYLES = {
  maytradalis: {
    height: '76vh', width: '36vw',
    aura: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.45) 0%, transparent 68%)',
    auraAnim: 'auraPurple',
    filter: 'drop-shadow(0 0 40px rgba(168,85,247,0.7))',
  },
  death: {
    height: '78vh', width: '40vw',
    aura: 'radial-gradient(ellipse at 50% 50%, rgba(0,180,140,0.38) 0%, transparent 68%)',
    auraAnim: 'auraTeal',
    filter: 'drop-shadow(0 0 38px rgba(0,255,204,0.65))',
  },
  flybutt: {
    height: '62vh', width: '34vw',
    aura: 'radial-gradient(ellipse at 50% 50%, rgba(200,150,0,0.45) 0%, transparent 65%)',
    auraAnim: 'auraGold',
    filter: 'drop-shadow(0 0 34px rgba(212,168,0,0.72))',
  },
  lurker: {
    height: '76vh', width: '42vw',
    aura: 'radial-gradient(ellipse at 50% 50%, rgba(0,80,0,0.45) 0%, transparent 68%)',
    auraAnim: 'auraGreen',
    filter: 'drop-shadow(0 0 38px rgba(0,180,0,0.62))',
  },
};

function CharacterStage({ char }) {
  const cs = CHAR_STYLES[char] || CHAR_STYLES.maytradalis;
  return (
    <div style={{
      position: 'relative',
      width: cs.width, height: cs.height,
      maxWidth: 760,
      zIndex: 1,
      filter: cs.filter,
    }}>
      {/* Aura */}
      <div style={{
        position: 'absolute', inset: '-22%',
        background: cs.aura,
        animation: `${cs.auraAnim} 3.5s ease-in-out infinite`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Canvas */}
      <AnimatedCharCanvas char={char} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main IntroCinematic
// ──────────────────────────────────────────────────────────
export default function IntroCinematic({ onComplete }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [fadeOut, setFadeOut]   = useState(false);

  const scene   = SCENES[sceneIdx];
  const isCta   = scene.id === 'cta';

  const advance = useCallback(() => {
    if (sceneIdx >= SCENES.length - 1) { setFadeOut(true); setTimeout(onComplete, 700); return; }
    setSceneIdx(i => i + 1);
  }, [sceneIdx, onComplete]);

  useEffect(() => {
    if (isCta) return;
    const id = setTimeout(advance, scene.duration);
    return () => clearTimeout(id);
  }, [sceneIdx, scene, advance, isCta]);

  // Char-specific background
  const bgMap = {
    lurker:       'radial-gradient(circle at 50% 58%, #001200 0%, #000 70%)',
    maytradalis:  'radial-gradient(circle at 50% 58%, #0a0020 0%, #000 70%)',
    death:        'radial-gradient(circle at 50% 58%, #001208 0%, #000 70%)',
    flybutt:      'radial-gradient(circle at 50% 58%, #070600 0%, #000 70%)',
  };
  const bg = bgMap[scene.char] || '#000';

  // Speaker label
  const speakerMap = {
    death: 'Master Death', maytradalis: 'Maytradalis',
    flybutt: 'Flybutt', lurker: 'The Lurker',
  };
  const speakerColorMap = {
    death: '#00ffcc', maytradalis: '#a855f7',
    flybutt: '#d4a800', lurker: '#4cff4c',
  };

  return (
    <div
      data-testid="intro-cinematic"
      onClick={isCta ? undefined : advance}
      style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: isCta ? 'default' : 'pointer',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.7s ease',
        overflow: 'hidden', zIndex: 200,
      }}
    >
      {/* Star field */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(70)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 137.5) % 100}%`, top: `${(i * 97.3) % 100}%`,
            width: `${(i % 3) * 0.55 + 0.45}px`, height: `${(i % 3) * 0.55 + 0.45}px`,
            borderRadius: '50%', background: '#fff',
            opacity: (i % 7) * 0.06 + 0.05,
            animation: `twinkle ${2 + (i % 5) * 0.6}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 0.13) % 3}s`,
          }} />
        ))}
      </div>

      {/* Dialogue scene */}
      {!isCta && (
        <div key={scene.id} style={{
          position: 'relative', width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          animation: 'sceneIn 0.6s ease',
        }}>
          {/* Portrait area */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', paddingBottom: 20,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: bg }} />

            {/* Ground mist */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '26%',
              background: `linear-gradient(to top, ${
                scene.char === 'lurker'      ? 'rgba(0,80,0,0.35)' :
                scene.char === 'maytradalis' ? 'rgba(80,0,120,0.28)' :
                scene.char === 'death'       ? 'rgba(0,80,60,0.22)' :
                                               'rgba(70,60,0,0.2)'
              }, transparent)`,
              pointerEvents: 'none', zIndex: 0,
            }} />

            {/* Vertical light beam */}
            <div style={{
              position: 'absolute', top: '4%', bottom: '8%',
              left: '50%', transform: 'translateX(-50%)',
              width: '20%',
              background: `linear-gradient(to bottom, transparent, ${
                scene.char === 'lurker'      ? 'rgba(0,180,0,0.07)' :
                scene.char === 'maytradalis' ? 'rgba(168,85,247,0.07)' :
                scene.char === 'death'       ? 'rgba(0,255,204,0.06)' :
                                               'rgba(212,168,0,0.06)'
              } 40%, transparent)`,
              pointerEvents: 'none', zIndex: 0,
              animation: 'beamPulse 4.5s ease-in-out infinite',
            }} />

            <CharacterStage char={scene.char} />
          </div>

          {/* Dialogue box */}
          <div style={{
            background: 'rgba(4,2,10,0.97)',
            borderTop: '1px solid rgba(100,80,160,0.25)',
            padding: '26px 52px 30px',
            minHeight: 110, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -14, left: 38,
              background: '#05020e', border: `1px solid ${speakerColorMap[scene.char]}44`,
              padding: '4px 18px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.32em',
              color: speakerColorMap[scene.char],
              textTransform: 'uppercase',
              textShadow: `0 0 10px ${speakerColorMap[scene.char]}`,
            }}>
              {speakerMap[scene.char]}
            </div>

            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1rem, 2.4vw, 1.38rem)',
              fontStyle: 'italic', color: '#e8e0f0',
              margin: 0, lineHeight: 1.72, maxWidth: 880,
            }}>
              <TypewriterText text={scene.text} speed={30} />
            </p>

            <p style={{
              position: 'absolute', right: 40, bottom: 10,
              color: '#ffffff28', fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.22em',
            }}>
              CLICK TO CONTINUE
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      {isCta && (
        <div style={{ textAlign: 'center', animation: 'sceneIn 0.8s ease' }}>
          <p style={{
            color: '#a855f7', fontSize: 12, letterSpacing: '0.5em',
            textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 36, textShadow: '0 0 14px #a855f7',
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
          <p style={{ color: '#ffffff28', fontSize: 11, marginTop: 24, letterSpacing: '0.2em' }}>
            or press any key
          </p>
        </div>
      )}

      {/* Skip */}
      {!isCta && (
        <button
          data-testid="skip-intro-button"
          onClick={e => { e.stopPropagation(); setFadeOut(true); setTimeout(onComplete, 500); }}
          style={{
            position: 'absolute', bottom: 130, right: 24,
            background: 'transparent', color: '#ffffff2a',
            border: '1px solid #ffffff18', padding: '6px 16px',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s', zIndex: 10,
          }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#fff'; }}
          onMouseLeave={e => { e.target.style.color = '#ffffff2a'; e.target.style.borderColor = '#ffffff18'; }}
        >
          SKIP
        </button>
      )}

      <style>{`
        @keyframes sceneIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          from { opacity: 0.06; } to { opacity: 0.7; }
        }
        @keyframes auraPurple {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes auraTeal {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50%      { opacity: 0.95; transform: scale(1.08); }
        }
        @keyframes auraGold {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.12); }
        }
        @keyframes auraGreen {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.55; transform: translateX(-50%) scaleX(1); }
          50%      { opacity: 1;    transform: translateX(-50%) scaleX(1.2); }
        }
      `}</style>
    </div>
  );
}
