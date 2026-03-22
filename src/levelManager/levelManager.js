import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import DungeonLight from '../light/dungeonLight';

export default class LevelManager {
  constructor(options) {
    this.cols = options.size.cols;
    this.rows = options.size.rows;
    this.gap = 0.1;
    this.cellSize = 1;
    this.doorsCount = options.doorsQuantity;
    this.obstaclesDensity = 0.099;
    this.step = this.cellSize + this.gap;
    this.halfW = ((this.cols - 1) * this.step) / 2;
    this.halfH = ((this.rows - 1) * this.step) / 2;
    this.grid = new Grid(this.cols, this.rows, {
      step: this.step,
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
      obstaclesDensity: this.obstaclesDensity,
    });
    this.staticInstancedRenderer = new StaticInstancedRenderer({
      grid: this.grid,
      cellSize: this.cellSize,
    });
    this.light = new DungeonLight();
  }
  clearLevel() {
    this.staticInstancedRenderer.dispose();
    this.light.dispose();
    this.staticInstancedRenderer = null;
    this.light = null;
    this.grid = null;
  }
}
