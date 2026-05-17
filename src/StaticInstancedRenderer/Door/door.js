import * as THREE from "three";
import materialManager from "../../core/materialManager";
import textureManager from "../../core/textureManager";
import CONSTANTS from "../../static/constants";
import { getLightIntensity } from "../../core/lightingUtils";

export default class Doors {
  constructor(cells, backgroundModels) {
    this.cells = cells;
    this.backgroundModels = backgroundModels;
    this.instanced = new THREE.Group();
    this.hiddenScale = new THREE.Vector3(
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
      CONSTANTS.HIDDEN_SCALE,
    );
    this.baseScale = null;
    this.baseYOffset = 0;
    this.modelMatrices = [];
    this.meshes = [];
    this.cellById = new Map();
    this.cellIndexById = new Map();
    this.doorPlaneByCellId = new Map();
    this.sideYaw = {
      top: Math.PI,
      right: Math.PI / 2,
      bottom: 0,
      left: -Math.PI / 2,
    };
    this.#init();
  }

  #buildInstancedFromModel() {
    if (!this.backgroundModels) {
      throw new Error("Level model is not loaded");
    }

    this.backgroundModels.scene.updateMatrixWorld(true);
    const doorNode = this.backgroundModels.scene.children.find(
      (child) => typeof child.name === "string" && child.name.includes("door"),
    );
    if (!doorNode) {
      throw new Error("Level model has no door variant");
    }

    const bbox = new THREE.Box3().setFromObject(doorNode);
    const bboxSize = new THREE.Vector3();
    bbox.getSize(bboxSize);
    const sizeX = bboxSize.x || 1;
    const sizeY = bboxSize.y || 1;
    const sizeZ = bboxSize.z || 1;
    const targetX = CONSTANTS.CELL_SIZE;
    const targetY = CONSTANTS.CELL_SIZE * 1.4;
    const targetZ = CONSTANTS.CELL_SIZE * 0.5;
    const scaleX = targetX / sizeX;
    const scaleY = targetY / sizeY;
    const scaleZ = targetZ / sizeZ;
    const liftOffset = CONSTANTS.CELL_SIZE * 0.18;
    this.baseYOffset = -bbox.min.y * scaleY + liftOffset;
    this.baseScale = new THREE.Vector3(scaleX, scaleY, scaleZ);

    const meshNodes = [];
    doorNode.traverse((child) => {
      if (child.isMesh) meshNodes.push(child);
    });

    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const source of meshNodes) {
      const instancedMesh = new THREE.InstancedMesh(
        source.geometry,
        materialManager.getMaterial(source.material?.name),
        this.cells.length,
      );
      instancedMesh.matrixAutoUpdate = false;
      this.modelMatrices.push(source.matrixWorld.clone());

      for (let i = 0; i < this.cells.length; i++) {
        const cell = this.cells[i];
        const yaw = this.sideYaw[cell.side] ?? 0;

        basePosition.set(cell.worldX, this.baseYOffset, cell.worldZ);
        baseRotation.setFromAxisAngle(yawAxis, yaw);
        baseMatrix.compose(basePosition, baseRotation, this.hiddenScale);
        finalMatrix.multiplyMatrices(baseMatrix, source.matrixWorld);
        instancedMesh.setMatrixAt(i, finalMatrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instanced.add(instancedMesh);
      this.meshes.push(instancedMesh);
    }
  }

  #buildDoorPlanes() {
    const planeWidth = CONSTANTS.CELL_SIZE * 0.7;
    const planeHeight = CONSTANTS.CELL_SIZE * 0.7;
    const planeOffset = CONSTANTS.CELL_SIZE * 0.25;
    const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const sideDirection = {
      top: new THREE.Vector3(0, 0, 1),
      right: new THREE.Vector3(-1, 0, 0),
      bottom: new THREE.Vector3(0, 0, -1),
      left: new THREE.Vector3(1, 0, 0),
    };

    const yawAxis = new THREE.Vector3(0, 1, 0);
    const planeY = this.baseYOffset + CONSTANTS.CELL_SIZE * 0.7;

    for (const cell of this.cells) {
      if (cell.subType === "normal" || cell.doorRole === "in") continue;

      const texture = textureManager.get(cell.subType);
      if (!texture) continue;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });

      const plane = new THREE.Mesh(planeGeometry, material);
      plane.renderOrder = 1;

      const direction = sideDirection[cell.side] ?? new THREE.Vector3(0, 0, 0);
      const yaw = (this.sideYaw[cell.side] ?? 0) + Math.PI;

      plane.position.set(
        cell.worldX + direction.x * planeOffset,
        planeY,
        cell.worldZ + direction.z * planeOffset,
      );
      plane.quaternion.setFromAxisAngle(yawAxis, yaw);
      plane.visible = false;

      this.instanced.add(plane);
      this.doorPlaneByCellId.set(cell.id, plane);
    }
  }

  updateVisible(cells = []) {
    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const cell of cells) {
      const sourceCell = this.cellById.get(cell.id);
      const index = this.cellIndexById.get(cell.id);
      if (!sourceCell || index === undefined) continue;

      basePosition.set(sourceCell.worldX, this.baseYOffset, sourceCell.worldZ);
      baseRotation.setFromAxisAngle(
        yawAxis,
        this.sideYaw[sourceCell.side] ?? 0,
      );
      baseMatrix.compose(basePosition, baseRotation, this.baseScale);

      for (let meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
        finalMatrix.multiplyMatrices(baseMatrix, this.modelMatrices[meshIndex]);
        this.meshes[meshIndex].setMatrixAt(index, finalMatrix);
        this.meshes[meshIndex].instanceMatrix.needsUpdate = true;
      }

      const plane = this.doorPlaneByCellId.get(cell.id);
      if (plane) plane.visible = true;
    }
  }

  syncLighting(playerCell, lightRadius = 4, lightCells = []) {
    if (!playerCell) return;

    for (const [id, plane] of this.doorPlaneByCellId) {
      const cell = this.cellById.get(id);
      if (!cell) continue;

      const intensity = getLightIntensity(cell, playerCell, lightRadius, lightCells);
      plane.material.color.setRGB(intensity, intensity, intensity);
    }
  }

  #init() {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      this.cellById.set(cell.id, cell);
      this.cellIndexById.set(cell.id, i);
    }

    this.#buildInstancedFromModel();
    this.#buildDoorPlanes();
  }
}
