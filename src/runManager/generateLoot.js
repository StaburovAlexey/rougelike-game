import {
  LOOT_SOURCES,
  buildLootItem,
  getLootRarityWeights,
  getLootTypeWeights,
  pickWeighted,
} from '../static/loot';

// ── утилиты для генерации вражеского дропа «на лету» ─────────────────

export function getEnemyDropChance(enemy, levelIndex, difficulty = 'normal', dropBonus = 0) {
  const rules = { easy: 1.15, normal: 1, hard: 0.85, nightmare: 0.7 };
  const diffMult = rules[difficulty] ?? 1;
  const baseChance =
    typeof enemy.lootDropChance === 'number' ? enemy.lootDropChance : 0;
  const levelBonus = levelIndex * 0.012;
  const eliteBonus =
    Math.max(0, (enemy.hp ?? 0) + (enemy.atk ?? 0) - 6) * 0.004;

  return Math.min(
    0.85,
    (baseChance + levelBonus + eliteBonus) * diffMult * (1 + dropBonus),
  );
}

export function buildLevelRewardItem(levelIndex, rarityBonus = 0) {
  const type =
    pickWeighted(getLootTypeWeights(levelIndex, LOOT_SOURCES.levelReward)) ?? 'gold';

  const weights = getLootRarityWeights(levelIndex, LOOT_SOURCES.levelReward);
  weights.rare = Math.floor(weights.rare * (1 + rarityBonus));
  weights.legendary = Math.floor(weights.legendary * (1 + rarityBonus));
  const rarity = pickWeighted(weights) ?? 'common';

  return buildLootItem({
    type,
    rarity,
    levelIndex,
    source: LOOT_SOURCES.levelReward,
  });
}

export function buildEnemyDropItem(levelIndex, rarityBonus = 0) {
  const type =
    pickWeighted(getLootTypeWeights(levelIndex, LOOT_SOURCES.enemy)) ?? 'gold';

  const weights = getLootRarityWeights(levelIndex, LOOT_SOURCES.enemy);
  weights.rare = Math.floor(weights.rare * (1 + rarityBonus));
  weights.legendary = Math.floor(weights.legendary * (1 + rarityBonus));
  const rarity = pickWeighted(weights) ?? 'common';

  return buildLootItem({
    type,
    rarity,
    levelIndex,
    source: LOOT_SOURCES.enemy,
  });
}

// ── класс для groundLoot / levelReward ──────────────────────────────

export default class GenerateLoot {
  constructor(levelIndex, levelSize, difficulty = 'normal', dropBonus = 0, rarityBonus = 0, rewardBonus = 0) {
    this.levelIndex = levelIndex;
    this.levelSize = levelSize;
    this.difficulty = difficulty;
    this.dropBonus = dropBonus;
    this.rarityBonus = rarityBonus;
    this.difficultyMultiplier = this.#getDifficultyMultiplier(difficulty);

    this.groundLoot = this.#generateGroundLoot();
    this.levelReward = this.#generateLevelReward();
    this.loot = {
      groundLoot: this.groundLoot,
      levelReward: this.levelReward,
    };
  }

  #getDifficultyMultiplier(difficulty) {
    const rules = { easy: 1.15, normal: 1, hard: 0.85, nightmare: 0.7 };
    return rules[difficulty] ?? 1;
  }

  #pickLootType(source) {
    const weights = getLootTypeWeights(this.levelIndex, source);
    return pickWeighted(weights) ?? 'gold';
  }

  #pickLootRarity(source) {
    const weights = getLootRarityWeights(this.levelIndex, source);
    weights.rare = Math.floor(weights.rare * (1 + this.rarityBonus));
    weights.legendary = Math.floor(weights.legendary * (1 + this.rarityBonus));
    return pickWeighted(weights) ?? 'common';
  }

  #buildItem(source) {
    const type = this.#pickLootType(source);
    const rarity = this.#pickLootRarity(source);
    return buildLootItem({
      type,
      rarity,
      levelIndex: this.levelIndex,
      source,
    });
  }

  #getGroundLootCount() {
    const baseCount = 1 + Math.floor(this.levelIndex / 4);
    const extraCount = this.levelIndex >= 6 ? 1 : 0;
    const total = Math.floor(
      (baseCount + extraCount) * this.difficultyMultiplier * (1 + this.dropBonus),
    );
    return Math.max(1, Math.min(total, 4));
  }

  #generateGroundLoot() {
    const count = this.#getGroundLootCount();
    const loot = [];

    for (let i = 0; i < count; i++) {
      loot.push(this.#buildItem(LOOT_SOURCES.ground));
    }

    return loot.filter(Boolean);
  }

  #generateLevelReward() {
    const items = [];

    const reward = this.#buildItem(LOOT_SOURCES.levelReward);
    if (reward) items.push(reward);

    if (this.levelIndex > 0 && this.levelIndex % 5 === 0) {
      const bonusReward = this.#buildItem(LOOT_SOURCES.levelReward);
      if (bonusReward) items.push(bonusReward);
    }

    return items;
  }
}
