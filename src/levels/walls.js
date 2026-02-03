import * as THREE from "three";
import Environment from "./environment";

export default class Walls extends Environment {
  #wall;
  constructor(options = {}) {
    super({ ...options });

    const {
      y = 0,
      rows,
      cols,
      cells = [],
      skipCells = [],
      levelGroup = new THREE.Group(),
      setCell,
    } = options;

    this.levelGroup = levelGroup;
    this.y = y;
    this.cells = cells;
    this.skipCells = skipCells;
    this.setCell = setCell;
    this.#wall = null;
    this.cols = cols;
    this.rows = rows;

    if (!this.setCell) {
      throw new Error("Walls: setCell is required");
    }
    if (!this.skipCells) {
      throw new Error("Walls: skipCells is required");
    }
    this.createWalls()
  }

  createWalls() {
    const skip = new Set(this.skipCells.map((c) => this.cellKey(c)));
    const perimetrCells = this.cells;
    const count = perimetrCells.reduce((acc, cell) => {
      const key = this.cellKey(cell);
      return acc + (skip.has(key) ? 0 : 1);
    }, 0);
    this.createInstance({ count, thickness: 1, color: 0x888888 });
    let i = 0;
    for (const cell of perimetrCells) {
      const key = this.cellKey(cell);
      if (skip.has(key)) continue;
      const colStartAndEnd = cell.col === 0 || cell.col === this.cols - 1;
      const rowStartAndEnd = cell.row === 0 || cell.row === this.rows - 1;
      const x = this.getX(cell);
      const z = this.getZ(cell);
      this.dummy.scale.set(1, 1, 1);
      if (colStartAndEnd) {
        this.dummy.scale.set(0.5, 1, 1);
      } else if (rowStartAndEnd) {
        this.dummy.scale.set(1, 1, 0.5);
      }
      if (this.isCorner(cell)) {
        this.dummy.scale.set(1, 1, 1);
      }
      this.dummy.position.set(x, this.y, z);
      this.dummy.position.y = this.y + (this.thickness + 0.1) / 2;
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);
      this.setCell(cell, { type: "wall" });
      i++;
    }
    this.instanced.instanceMatrix.needsUpdate = true;
    this.instanced.userData = this.getUserData();

    this.#wall = this.instanced;
    this.levelGroup.add(this.instanced);
  }
  getWall() {
    return this.#wall;
  }
}
