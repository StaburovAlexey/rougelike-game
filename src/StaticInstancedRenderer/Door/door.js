import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';
import constants from '../../static/constants';

const colorByMaterialName = {
  Border: constants.BORDER_COLOR,
  Door: constants.DOOR_COLOR,
  Handle: constants.HANDLE_COLOR,
  RockWall: constants.ROCK_WALL_COLOR,
};

export default class Doors {
  constructor({ cells } = {}) {
    this.cells = cells;
    this.instanced = new THREE.Group();
    this.#init();
  }

  #buildInstancedFromModel() {
    const gltf = modelManager.get('door');
    gltf.scene.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(gltf.scene);
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
    const baseYOffset = -bbox.min.y * scaleY + liftOffset;

    const meshNodes = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshNodes.push(child);
    });

    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const baseScale = new THREE.Vector3(scaleX, scaleY, scaleZ);
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const modelMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const source of meshNodes) {
      const toLambert = (mat) =>
        {
          const material = new THREE.MeshLambertMaterial({
            color: colorByMaterialName[mat?.name] || '#ffffff',
          });
          material.userData.disposeOnRemove = true;
          return material;
        };
      const material = Array.isArray(source.material)
        ? source.material.map(toLambert)
        : toLambert(source.material);

      const instancedMesh = new THREE.InstancedMesh(
        source.geometry,
        material,
        this.cells.length,
      );
      instancedMesh.matrixAutoUpdate = false;
      modelMatrix.copy(source.matrixWorld);

      for (let i = 0; i < this.cells.length; i++) {
        const cell = this.cells[i];
        const sideYaw = {
          top: Math.PI,
          right: Math.PI / 2,
          bottom: 0,
          left: -Math.PI / 2,
        };
        const yaw = sideYaw[cell.side] ?? 0;

        basePosition.set(cell.worldX, baseYOffset, cell.worldZ);
        baseRotation.setFromAxisAngle(yawAxis, yaw);
        baseMatrix.compose(basePosition, baseRotation, baseScale);
        finalMatrix.multiplyMatrices(baseMatrix, modelMatrix);
        instancedMesh.setMatrixAt(i, finalMatrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instanced.add(instancedMesh);
    }
  }

  #init() {
    this.#buildInstancedFromModel();
  }
}
