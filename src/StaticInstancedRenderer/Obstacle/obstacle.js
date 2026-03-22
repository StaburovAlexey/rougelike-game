import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

const colorByMaterialName = {
  Bonfire: COLORS.BONFIRE_WOOD_COLOR,
  Border: COLORS.BORDER_COLOR,
  BoxSteel: COLORS.BOX_STEEL,
  BoxWood: COLORS.BOX_WOOD,
  RockWall: COLORS.ROCK_WALL_COLOR,
  ShieldSteel: COLORS.SHIELD_STEEL_COLOR,
  ShieldWood: COLORS.SHIELD_WOOD_COLOR,
};

export default class Obstacle {
  constructor(options) {
    this.grid = options.grid;
    this.minBonfireDistance = 3;
    this.obstacleCells = this.grid.getObstacleCells();

    const obstacleModel = modelManager.get('obstacle');
    obstacleModel.scene.updateMatrixWorld(true);
    const obstacleGroups = obstacleModel.scene.children.filter((child) => child.isGroup);
    if (!obstacleGroups.length) {
      throw new Error('Obstacle model has no grouped variants');
    }

    this.variants = obstacleGroups.map((obstacleGroup) => {
      const bbox = new THREE.Box3().setFromObject(obstacleGroup);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const parts = [];
      obstacleGroup.traverse((child) => {
        if (!child.isMesh) return;
        parts.push({
          geometry: child.geometry,
          material: this.#createMaterial(child.material),
          localMatrix: child.matrixWorld.clone(),
        });
      });

      return {
        name: obstacleGroup.name,
        parts,
        modelSize: new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1),
        yOffset: -bbox.min.y,
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

  #isBonfireVariant(variantIndex) {
    return this.variants[variantIndex]?.name === 'bonfire';
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
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
        finalMatrix.multiplyMatrices(dummy.matrix, variant.parts[j].localMatrix);
        instancedMeshes[j].setMatrixAt(writeOffsets[variantIndex], finalMatrix);
      }

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
}
