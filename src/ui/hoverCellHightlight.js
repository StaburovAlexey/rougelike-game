import * as THREE from 'three';

export default class HoverHightlight {
  constructor(options = {}) {
    this.lastHoverId = null;
    this.hoverMarker = null;
    this.hoverHeightOffset = 0.02;
    this.raycaster = options.raycaster;
    this.mouse = options.mouse;
  }
  createMesh({ floor, level }) {
    const floorHeight = floor?.geometry?.parameters?.height ?? 0.1;
    this.hoverHeightOffset = floorHeight / 2 + 0.01;
    const markerSize = (level.cellSize || 1) * 0.9;
    const markerGeo = new THREE.PlaneGeometry(markerSize, markerSize);
    const markerMat = new THREE.MeshBasicMaterial({
      color: '#1e571e',
      transparent: true,
      opacity: 0.35,
      depthTest: false,
    });
    this.hoverMarker = new THREE.Mesh(markerGeo, markerMat);
    this.hoverMarker.rotation.x = -Math.PI / 2;
    this.hoverMarker.renderOrder = 10;
    this.hoverMarker.visible = false;
  }
  setLastHoverId(id) {
    this.lastHoverId = id;
  }
  getLastHoverId() {
    return this.lastHoverId;
  }
}
