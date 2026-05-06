export const ENEMY_TYPE_RULES = {
  glot: {
    hp: 10,
    atk: 1,
    def: 0,
    aggroRange: 5,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
  },
  chaser: {
    hp: 2,
    atk: 2,
    def: 0,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: true,
  },
  bruiser: {
    hp: 6,
    atk: 4,
    def: 0,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 1,
    hitAndRun: false,
  },
  skirmisher: {
    hp: 2,
    atk: 2,
    def: 0,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: true,
  },
  guard: {
    hp: 5,
    atk: 3,
    def: 0,
    aggroRange: 4,
    lootDropChance: 0.05,
    aggroRange: 4,
    speed: 0,
    windUpTurns: 0,
    hitAndRun: false,
  },
  ambusher: {
    hp: 6,
    atk: 3,
    def: 0,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: false,
  },
  berserker: {
    hp: 6,
    atk: 4,
    def: 0,
    aggroRange: 2,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: false,
    randomMove: true,
    lootDestroy: true,
    frendlyFire: true,
    allyHitChance: 0.35,
    lootDestroyChance: 0.6,
  },
};

export const ENEMY_SPAWN_RULES = {
  glot: {
    baseWeight: 70,
    unlockAt: 0,
    growth: 0,
  },
  chaser: {
    baseWeight: 50,
    unlockAt: 0,
    growth: 0,
  },
  skirmisher: {
    baseWeight: 22,
    unlockAt: 0,
    growth: 1,
  },
  bruiser: {
    baseWeight: 12,
    unlockAt: 3,
    growth: 2,
  },
  guard: {
    baseWeight: 8,
    unlockAt: 5,
    growth: 2,
  },
  ambusher: {
    baseWeight: 7,
    unlockAt: 7,
    growth: 3,
  },
  berserker: {
    baseWeight: 3,
    unlockAt: 10,
    growth: 4,
  },
};

export const ENEMY_PROGRESS_RULES = {
  glot: {
    hpGrowth: 0.1,
    atkGrowth: 0.06,
    hpBonusCap: 2,
    atkBonusCap: 1,
  },
  chaser: {
    hpGrowth: 0.15,
    atkGrowth: 0.12,
    hpBonusCap: 3,
    atkBonusCap: 3,
  },
  skirmisher: {
    hpGrowth: 0.14,
    atkGrowth: 0.13,
    hpBonusCap: 3,
    atkBonusCap: 3,
  },
  bruiser: {
    hpGrowth: 0.22,
    atkGrowth: 0.18,
    hpBonusCap: 5,
    atkBonusCap: 5,
  },
  guard: {
    hpGrowth: 0.26,
    atkGrowth: 0.14,
    hpBonusCap: 6,
    atkBonusCap: 4,
  },
  ambusher: {
    hpGrowth: 0.18,
    atkGrowth: 0.2,
    hpBonusCap: 4,
    atkBonusCap: 5,
  },
  berserker: {
    hpGrowth: 0.24,
    atkGrowth: 0.24,
    hpBonusCap: 5,
    atkBonusCap: 6,
  },
};

function getProgressRule(type) {
  return ENEMY_PROGRESS_RULES[type] ?? ENEMY_PROGRESS_RULES.chaser;
}

export function getEnemyProgressStats(type, progress) {
  const rule = getProgressRule(type);
  const baseStats = ENEMY_TYPE_RULES[type] ?? ENEMY_TYPE_RULES.chaser;
  const hpBonus = Math.min(
    rule.hpBonusCap,
    Math.floor(progress * rule.hpGrowth),
  );
  const atkBonus = Math.min(
    rule.atkBonusCap,
    Math.floor(progress * rule.atkGrowth),
  );
  return {
    hp: baseStats.hp + hpBonus,
    atk: baseStats.atk + atkBonus,
  };
}

export function getEnemySpawnWeights(progress) {
  return Object.fromEntries(
    Object.entries(ENEMY_SPAWN_RULES).map(([type, rule]) => {
      if (progress < rule.unlockAt) {
        return [type, 0];
      }

      const weight =
        rule.baseWeight + Math.floor((progress - rule.unlockAt) * rule.growth);
      return [type, Math.max(0, weight)];
    }),
  );
}

export function pickWeightedEnemyType(weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (!entries.length || totalWeight <= 0) {
    return 'chaser';
  }

  let roll = Math.random() * totalWeight;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }

  return entries[entries.length - 1][0];
}

export const ENEMY_LEVEL_SCALING = {
  getEnemyCount(cells, progress) {
    const baseCount = Math.max(1, Math.floor(cells * 0.025));
    const progressBonus = Math.floor(progress * 0.25);
    const expectedCount = baseCount + progressBonus;

    const spread = Math.max(1, Math.round(expectedCount * 0.2));
    const randomCount =
      expectedCount + Math.floor(Math.random() * (spread * 2 + 1)) - spread;

    const minAllowedCount = 1;
    const maxAllowedCount = Math.max(2, Math.floor(cells * 0.1));

    return Math.min(Math.max(randomCount, minAllowedCount), maxAllowedCount);
  },
  getHp(progress, type = 'chaser') {
    return getEnemyProgressStats(type, progress).hp;
  },
  getAtk(progress, type = 'chaser') {
    return getEnemyProgressStats(type, progress).atk;
  },
};
