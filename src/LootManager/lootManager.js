import Loot from './loot';
import { getEnemyDropChance, buildEnemyDropItem } from '../runManager/generateLoot';

export default class LootManager {
  constructor(groundLoot, grid, player, levelIndex, difficulty) {
    console.log('лут пришел', groundLoot);
    this.grid = grid;
    this.player = player;
    this.levelIndex = levelIndex;
    this.difficulty = difficulty;
    this.groundLoot = this.#renderLoot(groundLoot);
    console.log('рендер лут', this.groundLoot);
    this.syncVisible();
  }

  #shuffle(list) {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  #renderLoot(loots) {
    const cellsForEnemies = this.#shuffle(this.grid.getLootCells());
    const count = Math.min(loots.length, cellsForEnemies.length);

    return loots.slice(0, count).map((loot, index) => {
      const cell = cellsForEnemies[index];
      return new Loot(cell, {
        ...loot,
      });
    });
  }

  delLoot(loot) {
    if (!loot) return null;
    this.groundLoot = this.groundLoot.filter((lootIn) => lootIn !== loot);
    loot.dispose();
    return loot;
  }

  removeLootAtCell(cell) {
    if (!cell) return null;

    const loot = this.groundLoot.find((item) => cell.id === item.cellPosition.id);
    if (!loot) {
      cell.loot = false;
      return null;
    }

    cell.loot = false;
    return this.delLoot(loot);
  }

  findLoot(cell) {
    console.log('groud loot', this.groundLoot);
    return this.removeLootAtCell(cell);
  }

  #findDropCell(enemyCell) {
    if (!enemyCell) return null;

    if (!enemyCell.loot) {
      return enemyCell;
    }

    const visited = new Set([enemyCell.id]);
    const queue = [enemyCell];

    while (queue.length) {
      const currentCell = queue.shift();
      const nextCells = this.grid.getCellAround(currentCell);

      for (const cell of nextCells) {
        if (visited.has(cell.id)) continue;
        visited.add(cell.id);

        if (!cell.blocked && !cell.enemy && !cell.player && !cell.loot) {
          return cell;
        }

        queue.push(cell);
      }
    }

    return null;
  }

  renderLootAfterDieEnemy(enemies) {
    const dropBonus = this.player?.dropBonus ?? 0;
    const rarityBonus = this.player?.rarityBonus ?? 0;

    enemies.forEach((enemy) => {
      const dropChance = getEnemyDropChance(
        enemy,
        this.levelIndex,
        this.difficulty,
        dropBonus,
      );

      if (Math.random() > dropChance) return;

      const dropCell = this.#findDropCell(enemy.cellPosition);
      if (!dropCell) return;

      dropCell.loot = true;
      const lootData = buildEnemyDropItem(this.levelIndex, rarityBonus);
      const loot = new Loot(dropCell, lootData);
      this.groundLoot.push(loot);
    });

    this.syncVisible();
  }

  syncVisible() {
    this.groundLoot.forEach((loot) => {
      loot.syncVisible();
    });
  }

  syncLighting(playerCell, lightRadius = 4, lightCells = []) {
    if (!playerCell) return;

    const minLight = 0.05;
    const staticLightRadius = 1;
    const staticLightMinLight = 0.1;

    this.groundLoot.forEach((loot) => {
      if (!loot.cellPosition) return;

      const dx = playerCell.col - loot.cellPosition.col;
      const dz = playerCell.row - loot.cellPosition.row;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const playerLight =
        distance <= lightRadius
          ? minLight + (1 - minLight) * (1 - distance / lightRadius)
          : 0;
      const staticLight = this.#isNearLightCell(
        loot.cellPosition,
        lightCells,
        staticLightRadius,
      )
        ? staticLightMinLight
        : 0;

      loot.setLightIntensity(Math.max(playerLight, staticLight));
    });
  }

  #isNearLightCell(cell, lightCells, radius) {
    return lightCells.some((lightCell) => {
      const dx = cell.col - lightCell.col;
      const dz = cell.row - lightCell.row;
      return Math.max(Math.abs(dx), Math.abs(dz)) <= radius;
    });
  }

  dispose() {
    this.groundLoot.forEach((loot) => {
      loot.dispose();
    });
  }
}
