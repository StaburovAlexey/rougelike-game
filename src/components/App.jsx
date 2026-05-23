import "./App.css";
import { Loader } from "./Loader/Loader";
import { setLanguage } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { createMenuScene } from "../game/menuScene";
import { MenuContainer } from "./MenuContainer/MenuContainer";

export function App() {
  const backgroundRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLanguage("ru");
  }, []);

  useEffect(() => {
    let menuScene = null;
    let cancelled = false;

    async function createScene() {
      menuScene = await createMenuScene(backgroundRef.current, {
        loading: (boolean) => {
          if (!cancelled) setLoading(boolean);
        },
      });

      if (cancelled) {
        menuScene.dispose();
      }
    }

    createScene();

    return () => {
      cancelled = true;
      menuScene?.dispose();
    };
  }, []);

  return (
    <>
      <div className="app-background" ref={backgroundRef} />
      <div className="app-content">{loading ? <Loader /> : <MenuContainer />}</div>
    </>
  );
}
