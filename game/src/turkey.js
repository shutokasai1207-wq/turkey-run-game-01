// Gobble Dash — the turkey: physics, running, jumping, sliding, dashing.
// One clear job: everything the player character does and how it looks.

import {
  GRAVITY,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  DASH_TIME,
  DASH_COOLDOWN,
  INVULN_TIME,
  TURKEY_X,
  GROUND_Y,
} from "./config.js";

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.jumpsUsed = 0;
    this.ducking = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnTimer = 0;
    this.hearts = 3;
    this.runCycle = 0;
    this.stumbleTimer = 0;
    this.dead = false;
  }

  get width() {
    return 64;
  }

  get height() {
    return this.ducking ? 44 : 72;
  }

  get top() {
    return this.y - this.height;
  }

  get bottom() {
    return this.y;
  }

  get left() {
    return this.x - this.width / 2;
  }

  get right() {
    return this.x + this.width / 2;
  }

  get isDashing() {
    return this.dashTimer > 0;
  }

  jump() {
    if (this.dead) return false;
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.jumpsUsed = 1;
      this.ducking = false;
      return "jump";
    }
    if (this.jumpsUsed < 2) {
      this.vy = DOUBLE_JUMP_VELOCITY;
      this.jumpsUsed = 2;
      return "double";
    }
    return false;
  }

  startDuck() {
    if (this.onGround) this.ducking = true;
  }

  stopDuck() {
    this.ducking = false;
  }

  dash() {
    if (this.dead || this.dashCooldown > 0 || this.isDashing) return false;
    this.dashTimer = DASH_TIME;
    this.dashCooldown = DASH_COOLDOWN;
    this.invulnTimer = Math.max(this.invulnTimer, DASH_TIME + 0.1);
    return true;
  }

  stumble() {
    if (this.invulnTimer > 0 || this.dead) return false;
    this.hearts -= 1;
    this.invulnTimer = INVULN_TIME;
    this.stumbleTimer = 0.45;
    if (this.hearts <= 0) this.dead = true;
    return true;
  }

  update(dt, speed) {
    this.runCycle += dt * (this.onGround ? speed / 26 : 4);
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;

    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        this.jumpsUsed = 0;
      }
    }
  }

  draw(ctx, t) {
    const blink = this.invulnTimer > 0 && Math.floor(t * 14) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.stumbleTimer > 0) ctx.rotate(0.12 * Math.sin(t * 40));

    const legSwing = this.onGround ? Math.sin(this.runCycle) * 14 : 8;
    const bodyY = this.ducking ? -26 : -40;

    // Tail fan.
    ctx.fillStyle = "#7a3b12";
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-26, bodyY - 6);
      ctx.rotate(i * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -22, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c97b2e";
      ctx.beginPath();
      ctx.ellipse(0, -34, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7a3b12";
      ctx.restore();
    }

    // Legs.
    ctx.strokeStyle = "#e8a13a";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, bodyY + 16);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, bodyY + 16);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    // Body.
    ctx.fillStyle = "#8a4a1d";
    ctx.beginPath();
    ctx.ellipse(0, bodyY, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a85e26";
    ctx.beginPath();
    ctx.ellipse(-4, bodyY + 4, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing.
    ctx.fillStyle = "#6e3712";
    ctx.beginPath();
    ctx.ellipse(-6, bodyY - 2, 16, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Head.
    ctx.fillStyle = "#8a4a1d";
    ctx.beginPath();
    ctx.arc(24, bodyY - 26, 15, 0, Math.PI * 2);
    ctx.fill();
    // Beak.
    ctx.fillStyle = "#f2a541";
    ctx.beginPath();
    ctx.moveTo(36, bodyY - 30);
    ctx.lineTo(50, bodyY - 24);
    ctx.lineTo(36, bodyY - 20);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = "#d93a2b";
    ctx.beginPath();
    ctx.ellipse(34, bodyY - 14, 5, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(28, bodyY - 30, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(30, bodyY - 30, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Dash streak.
    if (this.isDashing) {
      ctx.strokeStyle = "rgba(255, 214, 90, 0.8)";
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-34 - i * 12, bodyY - 18 + i * 12);
        ctx.lineTo(-58 - i * 12, bodyY - 18 + i * 12);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
