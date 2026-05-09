import * as THREE from "three";
import materialManager from "../../core/materialManager";
import { animationsManager } from "../../core/animationManager";
import CONSTANTS from "../../static/constants";

const BONFIRE_LIGHT_COLOR = 0xff9b35;
const BONFIRE_LIGHT_INTENSITY = 4.35;
const BONFIRE_LIGHT_DISTANCE = 10.2;
const BONFIRE_LIGHT_DECAY = 2;
const BONFIRE_LIGHT_FLICKER_SPEED = 5.5;
const BONFIRE_LIGHT_FLICKER_AMOUNT = 0.18;

export default class Obstacle {
  constructor(options, backgroundModels) {
    this.grid = options.grid;
    this.backgroundModels = backgroundModels;
    this.minBonfireDistance = 2;
    this.obstacleCells = this.grid.getObstacleCells();
    this.hiddenScale = new THREE.Vector3(
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
    );
    this.cellById = new Map();
    this.variantIndexByCellId = new Map();
    this.instanceIndexByCellId = new Map();
    this.rotationByCellId = new Map();
    this.bonfireFireSprites = new Map();
    this.bonfireLights = new Map();
    this.bonfireLightPhases = new Map();
    this.bonfireFireFrames = [];
    this.bonfireFireFrame = 0;
    this.bonfireFireElapsed = 0;
    this.bonfireFireFps = 12;
    this.bonfireFireGeometry = null;
    this.bonfireFireMaterial = null;

    this.variants = this.#loadVariants();

    this.obstacleVariantByCell = this.#generateObstacleVariants();
    this.obstacleRotationByCell = this.obstacleCells.map(
      () => Math.random() * Math.PI * 2,
    );

    const variantCounts = new Array(this.variants.length).fill(0);
    for (let i = 0; i < this.obstacleVariantByCell.length; i++) {
      variantCounts[this.obstacleVariantByCell[i]]++;
      this.cellById.set(this.obstacleCells[i].id, this.obstacleCells[i]);
      this.rotationByCellId.set(
        this.obstacleCells[i].id,
        this.obstacleRotationByCell[i],
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
  }

  #createVariant(object3D) {
    object3D.updateWorldMatrix(true, true);

    const bbox = new THREE.Box3().setFromObject(object3D);
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
      name: object3D.name,
      parts,
      yOffset: -bbox.min.y,
    };
  }

  #loadVariants() {
    if (!this.backgroundModels) {
      throw new Error("Level model is not loaded");
    }

    this.backgroundModels.scene.updateMatrixWorld(true);
    const obstacleNodes = this.backgroundModels.scene.children.filter(
      (child) =>
        typeof child.name === "string" && child.name.includes("obstacle"),
    );

    if (!obstacleNodes.length) {
      throw new Error("Level model has no obstacle variants");
    }

