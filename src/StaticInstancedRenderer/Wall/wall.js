import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
export default class Wall {
  constructor(options, doorsCount = 1) {
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.wallHeight = this.cellSize;
    this.wallY = this.wallHeight / 2;
    this.doorsCount = Math.min(Math.max(doorsCount, 0), 4);
    this.windowsChance = 0.1;
    this.windowsCount = 2;
    this.torchesChance = 0.1;
    this.torchesCount = 2;
    this.doorCells = this.#generateDoorCells();
    this.windowCells = this.#generateWindowCells();
    this.torchCells = this.#generateTorchCells();
    this.wallCells = this.#generateWallCells();
    this.geometry = new THREE.BoxGeometry(
      this.cellSize,
      this.wallHeight,
      this.cellSize,
    );
    const wallDiff = textureManager.get('wallDiff');
    wallDiff.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshLambertMaterial({
      normalMap: textureManager.get('wallNormal'),
      map: wallDiff,
      aoMap: textureManager.get('wallAo'),
    });
    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.wallCells.length,
    );
    this.#init();
  }
  #toId(row, col) {
    return row * this.size.cols + col;
  }
  #generateDoorCells() {
    const sides = ['top', 'right', 'bottom', 'left'];
    const shuffled = sides.sort(() => Math.random() - 0.5);
    const selectedSides = shuffled.slice(0, this.doorsCount);
    const result = [];

    for (const side of selectedSides) {
      const cell = this.#pickCellOnSide(side, result, true);
      if (!cell) continue;
      result.push(cell);
    }

    return result;
  }
  #isCorner(row, col) {
    const lastRow = this.size.rows - 1;
    const lastCol = this.size.cols - 1;
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
  #pickCellOnSide(side, reserved = [], avoidCorners = true) {
    const rows = this.size.rows;
    const cols = this.size.cols;
    const candidates = [];

    if (side === 'top') {
      for (let c = 0; c < cols; c++) candidates.push({ row: 0, col: c });
    }

    if (side === 'bottom') {
      for (let c = 0; c < cols; c++) candidates.push({ row: rows - 1, col: c });
    }

    if (side === 'left') {
      for (let r = 0; r < rows; r++) candidates.push({ row: r, col: 0 });
    }

    if (side === 'right') {
      for (let r = 0; r < rows; r++) candidates.push({ row: r, col: cols - 1 });
    }
    const mapped = candidates.map((c) => ({
      ...c,
      id: this.#toId(c.row, c.col),
      side,
    }));
    const free = mapped.filter((cell) => {
      if (avoidCorners && this.#isCorner(cell.row, cell.col)) return false;
      return this.#isValidCandidate(cell, reserved);
    });
    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
  }
  #generateWallCells() {
    const rows = this.size.rows;
    const cols = this.size.cols;
    const perimeter = [];

    for (let c = 0; c < cols; c++) {
      perimeter.push({ row: 0, col: c, id: this.#toId(0, c), side: 'top' });
    }
    if (rows > 1) {
      for (let c = 0; c < cols; c++) {
        perimeter.push({
          row: rows - 1,
          col: c,
          id: this.#toId(rows - 1, c),
          side: 'bottom',
        });
      }
    }
    for (let r = 1; r < rows - 1; r++) {
      perimeter.push({ row: r, col: 0, id: this.#toId(r, 0), side: 'left' });
    }
    if (cols > 1) {
      for (let r = 1; r < rows - 1; r++) {
        perimeter.push({
          row: r,
          col: cols - 1,
          id: this.#toId(r, cols - 1),
          side: 'right',
        });
      }
    }

    const doorIds = new Set(this.doorCells.map((cell) => cell.id));
    const windowIds = new Set(this.windowCells.map((cell) => cell.id));
    const torchIds = new Set(this.torchCells.map((cell) => cell.id));
    return perimeter.filter(
      (cell) =>
        !doorIds.has(cell.id) &&
        !windowIds.has(cell.id) &&
        !torchIds.has(cell.id),
    );
  }
  #generateWindowCells() {
    if (Math.random() > this.windowsChance) return [];
    const windows = [];
    const count = this.windowsCount;
    const sides = ['top', 'right', 'bottom', 'left'];
    let attempts = 0;
    while (windows.length < count && attempts < 200) {
      attempts++;
      const side = sides[Math.floor(Math.random() * sides.length)];
      const reserved = [...this.doorCells, ...windows];
      const cell = this.#pickCellOnSide(side, reserved, true);
      if (!cell) continue;
      windows.push(cell);
    }
    return windows;
  }
  #generateTorchCells() {
    if (Math.random() > this.torchesChance) return [];
    const torches = [];
    const count = this.torchesCount;
    const sides = ['top', 'right', 'bottom', 'left'];
    let attempts = 0;
    while (torches.length < count && attempts < 200) {
      attempts++;
      const side = sides[Math.floor(Math.random() * sides.length)];
      const reserved = [...this.doorCells, ...this.windowCells, ...torches];
      const cell = this.#pickCellOnSide(side, reserved, true);
      if (!cell) continue;
      torches.push(cell);
    }
    return torches;
  }
  getDoorCells() {
    return this.doorCells;
  }
  getWindowCells() {
    return this.windowCells;
  }
  getTorchCells() {
    return this.torchCells;
  }
  getWallCells() {
    return this.wallCells;
  }
  #init() {
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.wallCells.length; i++) {
      const { row, col } = this.wallCells[i];

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(
        col * this.step - this.halfW,
        this.wallY + 0.05,
        row * this.step - this.halfH,
      );
      if (
        this.wallCells[i].side === 'right' ||
        this.wallCells[i].side === 'left'
      ) {
        dummy.scale.set(0.5, 0.7, 1);
      } else {
        dummy.scale.set(1, 0.7, 0.5);
      }
      if (this.#isCorner(this.wallCells[i].row, this.wallCells[i].col)) {
        dummy.scale.set(1, 1, 1);
        dummy.position.set(
          col * this.step - this.halfW,
          this.wallY + 0.2,
          row * this.step - this.halfH,
        );
      }
      dummy.updateMatrix();
      this.instanced.setMatrixAt(i, dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }
}
