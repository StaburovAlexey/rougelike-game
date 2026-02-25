import { sceneManager } from '../scene/scene';
import Floor from './Floor/floor';
import Obstacle from './Obstacle/obstacle';
import Wall from './Wall/wall';
import Doors from './Door/door';
import Torch from './Torch/Torch'
import Windows from './Window/window';
export default class StaticInstancedRenderer {
  constructor({
    size,
    cellSize,
    count,
    step,
    halfH,
    halfW,
    gap,
    doorsCount = 4,
    obstaclesDensity = 0.12,
  } = {}) {
    this.size = size;
    this.cellSize = cellSize;
    this.doorsCount = doorsCount;
    this.obstaclesDensity = obstaclesDensity;
    this.gap = gap;
    this.count = count;
    this.step = step;
    this.halfW = halfW;
    this.halfH = halfH;
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
    const obstacle = new Obstacle(this.options, this.obstaclesDensity);
    const doors = new Doors({ ...this.options, cells: wall.getDoorCells() });
    const torch = new Torch({ ...this.options, cells: wall.getTorchCells()})
    const windows = new Windows({ ...this.options, cells: wall.getWindowCells()})
    this.cells = [...wall.getInstancedCells(), ...obstacle.getInstancedCells()];
    sceneManager.add(floor.instanced);
    sceneManager.add(wall.instanced);
    sceneManager.add(obstacle.instanced);
    sceneManager.add(doors.instanced)
    sceneManager.add(torch.instanced)
    sceneManager.add(windows.instanced)
  }
}
