// core/SceneManager.js
import {Scene,Color} from 'three'
class SceneManager {
  static #instance = null;

  constructor() {
    if (SceneManager.#instance) return SceneManager.#instance;
    this.scene = new Scene();
    this.scene.background = new Color(0x111111);

    SceneManager.#instance = this;
  }


  getScene() {
    return this.scene;
  }


  add(obj) {
    this.scene.add(obj);
  }

  remove(...obj) {
    this.scene.remove(...obj);
  }
}

export const sceneManager = new SceneManager();

