import * as THREE from 'three';

class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.texturePaths = {
      floorAo: '/floor/cobblestone_floor_04_ao_1k.jpg',
      floorDiff: '/floor/cobblestone_floor_04_diff_1k.jpg',
      floorDisp: '/floor/cobblestone_floor_04_disp_1k.jpg',
      floorNormal: '/floor/cobblestone_floor_04_nor_gl_1k.jpg',
      floorRough: '/floor/cobblestone_floor_04_rough_1k.jpg',
      player: '/player/player.png',
      chaser: '/enemies/chaser.png',
      skirmisher: '/enemies/skirmisher.png',
      bruiser: '/enemies/bruiser.png',
      guard: '/enemies/guard.png',
      ambusher: '/enemies/ambusher.png',
      berserker: '/enemies/berserk.png',
      armor: '/loot/chest.png',
      gold: '/loot/gold.png',
      heal: '/loot/hp_potion.png',
      weapon: '/loot/sword.png',
    };
    
  }

  loadAll() {
    const entries = Object.entries(this.texturePaths);
    const tasks = entries.map(([key, path]) => this.#loadTexture(key, path));
    return Promise.all(tasks);
  }

  get(name) {
    return this.textures.get(name);
  }

  #loadTexture(name, path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (texture) => {
          this.textures.set(name, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load texture "${name}" from "${path}"`));
        },
      );
    });
  }
}

const textureManager = new TextureManager();

export { TextureManager, textureManager };
export default textureManager;
