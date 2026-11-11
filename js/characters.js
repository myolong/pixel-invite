// 픽셀 신랑·신부: 파츠(피부·옷·머리·안경)를 겹쳐 16x24 캐릭터를 만든다.
'use strict';

const OUTLINE = '#2a2033';

// 글자 지도(문자 하나 = 픽셀 하나)를 작은 캔버스로 굽는다. '.'은 투명.
function bakeSprite(rows, pal, outline = true) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const pad = outline ? 1 : 0;
  const c = document.createElement('canvas');
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const g = c.getContext('2d');
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] && rows[y][x] !== '.';
  if (outline) {
    g.fillStyle = OUTLINE;
    for (let y = -1; y <= h; y++) {
      for (let x = -1; x <= w; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
          g.fillRect(x + pad, y + pad, 1, 1);
        }
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!filled(x, y)) continue;
      const col = pal[rows[y][x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x + pad, y + pad, 1, 1);
    }
  }
  return c;
}

// 여러 겹의 글자 지도를 위에서부터 덮어쓴다('.'은 아래 겹을 그대로 둔다).
function stackLayers(layers, h = 24, w = 16) {
  const out = Array.from({ length: h }, () => Array(w).fill('.'));
  for (const layer of layers) {
    layer.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] !== '.') out[y][x] = row[x];
    });
  }
  return out.map(r => r.join(''));
}

const pad24 = rows => rows.concat(Array(24 - rows.length).fill('................'));

const HEAD = pad24([
  '................',
  '................',
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '....SSSSSSSS....',
  '....SSSSSSSS....',
  '....SESSSSES....',
  '....SESSSSES....',
  '....BSSSSSSB....',
  '....SSSMMSSS....',
  '.....SSSSSS.....',
  '.......SS.......',
]);
// 눈 감은 얼굴(웃는 눈) — 깜빡임과 기쁨 표정용
const HEAD_HAPPY = pad24([
  '................',
  '................',
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '....SSSSSSSS....',
  '....SSSSSSSS....',
  '....SSSSSSSS....',
  '....ESSSSSSE....',
  '....BSSSSSSB....',
  '....SSSMMSSS....',
  '.....SSSSSS.....',
  '.......SS.......',
]);

const OUTFITS = {
  tux: pad24(Array(12).fill('................').concat([
    '...TTTWRRWTTT...',
    '..TTTTWWWWTTTT..',
    '..TTTTtWWtTTTT..',
    '..TTTTTWWTTTTT..',
    '..TTTTTTTTTTTT..',
    '..SSTTTTTTTTSS..',
    '....TTTTTTTT....',
    '....TTTTTTTT....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '...KKKK..KKKK...',
  ])),
  dress: pad24(Array(12).fill('................').concat([
    '...SSDDDDDDSS...',
    '..SSDDDDDDDDSS..',
    '..SS.DDDDDD.SS..',
    '..SS.dDDDDd.SS..',
    '..SS.DDDDDD.SS..',
    '..SS.DDDDDD.SS..',
    '....DDDDDDDD....',
    '...DDDDDDDDDD...',
    '...DDdDDDDdDD...',
    '..DDDDDDDDDDDD..',
    '..DDDDDDDDDDDD..',
    '.dDDDDDDDDDDDDd.',
  ])),
};

const HAIRS = {
  short: pad24([
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHh....hHH...',
    '...H........H...',
  ]),
  long: pad24([
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '..HHHh....hHHH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..hH........Hh..',
  ]),
  bob: pad24([
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '..HHHh....hHHH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HH........HH..',
    '..HHH......HHH..',
  ]),
  bun: pad24([
    '......HHHH......',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHh....hHH...',
    '...H........H...',
  ]),
};

const VEIL = pad24([
  '.....VVVVVV.....',
  '....V......V....',
  '...V........V...',
  '..V..........V..',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  '.V............V.',
  'V..............V',
]);

const GLASSES = pad24(Array(5).fill('................').concat([
  '....GGGGGGGG....',
  '....G.G..G.G....',
  '....G.G..G.G....',
  '....GGG..GGG....',
]));

const SKINS = ['#f6d2b4', '#e8b48f', '#c98c64'];
const HAIR_COLORS = ['#2b2230', '#5a3a28', '#a0663a', '#d9b25a', '#c75b6a'];
const SUIT_COLORS = ['#2a2d3a', '#3b4a6b', '#efe9dc'];
const DRESS_COLORS = ['#ffffff', '#f6e3ec', '#e9eefb'];

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
};

// look: { outfit:'tux'|'dress', hair:'short'|'long'|'bob'|'bun', skin:0.., hairColor:0.., color:0.., glasses:bool, veil:bool }
// 반환: { stand, happy } 두 장의 굽힌 캔버스
function makeCharacter(look) {
  const outfit = OUTFITS[look.outfit] ? look.outfit : 'tux';
  const hair = HAIRS[look.hair] ? look.hair : 'short';
  const skin = SKINS[look.skin] || SKINS[0];
  const hairCol = HAIR_COLORS[look.hairColor] || HAIR_COLORS[0];
  const cloth = outfit === 'dress'
    ? (DRESS_COLORS[look.color] || DRESS_COLORS[0])
    : (SUIT_COLORS[look.color] || SUIT_COLORS[0]);
  const lightSuit = outfit === 'tux' && look.color === 2;
  const pal = {
    S: skin, E: '#2a2033', B: '#f29aa8', M: '#c2526a',
    H: hairCol, h: shade(hairCol, 0.75),
    T: cloth, t: shade(cloth, lightSuit ? 0.85 : 1.35), W: '#ffffff', R: lightSuit ? '#3b4a6b' : '#d8424f', K: '#2a2033',
    D: cloth, d: shade(cloth, 0.88),
    G: '#2a2033', V: 'rgba(255,255,255,0.85)',
  };
  const build = head => {
    const layers = [];
    if (look.veil) layers.push(VEIL);
    layers.push(head, OUTFITS[outfit], HAIRS[hair]);
    if (look.glasses) layers.push(GLASSES);
    return bakeSprite(stackLayers(layers), pal);
  };
  return { stand: build(HEAD), happy: build(HEAD_HAPPY) };
}

// 작은 소품들
const PROPS = {
  bouquet: bakeSprite([
    '..PwP..',
    '.PwPwP.',
    'wPYPwPw',
    '.PwPwP.',
    '..GGG..',
    '...G...',
    '..RRR..',
  ], { P: '#f48fb1', w: '#ffffff', Y: '#f5c542', G: '#5bbf6a', R: '#d8424f' }),
  heart: bakeSprite([
    '.RR.RR.',
    'RrRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ], { R: '#ef5b74', r: '#ffd0d8' }),
  rain: bakeSprite([
    '..CCCC..',
    '.CCCCCC.',
    'CCCCCCCC',
    '.cccccc.',
    '..b..b..',
    '.b..b...',
  ], { C: '#8d93a8', c: '#6f7488', b: '#5aa0e6' }),
};

window.PixelChars = { makeCharacter, bakeSprite, PROPS, SKINS, HAIR_COLORS, SUIT_COLORS, DRESS_COLORS };
