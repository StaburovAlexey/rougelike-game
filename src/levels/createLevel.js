import * as THREE from 'three';

export default class CreateLevel {
  constructor({ cols = 10, rows = 10, cellSize = 1, gap = 0.1, y = 0 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.gap = gap;
    this.y = y;
    this.cellContents = new Map();
    this.levelGroup = new THREE.Group();
    this.createGridFloorInstanced();
    this.doors = this.pickDoors(3);
    
    this.createWalls({ skipCells: this.doors });
    this.createObstacles({ skipCells: this.doors });
    this.createDoorsInstanced(this.doors);
  }
  #setCell = (cell, data) => {
    const key = this.#cellKey(cell);
    this.cellContents.set(key, data);
  };
  createGridFloorInstanced() {
    const { cols, rows, cellSize, gap, y } = this;

    const count = cols * rows;
    const thickness = 0.1;
    const geometry = new THREE.BoxGeometry(cellSize, thickness, cellSize);
    const material = new THREE.MeshBasicMaterial({});

    const instanced = new THREE.InstancedMesh(geometry, material, count);
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const step = cellSize + gap;
    const halfW = (cols * step) / 2;
    const halfH = (rows * step) / 2;

    const dummy = new THREE.Object3D();

    let i = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * step - halfW + step / 2;
        const z = r * step - halfH + step / 2;

        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        dummy.position.y = y + thickness;
        instanced.setMatrixAt(i, dummy.matrix);

        i++;
      }
    }

    instanced.instanceMatrix.needsUpdate = true;

    instanced.userData = {
      cols,
      rows,
      cellSize,
      gap,
      y,
    };

    this.floor = instanced;
    this.levelGroup.add(instanced);
  }
  #getPerimeterCells() {
    const cells = [];
    const { cols, rows } = this;
    for (let c = 0; c < cols; c++) {
      cells.push({ col: c, row: 0, side: 'top' });
      cells.push({ col: c, row: rows - 1, side: 'bottom' });
    }
    for (let r = 1; r < rows - 1; r++) {
      cells.push({ col: 0, row: r, side: 'left' });
      cells.push({ col: cols - 1, row: r, side: 'right' });
    }
    return cells;
  }
  #getInnerCells() {
    const cells = [];
    const { cols, rows } = this;

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        cells.push({
          col: c,
          row: r,
          side: 'inner',
        });
      }
    }

    return cells;
  }
  #getFreeCells() {
  const cells = this.#getInnerCells() 
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
      color: '#aa0000',
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
      dummy.position.set(x, y + (cellSize + 0.1) / 2, z);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      this.#setCell(cell, { type: 'obstacle' });
    }
    instanced.instanceMatrix.needsUpdate = true;
    this.obstacles = instanced;
    this.levelGroup.add(instanced);
  }
  createWalls({ skipCells = [] } = {}) {
    const { cols, rows, cellSize, gap, y } = this;
    const skip = new Set(skipCells.map((c) => this.#cellKey(c)));
    const perimetrCells = this.#getPerimeterCells();
    const count = perimetrCells.reduce((acc, cell) => {
      const key = this.#cellKey(cell);
      return acc + (skip.has(key) ? 0 : 1);
    }, 0);
    const wallHeight = 1;
    const geometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, count);
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const step = cellSize + gap;
    const halfW = (cols * step) / 2;
    const halfH = (rows * step) / 2;

    const dummy = new THREE.Object3D();

    let i = 0;
    for (const cell of perimetrCells) {
      const key = this.#cellKey(cell);
      if (skip.has(key)) continue;
      const colStartAndEnd = cell.col === 0 || cell.col === cols - 1;
      const rowStartAndEnd = cell.row === 0 || cell.row === rows - 1;
      const x = cell.col * step - halfW + step / 2;
      const z = cell.row * step - halfH + step / 2;
      dummy.scale.set(1, 1, 1);
      if (colStartAndEnd) {
        dummy.scale.set(0.5, 1, 1);
      } else if (rowStartAndEnd) {
        dummy.scale.set(1, 1, 0.5);
      }
      if (this.isCorner(cell)) {
        dummy.scale.set(1, 1, 1);
      }
      dummy.position.set(x, y, z);
      dummy.position.y = y + (wallHeight + 0.1) / 2;
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      this.#setCell(cell, { type: 'wall' });
      i++;
    }
    instanced.userData = {
      cols,
      rows,
      cellSize,
      gap,
      y,
    };
    instanced.instanceMatrix.needsUpdate = true;
    this.wall = instanced;
    this.levelGroup.add(instanced);
  }
  #cellKey({ col, row }) {
    return `${col}:${row}`;
  }
  pickDoors(total = 3) {
    if (total < 1) throw new Error('total doors must be >= 1');
    const perimeter = this.#getPerimeterCells();
    const candidates = perimeter.filter((cell) => !this.isCorner(cell));

    if (candidates.length < total) {
      throw new Error('not enough perimeter cells for doors');
    }
    const inCell = candidates[this.#randomInt(candidates.length)];
    const usedKeys = new Set([this.#cellKey(inCell)]);
    const usedSides = new Set([inCell.side]);
    const outs = [];

    while (outs.length < total - 1) {
      const candidate = candidates[this.#randomInt(candidates.length)];
      const key = this.#cellKey(candidate);

      if (usedKeys.has(key)) continue;
      if (usedSides.has(candidate.side)) continue;

      usedKeys.add(key);
      usedSides.add(candidate.side);
      outs.push(candidate);
    }
    return [
      { ...inCell, type: 'in' },
      ...outs.map((c) => ({ ...c, type: 'out' })),
    ];
  }
  createDoorsInstanced(doors) {
    const { cols, rows, cellSize, gap, y } = this;
    const wallHeight = 1.2;
    const geometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    console.log('Creating doors instanced:', doors);
    const instanced = new THREE.InstancedMesh(geometry, material, doors.length);
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // если хочешь разные цвета (вход/выход)
    instanced.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(doors.length * 3),
      3,
    );

    const step = cellSize + gap;
    const halfW = (cols * step) / 2;
    const halfH = (rows * step) / 2;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    dummy.scale.set(1, 1, 1);
    for (let i = 0; i < doors.length; i++) {
      const { col, row, type } = doors[i];

      const cx = col * step - halfW + step / 2;
      const cz = row * step - halfH + step / 2;
      if (doors[i].side === 'top' || doors[i].side === 'bottom') {
        dummy.scale.set(1, 1, 0.5);
      } else {
        dummy.scale.set(0.5, 1, 1);
      }
      dummy.position.set(cx, y + (wallHeight + 0.1) / 2, cz);
      dummy.rotation.set(0, 0, 0);

      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);

      if (type === 'in') color.setHex(0x00ff00);
      else color.setHex(0x3366ff);

      instanced.setColorAt(i, color);
      this.#setCell({ col, row }, { type: 'door', doorType: type });
    }

    instanced.instanceMatrix.needsUpdate = true;
    instanced.instanceColor.needsUpdate = true;

    this.doorsMesh = instanced;
    this.levelGroup.add(instanced);
  }
  idToGrid(instanceId) {
    const col = instanceId % this.cols;
    const row = Math.floor(instanceId / this.cols);
    const key = this.#cellKey({ col, row });
    const content = this.cellContents.get(key) || { type: 'floor' };
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
