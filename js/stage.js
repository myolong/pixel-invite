// 무대 공통: 캔버스 크기, 예식장 배경, 그림·글자 그리기
'use strict';

const LW = 160, LH = 204;          // 논리 해상도(픽셀 그림 기준)
const FLOOR_Y = 176;
const CHAR_SCALE = 3;               // 서 있는 캐릭터 배율(16x24 → 48x72)
const PAIR_X = [50, 110];           // 두 사람이 설 자리               // 바닥선

function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const fit = () => {
    const cssW = canvas.parentElement.clientWidth || 360;
    const dpr = window.devicePixelRatio || 1;
    const s = Math.max(2, Math.round((cssW * dpr) / LW));
    canvas.width = LW * s;
    canvas.height = LH * s;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
  fit();
  window.addEventListener('resize', fit);
  return ctx;
}

// 화면 좌표 → 논리 좌표
function toLogical(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * LW, y: ((clientY - r.top) / r.height) * LH };
}

function drawSprite(ctx, img, cx, bottom, scale = 2, flip = false) {
  const w = img.width * scale, h = img.height * scale;
  const x = Math.round(cx - w / 2), y = Math.round(bottom - h);
  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  // 사진 얼굴: 몸 그림 위 머리 자리에 타원으로(긴 쪽 14칸, 아래쪽을 목에 맞춤)
  if (img.face && img.face.complete && img.face.naturalWidth) {
    const d = 14 * scale, a = img.face.naturalWidth / img.face.naturalHeight;
    const w = a <= 1 ? d * a : d, h = a <= 1 ? d : d / a;
    const ccx = x + (img.width / 2) * scale, ccy = y - 1 * scale + d - h / 2;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.ellipse(ccx, ccy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2033';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ccx, ccy, w / 2 - scale * 0.5, h / 2 - scale * 0.5, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img.face, ccx - w / 2, ccy - h / 2, w, h);
    ctx.restore();
  }
  // 소품 겹(모자·머리띠 등): 사진 얼굴 위에 그린다
  if (img.over) {
    if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img.over, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(img.over, x, y, w, h);
  }
}

function drawText(ctx, text, x, y, size, color = '#2a2033', align = 'center', outline = '#ffffff') {
  ctx.font = `700 ${size}px Galmuri11, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = Math.max(1.5, size / 5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

const FLOWER_COLORS = ['#f48fb1', '#ffffff', '#f5c542', '#f7a8c0'];

// 장면: 종류(InviteKinds의 scene)마다 벽·꾸밈·바닥이 다르다
//  wall/stripe 벽지, sky 위→아래 그라데이션, flags 깃발 줄, lights 전구 줄, snow 눈, stars 별,
//  lattice 문살, back 뒤 꾸밈(clock·tree·sunrise·moon·city·envelope·kites), front 앞 꾸밈(arch·balloons·grass)
const BASE_FLOOR = { floor: '#f2cfa6', floor2: '#e6bd90' };
const THEMES = {
  wedding: { ...BASE_FLOOR, wall: '#ffeef2', stripe: '#ffe2e9', line: '#c9a3ae', flags: ['#f48fb1', '#8fd3f4', '#f5c542', '#a8e6a1'],
    arch: '#7cc47f', flowers: FLOWER_COLORS, road: '#e8687f', edge: '#f6c1cb', front: 'arch' },
  notice: { ...BASE_FLOOR, wall: '#fff6ec', stripe: '#fdebd8', line: '#c9a37a', flags: ['#f48fb1', '#ffffff', '#f5c542', '#f7a8c0'],
    road: '#e8a07f', edge: '#f7d2bf', back: 'envelope' },
  party: { ...BASE_FLOOR, wall: '#f1ecff', stripe: '#e6defc', line: '#a99bc9', flags: ['#f48fb1', '#8fd3f4', '#f5c542', '#b49cf0'],
    arch: '#b49cf0', flowers: ['#f48fb1', '#8fd3f4', '#f5c542', '#a8e6a1'], road: '#8f7ae0', edge: '#cfc4f7', front: 'balloons' },
  winter: { wall: '#24304f', stripe: '#2c3a5e', line: '#8d93a8', lights: true, snow: true, back: 'clock',
    floor: '#d9c2a3', floor2: '#c8ad8b', road: '#b8323f', edge: '#f2b0b8' },
  newyear: { ...BASE_FLOOR, sky: ['#ffb38a', '#ffe9c7'], back: 'sunrise', road: '#d8424f', edge: '#f7b6a0' },
  xmas: { wall: '#1f4d3a', stripe: '#245a44', line: '#8d93a8', lights: true, snow: true, back: 'tree',
    floor: '#e9d3b4', floor2: '#d9be98', road: '#c8323f', edge: '#f2b0b8' },
  seollal: { wall: '#fbf1dc', lattice: '#e3cfa6', back: 'kites', floor: '#e8c48f', floor2: '#d6ae74', road: '#c8323f', edge: '#f2c27a' },
  chuseok: { sky: ['#141a40', '#33306a'], stars: true, back: 'moon', front: 'grass', floor: '#b88a5a', floor2: '#a4784a', road: '#7a4a2a', edge: '#c9a070' },
  bungae: { sky: ['#1c1830', '#3a2f5c'], stars: true, back: 'city', floor: '#4a4a5a', floor2: '#3c3c4a', road: '#f5c542', edge: '#fff1a8' },
  baby: { ...BASE_FLOOR, wall: '#eaf7f4', stripe: '#dcf1ec', line: '#9cc7bd', flags: ['#bfe3f7', '#f7c6d9', '#fff1a8', '#c9f0d8'],
    arch: '#9fd9c8', flowers: ['#bfe3f7', '#f7c6d9', '#fff1a8', '#ffffff'], road: '#8fc7e8', edge: '#d6ecf8', front: 'arch' },
};
let currentTheme = THEMES.wedding;
function setTheme(name) { currentTheme = THEMES[name] || THEMES.wedding; }

const px = (ctx, c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const mix = (a, b, k) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
function disc(ctx, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); px(ctx, c, cx - w, cy + y, w * 2 + 1, 1); }
}

// 무대 배경. 테마는 setTheme으로 바꾼다.
function drawVenue(ctx, t = 0) {
  const T = currentTheme;
  // 벽 또는 하늘
  if (T.sky) {
    for (let y = 0; y < FLOOR_Y; y += 4) px(ctx, mix(T.sky[0], T.sky[1], y / FLOOR_Y), 0, y, LW, 4);
  } else {
    px(ctx, T.wall, 0, 0, LW, FLOOR_Y);
    if (T.stripe) for (let x = 4; x < LW; x += 12) px(ctx, T.stripe, x, 0, 2, FLOOR_Y);
    if (T.lattice) {
      for (let x = 0; x < LW; x += 16) px(ctx, T.lattice, x, 0, 1, FLOOR_Y);
      for (let y = 8; y < FLOOR_Y; y += 16) px(ctx, T.lattice, 0, y, LW, 1);
      for (let x = 8; x < LW; x += 16) for (let y = 0; y < FLOOR_Y; y += 16) px(ctx, T.lattice, x, y, 1, 8);
    }
  }
  if (T.stars) {
    for (let i = 0; i < 26; i++) {
      const sx = (i * 47) % LW, sy = (i * 29) % 110;
      if (Math.sin(t * 0.7 + i * 1.7) > -0.6) px(ctx, i % 5 ? '#ffffff' : '#fff1a8', sx, sy);
    }
  }
  if (T.back) BACK[T.back](ctx, t);
  if (T.snow) {
    for (let i = 0; i < 28; i++) {
      const sx = (i * 37 + Math.sin(t * 0.3 + i) * 4) % LW;
      const sy = (i * 53 + t * 6) % FLOOR_Y;
      px(ctx, '#ffffff', sx, sy);
    }
  }
  if (T.flags) {
    for (let x = 0; x < LW; x++) px(ctx, T.line, x, 10 + Math.round(Math.sin(x / 26) * 3));
    for (let i = 0; i < 10; i++) {
      const fx = 6 + i * 16, fy = 10 + Math.round(Math.sin(fx / 26) * 3);
      for (let r = 0; r < 6; r++) px(ctx, T.flags[i % 4], fx + r / 2, fy + r, 7 - r, 1);
    }
  }
  if (T.lights) {
    const cols = ['#f5c542', '#d8424f', '#5bbf6a', '#8fd3f4'];
    for (let x = 0; x < LW; x++) px(ctx, '#3a3f4a', x, 9 + Math.round(Math.sin(x / 20) * 4));
    for (let i = 0; i < 16; i++) {
      const bx = 4 + i * 10, by = 10 + Math.round(Math.sin(bx / 20) * 4);
      const on = Math.floor(t * 2 + i) % 3 !== 0;
      px(ctx, on ? cols[i % 4] : mix(cols[i % 4], '#000000', 0.5), bx - 1, by, 3, 3);
      if (on) px(ctx, '#ffffff', bx, by, 1, 1);
    }
  }

  // 마루와 길(원근)
  px(ctx, T.floor, 0, FLOOR_Y, LW, LH - FLOOR_Y);
  for (let y = FLOOR_Y + 6; y < LH; y += 8) px(ctx, T.floor2, 0, y, LW, 1);
  for (let y = FLOOR_Y; y < LH; y++) {
    const k = (y - FLOOR_Y) / (LH - FLOOR_Y);
    const half = 14 + k * 26;
    px(ctx, T.road, 80 - half, y, Math.round(half * 2), 1);
    px(ctx, T.edge, 80 - half, y); px(ctx, T.edge, 80 + half - 1, y);
  }
  if (T.front) FRONT[T.front](ctx, t, T);
}

const BACK = {
  // 자정을 향하는 큰 시계
  clock(ctx, t) {
    const cx = 80, cy = 86;
    disc(ctx, cx, cy, 25, '#c9a24a'); disc(ctx, cx, cy, 22, '#fffaf0');
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; px(ctx, '#2a2033', cx + Math.sin(a) * 18, cy - Math.cos(a) * 18, i % 3 ? 1 : 2, i % 3 ? 1 : 2); }
    const m = (55 + (t * 0.5) % 5) / 60 * Math.PI * 2;
    for (let r = 0; r < 15; r++) px(ctx, '#2a2033', cx + Math.sin(m) * r, cy - Math.cos(m) * r);
    const hh = (11 + 55 / 60) / 12 * Math.PI * 2;
    for (let r = 0; r < 10; r++) px(ctx, '#2a2033', cx + Math.sin(hh) * r, cy - Math.cos(hh) * r, 2, 2);
    px(ctx, '#d8424f', cx - 1, cy - 1, 3, 3);
  },
  // 크리스마스트리와 선물
  tree(ctx, t) {
    const cx = 80;
    for (let y = 62; y < 158; y++) {
      const tier = (y - 62) % 32, base = Math.floor((y - 62) / 32);
      const half = 6 + base * 8 + tier * 0.7;
      px(ctx, tier % 6 < 3 ? '#2f8a4f' : '#267a44', cx - half, y, Math.round(half * 2), 1);
    }
    px(ctx, '#7a4a2a', cx - 5, 158, 10, 18);
    const orn = ['#d8424f', '#f5c542', '#8fd3f4', '#ffffff'];
    for (let i = 0; i < 14; i++) {
      const y = 70 + (i * 37) % 84, half = 6 + Math.floor((y - 62) / 32) * 8 + ((y - 62) % 32) * 0.7 - 3;
      const x = cx + Math.sin(i * 2.3) * half;
      px(ctx, Math.floor(t * 2 + i) % 4 ? orn[i % 4] : '#ffffff', x, y, 2, 2);
    }
    // 별
    const s = Math.sin(t * 3) > 0 ? '#fff3b0' : '#f5c542';
    px(ctx, s, cx - 1, 52, 3, 9); px(ctx, s, cx - 4, 55, 9, 3); px(ctx, '#f5c542', cx - 2, 54, 5, 5);
  },
  // 산 너머 해돋이
  sunrise(ctx, t) {
    const rise = Math.min(1, (t % 30) / 6);
    disc(ctx, 80, 128 - rise * 10, 30, '#ffd24a'); disc(ctx, 80, 128 - rise * 10, 24, '#ffb43a');
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i + 0.5) / 9 * Math.PI, r1 = 36, r2 = 44 + Math.sin(t * 2 + i) * 2;
      for (let r = r1; r < r2; r++) px(ctx, '#ffe08a', 80 + Math.cos(a) * r, 118 - rise * 10 + Math.sin(a) * r);
    }
    const hill = (x0, w, h, c) => { for (let x = -w; x <= w; x++) { const hh = Math.round(h * (1 - (x / w) * (x / w))); px(ctx, c, x0 + x, FLOOR_Y - hh, 1, hh); } };
    hill(20, 50, 52, '#7a6a9a'); hill(140, 55, 58, '#7a6a9a'); hill(80, 60, 38, '#5f5482');
    // 구름
    [[24, 40], [128, 30]].forEach(([x, y], i) => { const dx = Math.sin(t * 0.3 + i) * 3; px(ctx, '#fff7ea', x + dx, y, 18, 4); px(ctx, '#fff7ea', x + 4 + dx, y - 3, 10, 3); });
  },
  // 보름달과 토끼 그림자
  moon(ctx, t) {
    disc(ctx, 80, 84, 27, '#fff4c2'); disc(ctx, 80, 84, 25, '#ffeaa0');
    [[70, 76, 3], [90, 92, 4], [86, 72, 2], [72, 94, 2]].forEach(([x, y, r]) => disc(ctx, x, y, r, '#f3d987'));
    // 구름이 천천히 지나감
    const cx = ((t * 4) % 220) - 30;
    px(ctx, '#4a4a80', cx, 100, 28, 4); px(ctx, '#4a4a80', cx + 6, 97, 14, 3);
  },
  // 밤 도시와 번쩍 번개
  city(ctx, t) {
    const B = [[0, 26, 70], [24, 18, 96], [40, 22, 60], [60, 16, 84], [74, 14, 104], [86, 20, 74], [104, 18, 92], [120, 22, 64], [140, 20, 88]];
    B.forEach(([x, w, h], i) => {
      const top = FLOOR_Y - h;
      px(ctx, i % 2 ? '#2b2547' : '#332c55', x, top, w, h);
      for (let wy = top + 4; wy < FLOOR_Y - 4; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        if (((wx * 7 + wy * 13 + i) % 5) < 3) px(ctx, Math.floor(t + wx + wy) % 9 ? '#f5d76e' : '#8a7a40', wx, wy, 2, 3);
      }
    });
    const ph = t % 3.2;
    if (ph < 0.25) {
      if (ph < 0.08) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, LW, FLOOR_Y); }
      const Z = [[118, 22], [110, 36], [118, 36], [106, 56], [116, 56], [100, 80]];
      for (let i = 0; i < Z.length - 1; i++) {
        const [x1, y1] = Z[i], [x2, y2] = Z[i + 1], n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        for (let k = 0; k <= n; k++) px(ctx, '#fff7a0', x1 + (x2 - x1) * k / n - 1, y1 + (y2 - y1) * k / n, 3, 1);
      }
    }
  },
  // 큰 편지 봉투와 하트 봉인
  envelope(ctx, t) {
    const x = 42, y = 66, w = 76, h = 50;
    px(ctx, '#e8d6c2', x + 2, y + 2, w, h);
    px(ctx, '#fffaf2', x, y, w, h);
    for (let i = 0; i < w / 2; i++) { const dy = Math.round(i * (h * 0.6) / (w / 2)); px(ctx, '#d9c3aa', x + i, y + dy); px(ctx, '#d9c3aa', x + w - 1 - i, y + dy); }
    const hy = y + h * 0.6 - 4 + Math.round(Math.sin(t * 2) * 1);
    [[-3, 0, 3], [1, 0, 3], [-4, 1, 9], [-4, 2, 9], [-3, 3, 7], [-2, 4, 5], [-1, 5, 3], [0, 6, 1]].forEach(([dx, dy, ww]) => px(ctx, '#e0526e', 80 + dx, hy + dy, ww, 1));
    for (let i = 0; i < 5; i++) {
      const fy = 150 - ((t * 10 + i * 30) % 120), fx = 20 + i * 30 + Math.sin(t + i) * 4;
      px(ctx, '#f7a8c0', fx, fy, 2, 2); px(ctx, '#f7a8c0', fx + 3, fy, 2, 2); px(ctx, '#f7a8c0', fx, fy + 2, 5, 1); px(ctx, '#f7a8c0', fx + 1, fy + 3, 3, 1); px(ctx, '#f7a8c0', fx + 2, fy + 4, 1, 1);
    }
  },
  // 하늘에 뜬 방패연
  kites(ctx, t) {
    const kite = (x, y, c, ph) => {
      const dy = Math.round(Math.sin(t * 1.2 + ph) * 3);
      px(ctx, '#fffaf0', x - 9, y - 11 + dy, 18, 22);
      px(ctx, c, x - 9, y - 11 + dy, 18, 4); px(ctx, '#2a3a8c', x - 9, y + 7 + dy, 18, 4);
      disc(ctx, x, y + dy, 3, '#fbf1dc');
      px(ctx, '#2a2033', x - 9, y - 11 + dy, 1, 22); px(ctx, '#2a2033', x + 8, y - 11 + dy, 1, 22);
      for (let i = 0; i < 26; i++) px(ctx, '#8a7a60', x + 2 + i * 0.6, y + 11 + dy + i);
    };
    kite(30, 64, '#d8424f', 0); kite(132, 78, '#f5c542', 1.6);
    // 복주머니 등
    [[56, 30], [104, 30]].forEach(([x, y], i) => { const dy = Math.round(Math.sin(t * 1.5 + i) * 1); px(ctx, '#d8424f', x - 4, y + dy, 9, 8); px(ctx, '#f5c542', x - 1, y + 2 + dy, 3, 3); px(ctx, '#f5c542', x - 2, y - 2 + dy, 5, 2); });
  },
};

const FRONT = {
  arch(ctx, t, T) {
    const cx = 80, cy = 104, R = 46;
    ctx.fillStyle = T.arch;
    for (let a = 0; a <= Math.PI; a += 0.02) ctx.fillRect(Math.round(cx + Math.cos(a) * R) - 1, Math.round(cy - Math.sin(a) * R) - 1, 3, 3);
    ctx.fillRect(cx - R - 1, cy, 3, FLOOR_Y - cy);
    ctx.fillRect(cx + R - 1, cy, 3, FLOOR_Y - cy);
    const F = T.flowers;
    let i = 0;
    for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 14, i++) flower(ctx, Math.round(cx + Math.cos(a) * R), Math.round(cy - Math.sin(a) * R), F[i % 4], t + i);
    for (let y = cy + 10, j = 0; y < FLOOR_Y - 4; y += 12, j++) { flower(ctx, cx - R, y, F[(j + 1) % 4], t + j); flower(ctx, cx + R, y, F[(j + 2) % 4], t + j); }
  },
  balloons(ctx, t) {
    const cols = ['#f48fb1', '#8fd3f4', '#f5c542', '#b49cf0', '#a8e6a1'];
    [[14, 74], [30, 60], [130, 62], [146, 78], [80, 58]].forEach(([x, y], i) => {
      const dy = Math.round(Math.sin(t * 1.3 + i) * 2);
      disc(ctx, x, y + dy, 7, cols[i]); px(ctx, '#ffffff', x - 3, y - 4 + dy, 2, 2);
      for (let k = 0; k < 40; k++) px(ctx, '#9a8fb0', x + Math.sin(k / 6 + i) * 1, y + 8 + dy + k);
    });
  },
  grass(ctx, t) {
    for (let i = 0; i < 18; i++) {
      const x = i < 9 ? 2 + i * 3 : 132 + (i - 9) * 3, h = 16 + (i * 7) % 12, sw = Math.sin(t + i) * 2;
      for (let k = 0; k < h; k++) px(ctx, k < h - 4 ? '#c9a070' : '#f3e2c0', x + sw * k / h, FLOOR_Y - k);
    }
  },
};

function flower(ctx, x, y, col, phase) {
  const b = Math.sin(phase * 0.8) > 0.6 ? 1 : 0; // 살짝 반짝
  ctx.fillStyle = col;
  ctx.fillRect(x - 2, y - 1, 5, 3);
  ctx.fillRect(x - 1, y - 2, 3, 5);
  ctx.fillStyle = b ? '#ffffff' : '#f5c542';
  ctx.fillRect(x, y, 1, 1);
}

window.Stage = { LW, LH, FLOOR_Y, CHAR_SCALE, PAIR_X, THEMES, setTheme, setupCanvas, toLogical, drawSprite, drawText, drawVenue };
