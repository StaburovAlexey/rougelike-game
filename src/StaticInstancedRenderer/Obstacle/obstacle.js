import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

const colorByMaterialName = {
  Bonfire: COLORS.BONFIRE_WOOD_COLOR,
  Border: COLORS.BORDER_COLOR,
  BoxSteel: COLORS.BOX_STEEL_COLOR,
  BoxWood: COLORS.BOX_WOOD_COLOR,
  RockWall: COLORS.ROCK_WALL_COLOR,
  ShieldSteel: COLORS.SHIELD_STEEL_COLOR,
  ShieldWood: COLORS.SHIELD_WOOD_COLOR,
};

export default class Obstacle {
  constructor(options) {
    this.grid = options.grid;
    this.minBonfireDistance = 2;
    this.obstacleCells = this.grid.getObstacleCells();
    this.hiddenScale = new THREE.Vector3(
      COLORS.HIDDEN_SCALE,
      COLORS.HIDDEN_SCALE,
      COLORS.HIDDEN_SCALE,
    );
    this.cellById = new Map();
    this.variantIndexByCellId = new Map();
    this.instanceIndexByCellId = new Map();
    this.rotationByCellId = new Map();

    this.variants = this.#loadVariants();

    this.obstacleVariantByCell = this.#generateObstacleVariants();
    this.obstacleRotationByCell = this.obstacleCells.map(
      () => Math.random() * Math.PI * 2,
    );

    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.obstacleVariantByCell.length; i++) {
      variantCounts[this.obstacleVariantByCell[i]]++;
      this.cellById.set(this.obstacleCells[i].id, this.obstacleCells[i]);
      this.rotationByCellId.set(this.obstacleCells[i].id, this.obstacleRotationByCell[i]);
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
    const material = new THREE.MeshLambertMaterial({
      color: colorByMaterialName[materialName] || COLORS.ROCK_WALL_COLOR,
    });
    material.userData.disposeOnRemove = true;
    return material;
  }

  #createVariant(object3D) {
    object3D.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3().setFromObject(object3D);
    const parts = [];
    object3D.traverse((child) => {
      if (!child.isMesh) return;
      parts.push({
        geometry: child.geometry,
        material: this.#createMaterial(child.material),
        localMatrix: child.matrixWorld.clone(),
      });
    });

    return {
      name: object3D.name,
      parts,
      yOffset: -bbox.min.y,
    };
  }

  #loadVariants() {
    const levelModel = modelManager.get('level');
    if (!levelModel) {
      throw new Error('Level model is not loaded');
    }

    levelModel.scene.updateMatrixWorld(true);
    const obstacleNodes = levelModel.scene.children.filter((child) =>
      typeof child.name === 'string' && child.name.includes('obstacle'),
    );

    if (!obstacleNodes.length) {
      throw new Error('Level model has no obstacle variants');
    }

    return obstacleNodes.map((obstacleNode) => this.#createVariant(obstacleNode));
  }

  #isBonfireVariant(variantIndex) {
    return this.variants[variantIndex]?.name?.includes('bonfire');
  }

  #isFarEnoughFromBonfires(cell, bonfireCells) {
    const minDistanceSquared = this.minBonfireDistance * this.minBonfireDistance;

    return bonfireCells.every((bonfireCell) => {
      const rowDelta = cell.row - bonfireCell.row;
      const colDelta = cell.col - bonfireCell.col;
      return rowDelta * rowDelta + colDelta * colDelta >= minDistanceSquared;
    });
  }

  #generateObstacleVariants() {
    const bonfireVariantIndices = this.variants
      .map((variant, index) => (this.#isBonfireVariant(index) ? index : -1))
      .filter((index) => index !== -1);
    const fallbackVariantIndices = this.variants
      .map((_, index) => index)
      .filter((index) => !bonfireVariantIndices.includes(index));

    const bonfireCells = [];

    return this.obstacleCells.map((cell) => {
      let variantIndex = Math.floor(Math.random() * this.variants.length);

      if (
        this.#isBonfireVariant(variantIndex) &&
        !this.#isFarEnoughFromBonfires(cell, bonfireCells)
      ) {
        if (fallbackVariantIndices.length) {
          variantIndex =
            fallbackVariantIndices[
              Math.floor(Math.random() * fallbackVariantIndices.length)
            ];
        }
      }

      if (this.#isBonfireVariant(variantIndex)) {
        bonfireCells.push(cell);
      }

      return variantIndex;
    });
  }

  #init() {
    const dummy = new THREE.Object3D();
    const finalMatrix = new THREE.Matrix4();
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.obstacleCells.length; i++) {
      const cell = this.obstacleCells[i];
      const variantIndex = this.obstacleVariantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      dummy.position.set(cell.worldX, variant.yOffset + 0.2, cell.worldZ);
      dummy.rotation.set(0, this.obstacleRotationByCell[i], 0);
      dummy.scale.copy(this.hiddenScale);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
        finalMatrix.multiplyMatrices(dummy.matrix, variant.parts[j].localMatrix);
        instancedMeshes[j].setMatrixAt(writeOffsets[variantIndex], finalMatrix);
      }
      this.variantIndexByCellId.set(cell.id, variantIndex);
      this.instanceIndexByCellId.set(cell.id, writeOffsets[variantIndex]);

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

  updateVisible(cells = []) {
    const dummy = new THREE.Object3D();
    const finalMatrix = new THREE.Matrix4();

    for (const sourceCell of cells) {
      const cell = this.cellById.get(sourceCell.id);
      const variantIndex = this.variantIndexByCellId.get(sourceCell.id);
      const instanceIndex = this.instanceIndexByCellId.get(sourceCell.id);
      if (
        !cell ||
        variantIndex === undefined ||
        instanceIndex === undefined
      ) {
        continue;
      }

      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      dummy.position.set(cell.worldX, variant.yOffset + 0.2, cell.worldZ);
      dummy.rotation.set(0, this.rotationByCellId.get(cell.id) ?? 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
        finalMatrix.multiplyMatrices(dummy.matrix, variant.parts[j].localMatrix);
        instancedMeshes[j].setMatrixAt(instanceIndex, finalMatrix);
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }
    }
  }
}
