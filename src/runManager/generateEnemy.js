import {
  ENEMY_LEVEL_SCALING,
  ENEMY_TYPE_RULES,
  getEnemySpawnWeights,
  pickWeightedEnemyType,
} from '../static/enemy';

export default class GenerateEnemy {
  constructor(levelIdex, levelSize) {
    this.levelIdex = levelIdex;
    this.cells = levelSize.rows * levelSize.cols;
    this.countEnemy = ENEMY_LEVEL_SCALING.getEnemyCount(this.cells, levelIdex);
    this.spawnWeights = getEnemySpawnWeights(levelIdex);
    this.enemies = this.#generateEnemies();
    console.log('cells',this.cells,'count',this.countEnemy,'spawnWeights',this.spawnWeights,'enemies',  this.enemies)
  }

  #generateEnemies() {
    const enemies = [];

    for (let i = 0; i < this.countEnemy; i++) {
      const type = pickWeightedEnemyType(this.spawnWeights);
      enemies.push({
        type,
        ...ENEMY_TYPE_RULES[type],
      });
    }

    return enemies;
  }
}
