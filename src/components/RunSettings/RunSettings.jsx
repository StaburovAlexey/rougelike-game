import { ContainerItemRunSettings } from "../ContainerItemRunSettings/ContainerItemRunSettings";
import { HERO_CLASS } from "../../game/static/hero";
import { useEffect, useState } from "react";
import "./RunSettings.css";

const HERO_CARD_DATA = {
  warrior: {
    title: "Воин",
    idleFrames: 8,
  },
  rouge: {
    title: "Разбойник",
    idleFrames: 6,
  },
  fff: {
    title: "Щитоновсец",
  },
};

function HeroIdleAnimation({ heroType, frames }) {
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrame((currentFrame) => {
        return currentFrame >= frames ? 1 : currentFrame + 1;
      });
    }, 160);

    return () => {
      clearInterval(intervalId);
    };
  }, [frames]);

  return (
    <div className="run-settings-hero-card__sprite">
      <img
        alt=""
        aria-hidden="true"
        src={`/player/${heroType}/idle/${frame}.png`}
      />
    </div>
  );
}

export function RunSettings({ children }) {
  const heroClasses = Object.values(HERO_CLASS);

  return (
    <div className="run-settings-container">
      <div className="hero flex">
        <ContainerItemRunSettings>
          <div className="run-settings-hero-deck">
            {heroClasses.map((hero, index) => {
              const card = HERO_CARD_DATA[hero.type];

              return (
                <button
                  className="run-settings-hero-card"
                  key={hero.type}
                  style={{ "--index": index }}
                  type="button"
                >
                  <HeroIdleAnimation
                    frames={card.idleFrames}
                    heroType={hero.type}
                  />
                  <span className="run-settings-hero-card__title">
                    {card.title}
                  </span>
                </button>
              );
            })}
          </div>
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
