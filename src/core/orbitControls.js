import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Controls {
  constructor(camera, domElement) {
    this._controls = new OrbitControls(camera, domElement);

    this._controls.target.set(0, 1, 0);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.05;
  }

  update() {
    this._controls.update();
  }

  dispose() {
    this._controls.dispose();
  }

  setTarget(x, y, z) {
    this._controls.target.set(x, y, z);
  }

  setEnabled(value) {
    this._controls.enabled = value;
  }
}