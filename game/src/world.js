// Gobble Dash — the world: farmyard, barn and kitchen scroll past.
// Spawns obstacles, corn and hazards; moves them; tests collisions.
// One clear job: everything the turkey runs through.

import { VIEW_W, VIEW_H, GROUND_Y, ZONES, PX_PER_METER } from "./config.js";

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 0;
    this.scrollX = 0;
    this.obstacles = [];
    this.corns = [];
    this.particles = [];
    this.nextSpawnX = VIEW_W + 200;
    this.spawnGap = 420;
    this.knifeTimer = 0;
    this.zoneIndex = 0;
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ x: rand(0, VIEW_W), y: rand(40, 180), s: rand(0.6, 1.4), v: rand(6, 16) });
    }
    this.fencePosts = [];
    for (let x = 0; x < VIEW_W + 120; x += 110) this.fencePosts.push(x);
    this.puddles = [];
  }

  zone() {
    let zi = 0;
    for (let i = 0; i < ZONES.length; i++) {
      if (this.distance >= ZONES[i].from) zi = i;
    }
    return ZONES[zi];
  }

  zoneIndexNow() {
    return this.zone().name === "FARMYARD" ? 0 : this.zone().name === "THE BARN" ? 1 : 2;
  }

  spawnPattern(x) {
    const zi = this.zoneIndexNow();
    const roll = Math.random();
    if (zi === 0) {
      if (roll < 0.34) this.spawnObstacle(x, "bale");
      else if (roll < 0.6) this.spawnObstacle(x, "fence");
      else if (roll < 0.8) this.spawnObstacle(x, "puddle");
      else this.spawnCornArc(x, 4);
    } else if (zi === 1) {
      if (roll < 0.26) this.spawnObstacle(x, "bale");
      else if (roll < 0.46) this.spawnObstacle(x, "fence");
      else if (roll < 0.62) this.spawnObstacle(x, "knife");
      else if (roll < 0.78) this.spawnObstacle(x, "puddle");
      else this.spawnCornArc(x, 5);
    } else {
      if (roll < 0.24) this.spawnObstacle(x, "oven");
      else if (roll < 0.44) this.spawnObstacle(x, "knife");
      else if (roll < 0.62) this.spawnObstacle(x, "bale");
      else if (roll < 0.78) this.spawnObstacle(x, "fence");
      else this.spawnCornArc(x, 5);
    }
  }

  spawnObstacle(x, kind) {
    const base = { kind, x, passed: false, hit: false };
    if (kind === "bale") {
      base.w = 64;
      base.h = 58;
      base.y = GROUND_Y - base.h;
    } else if (kind === "fence") {
      base.w = 46;
      base.h = 74;
      base.y = GROUND_Y - base.h;
    } else if (kind === "puddle") {
      base.w = 110;
      base.h = 14;
      base.y = GROUND_Y - base.h;
    } else if (kind === "knife") {
      base.w = 26;
      base.h = 96;
      base.y = -120;
      base.falling = false;
      base.vy = 0;
    } else if (kind === "oven") {
      base.w = 92;
      base.h = 118;
      base.y = GROUND_Y - base.h;
      base.flame = 0;
    }
    this.obstacles.push(base);
  }

  spawnCornArc(x, n) {
    for (let i = 0; i < n; i++) {
      const cx = x + i * 44;
      const arcY = GROUND_Y - 120 - Math.sin((i / (n - 1)) * Math.PI) * 90;
      this.corns.push({ x: cx, y: arcY, taken: false, bob: Math.random() * Math.PI * 2 });
    }
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(60, 260);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 120,
        life: rand(0.4, 0.9),
        maxLife: 0.9,
        color,
        size: rand(3, 7),
      });
    }
  }

  update(dt, speed, turkey) {
    const dx = speed * dt;
    this.distance += dx / PX_PER_METER;
    this.scrollX += dx;

    const zi = this.zoneIndexNow();
    if (zi !== this.zoneIndex) {
      this.zoneIndex = zi;
      this.obstacles.length = 0;
      this.corns.length = 0;
      this.nextSpawnX = VIEW_W + 260;
    }

    // Spawn ahead.
    this.nextSpawnX -= dx;
    if (this.nextSpawnX <= VIEW_W + 80) {
      const gap = Math.max(300, this.spawnGap - this.distance * 0.12);
      this.spawnPattern(VIEW_W + rand(60, 200));
      this.nextSpawnX = VIEW_W + gap;
    }

    // Move obstacles.
    for (const o of this.obstacles) {
      o.x -= dx;
      if (o.kind === "knife") {
        if (!o.falling && o.x < turkey.x + 320) o.falling = true;
        if (o.falling) {
          o.vy += 2600 * dt;
          o.y += o.vy * dt;
          if (o.y > GROUND_Y - o.h) o.y = GROUND_Y - o.h;
        }
      }
      if (o.kind === "oven") o.flame += dt * 6;
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -220);

    // Move corn.
    for (const c of this.corns) {
      c.x -= dx;
      c.bob += dt * 5;
    }
    this.corns = this.corns.filter((c) => c.x > -40 && !c.taken);

    // Particles.
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 700 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // Clouds and fence drift.
    for (const c of this.clouds) {
      c.x -= c.v * dt;
      if (c.x < -160) {
        c.x = VIEW_W + rand(40, 200);
        c.y = rand(40, 180);
      }
    }
    for (let i = 0; i < this.fencePosts.length; i++) {
      this.fencePosts[i] -= dx * 0.9;
      if (this.fencePosts[i] < -120) this.fencePosts[i] += 110 * Math.ceil((VIEW_W + 240) / 110);
    }
  }

  // AABB overlap between the turkey and an obstacle. Returns the obstacle or null.
  hitObstacle(turkey) {
    for (const o of this.obstacles) {
      if (o.hit) continue;
      const ox1 = o.x;
      const ox2 = o.x + o.w;
      const oy1 = o.y;
      const oy2 = o.y + o.h;
      const tx1 = turkey.left + 8;
      const tx2 = turkey.right - 8;
      const ty1 = turkey.top + 6;
      const ty2 = turkey.bottom;
      if (tx2 > ox1 && tx1 < ox2 && ty2 > oy1 + 6 && ty1 < oy2) {
        if (o.kind === "puddle") {
          if (turkey.onGround) return o;
          continue;
        }
        return o;
      }
    }
    return null;
  }

  collectCorn(turkey) {
    let got = 0;
    for (const c of this.corns) {
      if (c.taken) continue;
      const dx = c.x - turkey.x;
      const dy = c.y - (turkey.top + 30);
      if (Math.abs(dx) < 46 && Math.abs(dy) < 48) {
        c.taken = true;
        got += 1;
      }
    }
    return got;
  }

  markHit(o) {
    o.hit = true;
  }
}

