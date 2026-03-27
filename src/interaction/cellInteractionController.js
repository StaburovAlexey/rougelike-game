import { Raycaster, Vector2 } from 'three';

export default class CellInteractionController {
  constructor({
    camera,
    domElement,
    grid,
    renderer,
    onHoverChange = null,
    onCellClick = null,
  } = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.grid = grid;
    this.renderer = renderer;
    this.onHoverChange = onHoverChange;
    this.onCellClick = onCellClick;
    this.floorMesh = renderer?.getFloorMesh() ?? null;
    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.hoveredCellId = null;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);

    this.#bindEvents();
  }

  #bindEvents() {
    if (!this.domElement || !this.floorMesh) return;
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
  }

  onPointerMove(event) {
    const cell = this.#getCellFromEvent(event);
    this.#setHoveredCell(cell?.id ?? null);
  }

  onPointerLeave() {
    this.#setHoveredCell(null);
  }

  onPointerDown(event) {
    const cell = this.#getCellFromEvent(event);
    if (!cell) return;
    this.onCellClick?.(cell);
  }

  #getCellFromEvent(event) {
    if (!this.camera || !this.floorMesh || !this.domElement) return null;

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const [hit] = this.raycaster.intersectObject(this.floorMesh, false);

    if (!hit || hit.instanceId === undefined) return null;

    const cell = this.grid?.cells?.[hit.instanceId] ?? null;
    if (!cell?.visible) return null;

    return cell;
  }

  #setHoveredCell(id) {
    if (this.hoveredCellId === id) return;

    this.hoveredCellId = id;
    const cell = id !== null ? this.grid?.cells?.[id] ?? null : null;

    this.renderer?.setHoveredCell(id);
    this.onHoverChange?.(cell);
  }

  dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerleave', this.onPointerLeave);
      this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }

    this.#setHoveredCell(null);
    this.floorMesh = null;
    this.renderer = null;
    this.grid = null;
    this.camera = null;
    this.domElement = null;
    this.onHoverChange = null;
    this.onCellClick = null;
  }
}
