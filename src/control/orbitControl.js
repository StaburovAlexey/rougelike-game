import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Controls {
  constructor(camera, domElement) {
    this.controls = new OrbitControls(camera, domElement);
  }
  update(){
    this.controls.update()
  }
}
