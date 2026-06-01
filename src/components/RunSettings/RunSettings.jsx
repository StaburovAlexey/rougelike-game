import { ContainerItemRunSettings } from "../ContainerItemRunSettings/ContainerItemRunSettings";
import { HERO_CLASS } from "../../game/static/hero";
import { HeroClassCard } from "./HeroClassCard/HeroClassCard";
import { useState } from "react";
import "./RunSettings.css";

export function RunSettings({
  children,
  availableHeroTypes = [],
  onHeroClassChange,
}) {
  const heroClasses = Object.values(HERO_CLASS);
  const [selectedHeroType, setSelectedHeroType] = useState(null);

  function handleHeroSelect(hero) {
    const nextHeroType = selectedHeroType === hero.type ? null : hero.type;

    setSelectedHeroType(nextHeroType);
    onHeroClassChange?.(nextHeroType ? hero : null);
  }

  return (
    <div className="run-settings-container">
      <div className="hero flex">
        <ContainerItemRunSettings>
          <div className="run-settings-hero-deck">
            {heroClasses.map((hero, index) => {
              return (
                <HeroClassCard
                  hero={hero}
                  index={index}
                  isSelected={selectedHeroType === hero.type}
                  isUnavailable={!availableHeroTypes.includes(hero.type)}
                  key={hero.type}
                  onSelect={handleHeroSelect}
                />
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
