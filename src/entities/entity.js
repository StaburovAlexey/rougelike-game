import * as THREE from "three";

export default class Entity {
  constructor({
    level,
    start = { col: 1, row: 1 },
    size = 0.6,
    height = 1,
    color = 0xffffff,
  } = {}) {
    if (!level) throw new Error("Entity: level is required");
    this.level = level;
    this.col = start.col;
    this.row = start.row;

    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshBasicMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);

    this.updateWorldPosition(0.5);
  }

  updateWorldPosition(height = 0.5) {
    const pos = this.level.gridToWorld(this.col, this.row, height);
    this.mesh.position.copy(pos);
  }

  canEnter(col, row) {
    if (col < 0 || col >= this.level.cols) return false;
    if (row < 0 || row >= this.level.rows) return false;

    const key = `${col}:${row}`;
    const content = this.level.cellContents.get(key);
    if (!content) return true;
    return (
      content.type === "floor" ||
      content.type === "loot" ||
      content.type === "door"
    );
  }

  tryMove(dx, dy) {
    const nextCol = this.col + dx;
    const nextRow = this.row + dy;
    if (!this.canEnter(nextCol, nextRow)) return false;

    this.col = nextCol;
    this.row = nextRow;
    this.updateWorldPosition();
    return true;
  }

  getObject3D() {
    return this.mesh;
  }
}
