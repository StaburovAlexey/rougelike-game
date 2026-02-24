import { sceneManager } from '../scene/scene';
import Floor from './Floor/floor';
import Wall from './Wall/wall';
export default class StaticInstancedRenderer {
  constructor({ size, cellSize, doorsCount = 4 } = {}) {
    this.size = size;
    this.cellSize = cellSize;
    this.doorsCount = doorsCount;
    this.gap = 0.1;
    this.count = this.size.cols * this.size.rows;
    this.step = cellSize + this.gap;
    this.halfW = ((this.size.cols - 1) * this.step) / 2;
    this.halfH = ((this.size.rows - 1) * this.step) / 2;
    this.options = {
      cellSize: this.cellSize,
      size: this.size,
      step: this.step,
      halfW: this.halfW,
      halfH: this.halfH,
    };
    this.cells = [];
    this.#init();
  }
  #init() {
    const floor = new Floor(this.options);
    const wall = new Wall(this.options, this.doorsCount);
    this.cells = wall.getInstancedCells();
    sceneManager.add(floor.instanced);
    sceneManager.add(wall.instanced);
  }
}
