// 미니게임: 받기 — 아치 위 한 사람이 던지는 소품(부케·케이크·선물 등)을 아래 사람이 받는다(30초).
// opts: { good: PROPS 이름, hint: 시작 안내 문구 }
'use strict';

// 게임 안 캐릭터 크기(무대·사진은 Stage.CHAR_SCALE, 게임은 움직일 자리가 넓도록 예전 크기)
const GAME_SCALE = 2;

// 세 게임이 같이 쓰는 위쪽 정보 줄
const GameHud = {
  bar(ctx, ratio, warn) {
    const barW = Stage.LW - 24;
    ctx.fillStyle = '#2a2033';
    ctx.fillRect(11, 21, barW + 2, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 22, barW, 4);
    ctx.fillStyle = warn ? '#e0526e' : '#7cc47f';
    ctx.fillRect(12, 22, Math.round(barW * Math.max(0, Math.min(1, ratio))), 4);
  },
  score(ctx, left, right) {
    Stage.drawText(ctx, left, 12, 36, 9, '#2a2033', 'left');
    Stage.drawText(ctx, right, Stage.LW - 12, 36, 8, '#7a6d80', 'right');
  },
  hint(ctx, t, big, small, y = 116) {
    if (t >= 2.2) return;
    ctx.globalAlpha = Math.min(1, (2.2 - t) * 2);
    Stage.drawText(ctx, big, 80, y, 11, '#e0526e');
    Stage.drawText(ctx, small, 80, y + 16, 8, '#2a2033');
    ctx.globalAlpha = 1;
  },
  pops(ctx, pops) {
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      Stage.drawText(ctx, p.text, p.x, p.y, 9, p.good ? '#e0526e' : '#5a6fb0');
      ctx.globalAlpha = 1;
    }
  },
};

const BOUQUET_RULES = {
  seconds: 30,
  goal: 150,            // 이 점수를 넘으면 "클리어"
  items: [
    { kind: 'bouquet', p: 0.58, score: 10 },
    { kind: 'heart', p: 0.25, score: 5 },
    { kind: 'rain', p: 0.17, score: -10 },
  ],
};

class BouquetGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;         // { groom: 받는 사람, bride: 던지는 사람 } 각각 {stand,happy}
    this.onEnd = onEnd;
    this.good = PixelChars.PROPS[opts.good] ? opts.good : 'bouquet';
    this.hint = opts.hint || '부케를 받아 주세요!';
    this.easy = !!opts.easy;  // 여러 번 실패하면 목표를 낮춘다
    this.goal = Math.round(BOUQUET_RULES.goal * (this.easy ? 0.6 : 1));
    this.reset();
  }

  reset() {
    this.time = BOUQUET_RULES.seconds;
    this.score = 0;
    this.caught = 0;
    this.items = [];
    this.pops = [];
    this.spawnIn = 0.6;
    this.groomX = 80;
    this.targetX = 80;
    this.stun = 0;
    this.happy = 0;
    this.brideX = 80;
    this.t = 0;
    this.over = false;
    this.keys = { left: false, right: false };
  }

  pointer(x) { this.targetX = Math.max(14, Math.min(Stage.LW - 14, x)); }
  down(p) { this.pointer(p.x); }
  move(p) { this.pointer(p.x); }
  up() {}
  key(k, on) { if (k === 'ArrowLeft') this.keys.left = on; if (k === 'ArrowRight') this.keys.right = on; }
  summary(best) { return `점수 ${this.score}점 · 받은 선물 ${this.caught}개 · 내 최고 ${best}점`; }

  pick() {
    let r = Math.random();
    for (const it of BOUQUET_RULES.items) { if ((r -= it.p) <= 0) return it; }
    return BOUQUET_RULES.items[0];
  }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    this.time -= dt;
    const progress = 1 - this.time / BOUQUET_RULES.seconds; // 0 → 1

    // 신부: 아치 위에서 좌우로
    this.brideX = 80 + Math.sin(this.t * (1.1 + progress)) * 34;

    // 신랑 이동
    if (this.keys.left) this.targetX = Math.max(14, this.groomX - 30);
    if (this.keys.right) this.targetX = Math.min(Stage.LW - 14, this.groomX + 30);
    if (this.stun > 0) {
      this.stun -= dt;
    } else {
      const speed = 150;
      const d = this.targetX - this.groomX;
      this.groomX += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
    }
    if (this.happy > 0) this.happy -= dt;

    // 던지기
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.time > 0.8) {
      const it = this.pick();
      this.items.push({
        ...it,
        kind: it.kind === 'bouquet' ? this.good : it.kind,
        x: this.brideX,
        y: 50,
        vx: (Math.random() - 0.5) * (30 + progress * 40),
        vy: -30 - Math.random() * 20,
        spin: Math.random() * 6,
      });
      this.spawnIn = 0.85 - progress * 0.4 + Math.random() * 0.2;
    }

    // 떨어지기와 받기
    const g = 70 + progress * 60;
    for (const o of this.items) {
      o.vy += g * dt;
      o.x += o.vx * dt;
      if (o.x < 8 || o.x > Stage.LW - 8) o.vx *= -1;
      o.y += o.vy * dt;
      o.spin += dt * 4;
      const near = Math.abs(o.x - this.groomX) < 15;
      if (!o.done && near && o.y > Stage.FLOOR_Y - 50 && o.y < Stage.FLOOR_Y - 20) {
        o.done = true;
        this.score = Math.max(0, this.score + o.score);
        if (o.score > 0) { this.caught++; this.happy = 0.35; }
        else { this.stun = 0.7; }
        this.pops.push({ x: o.x, y: o.y - 6, text: (o.score > 0 ? '+' : '') + o.score, life: 0.8, good: o.score > 0 });
      }
      if (o.y > Stage.LH + 10) o.done = true;
    }
    this.items = this.items.filter(o => !o.done);
    for (const p of this.pops) { p.life -= dt; p.y -= dt * 20; }
    this.pops = this.pops.filter(p => p.life > 0);

    if (this.time <= 0) {
      this.time = 0;
      this.over = true;
      this.onEnd(this.score, this.score >= this.goal);
    }
  }

  draw(ctx) {
    Stage.drawVenue(ctx, this.t * 3);
    const { groom, bride } = this.chars;

    // 신부(아치 꼭대기)
    Stage.drawSprite(ctx, bride.happy, this.brideX, 62, 1.5);

    // 물건들
    for (const o of this.items) {
      const img = PixelChars.PROPS[o.kind];
      ctx.save();
      ctx.translate(Math.round(o.x), Math.round(o.y));
      if (o.kind === this.good) ctx.rotate(Math.sin(o.spin) * 0.4);
      ctx.drawImage(img, -img.width, -img.height, img.width * 2, img.height * 2);
      ctx.restore();
    }

    // 신랑
    const shake = this.stun > 0 ? (Math.floor(this.t * 30) % 2 ? 1 : -1) : 0;
    const bob = this.stun <= 0 && Math.abs(this.targetX - this.groomX) > 1 ? (Math.floor(this.t * 8) % 2) : 0;
    Stage.drawSprite(ctx, this.happy > 0 ? groom.happy : groom.stand, this.groomX + shake, Stage.FLOOR_Y + 8 - bob, GAME_SCALE);

    // 점수 팝업
    for (const p of this.pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      Stage.drawText(ctx, p.text, p.x, p.y, 9, p.good ? '#e0526e' : '#5a6fb0');
      ctx.globalAlpha = 1;
    }

    GameHud.bar(ctx, this.time / BOUQUET_RULES.seconds, this.time < 6);
    GameHud.score(ctx, `점수 ${this.score}`, `목표 ${this.goal}`);
    GameHud.hint(ctx, this.t, this.hint, '좌우로 밀어서 움직여요');
  }
}

window.BouquetGame = BouquetGame;
window.GameHud = GameHud;
window.GAME_SCALE = GAME_SCALE;
window.BOUQUET_RULES = BOUQUET_RULES;
