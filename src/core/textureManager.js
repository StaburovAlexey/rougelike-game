import * as THREE from "three";

class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.texturePaths = {
      floor_1_texture: "/floor/coast_sand_rocks_02_diff_1k.jpg",
      floor_2_texture: "/floor/cobblestone_floor_04_diff_1k.jpg",
      RockWall_2_texture: "/texture/dry_riverbed_rock_diff_1k.jpg",
      RockWall_1_texture: "/texture/mossy_rock_diff_1k.jpg",
      Stone_1_texture: "/texture/coral_fort_wall_03_diff_1k.jpg",
      glot_idle_1: "/enemies/glot/Idle1.png",
      glot_idle_2: "/enemies/glot/Idle2.png",
      glot_idle_3: "/enemies/glot/Idle3.png",
      glot_idle_4: "/enemies/glot/Idle4.png",
      glot_idle_5: "/enemies/glot/Idle5.png",
      glot_idle_6: "/enemies/glot/Idle6.png",
      glot_idle_7: "/enemies/glot/Idle7.png",
      glot_idle_8: "/enemies/glot/Idle8.png",
      glot_idle_9: "/enemies/glot/Idle9.png",
      chaser_idle_1: "/enemies/chaser/Idle1.png",
      chaser_idle_2: "/enemies/chaser/Idle2.png",
      chaser_idle_3: "/enemies/chaser/Idle3.png",
      chaser_idle_4: "/enemies/chaser/Idle4.png",
      chaser_idle_5: "/enemies/chaser/Idle5.png",
      chaser_idle_6: "/enemies/chaser/Idle6.png",
      warrior_idle_1: "/player/warrior/idle/1.png",
      warrior_idle_2: "/player/warrior/idle/2.png",
      warrior_idle_3: "/player/warrior/idle/3.png",
      warrior_idle_4: "/player/warrior/idle/4.png",
      warrior_idle_5: "/player/warrior/idle/5.png",
      warrior_idle_6: "/player/warrior/idle/6.png",
      warrior_idle_7: "/player/warrior/idle/7.png",
      rouge_idle_1: "/player/rouge/idle/1.png",
      rouge_idle_2: "/player/rouge/idle/2.png",
      rouge_idle_3: "/player/rouge/idle/3.png",
      rouge_idle_4: "/player/rouge/idle/4.png",
      rouge_idle_5: "/player/rouge/idle/5.png",
      rouge_idle_6: "/player/rouge/idle/6.png",
      torch_fire_1: "/torch/Group 4 - 2_1.png",
      torch_fire_2: "/torch/Group 4 - 2_2.png",
      torch_fire_3: "/torch/Group 4 - 2_3.png",
      torch_fire_4: "/torch/Group 4 - 2_4.png",
      torch_fire_5: "/torch/Group 4 - 2_5.png",
      torch_fire_6: "/torch/Group 4 - 2_6.png",
      torch_fire_7: "/torch/Group 4 - 2_7.png",
      torch_fire_8: "/torch/Group 4 - 2_8.png",
      torch_fire_9: "/torch/Group 4 - 2_9.png",
      torch_fire_10: "/torch/Group 4 - 2_10.png",
      torch_fire_11: "/torch/Group 4 - 2_11.png",
      torch_fire_12: "/torch/Group 4 - 2_12.png",
      torch_fire_13: "/torch/Group 4 - 2_13.png",
      torch_fire_14: "/torch/Group 4 - 2_14.png",
      bonfire_fire_1: "/fire/Group 6 - 2_1.png",
      bonfire_fire_2: "/fire/Group 6 - 2_2.png",
      bonfire_fire_3: "/fire/Group 6 - 2_3.png",
      bonfire_fire_4: "/fire/Group 6 - 2_4.png",
      bonfire_fire_5: "/fire/Group 6 - 2_5.png",
      bonfire_fire_6: "/fire/Group 6 - 2_6.png",
      bonfire_fire_7: "/fire/Group 6 - 2_7.png",
      bonfire_fire_8: "/fire/Group 6 - 2_8.png",
      bonfire_fire_9: "/fire/Group 6 - 2_9.png",
      bonfire_fire_10: "/fire/Group 6 - 2_10.png",
      bonfire_fire_11: "/fire/Group 6 - 2_11.png",
      bonfire_fire_12: "/fire/Group 6 - 2_12.png",
      bonfire_fire_13: "/fire/Group 6 - 2_13.png",
      bonfire_fire_14: "/fire/Group 6 - 2_14.png",
      chaser: "/enemies/chaser.png",
      skirmisher: "/enemies/skirmisher.png",
      bruiser: "/enemies/bruiser.png",
      guard: "/enemies/guard.png",
      glot: "/enemies/glot.png",
      ambusher: "/enemies/ambusher.png",
      berserker: "/enemies/berserk.png",
      armor: "/loot/chest.png",
      gold: "/loot/gold.png",
      heal: "/loot/hp_potion.png",
      weapon: "/loot/sword.png",
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
