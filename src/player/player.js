import Entity from '../entities/entity.js';

export default class Player extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0x44ff66 });
    this.onExit = options.onExit;
    this.onMove = options.onMove;
    this.isPlayer = true;
    this.label = 'Player';
  }

  updateWorldPosition(height = 0.5) {
    super.updateWorldPosition(height);
    this.level.setCellPlayer({ col: this.col, row: this.row });
    this.hightligtMoveCell()
  }

  click(cell) {
    const key = `${cell.col}:${cell.row}`;
    if (this.level.moveCellsSet?.has(key)) {
      const moved = this.move(cell);
      if (moved) {
        const content = this.level.cellContents.get(key);
        if (content?.type === 'door' && content.doorType === 'out') {
          this.onExit?.();
          return;
        }
        if (this.onMove) this.onMove();
      }
      return;
    }
    if (this.tryAttack(cell)) return;
    this.interaction(cell);
  }

  tryAttack(cell) {
    if (!this.isAdjacent(cell)) return false;
    const target = this.level.getEntityAt(cell);
    if (!target || !target.isEnemy) return false;
    const result = this.attack(target);
    if (target.isAlive?.()) {
      target.attack(this);
    }
    this.updateWorldPosition();
    return result.damage > 0;
  }

  isAdjacent(cell) {
    return (
      Math.abs(this.col - cell.col) + Math.abs(this.row - cell.row) === 1
    );
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
  }
   hightligtMoveCell() {
    this.level.colorCellsInteractive({ row: this.row, col: this.col });
    // this.level.colorCellAtack(this.row,this.col)
  }
}
