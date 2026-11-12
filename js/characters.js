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
  suit: pad24(Array(12).fill('................').concat([
    '...TTTWRRWTTT...',
    '..TTTTWRRWTTTT..',
    '..TTTTtRRtTTTT..',
    '..TTTTTRRTTTTT..',
    '..TTTTTTTTTTTT..',
    '..SSTTTTTTTTSS..',
    '....TTTTTTTT....',
    '....TTTTTTTT....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '...KKKK..KKKK...',
  ])),
  onepiece: pad24(Array(12).fill('................').concat([
    '...SSDDDDDDSS...',
    '..SSDDDDDDDDSS..',
    '..SS.DDDDDD.SS..',
    '..SS.dddddd.SS..',
    '..SS.DDDDDD.SS..',
    '....DDDDDDDD....',
    '...DDDDDDDDDD...',
    '...DdDDDDDDdD...',
    '.....SS..SS.....',
    '.....SS..SS.....',
    '.....SS..SS.....',
    '....KKK..KKK....',
  ])),
  hanbok: pad24(Array(12).fill('................').concat([
    '...JJJJJJJJJJ...',
    '..JJJJJOOJJJJJ..',
    '..JJJJJOJJJJJJ..',
    '..SSDDDODDDDSS..',
    '....DDDDDDDD....',
    '...DDDDDDDDDD...',
    '...DDDDDDDDDD...',
    '..DDdDDDDDDdDD..',
    '..DDDDDDDDDDDD..',
    '.DDDDDDDDDDDDDD.',
    '.DDDDDDDDDDDDDD.',
    '.dDDDDDDDDDDDDd.',
  ])),
  hoodie: pad24(Array(12).fill('................').concat([
    '...CCCCccCCCC...',
    '..CCCCWCCWCCCC..',
    '..CCCCWCCWCCCC..',
    '..CCCCCCCCCCCC..',
    '..CCCccccccCCC..',
    '..SSCCCCCCCCSS..',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...WWWW..WWWW...',
  ])),
  hanbokM: pad24(Array(12).fill('................').concat([
    '...JJTTTTTTJJ...',
    '..JJJTTOOTTJJJ..',
    '..JJJTTOTTTJJJ..',
    '..JJJTTTTTTJJJ..',
    '..SSJTTTTTTJSS..',
    '....QQQQQQQQ....',
    '...QQQQQQQQQQ...',
    '...QQQQ..QQQQ...',
    '...QQQQ..QQQQ...',
    '....QQQ..QQQ....',
    '....qqq..qqq....',
    '...KKKK..KKKK...',
  ])),
  santa: pad24(Array(12).fill('................').concat([
    '...TTTWWWWTTT...',
    '..TTTTTWWTTTTT..',
    '..TTTTTWWTTTTT..',
    '..TTTTTWWTTTTT..',
    '..WWkkkYYkkkWW..',
    '..SSTTTWWTTTSS..',
    '....TTTTTTTT....',
    '....WWWWWWWW....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '....TTT..TTT....',
    '...KKKK..KKKK...',
  ])),
  knit: pad24(Array(12).fill('................').concat([
    '....CCCccCCC....',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '..CWCWCWCWCWCC..',
    '..CCCCCCCCCCCC..',
    '..SSccccccccSS..',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...KKKK..KKKK...',
  ])),
  coat: pad24(Array(12).fill('................').concat([
    '...TTTWWWWTTT...',
    '..TTTTTWWTTTTT..',
    '..TTTTTyTTTTTT..',
    '..TTTTTTTTTTTT..',
    '..TTTTTyTTTTTT..',
    '..SSTTTTTTTTSS..',
    '....TTTTTTTT....',
    '....TTTyTTTT....',
    '....TTTTTTTT....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...KKKK..KKKK...',
  ])),
  padding: pad24(Array(12).fill('................').concat([
    '...CCCCccCCCC...',
    '.CCCCCCCCCCCCCC.',
    '.cccccccccccccc.',
    '.CCCCCCCCCCCCCC.',
    '.cccccccccccccc.',
    '.SSCCCCCCCCCCSS.',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...KKKK..KKKK...',
  ])),
  casual: pad24(Array(12).fill('................').concat([
    '....CCCccCCC....',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '..CCcCCCCCCcCC..',
    '..SSCCCCCCCCSS..',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...KKKK..KKKK...',
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
  // 올림머리: 머리 위로 크게 솟은 똥머리 + 분홍 머리끈
  bun: pad24([
    '.....HHHHHH.....',
    '....HHhHHhHH....',
    '.....HNNNNH.....',
    '...HHHHHHHHHH...',
    '...HHh....hHH...',
    '...H........H...',
  ]),
};

HAIRS.ponytail = pad24([
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHHHH.',
  '...HHh....hHHNN.',
  '...H........HNN.',
  '.............HH.',
  '.............HH.',
  '.............HH.',
  '.............Hh.',
]);
// 양갈래: 양옆으로 뻗어 내린 두 갈래 + 양쪽 머리끈(N)
HAIRS.twin = pad24([
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '.hNNHh....hHNNh.',
  'HHNN........NNHH',
  'HHH..........HHH',
  'HH............HH',
  'HH............HH',
  'Hh............hH',
  '.h............h.',
]);
// 파마: 크게 부풀고 울퉁불퉁한 곱슬(진한 점이 컬)
HAIRS.perm = pad24([
  '....HhHHhHHh....',
  '..HHHHhHHhHHHH..',
  '.HhHHHHHHHHHHhH.',
  '.HHhHHHHHHHHhHH.',
  'HhHHHh....hHHHhH',
  'HHhH........HhHH',
  '.HHh........hHH.',
  'HhHH........HHhH',
  '.HHh........hHH.',
  'HhH..........HhH',
  '.hH..........Hh.',
  '..h..........h..',
]);

// 소품: 얼굴(사진 얼굴 포함) 위에 따로 그리는 겹. 키는 make 화면의 '소품'
const ACCS = {
  santaHat: pad24([
    '......RRRRR.WW..',
    '.....RRRRRRRWW..',
    '...WWWWWWWWWW...',
  ]),
  antler: pad24([
    '.A..A......A..A.',
    '.AAAA......AAAA.',
    '...AA......AA...',
    '...AAAAAAAAAA...',
  ]),
  partyHat: pad24([
    '.......YY.......',
    '.......PP.......',
    '......PpPP......',
    '.....PPPPpP.....',
  ]),
  cap: pad24([
    '................',
    '....CCCCCCCC....',
    '...CCCCCCCCCC...',
    '...cccccccccccc.',
  ]),
  beanie: pad24([
    '.......WW.......',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...bbbbbbbbbb...',
  ]),
  ribbon: pad24([
    '.........RR.RR..',
    '.........RRRRR..',
    '.........RR.RR..',
  ]),
  flower: pad24([
    '................',
    '................',
    '...FGFwFGFyFGF..',
  ]),
  bokgeon: pad24([
    '.....KKKKKK.....',
    '....KKKKKKKK....',
    '...KKKKKKKKKK...',
    '...K........K...',
  ]),
  jobawi: pad24([
    '.......RR.......',
    '....JJJJJJJJ....',
    '...JJRJJJJRJJ...',
    '...J........J...',
  ]),
  scarf: pad24([
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '.........XX.....',
  ]),
};
const ACC_PAL = { R: '#d8424f', W: '#ffffff', A: '#8a5a3a', Y: '#f5c542', P: '#7cc4f4', p: '#f48fb1', C: '#4a6fd1', c: '#2f4fa8', B: '#d84a4a', b: '#f4efe6', F: '#f48fb1', G: '#5bbf6a', w: '#ffffff', y: '#f5c542', K: '#2a2033', J: '#4a3266', X: '#d84a4a' };

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

// 예전 링크의 번호가 그대로 맞도록 새 색은 뒤에 붙인다. 보여 주는 순서는 *_ORDER
const SKINS = ['#f6d2b4', '#e8b48f', '#c98c64', '#fbe3cf', '#eec19b', '#d39a6f', '#8d5a3b'];
const SKIN_ORDER = [3, 0, 4, 1, 5, 2, 6];
const HAIR_COLORS = ['#2b2230', '#5a3a28', '#a0663a', '#d9b25a', '#c75b6a', '#9a96a0', '#3f5a9a'];
const SUIT_COLORS = ['#2a2d3a', '#3b4a6b', '#efe9dc', '#4a4a52', '#6b3a4a', '#4d5b49', '#8c8fa3'];
const DRESS_COLORS = ['#ffffff', '#f6e3ec', '#e9eefb', '#fff1d2', '#e5f3e3', '#ece1f7', '#f6d0c8'];
const CASUAL_COLORS = ['#f2b84b', '#7cc4a4', '#e98aa5', '#d84a4a', '#a99be8', '#4a6fd1', '#ffffff'];
const BIZ_COLORS = ['#2b2e3b', '#26365e', '#5a5d66', '#7a5a3e', '#d9cfbd', '#3e5a4a', '#6b3a4a'];
const ONEPIECE_COLORS = ['#e98aa5', '#f2b84b', '#7cc4a4', '#4a6fd1', '#ffffff', '#d84a4a', '#a99be8'];
const HANBOK_COLORS = ['#d8424f', '#e98aa5', '#3b4a8c', '#f2c94c', '#7cc4a4', '#9b6bd1', '#2f6e5f'];
const HOODIE_COLORS = ['#9aa0aa', '#4a4a52', '#f2b84b', '#7cc4a4', '#e98aa5', '#4a6fd1', '#ffffff'];
const HANBOKM_COLORS = ['#3b4a8c', '#2f6e5f', '#8c3b4a', '#c98c3a', '#5a5d66', '#7cc4a4', '#9b6bd1'];
const SANTA_COLORS = ['#d8424f', '#2f8a4f', '#3b4a8c', '#e98aa5', '#f2b84b', '#9b6bd1', '#4a4a52'];
const KNIT_COLORS = ['#d84a4a', '#2f8a4f', '#f2e6d0', '#4a6fd1', '#f2b84b', '#e98aa5', '#7a5a3e'];
const COAT_COLORS = ['#c9a27a', '#4a4a52', '#26365e', '#8c3b4a', '#efe9dc', '#5a5d66', '#3e5a4a'];
const PADDING_COLORS = ['#2a2d3a', '#f2f2f2', '#d84a4a', '#4a6fd1', '#f2b84b', '#7cc4a4', '#e98aa5'];
const OUTFIT_COLORS = { hanbokM: HANBOKM_COLORS, santa: SANTA_COLORS, knit: KNIT_COLORS, coat: COAT_COLORS, padding: PADDING_COLORS, tux: SUIT_COLORS, suit: BIZ_COLORS, dress: DRESS_COLORS, onepiece: ONEPIECE_COLORS, hanbok: HANBOK_COLORS, casual: CASUAL_COLORS, hoodie: HOODIE_COLORS };
const isLight = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 190; };

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
};

