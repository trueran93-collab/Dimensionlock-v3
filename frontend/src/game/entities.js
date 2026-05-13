const GRAVITY = 0.55;
const MAX_FALL = 18;

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 56; this.h = 92;
    this.vx = 0; this.vy = 0;
    this.facingRight = true;

    // Base stats
    this.maxHp = 100; this.hp = 100;
    this.maxSp = 100; this.sp = 100;
    this.speed = 5;
    this.jumpForce = -15;
    this.damage = 22;
    this.attackRange = 1.0;
    this.attackSpeed = 1.0;

    // Upgrade flags
    this.hasVoidHunger = false;
    this.hasComboMastery = false;
    this.hasShadowStep = false;
    this.hasLurkersBane = false;
    this.hasReapersFury = false;

    // Jump
    this.onGround = false;
    this.canDoubleJump = true;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;

    // Dash
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDir = 1;
    this.dashCooldown = 0;
    this.dashIframes = 0;

    // Combat
    this.state = 'idle';
    this.attackTimer = 0;
    this.attackType = null;
    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.hitEnemiesThisSwing = new Set();

    // Combo
    this.combo = 0;
    this.comboTimer = 0;

    // SP
    this.spRegenTimer = 0;

    // Ultimate charge (Soul Reaper's Harvest)
    this.ultimateCharge = 0;
    this.maxUltimateCharge = 100;
    this.ultimateActive = false;
    this.ultimateTimer = 0;
    this.ultimateMaxDuration = 150; // ~2.5s @ 60fps
    this.ultimateHitTicks = 0;

    // Running trail timer
    this.runTrailTimer = 0;
    // Walk-to-run hold timer (frames held, 0=stopped, ≥35=running)
    this.runHoldTimer = 0;

    // Anim
    this.animFrame = 0;
    this.animTimer = 0;
    this.deathTimer = 120;

    // Tracking
    this.kills = 0;
    this.score = 0;
    this.floorsCleared = 0;
    // Spawn invincibility
    this.hurtTimer = 60;
  }

  update(keys, platforms, engine) {
    this.handleInput(keys, engine);

    if (!this.isDashing) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    }

    this.x += this.vx;
    this.y += this.vy;

    const wasOnGround = this.onGround;
    this.onGround = false;
    for (const p of platforms) {
      const prevBottom = this.y + this.h - this.vy;
      if (
        this.x + this.w > p.x && this.x < p.x + p.w &&
        this.y + this.h >= p.y && prevBottom <= p.y + 4 && this.vy >= 0
      ) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (!wasOnGround && this.onGround) { this.canDoubleJump = true; }
    if (wasOnGround && !this.onGround) this.coyoteTime = 7;
    if (this.coyoteTime > 0) this.coyoteTime--;
    if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
      if (this.onGround || this.coyoteTime > 0) this._doJump();
    }

    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > engine.W) { this.x = engine.W - this.w; this.vx = 0; }
    const levelBottom = engine.levelH || engine.H;
    if (this.y > levelBottom + 80) {
      this.takeDamage(20, engine, 'fall');
      this.x = engine.W / 2;
      this.y = Math.max(100, levelBottom - 200 - this.h);
      this.vy = 0;
    }

    this._updateTimers();
    this._updateState();

    this.animTimer++;
    if (this.animTimer >= 7) { this.animTimer = 0; this.animFrame++; }
  }

  handleInput(keys, engine) {
    if (this.state === 'dead') return;
    if (this.hurtTimer > 30) return;

    const canMove = !['attacking_heavy','attacking_special'].includes(this.state) && !this.isDashing;

    if (canMove) {
      if (keys.left) {
        this.runHoldTimer = Math.min(this.runHoldTimer + 1, 70);
        const spd = this.runHoldTimer >= 35 ? this.speed : Math.ceil(this.speed * 0.58);
        this.vx = -spd;
        this.facingRight = false;
      } else if (keys.right) {
        this.runHoldTimer = Math.min(this.runHoldTimer + 1, 70);
        const spd = this.runHoldTimer >= 35 ? this.speed : Math.ceil(this.speed * 0.58);
        this.vx = spd;
        this.facingRight = true;
      } else {
        this.runHoldTimer = 0;
        this.vx *= 0.75;
        if (Math.abs(this.vx) < 0.5) this.vx = 0;
      }
    }

    if (keys.jumpJustPressed) {
      if (this.onGround || this.coyoteTime > 0) this._doJump();
      else if (this.canDoubleJump) {
        this.vy = this.jumpForce * 0.9;
        this.canDoubleJump = false;
        engine.particles.burst(this.x + this.w / 2, this.y + this.h, 'doublejump');
      } else { this.jumpBuffer = 8; }
    }

    if (keys.dashJustPressed && !this.isDashing && this.dashCooldown <= 0) {
      this._startDash();
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'smoke');
    }

    if (keys.lightJustPressed && this.attackCooldown <= 0 && !this.isDashing) this._attack('light', engine);
    if (keys.heavyJustPressed && this.attackCooldown <= 0 && !this.isDashing) this._attack('heavy', engine);
    if (keys.specialJustPressed && this.sp >= 30 && !this.isDashing) this._attack('special', engine);
    if (keys.ultimateJustPressed && this.ultimateCharge >= this.maxUltimateCharge && !this.ultimateActive && !this.isDashing) {
      this._startUltimate(engine);
    }
  }

  _startUltimate(engine) {
    this.ultimateActive = true;
    this.ultimateTimer = this.ultimateMaxDuration;
    this.ultimateCharge = 0;
    this.ultimateHitTicks = 0;
    this.hitEnemiesThisSwing = new Set();
    this.vx = 0;
    this.dashIframes = this.ultimateMaxDuration; // invincible during ult
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'ultimate_explosion');
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura2');
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'sparks');
    if (engine.sound?.playUltimate) engine.sound.playUltimate();
    else if (engine.sound?.playSpecialAttack) engine.sound.playSpecialAttack();
  }

  collectSoulSeed(amount = 10) {
    this.ultimateCharge = Math.min(this.maxUltimateCharge, this.ultimateCharge + amount);
    this.sp = Math.min(this.maxSp, this.sp + 4);
    this.score += 25;
  }

  _doJump() {
    this.vy = this.jumpForce;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }

  _startDash() {
    this.isDashing = true;
    this.dashTimer = 14;
    this.dashIframes = 20;
    this.dashCooldown = this.hasShadowStep ? 32 : 55;
    this.dashDir = this.facingRight ? 1 : -1;
    this.vx = this.dashDir * 17;
    this.vy = 0;
    this.hitEnemiesThisSwing = new Set();
  }

  _attack(type, engine) {
    this.hitEnemiesThisSwing = new Set();
    this.attackType = type;

    if (type === 'light') {
      this.attackTimer = 18;
      this.attackCooldown = Math.floor(22 / this.attackSpeed);
      this.state = 'attacking_light';
    } else if (type === 'heavy') {
      this.attackTimer = 34;
      this.attackCooldown = Math.floor(42 / this.attackSpeed);
      this.state = 'attacking_heavy';
      this.vx = 0;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'heavy_slash');
    } else if (type === 'special') {
      this.sp -= 30;
      this.attackTimer = 42;
      this.attackCooldown = 72;
      this.state = 'attacking_special';
      this.vx = 0;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura2');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'sparks');
    }
  }

  getAttackHitbox() {
    // Ultimate hitbox - large AoE around player every few frames
    if (this.ultimateActive && this.ultimateTimer > 0) {
      // Refresh hit set every 12 frames so enemies can be hit repeatedly
      if (this.ultimateHitTicks % 12 === 0) this.hitEnemiesThisSwing = new Set();
      return {
        x: this.x + this.w / 2 - 160,
        y: this.y + this.h / 2 - 140,
        w: 320, h: 280,
        damage: Math.floor(this.damage * 1.6 * this._comboMult()),
        type: 'ultimate', knockback: 14 * (this.facingRight ? 1 : -1)
      };
    }
    if (this.attackTimer <= 0 || !this.attackType) return null;
    const dir = this.facingRight ? 1 : -1;
    const cx = this.x + this.w / 2;

    if (this.attackType === 'light') {
      if (this.attackTimer < 5 || this.attackTimer > 15) return null;
      const range = 88 * this.attackRange;
      return {
        x: this.facingRight ? this.x + this.w - 4 : this.x - range + 4,
        y: this.y + 6,
        w: range, h: 72,
        damage: Math.floor(this.damage * this._comboMult()),
        type: 'light', knockback: 5 * dir
      };
    }
    if (this.attackType === 'heavy') {
      if (this.attackTimer > 28 || this.attackTimer < 6) return null;
      const range = 120 * this.attackRange;
      return {
        x: cx - range / 2,
        y: this.y - 18,
        w: range, h: 118,
        damage: Math.floor(this.damage * 2.6 * this._comboMult()),
        type: 'heavy', knockback: 11 * dir
      };
    }
    if (this.attackType === 'special') {
      if (this.attackTimer > 38 || this.attackTimer < 5) return null;
      return {
        x: cx - 130, y: this.y - 90,
        w: 260, h: 190,
        damage: Math.floor(this.damage * 4.2 * this._comboMult()),
        type: 'special', knockback: 16 * dir
      };
    }
    return null;
  }

  _comboMult() {
    const base = this.hasComboMastery ? 0.16 : 0.08;
    const lowHpBonus = (this.hasReapersFury && this.hp / this.maxHp < 0.3) ? 0.2 : 0;
    return 1 + Math.min(this.combo * base, 2) + lowHpBonus;
  }

  takeDamage(amount, engine, source) {
    if (this.dashIframes > 0) return;
    if (this.hurtTimer > 0) return;
    if (this.state === 'dead') return;

    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = 55;
    if (source !== 'fall') { this.vx = (this.facingRight ? -1 : 1) * 8; this.vy = -7; }
    if (engine) engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'player_hurt');
    if (this.hp <= 0) { this.state = 'dead'; this.deathTimer = 120; }
    else this.state = 'hurt';
  }

  registerHit(enemy) {
    this.combo++;
    this.comboTimer = 105;
    this.sp = Math.min(this.maxSp, this.sp + 5);
    this.score += Math.floor(12 * this._comboMult());
    if (enemy.dead) {
      this.kills++;
      this.score += 60;
      if (this.hasVoidHunger) this.hp = Math.min(this.maxHp, this.hp + 6);
    }
  }

  applyUpgrade(upg) {
    switch (upg.id) {
      case 'soul_harvest': this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.2)); break;
      case 'deaths_touch': this.damage = Math.floor(this.damage * 1.15); break;
      case 'spectral_speed': this.speed = Math.min(this.speed * 1.2, 11); break;
      case 'reapers_reach': this.attackRange *= 1.3; break;
      case 'grim_resilience': this.maxHp = Math.floor(this.maxHp * 1.25); this.hp = Math.min(this.maxHp, this.hp + 25); break;
      case 'void_hunger': this.hasVoidHunger = true; break;
      case 'combo_mastery': this.hasComboMastery = true; break;
      case 'shadow_step': this.hasShadowStep = true; break;
      case 'attack_speed': this.attackSpeed = Math.min(this.attackSpeed * 1.3, 2.5); break;
      case 'soul_barrier': this.maxHp = Math.floor(this.maxHp * 1.1); this.maxSp = Math.floor(this.maxSp * 1.15); this.hp = Math.min(this.maxHp, this.hp + 15); this.sp = Math.min(this.maxSp, this.sp + 20); break;
      case 'lurkers_bane': this.hasLurkersBane = true; break;
      case 'reapers_fury': this.hasReapersFury = true; break;
    }
  }

  _updateTimers() {
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer <= 0) this.combo = 0; }
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashIframes > 0) this.dashIframes--;
      if (this.dashTimer <= 0) { this.isDashing = false; this.vx = 0; }
    } else if (this.dashIframes > 0) {
      this.dashIframes--;
    }
    if (this.ultimateActive) {
      this.ultimateTimer--;
      this.ultimateHitTicks++;
      if (this.ultimateTimer <= 0) {
        this.ultimateActive = false;
        this.hitEnemiesThisSwing = new Set();
      }
    }
    this.spRegenTimer++;
    if (this.spRegenTimer >= 95) { this.spRegenTimer = 0; this.sp = Math.min(this.maxSp, this.sp + 3); }
    if (this.state === 'dead' && this.deathTimer > 0) this.deathTimer--;
  }

  _updateState() {
    if (this.state === 'dead') return;
    if (this.ultimateActive) { this.state = 'ultimate'; return; }
    if (this.hurtTimer > 44) { this.state = 'hurt'; return; }
    if (this.isDashing) { this.state = 'dashing'; return; }
    if (this.attackTimer > 0) return;
    if (!this.onGround) this.state = this.vy < 0 ? 'jumping' : 'falling';
    else this.state = Math.abs(this.vx) > 0.5
      ? (this.runHoldTimer >= 35 ? 'running' : 'walking')
      : 'idle';
  }
}

