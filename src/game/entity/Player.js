import Entity from "./Entity";
import InventoryManager from "../InventoryManager/inventoryManager";

export default class Player extends Entity {
  constructor(position, type) {
    super(position, type);
    this.maxHp = type.hp;
    this.pendingDoorEffect = null;
    this.modifiers = [];
    this.inventory = new InventoryManager();
  }
  addModifier(modifier) {
    if (!modifier?.stat) return;
    this.modifiers.push({ ...modifier });
  }
  getModifierValue(stat) {
    return this.modifiers
      .filter((modifier) => modifier.stat === stat)
      .reduce((sum, modifier) => sum + (modifier.value ?? 0), 0);
  }
  getModifierMultiplier(stat) {
    return this.modifiers
      .filter((modifier) => modifier.stat === stat)
      .reduce((multiplier, modifier) => {
        return multiplier * (modifier.multiplier ?? 1);
      }, 1);
  }
  tickRoomModifiers() {
    this.modifiers = this.modifiers
      .map((modifier) => {
        if (typeof modifier.roomsLeft !== "number") return modifier;
        return { ...modifier, roomsLeft: modifier.roomsLeft - 1 };
      })
      .filter((modifier) => {
        return typeof modifier.roomsLeft !== "number" || modifier.roomsLeft > 0;
      });
  }
  applyTurnModifiers() {
    const damagePerTurn = this.getModifierValue("damagePerTurn");
    if (damagePerTurn > 0) {
      this.hp = Math.max(0, this.hp - damagePerTurn);
      this.flashDamage?.();
      this.showDamageNumber?.(damagePerTurn);
    }

    this.modifiers = this.modifiers
      .map((modifier) => {
        if (typeof modifier.turnsLeft !== "number") return modifier;
        return { ...modifier, turnsLeft: modifier.turnsLeft - 1 };
      })
      .filter((modifier) => {
        return typeof modifier.turnsLeft !== "number" || modifier.turnsLeft > 0;
      });
  }
  get damageMultiplier() {
    return this.getModifierMultiplier("damageMultiplier");
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
    let radius = 3 + this.getModifierValue("lightRadius");
    //  if (this.inventory.weapon.length > 0) radius += 1;
    // if (this.inventory.armor.length > 0) radius += 1;
    //if (this.hp < this.maxHp * 0.3) radius -= 1;
    return Math.max(1, radius);
  }
  get chanceDoors() {
    return {
      chanceGold: 15,
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
