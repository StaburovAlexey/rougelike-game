import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';

const WALL_COLOR = '#6f7c86';

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

  #buildNodeLocalMatrix(node) {
    const translation = node.translation || [0, 0, 0];
    const rotation = node.rotation || [0, 0, 0, 1];
    const scale = node.scale || [1, 1, 1];

    return new THREE.Matrix4().compose(
      new THREE.Vector3(...translation),
      new THREE.Quaternion(...rotation),
      new THREE.Vector3(...scale),
    );
  }

  #buildInstancedFromModel() {
    const gltf = modelManager.get('torch');
    gltf.scene.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(gltf.scene);
    const bboxCenter = new THREE.Vector3();
    bbox.getCenter(bboxCenter);
    const modelOffsetMatrix = new THREE.Matrix4().makeTranslation(
      -bboxCenter.x,
      -bbox.min.y,
      -bboxCenter.z,
    );

    const nodes = gltf.parser.json.nodes;
    const meshNodes = nodes.filter((node) => node.mesh !== undefined);
    const yawBySide = {
      top: Math.PI,
      right: Math.PI / 2,
      bottom: 0,
      left: -Math.PI / 2,
    };

    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const baseScale = new THREE.Vector3(1, 1, 1);
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const instanceMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const node of meshNodes) {
      const source = gltf.scene.getObjectByName(node.name);
      if (!source || !source.isMesh) continue;
      const toLambert = (material) =>
        new THREE.MeshLambertMaterial({
          color: WALL_COLOR,
        });
      const material = Array.isArray(source.material)
        ? source.material.map(toLambert)
        : toLambert(source.material);

      const instancedMesh = new THREE.InstancedMesh(
        source.geometry,
        material,
        this.cells.length,
      );
      instancedMesh.matrixAutoUpdate = false;

      const nodeLocalMatrix = this.#buildNodeLocalMatrix(node);

      for (let i = 0; i < this.cells.length; i++) {
        const cell = this.cells[i];
        const x = cell.col * this.step - this.halfW;
        const z = cell.row * this.step - this.halfH;
        const yaw = yawBySide[cell.side] ?? 0;

        basePosition.set(x, 0, z);
        baseRotation.setFromAxisAngle(yawAxis, yaw);
        baseMatrix.compose(basePosition, baseRotation, baseScale);
        instanceMatrix.multiplyMatrices(modelOffsetMatrix, nodeLocalMatrix);
        finalMatrix.multiplyMatrices(baseMatrix, instanceMatrix);
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
