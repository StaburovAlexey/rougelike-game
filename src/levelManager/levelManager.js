import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import DungeonLight from '../light/dungeonLight';
import CONSTANTS from '../static/constants';

export default class LevelManager {
  constructor(options) {
    this.cols = options.size.cols;
    this.rows = options.size.rows;
    this.doorsCount = options.doorsQuantity;
    this.step = CONSTANTS.CELL_SIZE + CONSTANTS.GAP_CELLS;
    this.halfW = ((this.cols - 1) * this.step) / 2;
    this.halfH = ((this.rows - 1) * this.step) / 2;
    this.grid = new Grid(this.cols, this.rows, {
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
    });
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
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
