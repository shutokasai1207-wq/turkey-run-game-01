// Gobble Dash — the game loop, state machine and input.
// One clear job: title → playing → paused → caught/escaped, and back.

import { VIEW_W, VIEW_H, GROUND_Y, BASE_SPEED, SPEED_PER_METER, MAX_SPEED, ESCAPE_DISTANCE, ESCAPE_BONUS, CORN_POINTS, COMBO_STEP, MAX_COMBO, FARMER_STUMBLE_GAIN, FARMER_DRIFT_BACK, DISTANCE_POINTS_PER_METER } from "./config.js";
import { Turkey } from "./turkey.js";
import { Farmer } from "./farmer.js";
import { World } from "./world.js";
import { drawHUD, drawTitle, drawPaused, drawEnd } from "./render.js";
import {
  ensureAudio, setMuted, isMuted, startMusic, stopMusic,
  sfxJump, sfxDoubleJump, sfxCorn, sfxHit, sfxDash,
  sfxCaught, sfxEscaped, sfxClick, sfxZone,
} from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const turkey = new Turkey();
const farmer = new Farmer();
const world = new World();

const game = {
  state: "title", // title | playing | paused | caught | escaped
  score: 0,
  distance: 0,
  corn: 0,
  combo: 0,
  bestCombo: 0,
  best: 0,
  zone: world.zone(),
  turkey,
  farmer,
  time: 0,
};

try {
  game.best = parseInt(localStorage.getItem("gobble-dash-best") || "0", 10) || 0;
} catch (e) {
  game.best = 0;
}

function saveBest() {
  try {
    localStorage.setItem("gobble-dash-best", String(game.best));
  } catch (e) {
    /* storage unavailable: best score is session-only */
  }
}

function resetRun() {
  turkey.reset();
  farmer.reset();
  world.reset();
  game.score = 0;
  game.distance = 0;
  game.corn = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.zone = world.zone();
  game.state = "playing";
}

function startRun() {
  ensureAudio();
  sfxClick();
  resetRun();
  startMusic();
}

function endRun(escaped) {
  game.state = escaped ? "escaped" : "caught";
  if (escaped) game.score += ESCAPE_BONUS;
  if (game.score > game.best) {
    game.best = game.score;
    saveBest();
  }
  stopMusic();
  if (escaped) sfxEscaped();
  else sfxCaught();
}

function togglePause() {
  if (game.state === "playing") {
    game.state = "paused";
    stopMusic();
  } else if (game.state === "paused") {
    game.state = "playing";
    startMusic();
  }
}

function speedNow() {
  const s = BASE_SPEED + game.distance * SPEED_PER_METER;
  return Math.min(MAX_SPEED, s) * (turkey.isDashing ? 1.85 : 1);
}

function update(dt) {
  game.time += dt;
  const speed = speedNow();

  turkey.update(dt, speed);
  farmer.update(dt, speed, false);

  const prevZone = game.zone;
  world.update(dt, speed, turkey);
  game.distance = world.distance;
  game.zone = world.zone();
  if (game.zone.name !== prevZone.name) sfxZone();

  // Corn.
  const got = world.collectCorn(turkey);
  if (got > 0) {
    game.corn += got;
    game.combo = Math.min(MAX_COMBO, game.combo + got);
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    game.score += got * CORN_POINTS * (1 + Math.floor(game.combo / COMBO_STEP));
    sfxCorn(game.combo);
    world.burst(turkey.x + 20, turkey.top + 30, "#ffd65a", 6);
    farmer.loseGround(FARMER_DRIFT_BACK * got);
  }

  // Obstacles.
  const hit = world.hitObstacle(turkey);
  if (hit) {
    if (hit.kind === "puddle") {
      // A puddle only slows the turkey and lets the farmer close in.
      world.markHit(hit);
      farmer.gainGround(FARMER_STUMBLE_GAIN * 0.6);
      game.combo = 0;
      world.burst(turkey.x, GROUND_Y - 10, "#7ec8e3", 10);
      sfxHit();
    } else if (turkey.stumble()) {
      world.markHit(hit);
      farmer.gainGround(FARMER_STUMBLE_GAIN);
      game.combo = 0;
      world.burst(turkey.x, turkey.top + 30, "#d93a2b", 12);
      sfxHit();
    }
  }

  // The farmer catches up.
  if (farmer.caught || turkey.dead) {
    endRun(false);
    return;
  }

  // The forest gate: escaped!
  if (game.distance >= ESCAPE_DISTANCE) {
    endRun(true);
    return;
  }

  game.score = Math.max(game.score, Math.floor(game.distance) * DISTANCE_POINTS_PER_METER + game.corn * CORN_POINTS);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  world.draw(ctx, game.time);
  farmer.draw(ctx, game.time);
  if (game.state !== "title") turkey.draw(ctx, game.time);
  if (game.state === "playing" || game.state === "paused") drawHUD(ctx, game);
  if (game.state === "title") drawTitle(ctx, game, game.time);
  if (game.state === "paused") drawPaused(ctx);
  if (game.state === "caught") drawEnd(ctx, game, false, game.time);
  if (game.state === "escaped") drawEnd(ctx, game, true, game.time);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.state === "playing") update(dt);
  else game.time += dt;
  draw();
  requestAnimationFrame(loop);
}

