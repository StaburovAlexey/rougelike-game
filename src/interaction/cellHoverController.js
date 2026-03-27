import { Raycaster, Vector2 } from 'three';

export default class CellHoverController {
  constructor({ camera, domElement, grid, renderer } = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.grid = grid;
    this.renderer = renderer;
    this.floorMesh = renderer?.getFloorMesh() ?? null;
    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.hoveredCellId = null;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);

    this.#bindEvents();
  }

  #bindEvents() {
    if (!this.domElement || !this.floorMesh) return;
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerleave', this.onPointerLeave);
  }

  onPointerMove(event) {
    if (!this.camera || !this.floorMesh) return;

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const [hit] = this.raycaster.intersectObject(this.floorMesh, false);

    if (!hit || hit.instanceId === undefined) {
      this.#setHoveredCell(null);
      return;
    }

    const cell = this.grid.cells[hit.instanceId];
    if (!cell?.visible) {
      this.#setHoveredCell(null);
      return;
    }

    this.#setHoveredCell(cell.id);
  }

  onPointerLeave() {
    this.#setHoveredCell(null);
  }

  #setHoveredCell(id) {
    if (this.hoveredCellId === id) return;
    this.hoveredCellId = id;
    if (id !== null) {
      console.log('hover cell', this.grid?.cells?.[id] ?? null);
    }
    this.renderer?.setHoveredCell(id);
  }

  dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerleave', this.onPointerLeave);
    }

    this.#setHoveredCell(null);
    this.floorMesh = null;
    this.renderer = null;
    this.grid = null;
    this.camera = null;
    this.domElement = null;
  }
}
