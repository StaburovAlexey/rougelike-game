import { SpriteMaterial, Sprite } from 'three';
import { textureManager } from '../core/textureManager';
export default class MashEntity {
  constructor() {
    this.size = 1;
    this.height = 1.4;
    this.material = new SpriteMaterial({
      color,
      transparent: true,
      alphaTest: 0.05,
    });
    this.mesh = new Sprite(this.material);
    this.mesh.scale.set(this.size, this.height, 1);
    const texture = textureManager.get('player');
    this.mesh.material.map = texture;
    this.mesh.material.color.setHex(0xffffff);
    this.mesh.material.needsUpdate = true;
  }
}
