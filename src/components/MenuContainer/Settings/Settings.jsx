import "./Settings.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FULLSCREEN_SETTINGS_EVENT,
  isFullscreenEnabled,
  setFullscreenEnabled,
} from "../../../settings/fullscreenSettings";
import { getAvailableLanguages, setLanguage } from "../../../i18n";

export function Settings({ children }) {
  const { i18n, t } = useTranslation("common");
  const [fullscreen, setFullscreen] = useState(isFullscreenEnabled);
  const languages = getAvailableLanguages();

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
  function switchLanguage(step) {
    const currentIndex = languages.indexOf(i18n.language);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex =
      (safeIndex + step + languages.length) % languages.length;

    setLanguage(languages[nextIndex]);
  }

  return (
    <div className="settings-container">
      <h1 className="settings-container__header">{t("menu.settings")}</h1>
      <div className="settings-container__body">
        <label className="settings-container__field">
          <span className="settings-container__field-label">
            {t("settings.fullscreen")}
          </span>
          <span className="settings-container__field-control">
            <input
              checked={fullscreen}
              onChange={handleFullscreenChange}
              type="checkbox"
            />
          </span>
        </label>
        <div className="settings-container__field">
          <span className="settings-container__field-label">
            {t("settings.language")}
          </span>
          <span className="settings-container__field-control">
            <div className="settings-container__language-switcher">
              <button
                aria-label="Previous language"
                onClick={() => switchLanguage(-1)}
                type="button"
              >
                {"<"}
              </button>
              <span>{t(`language.${i18n.language}`)}</span>
              <button
                aria-label="Next language"
                onClick={() => switchLanguage(1)}
                type="button"
              >
                {">"}
              </button>
            </div>
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
