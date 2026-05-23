import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { AppViewport } from "./components/AppViewport/AppViewport";
import "./i18n";
import "./style.css";

createRoot(document.getElementById("app")).render(

    <AppViewport>
      <App />
    </AppViewport>
  
);
