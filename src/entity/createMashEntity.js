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
    this.material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
      alphaTest: 0.05,
    });
    this.mesh = new THREE.Sprite(this.material);
    this.mesh.scale.set(this.size, this.height, 1);
    this.animator = new SpriteAnimator(this.material, animations);
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

  #getAnimations(typeTexture) {
    const type = typeTexture === "player" ? "player_1" : typeTexture;
    const animation = animationsManager.get(type);
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
