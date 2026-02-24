class Cell {
  constructor(x, z) {
    this.x = x;
    this.z = z;

    this.type = 'floor'; // floor / wall
    this.blocked = false; // препятствие?
    this.player = null;
    this.enemy = null; // игрок/враг (кто занимает клетку)
    this.loot = null; // объект лута или null
    this.meta = {}; // что угодно ещё (ловушки, эффекты)
  }
}

export default class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Array(cols * rows);
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        this.cells[this.index(x, z)] = new Cell(x, z);
      }
    }
  }
  setBlockInstanced(cells) {
    for (const cell of cells) {
      const cellGrid = this.getId(cell.id);
      cellGrid.type = cell.type;
      cellGrid.blocked = true;
    }
    
  }
  index(x, z) {
    return z * this.cols + x;
  }
  coordsCell(id) {
    return { x: id % this.cols, z: Math.floor(id / this.cols) };
  }
  inBounds(x, z) {
    return x >= 0 && z >= 0 && x < this.cols && z < this.rows;
  }
  getId(id) {
    return this.cells[id];
  }
  get(x, z) {
    if (!this.inBounds(x, z)) return null;
    return this.cells[this.index(x, z)];
  }
}
