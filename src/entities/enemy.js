import Entity from './entity.js';

const AGGRO_RANGE = 3;
const cellKey = (cell) => `${cell.col}:${cell.row}`;
const manhattan = (a, b) =>
  Math.abs(a.col - b.col) + Math.abs(a.row - b.row);

export default class Enemy extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0xff4444 });
    this.aggroRange = options.aggroRange ?? AGGRO_RANGE;
  }

  hightligtMoveCell() {
    // Enemy does not highlight move cells.
  }

  takeTurn(playerCell) {
    if (!playerCell) return false;
    const dist = manhattan(this, playerCell);
    if (dist > this.aggroRange) return false;

    const { candidates } = this.level.getCandidatesCells(playerCell);
    const targets = candidates.filter((cell) =>
      this.canEnter(cell.col, cell.row),
    );
    if (targets.length === 0) return false;

    const path = this.#findPathToAnyTarget(targets);
    if (!path || path.length < 2) return false;
    return this.move(path[1]);
  }

  #findPathToAnyTarget(targets) {
    const start = { col: this.col, row: this.row };
    const startKey = cellKey(start);
    const targetKeys = new Set(targets.map(cellKey));
    if (targetKeys.has(startKey)) return [start];

    const queue = [start];
    const visited = new Set([startKey]);
    const cameFrom = new Map();
    const cellByKey = new Map([[startKey, start]]);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = cellKey(current);
      const neighbors = this.level.getCandidatesCells(current).candidates;

      for (const next of neighbors) {
        const nextKey = cellKey(next);
        if (visited.has(nextKey)) continue;
        if (!this.canEnter(next.col, next.row)) continue;
        visited.add(nextKey);
        cameFrom.set(nextKey, currentKey);
        cellByKey.set(nextKey, next);

        if (targetKeys.has(nextKey)) {
          return this.#buildPath(nextKey, cameFrom, cellByKey);
        }

        queue.push(next);
      }
    }

    return null;
  }

  #buildPath(targetKey, cameFrom, cellByKey) {
    const path = [];
    let currentKey = targetKey;
    while (currentKey) {
      path.push(cellByKey.get(currentKey));
      currentKey = cameFrom.get(currentKey);
    }
    path.reverse();
    return path;
  }
}
