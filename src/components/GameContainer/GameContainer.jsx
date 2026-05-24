import { BackgroundRender } from "../BackgroundRender/BackgroundRender";
import "./GameContainer.css";
import { useEffect, useRef, useState } from "react";
import { createGame } from "../../game/main.js";
export function GameContainer({ setLoading, setWindow }) {
  const gameRef = useRef(null);
  useEffect(() => {
    let game = null;
    let cancelled = false;

    async function createScene() {
      game = await createGame(gameRef.current, {
        loading: (boolean) => {
          if (!cancelled) setLoading(boolean);
        },
        exit: () => {
          setLoading(true);
          setWindow("main-menu");
        },
        debug: true,
      });

      if (cancelled) {
        game.dispose();
        return;
      }

      game.start();
    }

    createScene();

    return () => {
      cancelled = true;
      game?.dispose();
    };
  }, []);
  return (
    <div className="game-container">
      <BackgroundRender className="game-render" ref={gameRef} />
    </div>
  );
}
