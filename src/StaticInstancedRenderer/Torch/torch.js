import * as THREE from "three";
import { materialManager } from "../../core/materialManager";
import { animationsManager } from "../../core/animationManager";
import CONSTANTS from "../../static/constants";

export default class Torch {
  constructor(cells, backgroundModels) {
    this.cells = cells;
    this.backgroundModels = backgroundModels;
    this.instanced = new THREE.Group();
    this.hiddenScale = new THREE.Vector3(
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
    );
    this.variantByCell = [];
    this.variantInstances = [];
    this.variants = [];
    this.fireMeshes = new Map();
    this.fireFrames = [];
    this.fireFrame = 0;
    this.fireElapsed = 0;
    this.fireFps = 12;
    this.fireGeometry = null;
    this.fireMaterial = null;
    this.cellById = new Map();
    this.cellIndexById = new Map();
    this.instanceIndexByCellId = new Map();
    this.sideYaw = {
      top: Math.PI,
      right: Math.PI / 2,
      bottom: 0,
      left: -Math.PI / 2,
    };
    this.visibleScale = new THREE.Vector3(1, 1, 1);
    this.#init();
  }

  #createVariant(object3D) {
    object3D.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3().setFromObject(object3D);
    const bboxCenter = new THREE.Vector3();
    bbox.getCenter(bboxCenter);
    const modelOffsetMatrix = new THREE.Matrix4().makeTranslation(
      -bboxCenter.x,
      -bbox.min.y,
      -bboxCenter.z,
    );

    const parts = [];
    object3D.traverse((child) => {
      if (!child.isMesh) return;
      parts.push({
        geometry: child.geometry,
        material: materialManager.getMaterial(child.material?.name),
        localMatrix: modelOffsetMatrix.clone().multiply(child.matrixWorld),
      });
    });

    return { parts };
  }

  #loadVariants() {
    if (!this.backgroundModels) {
      throw new Error("Level model is not loaded");
    }

    const levelVariants = this.#loadVariantsFromLevel(this.backgroundModels);
    if (!levelVariants.length) {
      throw new Error("Level model has no wall torch variants");
    }

    return levelVariants;
  }

  #loadVariantsFromLevel(levelModel) {
    levelModel.scene.updateMatrixWorld(true);

    const torchNodes = levelModel.scene.children.filter(
      (child) => typeof child.name === "string" && child.name.includes("torch"),
    );

    return torchNodes.map((torchNode) => this.#createVariant(torchNode));
  }

  #buildInstancedFromModel() {
    this.variants = this.#loadVariants();

    this.variantByCell = this.cells.map(() =>
      Math.floor(Math.random() * this.variants.length),
    );
    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.variantByCell.length; i++) {
      variantCounts[this.variantByCell[i]]++;
    }

    this.variantInstances = this.variants.map((variant, variantIndex) => {
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
    const writeOffsets = new Array(this.variants.length).fill(0);

    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      const yaw = this.sideYaw[cell.side] ?? 0;
      const variantIndex = this.variantByCell[i];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;
      this.instanceIndexByCellId.set(cell.id, writeOffsets[variantIndex]);

      basePosition.set(cell.worldX, 0, cell.worldZ);
      baseRotation.setFromAxisAngle(yawAxis, yaw);
      baseMatrix.compose(basePosition, baseRotation, this.hiddenScale);

      for (let j = 0; j < variant.parts.length; j++) {
        instanceMatrix.copy(variant.parts[j].localMatrix);
        finalMatrix.multiplyMatrices(baseMatrix, instanceMatrix);
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

  #prepareFireFrames() {
    for (const texture of this.fireFrames) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
    }
  }

  #createFireSprites() {
    this.fireFrames = animationsManager.get("torch")?.fireAnimation ?? [];
    if (!this.fireFrames.length) return;

    this.#prepareFireFrames();
    this.fireGeometry = new THREE.PlaneGeometry(0.35, 0.55);
    this.fireMaterial = new THREE.MeshBasicMaterial({
      map: this.fireFrames[0],
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.fireMaterial.userData.disposeOnRemove = true;

    for (const cell of this.cells) {
      const fire = new THREE.Mesh(this.fireGeometry, this.fireMaterial);
      fire.visible = false;
      fire.position.copy(this.#getFirePosition(cell));
      fire.rotation.y = this.sideYaw[cell.side] ?? 0;
      this.fireMeshes.set(cell.id, fire);
      this.instanced.add(fire);
    }
  }

  #getFirePosition(cell) {
    const position = new THREE.Vector3(cell.worldX, 1.5, cell.worldZ);
    const offset = 0.40;

    if (cell.side === "top") position.z += offset;
    if (cell.side === "bottom") position.z -= offset;
    if (cell.side === "left") position.x += offset;
    if (cell.side === "right") position.x -= offset;

    return position;
  }

  updateVisible(cells = []) {
    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const instanceMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const cell of cells) {
      const sourceCell = this.cellById.get(cell.id);
      const sourceIndex = this.cellIndexById.get(cell.id);
      const instanceIndex = this.instanceIndexByCellId.get(cell.id);
      if (
        !sourceCell ||
        sourceIndex === undefined ||
        instanceIndex === undefined
      ) {
        continue;
      }

      const variantIndex = this.variantByCell[sourceIndex];
      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      basePosition.set(sourceCell.worldX, 0, sourceCell.worldZ);
      baseRotation.setFromAxisAngle(
        yawAxis,
        this.sideYaw[sourceCell.side] ?? 0,
      );
      baseMatrix.compose(basePosition, baseRotation, this.visibleScale);

      for (let j = 0; j < variant.parts.length; j++) {
        instanceMatrix.copy(variant.parts[j].localMatrix);
        finalMatrix.multiplyMatrices(baseMatrix, instanceMatrix);
        instancedMeshes[j].setMatrixAt(instanceIndex, finalMatrix);
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }

      const fire = this.fireMeshes.get(cell.id);
      if (fire) fire.visible = true;
    }
  }

  update(delta) {
    if (!this.fireMaterial || this.fireFrames.length <= 1) return;

    this.fireElapsed += delta;
    const frameDuration = 1 / this.fireFps;

    while (this.fireElapsed >= frameDuration) {
      this.fireElapsed -= frameDuration;
      this.fireFrame = (this.fireFrame + 1) % this.fireFrames.length;
      this.fireMaterial.map = this.fireFrames[this.fireFrame];
      this.fireMaterial.needsUpdate = true;
    }
  }

  #init() {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      this.cellById.set(cell.id, cell);
      this.cellIndexById.set(cell.id, i);
    }

    this.#buildInstancedFromModel();
    this.#createFireSprites();
  }
}
