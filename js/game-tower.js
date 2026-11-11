// 미니게임: 케이크 탑 쌓기 — 좌우로 움직이는 케이크 층을 톡 쳐서 떨어뜨린다. 어긋난 부분은 잘려 나간다.
// 목표 층수를 쌓으면 클리어, 아래층에 하나도 안 걸치면 실패.
'use strict';

const TOWER_RULES = { goal: 8, easyGoal: 6, layerH: 12, baseW: 64, perfect: 2 };
const TOWER_COLORS = [
  ['#f7c9a5', '#c98c64'], ['#f7c6d9', '#e0526e'], ['#fff3b0', '#f5a623'],
  ['#c9ecd0', '#5bbf6a'], ['#cfe6f7', '#5ab0d6'], ['#e2d9f7', '#8a7ad6'],
];

class TowerGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;
    this.onEnd = onEnd;
    this.easy = !!opts.easy;
    this.goal = this.easy ? TOWER_RULES.easyGoal : TOWER_RULES.goal;
    this.hint = '케이크를 높이 쌓아 보세요!';
    this.score = 0;
    this.t = 0;
    this.happy = 0;
    this.pops = [];
    this.bits = [];       // 잘려서 떨어지는 조각
    this.over = false;
    this.endIn = 0;       // 끝난 뒤 장면을 잠깐 보여 주고 결과로
    this.win = false;
    const w = TOWER_RULES.baseW;
    // 받침 접시
    this.stack = [{ x: (Stage.LW - w) / 2, w, c: -1 }];
    this.next();
  }

  get top() { return this.stack[this.stack.length - 1]; }
  get layers() { return this.stack.length - 1; }
  layerY(i) { return Stage.FLOOR_Y - 4 - i * TOWER_RULES.layerH; }  // i층의 아래쪽 y (0 = 접시)

  next() {
    const n = this.layers;
    const w = this.top.w;
    const fromLeft = n % 2 === 0;
    this.moving = { x: fromLeft ? 4 : Stage.LW - 4 - w, w, dir: fromLeft ? 1 : -1, speed: 46 + n * 9, c: n % TOWER_COLORS.length };
    this.falling = null;
  }

  drop() {
    if (this.over || this.endIn || this.falling || !this.moving || this.t < 0.4) return;
    this.falling = { ...this.moving, y: this.layerY(this.layers + 1) - 22, vy: 0 };
    this.moving = null;
  }

  land() {
    const f = this.falling, below = this.top;
    this.falling = null;
    const y = this.layerY(this.layers + 1);
    let left = Math.max(f.x, below.x), right = Math.min(f.x + f.w, below.x + below.w);
    if (right - left <= 1) {
      // 하나도 안 걸침: 통째로 떨어지고 끝
      this.bits.push({ x: f.x, w: f.w, y: y - TOWER_RULES.layerH, vy: 0, c: f.c, life: 1.2 });
      this.finish(false);
      return;
    }
    const perfect = Math.abs(f.x - below.x) <= TOWER_RULES.perfect;
    if (perfect) { left = below.x; right = below.x + below.w; }
    else {
      // 잘린 부분
      if (f.x < left) this.bits.push({ x: f.x, w: left - f.x, y: y - TOWER_RULES.layerH, vy: 0, c: f.c, life: 1 });
      if (f.x + f.w > right) this.bits.push({ x: right, w: f.x + f.w - right, y: y - TOWER_RULES.layerH, vy: 0, c: f.c, life: 1 });
    }
    this.stack.push({ x: left, w: right - left, c: f.c });
    const add = perfect ? 20 : 10;
    this.score += add;
    this.pops.push({ x: (left + right) / 2, y: y - 18, text: perfect ? `딱 맞아요! +${add}` : `+${add}`, life: 0.8, good: true });
    if (perfect) this.happy = 0.5;
    if (this.layers >= this.goal) { this.finish(true); return; }
    this.next();
  }

  finish(win) {
    if (this.endIn || this.over) return;
    this.win = win;
    this.moving = null;
    this.endIn = win ? 1.4 : 1;
    if (win) this.happy = 1.4;
  }

  down() { this.drop(); }
  move() {}
  up() {}
  key(k, on) { if (on && (k === ' ' || k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter')) this.drop(); }
  summary(best) { return `쌓은 층 ${this.layers}/${this.goal} · 점수 ${this.score}점 · 내 최고 ${best}점`; }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    if (this.happy > 0) this.happy -= dt;
    const m = this.moving;
    if (m) {
      m.x += m.dir * m.speed * dt;
      if (m.x < 4) { m.x = 4; m.dir = 1; }
      if (m.x + m.w > Stage.LW - 4) { m.x = Stage.LW - 4 - m.w; m.dir = -1; }
    }
    const f = this.falling;
    if (f) {
      f.vy += 900 * dt;
      f.y += f.vy * dt;
      if (f.y >= this.layerY(this.layers + 1)) this.land();
    }
    for (const b of this.bits) { b.vy += 500 * dt; b.y += b.vy * dt; b.life -= dt; }
    this.bits = this.bits.filter(b => b.life > 0 && b.y < Stage.LH + 20);
    for (const p of this.pops) { p.life -= dt; p.y -= dt * 20; }
    this.pops = this.pops.filter(p => p.life > 0);
    if (this.endIn > 0) {
      this.endIn -= dt;
      if (this.endIn <= 0) { this.over = true; this.onEnd(this.score, this.win); }
    }
  }

  drawLayer(ctx, x, bottom, w, c) {
    const [body, edge] = TOWER_COLORS[c];
    const h = TOWER_RULES.layerH, X = Math.round(x), W = Math.round(w), Y = Math.round(bottom - h);
    ctx.fillStyle = '#2a2033'; ctx.fillRect(X, Y, W, h);
    ctx.fillStyle = body; ctx.fillRect(X + 1, Y + 1, W - 2, h - 2);
    // 위쪽 크림
    ctx.fillStyle = '#ffffff'; ctx.fillRect(X + 1, Y + 1, W - 2, 3);
    ctx.fillStyle = edge;
    for (let i = X + 3; i < X + W - 3; i += 6) ctx.fillRect(i, Y + 4, 2, 2);
  }

  draw(ctx) {
    Stage.drawVenue(ctx, this.t * 3);
    const { groom, bride } = this.chars;
    const cheer = this.happy > 0;
    const bob = cheer ? Math.floor(this.t * 10) % 2 * 2 : 0;
    // 양옆에서 응원하는 두 사람
    Stage.drawSprite(ctx, cheer ? groom.happy : groom.stand, 20, Stage.FLOOR_Y + 8 - bob, GAME_SCALE);
    Stage.drawSprite(ctx, cheer ? bride.happy : bride.stand, Stage.LW - 20, Stage.FLOOR_Y + 8 - (cheer ? 2 - bob : 0), GAME_SCALE, true);

    // 접시
    const plate = this.stack[0];
    ctx.fillStyle = '#2a2033'; ctx.fillRect(Math.round(plate.x) - 6, Stage.FLOOR_Y - 4, plate.w + 12, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(plate.x) - 5, Stage.FLOOR_Y - 3, plate.w + 10, 3);
    this.stack.slice(1).forEach((s, i) => this.drawLayer(ctx, s.x, this.layerY(i + 1), s.w, s.c));
    // 다 쌓으면 꼭대기에 촛불
    if (this.win && this.endIn > 0) {
      const tp = this.top, cx = Math.round(tp.x + tp.w / 2), y = this.layerY(this.layers) - TOWER_RULES.layerH;
      ctx.fillStyle = '#2a2033'; ctx.fillRect(cx - 2, y - 10, 4, 10);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, y - 9, 2, 9);
      ctx.fillStyle = Math.floor(this.t * 8) % 2 ? '#f5c542' : '#f5a623'; ctx.fillRect(cx - 1, y - 14, 3, 4);
      Stage.drawText(ctx, '완성!', 22, 104, 12, '#e0526e');
    }
    for (const b of this.bits) { ctx.globalAlpha = Math.min(1, b.life * 2); this.drawLayer(ctx, b.x, b.y + TOWER_RULES.layerH, b.w, b.c); ctx.globalAlpha = 1; }
    const m = this.moving || this.falling;
    if (m) {
      const bottom = this.falling ? this.falling.y : this.layerY(this.layers + 1) - 22;
      if (this.moving) {
        // 떨어질 자리 안내선
        ctx.fillStyle = 'rgba(42,32,51,0.12)';
        ctx.fillRect(Math.round(m.x), bottom, Math.round(m.w), this.layerY(this.layers + 1) - bottom - TOWER_RULES.layerH);
      }
      this.drawLayer(ctx, m.x, bottom, m.w, m.c);
    }

    GameHud.pops(ctx, this.pops);
    GameHud.bar(ctx, this.layers / this.goal, false);
    GameHud.score(ctx, `${this.layers}/${this.goal}층`, `점수 ${this.score}`);
    GameHud.hint(ctx, this.t, this.hint, '톡 치면 케이크가 떨어져요', 64);
  }
}

window.TowerGame = TowerGame;
