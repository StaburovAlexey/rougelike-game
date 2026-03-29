import {
  ENEMY_LEVEL_SCALING,
  ENEMY_TYPE_RULES,
  getEnemySpawnWeights,
  getEnemyProgressStats,
  pickWeightedEnemyType,
} from '../static/enemy';

export default class GenerateEnemy {
  constructor(levelIdex, levelSize) {
    this.levelIdex = levelIdex;
    this.cells = levelSize.rows * levelSize.cols;
    this.countEnemy = ENEMY_LEVEL_SCALING.getEnemyCount(this.cells, levelIdex);
    this.spawnWeights = getEnemySpawnWeights(levelIdex);
    this.enemies = this.#generateEnemies();
    
  }

  #generateEnemies() {
    const enemies = [];

    for (let i = 0; i < this.countEnemy; i++) {
      const type = pickWeightedEnemyType(this.spawnWeights);
      const progressStats = getEnemyProgressStats(type, this.levelIdex);
      enemies.push({
        type,
        ...ENEMY_TYPE_RULES[type],
        ...progressStats,
      });
    }

    return enemies;
  }
}
