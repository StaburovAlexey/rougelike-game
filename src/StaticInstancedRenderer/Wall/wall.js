import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

const colorByMaterialName = {
  Berry: COLORS.BERRY_COLOR,
  Border: COLORS.BORDER_COLOR,
  Bush: COLORS.BUSH_COLOR,
  WallWood: COLORS.WAll_WOOD_COLOR,
};

export default class Wall {
  constructor(options,levelModel) {
    this.grid = options.grid;
    this.wallCells = this.grid.getWallCells();
    this.hiddenScale = new THREE.Vector3(
      COLORS.HIDDEN_SCALE,
      COLORS.HIDDEN_SCALE,
      COLORS.HIDDEN_SCALE,
    );
    this.cellById = new Map();
    this.variantIndexByCellId = new Map();
    this.instanceIndexByCellId = new Map();
    this.facingOffsetByCellId = new Map();
    this.levelModel = levelModel
    const { variants } = this.#loadVariants();
    this.variants = variants;
    this.cornerVariantIndices = this.variants
      .map((variant, index) => (variant.isCorner ? index : -1))
      .filter((index) => index !== -1);
    this.straightVariantIndices = this.variants
      .map((variant, index) => (!variant.isCorner ? index : -1))
      .filter((index) => index !== -1);

    this.wallVariantByCell = this.wallCells.map((cell) => this.#pickVariantIndex(cell));
    this.wallFacingByCell = this.wallCells.map((cell) => this.#getCellRotation(cell));

    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.wallVariantByCell.length; i++) {
      variantCounts[this.wallVariantByCell[i]]++;
      this.cellById.set(this.wallCells[i].id, this.wallCells[i]);
      this.facingOffsetByCellId.set(this.wallCells[i].id, this.wallFacingByCell[i]);
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
    const color = colorByMaterialName[materialName] || COLORS.ROCK_WALL_COLOR;

    const material = new THREE.MeshLambertMaterial({ color });
    material.userData.disposeOnRemove = true;
    return material;
  }

  #createVariant(object3D, { isCorner = false } = {}) {
    object3D.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3().setFromObject(object3D);
    const size = new THREE.Vector3();
    bbox.getSize(size);

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
      isCorner,
      parts,
      modelSize: new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1),
      yOffset: -bbox.min.y,
    };
  }

  #loadVariants() {
    const levelModel = modelManager.get(this.levelModel);
    if (!levelModel) {
      throw new Error('Level model is not loaded');
    }

    const levelVariants = this.#loadVariantsFromLevel(levelModel);
    if (!levelVariants.variants.length) {
      throw new Error('Level model has no wall variants');
    }

    return levelVariants;
  }

  #loadVariantsFromLevel(levelModel) {
    levelModel.scene.updateMatrixWorld(true);

    const wallNodes = levelModel.scene.children.filter((child) =>
      typeof child.name === 'string' &&
      child.name.includes('wall') &&
      !child.name.includes('torch'),
    );

    if (!wallNodes.length) {
      return { variants: [] };
    }

    return {
      variants: wallNodes.map((node) =>
        this.#createVariant(node, {
          isCorner: node.name.toLowerCase().includes('corner'),
        }),
      ),
    };
  }

  #isCorner(row, col) {
    const lastRow = this.grid.rows - 1;
    const lastCol = this.grid.cols - 1;
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === lastCol) ||
      (row === lastRow && col === 0) ||
      (row === lastRow && col === lastCol)
    );
  }

  #pickVariantIndex(cell) {
    const pool = this.#isCorner(cell.row, cell.col)
      ? this.cornerVariantIndices
      : this.straightVariantIndices;

    if (pool.length) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return Math.floor(Math.random() * this.variants.length);
  }

  #getCornerRotation(cell) {
    const lastRow = this.grid.rows - 1;
    const lastCol = this.grid.cols - 1;

    if (cell.row === 0 && cell.col === 0) return 0;
    if (cell.row === 0 && cell.col === lastCol) return Math.PI / 2;
    if (cell.row === lastRow && cell.col === lastCol) return Math.PI;
    if (cell.row === lastRow && cell.col === 0) return -Math.PI / 2;

    return 0;
  }

  #getCellRotation(cell) {
    if (this.#isCorner(cell.row, cell.col) && this.cornerVariantIndices.length) {
      return this.#getCornerRotation(cell);
    }

    const isSideWall = cell.side === 'left' || cell.side === 'right';
    const facingOffset = Math.random() < 0.5 ? 0 : Math.PI;
    return (isSideWall ? Math.PI / 2 : 0) + facingOffset;
  }

  #init() {
    const dummy = new THREE.Object3D();
    const finalMatrix = new THREE.Matrix4();
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.wallCells.length; i++) {
      const cell = this.wallCells[i];
      const variantIndex = this.wallVariantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      const facingOffset = this.wallFacingByCell[i];

      dummy.rotation.set(0, facingOffset, 0);
      dummy.position.set(cell.worldX, variant.yOffset + 0.2, cell.worldZ);
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

      const facingOffset = this.facingOffsetByCellId.get(cell.id) ?? 0;

      dummy.rotation.set(0, facingOffset, 0);
      dummy.position.set(cell.worldX, variant.yOffset + 0.2, cell.worldZ);
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
