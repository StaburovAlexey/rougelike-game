import MashEntity from './createMashEntity';
import { sceneManager } from '../scene/scene';
import InventoryManager from '../InventoryManager/inventoryManager';
export default class Entity {
  constructor(position = null, type) {
    this.hp = type.hp;
    this.atk = type.atk;
    this.name = type.type || type.name;
    this.cellPosition = position;
    console.log(type);
    this.mesh = new MashEntity(this.name).mesh;
    this.syncMeshToCell(this.cellPosition);
    this.inventory = new InventoryManager();
    sceneManager.add(this.mesh);
  }

  syncMeshToCell(cell) {
    if (!cell) return;
    this.cellPosition = cell;
    this.mesh.position.set(
      this.cellPosition.worldX,
      0.9,
      this.cellPosition.worldZ,
    );
  }
  dispose() {
    if (!this.mesh) return;
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh = null;
  }
  tryAttack(entity) {
    const entityDef = entity.inventory.def;
    console.log(entityDef)
    const atk = this.atk + this.inventory.weaponAtk;
    console.log('atk', this.atk, 'weaponAtk',this.inventory.weaponAtk)
    if (entityDef > atk) {
      entity.hp = entity.hp - 1;
    }else{
      entity.hp = entity.hp - atk
    }
    entity.inventory.useArmor();
    this.inventory.useWeapon();
    console.log(this.name, 'атаковал', entity.name);
    console.log(`HP ${this.name}: ${this.hp}`);
    console.log(`HP ${entity.name}: ${entity.hp}`);
  }
}