// look: { outfit:'tux'|'dress'|'casual', hair:'short'|'long'|'bob'|'bun', skin:0.., hairColor:0.., color:0.., glasses:bool, veil:bool }
// 반환: { stand, happy } 두 장의 굽힌 캔버스
function makeCharacter(look) {
  if (window.TOON) return window.TOON.make(look);
  const outfit = OUTFITS[look.outfit] ? look.outfit : 'tux';
  const hair = HAIRS[look.hair] ? look.hair : 'short';
  const skin = SKINS[look.skin] || SKINS[0];
  const hairCol = HAIR_COLORS[look.hairColor] || HAIR_COLORS[0];
  const cols = OUTFIT_COLORS[outfit];
  const cloth = cols[look.color] || cols[0];
  const lightSuit = (outfit === 'tux' || outfit === 'suit') && isLight(cloth);
  const pal = {
    S: skin, E: '#2a2033', B: '#f29aa8', M: '#c2526a',
    H: hairCol, h: shade(hairCol, 0.75),
    T: cloth, t: shade(cloth, lightSuit ? 0.85 : 1.35), W: '#ffffff', R: lightSuit ? '#3b4a6b' : '#d8424f', K: '#2a2033',
    D: cloth, d: shade(cloth, 0.88),
    G: '#2a2033', V: 'rgba(255,255,255,0.85)',
    C: cloth, c: shade(cloth, 0.85), P: '#4a5578',
    J: '#fff6e8', O: outfit === 'hanbok' ? shade(cloth, 0.7) : outfit === 'hanbokM' ? '#d8424f' : cloth,
    N: '#ff5c8a', Q: '#f3eee4', q: cloth, k: '#2a2033', Y: '#f5c542', y: shade(cloth, 0.7),
  };
  // 사진 얼굴: 픽셀 머리 대신 동그랗게 오린 사진을 머리 자리에 붙인다(drawSprite가 그림)
  const face = faceImage(look.face);
  // 소품(예전 링크의 veil:true는 면사포로)
  const acc = look.acc || (look.veil ? 'veil' : '');
  const over = ACCS[acc] ? bakeSprite(ACCS[acc], ACC_PAL) : null;
  const build = head => {
    const layers = [];
    if (acc === 'veil') layers.push(VEIL);
    if (face) layers.push(NECK, OUTFITS[outfit]);
    else {
      layers.push(head, OUTFITS[outfit], HAIRS[hair]);
      if (look.glasses) layers.push(GLASSES);
    }
    const c = bakeSprite(stackLayers(layers), pal);
    if (over) c.over = over;
    if (face) c.face = face;
    return c;
  };
  return { stand: build(HEAD), happy: build(HEAD_HAPPY), face };
}

