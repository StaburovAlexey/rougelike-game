import * as THREE from "three";
import gsap from "gsap";
import MashEntity from "./createMashEntity";
import { sceneManager } from "../scene/scene";
import InventoryManager from "../InventoryManager/inventoryManager";
import CONSTANTS from "../static/constants";
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
    this.facingLeft = true;
    this.lastCamera = null;
    this.directionToTarget = new THREE.Vector3();
    this.cameraForward = new THREE.Vector3();
    this.cameraRight = new THREE.Vector3();
    this.meshCellPosition = new THREE.Vector3();
    this.cameraOffsetDirection = new THREE.Vector3();
    this.cameraDepthOffset = this.name === "warrior" ? 0.3 : 0;
    this.syncMeshToCell(this.cellPosition, true);
    sceneManager.add(this.mesh);
  }

  syncMeshToCell(cell, instant = false) {
    if (!cell) return;

    this.cellPosition = cell;
    const floorTopY = CONSTANTS.FLOOR_HEIGHT;
    const meshCenterY = 0.5;
    if (instant) {
      gsap.killTweensOf(this.meshCellPosition);
      this.meshCellPosition.set(
        this.cellPosition.worldX,
        floorTopY + this.mesh.scale.y * meshCenterY,
        this.cellPosition.worldZ,
      );
      this.#syncMeshVisualPosition(this.lastCamera);
      return;
    }
    gsap.to(this.meshCellPosition, {
      x: this.cellPosition.worldX,
      y: floorTopY + this.mesh.scale.y * meshCenterY,
      z: this.cellPosition.worldZ,
      duration: 1,
      ease: "power2.out",
      
    });

    this.#syncMeshVisualPosition(this.lastCamera);
  }

  syncMeshToCamera(camera) {
    if (!camera || !this.mesh) return;

    this.lastCamera = camera;
    this.#syncMeshVisualPosition(camera);
    this.#syncMeshYawToPosition(camera.position);
  }

  #syncMeshVisualPosition(camera) {
    this.mesh.position.copy(this.meshCellPosition);
    if (!camera || this.cameraDepthOffset === 0) return;

    this.cameraOffsetDirection.subVectors(
      camera.position,
      this.meshCellPosition,
    );
    this.cameraOffsetDirection.y = 0;
    if (this.cameraOffsetDirection.lengthSq() === 0) return;

    this.cameraOffsetDirection
      .normalize()
      .multiplyScalar(this.cameraDepthOffset);
    this.mesh.position.add(this.cameraOffsetDirection);
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

    this.setFacingLeft(this.directionToTarget.dot(this.cameraRight) < 0);
  }

  #hasActiveAttackDirection() {
    return this.animator?.current === "attack" || this.attackFacingTime > 0;
  }

  faceMovementToward(targetX, targetZ, camera) {
    if (!camera || !this.mesh) return;

    const dx = targetX - this.mesh.position.x;
    const dz = targetZ - this.mesh.position.z;

    camera.getWorldDirection(this.cameraForward);
    this.cameraRight.copy(this.cameraForward).cross(camera.up).normalize();

    this.directionToTarget.set(dx, 0, dz);
    const facingLeft = this.directionToTarget.dot(this.cameraRight) < 0;

    this.setFacingLeft(facingLeft);
  }

  setFacingLeft(facingLeft) {
    if (this.facingLeft === facingLeft) return;

    this.facingLeft = facingLeft;
    const uv = this.mesh.geometry?.attributes?.uv;
    if (!uv) return;

    const leftU = facingLeft ? 0 : 1;
    const rightU = facingLeft ? 1 : 0;

    uv.setXY(0, leftU, 1);
    uv.setXY(1, rightU, 1);
    uv.setXY(2, leftU, 0);
    uv.setXY(3, rightU, 0);
    uv.needsUpdate = true;
  }

  setLightIntensity(intensity = 1) {
    const value = THREE.MathUtils.clamp(intensity, 0, 1);
    this.mesh?.material?.color?.setRGB(value, value, value);
  }

  flashDamage() {
    const color = this.mesh?.material?.color;
    if (!color) return Promise.resolve();

    gsap.killTweensOf(color);
    color.setRGB(1, 0.15, 0.15);

    return new Promise((resolve) => {
      gsap.timeline({ onComplete: resolve })
        .to(color, { r: 1, g: 1, b: 1, duration: 0.1, ease: "none" })
        .to(color, { r: 1, g: 0.15, b: 0.15, duration: 0.1, ease: "none" })
        .to(color, { r: 1, g: 1, b: 1, duration: 0.1, ease: "none" })
        .to(color, { r: 1, g: 0.15, b: 0.15, duration: 0.1, ease: "none" })
        .to(color, { r: 1, g: 1, b: 1, duration: 0.1, ease: "none" });
    });
  }

  showDamageNumber(damage) {
    if (!this.mesh || !Number.isFinite(damage)) return Promise.resolve();

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext("2d");
    context.font = "bold 68px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 8;
    context.strokeStyle = "#2a0808";
    context.fillStyle = "#ff3333";
    context.strokeText(String(damage), 64, 64);
    context.fillText(String(damage), 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(this.mesh.position);
    sprite.scale.set(0.45, 0.45, 0.45);
    sceneManager.add(sprite);

    return new Promise((resolve) => {
      gsap.to(sprite.position, {
        y: sprite.position.y + 0.45,
        duration: 0.9,
        ease: "power2.out",
      });

      gsap.to(material, {
        opacity: 0,
        duration: 0.9,
        ease: "power2.in",
        onComplete: () => {
          sceneManager.remove(sprite);
          texture.dispose();
          material.dispose();
          resolve();
        },
      });
    });
  }

  dispose() {
    if (!this.mesh) return;
    gsap.killTweensOf(this.meshCellPosition);
    gsap.killTweensOf(this.mesh.material?.color);
    sceneManager.remove(this.mesh);
    this.mesh.material?.dispose?.();
    this.mesh.geometry?.dispose?.();
    this.animator = null;
    this.inventory = null;
    this.mesh = null;
    this.cellPosition = null;
    this.attackTarget = null;
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
  }
  async tryAttack(entity) {
    this.attackTarget = entity;
    if (entity?.mesh) {
      this.attackTargetPosition.copy(entity.mesh.position);
    }

    this.#syncAttackDirection();
    const attackStarted = await this.animator?.playOnce("attack");
    if (!attackStarted) {
      this.attackFacingTime = 0.25;
    }

    const entityDef = entity.inventory?.def ?? 0;
    const atk = this.atk + (this.inventory?.weaponAtk ?? 0);
    const damage = entityDef > atk ? 1 : atk;
    entity.hp = entity.hp - damage;

    await Promise.all([
      entity.flashDamage?.(),
      entity.showDamageNumber?.(damage),
    ]);
    entity.inventory?.useArmor?.();
    this.inventory?.useWeapon?.();
  }
}
