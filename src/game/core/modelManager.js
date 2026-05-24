import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.modelPaths = {
      backgrounds: '/backgrounds/backgrounds.glb',
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
        assetUrl(path),
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
