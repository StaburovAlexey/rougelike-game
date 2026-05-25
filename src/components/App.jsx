import "./App.css";
import { Loader } from "./Loader/Loader";
import { useEffect, useRef, useState } from "react";

import { MenuContainer } from "./MenuContainer/MenuContainer";
import { GameContainer } from "./GameContainer/GameContainer";

const LOADER_TRANSITION_DURATION = 600;

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function App() {
  const [loading, setLoading] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [window, setWindow] = useState("main-menu");
  const transitionInProgressRef = useRef(false);

  useEffect(() => {
    if (loading) {
      setLoaderVisible(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      setLoaderVisible(false);
    }, 600);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);

  async function transitionTo(nextWindow) {
    if (transitionInProgressRef.current) {
      return;
    }

    transitionInProgressRef.current = true;
    setLoading(true);

    await wait(LOADER_TRANSITION_DURATION);

    setWindow(nextWindow);
    transitionInProgressRef.current = false;
  }

  return (
    <>
      <div className="app-content">
        {loaderVisible && <Loader active={loading} />}
        {window === "main-menu" && (
          <MenuContainer setLoading={setLoading} transitionTo={transitionTo} />
        )}
        {window === "game" && (
          <GameContainer setLoading={setLoading} transitionTo={transitionTo} />
        )}
      </div>
    </>
  );
}
