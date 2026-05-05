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
      player: "/player/player.png",
      Stone_1_texture: "/texture/coral_fort_wall_03_diff_1k.jpg",
      player_1_idle_1: "/player/hero_1/idle/1.png",
      player_1_idle_2: "/player/hero_1/idle/2.png",
      player_1_idle_3: "/player/hero_1/idle/3.png",
      player_1_idle_4: "/player/hero_1/idle/4.png",
      player_1_idle_5: "/player/hero_1/idle/5.png",
      player_1_idle_6: "/player/hero_1/idle/6.png",
      player_1_idle_7: "/player/hero_1/idle/7.png",
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
