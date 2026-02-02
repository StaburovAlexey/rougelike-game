import { PerspectiveCamera } from "three";

export default class Camera {
    constructor(size) {
       this._camera = new PerspectiveCamera(
         60,
         size.width / size.height,
         0.1,
         50,
       );
       this._camera.position.set(0, 6, 10);
       this._camera.lookAt(0, 1, 0);
    }
    updatedPosition(x, y, z) {
       this._camera.position.set(x, y, z);
    }
    updateLookAt(x, y, z) {
       this._camera.lookAt(x, y, z);
    }
    getCamera() {
       return this._camera;
    }

}