import { sceneManager } from "../scene/scene";
import Floor from "./Floor/floor";
import Obstacle from "./Obstacle/obstacle";
import Wall from "./Wall/wall";
import Doors from "./Door/door";
import Torch from "./Torch/torch";
import { Group } from "three";
import { modelManager } from "../core/modelManager";
export default class StaticInstancedRenderer {
  constructor(grid, options = {}) {
    this.grid = grid;
    this.options = {
      grid: this.grid,
      ...options,
    };
    this.cells = [];
    this.group = new Group();
    this.floor = null;
    this.wall = null;
    this.obstacle = null;
    this.doors = null;
    this.torch = null;
    this.backgroundModels = null;
    this.#init();
  }
  #init() {
    this.backgroundModels = modelManager.get("backgrounds");
    this.floor = new Floor(this.options);
    this.wall = new Wall(this.options, this.backgroundModels);
    this.obstacle = new Obstacle(this.options, this.backgroundModels);
    this.doors = new Doors(this.grid.getDoorCells(), this.backgroundModels);
    this.torch = new Torch(this.grid.getTorchCells(), this.backgroundModels);
    this.cells = this.grid.getStaticCells();
    this.group.add(this.floor.instanced);
    this.group.add(this.wall.instanced);
    this.group.add(this.obstacle.instanced);
    this.group.add(this.doors.instanced);
    this.group.add(this.torch.instanced);
    this.updateVisible(this.grid.getDontExpandCell());
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
    // const idsMove = cells.map((cell) => cell.id);
    const idsMove = cells.filter((cell) => !cell.enemy).map((cell) => cell.id);
    const idsAttak = cells.filter((cell) => cell.enemy).map((cell) => cell.id);
    const idsLoot = cells.filter((cell) => cell.loot).map((cell) => cell.id);
    this.floor?.hightLightAttack(idsAttak);
    this.floor?.hightLightMove(idsMove);
    this.floor?.hightLightLoot(idsLoot);
  }
  syncDoorLighting(playerCell, lightRadius, lightCells) {
    this.doors?.syncLighting(playerCell, lightRadius, lightCells);
  }

  getLightCells() {
    const ids = new Set([
      ...(this.torch?.getLightCellIds() ?? []),
      ...(this.wall?.getLightCellIds() ?? []),
      ...(this.obstacle?.getLightCellIds() ?? []),
    ]);

    return [...ids]
      .map((id) => this.grid.cells[id])
      .filter(Boolean);
  }
  setHoveredCell(id = null) {
    this.floor?.setHoveredCell(id);
  }
  update(delta, camera) {
    this.wall?.update(delta);
    this.obstacle?.update(delta, camera);
    this.torch?.update(delta);
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
      if (!child.isMesh && !child.isSprite) return;
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
