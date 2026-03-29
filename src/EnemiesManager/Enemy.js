import Entity from '../entity/Entity';

export default class Enemy extends Entity {
  constructor(position, type) {
    super(position, type);
    this.aggroRange = type.aggroRange;
    this.syncVisible();
  }
  syncVisible() {
    this.mesh.visible = this.cellPosition.visible;
  }
}
