import * as THREE from "three";

export default class Environment {
  #mesh;
  #cells;
  constructor({
    cols,
    rows,
    cellSize,
    gap,
    y,
    setCell,
    thickness = 0.1,
    color = "#ffffff",
  } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.gap = gap;
    this.y = y;
    this.setCell = setCell;
    this.count = cols * rows;
    this.thickness = thickness;
    this.color = color;

    this.step = cellSize + gap;
    this.halfW = (cols * this.step) / 2;
    this.halfH = (rows * this.step) / 2;

    this.dummy = new THREE.Object3D();
  }
  createInstance({
    count = this.count,
    thickness = this.thickness,
    color = this.color,
  } = {}) {
    this.count = count;
    this.thickness = thickness;
    this.color = color;

    this.geometry = new THREE.BoxGeometry(
      this.cellSize,
      this.thickness,
      this.cellSize,
    );
    this.material = new THREE.MeshBasicMaterial({
      color: this.color,
      
    });

    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.count,
    );
    this.instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    return this.instanced;
  }
  getX(cell) {
    return cell.col * this.step - this.halfW + this.step / 2;
  }
  getZ(cell) {
    return cell.row * this.step - this.halfH + this.step / 2;
  }
  isCorner(cell) {
    return (
      (cell.col === 0 && cell.row === 0) ||
      (cell.col === 0 && cell.row === this.rows - 1) ||
      (cell.col === this.cols - 1 && cell.row === 0) ||
      (cell.col === this.cols - 1 && cell.row === this.rows - 1)
    );
  }
  getUserData() {
    const { cols, rows, cellSize, gap, y } = this;
    return { cols, rows, cellSize, gap, y };
  }
  randomInt(max) {
    return Math.floor(Math.random() * max);
  }
  cellKey({ col, row }) {
    return `${col}:${row}`;
  }
  create() {
    return { instanced: this.#mesh, cells: this.#cells };
  }
  setMesh(mesh, cells) {
    this.#mesh = mesh;
    this.#cells = cells;
  }
}
