import * as THREE from "three";
import { textureManager } from "../../core/textureManager";
import CONSTANTS from "../../static/constants";
import materialManager from "../../core/materialManager";
export default class Floor {
  constructor(options) {
    this.grid = options.grid;
    this.colorMoveCell = new THREE.Color("#14ff4e");
    this.colorAttackCell = new THREE.Color("#f51212");
    this.colorLootCell = new THREE.Color("#ffd24a");
    this.colorHoverCell = new THREE.Color("#7bdff2");
    this.basicColorCell = new THREE.Color("#ffffff");
    this.y = 0.2;
    this.moveHighlightCells = new Set();
    this.attackHighlightCells = new Set();
    this.lootHighlightCells = new Set();
    this.hoveredCellId = null;
    this.geometry = new THREE.BoxGeometry(
      CONSTANTS.CELL_SIZE,
      this.y,
      CONSTANTS.CELL_SIZE,
    );
    this.geometry.userData.disposeOnRemove = true;

    this.instanced = new THREE.InstancedMesh(
      this.geometry,
      materialManager.getMaterial("floor"),
      this.grid.cols * this.grid.rows,
    );
    this.dummy = new THREE.Object3D();
    this.#init();
  }

  #init() {
    for (let i = 0; i < this.grid.cells.length; i++) {
      const cell = this.grid.cells[i];
      this.dummy.position.set(cell.worldX, this.y / 2, cell.worldZ);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(
        CONSTANTS.HIDDEN_SCALE,
        CONSTANTS.HIDDEN_SCALE,
        CONSTANTS.HIDDEN_SCALE,
      );
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
  }

  updateVisible(cells) {
    cells.forEach((cell) => {
      this.dummy.position.set(cell.worldX, this.y / 2, cell.worldZ);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(cell.id, this.dummy.matrix);
    });

    this.instanced.instanceMatrix.needsUpdate = true;
  }

  setHoveredCell(id = null) {
    if (this.hoveredCellId === id) return;

    const previousId = this.hoveredCellId;
    this.hoveredCellId = id;

    if (previousId !== null) {
      this.#applyCellColor(previousId);
    }

    if (this.hoveredCellId !== null) {
      this.#applyCellColor(this.hoveredCellId);
    }

    this.#markInstanceColorDirty();
  }
  hightLightAttak(ids = []) {
    const previousIds = [...this.attackHighlightCells];
    this.attackHighlightCells.clear();

    for (const id of previousIds) {
      this.#applyCellColor(id);
    }

    for (const id of ids) {
      this.attackHighlightCells.add(id);
      this.#applyCellColor(id);
    }

    this.#markInstanceColorDirty();
  }
  hightLightMove(ids) {
    const previousIds = [...this.moveHighlightCells];
    this.moveHighlightCells.clear();

    for (const id of previousIds) {
      this.#applyCellColor(id);
    }

    for (const id of ids) {
      this.moveHighlightCells.add(id);
      this.#applyCellColor(id);
    }

    this.#markInstanceColorDirty();
  }

  hightLightLoot(ids = []) {
    const previousIds = [...this.lootHighlightCells];
    this.lootHighlightCells.clear();

    for (const id of previousIds) {
      this.#applyCellColor(id);
    }

    for (const id of ids) {
      this.lootHighlightCells.add(id);
      this.#applyCellColor(id);
    }

    this.#markInstanceColorDirty();
  }

  #applyCellColor(id) {
    let color = this.basicColorCell;

    if (this.moveHighlightCells.has(id)) {
      color = this.colorMoveCell;
    }

    if (this.attackHighlightCells.has(id)) {
      color = this.colorAttackCell;
    }

    if (this.lootHighlightCells.has(id)) {
      color = this.colorLootCell;
    }

    if (this.hoveredCellId === id) {
      color = this.colorHoverCell;
    }

    this.instanced.setColorAt(id, color);
  }

  #markInstanceColorDirty() {
    if (!this.instanced.instanceColor) return;
    this.instanced.instanceColor.needsUpdate = true;
  }
}
