import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import StaticMeshRenderer from '../StaticMeshRenderer/StaticMeshRenderer';
import DungeonLight from '../light/dungeonLight';
export default class LevelManager {
  constructor(cols, rows) {
    this.size = { cols, rows };
    this.gap = 0.1;
    this.cellSize = 1;
    this.doorsCount = 4;
    this.obstaclesDensity = 0.095;
    this.count = cols * rows;
    this.step = this.cellSize + this.gap;
    this.halfW = ((cols - 1) * this.step) / 2;
    this.halfH = ((rows - 1) * this.step) / 2;
    this.grid = new Grid(cols, rows, {
      step: this.step,
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
      obstaclesDensity: this.obstaclesDensity,
    });
    this.light = new DungeonLight();
    new StaticInstancedRenderer({
      grid: this.grid,
      cellSize: this.cellSize,
    });
  }
}
