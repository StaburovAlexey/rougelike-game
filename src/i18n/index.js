import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import enGame from "./locales/en/game.json";
import enLoader from "./locales/en/loader.json";
import ruCommon from "./locales/ru/common.json";
import ruGame from "./locales/ru/game.json";
import ruLoader from "./locales/ru/loader.json";

const DEFAULT_LANGUAGE = "ru";
const LANGUAGE_STORAGE_KEY = "language";

const resources = {
  en: {
    common: enCommon,
    game: enGame,
    loader: enLoader,
  },
  ru: {
    common: ruCommon,
    game: ruGame,
    loader: ruLoader,
  },
};

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const browserLanguage = navigator.language?.split("-")[0];
const initialLanguage =
  savedLanguage ?? (resources[browserLanguage] ? browserLanguage : DEFAULT_LANGUAGE);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "game", "loader"],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export function setLanguage(language) {
  if (!resources[language]) return;

  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  i18n.changeLanguage(language);
}

export function getAvailableLanguages() {
  return Object.keys(resources);
}

export default i18n;
