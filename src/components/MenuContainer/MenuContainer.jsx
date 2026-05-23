import "./MenuContainer.css";
import { useTranslation } from "react-i18next";
import { MenuList } from "./MenuList/MenuList";
import { MenuListItem } from "./MenuList/MenuListItem/MenuListItem";
const menuList = ["newGame", "continue", "settings", "exit"];
export function MenuContainer() {
  const { t } = useTranslation("common");
  function cliclItem(type) {
    console.log("click", type);
  }
  return (
    <div className="menu-container">
      <div className="menu-container__list">
        <MenuList>
          {menuList.map((item, index) => {
            return (
              <MenuListItem
                key={index}
                title={t(`menu.${item}`)}
                type={item}
                onClick={cliclItem}
              />
            );
          })}
        </MenuList>
      </div>
    </div>
  );
}