    return obstacleNodes.map((obstacleNode) =>
      this.#createVariant(obstacleNode),
    );
  }

  #isBonfireVariant(variantIndex) {
    return this.variants[variantIndex]?.name?.includes("bonfire");
  }

  #isFarEnoughFromBonfires(cell, bonfireCells) {
    const minDistanceSquared =
      this.minBonfireDistance * this.minBonfireDistance;

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

      dummy.position.set(
        cell.worldX,
        variant.yOffset + CONSTANTS.FLOOR_HEIGHT,
        cell.worldZ,
      );
      dummy.rotation.set(0, this.obstacleRotationByCell[i], 0);
      dummy.scale.copy(this.hiddenScale);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
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

    this.#createBonfireFireSprites();
  }

  #prepareBonfireFireFrames() {
    for (const texture of this.bonfireFireFrames) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
    }
  }

  #createBonfireFireSprites() {
    this.bonfireFireFrames =
      animationsManager.get("bonfire")?.fireAnimation ?? [];
    if (!this.bonfireFireFrames.length) return;

    this.#prepareBonfireFireFrames();
    this.bonfireFireGeometry = new THREE.PlaneGeometry(1.1, 1.25);
    this.bonfireFireMaterial = new THREE.MeshBasicMaterial({
      map: this.bonfireFireFrames[0],
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.bonfireFireMaterial.userData.disposeOnRemove = true;

    for (let i = 0; i < this.obstacleCells.length; i++) {
      const cell = this.obstacleCells[i];
      const variantIndex = this.obstacleVariantByCell[i];
      if (!this.#isBonfireVariant(variantIndex)) continue;

      const fire = new THREE.Mesh(
        this.bonfireFireGeometry,
        this.bonfireFireMaterial,
      );
      fire.visible = false;
      fire.position.set(cell.worldX, 0.85, cell.worldZ);
      this.bonfireFireSprites.set(cell.id, fire);
      this.instanced.add(fire);

      const light = this.#createBonfireLight(fire.position);
      this.bonfireLights.set(cell.id, light);
      this.bonfireLightPhases.set(cell.id, Math.random() * Math.PI * 2);
      this.instanced.add(light);
    }
  }

  #createBonfireLight(position) {
    const light = new THREE.PointLight(
      BONFIRE_LIGHT_COLOR,
      BONFIRE_LIGHT_INTENSITY,
      BONFIRE_LIGHT_DISTANCE,
      BONFIRE_LIGHT_DECAY,
    );
    light.visible = false;
    light.castShadow = false;
    light.position.copy(position);
    return light;
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

      dummy.position.set(
        cell.worldX,
        variant.yOffset + CONSTANTS.FLOOR_HEIGHT,
        cell.worldZ,
      );
      dummy.rotation.set(0, this.rotationByCellId.get(cell.id) ?? 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      for (let j = 0; j < instancedMeshes.length; j++) {
        finalMatrix.multiplyMatrices(
          dummy.matrix,
          variant.parts[j].localMatrix,
        );
        instancedMeshes[j].setMatrixAt(instanceIndex, finalMatrix);
        instancedMeshes[j].instanceMatrix.needsUpdate = true;
      }

      const bonfireFire = this.bonfireFireSprites.get(cell.id);
      if (bonfireFire) bonfireFire.visible = true;

      const bonfireLight = this.bonfireLights.get(cell.id);
      if (bonfireLight) bonfireLight.visible = true;
    }
  }

  update(delta, camera) {
    this.#lookAtCameraYawOnly(camera);
    this.#updateBonfireFireAnimation(delta);
    this.#updateBonfireLights();
  }

  #updateBonfireFireAnimation(delta) {
    if (!this.bonfireFireMaterial || this.bonfireFireFrames.length <= 1) return;

    this.bonfireFireElapsed += delta;
    const frameDuration = 1 / this.bonfireFireFps;

    while (this.bonfireFireElapsed >= frameDuration) {
      this.bonfireFireElapsed -= frameDuration;
      this.bonfireFireFrame =
        (this.bonfireFireFrame + 1) % this.bonfireFireFrames.length;
      this.bonfireFireMaterial.map =
        this.bonfireFireFrames[this.bonfireFireFrame];
      this.bonfireFireMaterial.needsUpdate = true;
    }
  }

  #updateBonfireLights() {
    const time = performance.now() / 1000;

    for (const [cellId, light] of this.bonfireLights) {
      if (!light.visible) continue;

      const phase = this.bonfireLightPhases.get(cellId) ?? 0;
      const wave = Math.sin(time * BONFIRE_LIGHT_FLICKER_SPEED + phase);
      const fastWave = Math.sin(
        time * BONFIRE_LIGHT_FLICKER_SPEED * 1.6 + phase,
      );
      const flicker =
        1 + (wave * 0.65 + fastWave * 0.35) * BONFIRE_LIGHT_FLICKER_AMOUNT;
      light.intensity = BONFIRE_LIGHT_INTENSITY * flicker;
    }
  }

  #lookAtCameraYawOnly(camera) {
    if (!camera) return;

    for (const fire of this.bonfireFireSprites.values()) {
      const dx = camera.position.x - fire.position.x;
      const dz = camera.position.z - fire.position.z;
      fire.rotation.set(0, Math.atan2(dx, dz), 0);
    }
  }
}
