
import { Color } from "three";
import Environment from "./environment";

export default class Doors extends Environment {
  #doors;
  constructor(options = {}) {
    super({ ...options, thickness: 1.2, color: "#ffffff" });

    const { y = 0, cells = [], levelGroup, total = 3, setCell } = options;

    this.levelGroup = levelGroup;
    this.y = y;
    this.cells = cells;
    this.total = total;
    this.#doors = this.pickDoors();
    this.setCell = setCell;
    if (!this.setCell) {
      throw new Error("Doors: setCell is required");
    }
    this.createDoorsInstanced();
  }

  pickDoors() {
    if (this.total < 1) throw new Error("total doors must be >= 1");
    const perimeter = this.cells;
    const candidates = perimeter.filter((cell) => !this.isCorner(cell));
    if (candidates.length < this.total) {
      throw new Error("not enough perimeter cells for doors");
    }
    const inCell = candidates[this.randomInt(candidates.length)];
    const usedKeys = new Set([this.cellKey(inCell)]);
    const usedSides = new Set([inCell.side]);
    const outs = [];

    while (outs.length < this.total - 1) {
      const candidate = candidates[this.randomInt(candidates.length)];
      const key = this.cellKey(candidate);

      if (usedKeys.has(key)) continue;
      if (usedSides.has(candidate.side)) continue;

      usedKeys.add(key);
      usedSides.add(candidate.side);
      outs.push(candidate);
    }
    return [
      { ...inCell, type: "in" },
      ...outs.map((c) => ({ ...c, type: "out" })),
    ];
    // let i = 0;
    // for (const cell of this.cells) {
    //   const x = this.getX(cell);
    //   const z = this.getZ(cell);

    //   this.dummy.position.set(x, this.y, z);
    //   this.dummy.updateMatrix();
    //   this.dummy.position.y = this.y + this.thickness;

    //   this.instanced.setMatrixAt(i, this.dummy.matrix);
    //   i++;
    // }

    // this.instanced.instanceMatrix.needsUpdate = true;
    // this.instanced.userData = this.getUserData();

    // this.#floor = this.instanced;
    // this.levelGroup.add(this.instanced);
  }
  createDoorsInstanced() {
    const doors = this.#doors;
    this.createInstance({
      count: doors.length,
      thickness: 1.2,
      color: "#ffffff",
    });
    const color = new Color();
    this.dummy.scale.set(1, 1, 1);

    for (let i = 0; i < doors.length; i++) {
      const { col, row, type } = doors[i];

      const x = this.getX(doors[i]);
      const z = this.getZ(doors[i]);

      if (doors[i].side === "top" || doors[i].side === "bottom") {
        this.dummy.scale.set(1, 1, 0.5);
      } else {
        this.dummy.scale.set(0.5, 1, 1);
      }

      this.dummy.position.set(x, this.y + (1.2 + 0.1) / 2, z);
      this.dummy.rotation.set(0, 0, 0);

      this.dummy.updateMatrix();
      this.instanced.setMatrixAt(i, this.dummy.matrix);

      color.setHex(type === "in" ? 0x00ff00 : 0x3366ff);
      this.instanced.setColorAt(i, color);

      this.setCell({ col, row }, { type: "door", doorType: type });
    }

    this.instanced.instanceMatrix.needsUpdate = true;
    this.instanced.instanceColor.needsUpdate = true;

    this.#doors = doors;
    this.setMesh(this.instanced, this.#doors);
    this.levelGroup.add(this.instanced);
  }

  getDoors() {
    return this.#doors;
  }
}
