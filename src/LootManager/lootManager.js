import Loot from './loot';

export default class LootManager {
  constructor(loot, grid) {
    console.log('лут пришел', loot);
    this.grid = grid;
    this.groundLoot = this.#renderLoot(loot.groundLoot);
    this.enemyDrops = loot.enemyDrops;
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
    this.groundLoot = this.groundLoot.filter(
      (lootIn) => loot.id !== lootIn.id,
    );
    loot.dispose();
    return loot;
  }

  removeLootAtCell(cell) {
    if (!cell) return null;

    const loot = this.groundLoot.find((item) => cell.id === item.cellPosition.id);
    if (!loot) return null;

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
    enemies.forEach((enemy) => {
      const isDrop = this.enemyDrops.find((loot) => loot.enemyId === enemy.id);
      const dropCell = this.#findDropCell(enemy.cellPosition);

      if (!isDrop || !dropCell) return;

      dropCell.loot = true;
      const loot = new Loot(dropCell, {
        ...isDrop.loot,
      });
      this.groundLoot.push(loot);
    });

    this.syncVisible();
  }

  syncVisible() {
    this.groundLoot.forEach((loot) => {
      loot.syncVisible();
    });
  }

  dispose() {
    this.groundLoot.forEach((loot) => {
      loot.dispose();
    });
  }
}
