import * as THREE from "three";
import { textureManager } from "../core/textureManager";
import { animationsManager } from "../core/animationManager";
import SpriteAnimator from "./SpriteAnimator";

export default class MashEntity {
  constructor(typeTexture) {
    this.size = 1.2;
    this.height = 1.5;
    const animations = this.#getAnimations(typeTexture);
    this.#prepareTextures(animations);
    const texture = animations.idle[0];
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.geometry.userData.disposeOnRemove = true;
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.#getScale(typeTexture);
    this.animator = new SpriteAnimator(this.material, animations, {
      fpsByAnimation: {
        idle: 8,
        attack: 14,
      },
    });
  }

  #prepareTextures(animations) {
    const textures = new Set(Object.values(animations).flat());
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }
  }
  #getScale(typeTexture) {
    if (typeTexture === "rouge") {
      this.mesh.scale.set(2, 2, 2);
    } else if (typeTexture === "warrior") {
      this.mesh.scale.set(1.5, 1.5, 1.5);
    } else if (typeTexture === "glot") {
      this.mesh.scale.set(2, 2, 2);
    } else {
      this.mesh.scale.set(this.size, this.height, 1);
    }
  }
  #getAnimations(typeTexture) {
    const animation = animationsManager.get(typeTexture);
    if (animation?.idleAnimation?.length) {
      return {
        idle: animation.idleAnimation,
        attack: animation.attackAnimation,
      };
    }

    const staticTexture = textureManager.get(typeTexture);
    if (!staticTexture) {
      throw new Error(`Texture "${typeTexture}" is not loaded`);
    }

    return {
      idle: [staticTexture],
      attack: [],
    };
  }
}
