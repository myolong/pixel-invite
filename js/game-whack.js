// 미니게임: 두더지 톡톡 — 구멍 9개에서 손님 캐릭터와 소품이 튀어나오면 톡 친다. 먹구름을 치면 점수가 깎인다(30초).
'use strict';

const WHACK_RULES = { seconds: 30, goal: 180 };
const WHACK_HOLES = [];
[100, 138, 176].forEach(y => [28, 80, 132].forEach(x => WHACK_HOLES.push({ x, y })));

class WhackGame {
  constructor(chars, onEnd, opts = {}) {
    this.chars = chars;
    this.onEnd = onEnd;
    this.good = PixelChars.PROPS[opts.good] ? opts.good : 'heart';
    this.hint = '튀어나오면 톡!';
    this.goal = Math.round(WHACK_RULES.goal * (opts.easy ? 0.6 : 1));
    this.time = WHACK_RULES.seconds;
    this.score = 0;
    this.caught = 0;
    this.t = 0;
    this.spawnIn = 0.8;
    this.ups = [];        // 튀어나온 것: { hole, kind: 'groom'|'bride'|'prop'|'rain', age, life, hit }
    this.pops = [];
    this.stars = [];
    this.over = false;
  }

  pop(x, y, n) {
    this.score = Math.max(0, this.score + n);
    this.pops.push({ x, y, text: (n > 0 ? '+' : '') + n, life: 0.8, good: n > 0 });
  }

  // 0~1: 구멍 밖으로 나온 정도
  rise(u) {
    if (u.hit) return Math.max(0, 1 - u.hitT * 5);
    const a = u.age, d = u.life;
    if (a < 0.15) return a / 0.15;
    if (a > d - 0.15) return Math.max(0, (d - a) / 0.15);
    return 1;
  }

  down(p) {
    if (this.over) return;
    let best = null, bd = 1e9;
    for (const u of this.ups) {
      if (u.hit || this.rise(u) < 0.35) continue;
      const h = WHACK_HOLES[u.hole];
      if (Math.abs(p.x - h.x) > 24 || p.y < h.y - 44 || p.y > h.y + 10) continue;
      const d = Math.abs(p.x - h.x) + Math.abs(p.y - (h.y - 16));
      if (d < bd) { bd = d; best = u; }
    }
    if (!best) return;
    const h = WHACK_HOLES[best.hole];
    best.hit = true; best.hitT = 0;
    this.stars.push({ x: h.x, y: h.y - 24, life: 0.3 });
    if (best.kind === 'rain') this.pop(h.x, h.y - 36, -10);
    else { this.caught++; this.pop(h.x, h.y - 36, best.kind === 'prop' ? 15 : 10); }
  }
  move() {}
  up() {}
  key(k, on) {
    // 키보드: 숫자 1~9 (휴대폰 숫자판 배열)
    if (!on || !/^[1-9]$/.test(k)) return;
    const h = WHACK_HOLES[Number(k) - 1];
    this.down({ x: h.x, y: h.y - 16 });
  }
  summary(best) { return `점수 ${this.score}점 · 톡 친 개수 ${this.caught}개 · 내 최고 ${best}점`; }

  update(dt) {
    if (this.over) return;
    this.t += dt;
    this.time -= dt;
    const progress = 1 - this.time / WHACK_RULES.seconds;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.time > 0.8) {
      const busy = new Set(this.ups.map(u => u.hole));
      const free = WHACK_HOLES.map((_, i) => i).filter(i => !busy.has(i));
      if (free.length) {
        const r = Math.random();
        const kind = r < 0.22 ? 'rain' : r < 0.48 ? 'prop' : r < 0.74 ? 'groom' : 'bride';
        this.ups.push({ hole: free[Math.floor(Math.random() * free.length)], kind, age: 0, life: 1.15 - progress * 0.4 + Math.random() * 0.2 });
      }
      this.spawnIn = 0.62 - progress * 0.24 + Math.random() * 0.18;
    }
    for (const u of this.ups) { u.age += dt; if (u.hit) u.hitT += dt; }
    this.ups = this.ups.filter(u => (u.hit ? u.hitT < 0.25 : u.age < u.life));
    for (const s of this.stars) s.life -= dt;
    this.stars = this.stars.filter(s => s.life > 0);
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
    const P = PixelChars.PROPS;
    // 판
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(4, 46, Stage.LW - 8, Stage.FLOOR_Y + 12 - 46);
    WHACK_HOLES.forEach((h, i) => {
      // 구멍 뒤쪽
      ctx.fillStyle = '#2a2033'; ctx.fillRect(h.x - 19, h.y - 4, 38, 8);
      ctx.fillStyle = '#5a4a63'; ctx.fillRect(h.x - 18, h.y - 3, 36, 3);
      // 튀어나온 것: 구멍 위쪽만 보이게 자른다
      const u = this.ups.find(v => v.hole === i);
      if (u) {
        const r = this.rise(u);
        ctx.save();
        ctx.beginPath(); ctx.rect(h.x - 22, h.y - 58, 44, 58); ctx.clip();
        if (u.kind === 'groom' || u.kind === 'bride') {
          const c = u.kind === 'groom' ? groom : bride;
          Stage.drawSprite(ctx, u.hit ? c.happy : c.stand, h.x, h.y + 22 - Math.round(r * 30), GAME_SCALE);
        } else {
          const img = u.kind === 'prop' ? P[this.good] : P.rain;
          ctx.drawImage(img, Math.round(h.x - img.width * 1.5), Math.round(h.y + 4 - r * 30), img.width * 3, img.height * 3);
        }
        ctx.restore();
      }
      // 구멍 앞쪽 테두리(흙더미)
      ctx.fillStyle = '#2a2033'; ctx.fillRect(h.x - 21, h.y, 42, 6);
      ctx.fillStyle = '#c98c64'; ctx.fillRect(h.x - 20, h.y + 1, 40, 4);
      ctx.fillStyle = '#e0b088'; ctx.fillRect(h.x - 20, h.y + 1, 40, 1);
    });
    for (const s of this.stars) {
      const r = (0.3 - s.life) * 50;
      ctx.fillStyle = '#f5c542';
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [1.4, 0], [-1.4, 0]].forEach(([a, b]) => ctx.fillRect(Math.round(s.x + a * r) - 1, Math.round(s.y + b * r) - 1, 3, 3));
    }

    GameHud.pops(ctx, this.pops);
    GameHud.bar(ctx, this.time / WHACK_RULES.seconds, this.time < 6);
    GameHud.score(ctx, `점수 ${this.score}`, `목표 ${this.goal}`);
    GameHud.hint(ctx, this.t, this.hint, '먹구름은 치지 마세요', 64);
  }
}

window.WhackGame = WhackGame;