// ─── Base Enemy ─────────────────────────────────────────────────────────────

class Enemy {
  constructor(x, y, config) {
    this.x = x; this.y = y;
    this.w = config.w || 40; this.h = config.h || 65;
    this.vx = 0; this.vy = 0;
    this.maxHp = config.hp; this.hp = config.hp;
    this.speed = config.speed || 2;
    this.damage = config.damage || 12;
    this.detectionRange = config.detectionRange || 450;
    this.attackRange = config.attackRange || 55;
    this.attackCooldown = 60; // spawn grace period
    this.hurtTimer = 0;
    this.knockTimer = 0;
    this.state = 'patrol';
    this.facingRight = true;
    this.onGround = false;
    this.dead = false;
    this.patrolDir = Math.random() < 0.5 ? 1 : -1;
    this.patrolTimer = 60;
    this.type = config.type;
    this.scoreValue = config.score || 25;
    this.poisonTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.phase = 1;
  }

  update(player, platforms, engine) {
    if (this.dead) return;

    // Poison damage
    if (this.poisonTimer > 0) {
      this.poisonTimer--;
      if (this.poisonTimer % 60 === 0) {
        this.hp -= 5;
        engine.particles.burst(this.x + this.w / 2, this.y, 'void_hit');
        if (this.hp <= 0) this._die(engine);
      }
    }

    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.x += this.vx;
    this.y += this.vy;

    this.onGround = false;
    for (const p of platforms) {
      const prevBottom = this.y + this.h - this.vy;
      if (
        this.x + this.w > p.x && this.x < p.x + p.w &&
        this.y + this.h >= p.y && prevBottom <= p.y + 4 && this.vy >= 0
      ) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (this.x < 20) { this.x = 20; this.patrolDir = 1; }
    if (this.x + this.w > engine.W - 20) { this.x = engine.W - this.w - 20; this.patrolDir = -1; }
    if (this.y > (engine.levelH || engine.H) + 100) { this.dead = true; }

    if (this.knockTimer > 0) { this.knockTimer--; }
    else this.ai(player, engine);

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) this.hurtTimer--;

    this.animTimer++;
    if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame++; }
  }

  ai(player, engine) { /* override */ }

  takeDamage(amount, kbX, engine, hasLurkersBane) {
    if (this.hurtTimer > 0 && this.type !== 'boss') return false;
    this.hp -= amount;
    this.hurtTimer = 6;
    this.knockTimer = 10;
    if (kbX !== 0) { this.vx = kbX; this.vy = -5; }
    if (hasLurkersBane) this.poisonTimer = Math.max(this.poisonTimer, 300);
    if (this.hp <= 0) this._die(engine);
    return true;
  }

  _die(engine) {
    this.hp = 0;
    this.dead = true;
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'death');
    engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'sparks');
  }

  _distToPlayer(player) {
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    return { dx, dy, dist: Math.hypot(dx, dy) };
  }
}

