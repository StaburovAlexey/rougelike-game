import MashEntity from './createMashEntity';
import { sceneManager } from '../scene/scene';
import InventoryManager from '../InventoryManager/inventoryManager';
import CONSTANTS from '../static/constants';
export default class Entity {
  constructor(position = null, type) {
    this.hp = type.hp;
    this.atk = type.atk;
    this.name = type.type || type.name;
    this.cellPosition = position;
    const mash = new MashEntity(this.name);
    this.mesh = mash.mesh;
    this.animator = mash.animator;
    this.syncMeshToCell(this.cellPosition);
    this.inventory = new InventoryManager();
    sceneManager.add(this.mesh);
  }

  syncMeshToCell(cell) {
    if (!cell) return;
    this.cellPosition = cell;
    const floorTopY = CONSTANTS.FLOOR_HEIGHT;
    const meshCenterY = 0.5;
    this.mesh.position.set(
      this.cellPosition.worldX,
      floorTopY + this.mesh.scale.y * meshCenterY,
      this.cellPosition.worldZ,
    );
  }

  syncMeshToCamera(camera) {
    if (!camera || !this.mesh) return;

    const dx = camera.position.x - this.mesh.position.x;
    const dz = camera.position.z - this.mesh.position.z;
    this.mesh.rotation.set(0, Math.atan2(dx, dz), 0);
  }

  dispose() {
    if (!this.mesh) return;
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh.geometry?.dispose?.();
    this.mesh = null;
  }
  update(delta, camera) {
    this.animator?.update(delta);
    this.syncMeshToCamera(camera);
  }
  tryAttack(entity) {
    this.animator?.playOnce('attack');
    const entityDef = entity.inventory.def;
    const atk = this.atk + this.inventory.weaponAtk;
    if (entityDef > atk) {
      entity.hp = entity.hp - 1;
    } else {
      entity.hp = entity.hp - atk;
    }

    entity.inventory.useArmor();
    this.inventory.useWeapon();
    if (this.name == 'player') {
      console.log(this.inventory.weapon[0])
      console.log('weaponAtk',this.inventory.weaponAtk )
    }
    if (entity.name == 'player') {
      console.log('DEF равен', entityDef);
      console.log('Игрок получил урон:', atk);
    }
  }
}
