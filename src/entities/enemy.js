import Entity from './entity.js';

export default class Enemy extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0xff4444 });
  }

  hightligtMoveCell() {
    // Enemy does not highlight move cells.
  }
}
