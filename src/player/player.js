import Entity from '../entities/entity.js';

export default class Player extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0x44ff66 });
    this.onExit = options.onExit;
  }

  click(cell) {
    const key = `${cell.col}:${cell.row}`;
    if (this.level.moveCellsSet?.has(key)) {
      this.move(cell);
    } else {
      this.interaction(cell);
    }
  }
  interaction(cell) {
    const { col, row, content } = cell;
    const candidatesMap = this.level.getCandidatesCells(
      this.level.cellPlayer,
    ).candidatesMap;
    const key = `${col}:${row}`;
    if (!candidatesMap.has(key)) return;
    if (content.type === 'loot') {
      console.log('Give surprise!');
    }
    if (content.type === 'door' && content.doorType === 'out') {
      this.onExit();
    }
  }
}
