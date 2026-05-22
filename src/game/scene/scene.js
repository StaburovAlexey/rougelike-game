import * as THREE from "three";
export let sceneManager = null;
export function initSceneManager(container) {
  sceneManager = new SceneManager(container);
  return sceneManager;
}
export function getSceneManager() {
  if (!sceneManager) {
    throw new Error(
      "SceneManager is not initialized. Call initSceneManager()first.",
    );
  }

  return sceneManager;
}

export class SceneManager {
  constructor(container) {
    this.container =
      typeof container === "string" ? document.getElementById(container) : container;

    if (!this.container) {
      throw new Error("Scene container not found");
    }

    this.size = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.pixelRatio = 2.5;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.#init();
  }
  #init() {
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.size.width, this.size.height, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.container.appendChild(this.renderer.domElement);
  }
  getScene() {
    return this.scene;
  }
  getRenderer() {
    return this.renderer;
  }
  getSize() {
    return this.size;
  }
  getContainer() {
    return this.container;
  }
  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (!width || !height) return this.size;
    if (width === this.size.width && height === this.size.height) return this.size;

    this.size = { width, height };
    this.renderer.setSize(width, height, false);

    return this.size;
  }
  add(obj) {
    this.scene.add(obj);
  }
  remove(...obj) {
    this.scene.remove(...obj);
  }
  dispose() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.clear();
  }
}
