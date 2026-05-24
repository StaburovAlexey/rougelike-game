/**
 * Returns light intensity (0–1) for a cell based on distance to player
 * and proximity to static light sources.
 */
export function getLightIntensity(cell, playerCell, lightRadius, lightCells = [], options = {}) {
  const {
    minLight = 0.05,
    staticLightRadius = 1,
    staticLightMinLight = 0.1,
  } = options;

  const dx = playerCell.col - cell.col;
  const dz = playerCell.row - cell.row;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const playerLight =
    distance <= lightRadius
      ? minLight + (1 - minLight) * (1 - distance / lightRadius)
      : 0;
  const staticLight = isNearLightCell(cell, lightCells, staticLightRadius)
    ? staticLightMinLight
    : 0;

  return Math.max(playerLight, staticLight);
}

export function isNearLightCell(cell, lightCells, radius) {
  return lightCells.some((lightCell) => {
    const dx = cell.col - lightCell.col;
    const dz = cell.row - lightCell.row;
    return Math.max(Math.abs(dx), Math.abs(dz)) <= radius;
  });
}

/** Fisher-Yates shuffle (non-mutating). */
export function shuffle(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
