import Enemy from './Enemy';

export default class EnemiesManager {
  constructor(enemies, grid) {
    this.grid = grid;
    this.enemies = this.#renderEnemies(enemies);
  }

  getEnemy(cell) {
    if (!cell) return null;
    return (
      this.enemies.find((enemy) => enemy.cellPosition?.id === cell.id) ?? null
    );
  }

  tryAttack(player) {
    for (const enemy of this.enemies) {
      const cellsAround = this.grid.getCellAround(enemy.cellPosition);
      const isPlayer = cellsAround.find(
        (cell) => cell.id === player.cellPosition.id,
      );

      if (isPlayer) {
        enemy.tryAttack(player);
        console.log('Игрок атакован', enemy.name);
      }
    }
  }

  enemyDie(enemy) {
    if (enemy.cellPosition) {
      enemy.cellPosition.enemy = false;
    }
    enemy.dispose();
    this.enemies = this.enemies.filter(
      (currentEnemy) => currentEnemy.id !== enemy.id,
    );
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

  #getAdjacentCells(cell) {
    if (!cell) return [];

    return [
      this.grid.get(cell.col + 1, cell.row),
      this.grid.get(cell.col - 1, cell.row),
      this.grid.get(cell.col, cell.row + 1),
      this.grid.get(cell.col, cell.row - 1),
    ].filter(Boolean);
  }

  #getRingCellsAroundPlayer(playerCell) {
    return this.#getAdjacentCells(playerCell).filter(
      (cell) => !cell.blocked && !cell.enemy,
    );
  }

  #getManhattanDistance(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  #isAdjacent(a, b) {
    return this.#getManhattanDistance(a, b) === 1;
  }

  #getStepTowardTargets(fromCell, targetCells) {
    if (!fromCell || !targetCells.length) return null;

    const targetIds = new Set(targetCells.map((cell) => cell.id));
    if (targetIds.has(fromCell.id)) return fromCell;

    const playerCell = this.grid.getCellPlayer();
    const visited = new Set([fromCell.id]);
    const queue = [{ cell: fromCell, firstStep: null }];

    while (queue.length) {
      const { cell, firstStep } = queue.shift();

      for (const nextCell of this.#getAdjacentCells(cell)) {
        if (visited.has(nextCell.id)) continue;
        if (nextCell.blocked) continue;
        if (nextCell.enemy && !targetIds.has(nextCell.id)) continue;
        if (playerCell && nextCell.id === playerCell.id) continue;

        const nextStep = firstStep ?? nextCell;
        if (targetIds.has(nextCell.id)) {
          return nextStep;
        }

        visited.add(nextCell.id);
        queue.push({ cell: nextCell, firstStep: nextStep });
      }
    }

    return null;
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
      if (!this.isAggroRange(playerCell, enemy.cellPosition, enemy.aggroRange))
        return;

      if (this.#isAdjacent(enemy.cellPosition, playerCell)) {
        console.log(`Enemy ${enemy.name} is in attack range`);
        return;
      }

      const speed = enemy.speed;
      if (speed <= 0) return;

      let currentCell = enemy.cellPosition;
      let moved = false;

      for (let step = 0; step < speed; step += 1) {
        const targetCells = this.#getRingCellsAroundPlayer(playerCell);
        const moveCell = this.#getStepTowardTargets(currentCell, targetCells);

        if (!moveCell || moveCell.id === currentCell?.id) break;

        if (currentCell) {
          currentCell.enemy = false;
        }

        moveCell.enemy = true;
        enemy.syncMeshToCell(moveCell);
        currentCell = moveCell;
        moved = true;

        if (this.#isAdjacent(currentCell, playerCell)) break;
      }

      if (moved) {
        enemy.syncVisible();
        console.log(`Enemy ${enemy.name} is moving toward the player`);
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
