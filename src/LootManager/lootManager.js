import Loot from './loot';
export default class LootManager {
  constructor(loot, grid) {
    console.log('лут пришел', loot);
    this.grid = grid;
    this.groundLoot = this.#renderLoot(loot.groundLoot);
    console.log('клетки для лута', this.grid.getLootCells());
    this.syncVisible()
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
