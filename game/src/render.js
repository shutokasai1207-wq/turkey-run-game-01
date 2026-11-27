// Gobble Dash — HUD, title screen, pause screen and end screens.
// One clear job: everything drawn on top of the world.

import { VIEW_W, VIEW_H, GROUND_Y, ESCAPE_DISTANCE } from "./config.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(32, 18, 9, 0.82)";
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = "#e8a13a";
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawHearts(ctx, hearts) {
  for (let i = 0; i < 3; i++) {
    const x = 36 + i * 44;
    const y = 40;
    ctx.fillStyle = i < hearts ? "#d93a2b" : "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 14, y - 6, x - 6, y - 16, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 16, x + 14, y - 6, x, y + 8);
    ctx.fill();
  }
}

export function drawHUD(ctx, game) {
  const { score, distance, corn, combo, turkey, farmer, zone } = game;

  // Top bar.
  ctx.fillStyle = "rgba(32, 18, 9, 0.55)";
  ctx.fillRect(0, 0, VIEW_W, 64);

  drawHearts(ctx, turkey.hearts);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = "bold 30px 'Trebuchet MS', sans-serif";
  ctx.fillText("SCORE " + score, 170, 42);

  ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffd65a";
  ctx.fillText("🌽 " + corn, 470, 40);

  if (combo >= 3) {
    ctx.fillStyle = "#ff9d3c";
    ctx.font = "bold 24px 'Trebuchet MS', sans-serif";
    ctx.fillText("COMBO x" + combo, 580, 40);
  }

  // Zone + distance progress.
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
  ctx.fillText(zone.name + "  ·  " + Math.floor(distance) + "m / " + ESCAPE_DISTANCE + "m", VIEW_W - 24, 40);

  // Progress bar to the forest gate.
  const barX = 780;
  const barW = 380;
  const barY = 52;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  roundRect(ctx, barX, barY, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = "#5da83a";
  roundRect(ctx, barX, barY, barW * Math.min(1, distance / ESCAPE_DISTANCE), 8, 4);
  ctx.fill();

  // Farmer proximity warning.
  if (farmer.gap < 130 && !turkey.dead) {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 130);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#d93a2b";
    ctx.font = "bold 30px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚠ THE FARMER IS RIGHT BEHIND YOU! ⚠", VIEW_W / 2, 108);
    ctx.globalAlpha = 1;
  }

  // Dash cooldown pip.
  const cd = turkey.dashCooldown;
  ctx.textAlign = "left";
  ctx.font = "bold 18px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = cd > 0 ? "rgba(255,255,255,0.5)" : "#7ee0ff";
  ctx.fillText(cd > 0 ? "DASH …" : "DASH READY [SHIFT]", 24, VIEW_H - 18);
}

export function drawTitle(ctx, game, t) {
  ctx.fillStyle = "rgba(32, 18, 9, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd65a";
  ctx.font = "bold 92px 'Trebuchet MS', sans-serif";
  ctx.shadowColor = "#7a3b12";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 6;
  ctx.fillText("GOBBLE DASH", VIEW_W / 2, 190);
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Trebuchet MS', sans-serif";
  ctx.fillText("Turkey's Great Escape", VIEW_W / 2, 248);

  ctx.font = "22px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffe9b0";
  ctx.fillText("Thanksgiving is coming. The farmer is coming faster.", VIEW_W / 2, 296);
  ctx.fillText("Run 1500m from the farmyard, through the barn, past the kitchen —", VIEW_W / 2, 328);
  ctx.fillText("and out the forest gate. Dodge bales, fences, knives and the oven!", VIEW_W / 2, 360);

  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  panel(ctx, VIEW_W / 2 - 300, 410, 600, 76);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px 'Trebuchet MS', sans-serif";
  ctx.fillText("CLICK or press SPACE to run!", VIEW_W / 2, 459);
  ctx.globalAlpha = 1;

  ctx.font = "20px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffd65a";
  ctx.fillText("SPACE jump (twice for double jump)  ·  DOWN slide  ·  SHIFT dash  ·  P pause  ·  M mute", VIEW_W / 2, 540);
  ctx.fillText("Grab corn for points — chains build your combo. Don't let the farmer catch you!", VIEW_W / 2, 572);

  if (game.best > 0) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
    ctx.fillText("BEST SCORE: " + game.best, VIEW_W / 2, 624);
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = "rgba(32, 18, 9, 0.6)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px 'Trebuchet MS', sans-serif";
  ctx.fillText("PAUSED", VIEW_W / 2, 330);
  ctx.font = "24px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#ffe9b0";
  ctx.fillText("Press P to keep running", VIEW_W / 2, 380);
}

export function drawEnd(ctx, game, escaped, t) {
  ctx.fillStyle = escaped ? "rgba(20, 60, 20, 0.55)" : "rgba(60, 10, 10, 0.6)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  panel(ctx, VIEW_W / 2 - 380, 130, 760, 430);
  ctx.textAlign = "center";

  if (escaped) {
    ctx.fillStyle = "#7ee0a0";
    ctx.font = "bold 76px 'Trebuchet MS', sans-serif";
    ctx.fillText("ESCAPED!", VIEW_W / 2, 240);
    ctx.fillStyle = "#ffffff";
    ctx.font = "26px 'Trebuchet MS', sans-serif";
    ctx.fillText("You made it out the forest gate — no Thanksgiving dinner for you!", VIEW_W / 2, 292);
    ctx.fillText("The farmer is still looking for you. Gobble gobble!", VIEW_W / 2, 328);
  } else {
    ctx.fillStyle = "#ff8a7a";
    ctx.font = "bold 76px 'Trebuchet MS', sans-serif";
    ctx.fillText("CAUGHT!", VIEW_W / 2, 240);
    ctx.fillStyle = "#ffffff";
    ctx.font = "26px 'Trebuchet MS', sans-serif";
    ctx.fillText("The farmer got you… and the oven was already warm.", VIEW_W / 2, 292);
    ctx.fillText("Better luck next Thanksgiving!", VIEW_W / 2, 328);
  }

  ctx.fillStyle = "#ffd65a";
  ctx.font = "bold 34px 'Trebuchet MS', sans-serif";
  ctx.fillText("SCORE  " + game.score, VIEW_W / 2, 400);
  ctx.fillStyle = "#ffffff";
  ctx.font = "22px 'Trebuchet MS', sans-serif";
  ctx.fillText(
    "Distance " + Math.floor(game.distance) + "m   ·   Corn " + game.corn +
    "   ·   Best combo x" + game.bestCombo + "   ·   Best score " + game.best,
    VIEW_W / 2, 448,
  );

  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px 'Trebuchet MS', sans-serif";
  ctx.fillText("Press R or CLICK to run again", VIEW_W / 2, 512);
  ctx.globalAlpha = 1;
}
