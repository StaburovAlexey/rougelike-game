import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import "./Loader.css";

export function Loader({ active }) {
  const { t } = useTranslation("loader");
  const [entered, setEntered] = useState(false);
  const spriteRows = [0, 1, 2, 3, 4];

  useEffect(() => {
    if (!active) {
      setEntered(false);
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  return (
    <div className={`loader-container ${entered ? "is-active" : "is-exit"}`}>
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
