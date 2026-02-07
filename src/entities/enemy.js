import * as THREE from "three";
import Entity from "./entity.js";

const AGGRO_RANGE = 4;
const AMBUSH_RANGE = 3;
const AMBUSH_SPEED = 2;
const ENEMY_STATS = {
  chaser: { hp: 2, atk: 3 },
  bruiser: { hp: 6, atk: 4 },
  skirmisher: { hp: 5, atk: 3 },
  guard: { hp: 5, atk: 3 },
  ambusher: { hp: 5, atk: 3 },
};
const ENEMY_VISUALS = {
  // Chaser: преследователь, идет к игроку и бьет вблизи.
  chaser: {
    color: 0xff4444,
    build: (size, height) => new THREE.BoxGeometry(size, height, size),
  },
  // Bruiser: тяжелый боец, медленный, сильный урон, есть "wind-up".
  bruiser: {
    color: 0xaa2222,
    build: (size, height) =>
      new THREE.CylinderGeometry(size * 0.7, size * 0.7, height, 12),
  },
  // Skirmisher: задира, бьет и отступает на безопасную клетку.
  skirmisher: {
    color: 0x44aaff,
    build: (size, height) => new THREE.ConeGeometry(size * 0.7, height, 12),
  },
  // Guard: страж, не агрится пока игрок далеко, держит позицию.
  guard: {
    color: 0x44ff88,
    build: (size) => new THREE.OctahedronGeometry(size * 0.7),
    scaleY: true,
  },
  // Ambusher: засадник, ждет до близкой дистанции, затем резко сближается.
  ambusher: {
    color: 0xffaa44,
    build: (size) => new THREE.TetrahedronGeometry(size * 0.7),
    scaleY: true,
  },
};

let enemyId = 1;
const cellKey = (cell) => `${cell.col}:${cell.row}`;
const manhattan = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row);

