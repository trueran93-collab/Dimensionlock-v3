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

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
  }

  burst(x, y, type, countOverride) {
    const presets = {
      slash: { color: '#00ffcc', count: 8, spread: 7, upForce: 2, life: 22, size: 5, gravity: 0.15, shrink: 0.25 },
      heavy_slash: { color: '#a855f7', count: 16, spread: 12, upForce: 3, life: 28, size: 9, gravity: 0.12, shrink: 0.2 },
      dark_aura: { color: '#7c3aed', count: 28, spread: 18, upForce: 0.5, life: 40, size: 11, gravity: 0, shrink: 0.2 },
      dark_aura2: { color: '#c084fc', count: 14, spread: 14, upForce: 0, life: 35, size: 7, gravity: 0, shrink: 0.15 },
      sparks: { color: '#fbbf24', count: 12, spread: 14, upForce: 5, life: 16, size: 4, gravity: 0.4, shrink: 0.4 },
      doublejump: { color: '#00ffcc', count: 10, spread: 10, upForce: 0, life: 18, size: 6, gravity: -0.05, shrink: 0.35 },
      player_hurt: { color: '#ff3366', count: 10, spread: 8, upForce: 4, life: 22, size: 6, gravity: 0.2, shrink: 0.3 },
      death: { color: '#a855f7', count: 22, spread: 18, upForce: 5, life: 45, size: 13, gravity: 0.08, shrink: 0.2 },
      death2: { color: '#ff3366', count: 12, spread: 14, upForce: 3, life: 35, size: 8, gravity: 0.1, shrink: 0.25 },
      void_hit: { color: '#ff3366', count: 7, spread: 7, upForce: 2, life: 18, size: 5, gravity: 0.15, shrink: 0.4 },
      smoke: { color: 'rgba(130,90,180,0.5)', count: 8, spread: 6, upForce: 1.5, life: 55, size: 18, gravity: -0.04, shrink: 0.08 },
      boss_hit: { color: '#ff6600', count: 18, spread: 14, upForce: 4, life: 30, size: 10, gravity: 0.2, shrink: 0.25 },
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

  addDamageNumber(x, y, damage, type) {
    this.damageNumbers.push({ x, y, vy: -2.5, damage, type, life: 55, maxLife: 55 });
  }

  update() {
    this.particles = this.particles.filter(p => { p.update(); return !p.dead; });
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y += d.vy;
      d.vy *= 0.96;
      d.life--;
      return d.life > 0;
    });
  }

  render(ctx) {
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

    for (const d of this.damageNumbers) {
      ctx.save();
      const alpha = Math.max(0, d.life / d.maxLife);
      ctx.globalAlpha = alpha;
      const isSpecial = d.type === 'special';
      const isHeavy = d.type === 'heavy';
      const fsize = isSpecial ? 26 : isHeavy ? 20 : 16;
      ctx.font = `bold ${fsize}px 'JetBrains Mono', monospace`;
      const col = isSpecial ? '#a855f7' : isHeavy ? '#fbbf24' : '#00ffcc';
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.fillText(d.damage, d.x - 12, d.y);
      ctx.restore();
    }
  }
}
