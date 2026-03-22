import { sceneManager } from '../scene/scene';
import Floor from './Floor/floor';
import Obstacle from './Obstacle/obstacle';
import Wall from './Wall/wall';
import Doors from './Door/door';
import Torch from './Torch/Torch';
import { Group } from 'three';
export default class StaticInstancedRenderer {
  constructor({ grid, cellSize } = {}) {
    this.grid = grid;
    this.cellSize = cellSize;
    this.options = {
      grid: this.grid,
      cellSize: this.cellSize,
    };
    this.cells = [];
    this.group = new Group();
    this.#init();
  }
  #init() {
    const floor = new Floor(this.options);
    const wall = new Wall(this.options);
    const obstacle = new Obstacle(this.options);
    const doors = new Doors({
      ...this.options,
      cells: this.grid.getDoorCells(),
    });
    const torch = new Torch({
      ...this.options,
      cells: this.grid.getTorchCells(),
    });
    this.cells = this.grid.getStaticCells();
    this.group.add(floor.instanced);
    this.group.add(wall.instanced);
    this.group.add(obstacle.instanced);
    this.group.add(doors.instanced);
    this.group.add(torch.instanced);
    sceneManager.add(this.group);
  }
  #disposeMaterial(material) {
    if (!material) return;
    if (Array.isArray(material)) {
      for (const item of material) {
        this.#disposeMaterial(item);
      }
      return;
    }
    if (material.userData?.disposeOnRemove) {
      material.dispose();
    }
  }
  dispose() {
    if (!this.group) return;
    sceneManager.remove(this.group);
    this.group.traverse((child) => {
      if (!child.isMesh) return;
      if (child.geometry?.userData?.disposeOnRemove) {
        child.geometry.dispose();
      }
      this.#disposeMaterial(child.material);
    });
    this.cells = [];
    this.group = null;
  }
}
