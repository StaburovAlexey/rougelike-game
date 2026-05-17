import Entity from "./Entity";
import InventoryManager from "../InventoryManager/inventoryManager";

export default class Player extends Entity {
  constructor(position, type) {
    super(position, type);
    this.maxHp = type.hp;
    this.pendingDoorEffect = null;
    this.inventory = new InventoryManager();
  }
  get dropBonus() {
    // Бонус к шансу выпадения и количеству предметов
    let bonus = 0;
    if (this.inventory.weapon.length > 0) bonus += 0.05;
    if (this.hp < this.maxHp * 0.3) bonus += 0.1;
    return bonus;
  }
  get rarityBonus() {
    // Бонус к редкости (rare/legendary)
    let bonus = 0;
    if (this.inventory.armor.length > 0) bonus += 0.08;
    return bonus;
  }
  get rewardBonus() {
    // Дополнительные предметы в levelReward (целое число)
    let bonus = 0;
    // if (this.inventory.gold > 50) bonus += 1;
    return bonus;
  }
  get lightRadius() {
    let radius = 3;
    //  if (this.inventory.weapon.length > 0) radius += 1;
    // if (this.inventory.armor.length > 0) radius += 1;
    //if (this.hp < this.maxHp * 0.3) radius -= 1;
    return Math.max(1, radius);
  }
  get chanceDoors() {
    return {
      gold: 15,
      shop: 20,
      hell: 30,
    };
  }
  getLoot(loot) {
    const value = this.inventory.getLoot(loot);
    if (loot.type === "heal") {
      const finalyHeal = this.hp + value;
      this.hp = finalyHeal > this.maxHp ? this.maxHp : finalyHeal;
    }
  }
}
