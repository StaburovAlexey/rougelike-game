import { sceneManager } from '../scene/scene';
import * as THREE from 'three';
export default class StaticMeshRenderer {
  constructor({ cells, halfW, halfH, step, cellSize } = {}) {
    this.cells = cells;
    this.halfH = halfH;
    this.halfW = halfW;
    this.step = step;
    this.cellSize = cellSize;
    this.doorCells = [];
    this.torchCells = [];
    this.windowCells = [];
    this.#init();
  }

  #init() {
    this.#findCellDoors();
    this.#findCellTorchs();
    this.#findCellWindows();
    // this.creatDoor();
  }
  #findCellDoors() {
    this.doorCells = this.cells.filter((cell) => cell.type == 'door');
  }
  #findCellTorchs() {
    this.torchCells = this.cells.filter((cell) => cell.type == 'torch');
  }
  #findCellWindows() {
    this.windowCells = this.cells.filter((cell) => cell.type == 'window');
  }
  creatDoor() {
    for (const cell of this.doorCells) {
      const x = cell.col * this.step - this.halfW;
      const z = cell.row * this.step - this.halfH;
      const material = new THREE.MeshLambertMaterial({
        color: '#5555',
      });
      const geometry = new THREE.BoxGeometry(this.cellSize, 1.5, this.cellSize);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 1.5 / 2 + 0.2, z);

      // ориентация по стороне
      if (cell.side === 'left' || cell.side === 'right')
        mesh.rotation.y = Math.PI / 2;
      else mesh.rotation.y = 0;

      sceneManager.add(mesh);
    }
  }
}
