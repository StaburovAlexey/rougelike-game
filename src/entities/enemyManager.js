const ENEMY_POOL_BY_STAGE = [
  ["skirmisher", "chaser"],
  ["chaser", "skirmisher", "guard"],
  ["chaser", "skirmisher", "guard", "bruiser","berserker"],
  ["chaser", "skirmisher", "guard", "bruiser", "ambusher"],
  ["chaser", "skirmisher", "guard", "bruiser", "ambusher", "berserker"],
];

function getStage(progress) {
  if (progress < 0.2) return 0;
  if (progress < 0.4) return 1;
  if (progress < 0.6) return 2;
  if (progress < 0.8) return 3;
  return 4;
}

export default class EnemyManager {
  getEnemyPlanForLevel({ levelIndex, totalLevels, cols, rows }) {
    const progress = totalLevels <= 1 ? 1 : levelIndex / (totalLevels - 1);
    const cells = cols * rows;
    const baseCount = Math.max(1, Math.floor(cells * 0.03));
    const progressBonus = Math.floor(progress * 5);
    const randomBonus = Math.random() < 0.45 + progress * 0.3 ? 1 : 0;
    const enemy = baseCount + progressBonus + randomBonus;

    const stage = getStage(progress);
    const enemyTypes = ENEMY_POOL_BY_STAGE[stage];
    const protection = 1 + Math.floor(progress * 2.5);
    const strength = 1 + Math.floor(progress * 1.9);

    return {
      enemy,
      enemyTypes,
      protection,
      strength,
      progress,
      stage,
    };
  }
}
