import "./App.css";
import { Loader } from "./Loader/Loader";
import { setLanguage } from "../i18n";
import { useEffect, useRef, useState } from "react";

import { MenuContainer } from "./MenuContainer/MenuContainer";
import { GameContainer } from "./GameContainer/GameContainer";

export function App() {
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState("main-menu");
  useEffect(() => {
    setLanguage("ru");
  }, []);

  return (
    <>
      <div className="app-content">
        {loading && <Loader />}
        {window === "main-menu" && (
          <MenuContainer setLoading={setLoading} setWindow={setWindow} />
        )}
        {window === "game" && <GameContainer setLoading={setLoading}/>}
      </div>
    </>
  );
}