// ---- drawing: appended second pass ----

World.prototype.drawBackground = function (ctx, t) {
  const z = this.zone();
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, z.skyTop);
  sky.addColorStop(0.55, z.skyMid);
  sky.addColorStop(1, z.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y + 2);

  // Sun.
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(1080, 108, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 243, 196, 0.45)";
  ctx.beginPath();
  ctx.arc(1080, 108, 72, 0, Math.PI * 2);
  ctx.fill();

  // Clouds.
  ctx.fillStyle = "rgba(255, 250, 235, 0.9)";
  for (const c of this.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 52 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 34 * c.s, c.y + 6, 36 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far hills.
  ctx.fillStyle = z.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  const off1 = (this.scrollX * 0.12) % 640;
  for (let x = -640; x < VIEW_W + 640; x += 640) {
    ctx.quadraticCurveTo(x + 160 - off1, GROUND_Y - 150, x + 320 - off1, GROUND_Y);
    ctx.quadraticCurveTo(x + 480 - off1, GROUND_Y - 90, x + 640 - off1, GROUND_Y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Near hills + trees.
  ctx.fillStyle = z.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  const off2 = (this.scrollX * 0.25) % 520;
  for (let x = -520; x < VIEW_W + 520; x += 520) {
    ctx.quadraticCurveTo(x + 130 - off2, GROUND_Y - 80, x + 260 - off2, GROUND_Y);
    ctx.quadraticCurveTo(x + 390 - off2, GROUND_Y - 120, x + 520 - off2, GROUND_Y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Barn silhouette in the barn zone, farmhouse in the farmyard.
  if (this.zoneIndexNow() === 1) this.drawBarn(ctx);
  if (this.zoneIndexNow() === 0) this.drawFarmhouse(ctx);
  if (this.zoneIndexNow() === 2) this.drawKitchenWall(ctx);
};

World.prototype.drawFarmhouse = function (ctx) {
  const x = 980 - ((this.scrollX * 0.4) % 1600);
  if (x < -260 || x > VIEW_W + 60) return;
  ctx.fillStyle = "#f2e3c2";
  ctx.fillRect(x, GROUND_Y - 190, 220, 190);
  ctx.fillStyle = "#a83c28";
  ctx.beginPath();
  ctx.moveTo(x - 14, GROUND_Y - 190);
  ctx.lineTo(x + 110, GROUND_Y - 262);
  ctx.lineTo(x + 234, GROUND_Y - 190);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5d3413";
  ctx.fillRect(x + 92, GROUND_Y - 96, 40, 96);
  ctx.fillStyle = "#7ec8e3";
  ctx.fillRect(x + 24, GROUND_Y - 160, 44, 44);
  ctx.fillRect(x + 152, GROUND_Y - 160, 44, 44);
};

World.prototype.drawBarn = function (ctx) {
  const x = 900 - ((this.scrollX * 0.4) % 1500);
  if (x < -300 || x > VIEW_W + 60) return;
  ctx.fillStyle = "#a83c28";
  ctx.beginPath();
  ctx.moveTo(x, GROUND_Y);
  ctx.lineTo(x, GROUND_Y - 190);
  ctx.lineTo(x + 130, GROUND_Y - 250);
  ctx.lineTo(x + 260, GROUND_Y - 190);
  ctx.lineTo(x + 260, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#7c2418";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 130, GROUND_Y - 250);
  ctx.lineTo(x + 130, GROUND_Y);
  ctx.stroke();
  ctx.fillStyle = "#5d3413";
  ctx.fillRect(x + 100, GROUND_Y - 110, 60, 110);
  ctx.strokeStyle = "#f2e3c2";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 100, GROUND_Y - 110);
  ctx.lineTo(x + 160, GROUND_Y);
  ctx.moveTo(x + 160, GROUND_Y - 110);
  ctx.lineTo(x + 100, GROUND_Y);
  ctx.stroke();
};

World.prototype.drawKitchenWall = function (ctx) {
  // Kitchen: the "sky" becomes a warm wall with a window and hanging pots.
  ctx.fillStyle = "rgba(122, 58, 20, 0.25)";
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.fillStyle = "#fdf3dd";
  ctx.fillRect(120, 90, 180, 150);
  ctx.strokeStyle = "#8a5a24";
  ctx.lineWidth = 10;
  ctx.strokeRect(120, 90, 180, 150);
  ctx.beginPath();
  ctx.moveTo(210, 90);
  ctx.lineTo(210, 240);
  ctx.moveTo(120, 165);
  ctx.lineTo(300, 165);
  ctx.stroke();
  ctx.fillStyle = "#f6b95e";
  ctx.beginPath();
  ctx.arc(250, 130, 26, 0, Math.PI * 2);
  ctx.fill();
  // Hanging pots.
  ctx.strokeStyle = "#5d3413";
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const px = 560 + i * 130;
    ctx.beginPath();
    ctx.moveTo(px, 60);
    ctx.lineTo(px, 96);
    ctx.stroke();
    ctx.fillStyle = "#4a4a4a";
    ctx.beginPath();
    ctx.arc(px, 118, 26, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(px - 26, 112, 52, 8);
  }
};

World.prototype.drawGround = function (ctx, t) {
  const z = this.zone();
  ctx.fillStyle = z.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = z.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 14);
  // Tufts of grass / floor tiles scrolling by.
  ctx.fillStyle = z.accent;
  const off = this.scrollX % 90;
  for (let x = -off; x < VIEW_W; x += 90) {
    ctx.fillRect(x, GROUND_Y + 30, 26, 5);
    ctx.fillRect(x + 44, GROUND_Y + 58, 18, 5);
  }
  // Fence along the back in the farmyard.
  if (this.zoneIndexNow() === 0) {
    ctx.strokeStyle = "#6e4520";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 34);
    ctx.lineTo(VIEW_W, GROUND_Y - 34);
    ctx.moveTo(0, GROUND_Y - 58);
    ctx.lineTo(VIEW_W, GROUND_Y - 58);
    ctx.stroke();
    ctx.fillStyle = "#6e4520";
    for (const px of this.fencePosts) {
      ctx.fillRect(px, GROUND_Y - 74, 10, 74);
    }
  }
};

World.prototype.drawObstacles = function (ctx, t) {
  for (const o of this.obstacles) {
    if (o.kind === "bale") {
      ctx.fillStyle = "#d9a441";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a8762a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 8, o.h / 2 - 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(o.x + 8, o.y + o.h / 2);
      ctx.lineTo(o.x + o.w - 8, o.y + o.h / 2);
      ctx.stroke();
    } else if (o.kind === "fence") {
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#6e4520";
      ctx.fillRect(o.x - 4, o.y + 10, o.w + 8, 8);
      ctx.fillRect(o.x - 4, o.y + 40, o.w + 8, 8);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.w / 2, o.y - 14);
      ctx.lineTo(o.x + o.w, o.y);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === "puddle") {
      ctx.fillStyle = "#7ec8e3";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 - 16, o.y + 4, 22, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.kind === "knife") {
      const cx = o.x + o.w / 2;
      ctx.save();
      ctx.translate(cx, o.y + o.h / 2);
      ctx.rotate(Math.PI);
      ctx.fillStyle = "#c9c9c9";
      ctx.beginPath();
      ctx.moveTo(-8, -48);
      ctx.lineTo(8, -48);
      ctx.lineTo(4, 10);
      ctx.lineTo(-4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-10, 48);
      ctx.lineTo(10, 48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5d3413";
      ctx.fillRect(-7, -48, 14, 22);
      ctx.restore();
      if (!o.falling) {
        ctx.fillStyle = "rgba(217, 58, 43, 0.85)";
        ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", cx, o.y - 12);
      }
    } else if (o.kind === "oven") {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#6e6e6e";
      ctx.fillRect(o.x + 8, o.y + 10, o.w - 16, 44);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(o.x + 14, o.y + 62, o.w - 28, 44);
      const f = Math.sin(o.flame) * 10;
      ctx.fillStyle = "#ff7b24";
      ctx.beginPath();
      ctx.moveTo(o.x + 20, o.y + 62);
      ctx.quadraticCurveTo(o.x + o.w / 2, o.y + 30 - f, o.x + o.w - 20, o.y + 62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd65a";
      ctx.beginPath();
      ctx.moveTo(o.x + 30, o.y + 62);
      ctx.quadraticCurveTo(o.x + o.w / 2, o.y + 44 - f, o.x + o.w - 30, o.y + 62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d93a2b";
      ctx.font = "bold 15px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("OVEN!", o.x + o.w / 2, o.y - 10);
    }
  }
};

World.prototype.drawCorn = function (ctx, t) {
  for (const c of this.corns) {
    if (c.taken) continue;
    const bobY = Math.sin(c.bob) * 4;
    ctx.save();
    ctx.translate(c.x, c.y + bobY);
    ctx.fillStyle = "#ffd65a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8a13a";
    for (let r = -1; r <= 1; r++) {
      ctx.beginPath();
      ctx.ellipse(r * 5, 0, 2, 11, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#5da83a";
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(0, 24);
    ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

World.prototype.drawParticles = function (ctx) {
  for (const p of this.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

World.prototype.draw = function (ctx, t) {
  this.drawBackground(ctx, t);
  this.drawGround(ctx, t);
  this.drawCorn(ctx, t);
  this.drawObstacles(ctx, t);
  this.drawParticles(ctx);
};
