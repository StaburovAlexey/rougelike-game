import * as THREE from 'three';
import { textureManager } from '../../core/textureManager';

export default class Obstacle {
  constructor(options, density = 0.12) {
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.height = this.cellSize * 2;
    this.y = this.height / 2 + 0.05;
    this.density = Math.min(Math.max(density, 0), 1);
    this.obstacleCells = this.#generateObstacleCells();
    this.obstacleWidth = this.cellSize * 0.7;
    this.obstacleDepth = this.cellSize * 0.7;

    this.geometry = new THREE.BoxGeometry(
      this.obstacleWidth,
      this.height,
      this.obstacleDepth,
    );
    this.material = this.#createMaterials();
    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.obstacleCells.length,
    );
    this.#init();
  }

  #toId(row, col) {
    return row * this.size.cols + col;
  }

  #generateObstacleCells() {
    const rows = this.size.rows;
    const cols = this.size.cols;
    const candidates = [];

    for (let row = 2; row < rows - 2; row++) {
      for (let col = 2; col < cols - 2; col++) {
        candidates.push({
          row,
          col,
          id: this.#toId(row, col),
          type: 'obstacle',
        });
      }
    }

    if (!candidates.length) return [];

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const count = Math.max(1, Math.floor(candidates.length * this.density));
    return candidates.slice(0, count);
  }

  getInstancedCells() {
    return this.obstacleCells;
  }

  #cloneTiledTexture(name, repeatX, repeatY) {
    const texture = textureManager.get(name).clone();
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    return texture;
  }

  #createMaterials() {
    const tileSize = 0.5;
    const sideRepeatX = Math.max(1, this.obstacleWidth / tileSize);
    const sideRepeatY = Math.max(1, this.height / tileSize);
    const topRepeatX = Math.max(1, this.obstacleWidth / tileSize);
    const topRepeatY = Math.max(1, this.obstacleDepth / tileSize);

    const sideDiff = this.#cloneTiledTexture('wallDiff', sideRepeatX, sideRepeatY);
    const sideNormal = this.#cloneTiledTexture(
      'wallNormal',
      sideRepeatX,
      sideRepeatY,
    );
    const sideAo = this.#cloneTiledTexture('wallAo', sideRepeatX, sideRepeatY);
    sideDiff.colorSpace = THREE.SRGBColorSpace;

    const topDiff = this.#cloneTiledTexture('wallDiff', topRepeatX, topRepeatY);
    const topNormal = this.#cloneTiledTexture('wallNormal', topRepeatX, topRepeatY);
    const topAo = this.#cloneTiledTexture('wallAo', topRepeatX, topRepeatY);
    topDiff.colorSpace = THREE.SRGBColorSpace;

    const sideMaterial = new THREE.MeshLambertMaterial({
      map: sideDiff,
      normalMap: sideNormal,
      aoMap: sideAo,
    });
    const topMaterial = new THREE.MeshLambertMaterial({
      map: topDiff,
      normalMap: topNormal,
      aoMap: topAo,
    });

    return [
      sideMaterial,
      sideMaterial,
      topMaterial,
      topMaterial,
      sideMaterial,
      sideMaterial,
    ];
  }

  #init() {
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.obstacleCells.length; i++) {
      const { row, col } = this.obstacleCells[i];
      dummy.position.set(
        col * this.step - this.halfW,
        this.y,
        row * this.step - this.halfH,
      );
      // dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.instanced.setMatrixAt(i, dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }
}
