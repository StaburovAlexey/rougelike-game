import Entity from '../entity/Entity';

export default class Enemy extends Entity {
  constructor(position, type) {
    super(position, type);
    this.syncVisible()
  }
  syncVisible(){
    this.mesh.visible = this.cellPosition.visible
  }
}
