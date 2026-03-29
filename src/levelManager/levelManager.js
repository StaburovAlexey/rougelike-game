import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import DungeonLight from '../light/dungeonLight';
import CONSTANTS from '../static/constants';
import CellInteractionController from '../interaction/cellInteractionController';
import Player from '../entity/Player';
import EnemiesManager from '../EnemiesManager/EnemiesManager';
export default class LevelManager {
  constructor(options) {
    this.cols = options.size.cols;
    this.rows = options.size.rows;
    this.doorsCount = options.doorsQuantity;
    this.camera = options.camera;
    this.domElement = options.domElement;

    this.step = CONSTANTS.CELL_SIZE + CONSTANTS.GAP_CELLS;
    this.halfW = ((this.cols - 1) * this.step) / 2;
    this.halfH = ((this.rows - 1) * this.step) / 2;
    this.cellInteractionController = null;
    this.player = null;
    this.grid = new Grid(this.cols, this.rows, {
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
      enemiesCount: options.enemies.length,
    });
    this.nextLevel = options.nextLevel;
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
    this.light = new DungeonLight();
    this.player = new Player(this.grid.getCellPlayer(), {
      name: 'player',
      hp: 2,
      atk: 2,
      def: 2,
    });
    console.log('player', this.player);
    this.enemies = new EnemiesManager(options.enemies, this.grid);
    this.cellInteractionController = new CellInteractionController({
      camera: this.camera,
      domElement: this.domElement,
      grid: this.grid,
      renderer: this.staticInstancedRenderer,
      onHoverChange: (cell) => {},
      onCellClick: (cell) => {
        if (!this.grid.isEventCell(cell)) return;
        if (cell.type === 'door' && cell.doorRole === 'out') {
          this.nextLevel?.();
        } else if (!cell.enemy) {
          this.grid.movePlayerTo(cell);
          this.player.syncMeshToCell(cell);
          this.staticInstancedRenderer.updateVisible(
            this.grid.setVisibleCell(),
          );
          this.enemies.syncVisible();
          this.enemies.tryMove();
          this.staticInstancedRenderer.hightLightMoveCells(
            this.grid.getMoveCellsAroundPlayer(),
          );
        }
      },
    });
    this.staticInstancedRenderer.updateVisible(this.grid.getDontExpandCell());
    this.staticInstancedRenderer.hightLightMoveCells(
      this.grid.getMoveCellsAroundPlayer(),
    );
  }
 
  clearLevel() {
    this.cellInteractionController?.dispose();
    this.staticInstancedRenderer.dispose();
    this.light.dispose();
    this.player?.dispose();
    this.enemies.dispose()
    this.cellInteractionController = null;
    this.staticInstancedRenderer = null;
    this.light = null;
    this.player = null;
    this.grid = null;
    this.enemies = null
  }
}
