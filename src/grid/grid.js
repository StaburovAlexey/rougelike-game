import CONSTANTS from '../static/constants';

class Cell {
  constructor(id, x, z, worldX, worldZ) {
    this.id = id;
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
    this.visible = false;
    this.expand = false;
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
      torchesCount = 6,
      enemiesCount = 0,
      lootGroundCount = 0,
    } = {},
  ) {
    this.cols = cols;
    this.rows = rows;
    this.step = CONSTANTS.CELL_SIZE + CONSTANTS.GAP_CELLS;
    this.halfW = halfW;
    this.halfH = halfH;
    this.doorsCount = Math.min(Math.max(doorsCount, 1), 4);
    this.enemiesCount = Math.max(0, enemiesCount);
    this.lootGroundCount = Math.max(0, lootGroundCount);
    this.obstaclesDensity = Math.min(
      Math.max(CONSTANTS.OBSTACLES_DENSITY, 0),
      1,
    );
    this.torchesChance = torchesChance;
    this.torchesCount = torchesCount;
    this.cells = new Array(cols * rows);

    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const id = this.index(x, z);
        this.cells[id] = new Cell(
          id,
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
    this.enemyCells = [];
    this.loot = [];
    this.#generateCells();
  }

  index(x, z) {
    return z * this.cols + x;
  }

  inBounds(x, z) {
    return x >= 0 && z >= 0 && x < this.cols && z < this.rows;
  }

  get(x, z) {
    if (!this.inBounds(x, z)) return null;
    return this.cells[this.index(x, z)];
  }

  getCellsAroundPlayer(distance = 3) {
    const cellPlayer = this.getCellPlayer();
    if (!cellPlayer) return [];

    const result = [];

    for (
      let row = cellPlayer.row - distance;
      row <= cellPlayer.row + distance;
      row++
    ) {
      for (
        let col = cellPlayer.col - distance;
        col <= cellPlayer.col + distance;
        col++
      ) {
        if (!this.inBounds(col, row)) continue;

        const manhattan =
          Math.abs(cellPlayer.row - row) + Math.abs(cellPlayer.col - col);

        if (manhattan > distance) continue;
        result.push(this.get(col, row));
      }
    }

    return result;
  }
  getCellAround(cell) {
    if (!cell) return [];

    const directions = [
      { col: 1, row: 0 },
      { col: -1, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: -1 },
    ];

    return directions
      .map(({ col, row }) => this.get(cell.col + col, cell.row + row))
      .filter((nextCell) => nextCell && !nextCell.blocked);
  }
  getMoveCellsAroundPlayer() {
    const cellPlayer = this.getCellPlayer();
    if (!cellPlayer) return [];

    return this.getCellAround(cellPlayer);
  }
  setVisibleCell() {
    const cells = this.getCellsAroundPlayer();
    const invisibleCells = cells.filter((cell) => !cell.visible);
    invisibleCells.forEach((cell) => {
      cell.visible = true;
    });
    return this.getDontExpandCell();
  }
  getDontExpandCell() {
    return this.cells.filter((cell) => cell.visible && !cell.expand);
  }
  getWorldPosition(x, z) {
    const cell = this.get(x, z);
    if (!cell) return null;
    return { x: cell.worldX, z: cell.worldZ };
  }

  getWorldPositionById(id) {
    const cell = this.cells[id];
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

  getEnemyCells() {
    return this.enemyCells;
  }

  getLootCells() {
    return this.loot;
  }

  getStaticCells() {
    return [
      this.doorCells,
      this.torchCells,
      this.wallCells,
      this.obstacleCells,
    ].flat();
  }

  getCellPlayer() {
    return this.cells.find((cell) => cell.player);
  }
  isEventCell(cell) {
    return this.getMoveCellsAroundPlayer().find((c) => c.id === cell.id);
  }
  movePlayerTo(cell) {
    const cellPlayer = this.getCellPlayer();
    cellPlayer.player = false;
    cell.player = true;
  }
  #generateCells() {
    this.doorCells = this.#generateDoorCells();
    this.torchCells = this.#generateTorchCells();
    this.wallCells = this.#generateWallCells();
    this.obstacleCells = this.#generateObstacleCells();
    this.#setStartLevelCell();
    this.#generateEnemyCells();
    this.#generateLootGroundCells();
    this.setVisibleCell();
  }
  #setStartLevelCell() {
    const doorIn = this.cells.find((cell) => cell.doorRole === 'in');
    let startLevelCell = null;
    if (doorIn.side === 'top') {
      startLevelCell = this.get(doorIn.col, doorIn.row + 1);
    }
    if (doorIn.side === 'bottom') {
      startLevelCell = this.get(doorIn.col, doorIn.row - 1);
    }
    if (doorIn.side === 'left') {
      startLevelCell = this.get(doorIn.col + 1, doorIn.row);
    }
    if (doorIn.side === 'right') {
      startLevelCell = this.get(doorIn.col - 1, doorIn.row);
    }
    startLevelCell.player = true;
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

  #getCellBeforeDoor(doorCell) {
    if (!doorCell) return null;

    if (doorCell.side === 'top') {
      return this.get(doorCell.col, doorCell.row + 1);
    }
    if (doorCell.side === 'bottom') {
      return this.get(doorCell.col, doorCell.row - 1);
    }
    if (doorCell.side === 'left') {
      return this.get(doorCell.col + 1, doorCell.row);
    }
    if (doorCell.side === 'right') {
      return this.get(doorCell.col - 1, doorCell.row);
    }

    return null;
  }

  #isFreeEnemyCell(cell) {
    return Boolean(
      cell && !cell.blocked && !cell.player && !cell.enemy && cell.type === 'floor',
    );
  }

  #isFreeLootCell(cell) {
    return Boolean(
      cell &&
        !cell.blocked &&
        !cell.player &&
        !cell.enemy &&
        !cell.loot &&
        cell.type === 'floor',
    );
  }

  #placeEnemyCell(cell) {
    if (!this.#isFreeEnemyCell(cell)) return false;

    cell.enemy = true;
    // cell.blocked = true;
    this.enemyCells.push(cell);
    return true;
  }

  #placeLootGroundCell(cell) {
    if (!this.#isFreeLootCell(cell)) return false;
    cell.loot = true
    this.loot.push(cell);
    return true;
  }

  #shuffleCells(cells) {
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
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

  #createStaticCellData(row, col, side, type) {
    const cell = this.get(col, row);
    if (!cell) return null;

    return {
      id: cell.id,
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

  #applyStaticCellData(staticCell) {
    const cell = this.get(staticCell.col, staticCell.row);
    if (!cell) return null;

    cell.side = staticCell.side;
    cell.type = staticCell.type;
    cell.blocked =
      staticCell.type === 'wall' ||
      staticCell.type === 'obstacle' ||
      staticCell.doorRole === 'in' ||
      staticCell.type === 'torch';

    if (staticCell.doorRole !== null) {
      cell.doorRole = staticCell.doorRole;
    }

    return { ...staticCell };
  }

  #pickCellOnSide(side, reserved = [], avoidCorners = true, type) {
    const candidates = [];

    if (side === 'top') {
      for (let col = 0; col < this.cols; col++)
        candidates.push({ row: 0, col });
    }

    if (side === 'bottom') {
      for (let col = 0; col < this.cols; col++) {
        candidates.push({ row: this.rows - 1, col });
      }
    }

    if (side === 'left') {
      for (let row = 0; row < this.rows; row++)
        candidates.push({ row, col: 0 });
    }

    if (side === 'right') {
      for (let row = 0; row < this.rows; row++) {
        candidates.push({ row, col: this.cols - 1 });
      }
    }

    const mapped = candidates
      .map((candidate) => {
        return this.#createStaticCellData(
          candidate.row,
          candidate.col,
          side,
          type,
        );
      })
      .filter(Boolean);

    const free = mapped.filter((cell) => {
      if (avoidCorners && this.#isCorner(cell.row, cell.col)) return false;
      return this.#isValidCandidate(cell, reserved);
    });

    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
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

    return result.map((cell) => this.#applyStaticCellData(cell));
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

    return torches.map((cell) => this.#applyStaticCellData(cell));
  }

  #generateWallCells() {
    const excludedIds = new Set(
      [...this.doorCells, ...this.torchCells].map((cell) => cell.id),
    );
    const perimeter = [];
    const tryAddWall = (row, col, side) => {
      const cell = this.get(col, row);
      if (!cell || excludedIds.has(cell.id)) return;
      perimeter.push(this.#createStaticCellData(row, col, side, 'wall'));
    };

    for (let col = 0; col < this.cols; col++) {
      tryAddWall(0, col, 'top');
    }

    if (this.rows > 1) {
      for (let col = 0; col < this.cols; col++) {
        tryAddWall(this.rows - 1, col, 'bottom');
      }
    }

    for (let row = 1; row < this.rows - 1; row++) {
      tryAddWall(row, 0, 'left');
    }

    if (this.cols > 1) {
      for (let row = 1; row < this.rows - 1; row++) {
        tryAddWall(row, this.cols - 1, 'right');
      }
    }

    return perimeter.map((cell) => this.#applyStaticCellData(cell));
  }

  #generateObstacleCells() {
    const candidates = [];

    for (let row = 2; row < this.rows - 2; row++) {
      for (let col = 2; col < this.cols - 2; col++) {
        const cell = this.#createStaticCellData(row, col, null, 'obstacle');
        if (!cell) continue;
        candidates.push(cell);
      }
    }

    if (!candidates.length) return [];

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const count = Math.max(
      1,
      Math.floor(candidates.length * this.obstaclesDensity),
    );
    const selected = candidates.slice(0, count);

    return selected.map((cell) => this.#applyStaticCellData(cell));
  }

  #generateEnemyCells() {
    this.enemyCells = [];
    if (!this.enemiesCount) return [];

    const outDoors = this.getOutDoorCells();
    const reservedIds = new Set();

    if (outDoors.length > 1) {
      const shuffledOutDoors = this.#shuffleCells([...outDoors]);

      for (const outDoor of shuffledOutDoors) {
        const mandatoryCell = this.#getCellBeforeDoor(outDoor);
        if (!this.#placeEnemyCell(mandatoryCell)) continue;
        reservedIds.add(mandatoryCell.id);
        break;
      }
    }

    const freeCells = this.cells.filter(
      (cell) => this.#isFreeEnemyCell(cell) && !reservedIds.has(cell.id),
    );
    this.#shuffleCells(freeCells);

    const remainingSlots = Math.max(0, this.enemiesCount - this.enemyCells.length);
    for (let i = 0; i < Math.min(remainingSlots, freeCells.length); i++) {
      this.#placeEnemyCell(freeCells[i]);
    }

    return this.enemyCells;
  }

  #generateLootGroundCells() {
    this.loot = [];
    if (!this.lootGroundCount) return [];

    const reservedIds = new Set(
      [...this.doorCells, ...this.enemyCells].map((cell) => cell.id),
    );
    const freeCells = this.cells.filter(
      (cell) => this.#isFreeLootCell(cell) && !reservedIds.has(cell.id),
    );
    this.#shuffleCells(freeCells);

    const count = Math.min(this.lootGroundCount, freeCells.length);
    for (let i = 0; i < count; i++) {
      this.#placeLootGroundCell(freeCells[i]);
    }

    return this.loot;
  }
}
