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
- [ ] Mobile portrait canvas size polish (currently leaves dark gap; consider letterbox or 60vh aspect cap)
- [ ] Floor 5 boss redesigned as actual Lurker plague doctor entity (current boss is generic Lurker Servant)
- [ ] Persist high-score leaderboard to backend (MongoDB `/api/scores`)

### P1
- [ ] Story progression: Save Grim Reaper Ava milestone after boss 3
- [ ] More biome variety per theme tier (e.g. floor 11-15 add hellfire ruins enemies)
- [ ] Dialogue beats between floors (Master Death taunts/encourages)
- [ ] Additional ultimate variants unlocked via upgrades

### P2
- [ ] Touch swipe gestures (swipe up to jump, swipe right to dash)
- [ ] Settings menu (volume, controls remap)
- [ ] Achievement system
- [ ] Daily challenge floors

## Lore
> Maytradalis, reaper-in-training, walks the Endless — the space between realities.
> With her fly companion Flybutt and guided by Master Death (living skeleton),
> she must save Grim Reaper Ava from the Lurker — a plague doctor entity.

## Test Results
- iteration_1 (v1.0): Backend 100%, Frontend 100%
- iteration_2 (v1.2): Frontend 100%. Verified: HUD bars (HP/SP/ULT), all mobile-* testids on 390x844, desktop hides controls at 1280x720, soul-seed → ULT charge integration confirmed (0% → 86% via combat), keyboard inputs route correctly, cyberpunk/gothic background visually confirmed. Only minor design polish: mobile portrait canvas centering.
