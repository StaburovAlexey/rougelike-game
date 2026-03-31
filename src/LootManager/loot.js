import MashLoot from './createMashLoot';
import { sceneManager } from '../scene/scene';
export default class Loot {
  constructor(position, loot) {
    this.loot = loot;
    this.type = loot.type;
    this.cellPosition = position;
    this.mesh = new MashLoot(this.type).mesh;
    this.mesh.position.set(
      this.cellPosition.worldX,
      0.6,
      this.cellPosition.worldZ,
    );
    sceneManager.add(this.mesh);
  }
  syncVisible() {
    this.mesh.visible = this.cellPosition.visible;
  }
  dispose() {
    if (!this.mesh) return;
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh = null;
  }
}
