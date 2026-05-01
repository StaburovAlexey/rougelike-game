import * as THREE from "three";
import { modelManager } from "../../core/modelManager";
import materialManager from "../../core/materialManager";
import constants from "../../static/constants";

const colorByMaterialName = {
  Border: constants.BORDER_COLOR,
  Door: constants.DOOR_COLOR,
  Handle: constants.HANDLE_COLOR,
  RockWall: constants.ROCK_WALL_COLOR,
};

export default class Doors {
  constructor(cells, levelModel, prefix) {
    this.cells = cells;
    this.prefix = prefix;
    this.instanced = new THREE.Group();
    this.hiddenScale = new THREE.Vector3(
      constants.HIDDEN_SCALE,
      constants.HIDDEN_SCALE,
      constants.HIDDEN_SCALE,
    );
    this.baseScale = null;
    this.baseYOffset = 0;
    this.modelMatrices = [];
    this.meshes = [];
    this.cellById = new Map();
    this.cellIndexById = new Map();
    this.sideYaw = {
      top: Math.PI,
      right: Math.PI / 2,
      bottom: 0,
      left: -Math.PI / 2,
    };
    this.levelModel = levelModel;
    this.#init();
  }

  #buildInstancedFromModel() {
    const levelModel = modelManager.get(this.levelModel);
    if (!levelModel) {
      throw new Error("Level model is not loaded");
    }

    levelModel.scene.updateMatrixWorld(true);
    const doorNode = levelModel.scene.children.find(
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
    const targetX = constants.CELL_SIZE;
    const targetY = constants.CELL_SIZE * 1.4;
    const targetZ = constants.CELL_SIZE * 0.5;
    const scaleX = targetX / sizeX;
    const scaleY = targetY / sizeY;
    const scaleZ = targetZ / sizeZ;
    const liftOffset = constants.CELL_SIZE * 0.18;
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
      // const toLambert = (mat) => {
      //   const material = new THREE.MeshLambertMaterial({
      //     color: colorByMaterialName[mat?.name] || '#ffffff',
      //   });
      //   material.userData.disposeOnRemove = true;
      //   return material;
      // };
      // const material = Array.isArray(source.material)
      //   ? source.material.map(toLambert)
      //   : toLambert(source.material);

      const instancedMesh = new THREE.InstancedMesh(
        source.geometry,
        materialManager.getMaterial(source.material?.name, this.prefix),
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
    }
  }

  #init() {
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      this.cellById.set(cell.id, cell);
      this.cellIndexById.set(cell.id, i);
    }

    this.#buildInstancedFromModel();
  }
}
