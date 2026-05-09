import * as THREE from "three";
import materialManager from "../../core/materialManager";
import { animationsManager } from "../../core/animationManager";
import CONSTANTS from "../../static/constants";

const TUBE_ANIMATION_FPS = 6;
const TUBE_SPRITE_WIDTH = 0.66;
const TUBE_SPRITE_HEIGHT = 1.2;
const TUBE_SPRITE_LOCAL_Y = 0.58;
const TUBE_SPRITE_LOCAL_Z = 0.43;
const TUBE_LIGHT_COLOR = 0x55ff8a;
const TUBE_LIGHT_INTENSITY = 1.2;
const TUBE_LIGHT_DISTANCE = 1.5;
const TUBE_LIGHT_DECAY = 2;
const TUBE_LIGHT_FLICKER_SPEED = 3.5;
const TUBE_LIGHT_FLICKER_AMOUNT = 0.12;

export default class Wall {
  constructor(options, backgroundModels) {
    this.grid = options.grid;
    this.backgroundModels = backgroundModels;
    this.wallCells = this.grid.getWallCells();
    this.hiddenScale = new THREE.Vector3(
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
    );
    this.cellById = new Map();
    this.variantIndexByCellId = new Map();
    this.instanceIndexByCellId = new Map();
    this.facingOffsetByCellId = new Map();
    this.inwardFacingOffsetByCellId = new Map();
    this.tubeSprites = new Map();
    this.tubeFrames = [];
    this.tubeFrame = 0;
    this.tubeElapsed = 0;
    this.tubeGeometry = null;
    this.tubeMaterial = null;
    this.tubeLights = new Map();
    this.tubeLightPhases = new Map();

    const { variants } = this.#loadVariants();
    this.variants = variants;
    this.cornerVariantIndices = this.variants
      .map((variant, index) => (variant.isCorner ? index : -1))
      .filter((index) => index !== -1);
    this.straightVariantIndices = this.variants
      .map((variant, index) => (!variant.isCorner ? index : -1))
      .filter((index) => index !== -1);

    this.wallVariantByCell = this.wallCells.map((cell) =>
      this.#pickVariantIndex(cell),
    );
    this.wallInwardFacingByCell = this.wallCells.map((cell) =>
      this.#getCellInwardRotation(cell),
    );
    this.wallFacingByCell = this.wallCells.map((cell) =>
      this.#getCellRotation(cell),
    );

    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.wallVariantByCell.length; i++) {
      variantCounts[this.wallVariantByCell[i]]++;
      this.cellById.set(this.wallCells[i].id, this.wallCells[i]);
      this.facingOffsetByCellId.set(
        this.wallCells[i].id,
        this.wallFacingByCell[i],
      );
      this.inwardFacingOffsetByCellId.set(
        this.wallCells[i].id,
        this.wallInwardFacingByCell[i],
      );
    }

    this.instanced = new THREE.Group();
    this.variantInstances = this.variants.map((variant, variantIndex) => {
      const count = variantCounts[variantIndex];
      if (!count) return null;
      return variant.parts.map((part) => {
        const mesh = new THREE.InstancedMesh(
          part.geometry,
          part.material,
          count,
        );
        this.instanced.add(mesh);
        return mesh;
      });
    });

