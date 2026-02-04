import * as THREE from "three";
import Floor from "./floor";
import Doors from "./doors";
import Walls from "./walls";
import Obstacles from "./obstacles";
import Loot from "./loot";
export default class CreateLevel {
  constructor({ cols = 10, rows = 10, cellSize = 1, gap = 0.1, y = 0 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.gap = gap;
    this.y = y;
    this.cellContents = new Map();
    this.levelGroup = new THREE.Group();
    this.allCells = this.#getAllCells();
    this.state = {};
    this.isBuilt = false;
    this._highlightedIds = [];
  }
  #setCell = (cell, data) => {
    const key = this.#cellKey(cell);
    this.cellContents.set(key, data);
  };

  #getAllCells() {
    const cells = [];
    const { cols, rows } = this;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let side = "inner";

        const isTop = r === 0;
        const isBottom = r === rows - 1;
        const isLeft = c === 0;
        const isRight = c === cols - 1;

        if (isTop) side = "top";
        if (isBottom) side = "bottom";
        if (isLeft) side = "left";
        if (isRight) side = "right";

        if ((isTop || isBottom) && (isLeft || isRight)) {
          side = "corner";
        }

        cells.push({ col: c, row: r, side });
      }
    }

    return cells;
  }
  #getPerimeterCells() {
    return this.allCells.filter((cell) => {
      return cell.side !== "inner";
    });
  }
  #getInnerCells() {
    return this.allCells.filter((cell) => {
      return cell.side == "inner";
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
    const content = this.cellContents.get(key) || { type: "floor" };
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
      count: 4,
    }).create();
    this.state.loot = new Loot({
      ...ctx,
      cells: ctx.getInnerCells(),
      skipCells: [...this.state.doors.cells, ...this.state.obstacles.cells],
      count: 2,
    }).create();
    this.isBuilt = true;
  }
  getSpawnCell() {
    const doors = this.state?.doors?.cells || [];
    const inDoor = doors.find((d) => d.type === "in");
    if (!inDoor) return { col: 1, row: 1 };

    let candidate = null;
    if (inDoor.side === "top")
      candidate = { col: inDoor.col, row: inDoor.row + 1 };
    if (inDoor.side === "bottom")
      candidate = { col: inDoor.col, row: inDoor.row - 1 };
    if (inDoor.side === "left")
      candidate = { col: inDoor.col + 1, row: inDoor.row };
    if (inDoor.side === "right")
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
  getLevel() {
    this.createLevel();
    return this.levelGroup;
  }
  colorCellGo(row, col) {
    const freeCell = this.#getFreeCells();
    const freeSet = new Set(freeCell.map((c) => this.#cellKey(c)));
    const candidates = [
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    ];

    const filtered = candidates.filter((c) => freeSet.has(this.#cellKey(c)));
    const floor = this.state?.floor?.instanced;
    if (!floor) return;
    const baseColor = new THREE.Color(floor.material.color);
    if (this._highlightedIds.length > 0) {
      for (const id of this._highlightedIds) {
        floor.setColorAt(id, baseColor);
      }
      this._highlightedIds = [];
    }

    const color = new THREE.Color("#ffd54a");
    for (const cell of filtered) {
      const id = cell.row * this.cols + cell.col;
      floor.setColorAt(id, color);
      this._highlightedIds.push(id);
    }
    floor.instanceColor.needsUpdate = true;
  }
}
