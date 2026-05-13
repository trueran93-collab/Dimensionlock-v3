class Particle {
  constructor(x, y, vx, vy, life, size, color, gravity = 0, shrink = 0.1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.gravity = gravity;
    this.shrink = shrink;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.94;
    this.life--;
    this.size = Math.max(0, this.size - this.shrink);
  }

  get dead() {
    return this.life <= 0 || this.size <= 0;
  }

  get alpha() {
    return this.life / this.maxLife;
  }
}

// Shard particle: tiny rotating rectangle (for death-shatter VFX)
class Shard {
  constructor(x, y, vx, vy, life, size, color, rot = 0, rotSpeed = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.size = size; this.color = color;
    this.rot = rot; this.rotSpeed = rotSpeed;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.32;
    this.vx *= 0.96;
    this.rot += this.rotSpeed;
    this.life--;
  }
  get dead() { return this.life <= 0; }
  get alpha() { return Math.max(0, this.life / this.maxLife); }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shards = [];
    this.damageNumbers = [];
    this.toasts = []; // floor-clear / achievement banners (rendered by HUD layer separately if needed)
  }

  burst(x, y, type, countOverride) {
    const presets = {
      slash:        { color: '#00ffcc', count: 8, spread: 7, upForce: 2, life: 22, size: 5, gravity: 0.15, shrink: 0.25 },
      heavy_slash:  { color: '#a855f7', count: 16, spread: 12, upForce: 3, life: 28, size: 9, gravity: 0.12, shrink: 0.2 },
      dark_aura:    { color: '#7c3aed', count: 28, spread: 18, upForce: 0.5, life: 40, size: 11, gravity: 0, shrink: 0.2 },
      dark_aura2:   { color: '#c084fc', count: 14, spread: 14, upForce: 0, life: 35, size: 7, gravity: 0, shrink: 0.15 },
      sparks:       { color: '#fbbf24', count: 12, spread: 14, upForce: 5, life: 16, size: 4, gravity: 0.4, shrink: 0.4 },
      doublejump:   { color: '#00ffcc', count: 10, spread: 10, upForce: 0, life: 18, size: 6, gravity: -0.05, shrink: 0.35 },
      player_hurt:  { color: '#ff3366', count: 10, spread: 8, upForce: 4, life: 22, size: 6, gravity: 0.2, shrink: 0.3 },
      death:        { color: '#a855f7', count: 22, spread: 18, upForce: 5, life: 45, size: 13, gravity: 0.08, shrink: 0.2 },
      death2:       { color: '#ff3366', count: 12, spread: 14, upForce: 3, life: 35, size: 8, gravity: 0.1, shrink: 0.25 },
      void_hit:     { color: '#ff3366', count: 7, spread: 7, upForce: 2, life: 18, size: 5, gravity: 0.15, shrink: 0.4 },
      smoke:        { color: 'rgba(130,90,180,0.5)', count: 8, spread: 6, upForce: 1.5, life: 55, size: 18, gravity: -0.04, shrink: 0.08 },
      boss_hit:     { color: '#ff6600', count: 18, spread: 14, upForce: 4, life: 30, size: 10, gravity: 0.2, shrink: 0.25 },
      run_trail:    { color: 'rgba(168,85,247,0.6)', count: 3, spread: 2, upForce: -0.2, life: 22, size: 7, gravity: 0.05, shrink: 0.25 },
      ultimate_explosion: { color: '#c084fc', count: 50, spread: 22, upForce: 2, life: 55, size: 14, gravity: 0, shrink: 0.18 },
      ultimate_spin:      { color: '#fbbf24', count: 6, spread: 16, upForce: 0, life: 30, size: 6, gravity: 0, shrink: 0.2 },
      soul_pickup:        { color: '#a855f7', count: 14, spread: 10, upForce: 1, life: 30, size: 6, gravity: -0.06, shrink: 0.2 },
      gold_pickup:        { color: '#fbbf24', count: 22, spread: 12, upForce: 2, life: 35, size: 8, gravity: -0.04, shrink: 0.18 },
      rage_pickup:        { color: '#ff3366', count: 20, spread: 14, upForce: 2, life: 40, size: 9, gravity: -0.03, shrink: 0.18 },
      crit:               { color: '#fbbf24', count: 18, spread: 18, upForce: 3, life: 26, size: 6, gravity: 0.18, shrink: 0.22 },
    };

    const p = presets[type] || presets.sparks;
    const count = countOverride || p.count;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.6 + 0.4) * p.spread;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - p.upForce;
      const jitter = 6;
      this.particles.push(
        new Particle(
          x + (Math.random() - 0.5) * jitter,
          y + (Math.random() - 0.5) * jitter,
          vx, vy,
          p.life + Math.floor(Math.random() * 8),
          p.size * (0.7 + Math.random() * 0.6),
          p.color,
          p.gravity,
          p.shrink
        )
      );
    }
  }

  // Shatter: rectangular shard burst for enemy deaths
  shatter(x, y, color = '#a855f7', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.shards.push(new Shard(
        x + (Math.random() - 0.5) * 14,
        y + (Math.random() - 0.5) * 14,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 4,
        50 + Math.floor(Math.random() * 18),
        4 + Math.random() * 6,
        color,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3,
      ));
    }
  }

  // Damage numbers with crit flag + style override
  addDamageNumber(x, y, damage, type, opts = {}) {
    const isCrit = !!opts.crit;
    const fontBoost = isCrit ? 1.4 : 1;
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 18,
      y, vy: -2.8, vx: (Math.random() - 0.5) * 1.2,
      damage,
      type,
      crit: isCrit,
      life: isCrit ? 70 : 55, maxLife: isCrit ? 70 : 55,
      fontBoost,
      colorOverride: opts.color || null,
    });
  }

  update() {
    this.particles = this.particles.filter(p => { p.update(); return !p.dead; });
    this.shards = this.shards.filter(s => { s.update(); return !s.dead; });
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y += d.vy;
      d.x += d.vx;
      d.vy *= 0.96;
      d.life--;
      return d.life > 0;
    });
  }

  render(ctx) {
    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shards (rotating rectangles)
    for (const s of this.shards) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = s.color;
      ctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2);
      ctx.restore();
    }

    // Damage numbers
    for (const d of this.damageNumbers) {
      ctx.save();
      const alpha = Math.max(0, d.life / d.maxLife);
      ctx.globalAlpha = alpha;
      const isSpecial = d.type === 'special' || d.type === 'ultimate';
      const isHeavy = d.type === 'heavy';
      const baseSize = isSpecial ? 26 : isHeavy ? 22 : 17;
      const fsize = Math.round(baseSize * d.fontBoost);
      ctx.font = `bold ${fsize}px 'JetBrains Mono', monospace`;
      const col = d.colorOverride
        || (d.crit ? '#fbbf24'
          : isSpecial ? '#c084fc'
          : isHeavy ? '#ff9900'
          : '#ffffff');
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = d.crit ? 22 : 12;
      ctx.textAlign = 'center';
      const label = d.crit ? `${d.damage}!` : `${d.damage}`;
      ctx.fillText(label, d.x, d.y);
      if (d.crit) {
        ctx.font = `bold 11px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#fff6cc';
        ctx.shadowBlur = 6;
        ctx.fillText('CRIT', d.x, d.y - fsize * 0.95);
      }
      ctx.restore();
    }
  }
}
