import * as THREE from "three";

const assetUrl = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.texturePaths = {
      floor_1_texture: "/floor/1.jpg",
      floor_2_texture: "/floor/2.jpg",
      floor_3_texture: "/floor/3.jpg",
      floor_4_texture: "/floor/4.jpg",
      RockWall_1_texture: "/wall/1.jpg",
      RockWall_2_texture: "/wall/2.jpg",
      RockWall_3_texture: "/wall/3.jpg",
      RockWall_4_texture: "wall/4.jpg",
      Stone_1_texture: "/texture/coral_fort_wall_03_diff_1k.jpg",
      Tube_1_texture: "/texture/rusty_metal_02_diff_1k.jpg",
      ArmoreSteel_1_texture: "texture/rusty_metal_04_diff_1k.jpg",
      Wood_1_texture: "texture/wood_peeling_paint_weathered_diff_1k.jpg",
      BoxSteel_1_texture: "texture/blue_metal_plate_diff_1k.jpg",
      ShieldSteel_1_texture: "texture/blue_metal_plate_diff_1k.jpg",
      Flag_1_texture: "texture/book_pattern_col1_1k.jpg",
      glot_idle_1: "/enemies/glot/idle/1.png",
      glot_idle_2: "/enemies/glot/idle/2.png",
      glot_idle_3: "/enemies/glot/idle/3.png",
      glot_idle_4: "/enemies/glot/idle/4.png",
      glot_idle_5: "/enemies/glot/idle/5.png",
      glot_idle_6: "/enemies/glot/idle/6.png",
      glot_idle_7: "/enemies/glot/idle/7.png",
      glot_idle_8: "/enemies/glot/idle/8.png",
      glot_idle_9: "/enemies/glot/idle/9.png",
      glot_attack_1: "/enemies/glot/attack/1.png",
      glot_attack_2: "/enemies/glot/attack/2.png",
      glot_attack_3: "/enemies/glot/attack/3.png",
      glot_attack_4: "/enemies/glot/attack/4.png",
      glot_attack_5: "/enemies/glot/attack/5.png",
      glot_attack_6: "/enemies/glot/attack/6.png",
      glot_attack_7: "/enemies/glot/attack/7.png",
      glot_attack_8: "/enemies/glot/attack/8.png",
      glot_attack_9: "/enemies/glot/attack/9.png",
      glot_attack_10: "/enemies/glot/attack/10.png",
      glot_attack_11: "/enemies/glot/attack/11.png",
      glot_attack_12: "/enemies/glot/attack/12.png",
      glot_attack_13: "/enemies/glot/attack/13.png",
      glot_attack_14: "/enemies/glot/attack/14.png",
      glot_attack_15: "/enemies/glot/attack/15.png",
      glot_attack_16: "/enemies/glot/attack/16.png",
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
      warrior_idle_8: "/player/warrior/idle/8.png",
      // warrior_idle_2: "/player/warrior/idle/2.png",
      // warrior_idle_3: "/player/warrior/idle/3.png",
      // warrior_idle_4: "/player/warrior/idle/4.png",
      // warrior_idle_5: "/player/warrior/idle/5.png",
      // warrior_idle_6: "/player/warrior/idle/6.png",
      // warrior_idle_7: "/player/warrior/idle/7.png",
      rouge_idle_1: "/player/rouge/idle/1.png",
      rouge_idle_2: "/player/rouge/idle/2.png",
      rouge_idle_3: "/player/rouge/idle/3.png",
      rouge_idle_4: "/player/rouge/idle/4.png",
      rouge_idle_5: "/player/rouge/idle/5.png",
      rouge_idle_6: "/player/rouge/idle/6.png",
      rouge_attack_1: "/player/rouge/attack/1.png",
      rouge_attack_2: "/player/rouge/attack/2.png",
      rouge_attack_3: "/player/rouge/attack/3.png",
      rouge_attack_4: "/player/rouge/attack/4.png",
      rouge_attack_5: "/player/rouge/attack/5.png",
      rouge_attack_6: "/player/rouge/attack/6.png",
      rouge_attack_7: "/player/rouge/attack/7.png",
      rouge_attack_8: "/player/rouge/attack/8.png",
      rouge_attack_9: "/player/rouge/attack/9.png",
      rouge_attack_10: "/player/rouge/attack/10.png",
      rouge_attack_11: "/player/rouge/attack/11.png",
      rouge_attack_12: "/player/rouge/attack/12.png",
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
      tube_flow_1: "/tube/Group 7 - 2_1.png",
      tube_flow_2: "/tube/Group 7 - 2_2.png",
      tube_flow_3: "/tube/Group 7 - 2_3.png",
      tube_flow_4: "/tube/Group 7 - 2_4.png",
      tube_flow_5: "/tube/Group 7 - 2_5.png",
      tube_flow_6: "/tube/Group 7 - 2_6.png",
      tube_flow_7: "/tube/Group 7 - 2_7.png",
      tube_flow_8: "/tube/Group 7 - 2_8.png",
      chanceGold: "/doors/chanceGold.png",
      chanceLoot: "/doors/chanceLoot.png",
      chanceLegendary: "/doors/chanceLegendary.png",
      noEnemy: "/doors/noEnemy.png",
      shop: "/doors/shop.png",
      hell: "/doors/hell.png",
      chaser: "/enemies/chaser.png",
      skirmisher: "/enemies/skirmisher.png",
      bruiser: "/enemies/glot.png",
      guard: "/enemies/guard.png",
      glot: "/enemies/bruiser.png",
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
        assetUrl(path),
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
