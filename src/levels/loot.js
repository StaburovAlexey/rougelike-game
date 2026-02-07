import Environment from './environment';

export default class Loot extends Environment {
  #loot;

  constructor(options = {}) {
    super(options);

    const {
      y = 0,
      cells = [],
      skipCells = [],
      levelGroup,
      count = 4,
      setCell,
    } = options;

    this.levelGroup = levelGroup;
    this.y = y;
    this.cells = cells;
    this.skipCells = skipCells;
    this.count = count;
    this.setCell = setCell;

    if (!this.setCell) {
      throw new Error('Loot: setCell is required');
    }

    this.#loot = [];

    this.createLoot();
  }

  createLoot() {
    const skip = new Set(this.skipCells.map((c) => this.cellKey(c)));

    for (const cell of this.skipCells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const col = cell.col + dc;
          const row = cell.row + dr;
          if (col < 0 || col >= this.cols) continue;
          if (row < 0 || row >= this.rows) continue;
          skip.add(this.cellKey({ col, row }));
        }
      }
    }

    const allowed = this.cells.filter((cell) => !skip.has(this.cellKey(cell)));

    this.createInstance({
      count: this.count,
      thickness: this.cellSize / 2,
      color: '#ddd019',
    });
    const lootsCells = [];
    for (let i = 0; i < this.count; i++) {
      const cell = allowed.splice(this.randomInt(allowed.length), 1)[0];
      const x = this.getX(cell);
      const z = this.getZ(cell);
      this.dummy.scale.set(0.4, 1, 0.4);
      this.dummy.position.set(x, this.y + (this.cellSize / 2 + 0.1) / 2, z);
      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);

      this.setCell(cell, { type: 'loot' });
      lootsCells.push(cell);
    }

    this.instanced.instanceMatrix.needsUpdate = true;
    this.setMesh(this.instanced, lootsCells);
    this.levelGroup.add(this.instanced);
  }
}
