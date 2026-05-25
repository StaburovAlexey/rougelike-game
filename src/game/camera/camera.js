import { OrthographicCamera, PerspectiveCamera } from "three";

export default class Camera {
    constructor(size, options = {}) {
       this._type = options.type ?? "perspective";
       this._orthographicSize = options.orthographicSize ?? 10;

       if (this._type === "orthographic") {
          const aspect = size.width / size.height;
          const halfHeight = this._orthographicSize / 2;
          const halfWidth = halfHeight * aspect;

          this._camera = new OrthographicCamera(
            -halfWidth,
            halfWidth,
            halfHeight,
            -halfHeight,
            0.1,
            50,
          );
       } else {
          this._camera = new PerspectiveCamera(
            60,
            size.width / size.height,
            0.1,
            50,
          );
       }

       this._camera.position.set(0, 6, 10);
       this._camera.lookAt(0, 0, 0);
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
    resize(size) {
       if (!size?.width || !size?.height) return;

       if (this._camera.isOrthographicCamera) {
          const aspect = size.width / size.height;
          const halfHeight = this._orthographicSize / 2;
          const halfWidth = halfHeight * aspect;

          this._camera.left = -halfWidth;
          this._camera.right = halfWidth;
          this._camera.top = halfHeight;
          this._camera.bottom = -halfHeight;
       } else {
          this._camera.aspect = size.width / size.height;
       }

       this._camera.updateProjectionMatrix();
    }

}
