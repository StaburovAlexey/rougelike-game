import './style.css';
import { sceneManager } from './scene/scene';
import Camera from './camera/camera';
import LevelManager from './levelManager/levelManager';
import Controls from './control/orbitControl';
const camera = new Camera(sceneManager.getSize());
const control = new Controls(
  camera.getCamera(),
  sceneManager.renderer.domElement,
);
const levelManager = new LevelManager(10, 10);
let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  control.update();
  sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
