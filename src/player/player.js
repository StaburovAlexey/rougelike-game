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
          this.onExit?.(content);
          return;
        }
        if (content?.type === 'loot') {
          this.takeLoot(cell, content);
        
        }
        if (this.onMove) this.onMove();
      }
      return;
    }
    if (this.tryAttack(cell)) return;
   
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
  takeLoot(cell, lootInfo = null) {
    const picked = this.level.pickupLoot(cell);
    if (!picked) return false;

    console.log(
      `${this.getLabel()} picked loot`,
      lootInfo,
    );
    return true;
  }

  isAdjacent(cell) {
    return (
      Math.abs(this.col - cell.col) + Math.abs(this.row - cell.row) === 1
    );
  }
  hightligtMoveCell() {
    this.level.colorCellsInteractive({ row: this.row, col: this.col });
  }
}
