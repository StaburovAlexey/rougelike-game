import "./style.css";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { sceneManager } from "./scene/scene";
import Camera from "./camera/camera";
import Controls from "./control/orbitControl";
import textureManager from "./core/textureManager";
import modelManager from "./core/modelManager";
import materialManager from "./core/materialManager";
import RunManager from "./runManager/runManager";
import { animationsManager } from "./core/animationManager";
await textureManager.loadAll();
await modelManager.loadAll();
materialManager.initAll();
animationsManager.loadAll();
console.log(sceneManager.renderer.info);
const camera = new Camera(sceneManager.getSize());
const control = new Controls(
  camera.getCamera(),
  sceneManager.renderer.domElement,
);
const run = new RunManager({
  typeRun: "classic",
  camera: camera.getCamera(),
  domElement: sceneManager.renderer.domElement,
});
const gui = new GUI();
const runControls = {
  nextLevel: () => {
    console.log(sceneManager.renderer.info);
    return run.nextLevel();
  },
};
gui.add(runControls, "nextLevel").name("Next level");
const stats = new Stats();
stats.dom.style.position = "absolute";
stats.dom.style.top = "0";
stats.dom.style.left = "0";
stats.dom.style.zIndex = "10";
sceneManager.getContainer().appendChild(stats.dom);

let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  control.update();
  run.update(delta);
  stats.update();
  sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
