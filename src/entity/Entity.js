import MashEntity from './createMashEntity';

export default class Entity {
  constructor(position) {
    this.hp = 10;
    this.attak = 3;
    this.defence = 0;
    this.cellPosition = position;
    this.mesh = new MashEntity().mesh;
  }
  move(cell) {
    this.cellPosition = cell;
  }
  attak() {}
}
