import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import COLORS from '../../static/constants';

export default class Torch {
  constructor({ cells, halfW, halfH, step, cellSize } = {}) {
    this.cells = cells;
    this.halfH = halfH;
    this.halfW = halfW;
    this.step = step;
    this.cellSize = cellSize;
    this.instanced = new THREE.Group();
    this.#init();
  }

  #createMaterial(sourceMaterial) {
    const materialName = sourceMaterial?.name || '';
    let color = sourceMaterial?.color?.getHex?.() ?? 0xffffff;

    if (materialName === 'RockWall') color = new THREE.Color(COLORS.ROCK_WALL_COLOR).getHex();
    if (materialName === 'Border') color = new THREE.Color(COLORS.BORDER_COLOR).getHex();
    if (materialName === 'Torch') color = new THREE.Color(COLORS.TORCH_COLOR).getHex();

    return new THREE.MeshLambertMaterial({ color });
  }

  #buildInstancedFromModel() {
    const gltf = modelManager.get('torch');
    gltf.scene.updateMatrixWorld(true);
    const torchGroups = gltf.scene.children.filter((child) => child.isGroup);
    if (!torchGroups.length) {
      throw new Error('Torch model has no grouped torch variants');
    }

    const yawBySide = {
      top: Math.PI,
      right: Math.PI / 2,
      bottom: 0,
      left: -Math.PI / 2,
    };

    const variants = torchGroups.map((torchGroup) => {
      const bbox = new THREE.Box3().setFromObject(torchGroup);
      const bboxCenter = new THREE.Vector3();
      bbox.getCenter(bboxCenter);
      const modelOffsetMatrix = new THREE.Matrix4().makeTranslation(
        -bboxCenter.x,
        -bbox.min.y,
        -bboxCenter.z,
      );

      const parts = [];
      torchGroup.traverse((child) => {
        if (!child.isMesh) return;
        parts.push({
          geometry: child.geometry,
          material: this.#createMaterial(child.material),
          localMatrix: modelOffsetMatrix.clone(),
        });
      });

      return { parts };
    });

    const variantByCell = this.cells.map(
      () => Math.floor(Math.random() * variants.length),
    );
    const variantCounts = new Array(variants.length).fill(0);
    for (let i = 0; i < variantByCell.length; i++) {
      variantCounts[variantByCell[i]]++;
    }

    const variantInstances = variants.map((variant, variantIndex) => {
      const count = variantCounts[variantIndex];
      if (!count) return null;

      return variant.parts.map((part) => {
        const instancedMesh = new THREE.InstancedMesh(
          part.geometry,
          part.material,
          count,
        );
        instancedMesh.matrixAutoUpdate = false;
        this.instanced.add(instancedMesh);
        return instancedMesh;
      });
    });

    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const baseScale = new THREE.Vector3(1, 1, 1);
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const instanceMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();
    const writeOffsets = new Array(variants.length).fill(0);

    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      const x = cell.col * this.step - this.halfW;
      const z = cell.row * this.step - this.halfH;
      const yaw = yawBySide[cell.side] ?? 0;
      const variantIndex = variantByCell[i];
      const variant = variants[variantIndex];
      const instancedMeshes = variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      basePosition.set(x, 0, z);
      baseRotation.setFromAxisAngle(yawAxis, yaw);
      baseMatrix.compose(basePosition, baseRotation, baseScale);

      for (let j = 0; j < variant.parts.length; j++) {
        instanceMatrix.copy(variant.parts[j].localMatrix);
        finalMatrix.multiplyMatrices(baseMatrix, instanceMatrix);
        instancedMeshes[j].setMatrixAt(writeOffsets[variantIndex], finalMatrix);
      }

      writeOffsets[variantIndex]++;
    }

    for (let i = 0; i < variantInstances.length; i++) {
      const instancedMeshes = variantInstances[i];
      if (!instancedMeshes) continue;
      for (let j = 0; j < instancedMeshes.length; j++) {
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }
    }
  }

  #init() {
    this.#buildInstancedFromModel();
  }
}
