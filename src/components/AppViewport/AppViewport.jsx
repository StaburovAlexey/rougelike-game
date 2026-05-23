import { useEffect, useState } from "react";
import "./AppViewport.css";

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

export function AppViewport({ children }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;

      setScale(Math.min(scaleX, scaleY));
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <div className="app-viewport">
      <div
        className="app-viewport__stage"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
