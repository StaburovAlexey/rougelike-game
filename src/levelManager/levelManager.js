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
    console.log('grid', this.grid.cells)
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
    console.log('grid', this.grid.cells)
    this.light = new DungeonLight();
    this.staticInstancedRenderer.updateVisible(this.grid.getDontExpandCell())
  }
  clearLevel() {
    this.staticInstancedRenderer.dispose();
    this.light.dispose();
    this.staticInstancedRenderer = null;
    this.light = null;
    this.grid = null;
  }
}
