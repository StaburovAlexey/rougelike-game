import * as THREE from "three";
import gsap from "gsap";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import Camera from "./camera/camera";
import Controls from "./control/orbitControl";
import textureManager from "./core/textureManager";
import modelManager from "./core/modelManager";
import materialManager from "./core/materialManager";
import RunManager from "./runManager/runManager";
import { animationsManager } from "./core/animationManager";
import { initSceneManager } from "./scene/scene";

const CAMERA_MOVE_DISTANCE = 10;
const CAMERA_MOVE_HEIGHT = 4.5;
const CAMERA_TARGET_HEIGHT = 0.2;
const CAMERA_MIN_ZOOM = 0.5;
const CAMERA_MAX_ZOOM = 1;
const CAMERA_MOVE_DURATION = 0.7;

function normalizeAngleDelta(delta) {
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

export async function createGame(
  container = "canvas-container",
  options = { debug: true, loading, exit },
) {
  options.loading?.(true);
  await textureManager.loadAll();
  await modelManager.loadAll();
  materialManager.initAll();
  animationsManager.loadAll();
  await new Promise((res) => setTimeout(res, 3000));
  options.loading?.(false);
  let sceneManager = null;
  let camera = null;
  let control = null;
  let run = null;
  let gui = null;
  let stats = null;

  let animationFrameId = null;
  let last = performance.now();
  let started = false;
  let paused = false;
  let disposed = false;
  let resizeObserver = null;
  let cameraMoveTween = null;
  let cameraAngle = Math.atan2(1, 1);
  const loading = async (activateFunction = null) => {
    options.loading?.(true);
    await new Promise((res) => setTimeout(res, 1000));
    activateFunction?.();
    options.loading?.(false);
  };
  const resize = () => {
    if (!sceneManager || !camera || disposed) return;

    const size = sceneManager.resize();
    camera.resize(size);
  };
  const getCameraTarget = () => {
    const playerMesh = run?.player?.mesh;

    if (playerMesh) {
      return new THREE.Vector3(
        playerMesh.position.x,
        CAMERA_TARGET_HEIGHT,
        playerMesh.position.z,
      );
    }

    return control?.getTarget(new THREE.Vector3()) ?? new THREE.Vector3();
  };
  const applyCameraTransform = () => {
    if (!camera || !control || disposed) return;

    const target = getCameraTarget();
    const cameraObject = camera.getCamera();

    cameraObject.position.set(
      target.x + Math.sin(cameraAngle) * CAMERA_MOVE_DISTANCE,
      CAMERA_TARGET_HEIGHT + CAMERA_MOVE_HEIGHT,
      target.z + Math.cos(cameraAngle) * CAMERA_MOVE_DISTANCE,
    );
    cameraObject.lookAt(target);
    cameraObject.updateProjectionMatrix();
    control.setTarget(target.x, target.y, target.z);
  };
  const moveCameraToDirection = (direction, { immediate = false } = {}) => {
    if (!camera || !control || disposed) return;

    const endAngle = Math.atan2(direction.x, direction.z);
    const targetAngle = cameraAngle + normalizeAngleDelta(endAngle - cameraAngle);
    const angleState = { angle: cameraAngle };

    cameraMoveTween?.kill();

    if (immediate) {
      cameraAngle = endAngle;
      applyCameraTransform();
      return;
    }

    cameraMoveTween = gsap.to(angleState, {
      angle: targetAngle,
      duration: CAMERA_MOVE_DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        cameraAngle = angleState.angle;
        applyCameraTransform();
      },
      onComplete: () => {
        cameraAngle = endAngle;
        applyCameraTransform();
        cameraMoveTween = null;
      },
    });
  };
  const moveCameraNorth = () => {
    moveCameraToDirection(new THREE.Vector3(1, 0, 1));
  };
  const moveCameraSouth = () => {
    moveCameraToDirection(new THREE.Vector3(-1, 0, -1));
  };
  const moveCameraWest = () => {
    moveCameraToDirection(new THREE.Vector3(-1, 0, 1));
  };
  const moveCameraEast = () => {
    moveCameraToDirection(new THREE.Vector3(1, 0, -1));
  };
  const setCameraZoom = (zoom) => {
    if (!camera || disposed) return;

    const cameraObject = camera.getCamera();
    cameraObject.zoom = zoom;
    cameraObject.updateProjectionMatrix();
    control?.update();
  };

  const loop = (now) => {
    if (disposed || !sceneManager || !camera || !control || !run) return;

    animationFrameId = requestAnimationFrame(loop);

    if (paused) {
      last = now;
      stats?.update();
      sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());
      return;
    }

    const delta = (now - last) / 1000;
    last = now;

    applyCameraTransform();
    run.update(delta);
    stats?.update();
    applyCameraTransform();

    sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());
  };
  const start = () => {
    if (started || disposed) return;

    started = true;
    paused = false;

    sceneManager = initSceneManager(container);
    camera = new Camera(sceneManager.getSize(), {
      type: "orthographic",
      orthographicSize: 5,
    });
    resize();

    control = new Controls(
      camera.getCamera(),
      sceneManager.renderer.domElement,
    );
    moveCameraToDirection(new THREE.Vector3(1, 0, 1), { immediate: true });

    run = new RunManager({
      typeRun: "classic",
      classHero: "warrior",
      camera: camera.getCamera(),
      domElement: sceneManager.renderer.domElement,
      loader: loading,
    });

    if (options.debug) {
      gui = new GUI();

      const sceneLights = { enabled: false };

      gui
        .add(sceneLights, "enabled")
        .name("Scene lights")
        .onChange((value) => {
          if (run.aciveLevel?.light?.lightGroup) {
            run.aciveLevel.light.lightGroup.visible = value;
          }
        });

      const gameControls = {
        pause,
        resume,
        dispose,
        exit: () => {
          options.exit?.();
          dispose();
        },
        nextLevel: async () => {
          run.nextLevel();
          //options.loading?.(true);
          //await new Promise((res) => setTimeout(res, 1000));
          //run.nextLevel();
          //options.loading?.(false);
        },
        moveCameraNorth,
        moveCameraSouth,
        moveCameraWest,
        moveCameraEast,
      };
      const cameraControls = {
        zoom: camera.getCamera().zoom,
        moveCameraNorth,
        moveCameraSouth,
        moveCameraWest,
        moveCameraEast,
      };

      gui.add(gameControls, "pause").name("Pause");
      gui.add(gameControls, "resume").name("Resume");
      gui.add(gameControls, "dispose").name("Dispose");
      gui.add(gameControls, "exit").name("Exit");
      gui.add(gameControls, "nextLevel").name("Next level");

      const cameraFolder = gui.addFolder("Camera");
      cameraFolder
        .add(cameraControls, "zoom", CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM, 0.1)
        .name("Zoom")
        .onChange(setCameraZoom);
      cameraFolder.add(cameraControls, "moveCameraNorth").name("North");
      cameraFolder.add(cameraControls, "moveCameraSouth").name("South");
      cameraFolder.add(cameraControls, "moveCameraWest").name("West");
      cameraFolder.add(cameraControls, "moveCameraEast").name("East");

      stats = new Stats();
      stats.dom.style.position = "absolute";
      stats.dom.style.top = "0";
      stats.dom.style.left = "0";
      stats.dom.style.zIndex = "10";
      sceneManager.getContainer().appendChild(stats.dom);
    }

    last = performance.now();
    animationFrameId = requestAnimationFrame(loop);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(sceneManager.getContainer());
    } else {
      window.addEventListener("resize", resize);
    }
  };
  const pause = () => {
    if (disposed) return;
    paused = true;
    control?.setEnabled(false);
  };
  const resume = () => {
    if (disposed || !started) return;
    paused = false;
    control?.setEnabled(true);
    last = performance.now();
  };
  const dispose = () => {
    if (disposed) return;

    disposed = true;
    paused = true;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener("resize", resize);
    cameraMoveTween?.kill();
    cameraMoveTween = null;

    run?.aciveLevel?.clearLevel();

    control?.dispose?.();
    gui?.destroy?.();

    stats?.dom?.remove();

    sceneManager?.dispose();

    sceneManager = null;
    camera = null;
    control = null;
    run = null;
    gui = null;
    stats = null;
  };

  return {
    start,
    pause,
    resume,
    dispose,
    resize,
    moveCameraNorth,
    moveCameraSouth,
    moveCameraWest,
    moveCameraEast,
    get isPaused() {
      return paused;
    },
  };
}
