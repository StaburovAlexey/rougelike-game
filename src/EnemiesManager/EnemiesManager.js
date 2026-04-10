import Enemy from './Enemy';

export default class EnemiesManager {
  constructor(enemies, grid, lootManager = null) {
    this.grid = grid;
    this.lootManager = lootManager;
    this.enemies = this.#renderEnemies(enemies);
  }

  getEnemy(cell) {
    if (!cell) return null;
    return (
      this.enemies.find((enemy) => enemy.cellPosition?.id === cell.id) ?? null
    );
  }

  tryAttack(player) {
    const dieEnemies = [];
    for (const enemy of this.enemies) {
      if (enemy.hp < 1) {
        dieEnemies.push({ ...enemy });
        this.enemyDie(enemy);
        continue;
      }
      const cellsAround = this.grid.getCellAround(enemy.cellPosition);
      const isPlayer = cellsAround.find(
        (cell) => cell.id === player.cellPosition.id,
      );

      if (isPlayer) {
        enemy.tryAttack(player);
      }
    }
    return dieEnemies;
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

  #getRandomFreeAdjacentCell(cell, blockedCell = null) {
    if (!cell) return null;

    const candidates = this.#shuffle(this.#getAdjacentCells(cell)).filter(
      (nextCell) =>
        !nextCell.blocked &&
        !nextCell.enemy &&
        (!blockedCell || nextCell.id !== blockedCell.id),
    );

    return candidates[0] ?? null;
  }

  #isInAttackRange(enemy, playerCell) {
    return this.#isAdjacent(enemy.cellPosition, playerCell);
  }

  #moveEnemyToCell(enemy, nextCell) {
    if (!enemy || !nextCell) return;

    if (enemy.cellPosition) {
      enemy.cellPosition.enemy = false;
    }

    nextCell.enemy = true;
    enemy.syncMeshToCell(nextCell);
  }

  #tryRandomMove(enemy, playerCell) {
    const randomMoveCell = this.#getRandomFreeAdjacentCell(
      enemy.cellPosition,
      playerCell,
    );
    if (!randomMoveCell) return false;

    this.#moveEnemyToCell(enemy, randomMoveCell);
    enemy.syncVisible();
    return true;
  }

  #isMoveReady(enemy) {
    if (enemy.move !== 0) {
      enemy.move -= 1;
      return false;
    }

    enemy.move = enemy.windUpTurns;
    return true;
  }

  #tryMoveTowardPlayer(enemy, playerCell) {
    const speed = enemy.speed;
    if (speed <= 0) return false;

    let currentCell = enemy.cellPosition;
    let moved = false;

    for (let step = 0; step < speed; step += 1) {
      const targetCells = this.#getRingCellsAroundPlayer(playerCell);
      const moveCell = this.#getStepTowardTargets(currentCell, targetCells);

      if (!moveCell || moveCell.id === currentCell?.id) break;

      this.#moveEnemyToCell(enemy, moveCell);
      currentCell = moveCell;
      moved = true;

      if (this.#isAdjacent(currentCell, playerCell)) break;
    }

    if (moved) {
      enemy.syncVisible();
      console.log(`Enemy ${enemy.name} is moving toward the player`);
    }

    return moved;
  }

  #tryDestroyAdjacentLoot(enemy) {
    if (!enemy?.lootDestroy || !enemy?.cellPosition || !this.lootManager)
      return false;

    const lootDestroyChance =
      typeof enemy.lootDestroyChance === 'number' ? enemy.lootDestroyChance : 0;

    if (lootDestroyChance <= 0 || Math.random() > lootDestroyChance)
      return false;

    const adjacentLootCells = this.#shuffle(
      this.#getAdjacentCells(enemy.cellPosition).filter((cell) => cell.loot),
    );

    if (!adjacentLootCells.length) return false;

    const destroyedCell = adjacentLootCells[0];
    const destroyedLoot = this.lootManager.removeLootAtCell(destroyedCell);
    if (!destroyedLoot) return false;

    console.log(`Enemy ${enemy.name} destroyed nearby loot`);
    return true;
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
      const destroyedLoot = this.#tryDestroyAdjacentLoot(enemy);
      if (destroyedLoot) return;

      const inAggroRange = this.isAggroRange(
        playerCell,
        enemy.cellPosition,
        enemy.aggroRange,
      );

      if (enemy.randomMove && !inAggroRange) {
        this.#tryRandomMove(enemy, playerCell);
        return;
      }

      if (!inAggroRange) return;

      if (this.#isInAttackRange(enemy, playerCell)) {
        console.log(`Enemy ${enemy.name} is in attack range`);
        return;
      }

      if (!this.#isMoveReady(enemy)) return;
      this.#tryMoveTowardPlayer(enemy, playerCell);
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
