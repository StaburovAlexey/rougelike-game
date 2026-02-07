import * as THREE from 'three';
import Floor from './floor';
import Doors from './doors';
import Walls from './walls';
import Obstacles from './obstacles';
import Loot from './loot';
import Trap from './trap';
export default class CreateLevel {
  constructor({ cols = 10, rows = 10 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.countObstacles = Math.floor(rows * cols * 0.04);
    this.countLoot = Math.max(1, Math.floor(rows * cols * 0.01));
    this.countTrap = Math.max(1, Math.floor(rows * cols * 0.02));
    this.cellSize = 1;
    this.gap = 0.1;
    this.y = 0;
    this.cellContents = new Map();
    this.occupiedCells = new Map();
    this.entityPositions = new Map();
    this.levelGroup = new THREE.Group();
    this.allCells = this.#getAllCells();
    this.state = {};
    this.isBuilt = false;
    this._highlightedMoveIds = [];
    this._hightlightedAtackIds = [];
    this._hightlightedLootIds = [];
    this.cellPlayer = null;
    this.moveCellsSet;
    this.attackCellsSet;
    this.lootCellsSet;
    this.lootInstanceByKey = new Map();
  }
  #setCell = (cell, data) => {
    const key = this.#cellKey(cell);
    this.cellContents.set(key, data);
  };
  setCellPlayer(cell) {
    this.cellPlayer = cell;
  }
  registerEntity(entity, cell) {
    const key = this.#cellKey(cell);
    const prevKey = this.entityPositions.get(entity);
    if (prevKey && prevKey !== key) {
      this.occupiedCells.delete(prevKey);
    }
    this.entityPositions.set(entity, key);
    this.occupiedCells.set(key, entity);
  }
  removeEntity(entity) {
    const key = this.entityPositions.get(entity);
    if (!key) return;
    this.occupiedCells.delete(key);
    this.entityPositions.delete(entity);
  }
  isCellOccupied(cell, ignoreEntity = null) {
    const key = this.#cellKey(cell);
    const occupant = this.occupiedCells.get(key);
    if (!occupant) return false;
    if (ignoreEntity && occupant === ignoreEntity) return false;
    return true;
  }
  getEntityAt(cell) {
    const key = this.#cellKey(cell);
    return this.occupiedCells.get(key) || null;
  }
  isCellWalkable(cell) {
    if (!cell) return false;
    if (cell.col < 0 || cell.col >= this.cols) return false;
    if (cell.row < 0 || cell.row >= this.rows) return false;
    const key = this.#cellKey(cell);
    const content = this.cellContents.get(key);
    if (!content) return true;
    return (
      content.type === 'floor' ||
      content.type === 'door' ||
      content.type === 'loot' ||
      content.type === 'trap'
    );
  }
  #getAllCells() {
    const cells = [];
    const { cols, rows } = this;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let side = 'inner';

        const isTop = r === 0;
        const isBottom = r === rows - 1;
        const isLeft = c === 0;
        const isRight = c === cols - 1;

        if (isTop) side = 'top';
        if (isBottom) side = 'bottom';
        if (isLeft) side = 'left';
        if (isRight) side = 'right';

        if ((isTop || isBottom) && (isLeft || isRight)) {
          side = 'corner';
        }

