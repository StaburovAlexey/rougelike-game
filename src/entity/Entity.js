import MashEntity from './createMashEntity';
import { sceneManager } from '../scene/scene';

export default class Entity {
  constructor(position) {
    this.hp = 10;
    this.attak = 3;
    this.defence = 0;
    this.cellPosition = position;
    this.mesh = new MashEntity('player').mesh;
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
