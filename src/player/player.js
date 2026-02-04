import Entity from "../entities/entity.js";

export default class Player extends Entity {
  constructor(options = {}) {
    super({ ...options, color: 0x44ff66 });
    
  }

  moveByKey(code) {
 
    if (code === "KeyW") return this.tryMove(0, -1);
    if (code === "KeyS") return this.tryMove(0, 1);
    if (code === "KeyA") return this.tryMove(-1, 0);
    if (code === "KeyD") return this.tryMove(1, 0);
    return false;
  }
  
}
