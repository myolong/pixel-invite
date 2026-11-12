// 미니게임: 문제 맞히기 — 만드는 사람이 낸 문제 하나를 보기 중에서 골라 맞힌다.
// opts.quiz = { q: 문제, a: 정답, w: [틀린 보기 1~3개] }. 여러 번 틀리면(easy) 보기를 2개로 줄인다.
'use strict';

class QuizGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;
    this.onEnd = onEnd;
    const q = opts.quiz || {};
    this.q = String(q.q || '').slice(0, 40);
    const wrong = (Array.isArray(q.w) ? q.w : []).map(w => String(w || '').slice(0, 20)).filter(Boolean).slice(0, 3);
    const opts2 = [{ text: String(q.a || '').slice(0, 20), right: true }, ...(opts.easy ? wrong.slice(0, 1) : wrong).map(text => ({ text, right: false }))];
    // 보기 순서 섞기
    for (let i = opts2.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts2[i], opts2[j]] = [opts2[j], opts2[i]]; }
    this.choices = opts2;
    this.score = 0;
    this.t = 0;
    this.picked = -1;
    this.endIn = 0;
    this.over = false;
    this.layout();
  }

  layout() {
    const n = this.choices.length, h = 22, gap = 4;
    const top = Stage.FLOOR_Y + 22 - n * (h + gap);
    this.boxes = this.choices.map((c, i) => ({ x: 10, y: top + i * (h + gap), w: Stage.LW - 20, h }));
  }

  pick(i) {
    if (this.over || this.endIn || this.t < 0.3 || i < 0 || i >= this.choices.length) return;
    this.picked = i;
    const right = this.choices[i].right;
    this.win = right;
    this.score = right ? 100 : 0;
    this.endIn = right ? 1.2 : 0.9;
  }

  down(p) { this.pick(this.boxes.findIndex(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h)); }
  move() {}
  up() {}
  key(k, on) { if (on && /^[1-4]$/.test(k)) this.pick(Number(k) - 1); }
  summary() { return this.win ? '정답이에요!' : '아쉬워요, 다시 골라 보세요.'; }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    if (this.endIn > 0) {
      this.endIn -= dt;
      if (this.endIn <= 0) { this.over = true; this.onEnd(this.score, this.win); }
    }
  }

  // 글자를 폭에 맞게 줄바꿈(최대 줄 수 넘으면 글자 크기를 줄인다)
  wrap(ctx, text, width, size, maxLines) {
    for (let s = size; s >= 6; s--) {
      ctx.font = `700 ${s * Stage.DONGLE}px Dongle, sans-serif`;
      const lines = [];
      let line = '';
      const fits = x => ctx.measureText(x).width <= width;
      for (const word of text.split(/\s+/).filter(Boolean)) {
        const cand = line ? line + ' ' + word : word;
        if (fits(cand)) { line = cand; continue; }
        if (line) lines.push(line);
        line = '';
        // 한 낱말이 한 줄보다 길면 글자 단위로 자른다
        for (const ch of word) { if (!fits(line + ch) && line) { lines.push(line); line = ''; } line += ch; }
      }
      if (line) lines.push(line);
      if (lines.length <= maxLines || s === 6) return { lines: lines.slice(0, maxLines), size: s };
    }
    return { lines: [text], size: 6 };
  }

  draw(ctx) {
    Stage.drawVenue(ctx, this.t * 3);
    const { groom, bride } = this.chars;
    const done = this.endIn > 0 || this.over;

    // 문제 카드
    const cardY = 30, cardH = this.boxes[0].y - 8 - cardY;
    Stage.panel(ctx, 8, cardY, Stage.LW - 16, cardH, '#ffffff', 5);
    ctx.fillStyle = '#e0526e'; ctx.beginPath(); ctx.roundRect(8.8, cardY + 0.8, Stage.LW - 17.6, 13, [4.2, 4.2, 0, 0]); ctx.fill();
    Stage.drawText(ctx, 'Q. 문제를 맞혀 주세요', 80, cardY + 8, 8, '#ffffff', 'center', null);
    const { lines, size } = this.wrap(ctx, this.q, Stage.LW - 32, 11, 4);
    const lh = size + 4, qTop = cardY + 14 + (cardH - 16 - lines.length * lh) / 2 + lh / 2;
    lines.forEach((l, i) => Stage.drawText(ctx, l, 80, qTop + i * lh, size, '#2a2033', 'center', null));

    // 보기
    this.choices.forEach((c, i) => {
      const b = this.boxes[i];
      const sel = this.picked === i;
      const showRight = done && c.right && this.win;
      const fill = showRight ? '#c9ecd0' : sel && !c.right ? '#f7c6d9' : '#ffffff';
      const shake = sel && !c.right && this.endIn > 0 ? (Math.floor(this.t * 30) % 2 ? 1 : -1) : 0;
      Stage.panel(ctx, b.x + shake, b.y, b.w, b.h, fill, 4);
      ctx.fillStyle = '#e0526e'; ctx.beginPath(); ctx.roundRect(b.x + 3 + shake, b.y + 3, 14, b.h - 7, 3); ctx.fill();
      Stage.drawText(ctx, String(i + 1), b.x + 10 + shake, b.y + b.h / 2 - 1, 8, '#ffffff', 'center', null);
      const w = this.wrap(ctx, c.text, b.w - 28, 9, 2);
      const l2 = w.size + 2;
      w.lines.forEach((l, k) => Stage.drawText(ctx, l, b.x + 22 + shake, b.y + b.h / 2 - 1 - (w.lines.length - 1) * l2 / 2 + k * l2, w.size, '#2a2033', 'left', null));
      if (showRight) Stage.drawText(ctx, '○', b.x + b.w - 10, b.y + b.h / 2 - 1, 12, '#3f9a52', 'center', null);
      if (sel && !c.right) Stage.drawText(ctx, '✕', b.x + b.w - 10 + shake, b.y + b.h / 2 - 1, 11, '#e0526e', 'center', null);
    });

    // 결과 장면
    if (done) {
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.beginPath(); ctx.roundRect(8.8, cardY + 14, Stage.LW - 17.6, cardH - 16.6, [0, 0, 4.2, 4.2]); ctx.fill();
      if (this.win) {
        const bob = Math.floor(this.t * 10) % 2 * 2;
        Stage.drawSprite(ctx, groom.happy, 36, cardY + cardH - 4 - bob, GAME_SCALE);
        Stage.drawSprite(ctx, bride.happy, 124, cardY + cardH - 4 - (2 - bob), GAME_SCALE, true);
        Stage.drawText(ctx, '정답!', 80, cardY + cardH / 2 + 6, 18, '#e0526e');
      } else {
        Stage.drawSprite(ctx, groom.stand, 80, cardY + cardH - 4, GAME_SCALE);
        Stage.drawText(ctx, '땡!', 40, cardY + cardH / 2 + 6, 16, '#5a6fb0');
      }
    }
    Stage.drawText(ctx, '문제 맞히기', 12, 20, 9, '#2a2033', 'left');
  }
}

window.QuizGame = QuizGame;