// ─── Shadow Demon ────────────────────────────────────────────────────────────

export class ShadowDemon extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 50, h: 78,
      hp: Math.floor(50 * scale),
      speed: 2.2 + scale * 0.4,
      damage: Math.floor(12 * scale),
      attackRange: 64,
      type: 'shadow_demon',
      score: 25
    });
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    if (dist < this.detectionRange) {
      this.facingRight = dx > 0;
      if (dist > this.attackRange + 10) {
        this.vx = (dx > 0 ? 1 : -1) * this.speed;
      } else {
        this.vx *= 0.7;
        if (this.attackCooldown <= 0 && Math.abs(dy) < 80) {
          this.attackCooldown = 90;
          engine.dealEnemyDamage(player, this.damage, engine);
          engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'void_hit');
        }
      }
    } else {
      this.vx = this.patrolDir * (this.speed * 0.5);
      this.patrolTimer--;
      if (this.patrolTimer <= 0) { this.patrolTimer = 80 + Math.floor(Math.random() * 60); this.patrolDir *= -1; }
    }
  }
}

// ─── Void Sprite ─────────────────────────────────────────────────────────────

export class VoidSprite extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 36, h: 36,
      hp: Math.floor(25 * scale),
      speed: 3.5 + scale * 0.5,
      damage: Math.floor(8 * scale),
      attackRange: 42,
      type: 'void_sprite',
      score: 15
    });
    this.floatTimer = Math.random() * Math.PI * 2;
    this.baseY = y;
  }

  update(player, platforms, engine) {
    if (this.dead) return;
    if (this.poisonTimer > 0) {
      this.poisonTimer--;
      if (this.poisonTimer % 60 === 0) { this.hp -= 5; if (this.hp <= 0) { this._die(engine); return; } }
    }
    // Floating enemy - no gravity
    this.floatTimer += 0.06;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 20) { this.x = 20; this.patrolDir = 1; }
    if (this.x + this.w > engine.W - 20) { this.x = engine.W - this.w - 20; this.patrolDir = -1; }
    if (this.knockTimer > 0) { this.knockTimer--; }
    else this.ai(player, engine);
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) this.hurtTimer--;
    this.animTimer++;
    if (this.animTimer >= 6) { this.animTimer = 0; this.animFrame++; }
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    if (dist < 500) {
      this.facingRight = dx > 0;
      const tx = player.x + player.w / 2 - this.w / 2;
      const ty = player.y - 20 + Math.sin(this.floatTimer) * 30;
      this.vx += (tx - this.x) * 0.04;
      this.vy += (ty - this.y) * 0.04;
      const maxSpd = this.speed;
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > maxSpd) { this.vx = (this.vx / spd) * maxSpd; this.vy = (this.vy / spd) * maxSpd; }
      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 60;
        engine.dealEnemyDamage(player, this.damage, engine);
      }
    } else {
      this.vx *= 0.9; this.vy *= 0.9;
    }
  }
}

