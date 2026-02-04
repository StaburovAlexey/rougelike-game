
import Environment from "./environment";

export default class Floor extends Environment {
  constructor(options = {}) {
    super(options);

    const { y = 0, cells = [], levelGroup } = options;

    this.levelGroup = levelGroup;
    this.y = y;
    this.cells = cells;
    this.createFloor()
  }

  createFloor() {
    this.createInstance()
    let i = 0;
    for (const cell of this.cells) {
      const x = this.getX(cell);
      const z = this.getZ(cell);

      this.dummy.position.set(x, this.y, z);
      this.dummy.updateMatrix();
      this.dummy.position.y = this.y + this.thickness;

      this.instanced.setMatrixAt(i, this.dummy.matrix);
      i++;
    }

    this.instanced.instanceMatrix.needsUpdate = true;
    this.instanced.userData = this.getUserData();

    this.setMesh(this.instanced);
    this.levelGroup.add(this.instanced);
  }
  
}
