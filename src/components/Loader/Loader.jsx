import { useTranslation } from "react-i18next";
import "./Loader.css";

export function Loader() {
  const { t } = useTranslation("loader");
  const spriteRows = [0, 1, 2, 3, 4];

  return (
    <div className="loader-container">
      <div className="loader-container__loader">
        <h1>{t("loading")}</h1>
        <div className="loader-container__animation" aria-hidden="true">
          {spriteRows.map((row, index) => (
            <span
              className="loader-container__sprite"
              key={row}
              style={{
                "--row": row,
                "--index": index,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
