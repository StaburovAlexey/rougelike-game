const STATIC = {
  CELL_SIZE: 1,
  GAP_CELLS: 0.1,
  FLOOR_HEIGHT: 0.2,
  HIDDEN_SCALE: 0.001,
  OBSTACLES_DENSITY: 0.099,
};

const COLORS = new Map([
  ["RockWall_1", "#73808d"],
  ["Border_1", "#1b1e20"],
  ["Torch_1", "#4c647c"],
  ["Handle_1", "#bbca36"],
  ["Door_1", "#684217"],
  ["ShieldWood_1", "#7b5630"],
  ["ShieldSteel_1", "#6486a8"],
  ["BoxWood_1", "#8a643b"],
  ["BoxSteel_1", "#384553"],
  ["Bonfire_1", "#875a29"],
  ["Bush_1", "#3d9c45"],
  ["Berry_1", "#cb2727"],
  ["Tube_1", "#384553"],
  ["Wood_1", "#875a29"],
  ["ArmoreSteel_1", "#44607d"],
  ["Bones_1", "#dad8b2"],
  ["Flag_1", "#2dad28"],
]);

const CONSTANTS = {
  ...STATIC,
  ...Object.fromEntries(COLORS),
};

export { COLORS, STATIC };
export default CONSTANTS;
