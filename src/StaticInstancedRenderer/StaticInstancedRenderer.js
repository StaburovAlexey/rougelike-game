import { sceneManager } from '../scene/scene';
import Floor from './Floor/floor';
import Obstacle from './Obstacle/obstacle';
import Wall from './Wall/wall';
import Doors from './Door/door';
import Torch from './Torch/Torch'
export default class StaticInstancedRenderer {
  constructor({ grid, cellSize } = {}) {
    this.grid = grid;
    this.cellSize = cellSize;
    this.options = {
      grid: this.grid,
      cellSize: this.cellSize,
    };
    this.cells = [];
    this.#init();
  }
  #init() {
    const floor = new Floor(this.options);
    const wall = new Wall(this.options);
    const obstacle = new Obstacle(this.options);
    const doors = new Doors({ ...this.options, cells: this.grid.getDoorCells() });
    const torch = new Torch({ ...this.options, cells: this.grid.getTorchCells() });
    this.cells = this.grid.getStaticCells();
    sceneManager.add(floor.instanced);
    sceneManager.add(wall.instanced);
    sceneManager.add(obstacle.instanced);
    sceneManager.add(doors.instanced);
    sceneManager.add(torch.instanced);
  }
}
