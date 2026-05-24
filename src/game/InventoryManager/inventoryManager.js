export default class InventoryManager {
  constructor() {
    this.weapon = [];
    this.armor = [];
    this.gold = 0;
    this.def = 0;
    this.weaponAtk = 0;
  }
  useArmor() {
    if (this.armor.length === 0) return;
    const duration = this.armor[0].duration;
    this.armor[0].duration = duration - 1;
    if (this.armor[0].duration === 0) {
      this.armor = [];
      this.def = 0;
    }
  }
  useWeapon() {
    if (this.weapon.length === 0) return;
    const duration = this.weapon[0].duration;
    this.weapon[0].duration = duration - 1;
    if (this.weapon[0].duration === 0) {
      this.weapon = [];
      this.weaponAtk = 0;
    }
  }
  getLoot(loot) {
    switch (loot.type) {
      case 'gold': {
        this.gold = this.gold + loot.value;
        return true;
      }
      case 'heal': {
        return loot.value;
      }
      case 'weapon': {
        this.weapon = [loot.loot];
        this.weaponAtk = this.weapon[0]?.value;
        return true;
      }
      case 'armor': {
        this.armor = [loot.loot];
        this.def =  this.armor[0]?.value;
        return true;
      }
    }
  }
}
