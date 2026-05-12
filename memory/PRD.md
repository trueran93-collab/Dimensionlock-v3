# Dimensionlock: The Endless — PRD

## Overview
Anime-styled fighting roguelike platformer based on the GlobalComix series "Dimensionlock: Deathly Stories".  
Main character: **Maytradalis** — reaper-in-training with purple hair, black gothic dress, and a giant scythe.

## Architecture
- **Frontend**: React + HTML5 Canvas game engine (1280×720)
- **Backend**: FastAPI + MongoDB (leaderboard scores)
- **Game Engine**: Custom class-based engine (`src/game/engine.js`)

## Implemented Features (v1.0 — 2025-02-26)

### Core Game
- Full platformer movement: walk, run, jump, double-jump, dash (with invincibility frames)
- Combat system:
  - Light attack (J/Z): fast scythe slash
  - Heavy attack (K/X): spinning scythe with wide arc
  - Special (L/C): Dark Aura burst (costs 30 SP)
- Combo counter: resets after 1.5s without hits, multiplies damage
- SP bar with passive regeneration
- Spawn invincibility for player

### Roguelike Progression
- Infinite floors, each with 3+ waves of enemies
- Enemies scale in HP/damage/speed with floor number
- 12 upgrades in pool: soul_harvest, deaths_touch, spectral_speed, reapers_reach, grim_resilience, void_hunger, combo_mastery, shadow_step, attack_speed, soul_barrier, lurkers_bane, reapers_fury
- Boss every 5 floors (Lurker's Servant with phase 2 at 50% HP)
- Boss Warning screen with flashing red border

### Enemy Types
1. **Shadow Demon** — jagged dark melee chaser (floors 1+)
2. **Void Sprite** — small fast floating swarm (floors 3+)
3. **Dimension Watcher** — hovering ranged enemy (fires projectiles) (floors 5+)
4. **Lurker Cultist** — plague-doctor themed, teleports (floors 8+)
5. **Boss Servant** — large Lurker avatar with 2 phases, radial projectiles

### UI/UX
- Gothic dark anime aesthetic: deep purple (#0a0a0f) + teal (#00ffcc) + bright purple (#a855f7)
- Fonts: Cormorant Garamond (titles), Outfit (body), JetBrains Mono (HUD)
- Animated main menu with rotating lore lines and starfield
- Upgrade screen with glassmorphism cards (rarity colors)
- Game Over screen with stats

### Backend (FastAPI)
- `GET /api/` — health check
- `GET /api/health` — detailed health
- `POST /api/scores` — submit score
- `GET /api/scores/top` — top 10 leaderboard

## Lore
> Maytradalis, reaper-in-training, walks the Endless — the space between realities.  
> With her fly companion Flybutt and guided by Master Death (living skeleton),  
> she must save Grim Reaper Ava from the Lurker — a plague doctor entity.

## Controls
| Action | Keys |
|--------|------|
| Move | Arrow Keys / WASD |
| Jump / Double Jump | Space / W |
| Dash (i-frames) | Shift |
| Light Attack | J / Z |
| Heavy Attack | K / X |
| Special Attack | L / C |

## Prioritized Backlog

### P0 (Critical for v1.1)
- [ ] Leaderboard display in game over screen
- [ ] Sound effects (scythe swings, hit sounds, jump)
- [ ] More enemy variety and attack patterns

### P1 (Next major)
- [ ] Flybutt companion visual (follows player, comments on combos)
- [ ] Master Death intro cutscene text
- [ ] More boss types (one per floor theme)
- [ ] Character sprite animations (frame-based walk cycle)

### P2 (Polish)
- [ ] Background parallax scrolling
- [ ] More particle effects
- [ ] Game pause functionality
- [ ] Mobile touch controls

## Test Results (iteration_1)
- Backend: 100% pass
- Frontend: 100% pass
- Minor: Deprecated on_event → fixed with lifespan context manager
