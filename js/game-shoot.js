// 미니게임: 물총 쏘기 — 화면을 톡 치면 그 자리로 가서 물총을 쏜다. 날아다니는 소품과 위쪽 상대를 맞힌다(30초).
// 상대가 던지는 먹구름 물방울에 맞으면 점수가 깎이고 잠깐 멈춘다.
'use strict';

const SHOOT_RULES = { seconds: 30, goal: 250, fire: 0.2 };

class ShootGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;        // { groom: 쏘는 사람, bride: 위쪽 상대 }
    this.onEnd = onEnd;
    this.good = PixelChars.PROPS[opts.good] ? opts.good : 'heart';
    this.hint = `${opts.goodName || '소품'} 맞히기!`;
    this.goal = Math.round(SHOOT_RULES.goal * (opts.easy ? 0.6 : 1));
    this.time = SHOOT_RULES.seconds;
    this.score = 0;
    this.caught = 0;
    this.t = 0;
    this.x = 80; this.targetX = 80;
    this.keys = { left: false, right: false };
    this.shots = []; this.targets = []; this.drops = []; this.pops = []; this.splash = [];
    this.fireIn = 0; this.want = 0; this.spawnIn = 0.3; this.throwIn = 2.2;
    this.rivalX = 80; this.rivalHit = 0;
    this.stun = 0; this.happy = 0;
    this.over = false;
  }

  pointer(x) { this.targetX = Math.max(12, Math.min(Stage.LW - 12, x)); }
  down(p) { this.pointer(p.x); this.want = 0.35; }
  move(p) { this.pointer(p.x); }
  up() {}
  key(k, on) {
    if (k === 'ArrowLeft') this.keys.left = on;
    if (k === 'ArrowRight') this.keys.right = on;
    if (on && (k === ' ' || k === 'ArrowUp')) { this.targetX = this.x; this.want = 0.35; }
  }
  summary(best) { return `점수 ${this.score}점 · 맞힌 개수 ${this.caught}개 · 내 최고 ${best}점`; }

  pop(x, y, n) {
    this.score = Math.max(0, this.score + n);
    this.pops.push({ x, y, text: (n > 0 ? '+' : '') + n, life: 0.8, good: n > 0 });
  }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    this.time -= dt;
    const progress = 1 - this.time / SHOOT_RULES.seconds;
    if (this.happy > 0) this.happy -= dt;
    if (this.rivalHit > 0) this.rivalHit -= dt;

    // 움직이기
    if (this.keys.left) this.targetX = Math.max(12, this.x - 30);
    if (this.keys.right) this.targetX = Math.min(Stage.LW - 12, this.x + 30);
    if (this.stun > 0) this.stun -= dt;
    else {
      const d = this.targetX - this.x;
      this.x += Math.sign(d) * Math.min(Math.abs(d), 150 * dt);
    }

    // 쏘기: 친 자리에 닿으면(또는 조금 지나면) 한 발
    this.fireIn -= dt;
    if (this.want > 0) {
      this.want -= dt;
      const arrived = Math.abs(this.targetX - this.x) < 3 || this.want <= 0;
      if (arrived && this.fireIn <= 0 && this.stun <= 0) {
        this.shots.push({ x: this.x + 6, y: Stage.FLOOR_Y - 30 });
        this.fireIn = SHOOT_RULES.fire;
        this.want = 0;
      }
    }
    for (const s of this.shots) s.y -= 190 * dt;

    // 날아다니는 소품
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.time > 0.6) {
      const fromLeft = Math.random() < 0.5;
      this.targets.push({
        x: fromLeft ? -8 : Stage.LW + 8, y: 92 + Math.random() * 40, base: 0,
        vx: (fromLeft ? 1 : -1) * (24 + Math.random() * 18 + progress * 22), ph: Math.random() * 6,
      });
      this.spawnIn = 0.75 - progress * 0.25 + Math.random() * 0.25;
    }
    for (const o of this.targets) { o.x += o.vx * dt; o.ph += dt * 3; o.dy = Math.sin(o.ph) * 5; }

    // 위쪽 상대: 좌우로 다니며 가끔 먹구름 물방울을 던짐
    this.rivalX = 80 + Math.sin(this.t * (0.9 + progress * 0.8)) * 54;
    this.throwIn -= dt;
    if (this.throwIn <= 0 && this.time > 1) {
      const dx = this.x - this.rivalX;
      this.drops.push({ x: this.rivalX, y: 78, vx: dx * 0.45, vy: 55 + progress * 30 });
      this.throwIn = 1.9 - progress * 0.7 + Math.random() * 0.4;
    }
    for (const d of this.drops) { d.x += d.vx * dt; d.y += d.vy * dt; }

    // 맞았는지
    for (const s of this.shots) {
      for (const o of this.targets) {
        if (!o.hit && !s.done && Math.abs(s.x - o.x) < 9 && Math.abs(s.y - (o.y + o.dy)) < 9) {
          o.hit = true; s.done = true; this.caught++; this.happy = 0.3;
          this.splash.push({ x: o.x, y: o.y + o.dy, life: 0.3 });
          this.pop(o.x, o.y + o.dy - 6, 10);
        }
      }
      if (!s.done && this.rivalHit <= 0 && Math.abs(s.x - this.rivalX) < 10 && s.y < 78 && s.y > 44) {
        s.done = true; this.rivalHit = 0.8; this.caught++;
        this.splash.push({ x: this.rivalX, y: 60, life: 0.3 });
        this.pop(this.rivalX, 48, 30);
      }
      if (s.y < 14) s.done = true;
    }
    for (const d of this.drops) {
      if (!d.done && Math.abs(d.x - this.x) < 10 && d.y > Stage.FLOOR_Y - 46 && d.y < Stage.FLOOR_Y - 8) {
        d.done = true; this.stun = 0.6; this.pop(this.x, Stage.FLOOR_Y - 54, -10);
      }
      if (d.y > Stage.LH) d.done = true;
    }
    this.shots = this.shots.filter(s => !s.done);
    this.targets = this.targets.filter(o => !o.hit && o.x > -16 && o.x < Stage.LW + 16);
    this.drops = this.drops.filter(d => !d.done);
    for (const p of this.pops) { p.life -= dt; p.y -= dt * 20; }
    this.pops = this.pops.filter(p => p.life > 0);
    for (const p of this.splash) p.life -= dt;
    this.splash = this.splash.filter(p => p.life > 0);

    if (this.time <= 0) {
      this.time = 0;
      this.over = true;
      this.onEnd(this.score, this.score >= this.goal);
    }
  }

  draw(ctx) {
    Stage.drawVenue(ctx, this.t * 3);
    const { groom, bride } = this.chars;
    const P = PixelChars.PROPS;

    // 상대
    const flick = this.rivalHit > 0 && Math.floor(this.t * 20) % 2;
    if (!flick) Stage.drawSprite(ctx, this.rivalHit > 0 ? bride.happy : bride.stand, this.rivalX, 78, 1.5);

    for (const o of this.targets) {
      const img = P[this.good];
      ctx.drawImage(img, Math.round(o.x - img.width), Math.round(o.y + o.dy - img.height), img.width * 2, img.height * 2);
    }
    for (const d of this.drops) ctx.drawImage(P.rain, Math.round(d.x - P.rain.width), Math.round(d.y - P.rain.height), P.rain.width * 2, P.rain.height * 2);
    for (const s of this.shots) {
      ctx.fillStyle = '#2a2033'; ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 1, 4, 7);
      ctx.fillStyle = '#7fd0f0'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 2, 5);
    }
    for (const p of this.splash) {
      const r = (0.3 - p.life) * 40;
      ctx.fillStyle = '#7fd0f0';
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [0, 1.4]].forEach(([a, b]) => ctx.fillRect(Math.round(p.x + a * r) - 1, Math.round(p.y + b * r) - 1, 2, 2));
    }

    // 쏘는 사람과 물총
    const shake = this.stun > 0 ? (Math.floor(this.t * 30) % 2 ? 1 : -1) : 0;
    const x = Math.round(this.x + shake), top = Stage.FLOOR_Y + 8 - 48;
    Stage.drawSprite(ctx, this.happy > 0 ? groom.happy : groom.stand, x, Stage.FLOOR_Y + 8, GAME_SCALE);
    ctx.fillStyle = '#2a2033'; ctx.fillRect(x + 3, top + 18, 6, 12);
    ctx.fillStyle = '#5ab0d6'; ctx.fillRect(x + 4, top + 19, 4, 6);
    ctx.fillStyle = '#f5c542'; ctx.fillRect(x + 4, top + 25, 4, 4);
    if (this.stun > 0) Stage.drawText(ctx, '앗 차가워!', x, top - 6, 8, '#5a6fb0');

    GameHud.pops(ctx, this.pops);
    GameHud.bar(ctx, this.time / SHOOT_RULES.seconds, this.time < 6);
    GameHud.score(ctx, `점수 ${this.score}`, `목표 ${this.goal}`);
    GameHud.hint(ctx, this.t, this.hint, '톡 치면 그 자리에서 쏴요', 124);
  }
}

window.ShootGame = ShootGame;
