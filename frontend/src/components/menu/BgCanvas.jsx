import React, { useEffect, useRef } from 'react';

// Animated background canvas: pulsing hex grid + diagonal energy lines +
// drifting particles + scanlines + vignette. Fixed to the viewport.
export default function BgCanvas() {
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
