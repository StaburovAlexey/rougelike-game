import { BackgroundRender } from "../BackgroundRender/BackgroundRender";
import "./GameContainer.css";
import { useEffect, useRef, useState } from "react";
import { createGame } from "../../game/main.js";
export function GameContainer({ setLoading }) {
  const gameRef = useRef(null);
  useEffect(() => {
    let game = null;

    async function createScene() {
      game = await createGame(gameRef.current, {
        loading: (boolean) => {
          setLoading(boolean);
        },
      });
    }

    createScene().then((res) => {
      game.start?.();
    });

    return () => {
      game?.dispose();
    };
  }, []);
  return (
    <div className="game-container">
      <BackgroundRender className="game-render" ref={gameRef} />
    </div>
  );
}