        cells.push({ col: c, row: r, side });
      }
    }

    return cells;
  }
  #getPerimeterCells() {
    return this.allCells.filter((cell) => {
      return cell.side !== 'inner';
    });
  }
  #getInnerCells() {
    return this.allCells.filter((cell) => {
      return cell.side == 'inner';
    });
  }
  #getFreeCells() {
    const cells = this.#getInnerCells();
    const free = [];
    for (const cell of cells) {
      const key = this.#cellKey(cell);
      if (!this.cellContents.has(key)) {
        free.push(cell);
      }
    }
    return free;
  }
  #getBusyCells() {
    const cells = this.#getInnerCells();
    const free = [];
    for (const cell of cells) {
      const key = this.#cellKey(cell);
      if (this.cellContents.has(key)) {
        free.push(cell);
      }
    }
    return free;
  }

  #cellKey({ col, row }) {
    return `${col}:${row}`;
  }
  idToGrid(instanceId) {
    const col = instanceId % this.cols;
    const row = Math.floor(instanceId / this.cols);
    const key = this.#cellKey({ col, row });
    const content = this.cellContents.get(key) || { type: 'floor' };
    return { col, row, key, content };
  }

  gridToWorld(col, row, heightOffset = 0) {
    const step = this.cellSize + this.gap;
    const halfW = (this.cols * step) / 2;
    const halfH = (this.rows * step) / 2;

    const x = col * step - halfW + step / 2;
    const z = row * step - halfH + step / 2;

    return new THREE.Vector3(x, this.y + heightOffset, z);
  }

  isCorner(cell) {
    return (
      (cell.col === 0 && cell.row === 0) ||
      (cell.col === 0 && cell.row === this.rows - 1) ||
      (cell.col === this.cols - 1 && cell.row === 0) ||
      (cell.col === this.cols - 1 && cell.row === this.rows - 1)
    );
  }
  #randomInt(max) {
    return Math.floor(Math.random() * max);
  }
  createLevel() {
    if (this.isBuilt) return;
    const ctx = {
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      levelGroup: this.levelGroup,
      cells: this.allCells,
      getPerimeterCells: this.#getPerimeterCells.bind(this),
      getInnerCells: this.#getInnerCells.bind(this),
      setCell: this.#setCell.bind(this),
    };
    this.state.floor = new Floor({ ...ctx, cells: this.allCells }).create();
    this.state.doors = new Doors({
      ...ctx,
      cells: ctx.getPerimeterCells(),
      total: 3,
    }).create();
    this.state.walls = new Walls({
      ...ctx,
      cells: ctx.getPerimeterCells(),
      skipCells: this.state.doors.cells,
    }).create();
    this.state.obstacles = new Obstacles({
      ...ctx,
      cells: ctx.getInnerCells(),
      skipCells: this.state.doors.cells,
      count: this.countObstacles,
    }).create();
    this.state.loot = new Loot({
      ...ctx,
      cells: ctx.getInnerCells(),
      skipCells: [...this.state.doors.cells, ...this.state.obstacles.cells],
      count: this.countLoot,
    }).create();
    this.lootInstanceByKey.clear();
    this.state.loot.cells.forEach((cell, instanceId) => {
      this.lootInstanceByKey.set(this.#cellKey(cell), instanceId);
    });
    this.state.trap = new Trap({
      ...ctx,
      cells: ctx.getInnerCells(),
      skipCells: [
        ...this.state.doors.cells,
        ...this.state.loot.cells,
        ...this.state.obstacles.cells,
      ],
      count: this.countTrap,
    }).create();
    this.isBuilt = true;
  }
  getSpawnCell() {
    const doors = this.state?.doors?.cells || [];
    const inDoor = doors.find((d) => d.type === 'in');
    if (!inDoor) return { col: 1, row: 1 };

    let candidate = null;
    if (inDoor.side === 'top')
      candidate = { col: inDoor.col, row: inDoor.row + 1 };
    if (inDoor.side === 'bottom')
      candidate = { col: inDoor.col, row: inDoor.row - 1 };
    if (inDoor.side === 'left')
      candidate = { col: inDoor.col + 1, row: inDoor.row };
    if (inDoor.side === 'right')
      candidate = { col: inDoor.col - 1, row: inDoor.row };

    const isFree = (cell) => {
      if (!cell) return false;
      if (cell.col < 0 || cell.col >= this.cols) return false;
      if (cell.row < 0 || cell.row >= this.rows) return false;
      const key = this.#cellKey(cell);
      return !this.cellContents.has(key);
    };

    if (isFree(candidate)) return candidate;

    const around = [
      candidate,
      { col: candidate.col + 1, row: candidate.row },
      { col: candidate.col - 1, row: candidate.row },
      { col: candidate.col, row: candidate.row + 1 },
      { col: candidate.col, row: candidate.row - 1 },
    ];
    for (const cell of around) {
      if (isFree(cell)) return cell;
    }

    const free = this.#getFreeCells();
    return free[0] || { col: 1, row: 1 };
  }
  getEnemySpawnCells({
    count = 1,
    avoidCell,
    minDistance = 3,
    exitMinDistance = 3,
  } = {}) {
    const free = this.#getFreeCells();
    const distance = (a, b) =>
      Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    const exits = (this.state?.doors?.cells || []).filter(
      (door) => door.type === 'out',
    );

    const isAvoid = (cell) =>
      avoidCell && cell.col === avoidCell.col && cell.row === avoidCell.row;
    const isNearExit = (cell) =>
      exits.some((exit) => distance(cell, exit) <= exitMinDistance);

    let candidates = free.filter(
      (cell) =>
        !isAvoid(cell) &&
        !isNearExit(cell) &&
        (!avoidCell || distance(cell, avoidCell) >= minDistance),
    );

    if (candidates.length < count) {
      candidates = free.filter((cell) => !isAvoid(cell) && !isNearExit(cell));
    }

    const picks = [];
    const pool = [...candidates];
    const limit = Math.min(count, pool.length);
    for (let i = 0; i < limit; i++) {
      const idx = this.#randomInt(pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    return picks;
  }
  getLevel() {
    this.createLevel();
    return this.levelGroup;
  }
  getMoveCells(row, col) {
    const candidates = this.getCandidatesCells({ row, col }).candidates;
    return candidates.filter(
      (c) => this.isCellWalkable(c) && !this.isCellOccupied(c),
    );
  }
  isCellLoot(cell) {
    const key = this.#cellKey(cell);
    const content = this.cellContents.get(key);
    return content?.type === 'loot';
  }
  pickupLoot(cell) {
    const key = this.#cellKey(cell);
    const content = this.cellContents.get(key);
    if (content?.type !== 'loot') return false;

    this.cellContents.delete(key);

    const instanceId = this.lootInstanceByKey.get(key);
    const instanced = this.state?.loot?.instanced;
    if (instanced && Number.isInteger(instanceId)) {
      const hidden = new THREE.Object3D();
      hidden.scale.set(0.001, 0.001, 0.001);
      hidden.position.set(0, -1000, 0);
      hidden.updateMatrix();
      instanced.setMatrixAt(instanceId, hidden.matrix);
      instanced.instanceMatrix.needsUpdate = true;
    }

    this.lootInstanceByKey.delete(key);
    if (this.state?.loot?.cells) {
      this.state.loot.cells = this.state.loot.cells.filter(
        (item) => this.#cellKey(item) !== key,
      );
    }

    return true;
  }
  isCellTrap(cell) {
    const key = this.#cellKey(cell);
    const trap = new Set(
      this.state.trap.cells.map((c) =>
        this.#cellKey({ col: c.col, row: c.row }),
      ),
    );
    return trap.has(key);
  }
  getAttackCells(row, col) {
    const candidates = this.getCandidatesCells({ row, col }).candidates;
    return candidates.filter((c) => this.isCellOccupied(c));
  }
  getLootCells(row, col) {
    const candidates = this.getCandidatesCells({ row, col }).candidates;
    return candidates.filter((c) => this.isCellLoot(c));
  }
  getCandidatesCells(cell) {
    const { col, row } = cell;
    const candidates = [
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    ];
    const candidatesMap = new Map();
    candidates.forEach((item) => {
      const key = this.#cellKey(item);
      candidatesMap.set(key, item);
    });
    return { candidates, candidatesMap };
  }
  colorCellsInteractive({ row, col }) {
    const floor = this.state?.floor?.instanced;
    if (!floor) return;
    const baseColor = new THREE.Color(floor.material.color);
    this.clearInteractiveHighlights({ floor, baseColor });
    this.colorCellMove({ row, col, floor, baseColor });
    this.colorCellAttack({ row, col, floor, baseColor });
    this.colorCellLoot({ row, col, floor, baseColor });

    floor.instanceColor.needsUpdate = true;
  }
  colorCellLoot({ row, col, floor }) {
    const filtered = this.getLootCells(row, col);
    this.lootCellsSet = new Set(filtered.map((c) => this.#cellKey(c)));

    const color = new THREE.Color('#0ff52e');
    for (const cell of filtered) {
      const id = cell.row * this.cols + cell.col;
      floor.setColorAt(id, color);
      this._hightlightedLootIds.push(id);
    }
  }
  colorCellAttack({ row, col, floor }) {
    const filtered = this.getAttackCells(row, col);
    this.attackCellsSet = new Set(filtered.map((c) => this.#cellKey(c)));

    const color = new THREE.Color('#f51e0f');
    for (const cell of filtered) {
      const id = cell.row * this.cols + cell.col;
      floor.setColorAt(id, color);
      this._hightlightedAtackIds.push(id);
    }
  }

  colorCellMove({ row, col, floor }) {
    const filtered = this.getMoveCells(row, col);
    this.moveCellsSet = new Set(filtered.map((c) => this.#cellKey(c)));

    const color = new THREE.Color('#ffd54a');
    for (const cell of filtered) {
      const id = cell.row * this.cols + cell.col;
      floor.setColorAt(id, color);
      this._highlightedMoveIds.push(id);
    }
  }

  clearInteractiveHighlights({ floor, baseColor }) {
    for (const id of this._highlightedMoveIds) floor.setColorAt(id, baseColor);
    for (const id of this._hightlightedAtackIds)
      floor.setColorAt(id, baseColor);
    for (const id of this._hightlightedLootIds) floor.setColorAt(id, baseColor);

    this._highlightedMoveIds = [];
    this._hightlightedAtackIds = [];
    this._hightlightedLootIds = [];
  }
}
