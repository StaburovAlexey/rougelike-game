import MashEntity from './createMashEntity';
import { sceneManager } from '../scene/scene';

export default class Entity {
  constructor(position, type) {
    this.hp = type.hp;
    this.atk = type.atk;
    this.def = type.def;
    this.cellPosition = position;
    this.mesh = new MashEntity(type.name).mesh;
    this.syncMeshToCell(this.cellPosition);
    sceneManager.add(this.mesh);
  }

  syncMeshToCell(cell) {
    this.cellPosition = cell;
    this.mesh.position.set(
      this.cellPosition.worldX,
      0.9,
      this.cellPosition.worldZ,
    );
  }
  dispose() {
    if (!this.mesh) return;
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh = null;
  }
  attak() {}
}
