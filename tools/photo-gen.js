// 예시 사진 만들기(개발용): 브라우저에서 characters.js 뒤에 읽혀 window.makePhotos()로 PNG data URL을 돌려준다.
// tools/make-examples.js가 Playwright로 실행해 invites/examples/<종류>/p1.png … 로 저장한다.
'use strict';

(function () {
  const W = 120, H = 150, GROUND = 132, S = 5;

  const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const bands = (g, cols, y0, y1) => { const n = cols.length, step = (y1 - y0) / n; cols.forEach((c, i) => rect(g, c, 0, Math.round(y0 + i * step), W, Math.ceil(step) + 1)); };
  const disc = (g, c, cx, cy, r) => { g.fillStyle = c; for (let y = -r; y <= r; y++) { const hw = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } };
  const rnd = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(7);

  const BG = {
    park(g) {
      bands(g, ['#a9dcff', '#b8e3ff', '#c9eaff', '#d8f0ff'], 0, GROUND);
      disc(g, '#ffffff', 24, 24, 6); disc(g, '#ffffff', 32, 22, 8); disc(g, '#ffffff', 40, 25, 5);
      disc(g, '#ffffff', 86, 34, 5); disc(g, '#ffffff', 93, 32, 7);
      [[10, 78], [104, 82], [60, 88]].forEach(([x, y]) => { rect(g, '#8a5a3c', x - 2, y, 4, GROUND - y); disc(g, '#5fb36a', x, y - 6, 12); disc(g, '#7cc47f', x - 3, y - 9, 6); });
      rect(g, '#8fd18a', 0, GROUND - 6, W, H); rect(g, '#7cc47f', 0, GROUND + 4, W, H);
      for (let i = 0; i < 26; i++) rect(g, ['#ffffff', '#f5c542', '#f48fb1'][i % 3], Math.floor(rnd() * W), GROUND - 4 + Math.floor(rnd() * 18), 1, 1);
    },
    beach(g) {
      bands(g, ['#ffb38a', '#ffc49b', '#ffd6ae', '#ffe4c2'], 0, 86);
      disc(g, '#fff1b8', 60, 86, 16);
      bands(g, ['#5aa0e6', '#4c8fd6', '#3f7fc4'], 86, 112);
      for (let i = 0; i < 14; i++) rect(g, '#bfe3f7', Math.floor(rnd() * W), 88 + Math.floor(rnd() * 22), 4, 1);
      rect(g, '#f2dcb0', 0, 112, W, H); rect(g, '#e6cc9a', 0, GROUND + 6, W, H);
    },
    night(g) {
      bands(g, ['#1c2440', '#222c4c', '#2a3658', '#313f63'], 0, GROUND);
      for (let i = 0; i < 40; i++) rect(g, '#ffffff', Math.floor(rnd() * W), Math.floor(rnd() * 70), 1, 1);
      disc(g, '#fff3c4', 96, 22, 9); disc(g, '#222c4c', 100, 19, 8);
      [[0, 70, 18], [18, 82, 14], [32, 62, 20], [52, 90, 16], [68, 74, 22], [90, 86, 14], [104, 68, 16]].forEach(([x, y, w]) => {
        rect(g, '#141a30', x, y, w, GROUND - y);
        for (let yy = y + 4; yy < GROUND - 6; yy += 6) for (let xx = x + 3; xx < x + w - 2; xx += 5) if (rnd() > 0.45) rect(g, '#f5c542', xx, yy, 2, 2);
      });
      rect(g, '#3a3f55', 0, GROUND - 2, W, H); rect(g, '#2e3247', 0, GROUND + 8, W, H);
    },
    cafe(g) {
      rect(g, '#f6eadb', 0, 0, W, GROUND);
      for (let x = 0; x < W; x += 10) rect(g, '#efdfcb', x, 0, 1, GROUND);
      rect(g, '#9ed3f0', 14, 18, 36, 40); rect(g, '#ffffff', 31, 18, 2, 40); rect(g, '#ffffff', 14, 37, 36, 2); rect(g, '#7a5a44', 12, 16, 40, 2); rect(g, '#7a5a44', 12, 58, 40, 3);
      [[78, 26], [96, 26]].forEach(([x, y]) => { rect(g, '#5a4a3c', x + 3, 0, 1, y); disc(g, '#f5c542', x + 3, y + 3, 4); });
      rect(g, '#5fb36a', 104, 70, 8, 8); rect(g, '#c98c64', 102, 78, 12, 10);
      rect(g, '#c9a07a', 0, GROUND - 4, W, H); rect(g, '#b78d68', 0, GROUND + 6, W, 1); rect(g, '#b78d68', 0, GROUND + 14, W, 1);
    },
    snow(g) {
      bands(g, ['#c9d6ea', '#d3deef', '#dde6f4', '#e7eef8'], 0, GROUND);
      [[18, 84], [98, 78]].forEach(([x, y]) => { for (let i = 0; i < 4; i++) { const w = 6 + i * 5; rect(g, '#3e8e57', x - w / 2, y - 26 + i * 8, w, 8); rect(g, '#ffffff', x - w / 2, y - 26 + i * 8, w, 2); } rect(g, '#7a5a44', x - 2, y + 6, 4, GROUND - y - 6); });
      rect(g, '#ffffff', 0, GROUND - 6, W, H); rect(g, '#eef3fa', 0, GROUND + 6, W, H);
      for (let i = 0; i < 50; i++) rect(g, '#ffffff', Math.floor(rnd() * W), Math.floor(rnd() * GROUND), 1, 1);
    },
    flowers(g) {
      bands(g, ['#d7f0ff', '#e3f5ff', '#eef9ff'], 0, 90);
      rect(g, '#a8dba0', 0, 90, W, H); rect(g, '#93cf8b', 0, 110, W, H);
      for (let i = 0; i < 90; i++) { const x = Math.floor(rnd() * W), y = 92 + Math.floor(rnd() * 56); rect(g, ['#f48fb1', '#ffffff', '#f5c542', '#b49cf0'][i % 4], x, y, 2, 2); }
    },
    party(g) {
      rect(g, '#f1ecff', 0, 0, W, GROUND); for (let x = 3; x < W; x += 9) rect(g, '#e6defc', x, 0, 2, GROUND);
      for (let x = 0; x < W; x++) rect(g, '#a99bc9', x, 12 + Math.round(Math.sin(x / 18) * 3), 1, 1);
      for (let i = 0; i < 8; i++) { const fx = 4 + i * 15, fy = 12 + Math.round(Math.sin(fx / 18) * 3); g.fillStyle = ['#f48fb1', '#8fd3f4', '#f5c542', '#b49cf0'][i % 4]; for (let r = 0; r < 6; r++) g.fillRect(fx + r / 2, fy + r, 7 - r, 1); }
      [[10, 44, '#f48fb1'], [20, 36, '#8fd3f4'], [104, 40, '#f5c542'], [112, 50, '#b49cf0']].forEach(([x, y, c]) => { rect(g, '#9a8fb0', x, y + 7, 1, 30); disc(g, c, x, y, 6); rect(g, '#ffffff', x - 3, y - 3, 2, 2); });
      rect(g, '#f2cfa6', 0, GROUND - 4, W, H); rect(g, '#e6bd90', 0, GROUND + 6, W, 1);
    },
    sunrise(g) {
      bands(g, ['#2f4d8a', '#5a6fb0', '#c98fb2', '#ffb38a', '#ffd27a'], 0, 96);
      disc(g, '#fff1b8', 60, 96, 14);
      [[0, 80, 50], [40, 72, 46], [80, 84, 40]].forEach(([x, y, w]) => { g.fillStyle = '#3b4a6b'; for (let i = 0; i <= w / 2; i++) g.fillRect(x + i, y + (w / 2 - i) / 2 + 6, w - i * 2, GROUND); });
      rect(g, '#e9e1d4', 0, 108, W, H); rect(g, '#d9cfbf', 0, GROUND + 6, W, H);
    },
    nursery(g) {
      rect(g, '#eaf7f4', 0, 0, W, GROUND); for (let x = 3; x < W; x += 9) rect(g, '#dcf1ec', x, 0, 2, GROUND);
      for (let i = 0; i < 6; i++) { const x = 10 + i * 20; rect(g, '#9cc7bd', x, 20, 1, 8); disc(g, ['#fff1a8', '#f7c6d9', '#bfe3f7'][i % 3], x, 32, 4); }
      rect(g, '#ffffff', 86, 74, 26, 2); for (let x = 86; x <= 110; x += 4) rect(g, '#ffffff', x, 74, 2, 36); rect(g, '#ffffff', 86, 108, 26, 2);
      rect(g, '#f2dcc0', 0, GROUND - 4, W, H); rect(g, '#e6c9a6', 0, GROUND + 6, W, 1);
    },
  };

  // 탁자와 소품
  function table(g, x, prop) {
    rect(g, '#ffffff', x - 16, GROUND - 22, 32, 4); rect(g, '#e9e1da', x - 16, GROUND - 18, 32, 2);
    rect(g, '#c98c64', x - 14, GROUND - 16, 2, 16); rect(g, '#c98c64', x + 12, GROUND - 16, 2, 16);
    if (prop) { const img = PixelChars.PROPS[prop]; g.drawImage(img, Math.round(x - img.width), GROUND - 22 - img.height * 2, img.width * 2, img.height * 2); }
  }
  function sprite(g, img, cx, bottom, s = 2) {
    const x = Math.round(cx - img.width * s / 2), y = Math.round(bottom - img.height * s);
    g.drawImage(img, x, y, img.width * s, img.height * s);
    if (img.over) g.drawImage(img.over, x, y, img.width * s, img.height * s);
  }
  function hearts(g, n) { for (let i = 0; i < n; i++) g.drawImage(PixelChars.PROPS.heart, 20 + Math.floor(rnd() * 80), 40 + Math.floor(rnd() * 40)); }
  function falling(g, prop, n) { const img = PixelChars.PROPS[prop]; for (let i = 0; i < n; i++) g.drawImage(img, 10 + Math.floor(rnd() * 96), 20 + Math.floor(rnd() * 60), img.width * 2, img.height * 2); }

  // 사진 한 장: { bg, people: [[look, x, happy]], table: [x, prop], hearts, falling: [prop, n] }
  function shot(p) {
    const c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.setTransform(S, 0, 0, S, 0, 0);
    BG[p.bg](g);
    if (p.falling) falling(g, p.falling[0], p.falling[1]);
    if (p.table) table(g, p.table[0], p.table[1]);
    (p.people || []).forEach(([look, x, happy, s]) => {
      const ch = PixelChars.makeCharacter(look);
      sprite(g, happy ? ch.happy : ch.stand, x, GROUND + 6, s || 2);
    });
    if (p.hearts) hearts(g, p.hearts);
    return c.toDataURL('image/png');
  }

  const F1 = { outfit: 'casual', hair: 'bun', hairColor: 3, color: 1, skin: 1 };
  const F2 = { outfit: 'casual', hair: 'short', hairColor: 1, color: 0, skin: 2 };
  const F3 = { outfit: 'casual', hair: 'bob', hairColor: 4, color: 2, skin: 0 };

  // 종류마다 6장. a·b는 그 종류의 기본 캐릭터
  function plan(k) {
    const K = InviteKinds.KINDS[k];
    const a = K.people[0].look, b = (K.people[1] || {}).look;
    const casualA = Object.assign({}, a, { outfit: 'casual', veil: false, acc: '' });
    const casualB = b && Object.assign({}, b, { outfit: 'casual', veil: false, acc: '', color: 2 });
    const good = K.game.good;
    const couple = (x1, x2, h, A = a, B = b) => [[A, x1, h], [B, x2, h]];
    switch (k) {
      case 'wedding':
      case 'notice':
        return [
          { bg: 'flowers', people: couple(46, 74, true), hearts: 3 },
          { bg: 'beach', people: couple(48, 72, false, casualA, casualB) },
          { bg: 'park', people: couple(44, 76, true), falling: ['bouquet', 3] },
          { bg: 'cafe', people: couple(30, 90, true, casualA, casualB), table: [60, 'cake'] },
          { bg: 'night', people: couple(50, 70, true), hearts: 4 },
          { bg: 'snow', people: couple(46, 74, false, casualA, casualB) },
        ];
      case 'babyshower':
        return [
          { bg: 'nursery', people: couple(36, 64, true) },
          { bg: 'park', people: couple(46, 74, false) , falling: ['bottle', 3] },
          { bg: 'party', people: couple(30, 90, true), table: [60, 'cake'] },
          { bg: 'flowers', people: couple(46, 74, true), hearts: 3 },
          { bg: 'cafe', people: couple(30, 90, false), table: [60, 'bottle'] },
          { bg: 'beach', people: couple(48, 72, true) },
        ];
      default: {
        const bg = { bihon: ['party', 'cafe', 'flowers', 'night', 'beach', 'park'], ihon: ['night', 'beach', 'party', 'cafe', 'park', 'sunrise'],
          yearend: ['snow', 'party', 'night', 'cafe', 'snow', 'party'], newyear: ['sunrise', 'cafe', 'snow', 'party', 'sunrise', 'park'],
          event: ['party', 'park', 'cafe', 'flowers', 'party', 'night'],
          xmas: ['snow', 'party', 'night', 'cafe', 'snow', 'party'], seollal: ['sunrise', 'cafe', 'snow', 'park', 'sunrise', 'party'],
          chuseok: ['night', 'park', 'cafe', 'night', 'park', 'flowers'], bungae: ['night', 'cafe', 'party', 'night', 'cafe', 'park'],
          gather: ['party', 'park', 'cafe', 'flowers', 'party', 'night'] }[k] || ['party', 'park', 'cafe', 'flowers', 'party', 'night'];
        return [
          { bg: bg[0], people: [[a, 60, true]], falling: [good, 4] },
          { bg: bg[1], people: [[F1, 28, true], [a, 60, true], [F2, 92, true]] },
          { bg: bg[2], people: [[a, 30, false], [F3, 90, true]], table: [60, good === 'gift' ? 'gift' : 'cake'] },
          { bg: bg[3], people: [[a, 60, true]], hearts: 3 },
          { bg: bg[4], people: [[F2, 34, true], [a, 60, true], [F3, 86, true]], falling: [good, 2] },
          { bg: bg[5], people: [[a, 48, true], [F1, 74, true]] },
        ];
      }
    }
  }

  window.makePhotos = k => plan(k).map(shot);
})();
