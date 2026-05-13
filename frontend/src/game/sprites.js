// Sprite sheet loader with black-background → alpha conversion + multi-sheet state mapping
//
// Five hand-drawn Maytradalis sprite sheets are mounted as separate sheets, each
// covering a subset of states. `getStateAnimation` returns { sheet, frame } so the
// renderer can call the correct sheet without branching everywhere.

const MASTER_6x6  = 'https://customer-assets.emergentagent.com/job_game-review-hub-12/artifacts/xmqh6otr_sprite-max-px-frames-36-rows-6-cols-6.png';
const RUNNING_6x6 = 'https://customer-assets.emergentagent.com/job_game-review-hub-12/artifacts/q9iiew70_Side-scrolling-pixel-art-sprite-of-a-purple-haired-max-px-frames-36-rows-6-cols-6%20%283%29.png';
const MOVEMENT_5x5 = 'https://customer-assets.emergentagent.com/job_game-review-hub-12/artifacts/7amh02gf_sprite-max-px-frames-25-rows-5-cols-5.png';
const DEATH_4x4    = 'https://customer-assets.emergentagent.com/job_game-review-hub-12/artifacts/bghnblwz_sprite-max-px-frames-16-rows-4-cols-4%20%281%29.png';
const SPECIAL_4x4  = 'https://customer-assets.emergentagent.com/job_game-review-hub-12/artifacts/xb7rli97_sprite-max-px-frames-16-rows-4-cols-4%20%283%29.png';
const LURKER_BOSS_URL = '/sprites/lurker_boss.png';

class SpriteSheet {
  constructor(url, cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.loaded = false;
    this.error = false;
    this.processedCanvas = null;
    this.originalImg = null;
    this.frameW = 0;
    this.frameH = 0;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.frameW = img.width / cols;
      this.frameH = img.height / rows;
      // Process: remove black background by making near-black pixels transparent
      const off = document.createElement('canvas');
      off.width = img.width;
      off.height = img.height;
      const offCtx = off.getContext('2d');
      offCtx.drawImage(img, 0, 0);
      try {
        const imageData = offCtx.getImageData(0, 0, off.width, off.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          // Slightly more aggressive black-to-alpha: any near-black pixel
          if (d[i] < 22 && d[i + 1] < 22 && d[i + 2] < 22) {
            d[i + 3] = 0;
          }
        }
        offCtx.putImageData(imageData, 0, 0);
        this.processedCanvas = off;
        this.loaded = true;
      } catch (e) {
        // CORS-tainted — fall back to drawing the raw image (looks worse but works)
        this.originalImg = img;
        this.loaded = true;
        this.useFallbackBlend = true;
      }
    };
    img.onerror = () => { this.error = true; };
    img.src = url;
  }

  draw(ctx, frame, x, y, w, h, flipX = false) {
    if (!this.loaded || this.error) return false;
    // Clamp frame to bounds
    const total = this.cols * this.rows;
    const f = ((frame % total) + total) % total;
    const col = f % this.cols;
    const row = Math.floor(f / this.cols);
    const sx = col * this.frameW;
    const sy = row * this.frameH;
    const src = this.processedCanvas || this.originalImg;
    if (!src) return false;

    ctx.save();
    if (flipX) {
      ctx.scale(-1, 1);
      ctx.drawImage(src, sx, sy, this.frameW, this.frameH, -(x + w), y, w, h);
    } else {
      ctx.drawImage(src, sx, sy, this.frameW, this.frameH, x, y, w, h);
    }
    ctx.restore();
    return true;
  }
}

export const SPRITES = {};

export function initSprites() {
  SPRITES.master   = new SpriteSheet(MASTER_6x6, 6, 6);     // idle / light / heavy / spin-ultimate
  SPRITES.running  = new SpriteSheet(RUNNING_6x6, 6, 6);    // dedicated walk + run cycle (36 frames)
  SPRITES.movement = new SpriteSheet(MOVEMENT_5x5, 5, 5);   // jump / fall / hurt fallbacks
  SPRITES.death    = new SpriteSheet(DEATH_4x4, 4, 4);      // death (row 3) + low-sweep (row 2)
  SPRITES.special  = new SpriteSheet(SPECIAL_4x4, 4, 4);    // alternative special-attack
  SPRITES.lurker_boss = new SpriteSheet(LURKER_BOSS_URL, 4, 4);
  // Legacy alias — some old renderer code references SPRITES.maytradalis
  SPRITES.maytradalis = SPRITES.master;
}

