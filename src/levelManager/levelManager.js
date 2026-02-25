import * as THREE from 'three';
import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import StaticMeshRenderer from '../StaticMeshRenderer/StaticMeshRenderer';
import DungeonLight from '../light/dungeonLight';
export default class LevelManager {
  constructor(cols, rows) {
    this.size = { cols, rows };
    this.gap = 0.1;
    this.cellSize = 1;
    this.count = cols * rows;
    this.step = this.cellSize + this.gap;
    this.halfW = ((cols - 1) * this.step) / 2;
    this.halfH = ((rows - 1) * this.step) / 2;
    this.grid = new Grid(cols, rows);
    this.light = new DungeonLight();
    this.#init();
  }
  #init() {
    
    const staticInstanced = new StaticInstancedRenderer({
      size: this.size,
      cellSize: this.cellSize,
      count: this.count,
      step: this.step,
      halfH: this.halfH,
      halfW: this.halfW,
      gap: this.gap,
      doorsCount: 4,
    });
    const staticMesh = new StaticMeshRenderer({
      cells: staticInstanced.cells,
      halfH: this.halfH,
      halfW: this.halfW,
      step: this.step,
      cellSize: this.cellSize,
    });
    this.grid.setBlockInstanced(staticInstanced.cells);
  }
}
