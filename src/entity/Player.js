import Entity from './Entity';

export default class Player extends Entity {
  constructor(position, type) {
    super(position, type);
    this.maxHp = type.hp;
  }
  getLoot(loot) {
    const value = this.inventory.getLoot(loot);
    if (loot.type === 'heal') {
      const finalyHeal = this.hp + value;
      this.hp = finalyHeal > this.maxHp ? this.maxHp : finalyHeal;
    }
  }
}
