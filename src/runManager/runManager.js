import * as THREE from 'three';
import { sceneManager } from '../core/sceneManager';
import CreateLevel from '../levels/createLevel.js';
import Player from '../player/player.js';
import Enemy from '../entities/enemy.js';

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
    const run = {
      start: 0,
      levels: [
        {
          cols: 10,
          rows: 10,
          enemy: 3,
        },
        {
          cols: 12,
          rows: 5,
          enemy: 1,
        },
        {
          cols: 10,
          rows: 10,
          enemy: 10,
        },
      ],
    };
    return run;
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
      });
      sceneManager.add(this.player.getObject3D());
    } else {
      this.player.level = this.level;
      this.player.col = spawn.col;
      this.player.row = spawn.row;
      this.player.updateWorldPosition();
    }
    this.spawnEnemys(spawn);
  }
  spawnEnemys(spawnPlayer) {
    if (this.enemys.length != 0) {
      sceneManager.remove(...this.enemys);
      this.enemys = [];
    }
    const level = this.getLevel();
    const countEnemy = level.enemy;
    if (countEnemy === 0) return;
    const spawnCells = this.level.getEnemySpawnCells({
      count: countEnemy,
      avoidCell: spawnPlayer,
      minDistance: 5,
    });
    for (let i = 0; i < spawnCells.length; i++) {
      const enemy = new Enemy({
        level: this.level,
        start: spawnCells[i],
      }).getObject3D();
      this.enemys.push(enemy);
      sceneManager.add(enemy);
    }
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
    console.log('End run!');
  }
}
