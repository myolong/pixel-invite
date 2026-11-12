// 미니게임: 블록 쌓기 — 떨어지는 블록을 돌리고 옮겨 가로줄을 채우면 줄이 사라진다. 목표 줄 수를 채우면 클리어.
// 아래쪽 버튼 4개(◀ 돌리기 ▶ 내리기)나 방향키로 움직인다. 블록이 꼭대기까지 쌓이면 실패.
'use strict';

const BLOCK_RULES = { cols: 8, rows: 13, cell: 10, goal: 4, easyGoal: 2 };

const BLOCK_SHAPES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
];
const BLOCK_COLORS = ['#e0526e', '#f5a623', '#f5c542', '#7cc47f', '#5ab0d6', '#8a7ad6', '#f29aa8'];

class BlockGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;
    this.onEnd = onEnd;
    this.goal = opts.easy ? BLOCK_RULES.easyGoal : BLOCK_RULES.goal;
    this.hint = '가로줄을 채워 보세요!';
    this.X0 = 8; this.Y0 = 42;
    this.grid = Array.from({ length: BLOCK_RULES.rows }, () => Array(BLOCK_RULES.cols).fill(null));
    this.lines = 0;
    this.score = 0;
    this.caught = 0;
    this.t = 0;
    this.fall = 0;
    this.happy = 0;
    this.flash = [];
    this.pops = [];
    this.over = false;
    this.held = null;     // 누르고 있는 버튼
    this.holdT = 0;
    this.bag = [];
    this.next = this.draw7();
    this.spawn();
  }

  draw7() {
    if (!this.bag.length) this.bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    return this.bag.pop();
  }

  spawn() {
    const i = this.next;
    this.next = this.draw7();
    this.piece = { i, cells: BLOCK_SHAPES[i].map(c => c.slice()), x: 2, y: 0 };
    if (!this.fits(this.piece.cells, this.piece.x, this.piece.y)) this.finish(false);
  }

  fits(cells, x, y) {
    const { cols, rows } = BLOCK_RULES;
    return cells.every(([cx, cy]) => {
      const gx = cx + x, gy = cy + y;
      return gx >= 0 && gx < cols && gy < rows && (gy < 0 || !this.grid[gy][gx]);
    });
  }

  shift(dx) {
    const p = this.piece;
    if (p && this.fits(p.cells, p.x + dx, p.y)) p.x += dx;
  }

  rotate() {
    const p = this.piece;
    if (!p || p.i === 1) return;
    const r = p.cells.map(([x, y]) => [-y, x]);
    const minX = Math.min(...r.map(c => c[0])), minY = Math.min(...r.map(c => c[1]));
    const cells = r.map(([x, y]) => [x - minX, y - minY]);
    for (const k of [0, -1, 1, -2, 2]) if (this.fits(cells, p.x + k, p.y)) { p.cells = cells; p.x += k; return; }
  }

  step() {
    const p = this.piece;
    if (!p) return;
    if (this.fits(p.cells, p.x, p.y + 1)) { p.y++; return; }
    // 내려앉기
    for (const [cx, cy] of p.cells) {
      if (cy + p.y < 0) { this.finish(false); return; }
      this.grid[cy + p.y][cx + p.x] = BLOCK_COLORS[p.i];
    }
    this.piece = null;
    const full = [];
    this.grid.forEach((row, y) => { if (row.every(Boolean)) full.push(y); });
    if (full.length) {
      this.lines += full.length;
      this.caught = this.lines;
      const add = [0, 100, 250, 400, 600][full.length];
      this.score += add;
      this.happy = 0.6;
      this.flash = full.map(y => ({ y, life: 0.25 }));
      this.pops.push({ x: this.X0 + 40, y: this.Y0 + full[0] * BLOCK_RULES.cell, text: `+${add}`, life: 0.9, good: true });
      for (const y of full) { this.grid.splice(y, 1); this.grid.unshift(Array(BLOCK_RULES.cols).fill(null)); }
      if (this.lines >= this.goal) { this.finish(true); return; }
    }
    this.spawn();
  }

  drop() {
    const p = this.piece;
    if (!p) return;
    while (this.fits(p.cells, p.x, p.y + 1)) { p.y++; this.score += 1; }
    this.step();
    this.fall = 0;
  }

  finish(win) {
    if (this.over) return;
    this.over = true;
    this.piece = null;
    this.onEnd(this.score, win);
  }

  act(b) {
    if (this.over) return;
    if (b === 'left') this.shift(-1);
    else if (b === 'right') this.shift(1);
    else if (b === 'rot') this.rotate();
    else if (b === 'drop') this.drop();
  }

  // 아래쪽 버튼 자리(논리 좌표)
  button(p) {
    if (p.y < Stage.FLOOR_Y + 1) {
      // 판 위를 톡 치면 돌리기
      if (p.x < this.X0 + BLOCK_RULES.cols * BLOCK_RULES.cell && p.y > this.Y0) return 'rot';
      return null;
    }
    return ['left', 'rot', 'right', 'drop'][Math.max(0, Math.min(3, Math.floor((p.x - 4) / 38)))];
  }
  down(p) { const b = this.button(p); if (!b) return; this.act(b); this.held = b === 'left' || b === 'right' ? b : null; this.holdT = 0.25; this.pressed = b; this.pressT = 0.12; }
  move() {}
  up() { this.held = null; }
  key(k, on) {
    if (!on) { if (k === 'ArrowLeft' || k === 'ArrowRight') this.held = null; return; }
    const b = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rot', ArrowDown: 'drop', ' ': 'drop' }[k];
    if (b) this.act(b);
  }
  summary(best) { return `없앤 줄 ${this.lines}/${this.goal} · 점수 ${this.score}점 · 내 최고 ${best}점`; }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    if (this.happy > 0) this.happy -= dt;
    if (this.pressT > 0) this.pressT -= dt;
    if (this.held) { this.holdT -= dt; if (this.holdT <= 0) { this.act(this.held); this.holdT = 0.09; } }
    const speed = Math.max(0.28, 0.75 - this.lines * 0.08);
    this.fall += dt;
    if (this.t > 1.2 && this.fall >= speed) { this.fall = 0; this.step(); }
    for (const f of this.flash) f.life -= dt;
    this.flash = this.flash.filter(f => f.life > 0);
    for (const p of this.pops) { p.life -= dt; p.y -= dt * 20; }
    this.pops = this.pops.filter(p => p.life > 0);
  }

  drawCell(ctx, x, y, color, s = BLOCK_RULES.cell) {
    const r = s * 0.28;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x + 0.4, y + 0.4, s - 0.8, s - 0.8, r); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath(); ctx.roundRect(x + 0.4, y + s * 0.62, s - 0.8, s * 0.38 - 0.4, [0, 0, r, r]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x + s * 0.35, y + s * 0.3, s * 0.16, s * 0.1, -0.5, 0, Math.PI * 2); ctx.fill();
  }

  draw(ctx) {
    Stage.drawVenue(ctx, this.t * 3);
    const { cols, rows, cell } = BLOCK_RULES;
    const X0 = this.X0, Y0 = this.Y0, W = cols * cell, H = rows * cell;
    // 판
    ctx.fillStyle = '#2a2033';
    ctx.beginPath(); ctx.roundRect(X0 - 2, Y0 - 2, W + 4, H + 4, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.roundRect(X0, Y0, W, H, 2.5); ctx.fill();
    ctx.fillStyle = 'rgba(42,32,51,0.06)';
    for (let x = 1; x < cols; x++) ctx.fillRect(X0 + x * cell, Y0, 1, H);
    for (let y = 1; y < rows; y++) ctx.fillRect(X0, Y0 + y * cell, W, 1);
    this.grid.forEach((row, y) => row.forEach((c, x) => { if (c) this.drawCell(ctx, X0 + x * cell, Y0 + y * cell, c); }));
    for (const f of this.flash) { ctx.fillStyle = `rgba(255,255,255,${f.life * 3})`; ctx.fillRect(X0, Y0 + f.y * cell, W, cell); }
    const p = this.piece;
    if (p) {
      // 떨어질 자리 미리 보기
      let gy = p.y;
      while (this.fits(p.cells, p.x, gy + 1)) gy++;
      ctx.fillStyle = 'rgba(42,32,51,0.15)';
      for (const [cx, cy] of p.cells) if (cy + gy >= 0) ctx.fillRect(X0 + (cx + p.x) * cell + 1, Y0 + (cy + gy) * cell + 1, cell - 2, cell - 2);
      for (const [cx, cy] of p.cells) if (cy + p.y >= 0) this.drawCell(ctx, X0 + (cx + p.x) * cell, Y0 + (cy + p.y) * cell, BLOCK_COLORS[p.i]);
    }

    // 오른쪽: 다음 블록, 캐릭터
    const RX = X0 + W + 8, RW = Stage.LW - RX - 6;
    Stage.panel(ctx, RX - 1, Y0 - 1, RW + 2, 35, '#ffffff', 4);
    Stage.drawText(ctx, '다음', RX + RW / 2, Y0 + 9, 7, '#7a6d80');
    const nc = BLOCK_SHAPES[this.next], nw = Math.max(...nc.map(c => c[0])) + 1;
    nc.forEach(([cx, cy]) => this.drawCell(ctx, RX + RW / 2 - nw * 3.5 + cx * 7, Y0 + 14 + cy * 7, BLOCK_COLORS[this.next], 7));
    const ch = this.chars.groom;
    const bob = this.happy > 0 ? Math.floor(this.t * 10) % 2 * 2 : 0;
    Stage.drawSprite(ctx, this.happy > 0 ? ch.happy : ch.stand, RX + RW / 2, Stage.FLOOR_Y - bob, GAME_SCALE);

    // 아래 버튼
    const labels = { left: '◀', rot: '돌리기', right: '▶', drop: '▼' };
    ['left', 'rot', 'right', 'drop'].forEach((b, i) => {
      const x = 4 + i * 38, y = Stage.FLOOR_Y + 3, w = 36, h = 22;
      const on = this.pressT > 0 && this.pressed === b || this.held === b;
      Stage.panel(ctx, x, y + (on ? 1 : 0), w, h - (on ? 1 : 0), on ? '#f7c6d9' : '#ffffff', 5);
      Stage.drawText(ctx, labels[b], x + w / 2, y + 11, b === 'rot' ? 8 : 10, '#2a2033', 'center', null);
    });

    GameHud.pops(ctx, this.pops);
    GameHud.bar(ctx, this.lines / this.goal, false);
    GameHud.score(ctx, `줄 ${this.lines}/${this.goal}`, `점수 ${this.score}`);
    GameHud.hint(ctx, this.t, this.hint, '돌리기·◀▶로 옮기고 ▼로 내려요', 100);
  }
}

window.BlockGame = BlockGame;
