// Gobble Dash — the farmer: he chases, he searches, he corners.
// One clear job: the pursuer's brain and how he looks.

import { GROUND_Y, FARMER_START_GAP, FARMER_CATCH_GAP } from "./config.js";

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = FARMER_START_GAP;
    this.runCycle = 0;
    this.mood = "chase"; // chase | close | cornered
    this.grumbleTimer = 0;
    this.armSwing = 0;
  }

  get x() {
    return 268 - this.gap - 70;
  }

  get caught() {
    return this.gap <= FARMER_CATCH_GAP;
  }

  gainGround(amount) {
    this.gap = Math.max(FARMER_CATCH_GAP, this.gap - amount);
  }

  loseGround(amount) {
    this.gap = Math.min(420, this.gap + amount);
  }

  update(dt, playerSpeed, playerStumbled) {
    this.runCycle += dt * (playerSpeed / 24);
    this.armSwing += dt * 9;
    if (this.grumbleTimer > 0) this.grumbleTimer -= dt;

    if (this.gap > 240) this.mood = "chase";
    else if (this.gap > 110) this.mood = "close";
    else this.mood = "cornered";

    // He never quite gives up: he drifts a little closer over time,
    // and a stumble lets him surge. Picking up corn slows him.
    if (!playerStumbled) this.gap = Math.max(90, this.gap - dt * 1.2);
  }

  draw(ctx, t) {
    const x = this.x;
    const y = GROUND_Y;
    const legSwing = Math.sin(this.runCycle) * 16;
    const bob = Math.abs(Math.sin(this.runCycle)) * 4;

    ctx.save();
    ctx.translate(x, y - bob);

    // Legs: blue overalls.
    ctx.strokeStyle = "#2e4a7a";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, -52);
    ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(6, -52);
    ctx.lineTo(6 - legSwing, 0);
    ctx.stroke();

    // Body: red plaid shirt.
    ctx.fillStyle = "#b03a2a";
    ctx.fillRect(-20, -108, 40, 58);
    ctx.strokeStyle = "#7c2418";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -88);
    ctx.lineTo(20, -88);
    ctx.moveTo(-20, -68);
    ctx.lineTo(20, -68);
    ctx.moveTo(0, -108);
    ctx.lineTo(0, -50);
    ctx.stroke();

    // Overalls straps.
    ctx.strokeStyle = "#2e4a7a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-12, -108);
    ctx.lineTo(-8, -78);
    ctx.moveTo(12, -108);
    ctx.lineTo(8, -78);
    ctx.stroke();

    // Head.
    ctx.fillStyle = "#f2c79b";
    ctx.beginPath();
    ctx.arc(4, -126, 17, 0, Math.PI * 2);
    ctx.fill();
    // Beard.
    ctx.fillStyle = "#e8e0cc";
    ctx.beginPath();
    ctx.ellipse(6, -112, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyes.
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-4, -130);
    ctx.lineTo(4, -127);
    ctx.moveTo(14, -127);
    ctx.lineTo(20, -130);
    ctx.stroke();
    // Straw hat.
    ctx.fillStyle = "#e3c565";
    ctx.beginPath();
    ctx.ellipse(4, -140, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-12, -156, 32, 18);
    ctx.fillStyle = "#b03a2a";
    ctx.fillRect(-12, -142, 32, 5);

    // Pitchfork arm, waving.
    const wave = Math.sin(this.armSwing) * 6;
    ctx.strokeStyle = "#f2c79b";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(16, -96);
    ctx.lineTo(34, -116 + wave);
    ctx.stroke();
    ctx.strokeStyle = "#8a6a3a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, -122 + wave);
    ctx.lineTo(52, -160 + wave);
    ctx.stroke();
    ctx.strokeStyle = "#c9c9c9";
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(52 + i * 5, -160 + wave);
      ctx.lineTo(56 + i * 6, -176 + wave);
      ctx.stroke();
    }

    // Shout bubble when he is close.
    if (this.mood !== "chase" && Math.floor(t * 1.4) % 2 === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#3a2a18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(18, -196, 118, 34, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3a2a18";
      ctx.font = "bold 20px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.mood === "cornered" ? "GOTCHA!" : "COME BACK!", 77, -173);
      ctx.beginPath();
      ctx.moveTo(30, -164);
      ctx.lineTo(22, -150);
      ctx.lineTo(44, -164);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
