import * as THREE from 'three';
import { modelManager } from '../../core/modelManager';

export default class Doors {
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
    const localPosition = new THREE.Vector3(...translation);
    const localQuaternion = new THREE.Quaternion(...rotation);
    const localScale = new THREE.Vector3(...scale);
    return new THREE.Matrix4().compose(
      localPosition,
      localQuaternion,
      localScale,
    );
  }

  #buildInstancedFromModel() {
    const gltf = modelManager.get('door');
    if (!gltf || !gltf.parser || !Array.isArray(gltf.parser.json?.nodes))
      return;
    gltf.scene.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(gltf.scene);
    const bboxSize = new THREE.Vector3();
    bbox.getSize(bboxSize);
    const sizeX = bboxSize.x || 1;
    const sizeY = bboxSize.y || 1;
    const sizeZ = bboxSize.z || 1;
    const targetX = this.cellSize;
    const targetY = this.cellSize * 1.4;
    const targetZ = this.cellSize * 0.5;
    const scaleX = targetX / sizeX;
    const scaleY = targetY / sizeY;
    const scaleZ = targetZ / sizeZ;
    const liftOffset = this.cellSize * 0.18;
    const baseYOffset = -bbox.min.y * scaleY + liftOffset;

    const nodes = gltf.parser.json.nodes;
    const meshNodes = nodes
      .map((node) => ({ node }))
      .filter(({ node }) => node.mesh !== undefined);

    const basePosition = new THREE.Vector3();
    const baseRotation = new THREE.Quaternion();
    const baseScale = new THREE.Vector3(scaleX, scaleY, scaleZ);
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const baseMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    for (const { node } of meshNodes) {
      const source = gltf.scene.getObjectByName(node.name);
      if (!source || !source.isMesh) continue;

      const toLambert = (mat) =>
        new THREE.MeshLambertMaterial({
          color: mat?.color ? mat.color.clone() : new THREE.Color(0xffffff),
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
        const sideYaw = {
          top: Math.PI,
          right: Math.PI / 2,
          bottom: 0,
          left: -Math.PI / 2,
        };
        const yaw = sideYaw[cell.side] ?? 0;

        basePosition.set(x, baseYOffset, z);
        baseRotation.setFromAxisAngle(yawAxis, yaw);
        baseMatrix.compose(basePosition, baseRotation, baseScale);
        finalMatrix.multiplyMatrices(baseMatrix, nodeLocalMatrix);
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
