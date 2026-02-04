import Entity from "../entities/entity.js";

export default class Player extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0x44ff66 });
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
    if (!this.canEnter(col, row)) return false;
    if (content.type === "loot") {
      console.log("Give surprise!");
    }
    if (content.type === "door") {
      console.log("Get out of here!");
    }
  }
}