// Boss frame mapping (unchanged)
export function getLurkerFrame(state, animFrame) {
  switch (state) {
    case 'idle':                return Math.floor(animFrame / 8) % 4;
    case 'walk':
    case 'chase':               return 4 + Math.floor(animFrame / 5) % 4;
    case 'attack':              return 8 + Math.floor(animFrame / 4) % 4;
    case 'special':
    case 'charge':              return 12 + Math.floor(animFrame / 4) % 4;
    default:                    return 0;
  }
}

// ── Per-state animation mapping ────────────────────────────────────────────
// Each entry → { sheet: SPRITES.<key>, frame: int }
// `attackProgress` is 0..1 for attack states (used to advance through the swing).
export function getStateAnimation(state, animFrame, attackTimer, attackType, totalAttack = 0) {
  // Convenience helpers
  const cycle = (start, count, divisor) =>
    start + (Math.floor(animFrame / divisor) % count);

  switch (state) {
    case 'idle':
      // master 6x6 row 0 (frames 0-5) — slow idle sway
      return { sheet: 'master', frame: cycle(0, 6, 9) };

    case 'walking':
      // running 6x6 sheet — slower cycle (frames 0..35 stepped slowly)
      return { sheet: 'running', frame: Math.floor(animFrame / 7) % 36 };

    case 'running':
      // running 6x6 sheet — full 36-frame cycle, fast advance
      return { sheet: 'running', frame: Math.floor(animFrame / 3) % 36 };

    case 'jumping':
      // movement 5x5 row 3 (frames 15-19) — first half (ascending)
      return { sheet: 'movement', frame: 15 + Math.floor(animFrame / 5) % 2 };

    case 'falling':
      // movement 5x5 row 3 (frames 15-19) — second half (descending)
      return { sheet: 'movement', frame: 17 + Math.floor(animFrame / 5) % 2 };

    case 'dashing':
      // movement row 3 frame 18 — leaping forward pose
      return { sheet: 'movement', frame: 18 };

    case 'hurt':
      // movement 5x5 row 4 (frames 20-24) — cycle through hurt
      return { sheet: 'movement', frame: 20 + Math.floor(animFrame / 4) % 3 };

    case 'dead':
      // death sheet 4x4 row 3 (frames 12-15) — non-looping (advance with animFrame, clamp)
      return { sheet: 'death', frame: 12 + Math.min(3, Math.floor(animFrame / 8)) };

    case 'attacking_light': {
      // master 6x6 row 2 (frames 12-17) — light attack
      const total = totalAttack || 18;
      const progress = Math.max(0, Math.min(1, (total - attackTimer) / total));
      return { sheet: 'master', frame: 12 + Math.min(5, Math.floor(progress * 6)) };
    }

    case 'attacking_heavy': {
      // master 6x6 row 4 (frames 24-29) — heavy attack
      const total = totalAttack || 34;
      const progress = Math.max(0, Math.min(1, (total - attackTimer) / total));
      return { sheet: 'master', frame: 24 + Math.min(5, Math.floor(progress * 6)) };
    }

    case 'attacking_special': {
      // special 4x4 (whole sheet) — purple aura special attack
      const total = totalAttack || 42;
      const progress = Math.max(0, Math.min(1, (total - attackTimer) / total));
      return { sheet: 'special', frame: Math.min(15, Math.floor(progress * 16)) };
    }

    case 'ultimate': {
      // master 6x6 row 5 (frames 30-35) — spin attack, fast cycle
      return { sheet: 'master', frame: 30 + Math.floor(animFrame / 3) % 6 };
    }

    default:
      return { sheet: 'master', frame: 0 };
  }
}

// Legacy export kept for any leftover callers — returns just a frame index
// against the legacy `maytradalis` (now == master 6x6) sheet.
export function getStateFrame(state, animFrame, attackTimer, attackType) {
  const anim = getStateAnimation(state, animFrame, attackTimer, attackType);
  return anim.frame;
}
