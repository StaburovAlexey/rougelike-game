import "./MenuContainer.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuList } from "./MenuList/MenuList";
import { createMenuScene } from "../../game/menuScene.js";
import { BackgroundRender } from "../BackgroundRender/BackgroundRender";
import { Settings } from "./Settings/Settings.jsx";
import { ButtonMenu } from "./ButtonMenu/ButtonMenu.jsx";
const menuList = ["newGame", "continue", "settings", "exit"];
export function MenuContainer({ children, setLoading }) {
  const backgroundRef = useRef(null);
  const { t } = useTranslation("common");
  const [activeItem, setActiveItem] = useState("main");

  useEffect(() => {
    let menuScene = null;
    let cancelled = false;

    async function createScene() {
      menuScene = await createMenuScene(backgroundRef.current, {
        loading: (boolean) => {
          if (!cancelled) setLoading(boolean);
        },
      });
      await new Promise((res) => setTimeout(res, 500));
      await menuScene.lowerCamera();

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
  function cliclItem(type) {
    console.log("click", type);
    setActiveItem(type);
    console.log("activeItem", activeItem);
  }
  return (
    <div className="menu-container">
      <BackgroundRender className="background-render" ref={backgroundRef} />
      <div className="menu-container__list">
        {activeItem === "main" && (
          <MenuList>
            {menuList.map((item, index) => {
              return (
                <ButtonMenu
                  key={index}
                  text={t(`menu.${item}`)}
                  onClick={() => cliclItem(item)}
                />
              );
            })}
          </MenuList>
        )}
        {activeItem === "settings" && (
          <Settings>
            <ButtonMenu onClick={() => setActiveItem("main")} text="Назад" />
          </Settings>
        )}
      </div>
    </div>
  );
}
