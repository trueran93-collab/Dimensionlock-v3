import { Player, ShadowDemon, VoidSprite, DimensionWatcher, LurkerCultist, BossServant, LurkerBoss, SoulSeed, PlagueImp, ShadowCrawler, EmberWraith, BoneHowler, HexBeast } from './entities.js';
import { ParticleSystem } from './particles.js';
import { UPGRADES } from './upgrades.js';
import { Renderer } from './renderer.js';
import { initSprites } from './sprites.js';
import { soundEngine } from './sound.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 1280;
    this.H = 720;          // viewport height (camera window)
    this.levelH = 720;     // full level height (camera follows within this range)
    canvas.width = this.W;
    canvas.height = this.H;

    this.keysDown = new Set();
    this.prevKeys = new Set();
    this.justPressed = new Set();

    this.player = new Player(200, 500);
    this.enemies = [];
    this.platforms = [];
    this.projectiles = [];
    this.soulSeeds = [];
    this.soulSeedSpawnTimer = 0;
    this.particles = new ParticleSystem();

    // Camera (Y only — horizontal stays static)
    this.cameraY = 0;

    // Exit door (spawned when waves clear)
    this.exitDoor = null;
    this.doorEntered = false;
    this.bestCombo = 0;

    // Dialogue queue: { text, speaker, ttl, kind: 'bubble'|'box' }
    this.activeBubble = null;   // currently shown floating bubble (gameplay)
    this.bubbleQueue = [];

    // Virtual (touch) input state - merged with keyboard
    this.touchInput = {
      left: false, right: false,
      jumpPressed: false, dashPressed: false,
      lightPressed: false, heavyPressed: false,
      specialPressed: false, ultimatePressed: false
    };
    this.prevTouchInput = { ...this.touchInput };

    this.floor = 1;
    this.wave = 0;
    this.maxWaves = 3;
    this.waveCooldown = 0;
    this.waveSpawning = false;
    this.floorCleared = false;
    this.bossActive = false;
    this.showingBossWarning = false;

    this.gameState = 'playing';
    this.paused = false;
    this.running = false;
    this.rafId = null;
    this.frameCount = 0;

    // Visual juice
    this.hitStop = 0;                 // frames remaining where update() is mostly frozen
    this.screenShake = { x: 0, y: 0, frames: 0, intensity: 0 };
    this.toastQueue = [];             // [{ text, sub, color, ttl, age }]
    this.crystalFlash = 0;            // brief white wash on heavy hits / kills

    // Run statistics for end-of-run rank + floor bonuses
    this.runStats = {
      damageTakenThisFloor: 0,
      timeOnFloor: 0,           // frames
      bossKills: 0,
      perfectFloors: 0,
      swiftFloors: 0,
      overkillFloors: 0,
      totalFloorsCleared: 0,
    };
    // Buffs/applied unlocks from meta-progression
    this.startBuffs = { maxHpBonus: 0, maxSpBonus: 0, extraDashCharges: 0, ultStartPct: 0 };
    this.tempBuffs = { damageMult: 1, damageMultTimer: 0 }; // Red Rage Shard

    this.callbacks = callbacks;
    this.renderer = new Renderer();
    this.sound = soundEngine;

    // Flybutt companion
    this.flybutt = { x: 200, y: 400, wingAngle: 0 };
    this._prevPlayerState = 'idle';

    initSprites();
    this.generateFloor();
    // Position player just above the ground after the level is generated
    this.player.x = 200;
    this.player.y = this.levelH - 50 - this.player.h - 200;
    this.cameraY = Math.max(0, this.levelH - this.H);
  }

  start() {
    this.setupInputs();
    this.running = true;
    this.wave = 1;
    this.spawnWave();
    this.loop();
    // Start gothic rock background music
    this.sound.startMusic();
  }

  // Apply persistent unlocks from meta-progression to the freshly-created player.
  // Called by GameCanvas right after engine construction.
  applyStartBuffs(buffs = {}) {
    this.startBuffs = { ...this.startBuffs, ...buffs };
    const p = this.player;
    if (!p) return;
    if (buffs.maxHpBonus)       { p.maxHp += buffs.maxHpBonus; p.hp = p.maxHp; }
    if (buffs.maxSpBonus)       { p.maxSp += buffs.maxSpBonus; p.sp = p.maxSp; }
    if (buffs.extraDashCharges) { p.maxDashCharges = (p.maxDashCharges || 1) + buffs.extraDashCharges;
                                  p.dashCharges    = p.maxDashCharges; }
    if (buffs.ultStartPct)      { p.ultimateCharge = Math.min(p.maxUltimateCharge,
                                                              (buffs.ultStartPct / 100) * p.maxUltimateCharge); }
  }

  // Trigger a directional screen shake. dir = -1 (left) | 0 (omni) | 1 (right).
  // intensity is in px, duration in frames.
  triggerShake(intensity, frames = 10, dir = 0) {
    // Replace if stronger, otherwise keep ongoing shake
    if (intensity >= this.screenShake.intensity) {
      this.screenShake = { x: 0, y: 0, frames, intensity, dir };
    }
  }

  // Schedule a brief hit-stop freeze (frames where update() does almost nothing).
  triggerHitStop(frames) {
    if (frames > this.hitStop) this.hitStop = frames;
  }

  pushToast(text, sub = '', color = '#fbbf24', ttl = 150) {
    this.toastQueue.push({ text, sub, color, ttl, age: 0 });
  }

  pause() {
    this.paused = true;
    this.sound.pauseMusic();
  }

  resume() {
    this.paused = false;
    this.sound.resumeMusic();
  }

  stop() {
    this.running = false;
    this.sound.stopMusic();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._cleanupInputs) this._cleanupInputs();
  }

  loop() {
    if (!this.running) return;
    if (!this.paused) this.update();
    this.render();
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.frameCount++;

    // Hit-stop freezes most simulation (but still ticks shake & particles for visual juice)
    if (this.hitStop > 0) {
      this.hitStop--;
      // Still update screen shake and damage-number lifetimes during hit-stop
      this._updateShake();
      this.particles.update();
      this._updateToasts();
      return;
    }
    this._updateShake();
    this._updateToasts();
    this._updateTempBuffs();

    this.justPressed = new Set([...this.keysDown].filter(k => !this.prevKeys.has(k)));
    this.prevKeys = new Set(this.keysDown);

    // Compute touch "justPressed" flags
    const t = this.touchInput;
    const pt = this.prevTouchInput;
    const tJust = (cur, prev) => cur && !prev;
    const tJumpJust = tJust(t.jumpPressed, pt.jumpPressed);
    const tDashJust = tJust(t.dashPressed, pt.dashPressed);
    const tLightJust = tJust(t.lightPressed, pt.lightPressed);
    const tHeavyJust = tJust(t.heavyPressed, pt.heavyPressed);
    const tSpecialJust = tJust(t.specialPressed, pt.specialPressed);
    const tUltimateJust = tJust(t.ultimatePressed, pt.ultimatePressed);
    this.prevTouchInput = { ...t };

    const keys = {
      left: this.keysDown.has('ArrowLeft') || this.keysDown.has('a') || this.keysDown.has('A') || t.left,
      right: this.keysDown.has('ArrowRight') || this.keysDown.has('d') || this.keysDown.has('D') || t.right,
      jumpJustPressed: this.justPressed.has(' ') || this.justPressed.has('ArrowUp') || this.justPressed.has('w') || this.justPressed.has('W') || tJumpJust,
      dashJustPressed: this.justPressed.has('Shift') || tDashJust,
      lightJustPressed: this.justPressed.has('j') || this.justPressed.has('J') || this.justPressed.has('z') || this.justPressed.has('Z') || tLightJust,
      heavyJustPressed: this.justPressed.has('k') || this.justPressed.has('K') || this.justPressed.has('x') || this.justPressed.has('X') || tHeavyJust,
      specialJustPressed: this.justPressed.has('l') || this.justPressed.has('L') || this.justPressed.has('c') || this.justPressed.has('C') || tSpecialJust,
      ultimateJustPressed: this.justPressed.has('u') || this.justPressed.has('U') || this.justPressed.has('r') || this.justPressed.has('R') || tUltimateJust,
    };

    if (this.player.state !== 'dead') {
      const prevState = this._prevPlayerState;
      this.player.update(keys, this.platforms, this);
      // Running trail effect
      if (this.player.state === 'running' && this.player.onGround) {
        this.player.runTrailTimer++;
        if (this.player.runTrailTimer >= 5) {
          this.player.runTrailTimer = 0;
          this.particles.burst(
            this.player.x + this.player.w / 2 - this.player.vx * 1.2,
            this.player.y + this.player.h - 2,
            'run_trail', 2
          );
        }
      } else {
        this.player.runTrailTimer = 0;
      }
      // Ultimate spinning aura particles
      if (this.player.ultimateActive && this.frameCount % 3 === 0) {
        this.particles.burst(
          this.player.x + this.player.w / 2,
          this.player.y + this.player.h / 2,
          'ultimate_spin', 4
        );
      }
      // Sound triggers on state changes
      if (this.player.state !== prevState) {
        if (this.player.state === 'jumping') this.sound.playJump();
        if (this.player.state === 'dashing') this.sound.playDash();
        if (this.player.state === 'attacking_light' && prevState !== 'attacking_light') this.sound.playLightAttack();
        if (this.player.state === 'attacking_heavy' && prevState !== 'attacking_heavy') this.sound.playHeavyAttack();
        if (this.player.state === 'attacking_special' && prevState !== 'attacking_special') this.sound.playSpecialAttack();
        // Landing sound: from jumping/falling → idle/walking/running
        if ((prevState === 'jumping' || prevState === 'falling') &&
            ['idle','walking','running'].includes(this.player.state) &&
            this.sound.playLand) {
          this.sound.playLand();
        }
      }
      this._prevPlayerState = this.player.state;
    } else {
      // Player is dead - still tick death timer so game over can fire
      if (this.player.deathTimer > 0) this.player.deathTimer--;
    }

    this.resolveCombat();

    const enemiesBefore = this.enemies.length;
    this.enemies.forEach(e => e.update(this.player, this.platforms, this));
    // Spawn soul seeds from killed enemies
    for (const e of this.enemies) {
      if (e.dead && !e._seedDropped) {
        e._seedDropped = true;
        let count = 2;
        if (e.type === 'boss') count = 8;
        else if (e.type === 'lurker_cultist') count = 3;
        else if (e.type === 'bone_howler' || e.type === 'hex_beast') count = 4;
        else if (e.type === 'ember_wraith') count = 3;
        for (let i = 0; i < count; i++) {
          const seed = new SoulSeed(
            e.x + e.w / 2 + (Math.random() - 0.5) * 30,
            e.y + e.h / 2,
            e.type === 'boss' ? 15 : 8
          );
          seed.vx = (Math.random() - 0.5) * 5;
          seed.vy = -4 - Math.random() * 3;
          this.soulSeeds.push(seed);
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // Update soul seeds
    this.soulSeeds.forEach(s => s.update(this.player, this.platforms, this));
    this.soulSeeds = this.soulSeeds.filter(s => !s.dead);

    // Ambient soul seed spawn (occasionally drift in from edges)
    this.soulSeedSpawnTimer++;
    if (this.soulSeedSpawnTimer >= 360 && this.soulSeeds.length < 4 && this.enemies.length > 0) {
      this.soulSeedSpawnTimer = 0;
      const sx = 100 + Math.random() * (this.W - 200);
      const seedY = (this.levelH || this.H) - 600;
      const seed = new SoulSeed(sx, Math.max(80, seedY), 6);
      seed.vy = 0; seed.vx = 0;
      this.soulSeeds.push(seed);
    }

    this.projectiles.forEach(p => this.updateProjectile(p));
    this.projectiles = this.projectiles.filter(p => p.active);

    this.particles.update();
    this._updateFlybutt();
    this._updateCamera();
    this._updateBubble();
    this.manageWaves();

    // Tick run-stat timers
    this.runStats.timeOnFloor++;

    // Count boss kills (boss servant + lurker boss)
    for (const e of this.enemies) {
      if (e.dead && (e.type === 'boss' || e.type === 'lurker_boss') && !e._countedBossKill) {
        e._countedBossKill = true;
        this.runStats.bossKills++;
      }
    }

    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate({
        hp: this.player.hp, maxHp: this.player.maxHp,
        sp: this.player.sp, maxSp: this.player.maxSp,
        combo: this.player.combo,
        bestCombo: this.bestCombo,
        floor: this.floor,
        score: this.player.score,
        kills: this.player.kills,
        wave: this.wave,
        maxWaves: this.maxWaves,
        ultimateCharge: this.player.ultimateCharge,
        maxUltimateCharge: this.player.maxUltimateCharge,
        ultimateActive: this.player.ultimateActive,
        dashCooldown: this.player.dashCooldown,
        spReady: this.player.sp >= 30,
        toasts: this.toastQueue.slice(),
        rageActive: (this.tempBuffs.damageMultTimer || 0) > 0,
        rageRemaining: this.tempBuffs.damageMultTimer || 0,
      });
    }
  }

  updateProjectile(proj) {
    if (proj.gravity) proj.vy += proj.gravity;
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    if (!proj.active) return;

    // Poison cloud lands → AoE puddle that ticks damage for ~1.5s
    if (proj.kind === 'poison_cloud' && !proj.landed) {
      const groundY = (this.levelH || this.H) - 50;
      if (proj.y >= groundY - 4) {
        proj.landed = true;
        proj.y = groundY - 6;
        proj.vx = 0; proj.vy = 0; proj.gravity = 0;
        proj.life = 90;          // puddle lifetime
        proj.size = 28;          // expanded radius
        proj.tickTimer = 0;
        this.particles.burst(proj.x, groundY - 8, 'dark_aura2');
        this.particles.burst(proj.x, groundY - 8, 'sparks');
      }
    }

    if (proj.life <= 0 || proj.x < 0 || proj.x > this.W ||
        proj.y < 0 || proj.y > (this.levelH || this.H)) {
      proj.active = false;
      return;
    }

    if (proj.owner === 'enemy') {
      // Poison puddle: AoE damage every 15 frames while standing in it
      if (proj.kind === 'poison_cloud' && proj.landed) {
        proj.tickTimer = (proj.tickTimer || 0) + 1;
        const px = this.player.x + this.player.w / 2;
        const py = this.player.y + this.player.h - 8;
        const inRange = Math.abs(px - proj.x) < proj.size && Math.abs(py - proj.y) < 20;
        // Visual fizz
        if (this.frameCount % 4 === 0) {
          this.particles.burst(
            proj.x + (Math.random() - 0.5) * proj.size * 1.4,
            proj.y - Math.random() * 8,
            'sparks', 2
          );
        }
        if (inRange && proj.tickTimer >= 15) {
          proj.tickTimer = 0;
          this.dealEnemyDamage(this.player, Math.max(2, Math.floor(proj.damage * 0.4)), this);
        }
        return;
      }

      // Regular projectile collision vs player
      if (
        this.player.state !== 'dead' &&
        proj.x > this.player.x && proj.x < this.player.x + this.player.w &&
        proj.y > this.player.y && proj.y < this.player.y + this.player.h
      ) {
        this.dealEnemyDamage(this.player, proj.damage, this);
        proj.active = false;
        this.particles.burst(proj.x, proj.y, 'void_hit');
      }
    }
  }

  resolveCombat() {
    const hitbox = this.player.getAttackHitbox();
    if (!hitbox) return;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (this.player.hitEnemiesThisSwing.has(enemy)) continue;
      if (!rectsOverlap(hitbox, { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h })) continue;

      const kbDir = enemy.x + enemy.w / 2 > this.player.x + this.player.w / 2 ? 1 : -1;
      const kb = hitbox.knockback || 6;

      // Crit roll — 12% base, scaling with combo (every 5 combo = +4% up to +20%)
      const critChance = 0.12 + Math.min(0.20, Math.floor(this.player.combo / 5) * 0.04);
      const isCrit = Math.random() < critChance;
      const damageMult = (this.tempBuffs.damageMult || 1) * (isCrit ? 1.75 : 1);
      const finalDamage = Math.max(1, Math.round(hitbox.damage * damageMult));

      const didHit = enemy.takeDamage(finalDamage, kbDir * Math.abs(kb), this, this.player.hasLurkersBane);

      if (didHit) {
        this.player.hitEnemiesThisSwing.add(enemy);
        this.player.registerHit(enemy);

        // VFX bursts
        const cx = enemy.x + enemy.w / 2;
        const cy = enemy.y + enemy.h / 3;
        this.particles.burst(cx, cy, 'void_hit');
        this.particles.burst(cx, cy, 'sparks');
        if (isCrit) this.particles.burst(cx, cy, 'crit');

        // Damage numbers (mark crit)
        this.particles.addDamageNumber(cx, enemy.y, finalDamage, hitbox.type, { crit: isCrit });

        // Hit-stop & screen shake scale by hit weight
        if (enemy.dead) {
          this.triggerHitStop(6);
          this.triggerShake(8, 14, kbDir);
          // Shatter VFX on death (colored by enemy type)
          this.particles.shatter(cx, enemy.y + enemy.h / 2, this._enemyColor(enemy.type), 18);
        } else if (hitbox.type === 'heavy' || hitbox.type === 'ultimate') {
          this.triggerHitStop(4);
          this.triggerShake(5, 10, kbDir);
        } else if (isCrit) {
          this.triggerHitStop(3);
          this.triggerShake(4, 8, kbDir);
        } else {
          this.triggerHitStop(1);
          this.triggerShake(2, 5, kbDir);
        }

        if (this.renderer && this.renderer.pulseNearestCrystal) {
          this.renderer.pulseNearestCrystal(cx, enemy.y + enemy.h / 2);
        }
        if (hitbox.type === 'heavy' || hitbox.type === 'ultimate') {
          this.sound.playHitHeavy && this.sound.playHitHeavy();
        } else {
          this.sound.playHit();
        }
        if (enemy.dead && this.sound.playEnemyDeath) {
          this.sound.playEnemyDeath(enemy.type);
        }
        if (this.callbacks.onComboUpdate) this.callbacks.onComboUpdate(this.player.combo);
        if (enemy.dead) this._maybeDropRare(enemy);
      } else {
        if (this.sound.playBlocked) this.sound.playBlocked();
        this.particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 3, 'sparks');
        this.triggerShake(2, 4, kbDir);
      }
    }
  }

  // Pick a thematic color for the shatter shards based on enemy type
  _enemyColor(type) {
    switch (type) {
      case 'plague_imp':       return '#a3e635';
      case 'shadow_crawler':   return '#7c3aed';
      case 'ember_wraith':     return '#ff6600';
      case 'bone_howler':      return '#e0e0e0';
      case 'hex_beast':        return '#e879f9';
      case 'lurker_cultist':   return '#22c55e';
      case 'dimension_watcher':return '#22d3ee';
      case 'void_sprite':      return '#c084fc';
      case 'boss':             return '#fbbf24';
      case 'lurker_boss':      return '#16a34a';
      default:                 return '#a855f7';
    }
  }

  // Roll for a rare drop. Called on enemy death.
  _maybeDropRare(enemy) {
    // Base 4% chance; boss always drops a Gold Soul Seed
    const baseRate = enemy.type === 'boss' ? 1.0 : 0.045;
    if (Math.random() < baseRate) {
      // 70% Gold Soul, 30% Red Rage
      const isGold = enemy.type === 'boss' || Math.random() < 0.7;
      const drop = new SoulSeed(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, isGold ? 25 : 18);
      drop.rare = isGold ? 'gold' : 'rage';
      drop.vy = -7; drop.vx = (Math.random() - 0.5) * 4;
      this.soulSeeds.push(drop);
    }
  }

  _updateShake() {
    const s = this.screenShake;
    if (s.frames > 0) {
      s.frames--;
      const decay = Math.max(0, s.frames / 12);
      const mag = s.intensity * decay;
      const biasX = s.dir ? s.dir * 0.6 : 0;
      s.x = (biasX + (Math.random() - 0.5) * 2) * mag;
      s.y = (Math.random() - 0.5) * 2 * mag;
      if (s.frames <= 0) { s.x = 0; s.y = 0; s.intensity = 0; }
    } else {
      s.x = 0; s.y = 0; s.intensity = 0;
    }
  }

  _updateToasts() {
    for (const t of this.toastQueue) t.age++;
    this.toastQueue = this.toastQueue.filter(t => t.age < t.ttl);
  }

  _updateTempBuffs() {
    if (this.tempBuffs.damageMultTimer > 0) {
      this.tempBuffs.damageMultTimer--;
      if (this.tempBuffs.damageMultTimer <= 0) this.tempBuffs.damageMult = 1;
    }
  }

  // Called when player picks up a rare drop (entities.js SoulSeed.update notifies us)
  applyRarePickup(rare) {
    if (rare === 'gold') {
      // Bonus shards at run-end will be added; here just play a flashy toast + particle burst
      this.player.score += 250;
      this.pushToast('GOLD SOUL', '+250 score · bonus shards on run end', '#fbbf24', 140);
      this.particles.burst(this.player.x + this.player.w / 2, this.player.y, 'gold_pickup');
      this.runStats.goldSouls = (this.runStats.goldSouls || 0) + 1;
    } else if (rare === 'rage') {
      this.tempBuffs.damageMult = 1.5;
      this.tempBuffs.damageMultTimer = 600; // 10 seconds @ 60fps
      this.pushToast('RED RAGE SHARD', '+50% damage for 10s', '#ff3366', 140);
      this.particles.burst(this.player.x + this.player.w / 2, this.player.y, 'rage_pickup');
      this.runStats.rageShards = (this.runStats.rageShards || 0) + 1;
    }
  }


  dealEnemyDamage(player, amount, engine) {
    player.takeDamage(amount, engine);
    engine.sound.playPlayerHurt();
  }

  manageWaves() {
    if (this.player.state === 'dead' && this.player.deathTimer <= 0) {
      if (this.gameState !== 'game_over') {
        this.gameState = 'game_over';
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver({
            floor: this.floor,
            score: this.player.score,
            kills: this.player.kills,
            bestCombo: this.runStats.runBestCombo || this.bestCombo || 0,
            perfectFloors: this.runStats.perfectFloors || 0,
            bossKills: this.runStats.bossKills || 0,
          });
        }
      }
      return;
    }

    // Track best combo for floor-complete display
    if (this.player.combo > this.bestCombo) this.bestCombo = this.player.combo;
    if (this.player.combo > (this.runStats.runBestCombo || 0)) this.runStats.runBestCombo = this.player.combo;

    // Door is already up — check entry
    if (this.exitDoor && this.exitDoor.opened && !this.doorEntered) {
      this._updateExitDoor();
      this._checkDoorEntry();
      return;
    }

    if (this.floorCleared || this.showingBossWarning) return;
    if (this.waveCooldown > 0) { this.waveCooldown--; return; }
    if (this.waveSpawning) return;

    if (this.enemies.length === 0) {
      if (this.wave < this.maxWaves) {
        this.wave++;
        this.waveCooldown = 90;
        this.spawnWave();
      } else {
        // All waves cleared — spawn the cathedral door
        this.floorCleared = true;
        this.gameState = 'floor_clear';
        this.sound.playFloorClear();
        this.sound.setBossMusic(false);
        this._spawnExitDoor();
        this.exitDoor.opened = true;
        this.exitDoor.unlockTimer = 60;
        this.sound.playDoorUnlock && this.sound.playDoorUnlock();
        // Bubble hint
        this._pushBubble('The way opens. Walk into the light.', 'maytradalis', 240);
      }
    }
  }

  _updateExitDoor() {
    const d = this.exitDoor;
    if (!d) return;
    if (d.unlockTimer > 0) d.unlockTimer--;
    if (d.openProgress < 1) d.openProgress = Math.min(1, d.openProgress + 0.015);
    d.glow += 0.04;
  }

  _checkDoorEntry() {
    const d = this.exitDoor;
    if (!d || !d.opened || this.doorEntered) return;
    if (d.openProgress < 0.55) return; // wait until partway open
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    if (px > d.x + 20 && px < d.x + d.w - 20 && py > d.y && py < d.y + d.h) {
      this.doorEntered = true;
      this.pause();
      this.particles.burst(px, py, 'ultimate_explosion');
      if (this.callbacks.onFloorComplete) {
        this.callbacks.onFloorComplete({
          floor: this.floor,
          score: this.player.score,
          kills: this.player.kills,
          bestCombo: this.bestCombo,
        });
      }
    }
  }

  _pushBubble(text, speaker, ttl = 180) {
    this.activeBubble = { text, speaker, ttl, age: 0 };
  }

  _updateBubble() {
    if (!this.activeBubble) return;
    this.activeBubble.age++;
    if (this.activeBubble.age >= this.activeBubble.ttl) this.activeBubble = null;
  }

  spawnWave() {
    const floorScale = 1 + (this.floor - 1) * 0.18;
    const isBossFloor = this.floor % 5 === 0;

    if (isBossFloor && this.wave === 1) {
      this.showingBossWarning = true;
      this.pause();
      if (this.callbacks.onBossWarning) this.callbacks.onBossWarning();
      setTimeout(() => {
        this.enemies = [];
        const groundY = this.levelH - 50;
        // Lurker plague-doctor on Floor 5 + every 10 floors after (5, 10, 20, 30…)
        // BossServant alternates on the in-between boss floors (15, 25…) for variety.
        const lurkerEncounter = this.floor === 5 || (this.floor % 10 === 0);
        const boss = lurkerEncounter
          ? new LurkerBoss(this.W / 2 - 40, groundY - 200, floorScale)
          : new BossServant(this.W / 2 - 40, groundY - 300, floorScale);
        this.enemies.push(boss);
        this.bossActive = true;
        this.showingBossWarning = false;
        this.sound.playBossRoar();
        this.sound.setBossMusic(true);
        this.resume();
      }, 3500);
      return;
    }

    const count = Math.floor(2 + this.floor * 0.35 + Math.random() * 2);
    const types = this.getEnemyTypes();
    const groundY = this.levelH - 50;
    const spawnY = groundY - 250;

    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      const side = Math.random() < 0.5;
      const sx = side ? 60 + Math.random() * 200 : this.W - 260 + Math.random() * 200;
      this.spawnEnemy(t, sx, spawnY, floorScale);
    }
  }

  spawnEnemy(type, x, y, scale) {
    let e;
    if (type === 'shadow_demon') e = new ShadowDemon(x, y, scale);
    else if (type === 'void_sprite') e = new VoidSprite(x, y, scale);
    else if (type === 'dimension_watcher') e = new DimensionWatcher(x, y, scale);
    else if (type === 'lurker_cultist') e = new LurkerCultist(x, y, scale);
    else if (type === 'plague_imp') e = new PlagueImp(x, y, scale);
    else if (type === 'shadow_crawler') e = new ShadowCrawler(x, y, scale);
    else if (type === 'ember_wraith') e = new EmberWraith(x, y, scale);
    else if (type === 'bone_howler') e = new BoneHowler(x, y, scale);
    else if (type === 'hex_beast') e = new HexBeast(x, y, scale);
    else e = new ShadowDemon(x, y, scale);
    this.enemies.push(e);
  }

  getEnemyTypes() {
    if (this.floor <= 1) return ['shadow_demon', 'shadow_crawler'];
    if (this.floor <= 2) return ['shadow_demon', 'shadow_crawler', 'plague_imp'];
    if (this.floor <= 3) return ['shadow_demon', 'plague_imp', 'void_sprite', 'shadow_crawler'];
    if (this.floor <= 4) return ['shadow_demon', 'void_sprite', 'ember_wraith', 'plague_imp'];
    if (this.floor <= 6) return ['shadow_demon', 'void_sprite', 'dimension_watcher', 'ember_wraith', 'hex_beast'];
    if (this.floor <= 8) return ['shadow_demon', 'dimension_watcher', 'lurker_cultist', 'bone_howler', 'hex_beast'];
    // Late game: full roster
    return ['shadow_demon', 'void_sprite', 'dimension_watcher', 'lurker_cultist',
            'plague_imp', 'shadow_crawler', 'ember_wraith', 'bone_howler', 'hex_beast'];
  }

  addProjectile(proj) {
    proj.active = true;
    this.projectiles.push(proj);
  }

  generateFloor() {
    const theme = Math.floor((this.floor - 1) / 5) % 4;
    const isBossFloor = this.floor % 5 === 0;

    // Variable level height per floor:
    // boss arenas stay flat 720; intermediate floors vary 720/1080/1440
    const heightOptions = [720, 720, 1080, 1080, 1440];
    this.levelH = isBossFloor ? 720 : heightOptions[Math.floor(Math.random() * heightOptions.length)];
    this.cameraY = Math.max(0, this.levelH - this.H); // start at bottom (player spawns near ground)

    const groundY = this.levelH - 50;
    this.platforms = [
      { x: 0, y: groundY, w: 1280, h: 50, theme }
    ];

    // Always-available bottom platforms (in viewport at start)
    const bottomBand = [
      [200, groundY - 140, 200], [520, groundY - 180, 180],
      [840, groundY - 140, 200], [1060, groundY - 175, 190]
    ];
    // Mid-band positions (relative to ground)
    const midBand = [
      [100, groundY - 280, 170], [380, groundY - 315, 185],
      [680, groundY - 295, 175], [980, groundY - 310, 185]
    ];
    // Upper-band positions
    const upperBand = [
      [270, groundY - 425, 165], [600, groundY - 455, 175], [920, groundY - 415, 170]
    ];

    let positions = [...bottomBand, ...midBand];
    if (this.levelH >= 1080) {
      positions = positions.concat(upperBand);
      // Add extra vertical traversal platforms
      const extraTop = groundY - 600;
      positions.push([200, extraTop, 160], [560, extraTop - 50, 160], [900, extraTop - 20, 160]);
    }
    if (this.levelH >= 1440) {
      // Add a super-high tier
      const topTier = groundY - 850;
      positions.push([320, topTier, 170], [700, topTier - 40, 170], [1020, topTier, 170]);
      const peakTier = groundY - 1100;
      positions.push([480, peakTier, 180], [820, peakTier - 30, 180]);
    }

    const count = Math.min(positions.length, 5 + Math.floor(Math.random() * 4));
    const selected = [...positions].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [x, y, w] of selected) {
      const jx = (Math.random() - 0.5) * 50;
      const jy = (Math.random() - 0.5) * 30;
      const pw = w + (Math.random() - 0.5) * 50;
      this.platforms.push({ x: x + jx - pw / 2, y: y + jy, w: pw, h: 22, theme });
    }

    // Reset door + camera state
    this.exitDoor = null;
    this.doorEntered = false;
  }

  // Spawn the cathedral exit door on the right side of the ground
  _spawnExitDoor() {
    const groundY = this.levelH - 50;
    const doorW = 130;
    const doorH = 200;
    this.exitDoor = {
      x: this.W - doorW - 30,
      y: groundY - doorH,
      w: doorW,
      h: doorH,
      opened: false,        // unlock animation playing or done
      openProgress: 0,      // 0..1 animated opening
      unlockTimer: 0,
      glow: 0,
    };
  }

  advanceFloor(upgradeId) {
    if (upgradeId) {
      const upg = UPGRADES.find(u => u.id === upgradeId);
      if (upg) this.player.applyUpgrade(upg);
    }
    // Floor-clear bonus computation BEFORE we advance counters
    const dmgTaken = this.runStats.damageTakenThisFloor || 0;
    const timeOnFloor = this.runStats.timeOnFloor || 0;
    const tags = [];
    if (dmgTaken === 0) {
      tags.push({ label: 'PERFECT', sub: '+15 shards', color: '#fbbf24' });
      this.runStats.perfectFloors++;
    }
    if (timeOnFloor > 0 && timeOnFloor < 60 * 75) { // < 75s @ 60fps
      tags.push({ label: 'SWIFT', sub: '+10 shards', color: '#00ffcc' });
      this.runStats.swiftFloors++;
    }
    if (this.bestCombo >= 20) {
      tags.push({ label: 'OVERKILL', sub: '+12 shards', color: '#ff3366' });
      this.runStats.overkillFloors++;
    }
    if (tags.length > 0) {
      tags.forEach((t, i) => {
        setTimeout(() => this.pushToast(t.label, t.sub, t.color, 150), i * 250);
      });
    }
    if (this.callbacks.onFloorBonus) this.callbacks.onFloorBonus({ tags, floor: this.floor });

    this.runStats.totalFloorsCleared++;
    this.floor++;
    this.wave = 0;
    const isBossFloor = this.floor % 5 === 0;
    this.maxWaves = isBossFloor ? 1 : (3 + Math.floor(this.floor / 5));
    this.floorCleared = false;
    this.bossActive = false;
    this.gameState = 'playing';
    this.enemies = [];
    this.projectiles = [];
    this.soulSeeds = [];
    this.exitDoor = null;
    this.doorEntered = false;
    this.bestCombo = 0;
    // Reset per-floor stats
    this.runStats.damageTakenThisFloor = 0;
    this.runStats.timeOnFloor = 0;
    this.generateFloor();
    // Spawn player just above the ground at the left
    this.player.x = 200;
    this.player.y = this.levelH - 50 - this.player.h - 200;
    this.player.vx = 0; this.player.vy = 0;
    this.player.floorsCleared++;
    this.cameraY = Math.max(0, this.levelH - this.H);

    // Tell music engine to switch to this biome theme
    const theme = Math.floor((this.floor - 1) / 5) % 4;
    if (this.sound.setMusicTheme) this.sound.setMusicTheme(theme);

    // Floor-start dialogue beat
    this._floorStartDialogue();

    this.resume();
    this.wave = 1;
    this.waveCooldown = 0;
    this.spawnWave();
  }

  _floorStartDialogue() {
    const lines = [
      "Another floor of the Endless.",
      "The plague spreads. We descend.",
      "Sorrow-Eater hungers.",
      "Ava waits. Closer now.",
      "Master Death watches.",
      "The Lurker shifts in its lair.",
      "Worlds collapse beneath my feet.",
      "Souls scream as we approach.",
    ];
    const line = lines[(this.floor - 1) % lines.length];
    this._pushBubble(line, 'maytradalis', 180);
  }

  _updateFlybutt() {
    const p = this.player;
    const side = p.facingRight ? -1 : 1;
    const targetX = p.x + p.w / 2 + side * 50;
    const targetY = p.y - 35;
    this.flybutt.x += (targetX - this.flybutt.x) * 0.06;
    this.flybutt.y += (targetY - this.flybutt.y) * 0.06;
  }

  // Camera follows player vertically inside [0..levelH - H]
  _updateCamera() {
    if (this.levelH <= this.H) {
      this.cameraY = 0;
      return;
    }
    const playerCenterY = this.player.y + this.player.h / 2;
    // Target the camera so the player stays around 60% down the viewport
    let target = playerCenterY - this.H * 0.6;
    target = Math.max(0, Math.min(this.levelH - this.H, target));
    // Smooth follow
    this.cameraY += (target - this.cameraY) * 0.08;
  }

  setTouch(action, value) {
    if (action in this.touchInput) {
      this.touchInput[action] = !!value;
    }
  }

  setupInputs() {
    const onDown = (e) => {
      // Pause toggle on Escape / P
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
        e.preventDefault();
        return;
      }
      this.keysDown.add(e.key);
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onUp = (e) => { this.keysDown.delete(e.key); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    this._cleanupInputs = () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }

  render() {
    this.renderer.render(this.ctx, this);
  }
}
