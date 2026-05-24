import "./App.css";
import { Loader } from "./Loader/Loader";
import { setLanguage } from "../i18n";
import { useEffect, useRef, useState } from "react";

import { MenuContainer } from "./MenuContainer/MenuContainer";

export function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLanguage("ru");
  }, []);

  return (
    <>
      <div className="app-content">
        {loading && <Loader />}
        <MenuContainer setLoading={setLoading}></MenuContainer>
      </div>
    </>
  );
}
