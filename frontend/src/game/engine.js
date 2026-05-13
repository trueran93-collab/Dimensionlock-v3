import { Player, ShadowDemon, VoidSprite, DimensionWatcher, LurkerCultist, BossServant, SoulSeed, PlagueImp, ShadowCrawler, EmberWraith, BoneHowler, HexBeast } from './entities.js';
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

    this.callbacks = callbacks;
    this.renderer = new Renderer();
    this.sound = soundEngine;

    // Flybutt companion
    this.flybutt = { x: 200, y: 400, wingAngle: 0 };
    this._prevPlayerState = 'idle';

    initSprites();
    this.generateFloor();
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
      const seed = new SoulSeed(sx, 80, 6);
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

    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate({
        hp: this.player.hp, maxHp: this.player.maxHp,
        sp: this.player.sp, maxSp: this.player.maxSp,
        combo: this.player.combo,
        floor: this.floor,
        score: this.player.score,
        wave: this.wave,
        maxWaves: this.maxWaves,
        ultimateCharge: this.player.ultimateCharge,
        maxUltimateCharge: this.player.maxUltimateCharge,
        ultimateActive: this.player.ultimateActive,
        dashCooldown: this.player.dashCooldown,
        spReady: this.player.sp >= 30
      });
    }
  }

  updateProjectile(proj) {
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    if (!proj.active) return;
    if (proj.life <= 0 || proj.x < 0 || proj.x > this.W || proj.y < 0 || proj.y > this.H) {
      proj.active = false;
      return;
    }

    if (proj.owner === 'enemy') {
      // Check vs player
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
      const didHit = enemy.takeDamage(hitbox.damage, kbDir * Math.abs(kb), this, this.player.hasLurkersBane);

      if (didHit) {
        this.player.hitEnemiesThisSwing.add(enemy);
        this.player.registerHit(enemy);
        this.particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 3, 'void_hit');
        this.particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 3, 'sparks');
        this.particles.addDamageNumber(enemy.x + enemy.w / 2, enemy.y, hitbox.damage, hitbox.type);
        // Pulse nearest background crystal for an interactive feel
        if (this.renderer && this.renderer.pulseNearestCrystal) {
          this.renderer.pulseNearestCrystal(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
        }
        // Different hit sound per damage tier
        if (hitbox.type === 'heavy' || hitbox.type === 'ultimate') {
          this.sound.playHitHeavy && this.sound.playHitHeavy();
        } else {
          this.sound.playHit();
        }
        // Death sound
        if (enemy.dead && this.sound.playEnemyDeath) {
          this.sound.playEnemyDeath(enemy.type);
        }
        if (this.callbacks.onComboUpdate) this.callbacks.onComboUpdate(this.player.combo);
      } else {
        // Hit but blocked (e.g. HexBeast shield)
        if (this.sound.playBlocked) this.sound.playBlocked();
        this.particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 3, 'sparks');
      }
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
          this.callbacks.onGameOver({ floor: this.floor, score: this.player.score, kills: this.player.kills });
        }
      }
      return;
    }

    // Track best combo for floor-complete display
    if (this.player.combo > this.bestCombo) this.bestCombo = this.player.combo;

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
        const boss = new BossServant(this.W / 2 - 40, 100, floorScale);
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

    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      const side = Math.random() < 0.5;
      const sx = side ? 60 + Math.random() * 200 : this.W - 260 + Math.random() * 200;
      this.spawnEnemy(t, sx, 50, floorScale);
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
