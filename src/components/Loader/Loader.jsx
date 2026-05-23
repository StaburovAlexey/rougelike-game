import { useTranslation } from "react-i18next";
import "./Loader.css";

export function Loader() {
  const { t } = useTranslation("loader");

  return (
    <div className="loader-container">
      <h1>{t("fontCheck")}</h1>
    </div>
  );
}
