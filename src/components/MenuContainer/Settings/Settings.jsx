import "./Settings.css";
import { useTranslation } from "react-i18next";
export function Settings({ children }) {
  const { t } = useTranslation("common");
  return (
    <div className="settings-container">
      <h1 className="settings-container__header">{t("menu.settings")}</h1>
      <div className="settings-containert__body">
        
      </div>
      {children}
    </div>
  );
}
