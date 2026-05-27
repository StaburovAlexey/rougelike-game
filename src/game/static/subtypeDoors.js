const SUBTYPES_DOORS_CHANCES = [
  { type: "normal", chance: 65, minLevel: 0 },
  { type: "chanceGold", chance: 10, minLevel: 0 },
  { type: "chanceLoot", chance: 10, minLevel: 0 },
  { type: "chanceLegendary", chance: 10, minLevel: 4 },
  { type: "noEnemy", chance: 7, minLevel: 0 },
  { type: "shop", chance: 5, minLevel: 2 },
  { type: "hell", chance: 3, minLevel: 6 },
];

function getAvailableTypes(indexLevel, chanceModifiers = {}) {
  return SUBTYPES_DOORS_CHANCES.filter((item) => {
    return indexLevel >= item.minLevel;
  }).map((item) => {
    const extraChance = chanceModifiers[item.type] || 0;

    return {
      ...item,
      chance: Math.max(0, item.chance + extraChance),
    };
  });
}

function getRandomSubType(availableTypes) {
  const totalChance = availableTypes.reduce((sum, item) => {
    return sum + item.chance;
  }, 0);

  if (totalChance <= 0) {
    return "normal";
  }

  let random = Math.random() * totalChance;

  for (const item of availableTypes) {
    random -= item.chance;

    if (random <= 0) {
      return item.type;
    }
  }

  return "normal";
}

const SUBTYPES_DOORS_EFFECTS = {
  normal: {
    effects: [],
  },
  chanceGold: {
    effects: [
      {
        type: "groundLoot",
        category: "gold",
        count: 3,
      },
      { type: "playerModifier", stat: "damagePerTurn", value: 1, roomsLeft: 1 },
    ],
  },
  chanceLoot: {
    effects: [
      {
        type: "groundLoot",
        category: "random",
        count: 3,
        exclude: ["gold", "heal"],
      },
    ],
  },
  chanceLegendary: {
    effects: [
      {
        type: "groundLoot",
        category: "legendary",
        count: 1,
        exclude: ["gold", "heal"],
      },
    ],
  },
  noEnemy: {
    effects: [{ type: "noEnemy" }],
  },
  shop: {
    effects: [{ type: "shopLevel" }],
  },
  hell: {
    effects: [
      { type: "enemyCountMultiplier", value: 2 },
      { type: "extraReward", count: 1 },
    ],
  },
};

export function getDoorEffect(subType) {
  return SUBTYPES_DOORS_EFFECTS[subType] ?? SUBTYPES_DOORS_EFFECTS.normal;
}

export function getSubTypesDoors(doors, indexLevel, chanceModifiers = {}) {
  console.log("модификация от игрока:", chanceModifiers);
  if (doors.length === 0) {
    return [];
  }

  const normalDoorIndex = Math.floor(Math.random() * doors.length);

  const usedSubTypes = new Set();

  return doors.map((door, index) => {
    if (index === normalDoorIndex) {
      return {
        ...door,
        subType: "normal",
      };
    }

    const availableTypes = getAvailableTypes(
      indexLevel,
      chanceModifiers,
    ).filter((item) => {
      if (item.type === "normal") {
        return true;
      }

      return !usedSubTypes.has(item.type);
    });

    const subType = getRandomSubType(availableTypes);

    if (subType !== "normal") {
      usedSubTypes.add(subType);
    }

    return {
      ...door,
      subType,
    };
  });
}
