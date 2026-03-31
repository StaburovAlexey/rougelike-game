export const LOOT_SOURCES = {
  enemy: 'enemy',
  ground: 'ground',
  levelReward: 'levelReward',
};

export const LOOT_RARITIES = {
  common: {
    weight: 78,
    multiplier: 1,
    duration: 1,
  },
  rare: {
    weight: 18,
    multiplier: 1.5,
    duration: 2,
  },
  legendary: {
    weight: 4,
    multiplier: 2.5,
    duration: 3,
  },
};

export const LOOT_TYPES = {
  heal: {
    baseWeight: 42,
    growth: 1,
    unlockAt: 0,
    baseValue: 2,
    valueGrowth: 0.25,
    valueCap: 12,
    duration: 0,
    sourceWeights: {
      enemy: 1.25,
      ground: 1.1,
      levelReward: 0.85,
    },
  },
  gold: {
    baseWeight: 46,
    growth: 1.2,
    unlockAt: 0,
    baseValue: 10,
    valueGrowth: 2.75,
    valueCap: 80,
    duration: 0,
    sourceWeights: {
      enemy: 1.5,
      ground: 1,
      levelReward: 1,
    },
  },
  weapon: {
    baseWeight: 14,
    growth: 1.4,
    unlockAt: 2,
    baseValue: 1,
    valueGrowth: 0.45,
    valueCap: 6,
    duration: 1,
    sourceWeights: {
      enemy: 0.85,
      ground: 1.15,
      levelReward: 1.65,
    },
  },
  armor: {
    baseWeight: 14,
    growth: 1.4,
    unlockAt: 3,
    baseValue: 1,
    valueGrowth: 0.45,
    valueCap: 6,
    duration: 1,
    sourceWeights: {
      enemy: 0.85,
      ground: 1.15,
      levelReward: 1.65,
    },
  },
};

export const LOOT_SOURCE_RULES = {
  enemy: {
    rarityBias: 0,
    countBase: 1,
    countGrowth: 0,
    chanceBonus: 0,
  },
  ground: {
    rarityBias: 0.15,
    countBase: 1,
    countGrowth: 0.2,
    chanceBonus: 0.08,
  },
  levelReward: {
    rarityBias: 0.4,
    countBase: 1,
    countGrowth: 0,
    chanceBonus: 0.18,
  },
};

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function pickWeighted(weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (!entries.length || totalWeight <= 0) {
    return null;
  }

  let roll = Math.random() * totalWeight;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }

  return entries[entries.length - 1][0];
}

export function getLootTypeWeights(levelIndex, source = LOOT_SOURCES.ground) {
  return Object.fromEntries(
    Object.entries(LOOT_TYPES).map(([type, rule]) => {
      if (levelIndex < rule.unlockAt) {
        return [type, 0];
      }

      const progression = Math.max(0, levelIndex - rule.unlockAt);
      const sourceWeight = rule.sourceWeights?.[source] ?? 1;
      const weight = (rule.baseWeight + Math.floor(progression * rule.growth)) * sourceWeight;

      return [type, Math.max(0, Math.floor(weight))];
    }),
  );
}

export function getLootRarityWeights(levelIndex, source = LOOT_SOURCES.ground) {
  const sourceRule = LOOT_SOURCE_RULES[source] ?? LOOT_SOURCE_RULES.ground;
  const commonWeight = clamp(
    Math.floor(LOOT_RARITIES.common.weight - levelIndex * 2 - sourceRule.rarityBias * 10),
    8,
    95,
  );
  const rareWeight = clamp(
    Math.floor(LOOT_RARITIES.rare.weight + levelIndex * 1.5 + sourceRule.rarityBias * 8),
    3,
    80,
  );
  const legendaryWeight = clamp(
    Math.floor(LOOT_RARITIES.legendary.weight + Math.floor(levelIndex / 4) + sourceRule.rarityBias * 4),
    1,
    25,
  );

  return {
    common: commonWeight,
    rare: rareWeight,
    legendary: legendaryWeight,
  };
}

export function buildLootItem({
  type,
  rarity,
  levelIndex,
  source = LOOT_SOURCES.ground,
}) {
  const typeRule = LOOT_TYPES[type];
  const rarityRule = LOOT_RARITIES[rarity] ?? LOOT_RARITIES.common;

  if (!typeRule) return null;

  const rawValue =
    typeRule.baseValue + levelIndex * typeRule.valueGrowth;
  const value = clamp(
    Math.round(rawValue * rarityRule.multiplier),
    1,
    typeRule.valueCap,
  );
  const duration =
    type === 'weapon' || type === 'armor'
      ? rarityRule.duration ?? typeRule.duration
      : typeRule.duration;

  return {
    id: `${source}-${type}-${rarity}-${levelIndex}-${Math.floor(
      Math.random() * 1000000,
    )}`,
    source,
    type,
    rarity,
    value,
    duration,
    label: `${rarity} ${type}`,
  };
}
