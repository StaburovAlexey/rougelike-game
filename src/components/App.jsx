import "./App.css";
import { Loader } from "./Loader/Loader";
import { useCallback, useEffect, useRef, useState } from "react";

import { MenuContainer } from "./MenuContainer/MenuContainer";
import { AppViewport } from "./AppViewport/AppViewport";
import { BackgroundLayer } from "./BackgroundLayer/BackgroundLayer";

const LOADER_TRANSITION_DURATION = 600;

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function App() {
  const [loading, setLoading] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [window, setWindow] = useState("main-menu");
  const [backgroundReady, setBackgroundReady] = useState(false);
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

  const transitionTo = useCallback(async (nextWindow) => {
    if (transitionInProgressRef.current) {
      return;
    }

    transitionInProgressRef.current = true;
    setLoading(true);

    await wait(LOADER_TRANSITION_DURATION);

    setWindow(nextWindow);
    transitionInProgressRef.current = false;
  }, []);

  return (
    <div className="app">
      <BackgroundLayer
        onReady={setBackgroundReady}
        screen={window}
        setLoading={setLoading}
        transitionTo={transitionTo}
      />

      <AppViewport>
        {window === "main-menu" && (
          <MenuContainer
            active={backgroundReady}
            transitionTo={transitionTo}
          />
        )}
      </AppViewport>

      {loaderVisible && <Loader active={loading} />}
    </div>
  );
}
