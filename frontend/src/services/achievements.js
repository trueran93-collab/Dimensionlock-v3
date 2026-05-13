// Achievements registry + tracker.
// Each achievement has an id, label, condition(stats) checker, and a "tier" for the toast color.
// The frontend keeps a sessioned set of unlocked IDs and syncs to MongoDB after game over.

import { saveProgress, fetchProgress } from './progress.js';

export const ACHIEVEMENTS = [
  { id: 'first_blood',  label: 'FIRST BLOOD',   sub: 'Kill your first demon',           color: '#ff3366' },
  { id: 'combo_10',     label: 'CHAINBREAKER',  sub: '10× combo achieved',              color: '#c084fc' },
  { id: 'combo_20',     label: 'SOUL EATER',    sub: '20× combo achieved',              color: '#fbbf24' },
  { id: 'combo_30',     label: 'SS RANK',       sub: '30× combo achieved',              color: '#ff6600' },
  { id: 'floor_3',      label: 'DESCENDING',    sub: 'Reach Floor 3',                   color: '#00ffcc' },
  { id: 'floor_5',      label: 'BOSS SLAYER',   sub: 'Defeat the Lurker Boss',          color: '#fbbf24' },
  { id: 'floor_10',     label: 'VOIDWALKER',    sub: 'Reach Floor 10',                  color: '#a855f7' },
  { id: 'perfect_floor',label: 'UNTOUCHED',     sub: 'Clear a floor without damage',    color: '#fbbf24' },
  { id: 'kill_100',     label: 'CENTURION',     sub: '100 lifetime kills',              color: '#ff3366' },
  { id: 'gold_soul',    label: 'GOLDEN HARVEST',sub: 'Pick up a Gold Soul Seed',        color: '#fbbf24' },
];

class AchievementTracker {
  constructor() {
    this.unlocked = new Set();
    this.pending = [];        // queue of newly-unlocked-this-run, awaiting toast/save
    this._loaded = false;
  }

  // Pull existing unlocked list once per session
  async hydrate() {
    if (this._loaded) return;
    try {
      const p = await fetchProgress();
      this.unlocked = new Set(p?.achievements || []);
    } catch (_) {
      this.unlocked = new Set();
    }
    this._loaded = true;
  }

  reset() {
    this.pending = [];
  }

  // Check stats against each unrealized achievement; push new ones to pending.
  // Returns array of newly-unlocked achievement objects to toast.
  check(stats) {
    const newly = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      if (this._test(ach.id, stats)) {
        this.unlocked.add(ach.id);
        newly.push(ach);
        this.pending.push(ach.id);
      }
    }
    return newly;
  }

  // Predicates per achievement
  _test(id, s) {
    switch (id) {
      case 'first_blood':   return (s.totalKills || 0) >= 1;
      case 'combo_10':      return (s.bestCombo || 0) >= 10;
      case 'combo_20':      return (s.bestCombo || 0) >= 20;
      case 'combo_30':      return (s.bestCombo || 0) >= 30;
      case 'floor_3':       return (s.floor || 0) >= 3;
      case 'floor_5':       return (s.bossKills || 0) >= 1;
      case 'floor_10':      return (s.floor || 0) >= 10;
      case 'perfect_floor': return (s.perfectFloors || 0) >= 1;
      case 'kill_100':      return (s.totalKills || 0) >= 100;
      case 'gold_soul':     return (s.goldSouls || 0) >= 1;
      default: return false;
    }
  }

  async persist() {
    if (this.pending.length === 0) return;
    const toSave = [...this.pending];
    this.pending = [];
    try {
      await saveProgress({ achievements: toSave });
    } catch (_) {/* best-effort */}
  }
}

export const achievementTracker = new AchievementTracker();
