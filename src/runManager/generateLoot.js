import {
  LOOT_SOURCES,
  buildLootItem,
  getLootRarityWeights,
  getLootTypeWeights,
  pickWeighted,
} from '../static/loot';

export default class GenerateLoot {
  constructor(levelIndex, levelSize, enemies = [], difficulty = 'normal') {
    this.levelIndex = levelIndex;
    this.levelSize = levelSize;
    this.enemies = enemies;
    this.difficulty = difficulty;
    this.difficultyMultiplier = this.#getDifficultyMultiplier(difficulty);

    this.enemyDrops = this.#generateEnemyDrops();
    this.groundLoot = this.#generateGroundLoot();
    this.levelReward = this.#generateLevelReward();
    this.loot = {
      enemyDrops: this.enemyDrops,
      groundLoot: this.groundLoot,
      levelReward: this.levelReward,
    };
  }

  #getDifficultyMultiplier(difficulty) {
    const rules = {
      easy: 1.15,
      normal: 1,
      hard: 0.85,
      nightmare: 0.7,
    };

    return rules[difficulty] ?? 1;
  }

  #pickLootType(source) {
    const weights = getLootTypeWeights(this.levelIndex, source);
    return pickWeighted(weights) ?? 'gold';
  }

  #pickLootRarity(source) {
    const weights = getLootRarityWeights(this.levelIndex, source);
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

  #getEnemyDropChance(enemy) {
    const baseChance =
      typeof enemy.lootDropChance === 'number' ? enemy.lootDropChance : 0;
    const levelBonus = this.levelIndex * 0.012;
    const eliteBonus = Math.max(0, (enemy.hp ?? 0) + (enemy.atk ?? 0) - 6) * 0.004;

    return Math.min(0.85, (baseChance + levelBonus + eliteBonus) * this.difficultyMultiplier);
  }

  #generateEnemyDrops() {
    return this.enemies
      .map((enemy, index) => {
        const dropChance = this.#getEnemyDropChance(enemy);
        const hasDrop = Math.random() <= dropChance;
        if (!hasDrop) return null;

        return {
          enemyId: enemy.id ?? index,
          enemyType: enemy.type,
          dropChance,
          loot: this.#buildItem(LOOT_SOURCES.enemy),
        };
      })
      .filter(Boolean);
  }

  #getGroundLootCount() {
    const baseCount = 1 + Math.floor(this.levelIndex / 4);
    const extraCount = this.levelIndex >= 6 ? 1 : 0;
    const total = Math.floor((baseCount + extraCount) * this.difficultyMultiplier);
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
    const reward = this.#buildItem(LOOT_SOURCES.levelReward);

    if (!reward) return [];

    if (this.levelIndex > 0 && this.levelIndex % 5 === 0) {
      const bonusReward = this.#buildItem(LOOT_SOURCES.levelReward);
      return bonusReward ? [reward, bonusReward] : [reward];
    }

    return [reward];
  }
}
