import * as THREE from 'three';
import { sceneManager } from '../scene/scene';
import { Group } from 'three';
export default class DungeonLight {
  constructor() {
    this.scene = sceneManager.getScene();
    this.renderer = sceneManager.getRenderer();
    this.hemisphere = null;
    this.ambient = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.lightGroup = new Group();
    this.#init();
  }

  #createKeyLight() {
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(6, 10, 4);
    return keyLight;
  }

  #init() {
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = false;

    const fogColor = new THREE.Color(0x171717);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.Fog(fogColor, 12, 42);

    this.hemisphere = new THREE.HemisphereLight(0xf5f2ea, 0x1a1816, 0.38);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.04);
    this.keyLight = this.#createKeyLight();

    this.fillLight = new THREE.DirectionalLight(0xf2ede3, 0.3);
    this.fillLight.position.set(-8, 5, -6);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    this.rimLight.position.set(1, 4, -8);
    this.lightGroup.add(
      this.hemisphere,
      this.ambient,
      this.keyLight,
      this.fillLight,
      this.rimLight,
    );
    this.scene.add(this.lightGroup);
  }

  dispose() {
    if (!this.lightGroup) return;
    this.scene.remove(this.lightGroup);
    this.lightGroup.clear();
    this.hemisphere = null;
    this.ambient = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.lightGroup = null;
  }
}
