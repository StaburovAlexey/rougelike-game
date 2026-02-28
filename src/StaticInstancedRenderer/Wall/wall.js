import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';

export default class Wall {
  constructor(options, doorsCount = 1) {
    this.wallColor = '#6f7c86';
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.doorsCount = Math.min(Math.max(doorsCount, 0), 4);
    this.windowsChance = 1;
    this.windowsCount = 2;
    this.torchesChance = 1;
    this.torchesCount = 2;
    this.doorCells = this.#generateDoorCells();
    this.windowCells = this.#generateWindowCells();
    this.torchCells = this.#generateTorchCells();
    this.wallCells = this.#generateWallCells();

    const wallMesh = modelManager.get('wall').scene.children.find((child) => child.isMesh);
    this.geometry = wallMesh.geometry;
    this.material = new THREE.MeshLambertMaterial({ color: this.wallColor });
    this.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    this.geometry.boundingBox.getSize(size);
    this.modelSize = new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1);

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
      const cell = this.#pickCellOnSide(side, result, true, 'door');
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

  #pickCellOnSide(side, reserved = [], avoidCorners = true, type) {
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
      type,
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
      perimeter.push({ row: 0, col: c, id: this.#toId(0, c), side: 'top', type: 'wall' });
    }

    if (rows > 1) {
      for (let c = 0; c < cols; c++) {
        perimeter.push({
          row: rows - 1,
          col: c,
          id: this.#toId(rows - 1, c),
          side: 'bottom',
          type: 'wall',
        });
      }
    }

    for (let r = 1; r < rows - 1; r++) {
      perimeter.push({ row: r, col: 0, id: this.#toId(r, 0), side: 'left', type: 'wall' });
    }

    if (cols > 1) {
      for (let r = 1; r < rows - 1; r++) {
        perimeter.push({
          row: r,
          col: cols - 1,
          id: this.#toId(r, cols - 1),
          side: 'right',
          type: 'wall',
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
    const uniqueSidesLimit = Math.min(count, 4);
    const usedSides = new Set();
    let attempts = 0;

    while (windows.length < count && attempts < 200) {
      attempts++;
      const sidePool =
        windows.length < uniqueSidesLimit
          ? sides.filter((side) => !usedSides.has(side))
          : sides;
      if (!sidePool.length) continue;
      const side = sidePool[Math.floor(Math.random() * sidePool.length)];
      const reserved = [...this.doorCells, ...windows];
      const cell = this.#pickCellOnSide(side, reserved, true, 'window');
      if (!cell) continue;
      windows.push(cell);
      if (windows.length <= uniqueSidesLimit) usedSides.add(side);
    }

    return windows;
  }

  #generateTorchCells() {
    if (Math.random() > this.torchesChance) return [];
    const torches = [];
    const count = this.torchesCount;
    const sides = ['top', 'right', 'bottom', 'left'];
    const uniqueSidesLimit = Math.min(count, 4);
    const usedSides = new Set();
    let attempts = 0;

    while (torches.length < count && attempts < 200) {
      attempts++;
      const sidePool =
        torches.length < uniqueSidesLimit
          ? sides.filter((side) => !usedSides.has(side))
          : sides;
      if (!sidePool.length) continue;
      const side = sidePool[Math.floor(Math.random() * sidePool.length)];
      const reserved = [...this.doorCells, ...this.windowCells, ...torches];
      const cell = this.#pickCellOnSide(side, reserved, true, 'torch');
      if (!cell) continue;
      torches.push(cell);
      if (torches.length <= uniqueSidesLimit) usedSides.add(side);
    }

    return torches;
  }

  getInstancedCells() {
    return [this.doorCells, this.windowCells, this.torchCells, this.wallCells].flat();
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
    const defaultHeight = this.cellSize * 0.8;
    const longSize = this.cellSize;
    const shortSize = this.cellSize * 0.5;

    for (let i = 0; i < this.wallCells.length; i++) {
      const { row, col, side } = this.wallCells[i];
      const isCorner = this.#isCorner(row, col);
      const isSideWall = side === 'left' || side === 'right';
      const targetX = isCorner ? this.cellSize : longSize;
      const targetY = isCorner ? this.cellSize : defaultHeight;
      const targetZ = isCorner ? this.cellSize : shortSize;

      dummy.rotation.set(0, isSideWall ? Math.PI / 2 : 0, 0);
      dummy.position.set(
        col * this.step - this.halfW,
        targetY / 2 + 0.2,
        row * this.step - this.halfH,
      );
      dummy.scale.set(
        targetX / this.modelSize.x,
        targetY / this.modelSize.y,
        targetZ / this.modelSize.z,
      );

      dummy.updateMatrix();
      this.instanced.setMatrixAt(i, dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }
}
