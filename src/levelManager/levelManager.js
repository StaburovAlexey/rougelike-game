import * as THREE from 'three';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
export default class LevelManager {
  constructor(cols, rows) {
    this.size = { cols, rows };
    this.#init()
  }
  #init() {
    const staticInstanced = new StaticInstancedRenderer({
      size: this.size,
      cellSize: 1,
    });
  }
}
