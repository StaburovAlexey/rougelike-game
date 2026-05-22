import MashLoot from './createMashLoot';
import { sceneManager } from '../scene/scene';
export default class Loot {
  constructor(position, loot) {
    this.loot = loot;
    this.type = loot.type;
    this.value = loot.value
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
    if (!this.mesh) return
    this.mesh.visible = this.cellPosition.visible;
  }
  setLightIntensity(intensity = 1) {
    if (!this.mesh?.material?.color) return;
    const value = Math.min(Math.max(intensity, 0), 1);
    this.mesh.material.color.setRGB(value, value, value);
  }
  dispose() {
    if (!this.mesh) return;
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh = null;
  }
}