// ─── Dimension Watcher ───────────────────────────────────────────────────────

export class DimensionWatcher extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 56, h: 56,
      hp: Math.floor(65 * scale),
      speed: 1.2,
      damage: Math.floor(14 * scale),
      attackRange: 380,
      detectionRange: 500,
      type: 'dimension_watcher',
      score: 35
    });
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update(player, platforms, engine) {
    if (this.dead) return;
    if (this.poisonTimer > 0) {
      this.poisonTimer--;
      if (this.poisonTimer % 60 === 0) { this.hp -= 5; if (this.hp <= 0) { this._die(engine); return; } }
    }
    this.floatOffset += 0.04;
    this.vy = Math.sin(this.floatOffset) * 0.5;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 20) { this.x = 20; this.patrolDir = 1; }
    if (this.x + this.w > engine.W - 20) { this.x = engine.W - this.w - 20; this.patrolDir = -1; }
    this.ai(player, engine);
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.knockTimer > 0) this.knockTimer--;
    this.animTimer++;
    if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame++; }
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;
    if (dist < this.detectionRange) {
      // Move slowly toward player
      this.vx += (dx > 0 ? 0.05 : -0.05);
      if (Math.abs(this.vx) > this.speed) this.vx = Math.sign(this.vx) * this.speed;

      // Fire projectile
      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 130;
        const angle = Math.atan2(dy, dx);
        engine.addProjectile({
          x: this.x + this.w / 2, y: this.y + this.h / 2,
          vx: Math.cos(angle) * 5.5, vy: Math.sin(angle) * 5.5,
          damage: this.damage, owner: 'enemy',
          life: 90, color: '#a855f7', size: 8,
          glow: '#7c3aed'
        });
      }
    } else {
      this.vx *= 0.9;
    }
  }
}

// ─── Lurker Cultist ──────────────────────────────────────────────────────────

