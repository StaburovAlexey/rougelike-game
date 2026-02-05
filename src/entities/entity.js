import * as THREE from 'three';

export default class Entity {
  constructor({
    level,
    start = { col: 1, row: 1 },
    size = 0.6,
    height = 1,
    color = 0xffffff,
    hp = 5,
    atk = 3,
    minDamage = 1,
    onDeath = null,
    label = 'Entity',
  } = {}) {
    if (!level) throw new Error('Entity: level is required');
    this.level = level;
    this.col = start.col;
    this.row = start.row;
    this.size = size;
    this.height = height;
    this.maxHp = hp;
    this.hp = hp;
    this.baseAttack = atk;
    this.minDamage = minDamage;
    this.fatigue = 0;
    this.onDeath = onDeath;
    this.label = label;

    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshBasicMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);

    this.updateWorldPosition(0.5);
  }

  updateWorldPosition(height = 0.5) {
    const pos = this.level.gridToWorld(this.col, this.row, height);
    this.mesh.position.copy(pos);
    this.level.registerEntity(this, { col: this.col, row: this.row });
    this.hightligtMoveCell();
  }

  canEnter(col, row) {
    if (col < 0 || col >= this.level.cols) return false;
    if (row < 0 || row >= this.level.rows) return false;
    if (this.level.isCellOccupied({ col, row }, this)) return false;
    const key = `${col}:${row}`;
    const content = this.level.cellContents.get(key);
    if (!content) return true;
    return (
      content.type === 'floor' ||
      content.type === 'door' ||
      content.type === 'loot'
    );
  }

  move(cell) {
    const { row, col } = cell;
    if (!this.canEnter(col, row)) return false;
    this.col = col;
    this.row = row;
    this.updateWorldPosition();
    this.resetFatigue();
    return true;
  }

  isAlive() {
    return this.hp > 0;
  }

  getAttackDamage() {
    return Math.max(this.minDamage, this.baseAttack - this.fatigue);
  }

  attack(target) {
    if (!target || !target.isAlive?.()) return { damage: 0, killed: false };
    const damage = this.getAttackDamage();
    this.fatigue += 1;
    const killed = target.takeDamage(damage);
    this.logAttack(target, damage);
    return { damage, killed };
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.level.removeEntity(this);
    console.log(`${this.getLabel()} died.`);
    if (this.onDeath) this.onDeath(this);
  }

  resetFatigue() {
    this.fatigue = 0;
  }

  getLabel() {
    return this.label || 'Entity';
  }

  logAttack(target, damage) {
    const attacker = this.getLabel();
    const defender = target.getLabel?.() || 'Target';
    console.log(
      `${attacker} hits ${defender} for ${damage}. ${defender} HP: ${target.hp}/${target.maxHp}`,
    );
  }
  getObject3D() {
    return this.mesh;
  }
  hightligtMoveCell() {
    this.level.colorCellGo(this.row, this.col);
  }
}
