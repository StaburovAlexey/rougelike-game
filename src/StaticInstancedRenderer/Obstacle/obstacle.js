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
  constructor(options, density = 0.12) {
    this.minBonfireDistance = 3;
    this.cellSize = options.cellSize;
    this.size = options.size;
    this.step = options.step;
    this.halfW = options.halfW;
    this.halfH = options.halfH;
    this.density = Math.min(Math.max(density, 0), 1);
    this.obstacleCells = this.#generateObstacleCells();

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
    return new THREE.MeshLambertMaterial({
      color: colorByMaterialName[materialName] || COLORS.ROCK_WALL_COLOR,
    });
  }

  #toId(row, col) {
    return row * this.size.cols + col;
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
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      dummy.position.set(
        col * this.step - this.halfW,
        variant.yOffset + 0.2,
        row * this.step - this.halfH,
      );
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
