export const UPGRADES = [
  {
    id: 'soul_harvest',
    name: 'Soul Harvest',
    description: 'Restore 20% of max HP',
    flavor: 'The souls of the fallen sustain the Reaper',
    rarity: 'common',
    color: '#ff3366',
    icon: 'heart'
  },
  {
    id: 'deaths_touch',
    name: "Death's Touch",
    description: '+15% Attack Damage',
    flavor: 'Every swing carries the weight of the Endless',
    rarity: 'common',
    color: '#a855f7',
    icon: 'sword'
  },
  {
    id: 'spectral_speed',
    name: 'Spectral Speed',
    description: '+20% Movement Speed',
    flavor: 'Between dimensions, speed is survival',
    rarity: 'common',
    color: '#00ffcc',
    icon: 'zap'
  },
  {
    id: 'reapers_reach',
    name: "Reaper's Reach",
    description: '+30% Attack Range',
    flavor: 'The scythe hungers for a wider harvest',
    rarity: 'uncommon',
    color: '#7c3aed',
    icon: 'expand'
  },
  {
    id: 'grim_resilience',
    name: 'Grim Resilience',
    description: '+25% Max HP & restore 25 HP',
    flavor: "Master Death's training forged an iron will",
    rarity: 'uncommon',
    color: '#dc2626',
    icon: 'shield'
  },
  {
    id: 'void_hunger',
    name: 'Void Hunger',
    description: 'Restore 6 HP on every kill',
    flavor: 'Life feeds on death in the Endless',
    rarity: 'uncommon',
    color: '#059669',
    icon: 'droplets'
  },
  {
    id: 'combo_mastery',
    name: 'Combo Mastery',
    description: 'Double combo damage multiplier',
    flavor: "Flybutt spots every weakness in the enemy",
    rarity: 'rare',
    color: '#f59e0b',
    icon: 'star'
  },
  {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Dash cooldown reduced by 40%',
    flavor: 'Slip between shadows like Master Death taught',
    rarity: 'rare',
    color: '#1d4ed8',
    icon: 'wind'
  },
  {
    id: 'attack_speed',
    name: 'Rapid Harvest',
    description: '+30% Attack Speed',
    flavor: 'The scythe becomes a blur of death',
    rarity: 'uncommon',
    color: '#ea580c',
    icon: 'timer'
  },
  {
    id: 'soul_barrier',
    name: 'Soul Barrier',
    description: '+10% Max HP, +15% Max SP',
    flavor: 'The boundary between life and death strengthens',
    rarity: 'rare',
    color: '#6d28d9',
    icon: 'gem'
  },
  {
    id: 'lurkers_bane',
    name: "Lurker's Bane",
    description: 'Attacks inflict poison (5 dmg/sec)',
    flavor: 'Turn the Lurker\'s dark gifts against its servants',
    rarity: 'rare',
    color: '#16a34a',
    icon: 'flask'
  },
  {
    id: 'reapers_fury',
    name: "Reaper's Fury",
    description: '+20% damage at low HP (below 30%)',
    flavor: 'Desperation unlocks the true power of a Reaper',
    rarity: 'uncommon',
    color: '#b91c1c',
    icon: 'flame'
  }
];

export function getRandomUpgrades(count = 3, exclude = []) {
  const pool = UPGRADES.filter(u => !exclude.includes(u.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}
