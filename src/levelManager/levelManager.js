import * as THREE from 'three';
import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
export default class LevelManager {
  constructor(cols, rows) {
    this.size = { cols, rows };
    this.grid = new Grid(cols, rows);
    this.#init();
  }
  #init() {
    const staticInstanced = new StaticInstancedRenderer({
      size: this.size,
      cellSize: 1,
    });

    this.grid.setBlockInstanced(staticInstanced.cells);
  }
}
