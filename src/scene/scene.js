import * as THREE from 'three';

export class SceneManager {
  static #instance = null;
  constructor() {
    if (SceneManager.#instance) return SceneManager.#instance;
    this.container = document.getElementById('canvas-container');
    this.size = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.pixelRatio = 2.5;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.#init()
  }
  #init() {
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.size.width, this.size.height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);
  }
  getScene() {
    return this.scene;
  }
  getRenderer(){
    return this.renderer
  }
  getSize(){
    return this.size
  }
  getContainer() {
    return this.container;
  }
  add(obj) {
    this.scene.add(obj);
  }
  remove(...obj) {
    this.scene.remove(...obj);
  }
}

export const sceneManager = new SceneManager();
