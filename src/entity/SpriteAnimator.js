export default class SpriteAnimator {
  constructor(material, animations = {}, options = {}) {
    this.material = material;
    this.animations = animations;
    this.defaultAnimation = options.defaultAnimation ?? 'idle';
    this.fps = options.fps ?? 8;
    this.current = this.defaultAnimation;
    this.frame = 0;
    this.elapsed = 0;
    this.loop = true;
    this.afterOnce = null;

    this.#applyFrame();
  }

  play(name, options = {}) {
    const frames = this.animations[name];
    if (!frames?.length) return false;

    if (this.current === name && !options.restart) return true;

    this.current = name;
    this.frame = 0;
    this.elapsed = 0;
    this.loop = options.loop ?? true;
    this.afterOnce = options.afterOnce ?? null;
    this.#applyFrame();
    return true;
  }

  playOnce(name, afterOnce = this.defaultAnimation) {
    return this.play(name, {
      restart: true,
      loop: false,
      afterOnce,
    });
  }

  update(delta) {
    const frames = this.animations[this.current];
    if (!frames?.length) return;

    this.elapsed += delta;
    const frameDuration = 1 / this.fps;

    if (frames.length === 1) {
      if (!this.loop && this.elapsed >= frameDuration) {
        const nextAnimation = this.afterOnce;
        this.afterOnce = null;
        if (nextAnimation) this.play(nextAnimation, { restart: true });
      }
      return;
    }

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;

      if (this.frame < frames.length - 1) {
        this.frame += 1;
        this.#applyFrame();
        continue;
      }

      if (this.loop) {
        this.frame = 0;
        this.#applyFrame();
        continue;
      }

      const nextAnimation = this.afterOnce;
      this.afterOnce = null;
      if (nextAnimation) this.play(nextAnimation, { restart: true });
      return;
    }
  }

  #applyFrame() {
    const frameTexture = this.animations[this.current]?.[this.frame];
    if (!frameTexture) return;

    this.material.map = frameTexture;
    this.material.needsUpdate = true;
  }
}
