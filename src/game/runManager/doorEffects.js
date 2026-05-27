import GenerateEnemy from "./generateEnemy";
import { buildLevelRewardItem } from "./generateLoot";
import {
  buildLootItem,
  getLootRarityWeights,
  getLootTypeWeights,
  LOOT_SOURCES,
  pickWeighted,
} from "../static/loot";

function cloneEnemiesWithIds(enemies, startId = 0) {
  return enemies.map((enemy, index) => ({
    ...enemy,
    id: startId + index,
  }));
}

function createEnemies(levelIndex, levelSize, count, startId) {
  const enemyGenerator = new GenerateEnemy(levelIndex, levelSize);
  const sourceEnemies = enemyGenerator.enemies;
  const enemies = [];

  if (sourceEnemies.length === 0) return enemies;

  for (let i = 0; i < Math.max(0, count); i++) {
    enemies.push(sourceEnemies[i % sourceEnemies.length]);
  }

  return cloneEnemiesWithIds(enemies, startId);
}

function createGroundLoot(context, effect) {
  const result = [];
  const count = effect.count ?? 1;

  for (let i = 0; i < count; i++) {
    if (effect.category === "gold" || effect.category === "heal") {
      result.push(
        buildLootItem({
          type: effect.category,
          rarity: "common",
          levelIndex: context.levelIndex,
          source: LOOT_SOURCES.ground,
        }),
      );
      continue;
    }

    const exclude = effect.exclude ?? [];
    const typeWeights = getLootTypeWeights(context.levelIndex, LOOT_SOURCES.ground);
    for (const ex of exclude) {
      typeWeights[ex] = 0;
    }

    const type = pickWeighted(typeWeights) ?? "gold";
    const rarityWeights = getLootRarityWeights(
      context.levelIndex,
      LOOT_SOURCES.ground,
    );
    rarityWeights.rare = Math.floor(
      rarityWeights.rare * (1 + context.player.rarityBonus),
    );
    rarityWeights.legendary = Math.floor(
      rarityWeights.legendary * (1 + context.player.rarityBonus),
    );
    const rarity =
      effect.category === "legendary"
        ? "legendary"
        : pickWeighted(rarityWeights) ?? "common";

    result.push(
      buildLootItem({
        type,
        rarity,
        levelIndex: context.levelIndex,
        source: LOOT_SOURCES.ground,
      }),
    );
  }

  return result.filter(Boolean);
}

const EFFECT_HANDLERS = {
  noEnemy(context) {
    context.enemies = [];
  },

  shopLevel(context) {
    context.enemies = [];
  },

  groundLoot(context, effect) {
    context.groundLoot.push(...createGroundLoot(context, effect));

    if (effect.enemyCount > 0) {
      context.enemies.push(
        ...createEnemies(
          context.levelIndex,
          context.levelSize,
          effect.enemyCount,
          context.enemies.length,
        ),
      );
    }
  },

  enemyCountAdd(context, effect) {
    context.enemies.push(
      ...createEnemies(
        context.levelIndex,
        context.levelSize,
        effect.value ?? effect.count ?? 0,
        context.enemies.length,
      ),
    );
  },

  enemyCountMultiplier(context, effect) {
    const multiplier = Math.max(1, effect.value ?? 1);
    const extraCount = Math.floor(context.enemies.length * (multiplier - 1));

    if (extraCount <= 0) return;

    context.enemies.push(
      ...createEnemies(
        context.levelIndex,
        context.levelSize,
        extraCount,
        context.enemies.length,
      ),
    );
  },

  enemyStatsMultiplier(context, effect) {
    const hp = effect.hp ?? 1;
    const atk = effect.atk ?? 1;
    const def = effect.def ?? 1;

    context.enemies = context.enemies.map((enemy) => ({
      ...enemy,
      hp: Math.max(1, Math.ceil(enemy.hp * hp)),
      atk: Math.max(0, Math.ceil(enemy.atk * atk)),
      def: Math.max(0, Math.ceil((enemy.def ?? 0) * def)),
    }));
  },

  enemyStatsAdd(context, effect) {
    context.enemies = context.enemies.map((enemy) => ({
      ...enemy,
      hp: Math.max(1, enemy.hp + (effect.hp ?? 0)),
      atk: Math.max(0, enemy.atk + (effect.atk ?? 0)),
      def: Math.max(0, (enemy.def ?? 0) + (effect.def ?? 0)),
    }));
  },

  extraReward(context, effect) {
    const count = effect.count ?? 1;
    for (let i = 0; i < count; i++) {
      const item = buildLevelRewardItem(
        context.levelIndex,
        context.player.rarityBonus,
      );
      if (item) context.levelReward.push(item);
    }
  },

  playerModifier(context, effect) {
    context.player.addModifier({
      stat: effect.stat,
      value: effect.value,
      multiplier: effect.multiplier,
      roomsLeft: effect.roomsLeft ?? 1,
      turnsLeft: effect.turnsLeft ?? null,
    });
  },
};

export function applyDoorEffects({
  effectConfig,
  enemies,
  groundLoot,
  levelIndex,
  levelReward,
  levelSize,
  player,
}) {
  const context = {
    enemies: [...enemies],
    groundLoot: [...groundLoot],
    levelIndex,
    levelReward: [...levelReward],
    levelSize,
    player,
  };

  for (const effect of effectConfig?.effects ?? []) {
    const handler = EFFECT_HANDLERS[effect.type];
    if (!handler) {
      console.warn(`Unknown door effect type: ${effect.type}`);
      continue;
    }

    handler(context, effect);
  }

  return {
    enemies: context.enemies,
    groundLoot: context.groundLoot,
    levelReward: context.levelReward,
  };
}
