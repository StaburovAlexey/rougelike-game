import * as THREE from 'three';
import { sceneManager } from '../core/sceneManager';
import CreateLevel from '../levels/createLevel.js';
import Player from '../player/player.js';
import Enemy from '../entities/enemy.js';
import EnemyManager from '../entities/enemyManager.js';
import LevelGenManager from '../levels/levelGenManager.js';
import LootManager from '../loot/lootManager.js';

const ENEMY_TYPES = [
  'chaser',
  'bruiser',
  'skirmisher',
  'guard',
  'ambusher',
  'berserker',
];

export default class RunManager {
  constructor() {
    this.level;
    this.floor;
    this.player;
    this.activeLevel;
    this.run;
    this.enemys = [];
    this.enemyManager = new EnemyManager();
    this.levelGenManager = new LevelGenManager();
    this.lootManager = new LootManager();
  }
  createRun() {
    const totalLevels = 10;
    const minSize = 5;
    const maxSize = 14;
    const randomInt = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const baseLevels = Array.from({ length: totalLevels }, () => ({
      cols: randomInt(minSize, maxSize),
      rows: randomInt(minSize, maxSize),
    }));

    const defaultLevels = baseLevels.map((level, levelIndex, levels) => ({
      ...level,
      ...this.enemyManager.getEnemyPlanForLevel({
        levelIndex,
        totalLevels: levels.length,
        cols: level.cols,
        rows: level.rows,
      }),
      levelPlan: this.levelGenManager.getLevelPlanForLevel({
        levelIndex,
        totalLevels: levels.length,
        cols: level.cols,
        rows: level.rows,
      }),
      lootPlan: this.lootManager.getLootPlanForLevel({
        levelIndex,
        totalLevels: levels.length,
        cols: level.cols,
        rows: level.rows,
      }),
    }));

    return {
      start: 0,
      levels: defaultLevels,
    };
  }
  buildLevel(options) {
    const { rows, cols, lootPlan, levelPlan } = options;
    if (this.level) {
      sceneManager.remove(this.level.getLevel());
    }
    this.level = new CreateLevel({ rows, cols, lootPlan, levelPlan });
    sceneManager.add(this.level.getLevel());
    const spawn = this.level.getSpawnCell();
    this.floor = this.level.state.floor.instanced;
    if (!this.player) {
      this.player = new Player({
        level: this.level,
        start: spawn,
        onExit: this.next.bind(this),
        onMove: this.onPlayerMove.bind(this),
      });
      sceneManager.add(this.player.getObject3D());
    } else {
      this.player.level = this.level;
      this.player.col = spawn.col;
      this.player.row = spawn.row;
      this.player.updateWorldPosition();
    }
    this.spawnEnemys(spawn);
    this.player.updateWorldPosition();
  }
  spawnEnemys(spawnPlayer) {
    if (this.enemys.length != 0) {
      for (const enemy of this.enemys) {
        sceneManager.remove(enemy.getObject3D());
      }
      this.enemys = [];
    }
    const level = this.getLevel();
    const countEnemy = level.enemy;
    if (countEnemy === 0) return;
    const spawnCells = this.level.getEnemySpawnCells({
      count: countEnemy,
      avoidCell: spawnPlayer,
      minDistance: 5,
      exitMinDistance: 2,
    });
    const types = level.enemyTypes ?? ENEMY_TYPES;
    const protection = level?.protection || 1;
    const strength = level?.strength || 1;
    for (let i = 0; i < spawnCells.length; i++) {
      const enemy = new Enemy({
        level: this.level,
        start: spawnCells[i],
        type: types[i % types.length],
        protection,
        strength,
        onDeath: this.onEnemyDeath.bind(this),
      });
      this.enemys.push(enemy);
      sceneManager.add(enemy.getObject3D());
    }
  }
  onEnemyDeath(enemy) {
    sceneManager.remove(enemy.getObject3D());
    this.enemys = this.enemys.filter((item) => item !== enemy);
  }
  onPlayerMove() {
    this.runEnemyTurns();
  }
  runEnemyTurns() {
    const player = this.player;
    if (!player) return;
    for (const enemy of this.enemys) {
      enemy.takeTurn(player);
    }
    player.updateWorldPosition();
  }
  update(camera) {
    this.level?.update?.(camera);
  }
  getLevel() {
    return this.run.levels[this.activeLevel];
  }
  start() {
    this.run = this.createRun();
    console.log('run', this.run);
    this.activeLevel = this.run.start;
    this.buildLevel(this.getLevel());
  }
  next() {
    const lastLevel = this.run.levels.length - 1;

    if (lastLevel === this.activeLevel) {
      this.end();
      return;
    }
    this.activeLevel++;

    this.buildLevel(this.getLevel());
  }
  end() {
    console.log('End run!');
  }
}
