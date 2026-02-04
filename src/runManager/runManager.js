import * as THREE from 'three';
import { sceneManager } from '../core/sceneManager';
import CreateLevel from '../levels/createLevel.js';
import Player from '../player/player.js';

export default class RunManager {
  constructor() {
    this.level;
    this.floor;
    this.player;
    this.activeLevel;
    this.run;
  }
  createRun() {
    const run = {
      start: 0,
      levels: [
        {
          cols: 6,
          rows: 6,
        },
        {
          cols: 12,
          rows: 5,
        },
        {
          cols: 10,
          rows: 10,
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
      this.player = new Player({ level: this.level, start: spawn, onExit: this.next.bind(this) });
      sceneManager.add(this.player.getObject3D());
    } else {
      this.player.level = this.level;
      this.player.col = spawn.col;
      this.player.row = spawn.row;
      this.player.updateWorldPosition();
    }
  }
  getLevel() {
    return this.run.levels[this.activeLevel];
  }
  start() {
    this.run = this.createRun();
    console.log(this.run);
    this.activeLevel = this.run.start;
    this.buildLevel(this.getLevel());
  }
  next() {
    console.log(this.run);
    const lastLevel = this.run.levels.length - 1;

    if (lastLevel === this.activeLevel) {
      this.end();
      return;
    }
    this.activeLevel++;
    console.log(this.activeLevel);
    this.buildLevel(this.getLevel());
  }
  end() {
    console.log('End run!');
  }
}
