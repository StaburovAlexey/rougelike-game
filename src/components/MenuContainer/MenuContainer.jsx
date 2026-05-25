import "./MenuContainer.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { MenuList } from "./MenuList/MenuList";
import { createMenuScene } from "../../game/menuScene.js";
import { BackgroundRender } from "../BackgroundRender/BackgroundRender";
import { Settings } from "./Settings/Settings.jsx";
import { ButtonMenu } from "./ButtonMenu/ButtonMenu.jsx";
const menuList = ["newGame", "continue", "settings", "exit"];
export function MenuContainer({ children, setLoading, setWindow }) {
  const backgroundRef = useRef(null);
  const menuListRef = useRef(null);
  const { t } = useTranslation("common");
  const [activeItem, setActiveItem] = useState("main");

  useEffect(() => {
    let menuScene = null;
    let menuListTween = null;
    let cancelled = false;

    async function createScene() {
      menuScene = await createMenuScene(backgroundRef.current, {
        loading: (boolean) => {
          if (!cancelled) setLoading(boolean);
        },
      });

      if (cancelled) {
        menuScene.dispose();
        return;
      }

      if (menuListRef.current) {
        menuListTween = gsap.fromTo(
          menuListRef.current,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 1, ease: "power1.out" },
        );

        await menuListTween.then();
      }

      if (cancelled) {
        menuScene.dispose();
        return;
      }

      await menuScene.fadeInScene();

      if (cancelled) {
        menuScene.dispose();
        return;
      }

    }

    createScene();

    return () => {
      cancelled = true;
      menuListTween?.kill();
      menuScene?.dispose();
    };
  }, []);
  function cliclItem(type) {
    if (type === "newGame") {
      setWindow("game");
    } else {
      setActiveItem(type);
    }
  }
  return (
    <div className="menu-container">
      <BackgroundRender className="background-render" ref={backgroundRef} />
      <div className="menu-container__list">
        {activeItem === "main" && (
          <MenuList ref={menuListRef}>
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
            <ButtonMenu
              onClick={() => setActiveItem("main")}
              text={t("menu.back")}
            />
          </Settings>
        )}
      </div>
    </div>
  );
}
