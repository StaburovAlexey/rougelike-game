const STATIC = {
  CELL_SIZE: 1,
  GAP_CELLS: 0.1,
  HIDDEN_SCALE: 0.001,
  OBSTACLES_DENSITY: 0.099,
};

const COLORS = new Map([
  ["RockWall_1", "#73808d"],
  ["Border_1", "#1b1e20"],
  ["Torch_1", "#4c647c"],
  ["Handle_1", "#bbca36"],
  ["Door_1", "#684217"],
  ["SHIELD_WOOD_COLOR", "#7b5630"],
  ["SHIELD_STEEL_COLOR", "#6486a8"],
  ["BoxWood_1", "#8a643b"],
  ["BoxSteel_1", "#384553"],
  ["BONFIRE_WOOD_COLOR", "#875a29"],
  ["WallWood", "#904c04"],
  ["Bush_1", "#3d9c45"],
  ["Berry_1", "#cb2727"],
]);

const CONSTANTS = {
  ...STATIC,
  ...Object.fromEntries(COLORS),
  WAll_WOOD_COLOR: COLORS.get("WallWood"),
  BERRY_COLOR: COLORS.get("Berry"),
  BUSH_COLOR: COLORS.get("Bush"),
};

export { COLORS, STATIC };
export default CONSTANTS;
