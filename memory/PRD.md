# Dimensionlock: Deathly Stories — PRD

## Overview
Anime-styled fighting roguelike platformer based on the GlobalComix series "Dimensionlock: Deathly Stories".
Main character: **Maytradalis** — reaper-in-training with purple hair, black gothic dress, and a giant scythe.

## Architecture
- **Frontend**: React + HTML5 Canvas custom game engine (1280×720 design canvas, scales fluidly)
- **Backend**: FastAPI + MongoDB (basic; client-side state currently)
- **Game Engine**: Custom class-based engine (`src/game/engine.js`)

## Implemented Features

### v1.0 (2025-02-26) — Core Roguelike
- Full platformer movement: walk, run, jump, double-jump, dash with i-frames
- Combat: Light (J/Z), Heavy (K/X), Special "Dark Aura" (L/C, 30 SP)
- Combo counter (resets after 1.75s) with damage multiplier
- SP bar with passive regeneration
- Spawn invincibility
- Endless floors, 3+ waves per floor, enemy scaling
- 12 upgrades pool
- Boss every 5 floors (Lurker's Servant, 2 phases)
- Enemy types: Shadow Demon, Void Sprite, Dimension Watcher, Lurker Cultist, Boss Servant

### v1.1 (2025-02-26) — Visual & Audio Overhaul
- Non-pixel high-res Maytradalis sprite (replaced pixel art)
- Intro cinematic with typewriter dialogue (Master Death narration)
- Main menu title reveal with letter-by-letter glow animation
- Flybutt companion (yellow bee) follows player with bobbing animation
- Web Audio API sound system (jump, dash, light/heavy/special attacks, hit, hurt, boss roar, floor clear, upgrade select)

### v1.3 (2026-02-12) — Cinematic & QoL Pass **(this session)**
- **AI-generated single-character cutscenes** — Master Death, Flybutt, and The Lurker portraits generated via Gemini nano-banana (image-to-image with reference sheets) and saved to `/app/frontend/public/intro/`. Maytradalis uses the clean reference asset. Each character now has distinct floating animation:
  - `charFloat` — gentle vertical sway (Maytradalis, Master Death)
  - `flybuttHover` — erratic bee-like 4-point hover with rotation
  - `lurkerWrithe` — squirming skew/scale undulation
- **Single title reveal** — removed intro `title1` / `title2` scenes and the title block from the intro CTA; main menu is now the only place the title is revealed.
- **Sprite facing direction fixed** — flipped boolean in renderer to match facingRight state.
- **Pause menu** — ESC / P key or top-center PAUSE button opens "THE REAPER RESTS / Paused" overlay with Resume + Main Menu buttons.
- **Death screen fix** — engine now ticks `player.deathTimer` even when player is in dead state, so Game Over screen reliably fires with Retry + Main Menu options.
- **Background overhaul (no grid ground)** — removed cyberpunk perspective grid floor; replaced with foreground cyberpunk-gothic city infrastructure: tall apartment blocks with neon window-grid lights, hanging neon signs, blinking red antenna tips, gothic cathedral spires with stained-glass arched windows, and street lampposts with flickering teal bulbs and light cones.
- New backend script: `/app/backend/scripts/generate_intro_chars.py` (idempotent regen of character images).
- **Soul Seed collectibles** — purple/teal floating orbs drop from killed enemies + ambient spawns; magnetize to player on proximity; pickup fills the new Ultimate Charge bar
- **Soul Harvest Ultimate** (key `U` / `R` or ULT button) — when charge bar reaches 100%, triggers a 2.5s spinning scythe whirlwind AoE with full i-frames, deals repeating damage in a 320×280 area around player
- **Ultimate Charge Bar (ULT)** — third HUD bar (yellow gradient when ready, pulsing animation)
- **Running particle trail** — purple ember puffs behind player while running on ground
- **Mobile-friendly touch controls** — fixed-position on-screen buttons (D-pad ◀▶, JUMP, DASH, ULT, LIGHT, HEAVY, DARK AURA). Auto-detected via `ontouchstart`, `maxTouchPoints`, `(pointer: coarse)`, or `innerWidth <= 900`.
- **Cinematic cyberpunk + gothic backgrounds** — parallax cyberpunk skyline with neon windows, gothic cathedral spires with stained-glass arched windows + crosses, floating gargoyle silhouettes, perspective neon grid floor (cyberpunk vanishing point), volumetric ground mist, dimensional rift flicker, vignette overlay. 4 themed color palettes rotate every 5 floors (gothic violet → toxic cyber → hellfire ruins → void blue cathedral).
- New particle presets: `run_trail`, `ultimate_explosion`, `ultimate_spin`, `soul_pickup`
- New sounds: `playSoulPickup`, `playUltimate`

### v1.4 (2026-02-13) — Player Polish & World Depth **(this session)**
- **Intro cutscene removed** — `App.js` boots directly to MainMenu. `IntroCinematic.jsx` deleted.
- **Main Menu redesign** — uses the official "Dimension Lock — Deathly Stories" GlobalComix title artwork (provided by user) with subtle glitch overlay layers, animated title float, and tagline "A GlobalComix Series". Fully responsive: stacks vertically <1024px, scaled fonts/buttons <768px, character art repositions below buttons on mobile.
- **Larger characters** — player hitbox 56×92 (was 44×72), sprite draw size 170 (was 130). Enemy hitboxes proportionally enlarged (~20–25%): ShadowDemon 50×78, VoidSprite 36×36, DimensionWatcher 56×56, LurkerCultist 46×86, BossServant 100×138. Attack hitboxes scaled to match.
- **5 new demonic enemy types**:
  - **Plague Imp** — green goblin with horns + venom drips; winds up & charges
  - **Shadow Crawler** — low spider-like creature, lunges quickly
  - **Ember Wraith** — floating fire ghoul, lobs fire projectiles
  - **Bone Howler** — skeletal summoner, raises arms and spawns Void Sprites
  - **Hex Beast** — horned brute with periodic shield phase (parries + reflects)
- **Interactive backgrounds** — per-floor floating crystals that pulse when player lands a hit (`renderer.pulseNearestCrystal` hook), swaying hanging chains, occasional lightning strikes.
- **Mobile UI scaling fixed** — `GameCanvas` measures container width via `ResizeObserver` and applies `transform: scale(hudScale)` (clamped 0.45–1) to HP/SP/ULT bars, Floor/Score panel, pause button, combo + ultimate text. `MobileControls` adapt button size + edge inset to viewport width.
- **Sound overhaul** — 8 new SFX methods on `soundEngine`: `playHitHeavy` (extra thwack for heavy/ult), `playLand` (jump-landing soft thud), `playBlocked` (parry metallic clink), `playEnemyDeath(type)` (type-specific wail+splat), `playProjectileFire` (fire shoosh), `playEnemyCharge` (rising windup), `playSummon` (eerie chord rise + whoosh), `playUiClick`. Engine wires `playEnemyDeath` to enemy kills, `playHitHeavy` to heavy/ultimate hits, `playLand` to airborne→ground state changes, `playBlocked` to Hex Beast shield blocks.
- **Viewport meta** — `maximum-scale=1, user-scalable=no, viewport-fit=cover` to prevent unintended zoom on mobile.

## Controls (v1.2)
| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move | Arrow / A,D | ◀ ▶ |
| Jump / Double Jump | Space / W | JUMP |
| Dash (i-frames) | Shift | DASH |
| Light Attack | J / Z | LIGHT |
| Heavy Attack | K / X | HEAVY |
| Dark Aura (30 SP) | L / C | DARK |
| Soul Harvest (ULT) | U / R | ULT |

## Prioritized Backlog

### P0
- [x] ~~Remove intro cutscenes — boot straight to menu~~ ✅ v1.4
- [x] ~~Mobile UI scaling — HUD + menu~~ ✅ v1.4
- [ ] Floor 5 boss redesigned as actual Lurker plague doctor entity (current boss is generic Lurker Servant)
- [ ] Persist high-score leaderboard to backend (MongoDB `/api/scores`)
- [ ] Mobile portrait gameplay: shrink dark band above on-screen controls (move canvas to top or letterbox)

### P1
- [ ] Story progression: Save Grim Reaper Ava milestone after boss 3
- [ ] Per-floor biome enemy weighting (e.g. ember-heavy in hellfire ruins, hex/howler-heavy in void blue cathedral)
- [ ] Dialogue beats between floors (Master Death taunts/encourages)
- [ ] Additional ultimate variants unlocked via upgrades
- [ ] Split `MainMenu.jsx` into BgCanvas + TitleArt + TabPanels modules (currently 730 lines)

### P2
- [ ] Touch swipe gestures (swipe up to jump, swipe right to dash)
- [ ] Settings menu (volume, controls remap, master volume slider)
- [ ] Achievement system
- [ ] Daily challenge floors
- [ ] Save/load high-score leaderboard to backend

## Lore
> Maytradalis, reaper-in-training, walks the Endless — the space between realities.
> With her fly companion Flybutt and guided by Master Death (living skeleton),
> she must save Grim Reaper Ava from the Lurker — a plague doctor entity.

## Test Results
- iteration_1 (v1.0): Backend 100%, Frontend 100%
- iteration_2 (v1.2): Frontend 100%. Verified: HUD bars (HP/SP/ULT), all mobile-* testids on 390x844, desktop hides controls at 1280x720, soul-seed → ULT charge integration confirmed (0% → 86% via combat), keyboard inputs route correctly, cyberpunk/gothic background visually confirmed. Only minor design polish: mobile portrait canvas centering.
- iteration_3 (v1.4): Frontend 100%. Verified: no IntroCinematic, new title artwork renders, all menu buttons functional, gameplay works (score 0→384, no console errors), HUD + mobile controls scale at 390x844 and 360x640, 5 new enemy classes + renderer methods + sound methods all present, interactive crystals/chains visible. 0 console errors.
