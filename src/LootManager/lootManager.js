import Loot from './loot';
import { getEnemyDropChance, buildEnemyDropItem } from '../runManager/generateLoot';
import { getLightIntensity, shuffle } from '../core/lightingUtils';

export default class LootManager {
  constructor(groundLoot, grid, player, levelIndex, difficulty) {
    this.grid = grid;
    this.player = player;
    this.levelIndex = levelIndex;
    this.difficulty = difficulty;
    this.groundLoot = this.#renderLoot(groundLoot);
    this.syncVisible();
  }

  #renderLoot(loots) {
    const cellsForEnemies = shuffle(this.grid.getLootCells());
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

    this.groundLoot.forEach((loot) => {
      if (!loot.cellPosition) return;
      const intensity = getLightIntensity(loot.cellPosition, playerCell, lightRadius, lightCells);
      loot.setLightIntensity(intensity);
    });
  }

  dispose() {
    this.groundLoot.forEach((loot) => {
      loot.dispose();
    });
  }
}
