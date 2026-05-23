import * as THREE from "three";
import Camera from "./camera/camera";
import materialManager from "./core/materialManager";
import modelManager from "./core/modelManager";
import textureManager from "./core/textureManager";
import { animationsManager } from "./core/animationManager";
import Grid from "./grid/grid";
import DungeonLight from "./light/dungeonLight";
import StaticInstancedRenderer from "./StaticInstancedRenderer/StaticInstancedRenderer";
import { initSceneManager } from "./scene/scene";

function prepareMenuGrid() {
  const cols = 12;
  const rows = 8;
  const step = 1.1;
  const grid = new Grid(cols, rows, {
    halfW: ((cols - 1) * step) / 2,
    halfH: ((rows - 1) * step) / 2,
    doorsCount: 1,
    torchesChance: 1,
    torchesCount: 6,
    enemiesCount: 0,
    lootGroundCount: 0,
    indexLevel: 0,
    player: {
      chanceDoors: {},
    },
  });

  for (const cell of grid.cells) {
    cell.visible =
      cell.type === "floor" ||
      cell.type === "wall" ||
      cell.type === "door" ||
      cell.type === "torch";
    cell.expand = false;
  }

  return grid;
}

function configureMenuObstacles(grid) {
  const placements = [
    { col: 7, row: 3, variantName: "bonfire", rotation: Math.PI * 0.15 },
    { col: 4, row: 3, variantName: "column", rotation: Math.PI * 0.1 },
    { col: 8, row: 2, variantName: "column002", rotation: Math.PI * 0.1 },
    { col: 2, row: 5, variantName: "rock", rotation: Math.PI * 0.45 },
    { col: 5, row: 4, variantName: "rock002", rotation: Math.PI * 0.3 },
    { col: 3, row: 5, variantName: "rock001", rotation: Math.PI * 0.9 },
    { col: 7, row: 5, variantName: "helmes", rotation: Math.PI * 1.25 },
  ];
  const variantNamesByCell = {};
  const rotations = [];
  const obstacleCells = [];

  for (const cell of grid.cells) {
    if (cell.type !== "obstacle") continue;

    cell.type = "floor";
    cell.blocked = false;
    cell.visible = true;
    cell.expand = false;
  }

  for (const placement of placements) {
    const cell = grid.get(placement.col, placement.row);
    if (!cell) continue;

    cell.type = "obstacle";
    cell.blocked = true;
    cell.visible = true;
    cell.expand = false;
    obstacleCells.push(cell);
    variantNamesByCell[cell.id] = placement.variantName;
    rotations.push(placement.rotation);
  }

  grid.obstacleCells = obstacleCells;

  return {
    obstacleCells,
    obstacleVariantNamesByCell: variantNamesByCell,
    obstacleRotationByCell: rotations,
  };
}

export async function createMenuScene(container, options = {}) {
  options.loading?.(true);

  await textureManager.loadAll();
  await modelManager.loadAll();
  materialManager.initAll();
  materialManager.setPrefixLevel(1);
  animationsManager.loadAll();

  const sceneManager = initSceneManager(container);
  const camera = new Camera(sceneManager.getSize());
  const cameraObject = camera.getCamera();

  const light = new DungeonLight();
  light.lightGroup.visible = false;

  let renderer = null;
  let grid = null;
  let obstacleCells = null;

  grid = prepareMenuGrid();
  const obstacleOptions = configureMenuObstacles(grid);
  obstacleCells = obstacleOptions.obstacleCells;
  renderer = new StaticInstancedRenderer(grid, obstacleOptions);

  renderer?.updateVisible(obstacleCells);

  const focusCell = grid.get(7, 4);
  const target = new THREE.Vector3(
    focusCell?.worldX ?? 0,
    0.75,
    focusCell?.worldZ ?? 0,
  );
  const roomCenter = new THREE.Vector3(0, 0, 0);
  const bonfireDirection = new THREE.Vector3(
    target.x - roomCenter.x,
    0,
    target.z - roomCenter.z,
  );
  if (bonfireDirection.lengthSq() < 0.001) {
    bonfireDirection.set(0, 0, 1);
  }
  bonfireDirection.normalize();

  const cameraDistance = 2.5
  ;
  cameraObject.position.set(
    target.x + bonfireDirection.x * cameraDistance,
    1.1,
    target.z + bonfireDirection.z * cameraDistance,
  );
  cameraObject.lookAt(target);

  let animationFrameId = null;
  let resizeObserver = null;
  let disposed = false;
  let last = performance.now();

  const resize = () => {
    if (disposed) return;
    camera.resize(sceneManager.resize());
  };

  const loop = (now) => {
    if (disposed) return;

    const delta = (now - last) / 1000;
    last = now;

    renderer?.update(delta, cameraObject);
    sceneManager.renderer.render(sceneManager.getScene(), cameraObject);

    animationFrameId = requestAnimationFrame(loop);
  };

  resize();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(sceneManager.getContainer());
  } else {
    window.addEventListener("resize", resize);
  }

  sceneManager.renderer.render(sceneManager.getScene(), cameraObject);
  animationFrameId = requestAnimationFrame(loop);

  options.loading?.(false);

  return {
    dispose() {
      if (disposed) return;

      disposed = true;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);

      renderer?.dispose();
      light.dispose();
      sceneManager.dispose();

      renderer = null;
      grid = null;
      obstacleCells = [];
    },
  };
}
