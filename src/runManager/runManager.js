import * as THREE from "three";
import { sceneManager } from "../core/sceneManager";
import CreateLevel from "../levels/createLevel.js";
import Player from "../player/player.js";
import Enemy from "../entities/enemy.js";

const ENEMY_TYPES = ["chaser", "bruiser", "skirmisher", "guard", "ambusher"];

export default class RunManager {
  constructor() {
    this.level;
    this.floor;
    this.player;
    this.activeLevel;
    this.run;
    this.enemys = [];
  }
  createRun() {
    const defaultLevels = [
      {
        cols: 8,
        rows: 8,
        enemy: 1,
        enemyTypes: ["skirmisher"],
        strong: 1,
      },
      {
        cols: 9,
        rows: 8,
        enemy: 3,
        enemyTypes: ["chaser", "guard"],
      },
      {
        cols: 10,
        rows: 8,
        enemy: 4,
        enemyTypes: ["chaser", "skirmisher"],
      },
      {
        cols: 10,
        rows: 10,
        enemy: 5,
        enemyTypes: ["chaser", "bruiser", "guard"],
      },
      {
        cols: 12,
        rows: 8,
        enemy: 6,
        enemyTypes: ["skirmisher", "guard", "chaser"],
      },
      {
        cols: 12,
        rows: 10,
        enemy: 7,
        enemyTypes: ["bruiser", "chaser", "skirmisher"],
      },
      {
        cols: 12,
        rows: 12,
        enemy: 8,
        enemyTypes: ["guard", "ambusher", "chaser"],
      },
      {
        cols: 14,
        rows: 10,
        enemy: 9,
        enemyTypes: ["ambusher", "skirmisher", "bruiser"],
      },
      {
        cols: 14,
        rows: 12,
        enemy: 10,
        enemyTypes: ["ambusher", "guard", "bruiser", "chaser"],
      },
      {
        cols: 15,
        rows: 12,
        enemy: 12,
        enemyTypes: ["chaser", "bruiser", "skirmisher", "guard", "ambusher"],
      },
    ];

    return {
      start: 0,
      levels: defaultLevels,
    };
  }
  buildLevel(options) {
    const { rows, cols } = options;
    if (this.level) {
      sceneManager.remove(this.level.getLevel());
    }
    this.level = new CreateLevel({ rows, cols });
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
    const strong = level?.strong || 1;
    for (let i = 0; i < spawnCells.length; i++) {
      const enemy = new Enemy({
        level: this.level,
        start: spawnCells[i],
        type: types[i % types.length],
        strong: strong,
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
  getLevel() {
    return this.run.levels[this.activeLevel];
  }
  start() {
    this.run = this.createRun();
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
    console.log("End run!");
  }
}
