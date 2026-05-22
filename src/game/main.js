import * as THREE from "three";
import "./style.css";
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

export async function createGame(container = "canvas-container", options = {}) {
  const sceneManager = initSceneManager(container);
  await textureManager.loadAll();
  await modelManager.loadAll();
  materialManager.initAll();
  animationsManager.loadAll();
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

  const resize = () => {
    if (!camera || disposed) return;

    const size = sceneManager.resize();
    camera.resize(size);
  };

  const loop = (now) => {
    if (disposed) return;

    animationFrameId = requestAnimationFrame(loop);

    if (paused) {
      last = now;
      stats?.update();
      sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());
      return;
    }

    const delta = (now - last) / 1000;
    last = now;

    const playerMesh = run.player?.mesh;

    if (playerMesh) {
      const oldTarget = control.getTarget(new THREE.Vector3());
      const newX = playerMesh.position.x;
      const newY = playerMesh.position.y;
      const newZ = playerMesh.position.z;

      const cam = camera.getCamera();
      cam.position.x += newX - oldTarget.x;
      cam.position.y += newY - oldTarget.y;
      cam.position.z += newZ - oldTarget.z;

      control.setTarget(newX, newY, newZ);
    }

    control.update();
    run.update(delta);
    stats?.update();

    sceneManager.renderer.render(sceneManager.getScene(), camera.getCamera());
  };
  const start = () => {
    if (started || disposed) return;

    started = true;
    paused = false;

    camera = new Camera(sceneManager.getSize());
    resize();

    control = new Controls(
      camera.getCamera(),
      sceneManager.renderer.domElement,
    );

    run = new RunManager({
      typeRun: "classic",
      classHero: "warrior",
      camera: camera.getCamera(),
      domElement: sceneManager.renderer.domElement,
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
        nextLevel: () => run.nextLevel(),
      };

      gui.add(gameControls, "pause").name("Pause");
      gui.add(gameControls, "resume").name("Resume");
      gui.add(gameControls, "dispose").name("Dispose");
      gui.add(gameControls, "nextLevel").name("Next level");

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

    run?.aciveLevel?.clearLevel();

    control?.dispose?.();
    gui?.destroy?.();

    stats?.dom?.remove();

    sceneManager.dispose();

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
    get isPaused() {
      return paused;
    },
  };
}
