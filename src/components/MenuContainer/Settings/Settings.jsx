import "./Settings.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FULLSCREEN_SETTINGS_EVENT,
  isFullscreenEnabled,
  setFullscreenEnabled,
} from "../../../settings/fullscreenSettings";

export function Settings({ children }) {
  const { t } = useTranslation("common");
  const [fullscreen, setFullscreen] = useState(isFullscreenEnabled);

  useEffect(() => {
    function syncFullscreen() {
      setFullscreen(isFullscreenEnabled());
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener(FULLSCREEN_SETTINGS_EVENT, syncFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener(FULLSCREEN_SETTINGS_EVENT, syncFullscreen);
    };
  }, []);

  async function handleFullscreenChange(event) {
    const enabled = await setFullscreenEnabled(event.target.checked);
    setFullscreen(enabled);
  }

  return (
    <div className="settings-container">
      <h1 className="settings-container__header">{t("menu.settings")}</h1>

      <div className="settings-container__body">
        <label className="settings-container__field">
          <span>{t("settings.fullscreen")}</span>
          <input
            checked={fullscreen}
            onChange={handleFullscreenChange}
            type="checkbox"
          />
        </label>
      </div>
      {children}
    </div>
  );
}