export class LurkerCultist extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 46, h: 86,
      hp: Math.floor(85 * scale),
      speed: 2.8 + scale * 0.3,
      damage: Math.floor(18 * scale),
      attackRange: 70,
      type: 'lurker_cultist',
      score: 50
    });
    this.teleportCooldown = 180 + Math.floor(Math.random() * 120);
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Teleport mechanic
    this.teleportCooldown--;
    if (this.teleportCooldown <= 0 && dist > 150) {
      this.teleportCooldown = 200;
      // Appear near player
      const side = Math.random() < 0.5 ? -1 : 1;
      this.x = player.x + side * 120;
      this.y = player.y - 80;
      this.y = Math.max(50, Math.min(this.y, (engine.levelH || engine.H) - 200));
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'smoke');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
      return;
    }

    if (dist < this.detectionRange) {
      this.vx = (dx > 0 ? 1 : -1) * this.speed;
      if (dist < this.attackRange && Math.abs(dy) < 90 && this.attackCooldown <= 0) {
        this.attackCooldown = 75;
        engine.dealEnemyDamage(player, this.damage, engine);
        engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'void_hit');
      }
    } else {
      this.vx *= 0.85;
    }
  }
}

// ─── Boss Servant ────────────────────────────────────────────────────────────

export class BossServant extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 100, h: 138,
      hp: Math.floor(600 * scale),
      speed: 2,
      damage: Math.floor(22 * scale),
      attackRange: 120,
      detectionRange: 9999,
      type: 'boss',
      score: 500
    });
    this.phase = 1;
    this.specialCooldown = 240;
    this.chargeTimer = 0;
    this.isCharging = false;
    this.chargeDir = 1;
    this.floatOffset = 0;
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Phase 2 at 50% HP
    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed *= 1.5;
      this.damage = Math.floor(this.damage * 1.3);
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'boss_hit');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
    }

    this.specialCooldown--;
    this.floatOffset += 0.03;

    if (this.isCharging) {
      this.vx = this.chargeDir * 18;
      this.chargeTimer--;
      if (this.chargeTimer <= 0) { this.isCharging = false; this.vx = 0; }
      // Charge damage
      if (Math.abs(dist) < this.attackRange + 30 && this.attackCooldown <= 0) {
        this.attackCooldown = 30;
        engine.dealEnemyDamage(player, this.damage * 1.5, engine);
      }
      return;
    }

    // Special attack: summon homing projectiles
    if (this.specialCooldown <= 0) {
      this.specialCooldown = this.phase === 2 ? 180 : 280;
      const angles = this.phase === 2 ? 6 : 4;
      for (let i = 0; i < angles; i++) {
        const a = (Math.PI * 2 * i) / angles;
        engine.addProjectile({
          x: this.x + this.w / 2, y: this.y + this.h / 2,
          vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
          damage: this.damage, owner: 'enemy',
          life: 80, color: '#ff3366', size: 11, glow: '#ff6600'
        });
      }
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'boss_hit');
    }

    // Charge attack every so often
    if (dist < 350 && dist > 100 && this.attackCooldown <= 0) {
      if (Math.random() < (this.phase === 2 ? 0.012 : 0.006)) {
        this.isCharging = true;
        this.chargeTimer = 22;
        this.chargeDir = dx > 0 ? 1 : -1;
        this.attackCooldown = 50;
        engine.particles.burst(this.x + this.w / 2, this.y, 'sparks');
        return;
      }
    }

    // Normal approach
    if (dist > this.attackRange + 20) {
      this.vx += (dx > 0 ? 1 : -1) * 0.25;
      if (Math.abs(this.vx) > this.speed) this.vx = Math.sign(this.vx) * this.speed;
      this.vy += Math.sin(this.floatOffset) * 0.08;
    } else {
      this.vx *= 0.85;
      if (this.attackCooldown <= 0 && Math.abs(dy) < 120) {
        this.attackCooldown = 55;
        engine.dealEnemyDamage(player, this.damage, engine);
        engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'boss_hit');
      }
    }
  }
}

// ─── Lurker Boss (Plague Doctor) ─────────────────────────────────────────────
// Three-phase boss using the Lurker sprite sheet. Floor 5+ boss encounters.

