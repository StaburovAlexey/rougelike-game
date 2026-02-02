import * as THREE from 'three';

export default class CreateLevel {
  constructor({ cols = 10, rows = 10, cellSize = 1, gap = 0.1, y = 0 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.gap = gap;
    this.y = y;

    this.levelGroup = new THREE.Group();

    this.createGridFloorInstanced();
    this.createWalls();
  }

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
  createWalls() {
    const { cols, rows, cellSize, gap, y } = this;
    const count = 2 * cols + 2 * rows - 4;
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
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isEdge = c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
        if (!isEdge) continue;
        const colStartAndEnd = c === 0 || c === cols - 1;
        const rowStartAndEnd = r === 0 || r === rows - 1;
        const isCorner =
          (c === 0 && r === 0) ||
          (c === 0 && r === this.rows - 1) ||
          (c === this.cols - 1 && r === 0) ||
          (c === this.cols - 1 && r === this.rows - 1);
        const x = c * step - halfW + step / 2;
        const z = r * step - halfH + step / 2;
        if (colStartAndEnd) {
          dummy.scale.set(0.5, 1, 1);
        } else if (rowStartAndEnd) {
          dummy.scale.set(1, 1, 0.5);
        }
        if (isCorner) {
          dummy.scale.set(1, 1, 1);
        }
        dummy.position.set(x, y, z);
        dummy.position.y = y + (wallHeight + 0.1) / 2;
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);

        i++;
      }
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

  idToGrid(instanceId) {
    const col = instanceId % this.cols;
    const row = Math.floor(instanceId / this.cols);
    return { col, row };
  }

  gridToWorld(col, row, heightOffset = 0) {
    const step = this.cellSize + this.gap;
    const halfW = (this.cols * step) / 2;
    const halfH = (this.rows * step) / 2;

    const x = col * step - halfW + step / 2;
    const z = row * step - halfH + step / 2;

    return new THREE.Vector3(x, this.y + heightOffset, z);
  }

  getLevel() {
    return this.levelGroup;
  }
}
