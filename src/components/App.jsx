import "./App.css";
import { Loader } from "./Loader/Loader";
import { setLanguage } from "../i18n";
import { useEffect, useState } from "react";
import { createGame } from "../game/main";
import { MenuContainer } from "./MenuContainer/MenuContainer";
export function App() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLanguage("ru");
  }, []);

  let game = null;
  async function сreate() {
    game = await createGame("app", {
      debug: true,
      loading: (boolean) => {
        setLoading(boolean);
      },
    });
  }
  useEffect(() => {
    сreate();
  }, []);
  return <>{loading ? <Loader /> : <MenuContainer />}</>;
}
