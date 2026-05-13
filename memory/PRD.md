# Dimensionlock: Deathly Stories — PRD

## Overview
Anime-styled fighting roguelike platformer based on the GlobalComix series "Dimensionlock: Deathly Stories".
Main character: **Maytradalis** — reaper-in-training with purple hair, black gothic dress, and a giant scythe.

## Architecture
- **Frontend**: React + HTML5 Canvas custom game engine (1280×720 design canvas, scales fluidly)
- **Backend**: FastAPI + MongoDB (meta-progression keyed by session_id in localStorage)
- **Game Engine**: Custom class-based engine (`src/game/engine.js`)
- **Sprite system**: 5 hand-drawn sprite sheets, state→{sheet,frame} mapping in `sprites.js`

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

### v1.1 — v1.4
Earlier visual/audio overhaul, intro cutscene removed, mobile UI scaling, 5 new demonic enemy types, Soul Seed/Ultimate, gothic backgrounds (see CHANGELOG entries v1.1-v1.4 in previous PRD revisions).

### v2.0 (2026-02-13) — **Phase 1 + 2 Full Overhaul** *(this session)*

#### P0 — Animated sprite sheets
- **5 sprite sheets** wired into `sprites.js`:
  - `master` 6×6 (idle 0-5, light 12-17, heavy 24-29, spin/ultimate 30-35)
  - `running` 6×6 — *dedicated side-scrolling run cycle for walk + run*
  - `movement` 5×5 (jump/fall row 3, hurt row 4)
  - `death` 4×4 (death animation row 3)
  - `special` 4×4 (special attack)
- `getStateAnimation(state, animFrame, attackTimer, attackType, totalAttack)` → `{sheet, frame}` keeps the renderer branch-free.

#### P0 — Backend meta-progression
- New MongoDB collection `player_progress` keyed by `session_id`.
- Endpoints:
  - `GET  /api/progress/{session_id}` — zeroed for new IDs, no insert until save.
  - `POST /api/progress/save` — additive update; `best_run` only overwrites if higher floor/score.
  - `POST /api/progress/purchase {session_id, unlock_id}` — deducts cost from `UNLOCK_COSTS`.
  - `GET  /api/progress/{session_id}/leaderboard` — top 10 best_runs.
- Pydantic models: `PlayerProgress`, `Unlocks`, `BestRun`, `ProgressSavePayload`, `UnlockPurchasePayload`.
- `UNLOCK_COSTS`: startHpBoost [25,60,120,200,320], startSpBoost [20,45,90,150,240], dashCharges [80,220], ultStart [40,100,180,280].

#### P1 — Visual Juice (Phase 1)
- **Hit-stop** (1-6 frames) on hits, with stronger stops on crits, heavies, and kills.
- **Directional screen-shake** scaled per hit weight, with decay; applied via `ctx.translate` in renderer.
- **Crit system** — 12% base + 4% per 5-combo (cap +20%); 1.75× damage; gold "CRIT" damage numbers.
- **Damage numbers** revamped — colour by type (crit gold / special purple / heavy orange / light white), font scale boost on crit.
- **Enemy death shatter VFX** — rotating shards burst (`particles.shatter()`), colour mapped per enemy type.
- **Combo HUD revamp** — rank letters **D → C → B → A → S → SS** (thresholds 3/6/10/15/22/30) with per-tier colour/glow + scale pop animation.
- **Low-HP pulse** — HP label and bar border flash red at < 30% HP.
- **Full-ULT shine** — ULT bar uses pulsing gradient + READY label when 100%.

