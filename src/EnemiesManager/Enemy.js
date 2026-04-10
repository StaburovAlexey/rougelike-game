import Entity from '../entity/Entity';

export default class Enemy extends Entity {
  constructor(position, type) {
    super(position, type);
    this.id = type.id;
    this.aggroRange = type.aggroRange;
    this.windUpTurns = type.windUpTurns;
    this.move = type.windUpTurns;
    this.speed = typeof type.speed === 'number' ? type.speed : 1;
    this.hitAndRun = type.hitAndRun;
    this.randomMove = type.randomMove;
    this.lootDestroy = type.lootDestroy;
    this.friendlyFire = type.friendlyFire ?? type.frendlyFire;
    this.allyHitChance = type.allyHitChance;
    this.lootDestroyChance = type.lootDestroyChance;
    this.syncVisible();
  }
  syncVisible() {
    this.mesh.visible = this.cellPosition.visible;
  }
  tryMove() {}
}
