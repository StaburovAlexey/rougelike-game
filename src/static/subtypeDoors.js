const SUBTYPES_DOORS_CHANCES = [
  { type: "normal", chance: 60, minLevel: 0 },
  { type: "gold", chance: 10, minLevel: 0 },
  { type: "chanceLoot", chance: 10, minLevel: 0 },
  { type: "chanceLegendary", chance: 10, minLevel: 4 },
  { type: "noEnemy", chance: 7, minLevel: 0 },
  { type: "shop", chance: 5, minLevel: 5 },
  { type: "hell", chance: 5, minLevel: 6 },
];

function getRandomSubType(indexLevel) {
  const availableTypes = SUBTYPES_DOORS_CHANCES.filter((item) => {
    return indexLevel >= item.minLevel;
  });

  const totalChance = availableTypes.reduce((sum, item) => {
    return sum + item.chance;
  }, 0);

  let random = Math.random() * totalChance;

  for (const item of availableTypes) {
    random -= item.chance;

    if (random <= 0) {
      return item.type;
    }
  }

  return "normal";
}

export function getSubTypesDoors(doors, indexLevel) {
  const withoutInDoorRole = doors.filter((door) => door.doorRole === "out");
  if (withoutInDoorRole.length === 0) {
    return [];
  }

  const doorsWithTypes = withoutInDoorRole.map((door) => {
    return {
      ...door,
      subType: getRandomSubType(indexLevel),
    };
  });

  const hasNormalDoor = doorsWithTypes.some((door) => {
    return door.subType === "normal";
  });

  if (!hasNormalDoor) {
    const randomIndex = Math.floor(Math.random() * doorsWithTypes.length);

    doorsWithTypes[randomIndex] = {
      ...doorsWithTypes[randomIndex],
      subType: "normal",
    };
  }

  return doorsWithTypes;
}
