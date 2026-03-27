export const ENEMY_TYPE_RULES = {
  chaser: {
    hp: 2,
    atk: 2,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: false,
  },
  bruiser: {
    hp: 6,
    atk: 4,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 1,
    hitAndRun: false,
  },
  skirmisher: {
    hp: 2,
    atk: 2,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: true,
  },
  guard: {
    hp: 5,
    atk: 3,
    aggroRange: 4,
    lootDropChance: 0.05,
    guardRange: 4,
    speed: 0,
    windUpTurns: 0,
    hitAndRun: false,
  },
  ambusher: {
    hp: 6,
    atk: 3,
    aggroRange: 4,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: false,
  },
  berserker: {
    hp: 6,
    atk: 4,
    aggroRange: 2,
    lootDropChance: 0.05,
    speed: 1,
    windUpTurns: 0,
    hitAndRun: false,
    randomMove: true,
    windUpTurns: 1,
    allyHitChance: 0.35,
    lootDestroyChance: 0.6,
  },
};

export const ENEMY_LEVEL_SCALING = {
  getEnemyCount(cells, progress) {
    const baseCount = Math.max(1, Math.floor(cells * 0.02));
    const progressBonus = Math.floor(progress * 4);
    const randomBonusChance = 0.45 + progress * 0.3;
    const randomBonus = Math.random() < randomBonusChance ? 1 : 0;
    return baseCount + progressBonus + randomBonus;
  },
  getProtection(progress) {
    return 1 + Math.floor(progress * 2.5);
  },
  getStrength(progress) {
    return 1 + Math.floor(progress * 1.9);
  },
};
