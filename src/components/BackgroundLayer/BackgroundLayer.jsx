import { useEffect, useRef } from "react";
import { BackgroundRender } from "../BackgroundRender/BackgroundRender";
import { createGame } from "../../game/main";
import { createMenuScene } from "../../game/menuScene";
import "./BackgroundLayer.css";

export function BackgroundLayer({ onReady, screen, setLoading, transitionTo }) {
  const backgroundRef = useRef(null);

  useEffect(() => {
    let scene = null;
    let cancelled = false;

    onReady(false);

    async function createScene() {
    
      if (screen === "main-menu") {
        scene = await createMenuScene(backgroundRef.current, {
          loading: (value) => {
            if (!cancelled) setLoading(value);
          },
        });

        if (cancelled) {
          scene.dispose();
          return;
        }

        await scene.fadeInScene();
        if (!cancelled) onReady(true);
        return;
      }

      if (screen === "game") {
        scene = await createGame(backgroundRef.current, {
          loading: (value) => {
            if (!cancelled) setLoading(value);
          },
          exit: () => {
            transitionTo("main-menu");
          },
          debug: true,
        });

        if (cancelled) {
          scene.dispose();
          return;
        }

        scene.start();
        onReady(true);
      }
    }

    createScene();

    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, [onReady, screen, setLoading, transitionTo]);

  return <BackgroundRender className="background-layer" ref={backgroundRef} />;
}
