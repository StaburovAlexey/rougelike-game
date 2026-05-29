import { ContainerItemRunSettings } from "../ContainerItemRunSettings/ContainerItemRunSettings";
import "./RunSettings.css";

export function RunSettings({ children }) {
  return (
    <div className="run-settings-container">
      <div className="hero flex">
        <ContainerItemRunSettings>
          <div>Класс</div>
        </ContainerItemRunSettings>
      </div>
      <div className="stats flex">
        <ContainerItemRunSettings>
          <div>Статы</div>
        </ContainerItemRunSettings>
      </div>
      <div className="slots flex">
        <ContainerItemRunSettings>
          <div>Слоты одноразовые</div>
        </ContainerItemRunSettings>
      </div>
      <div className="run-slots flex">
        <ContainerItemRunSettings>
          <div>Улучшения на забег</div>
        </ContainerItemRunSettings>
      </div>
      <div className="slots-gold flex">
        <div>Купить перки за деньги</div>
      </div>
      <div className="btn flex">
        <div>{children}</div>
      </div>
    </div>
  );
}