// ---- input ----
window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const k = e.code;
  if (k === "Space" || k === "ArrowUp" || k === "KeyW") {
    e.preventDefault();
    ensureAudio();
    if (game.state === "title" || game.state === "caught" || game.state === "escaped") {
      startRun();
      return;
    }
    if (game.state === "playing") {
      const r = turkey.jump();
      if (r === "jump") sfxJump();
      else if (r === "double") sfxDoubleJump();
    }
  } else if (k === "ArrowDown" || k === "KeyS") {
    if (game.state === "playing") turkey.startDuck();
  } else if (k === "ShiftLeft" || k === "ShiftRight" || k === "KeyX") {
    if (game.state === "playing" && turkey.dash()) sfxDash();
  } else if (k === "KeyP" || k === "Escape") {
    togglePause();
  } else if (k === "KeyM") {
    ensureAudio();
    setMuted(!isMuted());
  } else if (k === "KeyR") {
    if (game.state === "caught" || game.state === "escaped" || game.state === "paused") startRun();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown" || e.code === "KeyS") turkey.stopDuck();
});

canvas.addEventListener("pointerdown", (e) => {
  ensureAudio();
  if (game.state === "title" || game.state === "caught" || game.state === "escaped") {
    startRun();
    return;
  }
  if (game.state === "playing") {
    const rect = canvas.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    if (y > 0.72) {
      turkey.startDuck();
      setTimeout(() => turkey.stopDuck(), 350);
    } else {
      const r = turkey.jump();
      if (r === "jump") sfxJump();
      else if (r === "double") sfxDoubleJump();
    }
  }
});

// ---- deterministic scenes for screenshots (used by the maker's tooling only) ----
window.__gobble = {
  game,
  setScene(name) {
    if (name === "title") {
      game.state = "title";
      world.reset();
      game.zone = world.zone();
      game.time = 1.2;
    } else if (name === "farm") {
      resetRun();
      game.state = "playing";
      world.distance = 120;
      game.distance = 120;
      world.obstacles.length = 0;
      world.corns.length = 0;
      world.spawnObstacle(760, "bale");
      world.spawnObstacle(980, "fence");
      world.spawnCornArc(560, 5);
      game.corn = 6;
      game.combo = 4;
      game.score = 320;
      game.time = 2.0;
    } else if (name === "kitchen") {
      resetRun();
      game.state = "playing";
      world.distance = 1120;
      game.distance = 1120;
      game.zone = world.zone();
      world.zoneIndex = 2;
      world.obstacles.length = 0;
      world.corns.length = 0;
      world.spawnObstacle(820, "oven");
      world.spawnObstacle(1040, "knife");
      world.spawnCornArc(600, 4);
      farmer.gap = 96;
      game.corn = 21;
      game.combo = 7;
      game.score = 1890;
      game.time = 3.0;
    } else if (name === "escaped") {
      resetRun();
      game.state = "escaped";
      game.distance = 1500;
      game.corn = 34;
      game.bestCombo = 9;
      game.score = 2450;
      game.best = 2450;
      game.time = 1.5;
    } else if (name === "caught") {
      resetRun();
      game.state = "caught";
      turkey.hearts = 0;
      game.distance = 640;
      game.corn = 12;
      game.bestCombo = 5;
      game.score = 980;
      game.best = 2450;
      game.time = 1.5;
    }
    draw();
  },
};

requestAnimationFrame(loop);
