import { Player, ShadowDemon, VoidSprite, DimensionWatcher, LurkerCultist, BossServant } from './entities.js';
import { ParticleSystem } from './particles.js';
import { UPGRADES } from './upgrades.js';
import { Renderer } from './renderer.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 1280;
    this.H = 720;
    canvas.width = this.W;
    canvas.height = this.H;

    this.keysDown = new Set();
    this.prevKeys = new Set();
    this.justPressed = new Set();

    this.player = new Player(200, 500);
    this.enemies = [];
    this.platforms = [];
    this.projectiles = [];
    this.particles = new ParticleSystem();

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

    this.generateFloor();
  }

  start() {
    this.setupInputs();
    this.running = true;
    this.wave = 1;
    this.spawnWave();
    this.loop();
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  stop() {
    this.running = false;
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

    const keys = {
      left: this.keysDown.has('ArrowLeft') || this.keysDown.has('a') || this.keysDown.has('A'),
      right: this.keysDown.has('ArrowRight') || this.keysDown.has('d') || this.keysDown.has('D'),
      jumpJustPressed: this.justPressed.has(' ') || this.justPressed.has('ArrowUp') || this.justPressed.has('w') || this.justPressed.has('W'),
      dashJustPressed: this.justPressed.has('Shift'),
      lightJustPressed: this.justPressed.has('j') || this.justPressed.has('J') || this.justPressed.has('z') || this.justPressed.has('Z'),
      heavyJustPressed: this.justPressed.has('k') || this.justPressed.has('K') || this.justPressed.has('x') || this.justPressed.has('X'),
      specialJustPressed: this.justPressed.has('l') || this.justPressed.has('L') || this.justPressed.has('c') || this.justPressed.has('C'),
    };

    if (this.player.state !== 'dead') {
      this.player.update(keys, this.platforms, this);
    }

    this.resolveCombat();

    this.enemies.forEach(e => e.update(this.player, this.platforms, this));
    this.enemies = this.enemies.filter(e => !e.dead);

    this.projectiles.forEach(p => this.updateProjectile(p));
    this.projectiles = this.projectiles.filter(p => p.active);

    this.particles.update();
    this.manageWaves();

    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate({
        hp: this.player.hp, maxHp: this.player.maxHp,
        sp: this.player.sp, maxSp: this.player.maxSp,
        combo: this.player.combo,
        floor: this.floor,
        score: this.player.score,
        wave: this.wave,
        maxWaves: this.maxWaves
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
        if (this.callbacks.onComboUpdate) this.callbacks.onComboUpdate(this.player.combo);
      }
    }
  }

  dealEnemyDamage(player, amount, engine) {
    player.takeDamage(amount, engine);
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

    if (this.floorCleared || this.showingBossWarning) return;
    if (this.waveCooldown > 0) { this.waveCooldown--; return; }
    if (this.waveSpawning) return;

    if (this.enemies.length === 0) {
      if (this.wave < this.maxWaves) {
        this.wave++;
        this.waveCooldown = 90;
        this.spawnWave();
      } else {
        this.floorCleared = true;
        this.gameState = 'floor_clear';
        this.pause();
        if (this.callbacks.onFloorClear) this.callbacks.onFloorClear(this.floor);
      }
    }
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
    else e = new ShadowDemon(x, y, scale);
    this.enemies.push(e);
  }

  getEnemyTypes() {
    if (this.floor <= 2) return ['shadow_demon'];
    if (this.floor <= 4) return ['shadow_demon', 'shadow_demon', 'void_sprite'];
    if (this.floor <= 7) return ['shadow_demon', 'void_sprite', 'dimension_watcher'];
    return ['shadow_demon', 'void_sprite', 'dimension_watcher', 'lurker_cultist'];
  }

  addProjectile(proj) {
    proj.active = true;
    this.projectiles.push(proj);
  }

  generateFloor() {
    const theme = Math.floor((this.floor - 1) / 5) % 4;
    this.platforms = [
      { x: 0, y: 670, w: 1280, h: 50, theme }
    ];

    const positions = [
      [200, 530, 200], [520, 490, 180], [840, 530, 200], [1060, 495, 190],
      [100, 390, 170], [380, 355, 185], [680, 375, 175], [980, 360, 185],
      [270, 245, 165], [600, 215, 175], [920, 255, 170]
    ];
    const count = 4 + Math.floor(Math.random() * 3);
    const selected = [...positions].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [x, y, w] of selected) {
      const jx = (Math.random() - 0.5) * 60;
      const jy = (Math.random() - 0.5) * 40;
      const pw = w + (Math.random() - 0.5) * 60;
      this.platforms.push({ x: x + jx - pw / 2, y: y + jy, w: pw, h: 22, theme });
    }
  }

  advanceFloor(upgradeId) {
    if (upgradeId) {
      const upg = UPGRADES.find(u => u.id === upgradeId);
      if (upg) this.player.applyUpgrade(upg);
    }
    this.floor++;
    this.wave = 0;
    this.maxWaves = 3 + Math.floor(this.floor / 5);
    this.floorCleared = false;
    this.bossActive = false;
    this.gameState = 'playing';
    this.enemies = [];
    this.projectiles = [];
    this.generateFloor();
    this.player.x = 200; this.player.y = 400;
    this.player.vx = 0; this.player.vy = 0;
    this.player.floorsCleared++;
    this.resume();
    this.wave = 1;
    this.waveCooldown = 0;
    this.spawnWave();
  }

  setupInputs() {
    const onDown = (e) => {
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
