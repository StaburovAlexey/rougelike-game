import './style.css';
import * as THREE from 'three';
import { sceneManager } from './core/sceneManager.js';
import Controls from './core/orbitControls.js';
import Camera from './core/camera.js';
// import CreateLevel from './levels/createLevel.js';
// import Player from "./player/player.js";
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



let lastHoverId = null;
let hoverMarker = null;
let hoverHeightOffset = 0.02;
const runManager = new RunManager();
runManager.start();




// function buildLevel() {
//   if (level) {
//     sceneManager.remove(level.getLevel());
//   }
//   level = new CreateLevel();
//   sceneManager.add(level.getLevel());

//   floor = level.state.floor.instanced;
//   lastHoverId = null;

//   const spawn = level.getSpawnCell();
//   if (!player) {
//     player = new Player({ level, start: spawn });
//     sceneManager.add(player.getObject3D());
//   } else {
//     player.level = level;
//     player.col = spawn.col;
//     player.row = spawn.row;
//     player.updateWorldPosition();
//   }

//   if (hoverMarker) {
//     sceneManager.remove(hoverMarker);
//   }
//   const floorHeight = floor?.geometry?.parameters?.height ?? 0.1;
//   hoverHeightOffset = floorHeight / 2 + 0.01;
//   const markerSize = (level.cellSize || 1) * 0.9;
//   const markerGeo = new THREE.PlaneGeometry(markerSize, markerSize);
//   const markerMat = new THREE.MeshBasicMaterial({
//     color: "#1e571e",
//     transparent: true,
//     opacity: 0.35,
//     depthTest: false,
//   });
//   hoverMarker = new THREE.Mesh(markerGeo, markerMat);
//   hoverMarker.rotation.x = -Math.PI / 2;
//   hoverMarker.renderOrder = 10;
//   hoverMarker.visible = false;
//   sceneManager.add(hoverMarker);
// }

function handlePointerMove(e) {
  if (!runManager.floor) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera.getCamera());

  const hit = raycaster.intersectObject(runManager.floor, false)[0];
  if (!hit) {
    lastHoverId = null;
    if (hoverMarker) hoverMarker.visible = false;
    return;
  }

  const id = hit.instanceId;
  if (id !== lastHoverId) {
    lastHoverId = id;
    if (hoverMarker) {
      const cell = runManager.level.idToGrid(id);
      const pos = runManager.level.gridToWorld(cell.col, cell.row, hoverHeightOffset);
      hoverMarker.position.copy(pos);
      hoverMarker.visible = true;
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
  console.log('click', cell);
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
  renderer.render(sceneManager.getScene(), camera.getCamera());

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
