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
    const floorInstance = new Floor({
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      cells: this.#getAllCells(),
      levelGroup: this.levelGroup,
    });
    this.floor = floorInstance.getFloor();
    const doorsInstance = new Doors({
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      cells: this.#getPerimeterCells(),
      levelGroup: this.levelGroup,
      setCell: this.#setCell.bind(this),
    });
   
    this.doors = doorsInstance.getDoors();
    const instanceWalls = new Walls({
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      cells: this.#getPerimeterCells(),
      skipCells: this.doors,
      levelGroup: this.levelGroup,
      setCell: this.#setCell.bind(this),
    });
 
    doorsInstance.createDoorsInstanced();
    const obstaclesInstance = new Obstacles({
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      cells: this.#getInnerCells(),
      skipCells: this.doors,
      levelGroup: this.levelGroup,
      setCell: this.#setCell.bind(this),
      count: 4,
    });
    this.obstacles = obstaclesInstance.getObstacles();

    const lootInstance = new Loot({
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize,
      gap: this.gap,
      y: this.y,
      cells: this.#getInnerCells(),
      skipCells: [...this.doors, ...this.obstacles],
      levelGroup: this.levelGroup,
      setCell: this.#setCell.bind(this),
      count: 2,
    });
    this.loot = lootInstance.getLoot();
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
    return this.#getAllCells().filter((cell) => {
      return cell.side !== "inner";
    });
  }
  #getInnerCells() {
    return this.#getAllCells().filter((cell) => {
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

  createObstacles({ skipCells = [], count = 4 } = {}) {
    const { cols, rows, cellSize, gap, y } = this;
    const innerCells = this.#getInnerCells();
    const skip = new Set(skipCells.map((c) => this.#cellKey(c)));
    for (const cell of skipCells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const col = cell.col + dc;
          const row = cell.row + dr;
          if (col < 0 || col >= this.cols) continue;
          if (row < 0 || row >= this.rows) continue;
          skip.add(this.#cellKey({ col, row }));
        }
      }
    }
    const allowed = innerCells.filter((cell) => !skip.has(this.#cellKey(cell)));
    const geometry = new THREE.BoxGeometry(
      cellSize / 1.5,
      cellSize,
      cellSize / 1.5,
    );
    const material = new THREE.MeshBasicMaterial({
      color: "#aa0000",
    });
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const step = cellSize + gap;
    const halfW = (cols * step) / 2;
    const halfH = (rows * step) / 2;

    const dummy = new THREE.Object3D();
    const obstacles = [];
    for (let i = 0; i < count; i++) {
      const cell = allowed.splice(this.#randomInt(allowed.length), 1)[0];
      const x = cell.col * step - halfW + step / 2;
      const z = cell.row * step - halfH + step / 2;
      dummy.position.set(x, y + (cellSize + 0.1) / 2, z);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      this.#setCell(cell, { type: "obstacle" });
      obstacles.push(cell);
    }
    instanced.instanceMatrix.needsUpdate = true;
    this.levelGroup.add(instanced);
    return obstacles;
  }

  createLoot({ count = 4, skipCells = [] } = {}) {
    const { cols, rows, cellSize, gap, y } = this;
    const innerCells = this.#getInnerCells();
    const skip = new Set(skipCells.map((c) => this.#cellKey(c)));
    for (const cell of skipCells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const col = cell.col + dc;
          const row = cell.row + dr;
          if (col < 0 || col >= this.cols) continue;
          if (row < 0 || row >= this.rows) continue;
          skip.add(this.#cellKey({ col, row }));
        }
      }
    }
    const allowed = innerCells.filter((cell) => !skip.has(this.#cellKey(cell)));
    const geometry = new THREE.BoxGeometry(
      cellSize / 2,
      cellSize / 2,
      cellSize / 2,
    );
    const material = new THREE.MeshBasicMaterial({
      color: "#ddd019",
    });
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const step = cellSize + gap;
    const halfW = (cols * step) / 2;
    const halfH = (rows * step) / 2;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const cell = allowed.splice(this.#randomInt(allowed.length), 1)[0];
      const x = cell.col * step - halfW + step / 2;
      const z = cell.row * step - halfH + step / 2;
      dummy.position.set(x, y + (cellSize / 2 + 0.1) / 2, z);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      this.#setCell(cell, { type: "loot" });
    }
    instanced.instanceMatrix.needsUpdate = true;
    this.levelGroup.add(instanced);
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
  getLevel() {
    return this.levelGroup;
  }
}
