import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.modelPaths = {
      door: '/models/door_finish_13.03.glb',
      wall: '/models/walls_finish_13.03.glb',
      obstacle: '/models/obstacles_new_4.glb',
      torch: '/models/torches_finish_13.03.glb',
    };
  }

  register(name, path) {
    this.modelPaths[name] = path;
  }

  registerMany(paths) {
    Object.assign(this.modelPaths, paths);
  }

  loadAll() {
    const entries = Object.entries(this.modelPaths);
    const tasks = entries.map(([key, path]) => this.#loadModel(key, path));
    return Promise.all(tasks);
  }

  get(name) {
    return this.models.get(name);
  }

  #loadModel(name, path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          this.models.set(name, gltf);
          resolve(gltf);
        },
        undefined,
        () => {
          reject(new Error(`Failed to load model "${name}" from "${path}"`));
        },
      );
    });
  }
}

const modelManager = new ModelManager();

export { ModelManager, modelManager };
export default modelManager;
