import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
export default class Floor {
  constructor(options) {
    this.grid = options.grid;
    this.cellSize = options.cellSize;
    this.colorMoveCell = new THREE.Color('#f5cb12');
    this.colorAttackCell = new THREE.Color('#f51212');
    this.colorLootCell = new THREE.Color('#14ff4e');
    this.basicColorCell = new THREE.Color('#ffffff');
    this.y = 0.2;
    this.highlightCells = [];
    const floorDiff = textureManager.get('floorDiff');
    floorDiff.colorSpace = THREE.SRGBColorSpace;

    this.geometry = new THREE.BoxGeometry(this.cellSize, this.y, this.cellSize);
    this.material = new THREE.MeshLambertMaterial({
      normalMap: textureManager.get('floorNormal'),
      map: floorDiff,
      aoMap: textureManager.get('floorAo'),
    });
    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.grid.cols * this.grid.rows,
    );
    this.#init();
  }
  #init() {
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.grid.cells.length; i++) {
      const cell = this.grid.getId(i);
      dummy.position.set(cell.worldX, this.y / 2, cell.worldZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.instanced.setMatrixAt(i, dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }
  hightLightMove(ids) {
    if (this.highlightCells.length > 0) {
      for (const id of this.highlightCells) {
        this.instanced.setColorAt(id, this.basicColorCell);
      }
      this.highlightCells.length = 0;
    }
    for (const id of ids) {
      this.instanced.setColorAt(id, this.colorMoveCell);
      this.highlightCells.push(id);
    }
    this.instanced.instanceColor.needsUpdate = true;
  }
}
