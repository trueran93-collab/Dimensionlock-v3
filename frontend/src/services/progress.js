// Frontend wrapper around /api/progress/* — handles the session_id lifecycle in localStorage.

const STORAGE_KEY = 'dimensionlock_session_id';
const CACHE_KEY   = 'dimensionlock_progress_cache_v1';
const API = process.env.REACT_APP_BACKEND_URL;

// Mirrors backend UNLOCK_COSTS (kept in sync manually — small table)
export const UNLOCK_DEFS = {
  startHpBoost: {
    label: 'Vitality',
    description: '+10 starting Max HP per level',
    icon: '♥',
    color: '#ff3366',
    costs: [25, 60, 120, 200, 320],
    effectPerLevel: 10,    // applied to starting maxHp / hp
  },
  startSpBoost: {
    label: 'Soul Pool',
    description: '+10 starting Max SP per level',
    icon: '✦',
    color: '#00ffcc',
    costs: [20, 45, 90, 150, 240],
    effectPerLevel: 10,
  },
  dashCharges: {
    label: 'Phantom Dash',
    description: '+1 dash charge (chain dashes mid-air)',
    icon: '➤',
    color: '#a855f7',
    costs: [80, 220],
    effectPerLevel: 1,
  },
  ultStart: {
    label: 'Soul Echo',
    description: '+25% starting Ultimate charge per level',
    icon: '☼',
    color: '#fbbf24',
    costs: [40, 100, 180, 280],
    effectPerLevel: 25,
  },
};

function genSessionId() {
  // crypto.randomUUID if available, else timestamp+random fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 11);
}

export function getSessionId() {
  let id = null;
  try { id = localStorage.getItem(STORAGE_KEY); } catch (_) { /* localStorage unavailable */ }
  if (!id) {
    id = genSessionId();
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  }
  return id;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
}

// Returns latest server progress; falls back to cache, then to a zeroed object.
export async function fetchProgress() {
  const sid = getSessionId();
  try {
    const res = await fetch(`${API}/api/progress/${sid}`);
    if (res.ok) {
      const data = await res.json();
      writeCache(data);
      return data;
    }
  } catch (_) { /* offline — fall through */ }
  const cached = readCache();
  if (cached) return cached;
  return {
    session_id: sid,
    death_shards: 0,
    unlocks: { startHpBoost: 0, startSpBoost: 0, dashCharges: 0, ultStart: 0 },
    achievements: [],
    best_run: { floor: 0, score: 0, kills: 0, rank: '—', best_combo: 0 },
    total_runs: 0, total_kills: 0, total_floors_cleared: 0,
  };
}

export async function saveProgress(partial) {
  const sid = getSessionId();
  const payload = { session_id: sid, ...partial };
  try {
    const res = await fetch(`${API}/api/progress/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      writeCache(data);
      return data;
    }
  } catch (_) { /* offline */ }
  // Best-effort local update
  const cached = readCache() || await fetchProgress();
  const merged = { ...cached, ...partial, session_id: sid };
  writeCache(merged);
  return merged;
}

export async function purchaseUnlock(unlockId) {
  const sid = getSessionId();
  const res = await fetch(`${API}/api/progress/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sid, unlock_id: unlockId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Purchase failed (${res.status})`);
  }
  const data = await res.json();
  writeCache(data);
  return data;
}

// Compute the player buff values from current unlock levels.
export function computeStartBuffs(unlocks = {}) {
  const safe = unlocks || {};
  return {
    maxHpBonus: (safe.startHpBoost || 0) * UNLOCK_DEFS.startHpBoost.effectPerLevel,
    maxSpBonus: (safe.startSpBoost || 0) * UNLOCK_DEFS.startSpBoost.effectPerLevel,
    extraDashCharges: (safe.dashCharges || 0) * UNLOCK_DEFS.dashCharges.effectPerLevel,
    ultStartPct: (safe.ultStart || 0) * UNLOCK_DEFS.ultStart.effectPerLevel,
  };
}

// Letter-grade ranking based on final run stats (floor reached + score + kills + combo)
export function computeRank({ floor = 0, score = 0, kills = 0, bestCombo = 0 } = {}) {
  const points =
    floor * 100 +
    Math.floor(score / 50) +
    kills * 8 +
    bestCombo * 12;
  if (points >= 2400) return 'SS';
  if (points >= 1600) return 'S';
  if (points >= 1100) return 'A';
  if (points >= 700)  return 'B';
  if (points >= 400)  return 'C';
  if (points >= 200)  return 'D';
  return 'F';
}

// Death Shards earned from a run (balanced setting)
export function shardsFromRun({ kills = 0, floor = 0, bestCombo = 0, perfectFloors = 0, bossKills = 0 } = {}) {
  return (
    kills * 1 +
    floor * 5 +
    bossKills * 25 +
    perfectFloors * 15 +
    Math.floor(bestCombo / 5) * 2
  );
}
