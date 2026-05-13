// Sprite sheet loader with black-background transparency handling

const MAYTRADALIS_URL = 'https://customer-assets.emergentagent.com/job_anime-deathly-rogue/artifacts/o6f84tbr_sprite-max-px-frames-16-rows-4-cols-4%20%282%29.png';
const LURKER_BOSS_URL = '/sprites/lurker_boss.png';

class SpriteSheet {
  constructor(url, cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.loaded = false;
    this.error = false;
    this.processedCanvas = null;
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
          if (d[i] < 18 && d[i + 1] < 18 && d[i + 2] < 18) {
            d[i + 3] = 0; // transparent
          }
        }
        offCtx.putImageData(imageData, 0, 0);
        this.processedCanvas = off;
        this.loaded = true;
      } catch (e) {
        // CORS or security error - use screen blend mode instead
        this.originalImg = img;
        this.loaded = true;
        this.useFallbackBlend = true;
      }
    };
    img.onerror = () => { this.error = true; };
    img.src = url;
  }

  drawFrame(ctx, frame, dx, dy, dw, dh, flipX = false) {
    if (!this.loaded || this.error) return false;
    const col = frame % this.cols;
    const row = Math.floor(frame / this.cols);
    const sx = col * this.frameW;
    const sy = row * this.frameH;

    ctx.save();
    if (flipX) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      dx = -dx - dw + 0; // adjust: simplify
      // Re-center: dx is now -dx-dw in the flipped space
      ctx.drawImage(
        this.processedCanvas || this.originalImg,
        sx, sy, this.frameW, this.frameH,
        -(dx + dw + dw), dy, dw, dh
      );
    } else {
      ctx.drawImage(
        this.processedCanvas || this.originalImg,
        sx, sy, this.frameW, this.frameH,
        dx, dy, dw, dh
      );
    }
    ctx.restore();
    return true;
  }

  // Simpler flip helper
  draw(ctx, frame, x, y, w, h, flipX = false) {
    if (!this.loaded || this.error) return false;
    const col = frame % this.cols;
    const row = Math.floor(frame / this.cols);
    const sx = col * this.frameW;
    const sy = row * this.frameH;
    const src = this.processedCanvas || this.originalImg;

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
  SPRITES.maytradalis = new SpriteSheet(MAYTRADALIS_URL, 4, 4);
  SPRITES.lurker_boss = new SpriteSheet(LURKER_BOSS_URL, 4, 4);
}

// Map Lurker boss state to sprite frame
export function getLurkerFrame(state, animFrame) {
  switch (state) {
    case 'idle':
      return Math.floor(animFrame / 8) % 4;          // row 0: idle 0-3
    case 'walk':
    case 'chase':
      return 4 + Math.floor(animFrame / 5) % 4;      // row 1: walk 4-7
    case 'attack':
      return 8 + Math.floor(animFrame / 4) % 4;      // row 2: attack 8-11
    case 'special':
    case 'charge':
      return 12 + Math.floor(animFrame / 4) % 4;     // row 3: special 12-15
    default:
      return 0;
  }
}

// Map player state to sprite frame
export function getStateFrame(state, animFrame, attackTimer, attackType) {
  switch (state) {
    case 'idle':
      // Cycle frames 0-1 slowly
      return Math.floor(animFrame / 6) % 2;
    case 'walking':
      // Same frames as running but slower cycle → visually distinct walk pace
      return Math.floor(animFrame / 6) % 4;
    case 'running':
      // Fast cycle frames 0-3
      return Math.floor(animFrame / 3) % 4;
    case 'jumping':
    case 'falling':
      return 1;
    case 'dashing':
      return 3;
    case 'hurt':
      return 2;
    case 'dead':
      return 3;
    case 'attacking_light': {
      // Row 1 (frames 4-7): forward swing
      const progress = (18 - attackTimer) / 18;
      return 4 + Math.min(3, Math.floor(progress * 4));
    }
    case 'attacking_heavy': {
      // Row 2 (frames 8-11): wide spinning attack
      const progress = (34 - attackTimer) / 34;
      return 8 + Math.min(3, Math.floor(progress * 4));
    }
    case 'attacking_special': {
      // Row 3 (frames 12-15): upward sweep / special
      const progress = (42 - attackTimer) / 42;
      return 12 + Math.min(3, Math.floor(progress * 4));
    }
    default:
      return 0;
  }
}