export class LurkerBoss extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 78, h: 142,
      hp: Math.floor(820 * scale),
      speed: 1.8,
      damage: Math.floor(20 * scale),
      attackRange: 95,
      detectionRange: 9999,
      type: 'lurker_boss',
      score: 700
    });
    this.phase = 1;
    this.maxHpRef = this.maxHp;
    this.specialCooldown = 220;
    this.teleportCooldown = 480;
    this.summonCooldown = 720;
    this.poisonCloudCooldown = 180;
    this.attackState = 'idle';
    this.attackStateTimer = 0;
    this.floatOffset = 0;
    this.scaleAdj = scale;
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Phase transitions
    const hpFrac = this.hp / this.maxHpRef;
    if (this.phase === 1 && hpFrac < 0.66) {
      this.phase = 2;
      this.speed *= 1.25;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'boss_hit');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
      if (engine.sound?.playBossRoar) engine.sound.playBossRoar();
    } else if (this.phase === 2 && hpFrac < 0.33) {
      this.phase = 3;
      this.speed *= 1.2;
      this.damage = Math.floor(this.damage * 1.2);
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'boss_hit');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'ultimate_explosion');
      if (engine.sound?.playBossRoar) engine.sound.playBossRoar();
    }

    this.specialCooldown--;
    this.teleportCooldown--;
    this.poisonCloudCooldown--;
    if (this.phase === 3) this.summonCooldown--;
    this.floatOffset += 0.04;

    if (this.attackStateTimer > 0) this.attackStateTimer--;
    else this.attackState = 'idle';

    // Phase 2+ teleport
    if (this.phase >= 2 && this.teleportCooldown <= 0 && dist > 180) {
      this.teleportCooldown = this.phase === 3 ? 280 : 380;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'smoke');
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
      const side = Math.random() < 0.5 ? -1 : 1;
      this.x = Math.max(40, Math.min(engine.W - this.w - 40, player.x + side * 140));
      this.y = player.y - 30;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'smoke');
      this.attackState = 'special';
      this.attackStateTimer = 24;
      return;
    }

    // Phase 3 summon adds
    if (this.phase === 3 && this.summonCooldown <= 0) {
      this.summonCooldown = 480;
      this.attackState = 'special';
      this.attackStateTimer = 30;
      for (let i = 0; i < 2; i++) {
        const sx = this.x + (i === 0 ? -60 : this.w + 60);
        const minion = new LurkerCultist(sx, this.y + 30, this.scaleAdj * 0.85);
        engine.enemies.push(minion);
        engine.particles.burst(sx + 20, this.y + 50, 'dark_aura');
      }
      return;
    }

    // Poison cloud projectile
    if (this.poisonCloudCooldown <= 0 && dist < 480) {
      this.poisonCloudCooldown = this.phase === 3 ? 110 : (this.phase === 2 ? 150 : 200);
      this.attackState = 'attack';
      this.attackStateTimer = 22;
      const cloudX = player.x + player.w / 2 + (Math.random() - 0.5) * 80;
      engine.addProjectile({
        x: this.x + this.w / 2, y: this.y + this.h / 3,
        vx: (cloudX - (this.x + this.w / 2)) * 0.012,
        vy: -2.5,
        gravity: 0.18,
        damage: Math.floor(this.damage * 0.6),
        owner: 'enemy', life: 130,
        color: '#84cc16', glow: '#16a34a', size: 13,
        kind: 'poison_cloud'
      });
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 3, 'sparks');
    }

    // Special: crimson radial bolts
    if (this.specialCooldown <= 0) {
      this.specialCooldown = this.phase === 3 ? 200 : (this.phase === 2 ? 260 : 340);
      this.attackState = 'special';
      this.attackStateTimer = 30;
      const bolts = this.phase === 3 ? 8 : (this.phase === 2 ? 6 : 4);
      for (let i = 0; i < bolts; i++) {
        const a = (Math.PI * 2 * i) / bolts + this.floatOffset * 0.3;
        engine.addProjectile({
          x: this.x + this.w / 2, y: this.y + this.h / 2,
          vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2,
          damage: this.damage, owner: 'enemy',
          life: 110, color: '#ff3366', size: 10, glow: '#ff6600'
        });
      }
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'boss_hit');
    }

    // Movement / melee
    if (dist > this.attackRange + 20) {
      this.vx += (dx > 0 ? 1 : -1) * 0.28;
      if (Math.abs(this.vx) > this.speed) this.vx = Math.sign(this.vx) * this.speed;
      if (this.attackState === 'idle') this.attackState = 'walk';
    } else {
      this.vx *= 0.82;
      if (this.attackCooldown <= 0 && Math.abs(dy) < 110) {
        this.attackCooldown = 70;
        this.attackState = 'attack';
        this.attackStateTimer = 20;
        engine.dealEnemyDamage(player, this.damage, engine);
        engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'void_hit');
      }
    }
  }
}



// ─── Soul Seed ───────────────────────────────────────────────────────────────
// Floating collectible that fills ultimate charge

export class SoulSeed {
  constructor(x, y, value = 10) {
    this.x = x; this.y = y;
    this.w = 18; this.h = 18;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = -3 - Math.random() * 2;
    this.value = value;
    this.life = 540; // ~9 seconds
    this.dead = false;
    this.phase = Math.random() * Math.PI * 2;
    this.baseY = y;
    this.settled = false;
    this.settledTimer = 0;
    this.collectedTimer = 0;
    this.collecting = false;
  }

  update(player, platforms, engine) {
    if (this.dead) return;
    this.phase += 0.12;
    this.life--;
    if (this.life <= 0) { this.dead = true; return; }

    if (this.collecting) {
      this.collectedTimer++;
      // Magnetize to player
      const tx = player.x + player.w / 2 - this.w / 2;
      const ty = player.y + player.h / 2 - this.h / 2;
      this.x += (tx - this.x) * 0.35;
      this.y += (ty - this.y) * 0.35;
      if (this.collectedTimer >= 6) {
        player.collectSoulSeed(this.value);
        engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'soul_pickup');
        if (engine.sound?.playSoulPickup) engine.sound.playSoulPickup();
        this.dead = true;
      }
      return;
    }