const NECK = pad24(Array(10).fill('................').concat(['......SSSS......', '.......SS.......']));

// 얼굴 사진(data URL)만 받는다. 같은 사진은 한 번만 읽는다.
const FACE_CACHE = new Map();
const FACE_RE = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
function faceImage(src) {
  if (typeof src !== 'string' || src.length > 40000 || !FACE_RE.test(src)) return null;
  if (!FACE_CACHE.has(src)) {
    const img = new Image();
    img.src = src;
    FACE_CACHE.set(src, img);
  }
  return FACE_CACHE.get(src);
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
  cake: bakeSprite([
    '...F...',
    '...w...',
    '.WWWWW.',
    'WpWpWpW',
    'CCCCCCC',
    'CCCCCCC',
    'BBBBBBB',
  ], { F: '#f5c542', w: '#ffffff', W: '#ffffff', p: '#f48fb1', C: '#f7c9a5', B: '#c98c64' }),
  star: bakeSprite([
    '...Y...',
    '..YYY..',
    'YYYyYYY',
    '.YYYYY.',
    '..YYY..',
    '.YY.YY.',
    'Y.....Y',
  ], { Y: '#f5c542', y: '#fff3b0' }),
  gift: bakeSprite([
    '.R...R.',
    '..R.R..',
    'GGGRGGG',
    'GgGRGgG',
    'GGGRGGG',
    'GgGRGgG',
    'GGGRGGG',
  ], { G: '#5bbf6a', g: '#8fd99a', R: '#d8424f' }),
  pouch: bakeSprite([
    '..Y.Y..',
    '...Y...',
    '.RRRRR.',
    'RRRYRRR',
    'RRYYYRR',
    'RRRYRRR',
    '.RRRRR.',
  ], { R: '#d8424f', Y: '#f5c542' }),
  bottle: bakeSprite([
    '...P...',
    '..PPP..',
    '.wwwww.',
    '.wBBBw.',
    '.wBBBw.',
    '.wBBBw.',
    '..www..',
  ], { P: '#f48fb1', w: '#ffffff', B: '#bfe3f7' }),
  sock: bakeSprite([
    '.WWWW..',
    '.RRRR..',
    '.RrRR..',
    '.RRRR..',
    '.RRRRR.',
    'RRrRRRR',
    'RRRRRR.',
  ], { W: '#ffffff', R: '#d8424f', r: '#5bbf6a' }),
  songpyeon: bakeSprite([
    '.......',
    '..PPP..',
    '.PPPPP.',
    'PpPPPPP',
    'PPPPPPP',
    '.PPPPP.',
    '.......',
  ], { P: '#f2c0d0', p: '#ffffff' }),
  bolt: bakeSprite([
    '...YYY.',
    '..YYY..',
    '.YYY...',
    'YYYYYY.',
    '...YY..',
    '..YY...',
    '.Y.....',
  ], { Y: '#f5c542' }),
  rain: bakeSprite([
    '..CCCC..',
    '.CCCCCC.',
    'CCCCCCCC',
    '.cccccc.',
    '..b..b..',
    '.b..b...',
  ], { C: '#8d93a8', c: '#6f7488', b: '#5aa0e6' }),
};

window.PixelChars = { ACCS, makeCharacter, SKIN_ORDER, faceImage, FACE_RE, bakeSprite, PROPS, SKINS, HAIR_COLORS, SUIT_COLORS, DRESS_COLORS, CASUAL_COLORS, OUTFIT_COLORS };
