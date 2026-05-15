import Grid from "../grid/grid";
import StaticInstancedRenderer from "../StaticInstancedRenderer/StaticInstancedRenderer";
import DungeonLight from "../light/dungeonLight";
import CONSTANTS from "../static/constants";
import CellInteractionController from "../interaction/cellInteractionController";
import Player from "../entity/Player";
import EnemiesManager from "../EnemiesManager/EnemiesManager";
import LootManager from "../LootManager/lootManager";
import materialManager from "../core/materialManager";
export default class LevelManager {
  constructor(options, player) {
    this.cols = options.size.cols;
    this.rows = options.size.rows;
    this.doorsCount = options.doorsQuantity;
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.levelPrefix = options.levelPrefix;
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
      lootGroundCount: options.groundLoot.length,
    });
    this.startAction = false;
    this.nextLevel = options.nextLevel;
    this.levelReward = options.levelReward ?? [];
    materialManager.setPrefixLevel(this.levelPrefix);
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
    this.light = new DungeonLight();
    this.player.syncMeshToCell(this.grid.getCellPlayer(), true);
    this.loot = new LootManager(
      options.groundLoot,
      this.grid,
      this.player,
      options.index,
      options.difficulty,
    );
    this.enemies = new EnemiesManager(options.enemies, this.grid, this.loot);
    this.cellInteractionController = new CellInteractionController({
      camera: this.camera,
      domElement: this.domElement,
      grid: this.grid,
      renderer: this.staticInstancedRenderer,
      onHoverChange: (cell) => {},
      onCellClick: async (cell) => {
        if (this.startAction) return;
        this.startAction = true;

        if (!this.grid.isEventCell(cell)) {
          this.startAction = false;
          return;
        }
        if (cell.type === "door" && cell.doorRole === "out") {
          for (const item of this.levelReward) {
            this.player.getLoot({ ...item, loot: item });
          }
          this.nextLevel?.();
          this.startAction = false;
          return;
        }
        if (cell.enemy) {
          const enemy = this.enemies.getEnemy(cell);
          await this.player.tryAttack(enemy);
          if (enemy.hp < 1) {
            this.enemies.enemyDie(enemy);
            this.loot.renderLootAfterDieEnemy([enemy]);
          }
          await this.enemies.tryAttack(this.player);
        } else {
          if (cell.loot) {
            const loot = this.loot.findLoot(cell);
            if (loot) this.player.getLoot(loot);
          }
          this.grid.movePlayerTo(cell);
          this.player.faceMovementToward(cell.worldX, cell.worldZ, this.camera);
          this.player.syncMeshToCell(cell);
          this.staticInstancedRenderer.updateVisible(
            this.grid.setVisibleCell(),
          );
        }
        this.enemies.tryMove();
        this.enemies.syncVisible();
        this.loot.syncVisible();
        this.staticInstancedRenderer.hightLightMoveCells(
          this.grid.getMoveCellsAroundPlayer(),
        );
        this.startAction = false;
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

  update(delta, camera) {
    this.staticInstancedRenderer?.update(delta, camera);
    this.player?.update(delta, camera);
    this.enemies?.update(delta, camera);
  }
}
