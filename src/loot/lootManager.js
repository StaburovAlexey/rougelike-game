const RARITY_COMMON = "common";
const RARITY_EPIC = "epic";
const RARITY_LEGENDARY = "legendary";

const ARMOR_SLOTS = ["helmet", "chest", "gloves", "boots", "cloak"];
const MELEE_WEAPONS = ["sword", "axe", "mace", "spear", "dagger"];
const CONSUMABLES = ["hp_potion", "bomb"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  if (total <= 0) return entries[0]?.[0] ?? null;

  let cursor = Math.random() * total;
  for (const [key, weight] of entries) {
    const safeWeight = Math.max(0, weight);
    if (cursor < safeWeight) return key;
    cursor -= safeWeight;
  }

  return entries[entries.length - 1]?.[0] ?? null;
}

function rarityMultiplier(rarity) {
  if (rarity === RARITY_LEGENDARY) return 2.2;
  if (rarity === RARITY_EPIC) return 1.5;
  return 1;
}

export default class LootManager {
  getLootPlanForLevel({ levelIndex, totalLevels, cols, rows }) {
    const progress = totalLevels <= 1 ? 1 : levelIndex / (totalLevels - 1);
    const cells = cols * rows;
    const baseNonGoldCount = Math.max(1, Math.floor(cells * 0.009));
    const nonGoldBonusByProgress = Math.floor(progress * 2);
    const nonGoldRandomBonus = Math.random() < 0.3 + progress * 0.2 ? 1 : 0;
    const nonGoldCount =
      baseNonGoldCount + nonGoldBonusByProgress + nonGoldRandomBonus;

    const baseGoldCount = Math.max(1, Math.floor(cells * 0.0035));
    const goldBonusByProgress = Math.floor(progress * 4);
    const goldRandomBonus = Math.random() < 0.4 + progress * 0.35 ? 1 : 0;
    const goldCount = baseGoldCount + goldBonusByProgress + goldRandomBonus;

    const rarityWeights = {
      [RARITY_COMMON]: 84 - 36 * progress,
      [RARITY_EPIC]: 14 + 23 * progress,
      [RARITY_LEGENDARY]: 2 + 13 * progress,
    };

    const nonGoldTypeWeights = {
      weapon: 18 + 16 * progress,
      armor: 22 + 20 * progress,
      consumable: 30 - 8 * progress,
    };

    const nonGoldItems = [];
    for (let i = 0; i < nonGoldCount; i++) {
      const lootType = weightedPick(nonGoldTypeWeights);
      const rarity = weightedPick(rarityWeights) ?? RARITY_COMMON;
      nonGoldItems.push(this.#createItem({ lootType, rarity, progress }));
    }

    const goldItems = [];
    for (let i = 0; i < goldCount; i++) {
      const rarity = weightedPick(rarityWeights) ?? RARITY_COMMON;
      goldItems.push(this.#createItem({ lootType: "gold", rarity, progress }));
    }
    const items = [...nonGoldItems, ...goldItems];

    return {
      count: items.length,
      nonGoldCount,
      goldCount,
      progress,
      items,
      weights: {
        rarity: rarityWeights,
        nonGoldType: nonGoldTypeWeights,
      },
    };
  }

  #createItem({ lootType, rarity, progress }) {
    const mult = rarityMultiplier(rarity);

    if (lootType === "weapon") {
      const subType = MELEE_WEAPONS[Math.floor(Math.random() * MELEE_WEAPONS.length)];
      return {
        lootType,
        subType,
        rarity,
        attack: Math.max(1, Math.round((2 + progress * 4) * mult)),
      };
    }

    if (lootType === "armor") {
      const subType = ARMOR_SLOTS[Math.floor(Math.random() * ARMOR_SLOTS.length)];
      return {
        lootType,
        subType,
        rarity,
        defense: Math.max(1, Math.round((1 + progress * 3) * mult)),
      };
    }

    if (lootType === "consumable") {
      const subType = CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)];
      if (subType === "hp_potion") {
        return {
          lootType,
          subType,
          rarity,
          heal: Math.max(1, Math.round((3 + progress * 5) * mult)),
        };
      }

      return {
        lootType,
        subType,
        rarity,
        damage: Math.max(1, Math.round((3 + progress * 6) * mult)),
      };
    }

    return {
      lootType: "gold",
      subType: "gold",
      rarity,
      amount: Math.max(1, Math.round((8 + progress * 18) * mult)),
    };
  }
}

export { clamp, RARITY_COMMON, RARITY_EPIC, RARITY_LEGENDARY };
