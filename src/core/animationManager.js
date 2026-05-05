import textureManager from "./textureManager";
import { ENEMY_TYPE_RULES } from "../static/enemy";
export class AnimationsManager {
  static #instance = null;
  constructor() {
    if (AnimationsManager.#instance) return AnimationsManager.#instance;
    this.animations = new Map();
  }
  loadAll() {
    this.#initEntity();
    this.#initStatic();
  }
  #initEntity() {
    const temp = { ...ENEMY_TYPE_RULES, player_1: {} };
    for (const entity in temp) {
      const idleAnimation = this.#getAnimationFrames(entity, "idle");
      const attackAnimation = this.#getAnimationFrames(entity, "attack");
      this.animations.set(entity, { idleAnimation, attackAnimation });
    }
  }

  #getAnimationFrames(entity, animationName) {
    return [...textureManager.textures.keys()]
      .filter((key) => key.startsWith(`${entity}_${animationName}_`))
      .sort((a, b) => this.#getFrameIndex(a) - this.#getFrameIndex(b))
      .map((key) => textureManager.get(key));
  }

  #initStatic() {
    this.animations.set("torch", {
      fireAnimation: this.#getAnimationFrames("torch", "fire"),
    });
    this.animations.set("bonfire", {
      fireAnimation: this.#getAnimationFrames("bonfire", "fire"),
    });
  }

  #getFrameIndex(key) {
    return Number(key.match(/_(\d+)$/)?.[1] ?? 0);
  }

  get(name) {
    return this.animations.get(name);
  }
}

export const animationsManager = new AnimationsManager();
