import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
export default class Floor {
  constructor(options) {
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
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
      this.size.cols * this.size.rows,
    );
    this.#init();
  }
  #init() {
    const dummy = new THREE.Object3D();

    let i = 0;
    for (let z = 0; z < this.size.rows; z++) {
      for (let x = 0; x < this.size.cols; x++) {
        dummy.position.set(
          x * this.step - this.halfW,
          this.y / 2,
          z * this.step - this.halfH,
        );

        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);

        dummy.updateMatrix();
        this.instanced.setMatrixAt(i, dummy.matrix);
        i++;
      }
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
