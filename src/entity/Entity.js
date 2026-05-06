import * as THREE from 'three';
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
    this.attackTarget = null;
    this.attackTargetPosition = new THREE.Vector3();
    this.attackFacingTime = 0;
    this.facingLeft = false;
    this.lastCamera = null;
    this.directionToTarget = new THREE.Vector3();
    this.cameraForward = new THREE.Vector3();
    this.cameraRight = new THREE.Vector3();
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

    this.lastCamera = camera;
    this.#syncMeshYawToPosition(camera.position);
  }

  #syncMeshYawToPosition(position) {
    const dx = position.x - this.mesh.position.x;
    const dz = position.z - this.mesh.position.z;
    this.mesh.rotation.set(0, Math.atan2(dx, dz), 0);
  }

  #syncAttackDirection(camera = this.lastCamera) {
    if (!camera || !this.mesh) return;

    this.directionToTarget.subVectors(
      this.attackTargetPosition,
      this.mesh.position,
    );
    camera.getWorldDirection(this.cameraForward);
    this.cameraRight.copy(this.cameraForward).cross(camera.up).normalize();

    this.#setFacingLeft(this.directionToTarget.dot(this.cameraRight) < 0);
  }

  #hasActiveAttackDirection() {
    return (
      this.animator?.current === 'attack' ||
      this.attackFacingTime > 0
    );
  }

  #setFacingLeft(facingLeft) {
    if (this.facingLeft === facingLeft) return;

    this.facingLeft = facingLeft;
    const uv = this.mesh.geometry?.attributes?.uv;
    if (!uv) return;

    const leftU = facingLeft ? 1 : 0;
    const rightU = facingLeft ? 0 : 1;

    uv.setXY(0, leftU, 1);
    uv.setXY(1, rightU, 1);
    uv.setXY(2, leftU, 0);
    uv.setXY(3, rightU, 0);
    uv.needsUpdate = true;
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
    if (this.attackFacingTime > 0) {
      this.attackFacingTime = Math.max(0, this.attackFacingTime - delta);
    }

    if (this.attackTarget && this.#hasActiveAttackDirection()) {
      this.#syncAttackDirection(camera);
      return;
    }

    this.attackTarget = null;
    this.#setFacingLeft(false);
  }
  tryAttack(entity) {
    this.attackTarget = entity;
    if (entity?.mesh) {
      this.attackTargetPosition.copy(entity.mesh.position);
    }

    const attackStarted = this.animator?.playOnce('attack');
    if (!attackStarted) {
      this.attackFacingTime = 0.25;
    }
    this.#syncAttackDirection();
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
