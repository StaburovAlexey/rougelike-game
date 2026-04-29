const STATIC = {
  CELL_SIZE: 1,
  GAP_CELLS: 0.1,
  HIDDEN_SCALE: 0.001,
  OBSTACLES_DENSITY: 0.099,
};

const COLORS = new Map([
  ["ROCK_WALL_COLOR", "#73808d"],
  ["Border", "#1b1e20"],
  ["TORCH_COLOR", "#4c647c"],
  ["HANDLE_COLOR", "#bbca36"],
  ["DOOR_COLOR", "#915b1e"],
  ["SHIELD_WOOD_COLOR", "#7b5630"],
  ["SHIELD_STEEL_COLOR", "#6486a8"],
  ["BOX_WOOD_COLOR", "#8a643b"],
  ["BOX_STEEL_COLOR", "#384553"],
  ["BONFIRE_WOOD_COLOR", "#875a29"],
  ["WallWood", "#904c04"],
  ["Bush", "#3d9c45"],
  ["Berry", "#cb2727"],
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
