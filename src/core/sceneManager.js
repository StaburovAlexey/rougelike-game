// core/SceneManager.js
import * as THREE from 'three';

class SceneManager {
  static #instance = null;

  constructor() {
    if (SceneManager.#instance) return SceneManager.#instance;

    /** @type {THREE.Scene} */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    SceneManager.#instance = this;
  }

  /** @returns {THREE.Scene} */
  getScene() {
    return this.scene;
  }

  /** @param {THREE.Object3D} obj */
  add(obj) {
    this.scene.add(obj);
  }

  /** @param {THREE.Object3D} obj */
  remove(obj) {
    this.scene.remove(obj);
  }
}

export const sceneManager = new SceneManager();

