import './style.css';
import * as THREE from 'three';
import { sceneManager } from './core/sceneManager.js';
import Controls from './core/orbitControls.js';
import Camera from './core/camera.js';
import CreateLevel from './levels/createLevel.js';
const container = document.getElementById('canvas-container');
const light = new THREE.AmbientLight(0x404040); // soft white light
sceneManager.add(light);
let size = {
  width: container.clientWidth,
  height: container.clientHeight,
};
const renderer = new THREE.WebGLRenderer();
renderer.setSize(size.width, size.height);
container.appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const camera = new Camera(size);
const controls = new Controls(camera.getCamera(), renderer.domElement);
const level = new CreateLevel();
console.log('Level created:', level.getLevel());
sceneManager.add(level.getLevel());
window.addEventListener('pointerdown', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera.getCamera());

  const hit = raycaster.intersectObject(level.floor, false)[0];
  if (!hit) return;
  const cell = level.idToGrid(hit.instanceId);
  console.log(cell.content);
});

let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  controls.update();
  renderer.render(sceneManager.getScene(), camera.getCamera());

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
