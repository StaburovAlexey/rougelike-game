import Environment from './environment';
import * as THREE from 'three';

const RARITY_COLORS = {
  common: '#ddd019',
  epic: '#7c4dff',
  legendary: '#ff8f00',
};

export default class Loot extends Environment {
  static textureLoader = new THREE.TextureLoader();
  static textureCache = new Map();

  constructor(options = {}) {
    super(options);

    const {
      y = 0,
      cells = [],
      skipCells = [],
      levelGroup,
      count = 4,
      setCell,
      lootPlan = null,
    } = options;

    this.levelGroup = levelGroup;
    this.y = y;
    this.sourceCells = cells;
    this.skipCells = skipCells;
    this.count = count;
    this.setCell = setCell;
    this.lootPlan = lootPlan;
    this.cells = [];
    this.instanced = null;
    this.instanceByCellKey = new Map();
    this.meshByCellKey = new Map();

    if (!this.setCell) {
      throw new Error('Loot: setCell is required');
    }

    this.createLoot();
  }

  create() {
    return {
      instanced: this.instanced,
      cells: this.cells,
      instanceByCellKey: this.instanceByCellKey,
      meshByCellKey: this.meshByCellKey,
      updateBillboards: this.updateBillboards.bind(this),
    };
  }

  getIconTexture(item = {}) {
    const path = item.iconTexture || item.icon || null;
    if (!path) return null;
    if (Loot.textureCache.has(path)) return Loot.textureCache.get(path);

    const texture = Loot.textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    Loot.textureCache.set(path, texture);
    return texture;
  }

  getLootMesh(item) {
    const { rarity } = item;
    const color = new THREE.Color(RARITY_COLORS[rarity] || RARITY_COLORS.common);
    const iconTexture = this.getIconTexture(item);
    const material = new THREE.MeshBasicMaterial({
      color,
      map: iconTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
    });

    return new THREE.Mesh(
      new THREE.PlaneGeometry(this.cellSize * 0.5, this.cellSize * 0.5),
      material,
    );
  }

  updateBillboards(camera) {
    if (!camera) return;
    for (const mesh of this.meshByCellKey.values()) {
      mesh.lookAt(camera.position);
    }
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

    const allowed = this.sourceCells.filter((cell) => !skip.has(this.cellKey(cell)));

    const lootItems = this.lootPlan?.items || [];
    const spawnCount = Math.min(this.count, allowed.length);
    const pickedCells = [];
    const goldEntries = [];

    for (let itemIndex = 0; itemIndex < spawnCount; itemIndex++) {
      const cell = allowed.splice(this.randomInt(allowed.length), 1)[0];
      const lootItem = lootItems[itemIndex] || {
        lootType: 'gold',
        subType: 'gold',
        rarity: 'common',
        amount: 5,
      };
      pickedCells.push(cell);

      this.setCell(cell, {
        type: 'loot',
        ...lootItem,
      });

      if (lootItem.lootType === 'gold') {
        goldEntries.push({ cell, lootItem });
        continue;
      }

      const x = this.getX(cell);
      const z = this.getZ(cell);
      const mesh = this.getLootMesh(lootItem);
      mesh.position.set(x, this.y + this.cellSize * 0.32, z);
      mesh.userData = { ...lootItem, cell };
      this.levelGroup.add(mesh);
      this.meshByCellKey.set(this.cellKey(cell), mesh);
    }

    if (goldEntries.length > 0) {
      this.createInstance({
        count: goldEntries.length,
        thickness: this.cellSize / 2,
        color: '#ffffff',
      });
      this.instanced.material.vertexColors = true;
      this.instanced.material.needsUpdate = true;
      this.instanced.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(goldEntries.length * 3),
        3,
      );

      for (let i = 0; i < goldEntries.length; i++) {
        const entry = goldEntries[i];
        const x = this.getX(entry.cell);
        const z = this.getZ(entry.cell);
        this.dummy.scale.set(0.4, 1, 0.4);
        this.dummy.position.set(x, this.y + (this.cellSize / 2 + 0.1) / 2, z);
        this.dummy.updateMatrix();
        this.instanced.setMatrixAt(i, this.dummy.matrix);
        this.instanced.setColorAt(
          i,
          new THREE.Color(RARITY_COLORS[entry.lootItem.rarity] || RARITY_COLORS.common),
        );
        this.instanceByCellKey.set(this.cellKey(entry.cell), i);
      }

      this.instanced.instanceMatrix.needsUpdate = true;
      if (this.instanced.instanceColor) {
        this.instanced.instanceColor.needsUpdate = true;
      }
      this.levelGroup.add(this.instanced);
    }

    this.cells = pickedCells;
  }
}
