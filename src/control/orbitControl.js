import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Controls {
  constructor(camera, domElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.minPolarAngle = 0.8;
    this.controls.maxPolarAngle = Math.PI / 2.5;
  }
  getTarget(out) {
    return out.copy(this.controls.target);
  }
  setTarget(x, y, z) {
    this.controls.target.set(x, y, z);
  }
  update() {
    this.controls.update();
  }
}
