import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
import CONSTANTS from '../../static/constants';

export default class Floor {
  constructor(options) {
    this.grid = options.grid;
    this.colorMoveCell = new THREE.Color('#f5cb12');
    this.colorAttackCell = new THREE.Color('#f51212');
    this.colorLootCell = new THREE.Color('#14ff4e');
    this.basicColorCell = new THREE.Color('#ffffff');
    this.y = 0.2;
    this.highlightCells = [];
    const floorDiff = textureManager.get('floorDiff');
    floorDiff.colorSpace = THREE.SRGBColorSpace;

    this.geometry = new THREE.BoxGeometry(
      CONSTANTS.CELL_SIZE,
      this.y,
      CONSTANTS.CELL_SIZE,
    );
    this.geometry.userData.disposeOnRemove = true;
    this.material = new THREE.MeshLambertMaterial({
      normalMap: textureManager.get('floorNormal'),
      map: floorDiff,
      aoMap: textureManager.get('floorAo'),
    });
    this.material.userData.disposeOnRemove = true;
    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.grid.cols * this.grid.rows,
    );
    this.dummy = new THREE.Object3D();
    this.#init();
  }

  #init() {
    for (let i = 0; i < this.grid.cells.length; i++) {
      const cell = this.grid.cells[i];
      this.dummy.position.set(cell.worldX, this.y / 2, cell.worldZ);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(
        CONSTANTS.HIDDEN_SCALE,
        CONSTANTS.HIDDEN_SCALE,
        CONSTANTS.HIDDEN_SCALE,
      );
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }

  updateVisible(cells) {
    cells.forEach((cell) => {
      this.dummy.position.set(cell.worldX, this.y / 2, cell.worldZ);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(cell.id, this.dummy.matrix);
    });

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
