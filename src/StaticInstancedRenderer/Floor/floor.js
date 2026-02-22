import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';
export default class Floor {
  constructor(options) {
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.y = 0.2;
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
    for (const id of ids) {
      this.instanced.setColorAt(id, new THREE.Color(0xff0000));
    }
    this.instanced.instanceColor.needsUpdate = true;
  }
}