export default class Enemy extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0xff4444 });
    this.hasCustomHp = options.hp !== undefined;
    this.hasCustomAtk = options.atk !== undefined;
    this.strong = options.strong ?? 1;
    this.id = enemyId++;
    this.type = options.type ?? "chaser";
    this.aggroRange = options.aggroRange ?? AGGRO_RANGE;
    this.guardRange = options.guardRange ?? this.aggroRange;
    this.ambushRange = options.ambushRange ?? AMBUSH_RANGE;
    this.ambushSpeed = options.ambushSpeed ?? AMBUSH_SPEED;
    this.isEnemy = true;
    this.label = `Enemy#${this.id}(${this.type})`;
    this.windUp = 0;
    this.ambushTriggered = false;
    this.skirmisherMoveAttackReady = false;
    this.#applyArchetype();
    this.#applyVisuals();
  }

  takeTurn(player) {
    if (!player || !player.isAlive?.()) return false;
    switch (this.type) {
      case "bruiser":
        return this.#takeBruiserTurn(player);
      case "skirmisher":
        return this.#takeSkirmisherTurn(player);
      case "guard":
        return this.#takeGuardTurn(player);
      case "ambusher":
        return this.#takeAmbusherTurn(player);
      case "chaser":
      default:
        return this.#takeChaserTurn(player);
    }
  }

  #applyArchetype() {
    const stats = ENEMY_STATS[this.type] || ENEMY_STATS.chaser;
    if (!this.hasCustomAtk && stats.atk !== undefined) {
      this.baseAttack = stats.atk;
    }
    if (!this.hasCustomHp && stats.hp !== undefined) {
      this.maxHp = stats.hp
      this.hp = this.maxHp;
    }
    if (this.strong !== 1) {
      this.maxHp = this.maxHp * this.strong;
      this.hp = this.maxHp;
    }
  }

  #applyVisuals() {
    const config = ENEMY_VISUALS[this.type] || ENEMY_VISUALS.chaser;
    const geometry = config.build(this.size, this.height);
    const material = new THREE.MeshBasicMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geometry, material);
    if (config.scaleY) {
      mesh.scale.y = this.height / this.size;
    }
    this.mesh = mesh;
    this.updateWorldPosition(0.5);
  }

  #takeChaserTurn(player) {
    const dist = manhattan(this, player);
    if (dist > this.aggroRange) return false;
    if (dist === 1) {
      this.attack(player);
      return true;
    }
    return this.#chase(player, 1);
  }

  #takeBruiserTurn(player) {
    const dist = manhattan(this, player);
    if (dist > this.aggroRange) return false;
    if (this.windUp > 0) {
      this.windUp -= 1;
      return false;
    }
    let acted = false;
    if (dist === 1) {
      this.attack(player);
      acted = true;
    } else {
      acted = this.#chase(player, 1);
    }
    if (acted) this.windUp = 1;
    return acted;
  }

  #takeSkirmisherTurn(player) {
    const dist = manhattan(this, player);
    if (dist > this.aggroRange) {
      this.skirmisherMoveAttackReady = false;
      return false;
    }
    if (dist === 1) {
      return this.#skirmisherAttackOrCharge(player);
    }

    const moved = this.#chase(player, 1);
    if (!moved || !this.isAlive()) return moved;

    if (manhattan(this, player) !== 1) return moved;
    return this.#skirmisherAttackOrCharge(player) || moved;
  }

  #skirmisherAttackOrCharge(player) {
    if (!this.skirmisherMoveAttackReady) {
      this.skirmisherMoveAttackReady = true;
      return false;
    }
    this.attack(player);
    if (this.isAlive()) {
      this.#retreatFrom(player);
    }
    this.skirmisherMoveAttackReady = false;
    return true;
  }

  #takeGuardTurn(player) {
    const dist = manhattan(this, player);
    if (dist > this.guardRange) return false;
    if (dist === 1) {
      this.attack(player);
      return true;
    }
    return false;
  }

  #takeAmbusherTurn(player) {
    const dist = manhattan(this, player);
    if (!this.ambushTriggered) {
      if (dist > this.ambushRange) return false;
      this.ambushTriggered = true;
    }
    if (dist === 1) {
      this.attack(player);
      return true;
    }
    return this.#chase(player, this.ambushSpeed);
  }

  #chase(player, speed = 1) {
    const targets = this.#getApproachTargets(player);
    if (targets.length === 0) return false;
    const path = this.#findPathToAnyTarget(targets);
    if (!path || path.length < 2) return false;
    return this.#moveAlongPath(path, speed);
  }

  #getApproachTargets(player) {
    const { candidates } = this.level.getCandidatesCells(player);
    return candidates.filter((cell) => this.canEnter(cell.col, cell.row));
  }

  #retreatFrom(player) {
    const currentDist = manhattan(this, player);
    const candidates = this.level
      .getCandidatesCells(this)
      .candidates.filter((cell) => this.canEnter(cell.col, cell.row));
    let best = null;
    let bestDist = currentDist;
    for (const cell of candidates) {
      const dist = manhattan(cell, player);
      if (dist > bestDist) {
        bestDist = dist;
        best = cell;
      }
    }
    if (best) this.move(best);
  }

  #moveAlongPath(path, maxSteps) {
    const steps = Math.min(maxSteps, path.length - 1);
    let moved = false;
    for (let i = 1; i <= steps; i++) {
      const step = path[i];
      if (!this.canEnter(step.col, step.row)) break;
      this.move(step);
      moved = true;
    }
    return moved;
  }

  #findPathToAnyTarget(targets) {
    const start = { col: this.col, row: this.row };
    const startKey = cellKey(start);
    const targetKeys = new Set(targets.map(cellKey));
    if (targetKeys.has(startKey)) return [start];

    const queue = [start];
    const visited = new Set([startKey]);
    const cameFrom = new Map();
    const cellByKey = new Map([[startKey, start]]);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = cellKey(current);
      const neighbors = this.level.getCandidatesCells(current).candidates;

      for (const next of neighbors) {
        const nextKey = cellKey(next);
        if (visited.has(nextKey)) continue;
        if (!this.canEnter(next.col, next.row)) continue;
        visited.add(nextKey);
        cameFrom.set(nextKey, currentKey);
        cellByKey.set(nextKey, next);

        if (targetKeys.has(nextKey)) {
          return this.#buildPath(nextKey, cameFrom, cellByKey);
        }

        queue.push(next);
      }
    }

    return null;
  }

  #buildPath(targetKey, cameFrom, cellByKey) {
    const path = [];
    let currentKey = targetKey;
    while (currentKey) {
      path.push(cellByKey.get(currentKey));
      currentKey = cameFrom.get(currentKey);
    }
    path.reverse();
    return path;
  }
}
