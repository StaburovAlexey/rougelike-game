import LevelManager from "../levelManager/levelManager";
import GenerateEnemy from "./generateEnemy";
import GenerateLoot, { buildLevelRewardItem } from "./generateLoot";
import Player from "../entity/Player";
import { HERO_CLASS } from "../static/hero";
import { getDoorEffect } from "../static/subtypeDoors";
import { buildLootItem, LOOT_SOURCES, pickWeighted, getLootTypeWeights, getLootRarityWeights } from "../static/loot";
export default class RunManager {
  constructor({ difficulty, typeRun, classHero, camera, domElement }) {
    this.difficulty = difficulty;
    this.typeRun = typeRun;
    this.classHero = classHero;
    this.camera = camera;
    this.domElement = domElement;
    this.length = null;
    this.runMap = [];
    this.activeIndex = 0;
    this.aciveLevel = null;
    this.player = new Player(null, HERO_CLASS["warrior"]);
    this.#init();
  }
  #init() {
    if (this.typeRun === "classic") {
      this.length = 12;
    }
    for (let i = 0; i < this.length; i++) {
      const level = {};
      level.index = i;
      level.size = {
        rows: this.getRandomGrid(10, 15),
        cols: this.getRandomGrid(10, 15),
      };
      level.doorsQuantity = this.getRandomDoorsQuantity();
      const enemyGenerator = new GenerateEnemy(i, level.size);
      level.enemies = enemyGenerator.enemies;
      level.levelPrefix = this.#getLevelPrefix(i);
      this.runMap.push(level);
    }
    this.renderLevel(this.runMap[0]);
  }
  #getLevelPrefix(index) {
    const partSize = this.length / 4;

    if (index < 0 || index > this.length) {
      return 1;
    }

    if (index <= partSize) return 1;
    if (index <= partSize * 2) return 2;
    if (index <= partSize * 3) return 3;

    return 4;
  }
  renderLevel(options) {
    if (this.aciveLevel) {
      this.aciveLevel.clearLevel();
    }

    const effect = getDoorEffect(this.player.pendingDoorEffect ?? "normal");
    this.player.pendingDoorEffect = null;

    let enemies = options.enemies;
    let extraGroundLoot = [];
    let extraReward = [];

    switch (effect.type) {
      case "noEnemy":
        enemies = [];
        break;

      case "modifier": {
        const enemyGenerator = new GenerateEnemy(options.index, options.size);
        enemies = enemyGenerator.enemies;
        if (effect.enemyMultiplier > 1) {
          const extra = [];
          const baseCount = enemies.length;
          const extraCount = Math.floor(baseCount * (effect.enemyMultiplier - 1));
          for (let i = 0; i < extraCount; i++) {
            extra.push({ ...enemies[i % baseCount], id: baseCount + i });
          }
          enemies = [...enemies, ...extra];
        }
        if (effect.rewardBonus) {
          extraReward.push(
            buildLevelRewardItem(options.index, this.player.rarityBonus),
          );
        }
        break;
      }

      case "groundLoot": {
        for (let i = 0; i < effect.count; i++) {
          if (effect.category === "gold") {
            extraGroundLoot.push(
              buildLootItem({
                type: "gold",
                rarity: "common",
                levelIndex: options.index,
                source: LOOT_SOURCES.ground,
              }),
            );
          } else if (effect.category === "legendary") {
            const exclude = effect.exclude ?? [];
            const typeWeights = getLootTypeWeights(options.index, LOOT_SOURCES.ground);
            for (const ex of exclude) {
              typeWeights[ex] = 0;
            }
            const type = pickWeighted(typeWeights) ?? "gold";
            extraGroundLoot.push(
              buildLootItem({
                type,
                rarity: "legendary",
                levelIndex: options.index,
                source: LOOT_SOURCES.ground,
              }),
            );
          } else {
            // random (possibly with exclusions)
            const exclude = effect.exclude ?? [];
            const typeWeights = getLootTypeWeights(options.index, LOOT_SOURCES.ground);
            for (const ex of exclude) {
              typeWeights[ex] = 0;
            }
            const type = pickWeighted(typeWeights) ?? "gold";
            const rarityWeights = getLootRarityWeights(options.index, LOOT_SOURCES.ground);
            rarityWeights.rare = Math.floor(rarityWeights.rare * (1 + this.player.rarityBonus));
            rarityWeights.legendary = Math.floor(rarityWeights.legendary * (1 + this.player.rarityBonus));
            const rarity = pickWeighted(rarityWeights) ?? "common";
            extraGroundLoot.push(
              buildLootItem({
                type,
                rarity,
                levelIndex: options.index,
                source: LOOT_SOURCES.ground,
              }),
            );
          }
        }
        break;
      }

      case "shopLevel":
        break;
    }

    const lootGenerator = new GenerateLoot(
      options.index,
      options.size,
      this.difficulty ?? "normal",
      this.player.dropBonus,
      this.player.rarityBonus,
      0,
    );

    const groundLoot = [
      ...lootGenerator.loot.groundLoot,
      ...extraGroundLoot.filter(Boolean),
    ];
    const levelReward = [
      ...lootGenerator.loot.levelReward,
      ...extraReward.filter(Boolean),
    ];

    console.log("data level", options);
    this.aciveLevel = new LevelManager(
      {
        ...options,
        difficulty: this.difficulty ?? "normal",
        groundLoot,
        levelReward,
        enemies,
        camera: this.camera,
        domElement: this.domElement,
        nextLevel: () => {
          this.nextLevel();
        },
      },
      this.player,
    );
  }
  nextLevel() {
    if (this.activeIndex === this.length - 1) return;
    this.activeIndex++;
    const level = this.runMap[this.activeIndex];
    this.renderLevel(level);
  }
  update(delta) {
    this.aciveLevel?.update(delta, this.camera);
  }
  getRandomGrid(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  getRandomDoorsQuantity() {
    return Math.floor(Math.random() * (4 - 2 + 1)) + 2;
  }
}