#### P1 — Rewarding Gameplay (Phase 2)
- **Main-menu Soul Shop tab** (`UnlocksShop.jsx`) — Death Shards balance card + 4 unlock cards (Vitality, Soul Pool, Phantom Dash, Soul Echo) with level dots, costs, BUY buttons.
- **Start-of-run buffs** — `engine.applyStartBuffs(buffs)` applies +HP / +SP / extra dash charges / starting ULT % at engine boot.
- **Floor-clear bonus tags** — PERFECT (no damage taken this floor), SWIFT (cleared < 75 s), OVERKILL (best combo ≥ 20). Each pushes a toast and grants Death Shards on run end.
- **End-of-run Rank Screen** (`GameOver.jsx` revamped) — letter grade with theme colour, full stats grid (floor/score/kills/best combo), `+N` Death Shards earned card, "NEW PERSONAL BEST" badge when applicable. Saves to `/api/progress/save` automatically.
- **Rare drops** — `_maybeDropRare` rolls 4.5% per enemy (100% on boss) for **Gold Soul Seed** (+250 score, +bonus shards) or **Red Rage Shard** (+50% damage for 10 s with red flash + HUD indicator + persistent pulse).
- **Achievements system** (`services/achievements.js`) — 10 unlocks (FIRST BLOOD, CHAINBREAKER, SOUL EATER, SS RANK, DESCENDING, BOSS SLAYER, VOIDWALKER, UNTOUCHED, CENTURION, GOLDEN HARVEST). Hydrates from MongoDB on load, persists newly-unlocked on game over.
- **Toast overlay** (`ToastOverlay.jsx`) — stacked banner UI for floor-bonus tags, achievements, and rare-drop pickups; fade-in/out with TTL.

## Controls (unchanged)
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
*(All P0 items resolved this session.)*

### P1
- [ ] Floor 5 boss redesigned as actual Lurker plague doctor entity (current is generic Servant)
- [ ] Story progression: Save Grim Reaper Ava milestone after boss 3
- [ ] Per-floor biome enemy weighting (e.g. ember-heavy in hellfire ruins)
- [ ] Dialogue beats between floors (Master Death taunts/encourages)
- [ ] Additional ultimate variants unlocked via upgrades
- [ ] Split `MainMenu.jsx` into BgCanvas + TitleArt + TabPanels modules (currently > 700 lines — flagged again by testing agent)
- [ ] Single source of truth for `UNLOCK_COSTS` (currently mirrored in backend + frontend)
- [ ] `best_run` tie-break: include kills/best_combo when floor+score tie
- [ ] Distinguish purchase errors with 402 (insufficient) vs 409 (maxed) instead of 400

### P2
- [ ] Touch swipe gestures (swipe up to jump, swipe right to dash)
- [ ] Settings menu (volume, controls remap, master volume slider)
- [ ] Daily challenge floors
- [ ] Cross-player leaderboard UI (data exists, no frontend yet)
- [ ] More achievements (combat-style: dash-kill, dash-through-projectile, etc.)
- [ ] Cosmetic unlocks (color tints, scythe trails) bought with Death Shards

## Lore
> Maytradalis, reaper-in-training, walks the Endless — the space between realities.
> With her fly companion Flybutt and guided by Master Death (living skeleton),
> she must save Grim Reaper Ava from the Lurker — a plague doctor entity.

## Test Results
- iteration_1 (v1.0): Backend 100%, Frontend 100%
- iteration_2 (v1.2): Frontend 100% — HUD bars, mobile testids, walk-to-run trail confirmed
- iteration_3 (v1.4): Frontend 100% — new title artwork, 5 new enemies, mobile scaling
- **iteration_4 (v2.0): Backend 14/14 pytest pass, Frontend 100% smoke pass.** Confirmed: zeroed-progress on first load, shard purchase deducts correct cost (25 → balance 500→475), startHpBoost L1 applies +10 HP (100→110), FIRST BLOOD achievement toast surfaces, no console errors.

## Critical Files
- `/app/backend/server.py` — meta-progression API
- `/app/backend/tests/test_progression.py` — backend test harness (added by testing agent)
- `/app/frontend/src/services/progress.js` — session_id + UNLOCK_DEFS + computeRank/shardsFromRun
- `/app/frontend/src/services/achievements.js` — `achievementTracker` singleton
- `/app/frontend/src/game/sprites.js` — 5-sheet sprite system + `getStateAnimation`
- `/app/frontend/src/game/engine.js` — hit-stop, screen-shake, crit, floor bonuses, applyStartBuffs
- `/app/frontend/src/game/particles.js` — shatter shards + crit damage numbers
- `/app/frontend/src/components/UnlocksShop.jsx` — Soul Shop panel
- `/app/frontend/src/components/ToastOverlay.jsx` — toast stack + getComboRank
- `/app/frontend/src/components/GameOver.jsx` — rank screen + auto-persist
- `/app/frontend/src/components/GameCanvas.jsx` — orchestrates progress fetch, buff apply, achievement check
