// 무대 공통: 캔버스 크기, 예식장 배경, 그림·글자 그리기
'use strict';

const LW = 160, LH = 204;          // 논리 해상도(픽셀 그림 기준)
const FLOOR_Y = 176;
const CHAR_SCALE = 3;               // 서 있는 캐릭터 배율(16x24 → 48x72)
const PAIR_X = [50, 110];
const DONGLE = 1.6;                 // 동글 글자체는 글자가 작아서 키운다           // 두 사람이 설 자리               // 바닥선

function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const fit = () => {
    const cssW = canvas.parentElement.clientWidth || 360;
    const dpr = window.devicePixelRatio || 1;
    const s = Math.max(2, (cssW * dpr) / LW);
    canvas.width = Math.round(LW * s);
    canvas.height = Math.round(LH * s);
    ctx.setTransform(canvas.width / LW, 0, 0, canvas.height / LH, 0, 0);
    ctx.imageSmoothingEnabled = true;
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
  if (img.toon) return drawToon(ctx, img, cx, bottom, scale, flip);
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

// 둥근 판(테두리 + 아래 그림자): 게임 카드·버튼에 쓴다
function panel(ctx, x, y, w, h, fill, r = 3, ink = '#2a2033') {
  ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x + 0.8, y + 0.8, w - 1.6, h - 2.6, Math.max(0, r - 0.8)); ctx.fill();
}

// 2D 애니메이션 캐릭터(toon.js): 고해상도 캔버스를 부드럽게 줄여 그린다. lw·lh가 논리 크기, 발끝 가운데가 (cx,bottom)
function drawToon(ctx, img, cx, bottom, scale, flip) {
  const w = img.lw * scale, h = img.lh * scale, x = cx - w / 2, y = bottom - h;
  const layer = im => {
    if (flip) { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, y, w, h); ctx.restore(); }
    else ctx.drawImage(im, x, y, w, h);
  };
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  layer(img);
  if (img.face && img.face.complete && img.face.naturalWidth) {
    const r = img.faceBox.r * scale * 1.05, a = img.face.naturalWidth / img.face.naturalHeight;
    const fw = a <= 1 ? 2 * r * a : 2 * r, fh = a <= 1 ? 2 * r : 2 * r / a;
    const fx = cx, fy = bottom + img.faceBox.y * scale;
    ctx.beginPath(); ctx.ellipse(fx, fy, fw / 2 + scale * 0.4, fh / 2 + scale * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2033'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(fx, fy, fw / 2, fh / 2, 0, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img.face, fx - fw / 2, fy - fh / 2, fw, fh);
    ctx.restore();
  }
  if (img.over) layer(img.over);
  ctx.restore();
}

function drawText(ctx, text, x, y, size, color = '#2a2033', align = 'center', outline = '#ffffff') {
  ctx.font = `700 ${size * DONGLE}px Dongle, sans-serif`;
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

const mix = (a, b, k) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
// 그리기 도우미(둥근 선과 면)
const circ = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const oval = (ctx, x, y, rx, ry, c, rot = 0) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); };
const rbox = (ctx, x, y, w, h, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const vgrad = (ctx, y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
function glow(ctx, x, y, r, col, a = 0.35) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.length === 7 ? col + Math.round(a * 255).toString(16).padStart(2, '0') : col); g.addColorStop(1, col.length === 7 ? col + '00' : 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function heart(ctx, x, y, s, c) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 0.9, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 0.9, x + s * 1.3, y, x, y + s * 0.9);
  ctx.fill();
}
function star(ctx, x, y, r, c, rot = 0) {
  ctx.fillStyle = c; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}
// 흔들리는 줄(깃발·전구용) y 위치
const ropeY = (x, base, sag) => base + Math.sin((x / LW) * Math.PI) * sag;

