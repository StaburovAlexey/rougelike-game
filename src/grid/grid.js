import CONSTANTS from '../static/constants';

class Cell {
  constructor(x, z, worldX, worldZ) {
    this.x = x;
    this.z = z;
    this.col = x;
    this.row = z;
    this.worldX = worldX;
    this.worldZ = worldZ;
    this.side = null;
    this.type = 'floor';
    this.blocked = false;
    this.player = null;
    this.enemy = null;
    this.loot = null;
    this.meta = {};
  }
}

export default class Grid {
  constructor(
    cols,
    rows,
    {
      halfW = 0,
      halfH = 0,
      doorsCount = 4,
      torchesChance = 1,
      torchesCount = 4,
    } = {},
  ) {
    this.cols = cols;
    this.rows = rows;
    this.step = CONSTANTS.CELL_SIZE + CONSTANTS.GAP_CELLS;
    this.halfW = halfW;
    this.halfH = halfH;
    this.doorsCount = Math.min(Math.max(doorsCount, 1), 4);
    this.obstaclesDensity = Math.min(Math.max(CONSTANTS.OBSTACLES_DENSITY, 0), 1);
    this.torchesChance = torchesChance;
    this.torchesCount = torchesCount;
    this.cells = new Array(cols * rows);

    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        this.cells[this.index(x, z)] = new Cell(
          x,
          z,
          x * this.step - this.halfW,
          z * this.step - this.halfH,
        );
      }
    }

    this.doorCells = [];
    this.obstacleCells = [];
    this.torchCells = [];
    this.wallCells = [];
    this.#generateStaticCells();
  }


  index(x, z) {
    return z * this.cols + x;
  }

  coordsCell(id) {
    return { x: id % this.cols, z: Math.floor(id / this.cols) };
  }

  inBounds(x, z) {
    return x >= 0 && z >= 0 && x < this.cols && z < this.rows;
  }

  getId(id) {
    return this.cells[id];
  }

  get(x, z) {
    if (!this.inBounds(x, z)) return null;
    return this.cells[this.index(x, z)];
  }

  getWorldPosition(x, z) {
    const cell = this.get(x, z);
    if (!cell) return null;
    return { x: cell.worldX, z: cell.worldZ };
  }

  getWorldPositionById(id) {
    const cell = this.getId(id);
    if (!cell) return null;
    return { x: cell.worldX, z: cell.worldZ };
  }

  getDoorCells() {
    return this.doorCells;
  }

  getInDoorCell() {
    return this.doorCells.find((cell) => cell.doorRole === 'in') ?? null;
  }

  getOutDoorCells() {
    return this.doorCells.filter((cell) => cell.doorRole === 'out');
  }

  getTorchCells() {
    return this.torchCells;
  }

  getObstacleCells() {
    return this.obstacleCells;
  }

  getWallCells() {
    return this.wallCells;
  }

  getStaticCells() {
    return [this.doorCells, this.torchCells, this.wallCells, this.obstacleCells].flat();
  }

  #generateStaticCells() {
    this.doorCells = this.#generateDoorCells();
    this.torchCells = this.#generateTorchCells();
    this.wallCells = this.#generateWallCells();
    this.obstacleCells = this.#generateObstacleCells();
  }

  #toId(row, col) {
    return row * this.cols + col;
  }

  #isCorner(row, col) {
    const lastRow = this.rows - 1;
    const lastCol = this.cols - 1;
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === lastCol) ||
      (row === lastRow && col === 0) ||
      (row === lastRow && col === lastCol)
    );
  }

  #isAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  #isValidCandidate(candidate, reserved) {
    if (this.#isCorner(candidate.row, candidate.col)) return false;

    for (let i = 0; i < reserved.length; i++) {
      const cell = reserved[i];
      if (cell.id === candidate.id) return false;
      if (this.#isAdjacent(candidate, cell)) return false;
    }

    return true;
  }

  #decorateStaticCell(row, col, side, type) {
    const cell = this.get(col, row);
    return {
      id: this.index(col, row),
      row,
      col,
      x: cell.x,
      z: cell.z,
      worldX: cell.worldX,
      worldZ: cell.worldZ,
      side,
      type,
      doorRole: null,
    };
  }

  #pickCellOnSide(side, reserved = [], avoidCorners = true, type) {
    const candidates = [];

    if (side === 'top') {
      for (let col = 0; col < this.cols; col++) candidates.push({ row: 0, col });
    }

    if (side === 'bottom') {
      for (let col = 0; col < this.cols; col++) {
        candidates.push({ row: this.rows - 1, col });
      }
    }

    if (side === 'left') {
      for (let row = 0; row < this.rows; row++) candidates.push({ row, col: 0 });
    }

    if (side === 'right') {
      for (let row = 0; row < this.rows; row++) {
        candidates.push({ row, col: this.cols - 1 });
      }
    }

    const mapped = candidates.map((candidate) => ({
      row: candidate.row,
      col: candidate.col,
      id: this.#toId(candidate.row, candidate.col),
      side,
      type,
    }));

    const free = mapped.filter((cell) => {
      if (avoidCorners && this.#isCorner(cell.row, cell.col)) return false;
      return this.#isValidCandidate(cell, reserved);
    });

    if (!free.length) return null;
    const selected = free[Math.floor(Math.random() * free.length)];
    return this.#decorateStaticCell(selected.row, selected.col, selected.side, selected.type);
  }

  #generateDoorCells() {
    const sides = ['top', 'right', 'bottom', 'left'];
    const shuffled = [...sides].sort(() => Math.random() - 0.5);
    const selectedSides = shuffled.slice(0, this.doorsCount);
    const result = [];

    for (const side of selectedSides) {
      const cell = this.#pickCellOnSide(side, result, true, 'door');
      if (!cell) continue;
      result.push(cell);
    }

    if (result.length > 0) {
      result[0].doorRole = 'in';
      for (let i = 1; i < result.length; i++) {
        result[i].doorRole = 'out';
      }
    }

    return result;
  }

  #generateTorchCells() {
    if (Math.random() > this.torchesChance) return [];

    const torches = [];
    const sides = ['top', 'right', 'bottom', 'left'];
    const uniqueSidesLimit = Math.min(this.torchesCount, 4);
    const usedSides = new Set();
    let attempts = 0;

    while (torches.length < this.torchesCount && attempts < 200) {
      attempts++;
      const sidePool =
        torches.length < uniqueSidesLimit
          ? sides.filter((side) => !usedSides.has(side))
          : sides;

      if (!sidePool.length) continue;

      const side = sidePool[Math.floor(Math.random() * sidePool.length)];
      const reserved = [...this.doorCells, ...torches];
      const cell = this.#pickCellOnSide(side, reserved, true, 'torch');
      if (!cell) continue;
      torches.push(cell);

      if (torches.length <= uniqueSidesLimit) usedSides.add(side);
    }

    return torches;
  }

  #generateWallCells() {
    const perimeter = [];

    for (let col = 0; col < this.cols; col++) {
      perimeter.push(this.#decorateStaticCell(0, col, 'top', 'wall'));
    }

    if (this.rows > 1) {
      for (let col = 0; col < this.cols; col++) {
        perimeter.push(this.#decorateStaticCell(this.rows - 1, col, 'bottom', 'wall'));
      }
    }

    for (let row = 1; row < this.rows - 1; row++) {
      perimeter.push(this.#decorateStaticCell(row, 0, 'left', 'wall'));
    }

    if (this.cols > 1) {
      for (let row = 1; row < this.rows - 1; row++) {
        perimeter.push(this.#decorateStaticCell(row, this.cols - 1, 'right', 'wall'));
      }
    }

    const excludedIds = new Set(
      [...this.doorCells, ...this.torchCells].map((cell) => cell.id),
    );

    return perimeter.filter((cell) => !excludedIds.has(cell.id));
  }

  #generateObstacleCells() {
    const candidates = [];

    for (let row = 2; row < this.rows - 2; row++) {
      for (let col = 2; col < this.cols - 2; col++) {
        candidates.push(this.#decorateStaticCell(row, col, null, 'obstacle'));
      }
    }

    if (!candidates.length) return [];

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const count = Math.max(1, Math.floor(candidates.length * this.obstaclesDensity));
    return candidates.slice(0, count);
  }
}
