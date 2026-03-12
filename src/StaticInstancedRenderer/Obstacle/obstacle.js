import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';

export default class Obstacle {
  constructor(options, density = 0.12) {
    this.minObstacle3Distance = 3;
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.density = Math.min(Math.max(density, 0), 1);
    this.obstacleCells = this.#generateObstacleCells();

    const obstacleModel = modelManager.get('obstacle');
    const obstacleMeshes = [];
    obstacleModel.scene.traverse((child) => {
      if (child.isMesh) obstacleMeshes.push(child);
    });
    console.log(
      'Obstacle mesh names:',
      obstacleMeshes.map((mesh) => mesh.name),
    );
    obstacleModel.scene.updateMatrixWorld(true);
    if (!obstacleMeshes.length) {
      throw new Error('Obstacle model has no mesh objects');
    }

    this.material = new THREE.MeshLambertMaterial({ color: '#6f7c86' });
    this.variants = obstacleMeshes.map((obstacleMesh) => {
      const geometry = obstacleMesh.geometry;
      geometry.computeBoundingBox();
      const basePosition = new THREE.Vector3();
      const baseQuaternion = new THREE.Quaternion();
      const baseScale = new THREE.Vector3();
      obstacleMesh.matrixWorld.decompose(basePosition, baseQuaternion, baseScale);
      const baseMatrix = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0, 0),
        baseQuaternion,
        baseScale,
      );
      const worldBbox = geometry.boundingBox.clone().applyMatrix4(baseMatrix);
      return {
        name: obstacleMesh.name,
        geometry,
        baseMatrix,
        yOffset: -worldBbox.min.y + 0.05,
      };
    });

    this.obstacleVariantByCell = this.#generateObstacleVariants();
    this.obstacleRotationByCell = this.obstacleCells.map(
      () => Math.random() * Math.PI * 2,
    );
    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.obstacleVariantByCell.length; i++) {
      variantCounts[this.obstacleVariantByCell[i]]++;
    }

    this.instanced = new THREE.Group();
    this.variantInstances = this.variants.map((variant, variantIndex) => {
      const count = variantCounts[variantIndex];
      if (!count) return null;
      const mesh = new THREE.InstancedMesh(variant.geometry, this.material, count);
      this.instanced.add(mesh);
      return mesh;
    });
    this.#init();
  }

  #toId(row, col) {
    return row * this.size.cols + col;
  }

  #isObstacle3Variant(variantIndex) {
    const variant = this.variants[variantIndex];
    return Boolean(variant?.name && variant.name.toLowerCase().includes('obstacle_3'));
  }

  #isFarEnoughFromObstacle3(cell, placedCells) {
    const minDistanceSquared = this.minObstacle3Distance * this.minObstacle3Distance;

    return placedCells.every((placedCell) => {
      const rowDelta = cell.row - placedCell.row;
      const colDelta = cell.col - placedCell.col;
      return rowDelta * rowDelta + colDelta * colDelta >= minDistanceSquared;
    });
  }

  #generateObstacleVariants() {
    const obstacle3VariantIndices = this.variants
      .map((variant, index) => (this.#isObstacle3Variant(index) ? index : -1))
      .filter((index) => index !== -1);
    const fallbackVariantIndices = this.variants
      .map((_, index) => index)
      .filter((index) => !obstacle3VariantIndices.includes(index));

    const obstacle3Cells = [];

    return this.obstacleCells.map((cell) => {
      let variantIndex = Math.floor(Math.random() * this.variants.length);

      if (
        this.#isObstacle3Variant(variantIndex) &&
        !this.#isFarEnoughFromObstacle3(cell, obstacle3Cells)
      ) {
        if (fallbackVariantIndices.length) {
          variantIndex =
            fallbackVariantIndices[
              Math.floor(Math.random() * fallbackVariantIndices.length)
            ];
        }
      }

      if (this.#isObstacle3Variant(variantIndex)) {
        obstacle3Cells.push(cell);
      }

      return variantIndex;
    });
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

  #init() {
    const dummy = new THREE.Object3D();
    const finalMatrix = new THREE.Matrix4();
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.obstacleCells.length; i++) {
      const { row, col } = this.obstacleCells[i];
      const variantIndex = this.obstacleVariantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMesh = this.variantInstances[variantIndex];
      if (!instancedMesh) continue;
      dummy.position.set(
        col * this.step - this.halfW,
        variant.yOffset + 0.15,
        row * this.step - this.halfH,
      );
      dummy.rotation.set(0, this.obstacleRotationByCell[i], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      finalMatrix.multiplyMatrices(dummy.matrix, variant.baseMatrix);
      instancedMesh.setMatrixAt(writeOffsets[variantIndex], finalMatrix);
      writeOffsets[variantIndex]++;
    }

    for (let i = 0; i < this.variantInstances.length; i++) {
      const instancedMesh = this.variantInstances[i];
      if (!instancedMesh) continue;
      instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }
}