// 무대 배경. 테마는 setTheme으로 바꾼다. t는 초×3.
function drawVenue(ctx, t = 0) {
  const T = currentTheme;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 벽 또는 하늘
  if (T.sky) {
    ctx.fillStyle = vgrad(ctx, 0, FLOOR_Y, T.sky[0], T.sky[1]); ctx.fillRect(0, 0, LW, FLOOR_Y);
  } else {
    ctx.fillStyle = vgrad(ctx, 0, FLOOR_Y, mix(T.wall, '#ffffff', 0.25), T.wall); ctx.fillRect(0, 0, LW, FLOOR_Y);
    if (T.stripe) { ctx.fillStyle = T.stripe; for (let x = 3; x < LW; x += 14) { ctx.beginPath(); ctx.roundRect(x, -4, 6, FLOOR_Y + 4, 3); ctx.fill(); } }
    if (T.lattice) {
      ctx.strokeStyle = T.lattice; ctx.lineWidth = 1.4;
      for (let x = 0; x <= LW; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR_Y); ctx.stroke(); }
      for (let y = 10; y < FLOOR_Y; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LW, y); ctx.stroke(); }
      ctx.lineWidth = 0.8;
      for (let x = 10; x < LW; x += 20) for (let y = 0; y < FLOOR_Y; y += 20) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke(); }
    }
    // 아래쪽 걸레받이
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, FLOOR_Y - 8, LW, 8);
  }
  if (T.stars) {
    for (let i = 0; i < 30; i++) {
      const sx = (i * 47 + 7) % LW, sy = (i * 29 + 5) % 112, tw = (Math.sin(t * 0.7 + i * 1.7) + 1) / 2;
      ctx.globalAlpha = 0.35 + tw * 0.65;
      if (i % 6 === 0) star(ctx, sx, sy, 1.8 + tw * 0.6, '#fff1a8', t * 0.05 + i);
      else circ(ctx, sx, sy, 0.5 + tw * 0.45, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  if (T.back) BACK[T.back](ctx, t);
  if (T.snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 34; i++) {
      const r = 0.6 + (i % 3) * 0.35;
      const sx = ((i * 37 + Math.sin(t * 0.3 + i) * 4) % LW + LW) % LW;
      const sy = (i * 53 + t * (4 + (i % 3) * 1.5)) % (FLOOR_Y + 4) - 2;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (T.flags) {
    ctx.strokeStyle = T.line; ctx.lineWidth = 0.8;
    ctx.beginPath(); for (let x = -2; x <= LW + 2; x += 2) { const y = ropeY(x, 6, 7); x === -2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const fx = 3 + i * 15, fy = ropeY(fx, 6, 7), sw = Math.sin(t * 0.8 + i) * 0.8;
      ctx.fillStyle = T.flags[i % 4];
      ctx.beginPath(); ctx.moveTo(fx - 0.5, fy); ctx.lineTo(fx + 10.5, ropeY(fx + 11, 6, 7)); ctx.lineTo(fx + 5 + sw, fy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(fx + 1, fy + 0.6); ctx.lineTo(fx + 4, fy + 0.8); ctx.lineTo(fx + 4.4 + sw, fy + 6); ctx.closePath(); ctx.fill();
    }
  }
  if (T.lights) {
    const cols = ['#ffd166', '#ff6b6b', '#6ee7a8', '#7cc7ff', '#ff9ad5'];
    ctx.strokeStyle = 'rgba(20,30,25,0.8)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); for (let x = -2; x <= LW + 2; x += 2) { const y = ropeY(x, 6, 9); x === -2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    for (let i = 0; i < 13; i++) {
      const bx = 5 + i * 12.5, by = ropeY(bx, 6, 9) + 3.2, on = (Math.sin(t * 1 + i * 1.7) + 1) / 2, c = cols[i % 5];
      glow(ctx, bx, by, 6 + on * 3, c, 0.25 + on * 0.35);
      ctx.globalAlpha = 0.6 + on * 0.4; oval(ctx, bx, by, 1.9, 2.7, c); ctx.globalAlpha = 1;
      rbox(ctx, bx - 1, by - 4, 2, 1.6, 0.5, '#3a3f4a');
      circ(ctx, bx - 0.6, by - 0.8, 0.6, 'rgba(255,255,255,0.8)');
    }
  }

  // 마루와 길(원근)
  ctx.fillStyle = vgrad(ctx, FLOOR_Y, LH, T.floor, T.floor2); ctx.fillRect(0, FLOOR_Y, LW, LH - FLOOR_Y);
  ctx.fillStyle = 'rgba(80,40,10,0.12)';
  [FLOOR_Y + 5, FLOOR_Y + 12, FLOOR_Y + 21].forEach(y => ctx.fillRect(0, y, LW, 0.7));
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, FLOOR_Y, LW, 1.2);
  ctx.fillStyle = T.road;
  ctx.beginPath(); ctx.moveTo(80 - 15, FLOOR_Y); ctx.lineTo(80 + 15, FLOOR_Y); ctx.lineTo(80 + 42, LH); ctx.lineTo(80 - 42, LH); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = T.edge; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(80 - 14, FLOOR_Y); ctx.lineTo(80 - 40, LH); ctx.moveTo(80 + 14, FLOOR_Y); ctx.lineTo(80 + 40, LH); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.beginPath(); ctx.moveTo(80 - 11, FLOOR_Y); ctx.lineTo(80 - 6, FLOOR_Y); ctx.lineTo(80 - 22, LH); ctx.lineTo(80 - 34, LH); ctx.closePath(); ctx.fill();
  if (T.front) FRONT[T.front](ctx, t, T);
  ctx.restore();
}

const BACK = {
  // 자정을 향하는 큰 시계
  clock(ctx, t) {
    const cx = 80, cy = 84;
    glow(ctx, cx, cy, 52, '#ffe9a8', 0.18);
    circ(ctx, cx + 1, cy + 2, 27, 'rgba(0,0,0,0.25)');
    circ(ctx, cx, cy, 27, '#d8ae52'); circ(ctx, cx, cy, 24, '#b58a3a'); circ(ctx, cx, cy, 22.5, '#fffaf0');
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circ(ctx, cx + Math.sin(a) * 18.5, cy - Math.cos(a) * 18.5, i % 3 ? 0.8 : 1.6, '#2a2033'); }
    ctx.strokeStyle = '#2a2033';
    const m = (55 + (t * 0.5) % 5) / 60 * Math.PI * 2, hh = (11 + 55 / 60) / 12 * Math.PI * 2;
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(m) * 16, cy - Math.cos(m) * 16); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(hh) * 10, cy - Math.cos(hh) * 10); ctx.stroke();
    circ(ctx, cx, cy, 2, '#e0526e');
    // 반짝이
    [[cx - 36, cy - 22], [cx + 38, cy - 12], [cx - 30, cy + 26]].forEach(([x, y], i) => { const k = (Math.sin(t * 0.9 + i * 2) + 1) / 2; ctx.globalAlpha = k; star(ctx, x, y, 2 + k * 1.5, '#fff1a8'); });
    ctx.globalAlpha = 1;
  },
  // 크리스마스트리와 선물
  tree(ctx, t) {
    const cx = 80, base = FLOOR_Y - 10;
    glow(ctx, cx, 100, 70, '#fff0c8', 0.12);
    rbox(ctx, cx - 5, base - 4, 10, 14, 2, '#7a4a2a');
    [[base, 44, 38], [base - 28, 35, 34], [base - 54, 26, 30]].forEach(([y, w, h]) => {
      const g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#34955a'); g.addColorStop(1, '#1f6a3c');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(cx, y - h); ctx.quadraticCurveTo(cx + w * 0.45, y - h * 0.4, cx + w, y); ctx.quadraticCurveTo(cx, y + 6, cx - w, y); ctx.quadraticCurveTo(cx - w * 0.45, y - h * 0.4, cx, y - h); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.9, y - 1); ctx.quadraticCurveTo(cx, y + 5, cx + w * 0.9, y - 1); ctx.stroke();
    });
    const orn = [[-26, base - 6, '#ff6b6b'], [22, base - 9, '#ffd166'], [-10, base - 18, '#7cc7ff'], [14, base - 32, '#ff9ad5'], [-17, base - 40, '#ffd166'], [6, base - 52, '#ff6b6b'], [-5, base - 66, '#6ee7a8'], [30, base - 3, '#7cc7ff']];
    orn.forEach(([dx, y, c], i) => {
      const tw = (Math.sin(t * 0.8 + i) + 1) / 2;
      glow(ctx, cx + dx, y, 5, c, 0.2 + tw * 0.4);
      circ(ctx, cx + dx, y, 2.6, c); circ(ctx, cx + dx - 0.8, y - 0.8, 0.8, 'rgba(255,255,255,0.85)');
    });
    const sy = base - 86, s = 7 + Math.sin(t) * 0.7;
    glow(ctx, cx, sy, 14, '#ffe27a', 0.5);
    star(ctx, cx, sy, s, '#ffd84d', Math.sin(t * 0.33) * 0.15);
    const gift = (x, s, body, rib, ph) => {
      const hop = Math.max(0, Math.sin(t * 0.8 + ph)) * 1.5;
      oval(ctx, x + s / 2, FLOOR_Y, s * 0.6, 1.6, 'rgba(0,0,0,0.12)');
      rbox(ctx, x, FLOOR_Y - s - hop, s, s, 2, body);
      ctx.fillStyle = rib; ctx.fillRect(x + s / 2 - 1.3, FLOOR_Y - s - hop, 2.6, s); ctx.fillRect(x, FLOOR_Y - s * 0.6 - hop, s, 2.4);
      oval(ctx, x + s / 2 - 3, FLOOR_Y - s - hop - 1.5, 3, 2, rib, -0.4); oval(ctx, x + s / 2 + 3, FLOOR_Y - s - hop - 1.5, 3, 2, rib, 0.4);
    };
    gift(cx - 44, 14, '#7cc7ff', '#ff6b6b', 0); gift(cx + 31, 11, '#ff9ad5', '#ffd166', 1);
  },
  // 산 너머 해돋이
  sunrise(ctx, t) {
    const rise = Math.min(1, (t % 30) / 6), sy = 124 - rise * 12;
    glow(ctx, 80, sy, 70, '#fff3c0', 0.6);
    ctx.save(); ctx.translate(80, sy); ctx.rotate(t * 0.03);
    ctx.fillStyle = 'rgba(255,230,150,0.35)';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(-3, -34); ctx.lineTo(3, -34); ctx.lineTo(0, -52 - Math.sin(t + i) * 3); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    circ(ctx, 80, sy, 28, '#ffd24a'); circ(ctx, 80, sy, 23, '#ffb43a');
    circ(ctx, 72, sy - 8, 6, 'rgba(255,255,255,0.25)');
    const hill = (x0, w, h, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0 - w, FLOOR_Y); ctx.quadraticCurveTo(x0, FLOOR_Y - h * 2, x0 + w, FLOOR_Y); ctx.closePath(); ctx.fill(); };
    hill(18, 54, 54, '#8a78aa'); hill(142, 58, 60, '#8a78aa'); hill(80, 66, 40, '#6a5c8e');
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; [[18, 54], [142, 60]].forEach(([x, h]) => { ctx.beginPath(); ctx.moveTo(x - 9, FLOOR_Y - h + 9); ctx.quadraticCurveTo(x, FLOOR_Y - h - 1, x + 9, FLOOR_Y - h + 9); ctx.quadraticCurveTo(x, FLOOR_Y - h + 6, x - 9, FLOOR_Y - h + 9); ctx.fill(); });
    const cloud = (x, y, s) => { ctx.fillStyle = '#fff7ea'; [[0, 0, 7], [7, -3, 6], [13, 0, 5], [-6, 1, 5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); }); ctx.fillRect(x - 6 * s, y, 19 * s, 5 * s); };
    cloud(22 + Math.sin(t * 0.1) * 3, 40, 0.9); cloud(124 + Math.sin(t * 0.1 + 1) * 3, 28, 0.75);
  },
  // 보름달과 토끼 그림자
  moon(ctx, t) {
    glow(ctx, 80, 82, 64, '#fff4c2', 0.35);
    circ(ctx, 80, 82, 28, '#fff4c2'); circ(ctx, 82, 84, 25.5, '#ffe9a0');
    [[70, 74, 3.5], [92, 92, 4.5], [88, 70, 2.4], [70, 95, 2.5]].forEach(([x, y, r]) => circ(ctx, x, y, r, 'rgba(225,190,110,0.45)'));
    // 토끼 그림자
    ctx.fillStyle = 'rgba(200,160,90,0.35)';
    oval(ctx, 84, 88, 6, 4.5, ctx.fillStyle); oval(ctx, 80, 82, 3.4, 3, ctx.fillStyle);
    oval(ctx, 78, 75, 1.2, 4, ctx.fillStyle, -0.3); oval(ctx, 81, 75, 1.2, 4, ctx.fillStyle, 0.2);
    // 지나가는 구름
    const cx = ((t * 3) % 220) - 40;
    ctx.fillStyle = 'rgba(80,80,140,0.75)';
    [[0, 0, 7], [8, -3, 6], [15, 0, 5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx, 102 + dy, r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillRect(cx - 7, 102, 27, 5);
  },
  // 밤 도시와 번쩍 번개
  city(ctx, t) {
    const B = [[-2, 28, 66], [24, 18, 94], [40, 22, 58], [60, 16, 82], [74, 14, 104], [86, 20, 72], [104, 18, 90], [120, 22, 62], [140, 22, 86]];
    B.forEach(([x, w, h], i) => {
      const top = FLOOR_Y - h;
      ctx.fillStyle = vgrad(ctx, top, FLOOR_Y, i % 2 ? '#3a3266' : '#433a72', '#211d3a');
      ctx.beginPath(); ctx.roundRect(x, top, w, h + 2, [3, 3, 0, 0]); ctx.fill();
      for (let wy = top + 5; wy < FLOOR_Y - 5; wy += 7) for (let wx = x + 3.5; wx < x + w - 4; wx += 5.5) {
        if (((Math.round(wx) * 7 + wy * 13 + i) % 5) < 3) {
          const on = Math.floor(t * 0.4 + wx + wy) % 9;
          rbox(ctx, wx, wy, 2.4, 3.2, 0.6, on ? '#ffd970' : '#6a5f3a');
        }
      }
    });
    const ph = t % 3.2;
    if (ph < 0.3) {
      if (ph < 0.1) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, 0, LW, FLOOR_Y); }
      ctx.save(); ctx.shadowColor = '#fff7a0'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#fff3a0'; ctx.beginPath();
      ctx.moveTo(120, 18); ctx.lineTo(106, 42); ctx.lineTo(115, 42); ctx.lineTo(102, 66); ctx.lineTo(112, 64); ctx.lineTo(98, 88);
      ctx.lineTo(118, 58); ctx.lineTo(109, 60); ctx.lineTo(122, 38); ctx.lineTo(113, 38); ctx.lineTo(126, 18); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  },
  // 큰 편지 봉투와 하트 봉인
  envelope(ctx, t) {
    const x = 40, y = 62 + Math.sin(t * 0.5) * 1.5, w = 80, h = 54;
    oval(ctx, 80, FLOOR_Y - 14, 34, 3, 'rgba(0,0,0,0.06)');
    rbox(ctx, x + 1.5, y + 2.5, w, h, 4, 'rgba(160,110,70,0.18)');
    rbox(ctx, x, y, w, h, 4, '#fffaf2');
    ctx.fillStyle = '#f6e7d4';
    ctx.beginPath(); ctx.moveTo(x + 2, y + h - 1); ctx.lineTo(80, y + h * 0.5); ctx.lineTo(x + w - 2, y + h - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1dcc2';
    ctx.beginPath(); ctx.moveTo(x + 1, y + 2); ctx.lineTo(80, y + h * 0.62); ctx.lineTo(x + w - 1, y + 2); ctx.closePath(); ctx.fill();
    const hy = y + h * 0.62;
    circ(ctx, 80, hy, 7.5, '#e0526e'); heart(ctx, 80, hy, 3.6, '#ffd1dc');
    for (let i = 0; i < 6; i++) {
      const fy = 160 - ((t * 7 + i * 26) % 150), fx = 14 + i * 26 + Math.sin(t * 0.4 + i) * 4;
      ctx.globalAlpha = Math.min(1, (160 - fy) / 30, fy / 30);
      heart(ctx, fx, fy, 2.6, i % 2 ? '#f7a8c0' : '#f48fb1');
    }
    ctx.globalAlpha = 1;
  },
  // 하늘에 뜬 방패연
  kites(ctx, t) {
    const kite = (x, y, c, ph) => {
      const dy = Math.sin(t * 0.4 + ph) * 3, rot = Math.sin(t * 0.3 + ph) * 0.08;
      ctx.save(); ctx.translate(x, y + dy); ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(120,100,70,0.7)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(0, 11); ctx.bezierCurveTo(6, 26, 14, 30, 22, 46); ctx.stroke();
      rbox(ctx, -10, -12, 20, 24, 2, '#fffaf0');
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-10, -12, 20, 5, [2, 2, 0, 0]); ctx.fill();
      ctx.fillStyle = '#2a3a8c'; ctx.beginPath(); ctx.roundRect(-10, 7, 20, 5, [0, 0, 2, 2]); ctx.fill();
      circ(ctx, 0, 0, 3.6, '#f1e4c4');
      ctx.strokeStyle = '#2a2033'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.roundRect(-10, -12, 20, 24, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(10, 12); ctx.moveTo(10, -12); ctx.lineTo(-10, 12); ctx.stroke();
      ctx.restore();
    };
    kite(30, 60, '#d8424f', 0); kite(130, 76, '#f5c542', 1.6);
    // 복주머니
    [[56, 30], [104, 30]].forEach(([x, y], i) => {
      const dy = Math.sin(t * 0.5 + i) * 1.2;
      ctx.strokeStyle = '#b58a3a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 3 + dy); ctx.stroke();
      ctx.fillStyle = '#d8424f'; ctx.beginPath(); ctx.moveTo(x - 3, y - 1 + dy); ctx.bezierCurveTo(x - 9, y + 3 + dy, x - 7, y + 11 + dy, x, y + 11 + dy); ctx.bezierCurveTo(x + 7, y + 11 + dy, x + 9, y + 3 + dy, x + 3, y - 1 + dy); ctx.closePath(); ctx.fill();
      rbox(ctx, x - 4, y - 3 + dy, 8, 2.4, 1.2, '#f5c542');
      circ(ctx, x, y + 5 + dy, 1.8, '#f5c542');
    });
  },
};

const FRONT = {
  arch(ctx, t, T) {
    const cx = 80, cy = 104, R = 46;
    ctx.strokeStyle = T.arch; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(cx - R, FLOOR_Y); ctx.lineTo(cx - R, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(cx + R, FLOOR_Y); ctx.stroke();
    ctx.strokeStyle = mix(T.arch, '#ffffff', 0.35); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R - 0.8, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    const F = T.flowers;
    let i = 0;
    for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 14, i++) {
      const x = cx + Math.cos(a) * R, y = cy - Math.sin(a) * R;
      if (i % 2) oval(ctx, x + 2.5, y - 1, 2.6, 1.3, mix(T.arch, '#000000', 0.15), a);
      flower(ctx, x, y, F[i % 4], t + i);
    }
    for (let y = cy + 10, j = 0; y < FLOOR_Y - 4; y += 12, j++) { flower(ctx, cx - R, y, F[(j + 1) % 4], t + j); flower(ctx, cx + R, y, F[(j + 2) % 4], t + j); }
  },
  balloons(ctx, t) {
    const cols = ['#f48fb1', '#7cc7ff', '#ffd166', '#b49cf0', '#8fe0a8'];
    [[14, 72], [30, 58], [130, 60], [146, 76], [80, 52]].forEach(([x, y], i) => {
      const dy = Math.sin(t * 0.45 + i) * 2, sw = Math.sin(t * 0.3 + i) * 1.5;
      ctx.strokeStyle = 'rgba(140,130,170,0.8)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x, y + 9 + dy); ctx.bezierCurveTo(x + sw, y + 22, x - sw, y + 34, x, y + 48); ctx.stroke();
      oval(ctx, x, y + dy, 7, 8.5, cols[i]);
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(x - 1.5, y + 9 + dy); ctx.lineTo(x + 1.5, y + 9 + dy); ctx.lineTo(x, y + 7 + dy); ctx.fill();
      oval(ctx, x - 2.5, y - 3.5 + dy, 1.8, 2.8, 'rgba(255,255,255,0.6)', 0.4);
    });
  },
  grass(ctx, t) {
    for (let i = 0; i < 18; i++) {
      const x = i < 9 ? 3 + i * 3.2 : 130 + (i - 9) * 3.2, h = 18 + (i * 7) % 12, sw = Math.sin(t * 0.3 + i) * 3;
      ctx.strokeStyle = '#c9a070'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.quadraticCurveTo(x + sw * 0.3, FLOOR_Y - h / 2, x + sw, FLOOR_Y - h); ctx.stroke();
      oval(ctx, x + sw, FLOOR_Y - h, 1.6, 4, '#f3e2c0', sw * 0.06);
    }
  },
};

function flower(ctx, x, y, col, phase) {
  const sp = Math.sin(phase * 0.25) * 0.3;
  ctx.fillStyle = col;
  for (let p = 0; p < 5; p++) { const a = sp + p * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 1.9, y + Math.sin(a) * 1.9, 1.6, 0, Math.PI * 2); ctx.fill(); }
  circ(ctx, x, y, 1.1, Math.sin(phase * 0.8) > 0.6 ? '#ffffff' : '#f5c542');
}

window.Stage = { panel, DONGLE, LW, LH, FLOOR_Y, CHAR_SCALE, PAIR_X, THEMES, setTheme, setupCanvas, toLogical, drawSprite, drawText, drawVenue };
