export default class SpriteAnimator {
  constructor(material, animations = {}, options = {}) {
    this.material = material;
    this.animations = animations;
    this.defaultAnimation = options.defaultAnimation ?? "idle";
    this.fps = options.fps ?? 8;
    this.fpsByAnimation = options.fpsByAnimation ?? {};
    this.current = this.defaultAnimation;
    this.frame = 0;
    this.elapsed = 0;
    this.loop = true;
    this.afterOnce = null;
    this.onComplete = null;
    this.onFrame = null;

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
    this.onComplete = options.onComplete ?? null;
    this.onFrame = options.onFrame ?? null;
    this.#applyFrame();
    this.onFrame?.(this.frame);
    return true;
  }

  playOnce(name, options = {}) {
    const afterOnce =
      typeof options === "string"
        ? options
        : options.afterOnce ?? this.defaultAnimation;
    const onFrame = typeof options === "string" ? null : options.onFrame;

    return new Promise((resolve) => {
      const started = this.play(name, {
        restart: true,
        loop: false,
        afterOnce,
        onFrame,
        onComplete: () => resolve(true),
      });
      if (!started) resolve(false);
    });
  }

  update(delta) {
    const frames = this.animations[this.current];
    if (!frames?.length) return;

    this.elapsed += delta;
    const fps = this.fpsByAnimation[this.current] ?? this.fps;
    const frameDuration = 1 / fps;

    if (frames.length === 1) {
      if (!this.loop && this.elapsed >= frameDuration) {
        const nextAnimation = this.afterOnce;
        const onComplete = this.onComplete;
        this.afterOnce = null;
        this.onComplete = null;
        this.onFrame = null;
        onComplete?.();
        if (nextAnimation) this.play(nextAnimation, { restart: true });
      }
      return;
    }

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;

      if (this.frame < frames.length - 1) {
        this.frame += 1;
        this.#applyFrame();
        this.onFrame?.(this.frame);
        continue;
      }

      if (this.loop) {
        this.frame = 0;
        this.#applyFrame();
        this.onFrame?.(this.frame);
        continue;
      }

      const nextAnimation = this.afterOnce;
      const onComplete = this.onComplete;
      this.afterOnce = null;
      this.onComplete = null;
      this.onFrame = null;
      onComplete?.();
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