    if (!this.settled) {
      // Falling/launching phase
      this.vy += 0.32;
      if (this.vy > 9) this.vy = 9;
      this.vx *= 0.96;
      this.x += this.vx;
      this.y += this.vy;
      // Stop when contacting a platform
      for (const p of platforms) {
        if (this.x + this.w > p.x && this.x < p.x + p.w &&
            this.y + this.h >= p.y && this.y + this.h <= p.y + 18 && this.vy >= 0) {
          this.y = p.y - this.h - 18;
          this.baseY = this.y;
          this.settled = true;
          this.vx = 0; this.vy = 0;
          break;
        }
      }
      if (this.y > (engine.levelH || engine.H) - 30) {
        this.y = (engine.levelH || engine.H) - 80;
        this.baseY = this.y;
        this.settled = true;
      }
    } else {
      // Floating idle
      this.settledTimer++;
      this.y = this.baseY + Math.sin(this.phase) * 4;
    }

    // Magnet attract within range
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dx = cx - (this.x + this.w / 2);
    const dy = cy - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < 90) {
      this.x += (dx / dist) * 4;
      this.y += (dy / dist) * 4;
    }
    if (dist < 28) {
      this.collecting = true;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NEW DEMONIC ENTITY TYPES ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Plague Imp ──────────────────────────────────────────────────────────────
// Fast ground dasher. Periodically winds up a charge attack and rushes the player.

export class PlagueImp extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 40, h: 54,
      hp: Math.floor(40 * scale),
      speed: 3.2 + scale * 0.5,
      damage: Math.floor(14 * scale),
      attackRange: 60,
      type: 'plague_imp',
      score: 30
    });
    this.chargeWindup = 0;
    this.chargeTimer = 0;
    this.chargeDir = 1;
  }

  ai(player, engine) {
    const { dx, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Charge attack in progress
    if (this.chargeTimer > 0) {
      this.vx = this.chargeDir * 11;
      this.chargeTimer--;
      if (Math.abs(dx) < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 60;
        engine.dealEnemyDamage(player, this.damage, engine);
        engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'void_hit');
      }
      return;
    }

    // Wind-up animation
    if (this.chargeWindup > 0) {
      this.chargeWindup--;
      this.vx *= 0.65;
      if (this.chargeWindup === 0) {
        this.chargeTimer = 26;
        this.chargeDir = dx > 0 ? 1 : -1;
        engine.particles.burst(this.x + this.w / 2, this.y + this.h, 'smoke');
        if (engine.sound?.playEnemyCharge) engine.sound.playEnemyCharge();
      }
      return;
    }

    if (dist < this.detectionRange) {
      // Approach
      if (dist > this.attackRange + 20) {
        this.vx = (dx > 0 ? 1 : -1) * this.speed;
      } else {
        this.vx *= 0.7;
        if (this.attackCooldown <= 0 && Math.random() < 0.045) {
          this.chargeWindup = 22; // wind up
          this.attackCooldown = 150;
        }
      }
    } else {
      this.vx = this.patrolDir * (this.speed * 0.5);
      this.patrolTimer--;
      if (this.patrolTimer <= 0) { this.patrolTimer = 80; this.patrolDir *= -1; }
    }
  }
}

// ─── Shadow Crawler ──────────────────────────────────────────────────────────
// Low ground-hugger. Very fast, low HP, attacks by lunging.

export class ShadowCrawler extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 56, h: 30,
      hp: Math.floor(30 * scale),
      speed: 4.2 + scale * 0.5,
      damage: Math.floor(10 * scale),
      attackRange: 56,
      type: 'shadow_crawler',
      score: 22
    });
    this.lungeTimer = 0;
  }

  ai(player, engine) {
    const { dx, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    if (this.lungeTimer > 0) {
      this.lungeTimer--;
      this.vx = (this.facingRight ? 1 : -1) * 9;
      if (this.attackCooldown <= 0 && Math.abs(dx) < this.attackRange) {
        this.attackCooldown = 50;
        engine.dealEnemyDamage(player, this.damage, engine);
      }
      return;
    }

    if (dist < this.detectionRange) {
      if (dist > this.attackRange + 8) {
        this.vx = (dx > 0 ? 1 : -1) * this.speed;
      } else if (this.attackCooldown <= 0) {
        // Lunge!
        this.lungeTimer = 14;
        this.vy = -7;
        this.attackCooldown = 75;
        engine.particles.burst(this.x + this.w / 2, this.y + this.h, 'smoke');
      }
    } else {
      this.vx = this.patrolDir * (this.speed * 0.4);
      this.patrolTimer--;
      if (this.patrolTimer <= 0) { this.patrolTimer = 70; this.patrolDir *= -1; }
    }
  }
}

// ─── Ember Wraith ────────────────────────────────────────────────────────────
// Floating projectile-flinger. Lobs fire balls at the player.