    this.#init();
    this.#createTubeSprites();
  }

  #createVariant(object3D, { isCorner = false } = {}) {
    object3D.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3().setFromObject(object3D);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const objectName = object3D.name.toLowerCase();
    const facesInward = objectName.includes("walltube");
    const parts = [];
    object3D.traverse((child) => {
      if (!child.isMesh) return;
      parts.push({
        geometry: child.geometry,
        material: materialManager.getMaterial(child.material?.name),
        localMatrix: child.matrixWorld.clone(),
      });
    });

    return {
      isCorner,
      facesInward,
      parts,
      modelSize: new THREE.Vector3(size.x || 1, size.y || 1, size.z || 1),
      yOffset: -bbox.min.y,
    };
  }

  #loadVariants() {
    if (!this.backgroundModels) {
      throw new Error("Level model is not loaded");
    }

    const levelVariants = this.#loadVariantsFromLevel(this.backgroundModels);
    if (!levelVariants.variants.length) {
      throw new Error("Level model has no wall variants");
    }

    return levelVariants;
  }

  #loadVariantsFromLevel(levelModel) {
    levelModel.scene.updateMatrixWorld(true);

    const wallNodes = levelModel.scene.children.filter(
      (child) =>
        typeof child.name === "string" &&
        child.name.includes("wall") &&
        !child.name.includes("torch"),
    );

    if (!wallNodes.length) {
      return { variants: [] };
    }

    return {
      variants: wallNodes.map((node) =>
        this.#createVariant(node, {
          isCorner: node.name.toLowerCase().includes("corner"),
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
    if (
      this.#isCorner(cell.row, cell.col) &&
      this.cornerVariantIndices.length
    ) {
      return this.#getCornerRotation(cell);
    }

    return (
      this.#getCellBaseRotation(cell) + (Math.random() < 0.5 ? 0 : Math.PI)
    );
  }

  #getCellInwardRotation(cell) {
    const inwardRotationBySide = {
      top: 0,
      right: -Math.PI / 2,
      bottom: Math.PI,
      left: Math.PI / 2,
    };

    return inwardRotationBySide[cell.side] ?? this.#getCellBaseRotation(cell);
  }

  #getCellBaseRotation(cell) {
    if (
      this.#isCorner(cell.row, cell.col) &&
      this.cornerVariantIndices.length
    ) {
      return this.#getCornerRotation(cell);
    }

    const isSideWall = cell.side === "left" || cell.side === "right";
    return isSideWall ? Math.PI / 2 : 0;
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

      dummy.position.set(
        cell.worldX,
        variant.yOffset + CONSTANTS.FLOOR_HEIGHT,
        cell.worldZ,
      );
      dummy.scale.copy(this.hiddenScale);

      for (let j = 0; j < instancedMeshes.length; j++) {
        dummy.rotation.set(
          0,
          variant.facesInward ? this.wallInwardFacingByCell[i] : facingOffset,
          0,
        );
        dummy.updateMatrix();
        finalMatrix.multiplyMatrices(
          dummy.matrix,
          variant.parts[j].localMatrix,
        );
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
      if (!cell || variantIndex === undefined || instanceIndex === undefined) {
        continue;
      }

      const variant = this.variants[variantIndex];
      const instancedMeshes = this.variantInstances[variantIndex];
      if (!instancedMeshes) continue;

      const facingOffset = this.facingOffsetByCellId.get(cell.id) ?? 0;
      const inwardFacingOffset =
        this.inwardFacingOffsetByCellId.get(cell.id) ?? 0;

      dummy.position.set(
        cell.worldX,
        variant.yOffset + CONSTANTS.FLOOR_HEIGHT,
        cell.worldZ,
      );
      dummy.scale.set(1, 1, 1);

      for (let j = 0; j < instancedMeshes.length; j++) {
        dummy.rotation.set(
          0,
          variant.facesInward ? inwardFacingOffset : facingOffset,
          0,
        );
        dummy.updateMatrix();
        finalMatrix.multiplyMatrices(
          dummy.matrix,
          variant.parts[j].localMatrix,
        );
        instancedMeshes[j].setMatrixAt(instanceIndex, finalMatrix);
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }

      const tubeSprite = this.tubeSprites.get(cell.id);
      if (tubeSprite) tubeSprite.visible = true;

      const tubeLight = this.tubeLights.get(cell.id);
      if (tubeLight) tubeLight.visible = true;
    }
  }

  update(delta) {
    this.#updateTubeAnimation(delta);
    this.#updateTubeLights();
  }

  #createTubeSprites() {
    this.tubeFrames = animationsManager.get("tube")?.flowAnimation ?? [];
    if (!this.tubeFrames.length) return;

    this.#prepareTubeFrames();
    this.tubeGeometry = new THREE.PlaneGeometry(
      TUBE_SPRITE_WIDTH,
      TUBE_SPRITE_HEIGHT,
    );
    this.tubeMaterial = new THREE.MeshBasicMaterial({
      map: this.tubeFrames[0],
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.tubeMaterial.userData.disposeOnRemove = true;

    for (let i = 0; i < this.wallCells.length; i++) {
      const cell = this.wallCells[i];
      const variant = this.variants[this.wallVariantByCell[i]];
      if (!variant?.facesInward) continue;

      const yaw = this.wallInwardFacingByCell[i];
      const sprite = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
      sprite.visible = false;
      sprite.position.copy(this.#getTubeSpritePosition(cell, yaw));
      sprite.rotation.y = yaw;
      this.tubeSprites.set(cell.id, sprite);
      this.instanced.add(sprite);

      const light = this.#createTubeLight(sprite.position);
      this.tubeLights.set(cell.id, light);
      this.tubeLightPhases.set(cell.id, Math.random() * Math.PI * 2);
      this.instanced.add(light);
    }
  }

  #createTubeLight(position) {
    const light = new THREE.PointLight(
      TUBE_LIGHT_COLOR,
      TUBE_LIGHT_INTENSITY,
      TUBE_LIGHT_DISTANCE,
      TUBE_LIGHT_DECAY,
    );
    light.visible = false;
    light.castShadow = false;
    light.position.copy(position);
    return light;
  }

  #prepareTubeFrames() {
    for (const texture of this.tubeFrames) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI;
    }
  }

  #getTubeSpritePosition(cell, yaw) {
    const localOffset = new THREE.Vector3(
      0,
      CONSTANTS.FLOOR_HEIGHT + TUBE_SPRITE_LOCAL_Y,
      TUBE_SPRITE_LOCAL_Z,
    );
    localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    return new THREE.Vector3(
      cell.worldX + localOffset.x,
      localOffset.y - 0.3,
      cell.worldZ + localOffset.z,
    );
  }

  #updateTubeAnimation(delta) {
    if (!this.tubeMaterial || this.tubeFrames.length <= 1) return;

    this.tubeElapsed += delta;
    const frameDuration = 1 / TUBE_ANIMATION_FPS;

    while (this.tubeElapsed >= frameDuration) {
      this.tubeElapsed -= frameDuration;
      this.tubeFrame = (this.tubeFrame + 1) % this.tubeFrames.length;
      this.tubeMaterial.map = this.tubeFrames[this.tubeFrame];
      this.tubeMaterial.needsUpdate = true;
    }
  }

  #updateTubeLights() {
    const time = performance.now() / 1000;

    for (const [cellId, light] of this.tubeLights) {
      if (!light.visible) continue;

      const phase = this.tubeLightPhases.get(cellId) ?? 0;
      const wave = Math.sin(time * TUBE_LIGHT_FLICKER_SPEED + phase);
      light.intensity =
        TUBE_LIGHT_INTENSITY * (1 + wave * TUBE_LIGHT_FLICKER_AMOUNT);
    }
  }
}
