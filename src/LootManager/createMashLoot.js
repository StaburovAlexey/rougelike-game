import { SpriteMaterial, Sprite, SRGBColorSpace } from 'three';
import { textureManager } from '../core/textureManager';
export default class MashLoot {
  constructor(typeTexture) {
    this.size = 1.2;
    this.height = 1.5;
    const texture = textureManager.get(typeTexture);
    texture.colorSpace = SRGBColorSpace;
    this.material = new SpriteMaterial({
      map: texture,
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
      alphaTest: 0.05,
    });
    this.mesh = new Sprite(this.material);
    this.mesh.scale.set(this.size, this.height, 1);
  }
}