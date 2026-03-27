import { sceneManager } from '../scene/scene';
import Floor from './Floor/floor';
import Obstacle from './Obstacle/obstacle';
import Wall from './Wall/wall';
import Doors from './Door/door';
import Torch from './Torch/Torch';
import { Group } from 'three';
export default class StaticInstancedRenderer {
  constructor(grid) {
    this.grid = grid;
    this.options = {
      grid: this.grid,
    };
    this.cells = [];
    this.group = new Group();
    this.floor = null;
    this.wall = null;
    this.obstacle = null;
    this.doors = null;
    this.torch = null;
    this.#init();
  }
  #init() {
    this.floor = new Floor(this.options);
    this.wall = new Wall(this.options);
    this.obstacle = new Obstacle(this.options);
    this.doors = new Doors({
      ...this.options,
      cells: this.grid.getDoorCells(),
    });
    this.torch = new Torch({
      ...this.options,
      cells: this.grid.getTorchCells(),
    });
    this.cells = this.grid.getStaticCells();
    this.group.add(this.floor.instanced);
    this.group.add(this.wall.instanced);
    this.group.add(this.obstacle.instanced);
    this.group.add(this.doors.instanced);
    this.group.add(this.torch.instanced);
    sceneManager.add(this.group);
  }
  updateVisible(cells = []) {
    if (!cells.length) return;

    this.floor.updateVisible(cells);
    this.wall.updateVisible(cells);
    this.obstacle.updateVisible(cells);
    this.doors.updateVisible(cells);
    this.torch.updateVisible(cells);

    cells.forEach((cell) => {
      cell.expand = true;
    });
  }
  hightLightMoveCells(cells = []) {
    const ids = cells.map((cell) => cell.id);
    this.floor?.hightLightMove(ids);
  }
  setHoveredCell(id = null) {
    this.floor?.setHoveredCell(id);
  }
  getFloorMesh() {
    return this.floor?.instanced ?? null;
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
