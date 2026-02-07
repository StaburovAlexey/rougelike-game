import './style.css';
import * as THREE from 'three';
import { sceneManager } from './core/sceneManager.js';
import Controls from './core/orbitControls.js';
import Camera from './core/camera.js';
import HoverHightlight from './ui/hoverCellHightlight.js';
import RunManager from './runManager/runManager.js';
import GUI from 'lil-gui';
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
const runManager = new RunManager();
runManager.start();
const highLight = new HoverHightlight();
highLight.createMesh({ floor: runManager.floor, level: runManager.level });
sceneManager.add(highLight.hoverMarker);

function handlePointerMove(e) {
  if (!runManager.floor) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera.getCamera());

  const hit = raycaster.intersectObject(runManager.floor, false)[0];
  if (!hit) {
    highLight.setLastHoverId(null)
    if (highLight.hoverMarker) highLight.hoverMarker.visible = false;
    return;
  }

  const id = hit.instanceId;
  if (id !== highLight.getLastHoverId()) {
    highLight.setLastHoverId(id)
    if (highLight.hoverMarker) {
      const cell = runManager.level.idToGrid(id);
      const pos = runManager.level.gridToWorld(
        cell.col,
        cell.row,
        highLight.hoverHeightOffset,
      );
      highLight.hoverMarker.position.copy(pos);
      highLight.hoverMarker.visible = true;
    }
  }
}

function handlePointerDown(e) {
  if (!runManager.floor) return;

  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera.getCamera());

  const hit = raycaster.intersectObject(runManager.floor, false)[0];
  if (!hit) return;

  const cell = runManager.level.idToGrid(hit.instanceId);
  runManager.player.click(cell);
}

window.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);

const gui = new GUI();
gui
  .add(
    {
      rebuild: () => {
        runManager.next();
      },
    },
    'rebuild',
  )
  .name('Rebuild Level');

// buildLevel();
let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  controls.update();
  runManager.update(camera.getCamera());
  renderer.render(sceneManager.getScene(), camera.getCamera());

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
