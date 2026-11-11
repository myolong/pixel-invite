// 무대 공통: 캔버스 크기, 예식장 배경, 그림·글자 그리기
'use strict';

const LW = 160, LH = 204;          // 논리 해상도(픽셀 그림 기준)
const FLOOR_Y = 176;               // 바닥선

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

// 장면 색: 종류(InviteKinds의 scene)마다 벽·깃발·아치·꽃(풍선) 색이 다르다
const THEMES = {
  wedding: { wall: '#ffeef2', stripe: '#ffe2e9', line: '#c9a3ae', flags: ['#f48fb1', '#8fd3f4', '#f5c542', '#a8e6a1'],
    arch: '#7cc47f', flowers: FLOWER_COLORS, floor: '#f2cfa6', floor2: '#e6bd90', road: '#e8687f', edge: '#f6c1cb' },
  party: { wall: '#f1ecff', stripe: '#e6defc', line: '#a99bc9', flags: ['#f48fb1', '#8fd3f4', '#f5c542', '#b49cf0'],
    arch: '#b49cf0', flowers: ['#f48fb1', '#8fd3f4', '#f5c542', '#a8e6a1'], floor: '#f2cfa6', floor2: '#e6bd90', road: '#8f7ae0', edge: '#cfc4f7' },
  winter: { wall: '#24304f', stripe: '#2c3a5e', line: '#8d93a8', flags: ['#d8424f', '#5bbf6a', '#f5c542', '#ffffff'],
    arch: '#3e8e57', flowers: ['#f5c542', '#d8424f', '#ffffff', '#8fd3f4'], floor: '#d9c2a3', floor2: '#c8ad8b', road: '#b8323f', edge: '#f2b0b8', snow: true },
  newyear: { wall: '#fff4e0', stripe: '#ffe9c4', line: '#c9a37a', flags: ['#d8424f', '#f5c542', '#3b6fb6', '#5bbf6a'],
    arch: '#d8424f', flowers: ['#f5c542', '#ffffff', '#f5c542', '#ffd27a'], floor: '#f2cfa6', floor2: '#e6bd90', road: '#d8424f', edge: '#f7b6a0' },
  baby: { wall: '#eaf7f4', stripe: '#dcf1ec', line: '#9cc7bd', flags: ['#bfe3f7', '#f7c6d9', '#fff1a8', '#c9f0d8'],
    arch: '#9fd9c8', flowers: ['#bfe3f7', '#f7c6d9', '#fff1a8', '#ffffff'], floor: '#f2dcc0', floor2: '#e6c9a6', road: '#8fc7e8', edge: '#d6ecf8' },
};
let currentTheme = THEMES.wedding;
function setTheme(name) { currentTheme = THEMES[name] || THEMES.wedding; }

// 무대 배경: 벽지, 깃발, 아치, 마루, 길. 테마는 setTheme으로 바꾼다.
function drawVenue(ctx, t = 0) {
  const T = currentTheme;
  // 벽
  ctx.fillStyle = T.wall;
  ctx.fillRect(0, 0, LW, FLOOR_Y);
  ctx.fillStyle = T.stripe;
  for (let x = 4; x < LW; x += 12) ctx.fillRect(x, 0, 2, FLOOR_Y);
  if (T.snow) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 28; i++) {
      const sx = (i * 37 + Math.sin(t * 0.3 + i) * 4) % LW;
      const sy = (i * 53 + t * 6) % FLOOR_Y;
      ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
  }

  // 깃발 줄
  ctx.fillStyle = T.line;
  for (let x = 0; x < LW; x++) ctx.fillRect(x, 10 + Math.round(Math.sin(x / 26) * 3), 1, 1);
  for (let i = 0; i < 10; i++) {
    const fx = 6 + i * 16, fy = 10 + Math.round(Math.sin(fx / 26) * 3);
    ctx.fillStyle = T.flags[i % 4];
    for (let r = 0; r < 6; r++) ctx.fillRect(fx + r / 2, fy + r, 7 - r, 1);
  }

  // 마루
  ctx.fillStyle = T.floor;
  ctx.fillRect(0, FLOOR_Y, LW, LH - FLOOR_Y);
  ctx.fillStyle = T.floor2;
  for (let y = FLOOR_Y + 6; y < LH; y += 8) ctx.fillRect(0, y, LW, 1);
  // 길(원근)
  for (let y = FLOOR_Y; y < LH; y++) {
    const k = (y - FLOOR_Y) / (LH - FLOOR_Y);
    const half = 14 + k * 26;
    ctx.fillStyle = T.road;
    ctx.fillRect(Math.round(80 - half), y, Math.round(half * 2), 1);
    ctx.fillStyle = T.edge;
    ctx.fillRect(Math.round(80 - half), y, 1, 1);
    ctx.fillRect(Math.round(80 + half) - 1, y, 1, 1);
  }

  // 아치
  const cx = 80, cy = 104, R = 46;
  ctx.fillStyle = T.arch;
  for (let a = 0; a <= Math.PI; a += 0.02) {
    ctx.fillRect(Math.round(cx + Math.cos(a) * R) - 1, Math.round(cy - Math.sin(a) * R) - 1, 3, 3);
  }
  ctx.fillRect(cx - R - 1, cy, 3, FLOOR_Y - cy);
  ctx.fillRect(cx + R - 1, cy, 3, FLOOR_Y - cy);
  const F = T.flowers;
  let i = 0;
  for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 14, i++) {
    const fx = Math.round(cx + Math.cos(a) * R), fy = Math.round(cy - Math.sin(a) * R);
    flower(ctx, fx, fy, F[i % 4], t + i);
  }
  for (let y = cy + 10, j = 0; y < FLOOR_Y - 4; y += 12, j++) {
    flower(ctx, cx - R, y, F[(j + 1) % 4], t + j);
    flower(ctx, cx + R, y, F[(j + 2) % 4], t + j);
  }
}

function flower(ctx, x, y, col, phase) {
  const b = Math.sin(phase * 0.8) > 0.6 ? 1 : 0; // 살짝 반짝
  ctx.fillStyle = col;
  ctx.fillRect(x - 2, y - 1, 5, 3);
  ctx.fillRect(x - 1, y - 2, 3, 5);
  ctx.fillStyle = b ? '#ffffff' : '#f5c542';
  ctx.fillRect(x, y, 1, 1);
}

window.Stage = { LW, LH, FLOOR_Y, THEMES, setTheme, setupCanvas, toLogical, drawSprite, drawText, drawVenue };
