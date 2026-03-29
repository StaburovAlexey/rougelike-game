import Enemy from './Enemy';

export default class EnemiesManager {
  constructor(enemies, grid) {
    this.grid = grid;
    this.enemies = this.#renderEnemies(enemies);
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
        ...enemy,
      });
    });
  }

  getNextCellCloserToTarget(fromCell, targetCell) {
    if (!fromCell || !targetCell) return null;
    if (fromCell.id === targetCell.id) return fromCell;

    const candidates = [
      this.grid.get(fromCell.col + 1, fromCell.row),
      this.grid.get(fromCell.col - 1, fromCell.row),
      this.grid.get(fromCell.col, fromCell.row + 1),
      this.grid.get(fromCell.col, fromCell.row - 1),
    ].filter((cell) => {
      if (!cell) return false;
      if (cell.id === targetCell.id) return false;
      return !cell.blocked && !cell.enemy;
    });

    if (!candidates.length) return null;

    let bestCell = null;
    let bestDistance = Infinity;

    for (const cell of candidates) {
      const distance =
        Math.abs(cell.col - targetCell.col) +
        Math.abs(cell.row - targetCell.row);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestCell = cell;
      }
    }

    return bestCell;
  }

  syncVisible() {
    this.enemies.forEach((enemy) => {
      enemy.syncVisible();
    });
  }

  tryMove() {
    const playerCell = this.grid.getCellPlayer();
    if (!playerCell) return;

    this.enemies.forEach((enemy) => {
      if (this.isAggroRange(playerCell, enemy.cellPosition, enemy.aggroRange)) {
        const moveCell = this.getNextCellCloserToTarget(enemy.cellPosition, playerCell);
        if (!moveCell) return;
        if (enemy.cellPosition) {
          enemy.cellPosition.enemy = false;
        }
        moveCell.enemy = true;
        enemy.syncMeshToCell(moveCell);
        console.log(`Игрок с агрил ${enemy.name}`);
      }
    });
  }

  isAggroRange(playerCell, enemyCell, aggroRange) {
    if (!playerCell || !enemyCell || typeof aggroRange !== 'number')
      return false;

    const distance =
      Math.abs(playerCell.col - enemyCell.col) +
      Math.abs(playerCell.row - enemyCell.row);

    return distance <= aggroRange;
  }

  dispose() {
    this.enemies.forEach((enemy) => {
      enemy.dispose();
    });
  }
}
