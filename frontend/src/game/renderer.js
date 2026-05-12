export class Renderer {
  constructor() {
    this.stars = this._generateStars(200);
    this.debris = this._generateDebris(30);
  }

  _generateStars(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random()
    }));
  }

  _generateDebris(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: Math.random() * 14 + 4,
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      color: Math.random() < 0.5 ? '#1a0a2e' : '#120820'
    }));
  }

  render(ctx, engine) {
    this._drawBackground(ctx, engine.frameCount, engine.floor);
    this._drawPlatforms(ctx, engine.platforms, engine.frameCount);
    this._drawProjectiles(ctx, engine.projectiles, engine.frameCount);
    engine.particles.render(ctx);
    this._drawEnemies(ctx, engine.enemies, engine.frameCount);
    this._drawPlayer(ctx, engine.player, engine.frameCount);
  }

  _drawBackground(ctx, frame, floor) {
    const theme = Math.floor((floor - 1) / 5) % 4;
    const bgColors = [
      ['#0a0a0f', '#1a0a2e'],
      ['#0a0f1a', '#0a1a2e'],
      ['#1a0a0a', '#2e0a0a'],
      ['#0a0a1a', '#1a0a3e']
    ];
    const [c1, c2] = bgColors[theme];

    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Stars
    for (const s of this.stars) {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.02 + s.brightness * 10));
      ctx.save();
      ctx.globalAlpha = twinkle * 0.8;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating debris
    for (const d of this.debris) {
      d.x = (d.x + d.vx + 1280) % 1280;
      d.y = (d.y + d.vy + 720) % 720;
      d.rot += 0.004;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = d.color;
      ctx.strokeStyle = '#7c3aed33';
      ctx.lineWidth = 1;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.strokeRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }

    // Dimensional rift lines
    if (frame % 120 < 60) {
      const riftAlpha = Math.sin((frame % 60) / 60 * Math.PI) * 0.12;
      ctx.save();
      ctx.globalAlpha = riftAlpha;
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 8;
      const riftX = ((frame * 3) % 1200) + 50;
      ctx.beginPath();
      ctx.moveTo(riftX, 0);
      ctx.lineTo(riftX + 20, 720);
      ctx.stroke();
      ctx.restore();
    }

    // Ground mist
    const mistGrad = ctx.createLinearGradient(0, 600, 0, 720);
    mistGrad.addColorStop(0, 'rgba(124,58,237,0)');
    mistGrad.addColorStop(1, 'rgba(124,58,237,0.18)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 600, 1280, 120);
  }

  _drawPlatforms(ctx, platforms, frame) {
    const themeColors = [
      { main: '#1a0a2e', edge: '#7c3aed', glow: '#a855f7' },
      { main: '#0a1a2e', edge: '#0ea5e9', glow: '#00ffcc' },
      { main: '#2e0a0a', edge: '#dc2626', glow: '#ff3366' },
      { main: '#0a0a2e', edge: '#6d28d9', glow: '#8b5cf6' }
    ];

    for (const p of platforms) {
      const tc = themeColors[p.theme % 4] || themeColors[0];
      const isGround = p.h > 30;

      ctx.save();
      ctx.shadowColor = tc.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = tc.main;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Top edge highlight
      ctx.fillStyle = tc.edge;
      ctx.fillRect(p.x, p.y, p.w, 3);

      if (!isGround) {
        // Glow underside
        const underglow = ctx.createLinearGradient(0, p.y + p.h, 0, p.y + p.h + 20);
        underglow.addColorStop(0, tc.glow + '44');
        underglow.addColorStop(1, 'transparent');
        ctx.shadowBlur = 0;
        ctx.fillStyle = underglow;
        ctx.fillRect(p.x, p.y + p.h, p.w, 20);

        // Crystal details
        ctx.fillStyle = tc.edge + '88';
        for (let i = 20; i < p.w - 20; i += 35) {
          ctx.fillRect(p.x + i, p.y - 3, 3, 4);
        }
      }
      ctx.restore();
    }
  }

  _drawPlayer(ctx, player, frame) {
    if (player.state === 'dead' && player.deathTimer < 80) {
      const alpha = player.deathTimer / 80;
      ctx.save(); ctx.globalAlpha = alpha;
    }

    const { x, y, w, h, facingRight, state, attackTimer, attackType, hurtTimer, isDashing, combo } = player;

    ctx.save();
    if (!facingRight) {
      ctx.translate(x + w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    // Hurt flash
    if (hurtTimer > 0 && Math.floor(frame / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Dash trail
    if (isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(x - 8 * player.dashDir, y + 8, w, h - 16);
      ctx.restore();
    }

    const lean = (state === 'running') ? 0.12 : 0;
    const runBob = (state === 'running') ? Math.sin(frame * 0.25) * 2 : 0;
    const py = y + runBob;

    // Scythe (drawn first, appears behind body during idle)
    if (state !== 'attacking_light' && state !== 'attacking_heavy' && state !== 'attacking_special') {
      this._drawScythe(ctx, x, py, w, h, state, frame, false);
    }

    // Legs
    const legAnim = (state === 'running') ? Math.sin(frame * 0.28) * 8 : 0;
    ctx.fillStyle = '#8b9aaa';
    // Left leg
    ctx.save();
    ctx.translate(x + 8, py + h * 0.72);
    ctx.rotate(legAnim * 0.06);
    ctx.fillRect(0, 0, 11, 22);
    ctx.restore();
    // Right leg
    ctx.save();
    ctx.translate(x + w - 19, py + h * 0.72);
    ctx.rotate(-legAnim * 0.06);
    ctx.fillRect(0, 0, 11, 22);
    ctx.restore();

    // Shoes
    ctx.fillStyle = '#1a1225';
    ctx.fillRect(x + 4, py + h * 0.9, 14, 8);
    ctx.fillRect(x + w - 18, py + h * 0.9, 14, 8);
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 4, py + h * 0.9 + 6, 6, 2);
    ctx.fillRect(x + w - 18, py + h * 0.9 + 6, 6, 2);

    // Dress (flared trapezoid)
    ctx.fillStyle = '#0e0e18';
    ctx.beginPath();
    ctx.moveTo(x + 4, py + h * 0.32);
    ctx.lineTo(x + w - 4, py + h * 0.32);
    ctx.lineTo(x + w + 4, py + h * 0.72);
    ctx.lineTo(x - 4, py + h * 0.72);
    ctx.closePath();
    ctx.fill();

    // Frills at dress hem
    ctx.fillStyle = '#e8e8f0';
    for (let fi = -4; fi < w + 4; fi += 8) {
      ctx.beginPath();
      ctx.arc(x + fi + 4, py + h * 0.72, 5, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Belt
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 6, py + h * 0.45, w - 12, 5);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(x + w / 2 - 4, py + h * 0.44, 8, 7);
    // Belt pouch
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(x + w / 2 + 6, py + h * 0.46, 7, 8);

    // Torso
    ctx.fillStyle = '#0e0e18';
    ctx.fillRect(x + 6, py + h * 0.25, w - 12, h * 0.2);

    // Short puffy sleeves
    ctx.fillStyle = '#1a1a28';
    ctx.beginPath();
    ctx.ellipse(x + 5, py + h * 0.28, 7, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 5, py + h * 0.28, 7, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Gloves/arms
    const armSwing = (state === 'running') ? -legAnim * 0.5 : 0;
    ctx.fillStyle = '#111120';
    // Left arm
    ctx.save();
    ctx.translate(x + 3, py + h * 0.33);
    ctx.rotate(armSwing * 0.04);
    ctx.fillRect(0, 0, 8, 16);
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(x + w - 11, py + h * 0.33);
    ctx.rotate(-armSwing * 0.04);
    ctx.fillRect(0, 0, 8, 16);
    ctx.restore();

    // Collar frills (white)
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(x + 8, py + h * 0.22, w - 16, 6);
    for (let ci = 0; ci < 5; ci++) {
      ctx.beginPath();
      ctx.arc(x + 9 + ci * 6, py + h * 0.22, 3.5, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = '#f0c8b0';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, py + h * 0.14, 13, 15, lean, 0, Math.PI * 2);
    ctx.fill();

    // Purple hair
    ctx.fillStyle = '#9333ea';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, py + h * 0.07, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Side hair left
    ctx.fillRect(x + 2, py + h * 0.07, 7, 17);
    // Side hair right
    ctx.fillRect(x + w - 9, py + h * 0.07, 7, 15);
    // Hair highlights
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(x + 4, py + h * 0.08, 3, 11);
    ctx.fillRect(x + w - 7, py + h * 0.08, 3, 10);

    // Hat
    ctx.fillStyle = '#12121e';
    // Brim
    ctx.beginPath();
    ctx.ellipse(x + w / 2, py - 2, 17, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown
    ctx.fillRect(x + w / 2 - 10, py - 18, 20, 17);
    // White hatband
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(x + w / 2 - 10, py - 3, 20, 2);
    // Hat shine
    ctx.fillStyle = '#1e1e34';
    ctx.fillRect(x + w / 2 - 7, py - 16, 4, 10);

    // Eyes
    const blinkFrame = frame % 180;
    const isBlinking = blinkFrame > 170 && blinkFrame < 178;
    if (!isBlinking) {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x + w / 2 - 9, py + h * 0.16, 6, 4);
      ctx.fillRect(x + w / 2 + 3, py + h * 0.16, 6, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w / 2 - 7, py + h * 0.16, 2, 2);
      ctx.fillRect(x + w / 2 + 5, py + h * 0.16, 2, 2);
    } else {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x + w / 2 - 9, py + h * 0.17, 6, 2);
      ctx.fillRect(x + w / 2 + 3, py + h * 0.17, 6, 2);
    }
    // Brows (angry)
    ctx.fillStyle = '#111111';
    ctx.save();
    ctx.translate(x + w / 2 - 9, py + h * 0.145);
    ctx.rotate(-0.15); ctx.fillRect(0, 0, 6, 2);
    ctx.restore();
    ctx.save();
    ctx.translate(x + w / 2 + 3, py + h * 0.145);
    ctx.rotate(0.15); ctx.fillRect(0, 0, 6, 2);
    ctx.restore();

    // Gem on collar
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, py + h * 0.23 - 3);
    ctx.lineTo(x + w / 2 + 4, py + h * 0.23 + 1);
    ctx.lineTo(x + w / 2, py + h * 0.23 + 5);
    ctx.lineTo(x + w / 2 - 4, py + h * 0.23 + 1);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Special aura effect
    if (state === 'attacking_special') {
      const auraAlpha = (attackTimer / 42) * 0.4;
      ctx.save();
      ctx.globalAlpha = auraAlpha;
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 40;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      const r = 100 - (42 - attackTimer) * 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, py + h / 2, Math.max(10, r), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Scythe (drawn on top during attack)
    if (['attacking_light', 'attacking_heavy', 'attacking_special'].includes(state)) {
      this._drawScythe(ctx, x, py, w, h, state, frame, true);
    }

    ctx.restore();
    if (player.state === 'dead' && player.deathTimer < 80) ctx.restore();
  }

  _drawScythe(ctx, x, y, w, h, state, frame, isAttacking) {
    ctx.save();
    ctx.shadowBlur = 18;

    const handX = x + w - 6;
    const handY = y + h * 0.35;

    if (state === 'attacking_light') {
      const progress = 1 - frame % 18 / 18;
      const angle = -0.8 + progress * 2.2;
      ctx.translate(handX, handY);
      ctx.rotate(angle);
      this._scytheShape(ctx, 0, 0);
    } else if (state === 'attacking_heavy') {
      const spin = (frame * 0.4) % (Math.PI * 2);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(spin);
      this._scytheShape(ctx, 10, 0);
      // Heavy attack trail
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.rotate(-0.7);
      this._scytheShape(ctx, 10, 0);
      ctx.restore();
    } else if (state === 'attacking_special') {
      ctx.translate(handX, handY);
      ctx.rotate(-0.5);
      this._scytheShape(ctx, 0, 0);
    } else {
      // Idle/running: scythe at side
      ctx.translate(handX - 8, handY - 10);
      ctx.rotate(-0.15);
      this._scytheShape(ctx, 0, 0);
    }

    ctx.restore();
  }

  _scytheShape(ctx, ox, oy) {
    // Staff
    ctx.shadowColor = '#7c3aed';
    ctx.strokeStyle = '#1e1e30';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + 18, oy - 85);
    ctx.stroke();

    // Blade
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox + 18, oy - 85);
    ctx.bezierCurveTo(ox + 55, oy - 95, ox + 70, oy - 60, ox + 40, oy - 45);
    ctx.stroke();

    // Blade inner edge
    ctx.shadowColor = '#00ffcc';
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox + 22, oy - 83);
    ctx.bezierCurveTo(ox + 54, oy - 90, ox + 64, oy - 58, ox + 44, oy - 48);
    ctx.stroke();

    // Bottom spike
    ctx.shadowColor = '#7c3aed';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox - 3, oy + 10);
    ctx.stroke();
  }

  _drawEnemies(ctx, enemies, frame) {
    for (const e of enemies) {
      if (e.dead) continue;
      switch (e.type) {
        case 'shadow_demon': this._drawShadowDemon(ctx, e, frame); break;
        case 'void_sprite': this._drawVoidSprite(ctx, e, frame); break;
        case 'dimension_watcher': this._drawDimensionWatcher(ctx, e, frame); break;
        case 'lurker_cultist': this._drawLurkerCultist(ctx, e, frame); break;
        case 'boss': this._drawBoss(ctx, e, frame); break;
        default: this._drawShadowDemon(ctx, e, frame);
      }
      this._drawEnemyHpBar(ctx, e);
    }
  }

  _drawShadowDemon(ctx, e, frame) {
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (!e.facingRight) { ctx.translate(e.x + e.w, 0); ctx.scale(-1, 1); ctx.translate(-e.x, 0); }
    if (hurtFlash) ctx.globalAlpha = 0.5;

    // Aura
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 20;

    // Body (jagged shadow form)
    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.moveTo(e.x + 5, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h * 0.7);
    ctx.lineTo(e.x + 3, e.y + e.h * 0.5);
    ctx.lineTo(e.x + e.w * 0.15, e.y + e.h * 0.3);
    ctx.lineTo(e.x + e.w * 0.5, e.y + 5);
    ctx.lineTo(e.x + e.w * 0.85, e.y + e.h * 0.3);
    ctx.lineTo(e.x + e.w - 3, e.y + e.h * 0.5);
    ctx.lineTo(e.x + e.w, e.y + e.h * 0.7);
    ctx.lineTo(e.x + e.w - 5, e.y + e.h);
    ctx.closePath();
    ctx.fill();

    // Claws
    ctx.fillStyle = '#2d1a4e';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.h * 0.5);
    ctx.lineTo(e.x - 8, e.y + e.h * 0.6);
    ctx.lineTo(e.x - 3, e.y + e.h * 0.45);
    ctx.lineTo(e.x - 9, e.y + e.h * 0.5);
    ctx.lineTo(e.x, e.y + e.h * 0.4);
    ctx.fill();

    // Eyes (glowing red)
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 12;
    ctx.fillRect(e.x + 8, e.y + e.h * 0.3, 8, 5);
    ctx.fillRect(e.x + e.w - 16, e.y + e.h * 0.3, 8, 5);

    ctx.restore();
  }

  _drawVoidSprite(ctx, e, frame) {
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.18 + e.x * 0.01);
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (hurtFlash) ctx.globalAlpha = 0.5;

    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    // Spiky body
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = (i % 2 === 0 ? 14 : 8) * pulse;
      const px = cx + Math.cos(a + frame * 0.06) * r;
      const py = cy + Math.sin(a + frame * 0.06) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.fillStyle = '#c084fc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawDimensionWatcher(ctx, e, frame) {
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (hurtFlash) ctx.globalAlpha = 0.5;

    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const float = Math.sin(e.floatOffset || frame * 0.04) * 5;

    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 25;

    // Outer ring
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + float, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Body (large eye)
    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + float, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(cx, cy + float, 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + float, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye light
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 3, cy + float - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tendrils
    ctx.strokeStyle = '#7c3aed44';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const a = (frame * 0.03 + i * 1.25);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 18, cy + float + Math.sin(a) * 18);
      ctx.lineTo(cx + Math.cos(a + 0.8) * 32, cy + float + Math.sin(a + 0.8) * 32);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawLurkerCultist(ctx, e, frame) {
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 3) % 2;
    ctx.save();
    if (!e.facingRight) { ctx.translate(e.x + e.w, 0); ctx.scale(-1, 1); ctx.translate(-e.x, 0); }
    if (hurtFlash) ctx.globalAlpha = 0.5;

    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;

    // Robe
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.moveTo(e.x + 2, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h * 0.5);
    ctx.lineTo(e.x + e.w * 0.3, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w * 0.7, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w, e.y + e.h * 0.5);
    ctx.lineTo(e.x + e.w - 2, e.y + e.h);
    ctx.closePath();
    ctx.fill();

    // Plague-doctor beak mask
    ctx.fillStyle = '#2a1408';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h * 0.18, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2 + 8, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w / 2 + 22, e.y + e.h * 0.22);
    ctx.lineTo(e.x + e.w / 2 + 8, e.y + e.h * 0.26);
    ctx.fill();

    // Goggles (orange glow)
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 - 4, e.y + e.h * 0.16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 + 5, e.y + e.h * 0.16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f0808';
    ctx.fillRect(e.x + e.w / 2 - 12, e.y + e.h * 0.05, 24, 5);
    ctx.fillRect(e.x + e.w / 2 - 8, e.y + e.h * 0.05 - 14, 16, 14);

    ctx.restore();
  }

  _drawBoss(ctx, e, frame) {
    const hurtFlash = e.hurtTimer > 0 && Math.floor(frame / 2) % 2;
    ctx.save();
    if (!e.facingRight) { ctx.translate(e.x + e.w, 0); ctx.scale(-1, 1); ctx.translate(-e.x, 0); }
    if (hurtFlash) ctx.globalAlpha = 0.4;

    const phase2 = e.phase === 2;
    const glowColor = phase2 ? '#ff3366' : '#a855f7';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;

    // Main body
    ctx.fillStyle = phase2 ? '#2e0808' : '#1a0a2e';
    ctx.beginPath();
    ctx.moveTo(e.x + 5, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h * 0.6);
    ctx.lineTo(e.x + 8, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w / 2, e.y);
    ctx.lineTo(e.x + e.w - 8, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w, e.y + e.h * 0.6);
    ctx.lineTo(e.x + e.w - 5, e.y + e.h);
    ctx.closePath();
    ctx.fill();

    // Plague coat
    ctx.fillStyle = phase2 ? '#3a1010' : '#1a1040';
    ctx.fillRect(e.x + 10, e.y + e.h * 0.15, e.w - 20, e.h * 0.6);

    // Head
    ctx.fillStyle = '#100808';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h * 0.15, 24, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Long beak
    ctx.fillStyle = '#1e0c0c';
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2 + 16, e.y + e.h * 0.12);
    ctx.lineTo(e.x + e.w / 2 + 44, e.y + e.h * 0.16);
    ctx.lineTo(e.x + e.w / 2 + 16, e.y + e.h * 0.22);
    ctx.closePath();
    ctx.fill();

    // Eyes (glowing)
    ctx.fillStyle = phase2 ? '#ff0033' : '#ff6600';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 - 7, e.y + e.h * 0.12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2 + 7, e.y + e.h * 0.12, 7, 0, Math.PI * 2);
    ctx.fill();

    // Arms with scythe fingers
    ctx.shadowBlur = 8;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(e.x + 10, e.y + e.h * 0.35);
    ctx.lineTo(e.x - 15, e.y + e.h * 0.55);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 10, e.y + e.h * 0.35);
    ctx.lineTo(e.x + e.w + 15, e.y + e.h * 0.55);
    ctx.stroke();

    // Phase 2 extra aura
    if (phase2) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(frame * 0.1);
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 40;
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 60 + Math.sin(frame * 0.06) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  _drawEnemyHpBar(ctx, e) {
    if (e.hp >= e.maxHp) return;
    const bw = e.w + 10;
    const bh = e.type === 'boss' ? 8 : 5;
    const bx = e.x - 5;
    const by = e.y - 12;
    const pct = Math.max(0, e.hp / e.maxHp);

    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(bx, by, bw, bh);

    const barColor = e.type === 'boss' ? '#ff3366' : '#a855f7';
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(bx, by, bw * pct, bh);
    ctx.shadowBlur = 0;
  }

  _drawProjectiles(ctx, projectiles, frame) {
    for (const p of projectiles) {
      if (!p.active) continue;
      ctx.save();
      ctx.shadowColor = p.glow || p.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
