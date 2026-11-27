// Gobble Dash — tuning and world constants.
// One clear job: every number the game balances on lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 622;

// Player physics.
export const TURKEY_X = 268;
export const GRAVITY = 2600;
export const JUMP_VELOCITY = -980;
export const DOUBLE_JUMP_VELOCITY = -860;
export const DASH_TIME = 0.55;
export const DASH_SPEED_MULT = 1.85;
export const DASH_COOLDOWN = 3.0;
export const INVULN_TIME = 1.4;

// Run pacing.
export const BASE_SPEED = 265;
export const SPEED_PER_METER = 0.16;
export const MAX_SPEED = 545;
export const PX_PER_METER = 40;
export const ESCAPE_DISTANCE = 1500;

// The farmer: how close he may get, how fast he closes in.
export const FARMER_START_GAP = 150;
export const FARMER_CATCH_GAP = 46;
export const FARMER_STUMBLE_GAIN = 52;
export const FARMER_DRIFT_BACK = 9;

// Zones of the escape: farmyard, then the barn, then the kitchen.
export const ZONES = [
  {
    name: "FARMYARD",
    from: 0,
    to: 500,
    skyTop: "#f6b95e",
    skyMid: "#fbd28a",
    skyBot: "#f9e3b0",
    hillFar: "#c98a3d",
    hillNear: "#a86a2c",
    ground: "#8a5a24",
    groundTop: "#b57e35",
    accent: "#7a4a1a",
  },
  {
    name: "THE BARN",
    from: 500,
    to: 1000,
    skyTop: "#e08a4e",
    skyMid: "#f0a868",
    skyBot: "#f7cf96",
    hillFar: "#9c5a30",
    hillNear: "#7c4522",
    ground: "#6e4520",
    groundTop: "#96682e",
    accent: "#5d3413",
  },
  {
    name: "THE KITCHEN",
    from: 1000,
    to: 1500,
    skyTop: "#c96a3e",
    skyMid: "#e08a58",
    skyBot: "#f2b57e",
    hillFar: "#7c3f22",
    hillNear: "#5e2f18",
    ground: "#59371c",
    groundTop: "#7d4f26",
    accent: "#47220e",
  },
];

// Scoring.
export const CORN_POINTS = 10;
export const COMBO_STEP = 2;
export const MAX_COMBO = 12;
export const DISTANCE_POINTS_PER_METER = 1;
export const ESCAPE_BONUS = 500;
