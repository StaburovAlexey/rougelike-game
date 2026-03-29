import Enemy from './Enemy';
export default class EnemiesManager {
  constructor(enemies, grid) {
    this.grid = grid;
    this.enemies = this.#renderEnemies(enemies);
    console.log('this.enemies', this.enemies)
  }

  #shuffle(list) {
    const items = [...list];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  #renderEnemies(enemies) {
    const cellsForEnemies = this.#shuffle(this.grid.getEnemyCells());
    const count = Math.min(enemies.length, cellsForEnemies.length);

    return enemies.slice(0, count).map((enemy, index) => {
      const cell = cellsForEnemies[index];
      return new Enemy(cell, {
        name: enemy.type,
        hp: enemy.hp,
        atk: enemy.atk,
        def: enemy.def,
      })
    });
  }
  syncVisible(){
    this.enemies.forEach(element => {
      element.syncVisible()
    });
  }
  dispose(){
    this.enemies.forEach(element => {
      element.dispose()
    })
  }
}
