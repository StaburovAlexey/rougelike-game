import LevelManager from "../levelManager/levelManager";
import GenerateEnemy from "./generateEnemy";
import GenerateLoot from "./generateLoot";
import Player from "../entity/Player";
import { HERO_CLASS } from "../static/hero";
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
    const lootGenerator = new GenerateLoot(
      options.index,
      options.size,
      this.difficulty ?? 'normal',
      this.player.dropBonus,
      this.player.rarityBonus,
    );
    console.log("data level", options);
    this.aciveLevel = new LevelManager(
      {
        ...options,
        difficulty: this.difficulty ?? 'normal',
        groundLoot: lootGenerator.loot.groundLoot,
        levelReward: lootGenerator.loot.levelReward,
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
