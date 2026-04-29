import { textureManager } from "./textureManager";
import * as THREE from "three";
import { COLORS } from "../static/constants";

class MaterialManager {
  constructor() {
    this.materials = new Map();
  }
  initAll() {
    const filtersTexture = new Map();
    for (const [key, value] of COLORS) {
      const material = new THREE.MeshLambertMaterial({
        color: value,
      });
      this.materials.set(key, material);
    }
    for (const [key, value] of textureManager.textures) {
      if (key.includes("texture")) {
        const texture = value;
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshLambertMaterial({ map: texture });
        this.materials.set(key.replace("_texture", ""), material);
      }
    }

    console.log("отфильтрованные материалы", this.materials);
  }
  getMaterial(materialName) {
    return this.materials.get(materialName);
  }
}
const materialManager = new MaterialManager();
export { MaterialManager, materialManager };
export default materialManager;
