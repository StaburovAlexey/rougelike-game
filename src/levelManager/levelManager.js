import Grid from '../grid/grid';
import StaticInstancedRenderer from '../StaticInstancedRenderer/StaticInstancedRenderer';
import DungeonLight from '../light/dungeonLight';
import CONSTANTS from '../static/constants';
import CellInteractionController from '../interaction/cellInteractionController';
import Player from '../entity/Player';
import EnemiesManager from '../EnemiesManager/EnemiesManager';
import LootManager from '../LootManager/lootManager';
export default class LevelManager {
  constructor(options, player) {
    this.cols = options.size.cols;
    this.rows = options.size.rows;
    this.doorsCount = options.doorsQuantity;
    this.camera = options.camera;
    this.domElement = options.domElement;

    this.step = CONSTANTS.CELL_SIZE + CONSTANTS.GAP_CELLS;
    this.halfW = ((this.cols - 1) * this.step) / 2;
    this.halfH = ((this.rows - 1) * this.step) / 2;
    this.cellInteractionController = null;
    this.player = player;
    this.grid = new Grid(this.cols, this.rows, {
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
      enemiesCount: options.enemies.length,
      lootGroundCount: options.loot.groundLoot.length,
    });
    this.nextLevel = options.nextLevel;
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
    this.light = new DungeonLight();
    this.player.syncMeshToCell(this.grid.getCellPlayer());
    // this.player = new Player(this.grid.getCellPlayer(), {
    //   name: 'player',
    //   hp: 2,
    //   atk: 2,
    //   def: 2,
    // });
    this.loot = new LootManager(options.loot, this.grid);
    this.enemies = new EnemiesManager(options.enemies, this.grid, this.loot);
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
          return;
        }
        if (cell.enemy) {
          const enemy = this.enemies.getEnemy(cell);
          this.player.tryAttack(enemy);
          const dieEnemies = this.enemies.tryAttack(this.player);
          this.loot.renderLootAfterDieEnemy(dieEnemies);
        } else {
          if (cell.loot) {
            console.log('выбрана клетка с лутом');
            const loot = this.loot.findLoot(cell);
            console.log('лут подобран', loot);
            this.player.getLoot(loot);
            console.log('итвентарь', this.player.inventory);
          }
          this.grid.movePlayerTo(cell);
          this.player.syncMeshToCell(cell);
          this.staticInstancedRenderer.updateVisible(
            this.grid.setVisibleCell(),
          );
          this.enemies.tryMove();
          this.enemies.syncVisible();
          this.loot.syncVisible();
        }
        this.staticInstancedRenderer.hightLightMoveCells(
          this.grid.getMoveCellsAroundPlayer(),
        );
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
    this.enemies.dispose();
    this.loot?.dispose();
    this.cellInteractionController = null;
    this.staticInstancedRenderer = null;
    this.light = null;
    this.grid = null;
    this.enemies = null;
    this.loot = null;
  }
}
