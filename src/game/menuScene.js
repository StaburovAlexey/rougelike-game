import * as THREE from "three";
import gsap from "gsap";
import Camera from "./camera/camera";
import materialManager from "./core/materialManager";
import modelManager from "./core/modelManager";
import textureManager from "./core/textureManager";
import { animationsManager } from "./core/animationManager";
import Grid from "./grid/grid";
import DungeonLight from "./light/dungeonLight";
import StaticInstancedRenderer from "./StaticInstancedRenderer/StaticInstancedRenderer";
import { initSceneManager } from "./scene/scene";

const CAMERA_LOW_Y = 1.2;
const CAMERA_HIGH_Y = 1.2;
const CAMERA_TARGET_LOW_Y = 0.75;
const CAMERA_TARGET_HIGH_Y = 0.75;
const CAMERA_MOVE_DURATION = 2500;
const SCENE_FADE_DURATION = 4500;

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
  await new Promise((res) => setTimeout(res, 3000));
  options.loading?.(false);
  const sceneManager = initSceneManager(container);
  const sceneContainer = sceneManager.getContainer();
  gsap.set(sceneContainer, { autoAlpha: 0 });
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
    CAMERA_TARGET_HIGH_Y,
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

  const cameraDistance = 2.5;
  const cameraPosition = new THREE.Vector3(
    target.x + bonfireDirection.x * cameraDistance,
    CAMERA_HIGH_Y,
    target.z + bonfireDirection.z * cameraDistance,
  );
  cameraObject.position.copy(cameraPosition);
  cameraObject.lookAt(target);

  let animationFrameId = null;
  let resizeObserver = null;
  let disposed = false;
  let last = performance.now();
  let cameraTween = null;
  let sceneFadeTween = null;

  const startCameraTween = (
    toPosition,
    toTarget,
    duration = CAMERA_MOVE_DURATION,
    ease = "none",
  ) =>
    new Promise((resolve) => {
      cameraTween?.kill();

      const tweenState = {
        cameraX: cameraObject.position.x,
        cameraY: cameraObject.position.y,
        cameraZ: cameraObject.position.z,
        targetX: target.x,
        targetY: target.y,
        targetZ: target.z,
      };

      cameraTween = gsap.to(tweenState, {
        cameraX: toPosition.x,
        cameraY: toPosition.y,
        cameraZ: toPosition.z,
        targetX: toTarget.x,
        targetY: toTarget.y,
        targetZ: toTarget.z,
        duration: duration / 1000,
        ease,
        onUpdate() {
          cameraObject.position.set(
            tweenState.cameraX,
            tweenState.cameraY,
            tweenState.cameraZ,
          );
          target.set(
            tweenState.targetX,
            tweenState.targetY,
            tweenState.targetZ,
          );
          cameraObject.lookAt(target);
        },
        onComplete() {
          cameraTween = null;
          resolve();
        },
      });
    });

  const moveCameraHeight = (cameraHeight, targetHeight, duration, ease) => {
    const toPosition = cameraObject.position.clone();
    toPosition.y = cameraHeight;
    const toTarget = target.clone();
    toTarget.y = targetHeight;
    return startCameraTween(toPosition, toTarget, duration, ease);
  };

  const getCameraPositionForTarget = (nextTarget) => {
    const direction = new THREE.Vector3(
      nextTarget.x - roomCenter.x,
      0,
      nextTarget.z - roomCenter.z,
    );

    if (direction.lengthSq() < 0.001) {
      direction.copy(bonfireDirection);
    }

    direction.normalize();

    return new THREE.Vector3(
      nextTarget.x + direction.x * cameraDistance,
      cameraObject.position.y,
      nextTarget.z + direction.z * cameraDistance,
    );
  };

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

  return {
    fadeInScene(duration = SCENE_FADE_DURATION) {
      sceneFadeTween?.kill();
      sceneFadeTween = gsap.to(sceneContainer, {
        autoAlpha: 1,
        duration: duration / 1000,
        ease: "power1.out",
      });

      return sceneFadeTween.then();
    },
    lowerCamera(duration = CAMERA_MOVE_DURATION) {
      return moveCameraHeight(
        CAMERA_LOW_Y,
        CAMERA_TARGET_LOW_Y,
        duration,
        "power1.out",
      );
    },
    raiseCamera(duration = CAMERA_MOVE_DURATION) {
      return moveCameraHeight(
        CAMERA_HIGH_Y,
        CAMERA_TARGET_HIGH_Y,
        duration,
        "power1.out",
      );
    },
    moveCameraToCell(col, row, duration = CAMERA_MOVE_DURATION) {
      const cell = grid?.get(col, row);
      if (!cell) return Promise.resolve();

      const nextTarget = new THREE.Vector3(cell.worldX, 0.75, cell.worldZ);
      return startCameraTween(
        getCameraPositionForTarget(nextTarget),
        nextTarget,
        duration,
        "power1.out",
      );
    },
    dispose() {
      if (disposed) return;

      disposed = true;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      cameraTween?.kill();
      cameraTween = null;
      sceneFadeTween?.kill();
      sceneFadeTween = null;

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
