import "./App.css";
import { Loader } from "./Loader/Loader";
import { setLanguage } from "../i18n";
export function App() {
  setLanguage("en");
  return (
    <>
      <Loader />
    </>
  );
}
