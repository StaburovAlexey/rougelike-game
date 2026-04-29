import { textureManager } from "./textureManager";
import * as THREE from "three";
import COLORS from '../../static/constants';

const colorByMaterialName = {
  Berry: COLORS.BERRY_COLOR,
  Border: COLORS.BORDER_COLOR,
  Bush: COLORS.BUSH_COLOR,
  WallWood: COLORS.WAll_WOOD_COLOR,
};

class MaterialManager {
  constructor() {
    this.materials = new Map();
  }
  initAll() {
    const filtersTexture = new Map();

    for (const [key, value] of textureManager.textures) {
      if (key.includes("texture")) {
        const texture = value;
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshLambertMaterial({ map: texture });
        this.materials.set(key.replace("_texture", ""), material);
      }
    }

    for()

    console.log("отфильтрованные материалы", this.materials);
  }
  getMaterial(materialName) {
    if (this.materials.has(materialName)) {
      return this.materials.get(materialName);
    } else {

    }
  }
}
const materialManager = new MaterialManager();
export { MaterialManager, materialManager };
export default materialManager;
