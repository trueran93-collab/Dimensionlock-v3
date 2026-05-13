import { SPRITES, getStateFrame } from './sprites.js';

const SPRITE_SIZE = 130; // Visual draw size for Maytradalis

export class Renderer {
  constructor() {
    this.stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * 1280, y: Math.random() * 720,
      size: Math.random() * 2 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      alpha: Math.random() * 0.6 + 0.2
    }));
    this.nebulae = Array.from({ length: 6 }, () => ({
      x: Math.random() * 1280, y: Math.random() * 720,
      rx: Math.random() * 200 + 80, ry: Math.random() * 120 + 50,
      color: ['#7c3aed', '#00ffcc', '#a855f7', '#1d4ed8', '#7c3aed', '#00ffcc'][Math.floor(Math.random() * 6)],
      alpha: Math.random() * 0.04 + 0.02
    }));
  }

  render(ctx, engine) {
    this._drawBackground(ctx, engine.frameCount, engine.floor);
    this._drawPlatforms(ctx, engine.platforms, engine.frameCount);
    this._drawSoulSeeds(ctx, engine.soulSeeds || [], engine.frameCount);
    this._drawProjectiles(ctx, engine.projectiles);
    engine.particles.render(ctx);
    this._drawEnemies(ctx, engine.enemies, engine.frameCount);
    this._drawFlybutt(ctx, engine.flybutt, engine.frameCount);
    this._drawPlayer(ctx, engine.player, engine.frameCount);
    this._drawUltimateAura(ctx, engine.player, engine.frameCount);
  }

  _drawUltimateAura(ctx, player, frame) {
    if (!player.ultimateActive) return;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const t = player.ultimateTimer / player.ultimateMaxDuration;
    const radius = 90 + Math.sin(frame * 0.3) * 12;
    ctx.save();
    // Outer whirlwind rings
    for (let i = 0; i < 5; i++) {
      const r = radius - i * 10;
      ctx.globalAlpha = 0.18 + i * 0.04;
      ctx.shadowColor = i % 2 === 0 ? '#a855f7' : '#00ffcc';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = i % 2 === 0 ? '#c084fc' : '#00ffcc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const startAngle = frame * 0.2 + i * 0.6;
      ctx.arc(cx, cy, r, startAngle, startAngle + Math.PI * 1.4);
      ctx.stroke();
    }
    // Scythe arc lines
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#fff7c2';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const a = frame * 0.35 + i * (Math.PI * 2 / 3);
      const r1 = radius * 0.4, r2 = radius * 0.95;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    // Centre flash
    ctx.globalAlpha = 0.25 * t;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, '#a855f7');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawSoulSeeds(ctx, seeds, frame) {
    for (const s of seeds) {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const pulse = 0.8 + 0.2 * Math.sin(s.phase);
      const fade = s.life < 90 ? Math.max(0.2, s.life / 90) : 1;
      ctx.save();
      ctx.globalAlpha = fade;

      // Outer aura
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 22;
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * pulse);
      auraGrad.addColorStop(0, 'rgba(192,132,252,0.7)');
      auraGrad.addColorStop(0.5, 'rgba(124,58,237,0.35)');
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 14;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 7);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#c084fc');
      coreGrad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 7 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Orbit sparks
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) {
        const a = s.phase * 1.4 + i * (Math.PI * 2 / 3);
        const r = 12;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawBackground(ctx, frame, floor) {
    const theme = Math.floor((floor - 1) / 5) % 4;
    const gradients = [
      // Gothic violet cathedral
      { sky: ['#02010a', '#0a0420', '#1a0a3e'], neon: '#a855f7', accent: '#00ffcc', stained: '#7c3aed' },
      // Toxic cyberpunk
      { sky: ['#020a08', '#03201a', '#05382a'], neon: '#00ffcc', accent: '#a855f7', stained: '#10b981' },
      // Hellfire ruins
      { sky: ['#0a0205', '#1e0510', '#3a0a18'], neon: '#ff3366', accent: '#fbbf24', stained: '#dc2626' },
      // Void blue cathedral
      { sky: ['#020618', '#0a0a3a', '#1e1660'], neon: '#3b82f6', accent: '#00ffcc', stained: '#6366f1' }
    ];
    const T = gradients[theme];
    const [g0, g1, g2] = T.sky;
    const bg = ctx.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, g0);
    bg.addColorStop(0.5, g1);
    bg.addColorStop(1, g2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);

    // ── Nebula clouds (deep parallax) ────────────────────────────────────
    for (const n of this.nebulae) {
      ctx.save();
      ctx.globalAlpha = n.alpha + Math.sin(frame * 0.01 + n.x) * 0.01;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.rx);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Distant cyberpunk skyline (far parallax) ─────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.55;
    const skylineY = 460;
    const farOffset = (frame * 0.15) % 80;
    ctx.fillStyle = '#050314';
    ctx.shadowColor = T.neon;
    ctx.shadowBlur = 6;
    for (let bx = -80; bx < 1360; bx += 60) {
      const seed = Math.sin(bx * 0.07) * 0.5 + 0.5;
      const bh = 60 + seed * 110;
      const wbar = 40 + seed * 18;
      ctx.fillRect(bx - farOffset, skylineY - bh, wbar, bh);
      // window lights
      ctx.shadowBlur = 0;
      ctx.fillStyle = T.neon + '99';
      for (let wy = skylineY - bh + 10; wy < skylineY - 6; wy += 14) {
        if ((Math.sin(bx + wy * 0.3 + frame * 0.02) > 0.3)) {
          ctx.fillRect(bx - farOffset + 4, wy, 3, 3);
          ctx.fillRect(bx - farOffset + 10, wy, 3, 3);
        }
      }
      ctx.fillStyle = '#050314';
      ctx.shadowBlur = 6;
    }
    ctx.restore();

    // ── Gothic cathedral spires (mid parallax) ───────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.78;
    const midOffset = (frame * 0.35) % 220;
    const spirePositions = [120, 380, 640, 900, 1160, 1420];
    for (const sx of spirePositions) {
      const x = sx - midOffset;
      const baseY = 540;
      ctx.fillStyle = '#06031a';
      ctx.shadowColor = T.stained;
      ctx.shadowBlur = 14;
      // Spire body
      ctx.beginPath();
      ctx.moveTo(x - 40, baseY);
      ctx.lineTo(x - 36, baseY - 160);
      ctx.lineTo(x - 12, baseY - 180);
      ctx.lineTo(x, baseY - 260); // peak
      ctx.lineTo(x + 12, baseY - 180);
      ctx.lineTo(x + 36, baseY - 160);
      ctx.lineTo(x + 40, baseY);
      ctx.closePath();
      ctx.fill();
      // Stained-glass arched window
      ctx.shadowBlur = 18;
      const glassGrad = ctx.createLinearGradient(x, baseY - 150, x, baseY - 60);
      glassGrad.addColorStop(0, T.stained);
      glassGrad.addColorStop(0.5, T.neon);
      glassGrad.addColorStop(1, '#1a0a3e');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(x - 14, baseY - 60);
      ctx.lineTo(x - 14, baseY - 130);
      ctx.quadraticCurveTo(x, baseY - 160, x + 14, baseY - 130);
      ctx.lineTo(x + 14, baseY - 60);
      ctx.closePath();
      ctx.fill();
      // Stained glass cross
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 1, baseY - 145, 2, 78);
      ctx.fillRect(x - 8, baseY - 110, 16, 2);
      // Spire glow tip
      ctx.shadowColor = T.accent;
      ctx.shadowBlur = 18;
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(x, baseY - 260, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Foreground cyberpunk-gothic street infrastructure ────────────────
    // Tall buildings + neon signs + street lamps (closer parallax)
    ctx.save();
    const nearOffset = (frame * 0.6) % 320;
    const buildingPositions = [-60, 180, 470, 760, 1050, 1340];
    for (let bi = 0; bi < buildingPositions.length; bi++) {
      const bx = buildingPositions[bi] - nearOffset;
      const baseY = 600;
      const heightSeed = (bi % 3 === 0) ? 220 : (bi % 3 === 1 ? 160 : 280);
      const bw = 110;

      // Building body
      ctx.fillStyle = '#08051c';
      ctx.shadowColor = T.stained;
      ctx.shadowBlur = 22;
      ctx.fillRect(bx, baseY - heightSeed, bw, heightSeed);

      // Sharp gothic peak
      ctx.beginPath();
      ctx.moveTo(bx, baseY - heightSeed);
      ctx.lineTo(bx + bw / 2, baseY - heightSeed - 28);
      ctx.lineTo(bx + bw, baseY - heightSeed);
      ctx.closePath();
      ctx.fill();

      // Vertical accent strip
      ctx.shadowBlur = 12;
      ctx.fillStyle = T.neon + 'aa';
      ctx.fillRect(bx + bw / 2 - 1, baseY - heightSeed + 10, 2, heightSeed - 14);

      // Neon window grid (cyberpunk apartment lights)
      ctx.shadowBlur = 8;
      for (let wy = baseY - heightSeed + 24; wy < baseY - 12; wy += 22) {
        for (let wx = bx + 12; wx < bx + bw - 12; wx += 22) {
          const lit = Math.sin(wx * 0.13 + wy * 0.21 + frame * 0.015) > 0.1;
          ctx.fillStyle = lit ? T.neon + 'cc' : '#0a0628';
          ctx.fillRect(wx, wy, 7, 9);
        }
      }

      // Hanging neon sign every other building
      if (bi % 2 === 1) {
        ctx.shadowColor = T.accent;
        ctx.shadowBlur = 18;
        ctx.fillStyle = T.accent + 'cc';
        const sgnX = bx + bw / 2 - 18;
        const sgnY = baseY - heightSeed / 2;
        ctx.fillRect(sgnX, sgnY, 36, 10);
        // Hanger arms
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx, sgnY - 6);
        ctx.lineTo(sgnX, sgnY + 4);
        ctx.moveTo(bx + bw, sgnY - 6);
        ctx.lineTo(sgnX + 36, sgnY + 4);
        ctx.stroke();
        // Sign glyph
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(sgnX + 4, sgnY + 3, 4, 4);
        ctx.fillRect(sgnX + 14, sgnY + 3, 4, 4);
        ctx.fillRect(sgnX + 24, sgnY + 3, 4, 4);
      }

      // Roof antenna / cross
      ctx.shadowColor = T.accent;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, baseY - heightSeed - 28);
      ctx.lineTo(bx + bw / 2, baseY - heightSeed - 56);
      ctx.moveTo(bx + bw / 2 - 8, baseY - heightSeed - 46);
      ctx.lineTo(bx + bw / 2 + 8, baseY - heightSeed - 46);
      ctx.stroke();
      // Antenna red blinker
      const blink = Math.sin(frame * 0.18 + bi) > 0;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = blink ? 16 : 4;
      ctx.fillStyle = blink ? '#ff3366' : '#330011';
      ctx.beginPath();
      ctx.arc(bx + bw / 2, baseY - heightSeed - 58, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Street lampposts on ground (very close parallax) ─────────────────
    ctx.save();
    const lampOffset = (frame * 1.1) % 400;
    const lampPositions = [60, 460, 860, 1260, 1660];
    for (const lx of lampPositions) {
      const x = lx - lampOffset;
      if (x < -40 || x > 1320) continue;
      const groundY = 670;
      // Pole
      ctx.strokeStyle = '#0a0815';
      ctx.lineWidth = 4;
      ctx.shadowColor = T.neon;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY - 110);
      ctx.stroke();
      // Top curl (gothic ironwork)
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, groundY - 110);
      ctx.quadraticCurveTo(x + 10, groundY - 125, x + 22, groundY - 118);
      ctx.stroke();
      // Lamp housing
      ctx.fillStyle = '#0a0815';
      ctx.beginPath();
      ctx.ellipse(x + 22, groundY - 110, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glowing bulb
      ctx.shadowColor = T.accent;
      ctx.shadowBlur = 26;
      const flicker = 0.85 + 0.15 * Math.sin(frame * 0.4 + x);
      ctx.globalAlpha = flicker;
      ctx.fillStyle = T.accent;
      ctx.beginPath();
      ctx.arc(x + 22, groundY - 107, 4, 0, Math.PI * 2);
      ctx.fill();
      // Light cone on ground
      ctx.globalAlpha = 0.18 * flicker;
      const cone = ctx.createRadialGradient(x + 22, groundY - 100, 5, x + 22, groundY + 40, 90);
      cone.addColorStop(0, T.accent);
      cone.addColorStop(1, 'transparent');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(x + 22, groundY - 100);
      ctx.lineTo(x - 38, groundY + 60);
      ctx.lineTo(x + 82, groundY + 60);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ── Stars with parallax ──────────────────────────────────────────────
    for (const s of this.stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = 1280;
      const twinkle = s.alpha * (0.6 + 0.4 * Math.sin(frame * 0.025 + s.y));
      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Floating gothic gargoyle silhouettes ─────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000';
    const garX1 = 200 + Math.sin(frame * 0.005) * 25;
    const garX2 = 1080 + Math.cos(frame * 0.006) * 30;
    const garY = 180 + Math.sin(frame * 0.01) * 10;
    [[garX1, garY], [garX2, garY + 20]].forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.ellipse(gx, gy, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // wings
      ctx.beginPath();
      ctx.moveTo(gx - 16, gy);
      ctx.quadraticCurveTo(gx - 35, gy - 10 + Math.sin(frame * 0.15) * 5, gx - 30, gy + 8);
      ctx.quadraticCurveTo(gx - 18, gy + 3, gx - 16, gy);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(gx + 16, gy);
      ctx.quadraticCurveTo(gx + 35, gy - 10 + Math.sin(frame * 0.15 + 1) * 5, gx + 30, gy + 8);
      ctx.quadraticCurveTo(gx + 18, gy + 3, gx + 16, gy);
      ctx.fill();
    });
    ctx.restore();

    // ── Dimensional rift flickers ────────────────────────────────────────
    const riftPhase = Math.sin(frame * 0.015);
    if (riftPhase > 0.7) {
      ctx.save();
      ctx.globalAlpha = (riftPhase - 0.7) * 0.6;
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = T.accent;
      ctx.shadowBlur = 18;
      const rx = ((frame * 2.5) % 1100) + 90;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.bezierCurveTo(rx + 30, 180, rx - 20, 380, rx + 15, 560);
      ctx.lineTo(rx + 18, 720);
      ctx.stroke();
      ctx.restore();
    }

    // ── Vignette + ground mist ───────────────────────────────────────────
    const mistGrad = ctx.createLinearGradient(0, 540, 0, 720);
    mistGrad.addColorStop(0, 'rgba(60,20,120,0)');
    mistGrad.addColorStop(0.5, 'rgba(80,30,140,0.18)');
    mistGrad.addColorStop(1, 'rgba(120,30,180,0.38)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 540, 1280, 180);

    // Vignette overlay
    const vGrad = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, 1280, 720);
  }

  _drawPlatforms(ctx, platforms, frame) {
    const themes = [
      { main: '#16092e', top: '#7c3aed', glow: '#a855f7', crystal: '#c084fc' },
      { main: '#061818', top: '#059669', glow: '#00ffcc', crystal: '#34d399' },
      { main: '#200808', top: '#dc2626', glow: '#ff3366', crystal: '#f87171' },
      { main: '#0a0820', top: '#6d28d9', glow: '#8b5cf6', crystal: '#a78bfa' }
    ];

    for (const p of platforms) {
      const tc = themes[p.theme % 4] || themes[0];
      const isGround = p.h > 30;
      ctx.save();

      // Platform shadow
      ctx.shadowColor = tc.glow;
      ctx.shadowBlur = 18;

      // Rounded platform
      ctx.fillStyle = tc.main;
      ctx.beginPath();
      const r = isGround ? 0 : 8;
      ctx.roundRect(p.x, p.y, p.w, p.h, r);
      ctx.fill();

      // Top glowing edge
      ctx.shadowBlur = 8;
      ctx.fillStyle = tc.top;
      ctx.fillRect(p.x + (isGround ? 0 : r), p.y, p.w - (isGround ? 0 : r * 2), 3);

      if (!isGround) {
        // Crystal decorations on top
        ctx.fillStyle = tc.crystal;
        ctx.shadowColor = tc.crystal;
        ctx.shadowBlur = 12;
        const spacing = Math.max(30, p.w / 4);
        for (let i = spacing / 2; i < p.w; i += spacing) {
          const crystalH = 6 + Math.sin(frame * 0.04 + p.x + i) * 2;
          ctx.beginPath();
          ctx.moveTo(p.x + i, p.y - crystalH);
          ctx.lineTo(p.x + i + 4, p.y - 2);
          ctx.lineTo(p.x + i - 4, p.y - 2);
          ctx.closePath();
          ctx.fill();
        }

        // Underside glow
        ctx.shadowBlur = 0;
        const under = ctx.createLinearGradient(0, p.y + p.h, 0, p.y + p.h + 25);
        under.addColorStop(0, tc.glow + '55');
        under.addColorStop(1, 'transparent');
        ctx.fillStyle = under;
        ctx.fillRect(p.x, p.y + p.h, p.w, 25);
      }
      ctx.restore();
    }
  }

  _drawPlayer(ctx, player, frame) {
    if (player.state === 'dead' && player.deathTimer <= 0) return;

    const { x, y, w, h, facingRight, state, attackTimer, attackType, hurtTimer } = player;
    const spriteFrame = getStateFrame(state, player.animFrame, attackTimer, attackType);

    ctx.save();

    // Hurt flash
    if (hurtTimer > 0 && Math.floor(frame / 4) % 2 === 0) ctx.globalAlpha = 0.45;

    // Death fade
    if (state === 'dead') {
      ctx.globalAlpha = Math.max(0, (player.deathTimer - 30) / 60) * (hurtTimer > 0 ? 0.45 : 1);
    }

    // Dash afterimage
    if (player.isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#00ffcc';
      const shadowX = x - player.dashDir * 25;
      if (SPRITES.maytradalis?.loaded) {
        SPRITES.maytradalis.draw(ctx, spriteFrame, shadowX - SPRITE_SIZE * 0.15, y - 20, SPRITE_SIZE, SPRITE_SIZE, facingRight);
      }
      ctx.restore();
    }

    // Draw sprite if loaded, fallback to primitive
    const spriteX = x + w / 2 - SPRITE_SIZE / 2;
    const spriteY = y + h - SPRITE_SIZE + 10;
    let drewSprite = false;

    if (SPRITES.maytradalis?.loaded && !SPRITES.maytradalis?.error) {
      drewSprite = SPRITES.maytradalis.draw(ctx, spriteFrame, spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE, facingRight);
    }

    if (!drewSprite) {
      // Fallback primitive drawing
      this._drawMaytradalisPrimitive(ctx, player, frame);
    } else {
      // Add glow effects on top of sprite
      if (state === 'attacking_special') {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 50;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        const auraR = 70 + (42 - attackTimer) * 1.5;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, auraR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (state === 'dashing') {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 25;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(spriteX + 10, spriteY + 10, SPRITE_SIZE - 20, SPRITE_SIZE - 20);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Combo burst glow
    if (player.combo >= 5) {
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(frame * 0.2) * 0.1;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Running speed-lines (afterimage streaks) ──────────
    if (state === 'running') {
      ctx.save();
      const dir = facingRight ? -1 : 1;
      const baseX = facingRight ? x : x + w;
      for (let i = 0; i < 6; i++) {
        const lineY  = y + h * 0.22 + i * h * 0.11;
        const len    = 22 + Math.sin(frame * 0.4 + i * 0.8) * 9;
        const alpha  = (0.38 - i * 0.045) * (0.5 + Math.sin(frame * 0.25 + i) * 0.5);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.strokeStyle = i % 2 === 0 ? '#a855f7' : '#c084fc';
        ctx.lineWidth   = 1.8 - i * 0.22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(baseX, lineY);
        ctx.lineTo(baseX + dir * len, lineY);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  _drawMaytradalisPrimitive(ctx, player, frame) {
    // Simplified anime-style primitive fallback
    const { x, y, w, h, facingRight, state, hurtTimer } = player;
    ctx.save();
    if (!facingRight) {
      ctx.translate(x + w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    const bob = state === 'running' ? Math.sin(frame * 0.28) * 2 : 0;
    const py = y + bob;

    // Legs
    ctx.fillStyle = '#8a9aaa';
    const legSwing = state === 'running' ? Math.sin(frame * 0.28) * 10 : 0;
    ctx.save(); ctx.translate(x + 10, py + h * 0.7); ctx.rotate(legSwing * 0.05); ctx.fillRect(0, 0, 11, 24); ctx.restore();
    ctx.save(); ctx.translate(x + w - 21, py + h * 0.7); ctx.rotate(-legSwing * 0.05); ctx.fillRect(0, 0, 11, 24); ctx.restore();

    // Shoes
    ctx.fillStyle = '#181225';
    ctx.beginPath(); ctx.ellipse(x + 14, py + h * 0.9 + 8, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + w - 14, py + h * 0.9 + 8, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 5, py + h * 0.9 + 5, 7, 2);
    ctx.fillRect(x + w - 12, py + h * 0.9 + 5, 7, 2);

    // Dress
    ctx.fillStyle = '#0e0e1c';
    ctx.beginPath();
    ctx.moveTo(x + 2, py + h * 0.28);
    ctx.lineTo(x + w - 2, py + h * 0.28);
    ctx.lineTo(x + w + 6, py + h * 0.72);
    ctx.lineTo(x - 6, py + h * 0.72);
    ctx.closePath();
    ctx.fill();

    // Frills
    ctx.fillStyle = '#dde0e8';
    for (let fi = -6; fi < w + 6; fi += 7) {
      ctx.beginPath();
      ctx.arc(x + fi + 4, py + h * 0.72, 5, 0, Math.PI, true);
      ctx.fill();
    }

    // Belt
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 5, py + h * 0.44, w - 10, 5);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x + w / 2 - 4, py + h * 0.43, 8, 7);

    // Torso
    ctx.fillStyle = '#0e0e1c';
    ctx.fillRect(x + 7, py + h * 0.23, w - 14, h * 0.22);

    // Collar
    ctx.fillStyle = '#dde0e8';
    ctx.fillRect(x + 9, py + h * 0.21, w - 18, 6);

    // Head
    ctx.fillStyle = '#f0c8b0';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, py + h * 0.14, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#9333ea';
    ctx.beginPath(); ctx.ellipse(x + w / 2, py + h * 0.07, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + 2, py + h * 0.06, 8, 18);
    ctx.fillRect(x + w - 10, py + h * 0.06, 8, 15);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(x + 4, py + h * 0.07, 3, 11);

    // Hat
    ctx.fillStyle = '#111120';
    ctx.beginPath(); ctx.ellipse(x + w / 2, py - 2, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w / 2 - 11, py - 18, 22, 17);
    ctx.fillStyle = '#dde0e8';
    ctx.fillRect(x + w / 2 - 11, py - 3, 22, 2);

    // Eyes
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + w / 2 - 10, py + h * 0.16, 6, 4);
    ctx.fillRect(x + w / 2 + 4, py + h * 0.16, 6, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w / 2 - 8, py + h * 0.16, 2, 2);
    ctx.fillRect(x + w / 2 + 6, py + h * 0.16, 2, 2);

    ctx.restore();
  }

  _drawFlybutt(ctx, fb, frame) {
    if (!fb) return;
    const { x, y, wingAngle } = fb;
    const bobY = y + Math.sin(frame * 0.1) * 4;

    ctx.save();
    ctx.shadowColor = '#d4a800';
    ctx.shadowBlur = 12;

    // Wings (transparent, flapping)
    const wingFlap = Math.sin(frame * 0.35) * 0.8;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#c8d8f8';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.8;
    // Left wing
    ctx.save();
    ctx.translate(x - 2, bobY + 8);
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-12, -6, 14, 8, -0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(x + 2, bobY + 8);
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(12, -6, 14, 8, 0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // Abdomen (rounded oval, yellow-green)
    ctx.fillStyle = '#b8a020';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, bobY + 14, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Abdomen segments
    ctx.strokeStyle = '#8a7600';
    ctx.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 9 + i * 1.5, bobY + 8 + i * 4);
      ctx.lineTo(x + 9 - i * 1.5, bobY + 8 + i * 4);
      ctx.stroke();
    }

    // Head (double-lobed yellow)
    ctx.fillStyle = '#d4a800';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x - 4, bobY - 2, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 4, bobY - 2, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Bridge
    ctx.fillStyle = '#d4a800';
    ctx.fillRect(x - 4, bobY - 7, 8, 10);

    // Eyes (big white circles)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x - 4, bobY - 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 4, bobY - 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x - 4, bobY - 1, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, bobY - 1, 2.2, 0, Math.PI * 2); ctx.fill();
    // Eye shines
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 3, bobY - 2.5, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, bobY - 2.5, 0.9, 0, Math.PI * 2); ctx.fill();

    // Antennae
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 5, bobY - 9);
    ctx.quadraticCurveTo(x - 10, bobY - 22, x - 8, bobY - 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 5, bobY - 9);
    ctx.quadraticCurveTo(x + 10, bobY - 22, x + 8, bobY - 26);
    ctx.stroke();
    // Antenna tips
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x - 8, bobY - 26, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, bobY - 26, 2, 0, Math.PI * 2); ctx.fill();

    // Mouthpart (small crescent)
    ctx.strokeStyle = '#7a5800';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, bobY + 6, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Thin legs (6 total, 3 each side)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const legY = bobY + 6 + i * 4;
      ctx.beginPath();
      ctx.moveTo(x - 4, legY);
      ctx.lineTo(x - 14 - i * 2, legY + 8 + i * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 4, legY);
      ctx.lineTo(x + 14 + i * 2, legY + 8 + i * 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawEnemies(ctx, enemies, frame) {
    for (const e of enemies) {
      if (e.dead) continue;
      switch (e.type) {
        case 'shadow_demon': this._drawLurkerHusk(ctx, e, frame, 'small'); break;
        case 'void_sprite': this._drawVoidHusk(ctx, e, frame); break;
        case 'dimension_watcher': this._drawEyeHusk(ctx, e, frame); break;
        case 'lurker_cultist': this._drawLurkerCultist(ctx, e, frame); break;
        case 'boss': this._drawLurkerHusk(ctx, e, frame, 'boss'); break;
        default: this._drawLurkerHusk(ctx, e, frame, 'small');
      }
      this._drawEnemyHpBar(ctx, e);
    }
  }

  _drawLurkerHusk(ctx, e, frame, variant = 'small') {
    const { x, y, w, h } = e;
    const cx = x + w / 2;
    const cy = y + h * 0.45;
    const phase = frame * 0.05 + e.x * 0.008;
    const isBoss = variant === 'boss';
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    const scale = isBoss ? 1.3 : 1;

    ctx.save();
    if (hurtFlash) ctx.globalAlpha = 0.4;

    // Dark blood-red tentacles (behind body)
    ctx.lineCap = 'round';
    const numTentacles = isBoss ? 10 : 6;
    for (let i = 0; i < numTentacles; i++) {
      const baseAngle = (i / numTentacles) * Math.PI * 2 + phase * 0.3;
      const tentLen = (w * 0.6 + i * 5) * scale;
      const wobble = Math.sin(phase + i * 1.2) * 18;
      const ex = cx + Math.cos(baseAngle) * tentLen + wobble;
      const ey = cy + Math.sin(baseAngle) * tentLen * 0.7;

      const grad = ctx.createLinearGradient(cx, cy, ex, ey);
      grad.addColorStop(0, '#8b0000');
      grad.addColorStop(0.6, '#660000');
      grad.addColorStop(1, '#3a0000');

      ctx.strokeStyle = grad;
      ctx.lineWidth = isBoss ? 7 - i * 0.3 : 5 - i * 0.3;
      ctx.shadowColor = '#cc0000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(baseAngle) * w * 0.3, cy + Math.sin(baseAngle) * h * 0.25);
      ctx.bezierCurveTo(
        cx + Math.cos(baseAngle) * tentLen * 0.4 + wobble * 0.3, cy + Math.sin(baseAngle) * tentLen * 0.3,
        cx + Math.cos(baseAngle) * tentLen * 0.7 + wobble * 0.7, cy + Math.sin(baseAngle) * tentLen * 0.55,
        ex, ey
      );
      ctx.stroke();
    }

    // Main body (white-grey blob)
    ctx.shadowColor = '#cc0000';
    ctx.shadowBlur = 20;
    const bodyGrad = ctx.createRadialGradient(cx, cy - h * 0.1, 0, cx, cy, w * 0.5 * scale);
    bodyGrad.addColorStop(0, '#e0e8ee');
    bodyGrad.addColorStop(0.6, '#c0ccd8');
    bodyGrad.addColorStop(1, '#8090a0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.08, w * 0.42 * scale, h * 0.38 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Multiple red eyes on top
    const eyeCount = isBoss ? 7 : 4;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    for (let i = 0; i < eyeCount; i++) {
      const eyeX = cx + (i - (eyeCount - 1) / 2) * (w * 0.18 * scale);
      const eyeY = cy - h * 0.28 * scale + Math.sin(phase + i * 0.8) * 3;
      const eyeR = (isBoss ? 8 : 5.5) * scale;

      // Eyeball
      ctx.fillStyle = '#cc0000';
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, eyeR, eyeR * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      // Pupil
      ctx.fillStyle = '#330000';
      ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();
      // Shine
      ctx.fillStyle = '#ff6666';
      ctx.beginPath(); ctx.arc(eyeX - eyeR * 0.25, eyeY - eyeR * 0.2, eyeR * 0.22, 0, Math.PI * 2); ctx.fill();
    }

    // Huge mouth
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#0a0000';
    ctx.beginPath();
    const mouthY = cy + h * 0.05 * scale;
    ctx.ellipse(cx, mouthY, w * 0.34 * scale, h * 0.22 * scale, 0, 0, Math.PI);
    ctx.fill();

    // Teeth (upper row)
    const toothCount = isBoss ? 10 : 7;
    const mouthW = w * 0.34 * scale;
    for (let i = 0; i < toothCount; i++) {
      const tx = cx - mouthW + (i * 2 * mouthW / (toothCount - 1));
      const ty = mouthY - h * 0.02;
      const toothH = (8 + Math.sin(i * 2.1) * 3) * scale;
      ctx.fillStyle = '#f0f0e0';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(tx - 3 * scale, ty);
      ctx.lineTo(tx, ty + toothH);
      ctx.lineTo(tx + 3 * scale, ty);
      ctx.closePath();
      ctx.fill();
    }

    // Blue-grey claw feet
    const numLegs = isBoss ? 6 : 4;
    ctx.shadowBlur = 4;
    for (let i = 0; i < numLegs; i++) {
      const legX = cx + (i - (numLegs - 1) / 2) * (w * 0.22 * scale);
      const legTopY = cy + h * 0.28 * scale;
      const legBotY = y + h * 0.95;
      const sway = Math.sin(phase + i * 0.9) * 5;

      ctx.strokeStyle = '#5a7888';
      ctx.lineWidth = isBoss ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(legX, legTopY);
      ctx.quadraticCurveTo(legX + sway, (legTopY + legBotY) / 2, legX + sway, legBotY);
      ctx.stroke();

      // Claw
      ctx.lineWidth = 2;
      [-8, 0, 8].forEach(offset => {
        ctx.beginPath();
        ctx.moveTo(legX + sway, legBotY);
        ctx.lineTo(legX + sway + offset, legBotY + 10 + Math.abs(offset) * 0.3);
        ctx.stroke();
      });
    }

    // Boss phase 2 effects
    if (isBoss && e.phase === 2) {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.1) * 0.1;
      ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 50;
      ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  _drawVoidHusk(ctx, e, frame) {
    // Small fast creature - floating skull-like form
    const { x, y, w, h } = e;
    const cx = x + w / 2, cy = y + h / 2;
    const pulse = 0.85 + 0.15 * Math.sin(frame * 0.2 + x * 0.01);
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (hurtFlash) ctx.globalAlpha = 0.4;
    ctx.shadowColor = '#8b0000'; ctx.shadowBlur = 18;

    // Body
    const bGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 * pulse);
    bGrad.addColorStop(0, '#5a1a2a');
    bGrad.addColorStop(0.5, '#3a0a12');
    bGrad.addColorStop(1, '#1a0005');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14 * pulse, 12 * pulse, frame * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Mini tentacles
    ctx.strokeStyle = '#660011'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + frame * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 10);
      ctx.lineTo(cx + Math.cos(a + 0.5) * 20, cy + Math.sin(a + 0.5) * 16);
      ctx.stroke();
    }

    // Red eyes (2)
    ctx.fillStyle = '#ff0000'; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.arc(cx - 4, cy - 1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy - 1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#330000';
    ctx.beginPath(); ctx.arc(cx - 4, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();

    // Small mouth
    ctx.strokeStyle = '#aa0000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy + 4, 4, 0.1, Math.PI - 0.1); ctx.stroke();

    ctx.restore();
  }

  _drawEyeHusk(ctx, e, frame) {
    // Floating eye + tentacle form (Dimension Watcher redesign)
    const { x, y, w, h } = e;
    const cx = x + w / 2;
    const cy = y + h / 2 + Math.sin((e.floatOffset || frame * 0.04)) * 6;
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (hurtFlash) ctx.globalAlpha = 0.4;

    // Floating flesh-white body
    ctx.shadowColor = '#cc0000'; ctx.shadowBlur = 20;
    const bGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    bGrad.addColorStop(0, '#d8c8c0');
    bGrad.addColorStop(0.7, '#a09090');
    bGrad.addColorStop(1, '#604040');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tentacle extensions
    ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + (e.floatOffset || frame * 0.04) * 0.5;
      const len = 28 + Math.sin(frame * 0.06 + i * 1.3) * 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 16);
      ctx.quadraticCurveTo(
        cx + Math.cos(a + 0.4) * len * 0.6, cy + Math.sin(a + 0.4) * len * 0.5,
        cx + Math.cos(a + 0.7) * len, cy + Math.sin(a + 0.7) * len * 0.8
      );
      ctx.stroke();
    }

    // Central huge eye
    ctx.fillStyle = '#f0e0d0';
    ctx.beginPath(); ctx.ellipse(cx, cy, 14, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath(); ctx.ellipse(cx, cy, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0000';
    ctx.beginPath(); ctx.ellipse(cx, cy, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9999';
    ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  _drawLurkerCultist(ctx, e, frame) {
    // Plague doctor - keeping this unique design
    const { x, y, w, h } = e;
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (!e.facingRight) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    if (hurtFlash) ctx.globalAlpha = 0.4;

    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 15;

    // Long dark robes
    ctx.fillStyle = '#14060a';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h);
    ctx.lineTo(x - 2, y + h * 0.55);
    ctx.quadraticCurveTo(x + w * 0.15, y + h * 0.22, x + w * 0.35, y + h * 0.2);
    ctx.lineTo(x + w * 0.65, y + h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.22, x + w + 2, y + h * 0.55);
    ctx.lineTo(x + w - 4, y + h);
    ctx.closePath();
    ctx.fill();

    // Robe edges
    ctx.strokeStyle = '#3a1020';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head (grey, plague doctor)
    ctx.fillStyle = '#c0b8b0';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.18, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Long beak mask
    ctx.fillStyle = '#2a1408';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 4, y + h * 0.15);
    ctx.quadraticCurveTo(x + w / 2 + 6, y + h * 0.18, x + w / 2 + 24, y + h * 0.21);
    ctx.lineTo(x + w / 2 + 24, y + h * 0.26);
    ctx.quadraticCurveTo(x + w / 2 + 6, y + h * 0.23, x + w / 2 - 4, y + h * 0.23);
    ctx.closePath();
    ctx.fill();

    // Glowing goggles
    ctx.fillStyle = '#cc5500';
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x + w / 2 - 6, y + h * 0.14, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w / 2 + 4, y + h * 0.14, 5, 0, Math.PI * 2); ctx.fill();
    // Goggle bridge
    ctx.strokeStyle = '#5a3000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + w / 2 - 1, y + h * 0.14); ctx.lineTo(x + w / 2 - 1, y + h * 0.14); ctx.stroke();

    // Tall hat
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f0808';
    ctx.fillRect(x + w / 2 - 13, y + h * 0.04, 26, 5); // brim
    ctx.fillRect(x + w / 2 - 8, y + h * 0.04 - 18, 16, 18); // crown

    // Hat stripe
    ctx.fillStyle = '#cc5500';
    ctx.fillRect(x + w / 2 - 8, y + h * 0.04 - 4, 16, 2);

    ctx.restore();
  }

  _drawEnemyHpBar(ctx, e) {
    if (e.hp >= e.maxHp) return;
    const bw = e.type === 'boss' ? e.w + 20 : e.w + 8;
    const bh = e.type === 'boss' ? 10 : 5;
    const bx = e.x - (bw - e.w) / 2;
    const by = e.y - 14;
    const pct = Math.max(0, e.hp / e.maxHp);
    const barColor = e.type === 'boss'
      ? (pct < 0.5 ? '#ff3366' : '#a855f7')
      : '#cc2244';

    ctx.fillStyle = '#0a0008';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(bx, by, bw * pct, bh);
    if (e.type === 'boss') {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff336655';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }
    ctx.shadowBlur = 0;
  }

  _drawProjectiles(ctx, projectiles) {
    for (const p of projectiles) {
      if (!p.active) continue;
      ctx.save();
      ctx.shadowColor = p.glow || p.color;
      ctx.shadowBlur = 18;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, p.glow || p.color + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
