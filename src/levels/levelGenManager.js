const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default class LevelGenManager {
  getLevelPlanForLevel({ levelIndex, totalLevels, cols, rows }) {
    const progress = totalLevels <= 1 ? 1 : levelIndex / (totalLevels - 1);
    const cells = cols * rows;
    const innerCells = Math.max(1, (cols - 2) * (rows - 2));

    const obstacleDensity = clamp(0.035 + progress * 0.03, 0.03, 0.08);
    const trapDensity = clamp(0.015 + progress * 0.025, 0.01, 0.05);
    const doorTotal = clamp(2 + Math.floor(progress * 3), 2, 4);

    const obstacleCount = clamp(
      Math.floor(cells * obstacleDensity),
      1,
      Math.max(1, Math.floor(innerCells * 0.2)),
    );
    const trapCount = clamp(
      Math.floor(cells * trapDensity),
      1,
      Math.max(1, Math.floor(innerCells * 0.12)),
    );

    return {
      progress,
      obstacleDensity,
      trapDensity,
      obstacleCount,
      trapCount,
      doorTotal,
    };
  }
}
