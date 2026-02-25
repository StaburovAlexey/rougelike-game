import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
export default class Torch {
  constructor({ cells, halfW, halfH, step, cellSize } = {}) {
    this.cells = cells;
    this.halfH = halfH;
    this.halfW = halfW;
    this.step = step;
    this.cellSize = cellSize;
    this.y = cellSize * 2;
    this.geometry = new THREE.BoxGeometry(
      this.cellSize,
      this.y,
      this.cellSize,
    );
    this.material = new THREE.MeshLambertMaterial({
      color: '#ff3232',
    });
    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.cells.length,
    );
    this.#init();
  }
  #init() {
    const dummy = new THREE.Object3D();
    let i = 0;
    for (const cell of this.cells) {
      dummy.rotation.set(0, 0, 0);
      const x = cell.col * this.step - this.halfW;
      const z = cell.row * this.step - this.halfH;
      dummy.position.set(x, this.y / 2 + 0.2, z);
      // ориентация по стороне
      if (cell.side === 'left' || cell.side === 'right')
        dummy.rotation.y = Math.PI / 2;
      else dummy.rotation.y = 0;
      dummy.updateMatrix();
      this.instanced.setMatrixAt(i, dummy.matrix);
      i++;
    }
    this.instanced.instanceMatrix.needsUpdate = true;
  }
}
