import { textureManager } from "./textureManager";
import * as THREE from "three";
import { COLORS } from "../static/constants";

class MaterialManager {
  constructor() {
    this.materials = new Map();
    this.prefix = null;
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
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        // Нужно, чтобы repeat работал нормально
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;

        texture.repeat.set(3, 3);
        texture.needsUpdate = true;

        const material = new THREE.MeshLambertMaterial({ map: texture });
        this.materials.set(key.replace("_texture", ""), material);
      }
    }

    console.log("отфильтрованные материалы", this.materials);
  }
  getMaterial(materialName) {
    const fullName = `${materialName}_${this.prefix}`;
    if (this.materials.has(fullName)) {
      return this.materials.get(fullName);
    } else {
      return this.materials.get(`${materialName}_1`);
    }
  }
  setPrefixLevel(setPrefixLevel) {
    this.prefix = setPrefixLevel;
  }
}
const materialManager = new MaterialManager();
export { MaterialManager, materialManager };
export default materialManager;
