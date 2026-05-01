import { sceneManager } from "../scene/scene";
import Floor from "./Floor/floor";
import Obstacle from "./Obstacle/obstacle";
import Wall from "./Wall/wall";
import Doors from "./Door/door";
import Torch from "./Torch/torch";
import { Group } from "three";
export default class StaticInstancedRenderer {
  constructor(grid, ui) {
    this.grid = grid;
    this.ui = ui;
    this.options = {
      grid: this.grid,
      prefix: ui,
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
    const level = this.#initUiModelLevel();
    const textureFloor = this.#initTextureFloorLevel();
    this.floor = new Floor(this.options, textureFloor);
    this.wall = new Wall(this.options, level);
    this.obstacle = new Obstacle(this.options, level);
    this.doors = new Doors(this.grid.getDoorCells(), level, this.ui);
    this.torch = new Torch(this.grid.getTorchCells(), level, this.ui);
    this.cells = this.grid.getStaticCells();
    this.group.add(this.floor.instanced);
    this.group.add(this.wall.instanced);
    this.group.add(this.obstacle.instanced);
    this.group.add(this.doors.instanced);
    this.group.add(this.torch.instanced);
    sceneManager.add(this.group);
  }
  #initUiModelLevel() {
    return `level_${this.ui}`;
  }
  #initTextureFloorLevel() {
    const level_1 = {
      floorDiff: "coastDiff",
      normalMap: "coastNormal",
      aoMap: "coastAo",
    };
    const level_2 = {
      floorDiff: "floorDiff",
      normalMap: "floorNormal",
      aoMap: "floorAo",
    };
    if (this.ui === 1) {
      return level_1;
    }
    if (this.ui === 2) {
      return level_2;
    }
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
    // const idsMove = cells.map((cell) => cell.id);
    const idsMove = cells.filter((cell) => !cell.enemy).map((cell) => cell.id);
    const idsAttak = cells.filter((cell) => cell.enemy).map((cell) => cell.id);
    const idsLoot = cells.filter((cell) => cell.loot).map((cell) => cell.id);
    this.floor?.hightLightAttak(idsAttak);
    this.floor?.hightLightMove(idsMove);
    this.floor?.hightLightLoot(idsLoot);
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
      if (child.isInstancedMesh) {
        child.dispose();
      }
      child.geometry?.dispose?.();
      this.#disposeMaterial(child.material);
    });
    this.group.clear();
    this.cells = [];
    this.floor = null;
    this.wall = null;
    this.obstacle = null;
    this.doors = null;
    this.torch = null;
    this.group = null;
  }
}
