import { useEffect, useState } from "react";

const HERO_CARD_DATA = {
  warrior: {
    title: "Воин",
    idleFrames: 8,
  },
  rouge: {
    title: "Разбойник",
    idleFrames: 6,
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

export function HeroClassCard({ hero, index }) {
  const card = HERO_CARD_DATA[hero.type];

  function handlePointerMove(event) {
    const cardElement = event.currentTarget;
    const rect = cardElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cardElement.style.setProperty("--tilt-x", `${-y * 14}deg`);
    cardElement.style.setProperty("--tilt-y", `${x * 18}deg`);
  }

  function handlePointerLeave(event) {
    const cardElement = event.currentTarget;

    cardElement.style.setProperty("--tilt-x", "0deg");
    cardElement.style.setProperty("--tilt-y", "0deg");
  }

  if (!card) {
    return null;
  }

  return (
    <button
      className="run-settings-hero-card"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={{ "--index": index }}
      type="button"
    >
      <HeroIdleAnimation frames={card.idleFrames} heroType={hero.type} />
      <span className="run-settings-hero-card__title">{card.title}</span>
    </button>
  );
}