export class EmberWraith extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 42, h: 52,
      hp: Math.floor(45 * scale),
      speed: 1.6,
      damage: Math.floor(12 * scale),
      attackRange: 420,
      detectionRange: 550,
      type: 'ember_wraith',
      score: 38
    });
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update(player, platforms, engine) {
    if (this.dead) return;
    if (this.poisonTimer > 0) {
      this.poisonTimer--;
      if (this.poisonTimer % 60 === 0) { this.hp -= 5; if (this.hp <= 0) { this._die(engine); return; } }
    }
    this.floatOffset += 0.05;
    this.vy = Math.sin(this.floatOffset) * 0.6;
    this.x += this.vx; this.y += this.vy;
    if (this.x < 20) { this.x = 20; this.patrolDir = 1; }
    if (this.x + this.w > engine.W - 20) { this.x = engine.W - this.w - 20; this.patrolDir = -1; }
    this.ai(player, engine);
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.knockTimer > 0) this.knockTimer--;
    this.animTimer++;
    if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame++; }
  }

  ai(player, engine) {
    const { dx, dy, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;
    if (dist < this.detectionRange) {
      // Maintain distance
      if (dist < 220) this.vx += (dx > 0 ? -0.06 : 0.06);
      else this.vx += (dx > 0 ? 0.04 : -0.04);
      if (Math.abs(this.vx) > this.speed) this.vx = Math.sign(this.vx) * this.speed;

      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 95;
        const angle = Math.atan2(dy, dx);
        engine.addProjectile({
          x: this.x + this.w / 2, y: this.y + this.h / 2,
          vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
          damage: this.damage, owner: 'enemy',
          life: 110, color: '#ff6b1a', size: 9,
          glow: '#fbbf24'
        });
        engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'sparks');
        if (engine.sound?.playProjectileFire) engine.sound.playProjectileFire();
      }
    } else {
      this.vx *= 0.9;
    }
  }
}

// ─── Bone Howler ─────────────────────────────────────────────────────────────
// Stationary-ish summoner. Periodically howls and spawns void sprites.

export class BoneHowler extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 54, h: 80,
      hp: Math.floor(110 * scale),
      speed: 1.0,
      damage: Math.floor(8 * scale),
      attackRange: 70,
      detectionRange: 600,
      type: 'bone_howler',
      score: 60
    });
    this.summonCooldown = 220 + Math.floor(Math.random() * 90);
    this.howlTimer = 0;
    this._scale = scale;
  }

  ai(player, engine) {
    const { dx, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Howl + summon
    if (this.howlTimer > 0) {
      this.howlTimer--;
      this.vx *= 0.4;
      if (this.howlTimer === 0) {
        // Spawn 2 void sprites near self
        const baseX = this.x + this.w / 2;
        for (let i = 0; i < 2; i++) {
          const offset = (i === 0 ? -50 : 50);
          const sprite = new VoidSprite(baseX + offset, this.y - 20, this._scale);
          engine.enemies.push(sprite);
          engine.particles.burst(baseX + offset, this.y, 'dark_aura');
        }
        if (engine.sound?.playSummon) engine.sound.playSummon();
      }
      return;
    }

    if (dist < this.detectionRange) {
      // Slow retreat to maintain distance
      if (dist < 180) this.vx = (dx > 0 ? -1 : 1) * this.speed;
      else this.vx *= 0.85;

      this.summonCooldown--;
      if (this.summonCooldown <= 0 && engine.enemies.length < 8) {
        this.summonCooldown = 280;
        this.howlTimer = 30;
        engine.particles.burst(this.x + this.w / 2, this.y + this.h / 3, 'sparks');
      }

      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = 100;
        engine.dealEnemyDamage(player, this.damage, engine);
      }
    } else {
      this.vx *= 0.9;
    }
  }
}

// ─── Hex Beast ───────────────────────────────────────────────────────────────
// Tank with parry phase — every few seconds becomes momentarily invulnerable
// and reflects damage. Slow but heavy hits.

export class HexBeast extends Enemy {
  constructor(x, y, scale = 1) {
    super(x, y, {
      w: 62, h: 80,
      hp: Math.floor(130 * scale),
      speed: 1.8,
      damage: Math.floor(22 * scale),
      attackRange: 80,
      type: 'hex_beast',
      score: 70
    });
    this.shieldTimer = 0;
    this.shieldCooldown = 240 + Math.floor(Math.random() * 60);
  }

  ai(player, engine) {
    const { dx, dist } = this._distToPlayer(player);
    this.facingRight = dx > 0;

    // Manage shield phase
    this.shieldCooldown--;
    if (this.shieldCooldown <= 0 && this.shieldTimer <= 0) {
      this.shieldTimer = 90; // ~1.5s shield
      this.shieldCooldown = 360;
      engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'dark_aura');
    }
    if (this.shieldTimer > 0) this.shieldTimer--;

    if (dist < this.detectionRange) {
      if (dist > this.attackRange + 10) {
        this.vx = (dx > 0 ? 1 : -1) * this.speed;
      } else {
        this.vx *= 0.7;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 95;
          engine.dealEnemyDamage(player, this.damage, engine);
          engine.particles.burst(player.x + player.w / 2, player.y + player.h / 2, 'void_hit');
        }
      }
    } else {
      this.vx = this.patrolDir * (this.speed * 0.5);
      this.patrolTimer--;
      if (this.patrolTimer <= 0) { this.patrolTimer = 80; this.patrolDir *= -1; }
    }
  }

  takeDamage(amount, kbX, engine, hasLurkersBane) {
    // Shielded — reflect a portion back to player and ignore damage
    if (this.shieldTimer > 0) {
      this.hurtTimer = 4;
      if (engine && engine.player) {
        // Tiny reflect damage
        const reflect = Math.max(1, Math.floor(amount * 0.15));
        engine.dealEnemyDamage(engine.player, reflect, engine);
      }
      engine && engine.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 'sparks');
      return false;
    }
    return super.takeDamage(amount, kbX, engine, hasLurkersBane);
  }
}
