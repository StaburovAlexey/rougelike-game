import Grid from "../grid/grid";
import * as THREE from "three";
import StaticInstancedRenderer from "../StaticInstancedRenderer/StaticInstancedRenderer";
import DungeonLight from "../light/dungeonLight";
import CONSTANTS from "../static/constants";
import CellInteractionController from "../interaction/cellInteractionController";
import Player from "../entity/Player";
import EnemiesManager from "../EnemiesManager/EnemiesManager";
import LootManager from "../LootManager/lootManager";
import materialManager from "../core/materialManager";
import { buildLevelRewardItem } from "../runManager/generateLoot";

const PLAYER_LIGHT_COLOR = 0xffc36a;
const PLAYER_LIGHT_BASE_INTENSITY = 1.8;
const PLAYER_LIGHT_INTENSITY_PER_CELL = 0.55;
const PLAYER_LIGHT_DECAY = 1;
const PLAYER_LIGHT_EXTRA_RADIUS_CELLS = 0.95;
const PLAYER_LIGHT_EXTRA_RADIUS_START = 3;
const PLAYER_LIGHT_EXTRA_RADIUS_PER_CELL = 0.35;

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
    this.playerLight = null;
    this.grid = new Grid(this.cols, this.rows, {
      halfW: this.halfW,
      halfH: this.halfH,
      doorsCount: this.doorsCount,
      enemiesCount: options.enemies.length,
      lootGroundCount: options.groundLoot.length,
      indexLevel: options.index,
      player: this.player,
    });
    this.grid.setVisibleCell(this.#getPlayerLightRadius());
    this.startAction = false;
    this.nextLevel = options.nextLevel;
    this.levelIndex = options.index;
    this.levelReward = options.levelReward ?? [];
    materialManager.setPrefixLevel(this.levelPrefix);
    this.staticInstancedRenderer = new StaticInstancedRenderer(this.grid);
    this.light = new DungeonLight();
    this.player.syncMeshToCell(this.grid.getCellPlayer(), true);
    this.#createPlayerLight();
    this.loot = new LootManager(
      options.groundLoot,
      this.grid,
      this.player,
      options.index,
      options.difficulty,
    );
    this.enemies = new EnemiesManager(options.enemies, this.grid, this.loot);
    this.#syncEntityLighting();
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
          const extraCount = this.player.rewardBonus;
          for (let i = 0; i < extraCount; i++) {
            const item = buildLevelRewardItem(
              this.levelIndex,
              this.player.rarityBonus,
            );
            if (item) this.player.getLoot({ ...item, loot: item });
          }
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
            this.#syncEntityLighting();
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
            this.grid.setVisibleCell(this.#getPlayerLightRadius()),
          );
          this.#syncPlayerLight();
        }
        this.enemies.tryMove();
        this.enemies.syncVisible();
        this.#syncEntityLighting();
        this.loot.syncVisible();
        this.staticInstancedRenderer.hightLightMoveCells(
          this.grid.getMoveCellsAroundPlayer(),
        );
        this.startAction = false;
      },
    });
    this.staticInstancedRenderer.hightLightMoveCells(
      this.grid.getMoveCellsAroundPlayer(),
    );
  }

  #createPlayerLight() {
    if (!this.player?.mesh || this.playerLight) return;

    this.playerLight = new THREE.PointLight(PLAYER_LIGHT_COLOR);
    this.playerLight.castShadow = false;
    this.player.mesh.add(this.playerLight);
    this.#syncPlayerLight();
  }

  #getPlayerLightRadius() {
    return this.player?.lightRadius ?? 4;
  }

  #getPlayerLightDistance() {
    const radius = this.#getPlayerLightRadius();
    const radiusOverflow = Math.max(
      0,
      radius - PLAYER_LIGHT_EXTRA_RADIUS_START,
    );
    const extraRadius =
      PLAYER_LIGHT_EXTRA_RADIUS_CELLS +
      radiusOverflow * PLAYER_LIGHT_EXTRA_RADIUS_PER_CELL;

    return (radius + extraRadius) * this.step;
  }

  #syncPlayerLight() {
    if (!this.playerLight) return;

    const radius = this.#getPlayerLightRadius();
    this.playerLight.intensity =
      PLAYER_LIGHT_BASE_INTENSITY + radius * PLAYER_LIGHT_INTENSITY_PER_CELL;
    this.playerLight.distance = this.#getPlayerLightDistance();
    this.playerLight.decay = PLAYER_LIGHT_DECAY;
    this.playerLight.position.set(0, 0.35, 0);
  }

  #syncEntityLighting() {
    this.player?.setLightIntensity(1);
    const playerCell = this.grid?.getCellPlayer();
    const lightRadius = this.#getPlayerLightRadius();
    const lightCells = this.staticInstancedRenderer?.getLightCells();

    this.enemies?.syncLighting(playerCell, lightRadius, lightCells);
    this.loot?.syncLighting(playerCell, lightRadius, lightCells);
    this.staticInstancedRenderer?.syncDoorLighting(playerCell, lightRadius, lightCells);
  }

  clearLevel() {
    this.cellInteractionController?.dispose();
    if (this.playerLight) {
      this.playerLight.parent?.remove(this.playerLight);
      this.playerLight.dispose?.();
    }
    this.staticInstancedRenderer.dispose();
    this.light.dispose();
    this.enemies.dispose();
    this.loot?.dispose();
    this.cellInteractionController = null;
    this.playerLight = null;
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
