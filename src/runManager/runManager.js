import LevelManager from '../levelManager/levelManager';

export default class RunManager {
  constructor({ difficulty, typeRun, classHero }) {
    this.difficulty = difficulty;
    this.typeRun = typeRun;
    this.classHero = classHero;
    this.length = null;
    this.runMap = [];
    this.activeIndex = 0;
    this.aciveLevel = null;
    this.#init();
  }
  #init() {
    if (this.typeRun === 'classic') {
      this.length = 20;
    }
    for (let i = 0; i < this.length; i++) {
      const level = {};
      level.index = i;
      level.size = {
        rows: this.getRandomGrid(7, 15),
        cols: this.getRandomGrid(7, 15),
      };
      level.doorsQuantity = this.getRandomDoorsQuantity();
      this.runMap.push(level);
    }
    this.renderLevel(this.runMap[0]);
  }
  renderLevel(options) {
    if (this.aciveLevel) {
      this.aciveLevel.clearLevel();
    }
    this.aciveLevel = new LevelManager(options);
  }
  nextLevel() {
    if (this.activeIndex === this.length - 1) return;
    this.activeIndex++;
    const level = this.runMap[this.activeIndex];
    this.renderLevel(level);
  }
  getRandomGrid(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  getRandomDoorsQuantity() {
    return Math.floor(Math.random() * (4 - 1 + 1)) + 1;
  }
}
