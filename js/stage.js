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

// 예식장 배경: 벽지, 깃발, 꽃 아치, 마루, 버진로드
function drawVenue(ctx, t = 0) {
  // 벽
  ctx.fillStyle = '#ffeef2';
  ctx.fillRect(0, 0, LW, FLOOR_Y);
  ctx.fillStyle = '#ffe2e9';
  for (let x = 4; x < LW; x += 12) ctx.fillRect(x, 0, 2, FLOOR_Y);

  // 깃발 줄
  ctx.fillStyle = '#c9a3ae';
  for (let x = 0; x < LW; x++) ctx.fillRect(x, 10 + Math.round(Math.sin(x / 26) * 3), 1, 1);
  const flagCols = ['#f48fb1', '#8fd3f4', '#f5c542', '#a8e6a1'];
  for (let i = 0; i < 10; i++) {
    const fx = 6 + i * 16, fy = 10 + Math.round(Math.sin(fx / 26) * 3);
    ctx.fillStyle = flagCols[i % 4];
    for (let r = 0; r < 6; r++) ctx.fillRect(fx + r / 2, fy + r, 7 - r, 1);
  }

  // 마루
  ctx.fillStyle = '#f2cfa6';
  ctx.fillRect(0, FLOOR_Y, LW, LH - FLOOR_Y);
  ctx.fillStyle = '#e6bd90';
  for (let y = FLOOR_Y + 6; y < LH; y += 8) ctx.fillRect(0, y, LW, 1);
  // 버진로드(원근)
  for (let y = FLOOR_Y; y < LH; y++) {
    const k = (y - FLOOR_Y) / (LH - FLOOR_Y);
    const half = 14 + k * 26;
    ctx.fillStyle = '#e8687f';
    ctx.fillRect(Math.round(80 - half), y, Math.round(half * 2), 1);
    ctx.fillStyle = '#f6c1cb';
    ctx.fillRect(Math.round(80 - half), y, 1, 1);
    ctx.fillRect(Math.round(80 + half) - 1, y, 1, 1);
  }

  // 꽃 아치
  const cx = 80, cy = 104, R = 46;
  ctx.fillStyle = '#7cc47f';
  for (let a = 0; a <= Math.PI; a += 0.02) {
    ctx.fillRect(Math.round(cx + Math.cos(a) * R) - 1, Math.round(cy - Math.sin(a) * R) - 1, 3, 3);
  }
  ctx.fillRect(cx - R - 1, cy, 3, FLOOR_Y - cy);
  ctx.fillRect(cx + R - 1, cy, 3, FLOOR_Y - cy);
  let i = 0;
  for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 14, i++) {
    const fx = Math.round(cx + Math.cos(a) * R), fy = Math.round(cy - Math.sin(a) * R);
    flower(ctx, fx, fy, FLOWER_COLORS[i % 4], t + i);
  }
  for (let y = cy + 10, j = 0; y < FLOOR_Y - 4; y += 12, j++) {
    flower(ctx, cx - R, y, FLOWER_COLORS[(j + 1) % 4], t + j);
    flower(ctx, cx + R, y, FLOWER_COLORS[(j + 2) % 4], t + j);
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

window.Stage = { LW, LH, FLOOR_Y, setupCanvas, toLogical, drawSprite, drawText, drawVenue };
