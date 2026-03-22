import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

export default class Wall {
  constructor(options) {
    this.grid = options.grid;
    this.wallCells = this.grid.getWallCells();

    const wallModel = modelManager.get('wall');
    wallModel.scene.updateMatrixWorld(true);
    const wallGroups = wallModel.scene.children.filter((child) => child.isGroup);
    if (!wallGroups.length) {
      throw new Error('Wall model has no grouped wall variants');
    }

    this.variants = wallGroups.map((wallGroup) => {
      const bbox = new THREE.Box3().setFromObject(wallGroup);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const parts = [];
      wallGroup.traverse((child) => {
        if (!child.isMesh) return;
        parts.push({
          geometry: child.geometry,
          material: this.#createMaterial(child.material),
        });
      });

      return {
        parts,
        modelSize: new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1),
        yOffset: -bbox.min.y,
      };
    });

    this.wallVariantByCell = this.wallCells.map(
      () => Math.floor(Math.random() * this.variants.length),
    );
    this.wallFacingByCell = this.wallCells.map(() => (Math.random() < 0.5 ? 0 : Math.PI));

    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.wallVariantByCell.length; i++) {
      variantCounts[this.wallVariantByCell[i]]++;
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
    const color =
      materialName === 'Border'
        ? COLORS.BORDER_COLOR
        : COLORS.ROCK_WALL_COLOR;

    const material = new THREE.MeshLambertMaterial({ color });
    material.userData.disposeOnRemove = true;
    return material;
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

  #init() {
    const dummy = new THREE.Object3D();
    const cornerSize = COLORS.CELL_SIZE;
    const scale = new THREE.Vector3();
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.wallCells.length; i++) {
      const cell = this.wallCells[i];
      const variantIndex = this.wallVariantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      const isCorner = this.#isCorner(cell.row, cell.col);
      const isSideWall = cell.side === 'left' || cell.side === 'right';
      const facingOffset = this.wallFacingByCell[i];

      dummy.rotation.set(0, (isSideWall ? Math.PI / 2 : 0) + facingOffset, 0);
      dummy.position.set(cell.worldX, variant.yOffset + 0.2, cell.worldZ);

      if (isCorner) {
        scale.set(
          cornerSize / variant.modelSize.x,
          cornerSize / variant.modelSize.y,
          cornerSize / variant.modelSize.z,
        );
      } else {
        scale.set(1, 1, 1);
      }

      dummy.scale.copy(scale);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
        instancedMeshes[j].setMatrixAt(writeOffsets[variantIndex], dummy.matrix);
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
