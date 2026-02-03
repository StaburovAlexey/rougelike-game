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
  }
  getLevel() {
    this.createLevel()
    return this.levelGroup;
  }
}
