import LootManager from "../loot/lootManager.js";

const DEFAULT_EFFECT = "normal";

function weightedPick(entries) {
  const total = entries.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) return entries[0]?.id ?? DEFAULT_EFFECT;

  let cursor = Math.random() * total;
  for (const entry of entries) {
    const weight = Math.max(0, entry.weight);
    if (cursor < weight) return entry.id;
    cursor -= weight;
  }
  return entries[entries.length - 1]?.id ?? DEFAULT_EFFECT;
}

export default class DoorEffectsManager {
  constructor() {
    this.effects = new Map();
    this.lastSafeOfferedLevelIndex = -Infinity;
    this.safeCooldownLevels = 4;
    this.lootManager = new LootManager();

    this.registerDefaults();
  }

  registerEffect(id, config) {
    this.effects.set(id, {
      id,
      weight: 1,
      minLevelIndex: 0,
      canAppear: () => true,
      apply: ({ level }) => level,
      ...config,
    });
  }

  registerDefaults() {
    this.registerEffect("normal", {
      weight: 50,
      apply: ({ level }) => level,
    });

    this.registerEffect("greed", {
      weight: 25,
      apply: ({ level }) => {
        const updated = structuredClone(level);
        updated.enemy = Math.max(updated.enemy + 2, Math.floor(updated.enemy * 1.35));
        updated.lootPlan.goldCount = Math.max(
          updated.lootPlan.goldCount + 2,
          Math.floor(updated.lootPlan.goldCount * 1.7),
        );
        updated.lootPlan.nonGoldCount = Math.max(
          updated.lootPlan.nonGoldCount + 1,
          Math.floor(updated.lootPlan.nonGoldCount * 1.3),
        );
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan);
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

    this.registerEffect("hazard", {
      weight: 16,
      apply: ({ level }) => {
        const updated = structuredClone(level);
        updated.levelPlan.trapCount = Math.max(
          updated.levelPlan.trapCount + 2,
          Math.floor(updated.levelPlan.trapCount * 2),
        );
        updated.enemy = Math.max(updated.enemy + 1, Math.floor(updated.enemy * 1.15));
        updated.lootPlan.nonGoldCount = Math.max(
          1,
          Math.floor(updated.lootPlan.nonGoldCount * 1.15),
        );
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan);
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

    this.registerEffect("elite", {
      weight: 12,
      minLevelIndex: 2,
      apply: ({ level }) => {
        const updated = structuredClone(level);
        updated.enemy = Math.max(1, Math.floor(updated.enemy * 0.75));
        updated.protection = (updated.protection ?? 1) + 1;
        updated.strength = (updated.strength ?? 1) + 1;
        updated.lootPlan.nonGoldCount = Math.max(
          updated.lootPlan.nonGoldCount + 1,
          Math.floor(updated.lootPlan.nonGoldCount * 1.2),
        );
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan);
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

    this.registerEffect("swarm", {
      weight: 14,
      apply: ({ level }) => {
        const updated = structuredClone(level);
        updated.enemy = Math.max(updated.enemy + 3, Math.floor(updated.enemy * 1.5));
        updated.protection = Math.max(1, (updated.protection ?? 1) - 1);
        updated.strength = Math.max(1, (updated.strength ?? 1) - 1);
        updated.lootPlan.goldCount = Math.max(
          updated.lootPlan.goldCount + 1,
          Math.floor(updated.lootPlan.goldCount * 1.25),
        );
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan);
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

    this.registerEffect("blacksmith", {
      weight: 10,
      minLevelIndex: 1,
      apply: ({ level }) => {
        const updated = structuredClone(level);
        updated.enemy = Math.max(1, Math.floor(updated.enemy * 1.1));
        updated.lootPlan.nonGoldCount = Math.max(
          updated.lootPlan.nonGoldCount + 2,
          Math.floor(updated.lootPlan.nonGoldCount * 1.35),
        );
        updated.lootPlan.goldCount = Math.max(1, Math.floor(updated.lootPlan.goldCount * 0.8));
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan, {
          weapon: 36,
          armor: 44,
          consumable: 20,
        });
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

    this.registerEffect("safe", {
      weight: 9,
      minLevelIndex: 2,
      canAppear: ({ levelIndex }) =>
        levelIndex - this.lastSafeOfferedLevelIndex >= this.safeCooldownLevels,
      apply: ({ level, levelIndex }) => {
        const updated = structuredClone(level);
        updated.enemy = 0;
        updated.enemyTypes = [];
        updated.levelPlan.trapCount = 0;
        updated.lootPlan.nonGoldCount = 0;
        updated.lootPlan.goldCount = Math.max(1, updated.lootPlan.goldCount + 2);
        updated.lootPlan = this.#rebuildLootPlan(updated.lootPlan);
        updated.countLoot = updated.lootPlan.items.length;
        return updated;
      },
    });

  }

  generateOutDoorEffects({ levelIndex, outDoorsCount }) {
    if (outDoorsCount <= 0) return [];
    const result = ["normal"];
    const shouldForceSpecial = outDoorsCount === 3;

    if (shouldForceSpecial) {
      result.push(this.pickSpecialEffectForLevel(levelIndex));
    }

    while (result.length < outDoorsCount) {
      const nextEffect = this.pickEffectForLevel(levelIndex);
      result.push(nextEffect);
    }

    if (result.includes("safe")) {
      this.lastSafeOfferedLevelIndex = levelIndex;
    }

    return this.#shuffle(result);
  }

  pickEffectForLevel(levelIndex) {
    const available = [...this.effects.values()].filter(
      (effect) =>
        levelIndex >= effect.minLevelIndex && effect.canAppear({ levelIndex }),
    );
    return weightedPick(available);
  }

  pickSpecialEffectForLevel(levelIndex) {
    const available = [...this.effects.values()].filter(
      (effect) =>
        effect.id !== DEFAULT_EFFECT &&
        levelIndex >= effect.minLevelIndex &&
        effect.canAppear({ levelIndex }),
    );
    if (available.length === 0) return DEFAULT_EFFECT;
    return weightedPick(available);
  }

  applyEffectToNextLevel({ effectId, level, levelIndex }) {
    const effect = this.effects.get(effectId) || this.effects.get(DEFAULT_EFFECT);
    return effect.apply({ level, levelIndex, effectId });
  }

  #shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  #rebuildLootPlan(lootPlan, customNonGoldTypeWeights = null) {
    return this.lootManager.buildLootPlan({
      progress: lootPlan.progress ?? 0,
      nonGoldCount: lootPlan.nonGoldCount ?? 0,
      goldCount: lootPlan.goldCount ?? 0,
      nonGoldTypeWeights:
        customNonGoldTypeWeights ??
        this.lootManager.getNonGoldTypeWeights(lootPlan.progress ?? 0),
    });
  }
}
