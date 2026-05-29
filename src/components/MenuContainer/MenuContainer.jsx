import "./MenuContainer.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { MenuList } from "./MenuList/MenuList";
import { FrameContainer } from "../FrameContainer/FrameContainer.jsx";
import { Settings } from "./Settings/Settings.jsx";
import { ButtonMenu } from "./ButtonMenu/ButtonMenu.jsx";
import { RunSettings } from "../RunSettings/RunSettings.jsx";
const menuList = ["newGame", "continue", "settings", "exit"];
export function MenuContainer({ active, children, transitionTo }) {
  const frameContainerRef = useRef(null);
  const { t } = useTranslation("common");
  const [activeItem, setActiveItem] = useState("main");

  useEffect(() => {
    let frameContainerTween = null;

    if (active && frameContainerRef.current) {
      frameContainerTween = gsap.fromTo(
        frameContainerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1, ease: "power1.out" },
      );
    }

    return () => {
      frameContainerTween?.kill();
    };
  }, [active]);
  function cliclItem(type) {
    // if (type === "newGame") {
    //   transitionTo("run-settings");
    // } else {
    setActiveItem(type);
    // }
  }
  return (
    <div className="menu-container">
      <FrameContainer className="menu-container__list" ref={frameContainerRef}>
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
            <ButtonMenu
              onClick={() => setActiveItem("main")}
              text={t("menu.back")}
            />
          </Settings>
        )}
        {activeItem === "newGame" && <RunSettings>кнопки</RunSettings>}
      </FrameContainer>
    </div>
  );
}
