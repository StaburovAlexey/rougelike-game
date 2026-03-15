import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

export default class Wall {
  constructor(options, doorsCount = 1) {
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.doorsCount = Math.min(Math.max(doorsCount, 0), 4);
    this.windowsChance = 1;
    this.windowsCount = 0;
    this.torchesChance = 1;
    this.torchesCount = 4;
    this.doorCells = this.#generateDoorCells();
    this.windowCells = this.#generateWindowCells();
    this.torchCells = this.#generateTorchCells();
    this.wallCells = this.#generateWallCells();

    const wallModel = modelManager.get('wall');
    wallModel.scene.updateMatrixWorld(true);
    const wallGroups = wallModel.scene.children.filter((child) => child.isGroup);
    if (!wallGroups.length) {
      throw new Error('Wall model has no grouped wall variants');
    }

    this.variants = wallGroups.map((wallGroup) => {
      const bbox = new THREE.Box3().setFromObject(wallGroup);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const parts = [];
      wallGroup.traverse((child) => {
        if (!child.isMesh) return;
        parts.push({
          geometry: child.geometry,
          material: this.#createMaterial(child.material),
        });
      });

      return {
        parts,
        modelSize: new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1),
        yOffset: -bbox.min.y,
      };
    });

    this.wallVariantByCell = this.wallCells.map(
      () => Math.floor(Math.random() * this.variants.length),
    );
    this.wallFacingByCell = this.wallCells.map(() => (Math.random() < 0.5 ? 0 : Math.PI));
    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.wallVariantByCell.length; i++) {
      variantCounts[this.wallVariantByCell[i]]++;
    }

    this.instanced = new THREE.Group();
    this.variantInstances = this.variants.map((variant, variantIndex) => {
      const count = variantCounts[variantIndex];
      if (!count) return null;
      return variant.parts.map((part) => {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, count);
        this.instanced.add(mesh);
        return mesh;
      });
    });
    this.#init();
  }

  #createMaterial(sourceMaterial) {
    const materialName = sourceMaterial?.name || '';
    const color =
      materialName === 'Border'
        ? COLORS.BORDER_COLOR
        : COLORS.ROCK_WALL_COLOR;

    return new THREE.MeshLambertMaterial({ color });
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
    const cornerSize = this.cellSize;
    const scale = new THREE.Vector3();
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.wallCells.length; i++) {
      const { row, col, side } = this.wallCells[i];
      const variantIndex = this.wallVariantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;
      const isCorner = this.#isCorner(row, col);
      const isSideWall = side === 'left' || side === 'right';
      const facingOffset = this.wallFacingByCell[i];
      const targetY = isCorner ? cornerSize : variant.modelSize.y;

      dummy.rotation.set(0, (isSideWall ? Math.PI / 2 : 0) + facingOffset, 0);
      dummy.position.set(
        col * this.step - this.halfW,
        variant.yOffset + 0.2,
        row * this.step - this.halfH,
      );

      if (isCorner) {
        scale.set(
          cornerSize / variant.modelSize.x,
          cornerSize / variant.modelSize.y,
          cornerSize / variant.modelSize.z,
        );
      } else {
        scale.set(1, 1, 1);
      }
      dummy.scale.copy(scale);

      dummy.updateMatrix();
      for (let j = 0; j < instancedMeshes.length; j++) {
        instancedMeshes[j].setMatrixAt(writeOffsets[variantIndex], dummy.matrix);
      }
      writeOffsets[variantIndex]++;
    }

    for (let i = 0; i < this.variantInstances.length; i++) {
      const instancedMeshes = this.variantInstances[i];
      if (!instancedMeshes) continue;
      for (let j = 0; j < instancedMeshes.length; j++) {
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }
    }
  }
}
