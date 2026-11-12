// 2D 애니메이션 캐릭터: 둥근 선과 면으로 그린다(픽셀 대신). characters.js의 색 목록·사진 얼굴을 같이 쓴다.
// makeToonCharacter(look) → { stand, happy, face } 고해상도 캔버스. 캔버스에 lw·lh(논리 크기), faceBox, over(소품 겹)를 붙인다.
// 그리는 단위(du): 발끝 가운데가 (0,0), 머리 가운데가 (0,-112), 머리 반지름 34. 논리 1칸 = 6.25du.
'use strict';

const TOON = (() => {
  const DU = 6.25;          // du → 스프라이트 논리 1칸
  const BOX_W = 32, BOX_H = 32;
  const RES = 16;           // 논리 1칸당 실제 픽셀(캔버스 해상도)
  const HY = -112, HR = 34; // 머리 가운데·반지름
  const INK = '#2a2033';

  const shadeC = (hex, f) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
    return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
  };
  const lightC = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 190; };

  function canvasFor() {
    const c = document.createElement('canvas');
    c.width = BOX_W * RES; c.height = BOX_H * RES;
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height);
    g.scale(RES / DU, RES / DU);
    c.lw = BOX_W; c.lh = BOX_H;
    c.faceBox = { y: HY / DU, r: HR / DU };   // 발끝 기준(위쪽이 음수)
    c.toon = true;
    return { c, g };
  }

  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
  function limb(g, x, y, len, ang, w, color) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = color; rr(g, -w / 2, 0, w, len, w / 2); g.fill();
    g.restore();
  }
  const handAt = (x, y, len, ang) => [x - Math.sin(ang) * len, y + Math.cos(ang) * len];

  // ── 옷: 아랫도리(다리) → 팔 → 몸통 순서로 그린다
  // 각 옷: { legs(g,P), top(g,P), sleeve: 색, long: 치마처럼 다리를 덮는지 }
  function outfitSpec(name, cloth, P) {
    const dark = shadeC(cloth, 0.78), lite = shadeC(cloth, 1.18);
    const shirtWhite = '#ffffff';
    const pantsDark = '#33415e';
    const shoes = (g, col = '#3a2a2a') => { g.fillStyle = col; ell(g, -10, -3, 11, 5.5); g.fill(); ell(g, 10, -3, 11, 5.5); g.fill(); };
    const pants = (g, col) => { g.fillStyle = col; rr(g, -16, -38, 14, 35, 6); g.fill(); rr(g, 2, -38, 14, 35, 6); g.fill(); };
    const bareLegs = g => { g.fillStyle = P.skin; rr(g, -13, -30, 10, 27, 5); g.fill(); rr(g, 3, -30, 10, 27, 5); g.fill(); };
    const torso = (g, col, w = 52) => { g.fillStyle = col; rr(g, -w / 2, -82, w, 52, 17); g.fill(); };
    const hem = (g, col) => { g.fillStyle = col; rr(g, -26, -37, 52, 7, 3); g.fill(); };
    const flare = (g, col, top, bottom, wTop, wBot) => {
      g.fillStyle = col; g.beginPath();
      g.moveTo(-wTop, top); g.quadraticCurveTo(-wBot * 0.8, (top + bottom) / 2, -wBot, bottom);
      g.quadraticCurveTo(0, bottom + 6, wBot, bottom);
      g.quadraticCurveTo(wBot * 0.8, (top + bottom) / 2, wTop, top); g.closePath(); g.fill();
    };
    const lightSuit = lightC(cloth);
    const S = {
      tux: {
        sleeve: cloth,
        legs: g => { pants(g, cloth); shoes(g, INK); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = shirtWhite; g.beginPath(); g.moveTo(-11, -82); g.lineTo(11, -82); g.lineTo(0, -50); g.closePath(); g.fill();
          g.fillStyle = lightSuit ? '#3b4a6b' : '#d8424f';
          g.beginPath(); g.moveTo(0, -76); g.lineTo(-9, -81); g.lineTo(-9, -71); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(0, -76); g.lineTo(9, -81); g.lineTo(9, -71); g.closePath(); g.fill();
          ell(g, 0, -76, 3, 3); g.fill();
          g.strokeStyle = lite; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-11, -82); g.lineTo(-2, -52); g.moveTo(11, -82); g.lineTo(2, -52); g.stroke();
          g.fillStyle = lite; [-62, -48].forEach(y => { ell(g, 0, y + 4, 2, 2); g.fill(); });
        },
      },
      suit: {
        sleeve: cloth,
        legs: g => { pants(g, cloth); shoes(g, INK); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = shirtWhite; g.beginPath(); g.moveTo(-11, -82); g.lineTo(11, -82); g.lineTo(0, -48); g.closePath(); g.fill();
          g.fillStyle = lightSuit ? '#3b4a6b' : '#d8424f';
          g.beginPath(); g.moveTo(-3.5, -80); g.lineTo(3.5, -80); g.lineTo(4.5, -58); g.lineTo(0, -52); g.lineTo(-4.5, -58); g.closePath(); g.fill();
          g.strokeStyle = lite; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-11, -82); g.lineTo(-2, -50); g.moveTo(11, -82); g.lineTo(2, -50); g.stroke();
        },
      },
      dress: {
        sleeve: null, long: true,
        legs: g => { flare(g, cloth, -60, -2, 22, 48); g.fillStyle = shadeC(cloth, 0.93); [-24, 0, 24].forEach(x => { g.beginPath(); g.moveTo(x * 0.4, -56); g.quadraticCurveTo(x * 0.9, -26, x * 1.3, -3); g.lineTo(x * 1.3 + 3, -3); g.quadraticCurveTo(x * 0.9 + 2, -26, x * 0.4 + 1, -56); g.fill(); }); },
        top: g => {
          g.fillStyle = cloth; rr(g, -22, -82, 44, 28, 12); g.fill();
          g.fillStyle = shadeC(cloth, 0.9); rr(g, -23, -60, 46, 7, 3); g.fill();
          g.fillStyle = '#f48fb1'; ell(g, 0, -57, 4, 4); g.fill();
        },
      },
      onepiece: {
        sleeve: cloth,
        legs: g => { bareLegs(g); shoes(g, '#c2526a'); flare(g, cloth, -60, -24, 22, 34); },
        top: g => {
          g.fillStyle = cloth; rr(g, -23, -82, 46, 30, 13); g.fill();
          g.fillStyle = shirtWhite; ell(g, -6, -80, 7, 4, 0.3); g.fill(); ell(g, 6, -80, 7, 4, -0.3); g.fill();
          g.fillStyle = dark; rr(g, -23, -58, 46, 5, 2); g.fill();
        },
      },
      hanbok: {
        sleeve: '#fff6e8', long: true,
        legs: g => { flare(g, cloth, -66, -2, 26, 46); g.fillStyle = shadeC(cloth, 0.86); rr(g, -34, -12, 68, 6, 3); g.fill(); },
        top: g => {
          g.fillStyle = '#fff6e8'; rr(g, -24, -82, 48, 22, 11); g.fill();
          g.strokeStyle = shadeC(cloth, 0.7); g.lineWidth = 3; g.beginPath(); g.moveTo(-12, -82); g.lineTo(6, -64); g.stroke();
          g.fillStyle = shadeC(cloth, 0.7); g.beginPath(); g.moveTo(4, -66); g.quadraticCurveTo(14, -52, 10, -40); g.lineTo(6, -41); g.quadraticCurveTo(9, -52, 1, -63); g.fill();
          g.beginPath(); g.moveTo(5, -66); g.quadraticCurveTo(-2, -52, -2, -44); g.lineTo(-6, -45); g.quadraticCurveTo(-5, -54, 2, -66); g.fill();
        },
      },
      hanbokM: {
        sleeve: cloth,
        legs: g => { g.fillStyle = '#f3eee4'; rr(g, -20, -40, 19, 33, 9); g.fill(); rr(g, 1, -40, 19, 33, 9); g.fill(); g.fillStyle = '#e2d9c6'; rr(g, -18, -12, 15, 5, 2); g.fill(); rr(g, 3, -12, 15, 5, 2); g.fill(); shoes(g, INK); },
        top: g => {
          torso(g, cloth, 54);
          g.strokeStyle = shirtWhite; g.lineWidth = 4; g.beginPath(); g.moveTo(-12, -82); g.lineTo(8, -60); g.stroke();
          g.fillStyle = '#d8424f'; g.beginPath(); g.moveTo(6, -62); g.quadraticCurveTo(14, -50, 12, -40); g.lineTo(8, -41); g.quadraticCurveTo(9, -50, 3, -60); g.fill();
          g.fillStyle = dark; rr(g, -27, -40, 54, 6, 3); g.fill();
        },
      },
      santa: {
        sleeve: cloth,
        legs: g => { pants(g, cloth); g.fillStyle = INK; rr(g, -18, -16, 17, 14, 5); g.fill(); rr(g, 1, -16, 17, 14, 5); g.fill(); shoes(g, INK); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = '#ffffff'; rr(g, -4, -82, 8, 46, 4); g.fill(); rr(g, -27, -40, 54, 9, 4); g.fill();
          g.fillStyle = INK; rr(g, -26, -54, 52, 7, 2); g.fill();
          g.fillStyle = '#f5c542'; rr(g, -6, -56, 12, 11, 2); g.fill(); g.fillStyle = INK; rr(g, -3, -53, 6, 5, 1); g.fill();
        },
      },
      knit: {
        sleeve: dark,
        legs: g => { pants(g, pantsDark); shoes(g); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = 'rgba(255,255,255,0.9)';
          for (let k = -2; k <= 2; k++) { ell(g, k * 9, -56, 2.6, 2.6); g.fill(); }
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-26, -63, 52, 3); g.fillRect(-26, -50, 52, 3);
          hem(g, dark);
        },
      },
      coat: {
        sleeve: cloth,
        legs: g => { pants(g, '#3a3a44'); shoes(g); g.fillStyle = cloth; rr(g, -26, -50, 52, 34, 10); g.fill(); g.fillStyle = dark; g.fillRect(-1, -50, 2, 34); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = dark; g.beginPath(); g.moveTo(-12, -82); g.lineTo(0, -66); g.lineTo(12, -82); g.closePath(); g.fill();
          g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-6, -82); g.lineTo(0, -72); g.lineTo(6, -82); g.closePath(); g.fill();
          g.fillStyle = dark; rr(g, -26, -50, 52, 6, 3); g.fill();
          g.fillStyle = shadeC(cloth, 0.6); [-60, -42, -28].forEach(y => { ell(g, -6, y, 2.4, 2.4); g.fill(); ell(g, 6, y, 2.4, 2.4); g.fill(); });
        },
      },
      padding: {
        sleeve: cloth,
        legs: g => { pants(g, pantsDark); shoes(g); },
        top: g => {
          g.fillStyle = cloth; rr(g, -30, -84, 60, 56, 20); g.fill();
          g.strokeStyle = dark; g.lineWidth = 2.5; [-70, -58, -46].forEach(y => { g.beginPath(); g.moveTo(-28, y); g.quadraticCurveTo(0, y + 4, 28, y); g.stroke(); });
          g.fillStyle = lite; rr(g, -16, -88, 32, 10, 5); g.fill();
          g.strokeStyle = shadeC(cloth, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(0, -80); g.lineTo(0, -30); g.stroke();
        },
      },
      hoodie: {
        sleeve: cloth,
        legs: g => { pants(g, pantsDark); shoes(g, '#ffffff'); g.fillStyle = INK; g.fillRect(-20, -5, 40, 1.5); },
        top: g => {
          g.fillStyle = dark; ell(g, 0, -80, 24, 9); g.fill();
          torso(g, cloth);
          g.fillStyle = dark; rr(g, -15, -54, 30, 15, 6); g.fill();
          g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-5, -80); g.lineTo(-6, -64); g.moveTo(5, -80); g.lineTo(6, -64); g.stroke();
          hem(g, dark);
        },
      },
      casual: {
        sleeve: cloth,
        legs: g => { pants(g, '#4a6fa8'); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-12, -36, 2, 30); g.fillRect(10, -36, 2, 30); shoes(g, '#ffffff'); g.fillStyle = INK; g.fillRect(-20, -5, 40, 1.5); },
        top: g => {
          torso(g, cloth);
          g.fillStyle = P.skin; g.beginPath(); g.ellipse(0, -82, 10, 6, 0, 0, Math.PI); g.fill();
          g.fillStyle = lightC(cloth) ? '#e98aa5' : 'rgba(255,255,255,0.85)'; ell(g, 0, -58, 7, 6); g.fill();
        },
      },
    };
    return S[name] || S.casual;
  }

  // ── 머리: 뒤(몸 뒤) / 앞(얼굴 위)
  function curls(g, cx, cy, rx, ry, r) {
    let row = 0;
    for (let y = cy - ry; y <= cy + ry; y += r * 1.2, row++)
      for (let x = cx - rx; x <= cx + rx; x += r * 1.2) {
        const xx = x + (row % 2 ? r * 0.6 : 0);
        if (((xx - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) { ell(g, xx, y, r, r); g.fill(); }
      }
  }
  function hairBack(g, style, col) {
    g.fillStyle = col;
    if (style === 'long') { rr(g, -37, HY - 12, 74, 82, 28); g.fill(); }
    if (style === 'bob') { rr(g, -39, HY - 14, 78, 50, 24); g.fill(); }
    if (style === 'perm') curls(g, 0, HY + 18, 43, 60, 11);
    if (style === 'ponytail') {
      g.save(); g.translate(26, HY - 20); g.rotate(0.5);
      ell(g, 10, 26, 12, 30); g.fill();
      g.restore();
    }
  }
  function bangs(g) {
    g.beginPath();
    g.moveTo(-36, HY + 2);
    g.bezierCurveTo(-39, HY - 42, 39, HY - 42, 36, HY + 2);
    g.quadraticCurveTo(27, HY - 14, 10, HY - 12);
    g.quadraticCurveTo(0, HY - 6, -8, HY - 14);
    g.quadraticCurveTo(-25, HY - 16, -36, HY + 2);
    g.fill();
  }
  const tie = (g, x, y) => { g.fillStyle = '#ff5c8a'; ell(g, x, y, 6.5, 6.5); g.fill(); g.fillStyle = '#ffa3bd'; ell(g, x - 1.5, y - 2, 2.3, 2.3); g.fill(); };
  function hairFront(g, style, col) {
    g.fillStyle = col;
    if (style === 'perm') {
      for (let k = 0; k <= 10; k++) { const a = Math.PI + k * Math.PI / 10; ell(g, Math.cos(a) * 30, HY - 6 + Math.sin(a) * 26, 10, 10); g.fill(); }
      [[-36, 6], [36, 6], [-39, 22], [39, 22], [-38, 38], [38, 38]].forEach(([x, y]) => { ell(g, x, HY + y, 10, 10); g.fill(); });
      return;
    }
    if (style === 'short') {
      bangs(g);
      ell(g, -33, HY - 4, 6, 12); g.fill(); ell(g, 33, HY - 4, 6, 12); g.fill();
      return;
    }
    bangs(g);
    if (style === 'long' || style === 'bob') {
      g.fillStyle = col; rr(g, -40, HY - 8, 10, style === 'bob' ? 40 : 56, 5); g.fill(); rr(g, 30, HY - 8, 10, style === 'bob' ? 40 : 56, 5); g.fill();
    }
    if (style === 'bun') {
      g.fillStyle = col; ell(g, 0, HY - 42, 19, 17); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)'; ell(g, -6, HY - 48, 7, 4, -0.3); g.fill();
      g.fillStyle = '#ff5c8a'; rr(g, -12, HY - 31, 24, 6, 3); g.fill();
    }
    if (style === 'ponytail') tie(g, 30, HY - 22);
    if (style === 'twin') {
      [-1, 1].forEach(s => {
        g.save(); g.translate(s * 28, HY - 20); g.rotate(s * 0.18);
        g.fillStyle = col;
        g.beginPath(); g.moveTo(0, -8);
        g.bezierCurveTo(s * 22, -16, s * 46, -6, s * 54, 6);
        g.bezierCurveTo(s * 58, 14, s * 50, 20, s * 44, 14);
        g.bezierCurveTo(s * 34, 8, s * 18, 10, 0, 9);
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.18)'; ell(g, s * 24, -4, 12, 3, s * -0.1); g.fill();
        tie(g, s * 2, 0);
        g.restore();
      });
    }
    // 윤기
    g.fillStyle = 'rgba(255,255,255,0.16)'; ell(g, -14, HY - 26, 10, 4, -0.4); g.fill();
  }

  function face(g, P, happy) {
    // 머리
    g.fillStyle = P.skin; ell(g, 0, HY, HR, 32); g.fill();
    ell(g, -33, HY + 4, 6, 6); g.fill(); ell(g, 33, HY + 4, 6, 6); g.fill();
    // 볼
    g.fillStyle = 'rgba(255,120,140,0.42)'; ell(g, -19, HY + 12, 7, 4.5); g.fill(); ell(g, 19, HY + 12, 7, 4.5); g.fill();
    // 눈
    g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3; g.lineCap = 'round';
    [-12, 12].forEach(ex => {
      if (happy) { g.beginPath(); g.arc(ex, HY + 3, 5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      else {
        ell(g, ex, HY + 1, 4.2, 6); g.fill();
        g.fillStyle = '#ffffff'; ell(g, ex + 1.5, HY - 1.5, 1.8, 1.8); g.fill(); g.fillStyle = INK;
      }
    });
    // 입
    if (happy) { g.fillStyle = '#c2414f'; g.beginPath(); g.arc(0, HY + 12, 6, 0, Math.PI); g.fill(); }
    else { g.lineWidth = 2.5; g.beginPath(); g.arc(0, HY + 10, 5, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  }

  function glasses(g) {
    // 선글라스: 짙은 렌즈 + 반사광
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 2.6;
    [-1, 1].forEach(s => {
      g.beginPath(); g.moveTo(s * 3, HY - 5); g.lineTo(s * 22, HY - 6);
      g.quadraticCurveTo(s * 23, HY + 10, s * 13, HY + 10); g.quadraticCurveTo(s * 3, HY + 10, s * 3, HY - 5); g.fill();
    });
    g.beginPath(); g.moveTo(-4, HY - 4); g.quadraticCurveTo(0, HY - 7, 4, HY - 4); g.stroke();
    g.beginPath(); g.moveTo(-22, HY - 5); g.lineTo(-31, HY - 2); g.moveTo(22, HY - 5); g.lineTo(31, HY - 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 13 - 4, HY - 1, 3.2, 1.6, -0.5, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = 'rgba(120,160,255,0.35)';
    [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 13 + 3, HY + 5, 3, 1.4, -0.4, 0, Math.PI * 2); g.fill(); });
  }

  // ── 소품(얼굴·사진 얼굴 위 겹)
  const ACC = {
    santaHat: g => {
      g.fillStyle = '#e04a4a';
      g.beginPath(); g.moveTo(-31, HY - 18); g.quadraticCurveTo(0, HY - 64, 36, HY - 46); g.quadraticCurveTo(23, HY - 31, 31, HY - 18); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; rr(g, -35, HY - 27, 70, 13, 6.5); g.fill();
      ell(g, 37, HY - 46, 7.5, 7.5); g.fill();
    },
    antler: g => {
      g.strokeStyle = '#8a5a3a'; g.lineWidth = 5; g.lineCap = 'round';
      [-1, 1].forEach(s => {
        g.beginPath(); g.moveTo(s * 18, HY - 26); g.quadraticCurveTo(s * 26, HY - 46, s * 22, HY - 60); g.stroke();
        g.beginPath(); g.moveTo(s * 23, HY - 44); g.lineTo(s * 34, HY - 50); g.stroke();
        g.beginPath(); g.moveTo(s * 22, HY - 54); g.lineTo(s * 13, HY - 62); g.stroke();
      });
      g.strokeStyle = '#8a5a3a'; g.lineWidth = 4; g.beginPath(); g.arc(0, HY, 34, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    },
    partyHat: g => {
      g.save(); g.translate(4, HY - 28); g.rotate(0.15);
      g.fillStyle = '#7cc4f4'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(0, -40); g.lineTo(16, 0); g.closePath(); g.fill();
      g.save(); g.clip();
      g.fillStyle = '#f48fb1'; [-30, -16, -2].forEach(y => { g.fillRect(-20, y, 40, 6); });
      g.restore();
      g.fillStyle = '#f5c542'; ell(g, 0, -41, 6, 6); g.fill();
      g.restore();
    },
    cap: g => {
      g.fillStyle = '#4a6fd1';
      g.beginPath(); g.moveTo(-35, HY - 12); g.bezierCurveTo(-36, HY - 50, 36, HY - 50, 35, HY - 12); g.closePath(); g.fill();
      g.fillStyle = '#2f4fa8'; rr(g, -40, HY - 16, 80, 8, 4); g.fill();
      g.beginPath(); g.ellipse(18, HY - 13, 26, 6, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#ffffff'; ell(g, 0, HY - 42, 3, 3); g.fill();
    },
    beanie: g => {
      g.fillStyle = '#d84a4a';
      g.beginPath(); g.moveTo(-34, HY - 14); g.bezierCurveTo(-34, HY - 54, 34, HY - 54, 34, HY - 14); g.closePath(); g.fill();
      g.fillStyle = '#f4efe6'; rr(g, -37, HY - 22, 74, 14, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let x = -30; x <= 30; x += 7) { g.beginPath(); g.moveTo(x, HY - 21); g.lineTo(x, HY - 9); g.stroke(); }
      g.fillStyle = '#f4efe6'; ell(g, 0, HY - 50, 9, 9); g.fill();
    },
    ribbon: g => {
      g.strokeStyle = '#e04a6a'; g.lineWidth = 5; g.beginPath(); g.arc(0, HY, 33, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.save(); g.translate(20, HY - 26); g.rotate(0.3);
      g.fillStyle = '#e04a6a'; ell(g, -8, 0, 9, 6, 0.3); g.fill(); ell(g, 8, 0, 9, 6, -0.3); g.fill();
      g.fillStyle = '#ff7f99'; ell(g, 0, 0, 4, 4); g.fill();
      g.restore();
    },
    flower: g => {
      const cols = ['#f48fb1', '#ffffff', '#f5c542', '#f7a8c0', '#ffffff', '#f48fb1', '#f5c542'];
      g.fillStyle = '#5bbf6a'; g.lineWidth = 3;
      for (let k = 0; k < 7; k++) {
        const a = Math.PI * (1.1 + k * 0.8 / 6), x = Math.cos(a) * 33, y = HY + Math.sin(a) * 30;
        ell(g, x - 4, y + 2, 4, 2.5, 0.5); g.fill();
        g.fillStyle = cols[k]; for (let p = 0; p < 5; p++) { const b = p * Math.PI * 2 / 5; ell(g, x + Math.cos(b) * 3.6, y + Math.sin(b) * 3.6, 3.2, 3.2); g.fill(); }
        g.fillStyle = '#f5c542'; ell(g, x, y, 2.2, 2.2); g.fill();
        g.fillStyle = '#5bbf6a';
      }
    },
    bokgeon: g => {
      g.fillStyle = '#2a2033';
      g.beginPath(); g.moveTo(-34, HY - 14); g.bezierCurveTo(-36, HY - 50, 30, HY - 56, 34, HY - 14); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(26, HY - 20); g.quadraticCurveTo(44, HY - 4, 40, HY + 26); g.lineTo(32, HY + 24); g.quadraticCurveTo(34, HY, 22, HY - 14); g.fill();
      g.fillStyle = '#4a3266'; rr(g, -35, HY - 18, 70, 6, 3); g.fill();
    },
    jobawi: g => {
      g.fillStyle = '#4a3266';
      g.beginPath(); g.moveTo(-36, HY + 4); g.bezierCurveTo(-38, HY - 44, 38, HY - 44, 36, HY + 4); g.lineTo(28, HY + 2); g.bezierCurveTo(28, HY - 30, -28, HY - 30, -28, HY + 2); g.closePath(); g.fill();
      g.fillStyle = '#f5c542'; [-20, 0, 20].forEach(x => { ell(g, x, HY - 30 + Math.abs(x) * 0.25, 3.4, 3.4); g.fill(); });
      g.strokeStyle = '#d84a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, HY - 30); g.quadraticCurveTo(-4, HY - 12, 0, HY - 4); g.stroke();
      g.fillStyle = '#d84a4a'; ell(g, 0, HY - 4, 4, 5); g.fill();
    },
    scarf: g => {
      g.fillStyle = '#d84a4a'; rr(g, -26, -88, 52, 13, 6.5); g.fill();
      rr(g, 8, -82, 12, 30, 5); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(8, -60, 12, 3); g.fillRect(8, -66, 12, 2);
    },
    veil: g => {
      // 앞쪽 머리장식(뒤쪽 면사포는 몸 뒤에 따로)
      g.fillStyle = '#ffffff'; rr(g, -28, HY - 34, 56, 7, 3.5); g.fill();
      g.fillStyle = '#f5c542'; [-14, 0, 14].forEach(x => { ell(g, x, HY - 36, 3, 3); g.fill(); });
    },
  };
  function veilBack(g) {
    g.fillStyle = 'rgba(255,255,255,0.82)';
    g.beginPath(); g.moveTo(-30, HY - 30); g.quadraticCurveTo(-56, HY + 20, -46, -20); g.lineTo(46, -20); g.quadraticCurveTo(56, HY + 20, 30, HY - 30); g.closePath(); g.fill();
  }

  // pose: 'stand' | 'happy'
  function draw(look, happy, withFace) {
    const { c, g } = canvasFor();
    const P = {
      skin: (typeof SKINS !== 'undefined' && SKINS[look.skin]) || '#f6d2b4',
      hair: (typeof HAIR_COLORS !== 'undefined' && HAIR_COLORS[look.hairColor]) || '#2b2230',
    };
    const outfit = (typeof OUTFIT_COLORS !== 'undefined' && OUTFIT_COLORS[look.outfit]) ? look.outfit : 'tux';
    const cols = OUTFIT_COLORS[outfit];
    const cloth = cols[look.color] || cols[0];
    const O = outfitSpec(outfit, cloth, P);
    const style = ['short', 'long', 'bob', 'bun', 'ponytail', 'twin', 'perm'].includes(look.hair) ? look.hair : 'short';
    const acc = look.acc || (look.veil ? 'veil' : '');

    // 그림자 없이(무대가 그린다). 뒤 → 앞
    if (acc === 'veil') veilBack(g);
    if (!withFace) hairBack(g, style, P.hair);
    O.legs(g);
    // 팔: 서 있으면 살짝 벌리고, 기쁘면 위로
    const sleeve = O.sleeve || P.skin;
    const arms = happy ? [2.5, -2.5] : [0.32, -0.32];
    [[-22, arms[0]], [22, arms[1]]].forEach(([x, a]) => {
      limb(g, x, -76, 28, a, 12, sleeve);
      const [hx, hy] = handAt(x, -76, 28, a);
      g.fillStyle = P.skin; ell(g, hx, hy, 6.2, 6.2); g.fill();
    });
    O.top(g);
    // 목
    if (withFace) { g.fillStyle = P.skin; rr(g, -7, -86, 14, 8, 4); g.fill(); }
    else {
      face(g, P, happy);
      hairFront(g, style, P.hair);
      if (look.glasses) glasses(g);
    }
    if (ACC[acc]) {
      const o = canvasFor();
      ACC[acc](o.g);
      c.over = o.c;
    }
    return c;
  }

  function make(look) {
    const faceImg = typeof faceImage === 'function' ? faceImage(look.face) : null;
    const stand = draw(look, false, !!faceImg), happy = draw(look, true, !!faceImg);
    if (faceImg) { stand.face = faceImg; happy.face = faceImg; }
    return { stand, happy, face: faceImg };
  }

  // ── 게임 소품(받기·물총·두더지 등): 논리 크기 lw×lh, 고해상도로 그린다
  function prop(lw, lh, fn) {
    const R = 14, c = document.createElement('canvas');
    c.width = lw * R; c.height = lh * R;
    const g = c.getContext('2d'); g.scale(R, R); g.lineCap = 'round'; g.lineJoin = 'round';
    fn(g); c.lw = lw; c.lh = lh; return c;
  }
  const circ = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const heartP = (g, x, y, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + s * 0.95); g.bezierCurveTo(x - s * 1.35, y, x - s * 0.75, y - s * 0.95, x, y - s * 0.3); g.bezierCurveTo(x + s * 0.75, y - s * 0.95, x + s * 1.35, y, x, y + s * 0.95); g.fill(); };
  function makeProps() {
    return {
      bouquet: prop(7, 7, g => {
        g.fillStyle = '#5bbf6a'; g.beginPath(); g.moveTo(2.2, 3.6); g.lineTo(4.8, 3.6); g.lineTo(3.9, 6.6); g.lineTo(3.1, 6.6); g.fill();
        g.fillStyle = '#d8424f'; g.beginPath(); g.roundRect(2.4, 4.6, 2.2, 1.2, 0.4); g.fill();
        [[2, 2.2, '#f48fb1'], [5, 2.2, '#f7a8c0'], [3.5, 1.3, '#ffffff'], [3.5, 3, '#f48fb1'], [1.5, 3.4, '#ffffff'], [5.5, 3.4, '#ffffff']].forEach(([x, y, c]) => { circ(g, x, y, 1.15, c); circ(g, x, y, 0.4, '#f5c542'); });
      }),
      heart: prop(7, 6, g => { heartP(g, 3.5, 2.9, 2.9, '#ef5b74'); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(2.1, 1.9, 0.8, 0.5, -0.6, 0, Math.PI * 2); g.fill(); }),
      cake: prop(7, 7, g => {
        g.fillStyle = '#c98c64'; g.beginPath(); g.roundRect(0.3, 5.6, 6.4, 1.2, 0.5); g.fill();
        g.fillStyle = '#f7c9a5'; g.beginPath(); g.roundRect(0.5, 3.3, 6, 2.6, 0.6); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0.5, 3.8); g.quadraticCurveTo(0.5, 2.6, 1.5, 2.6); g.lineTo(5.5, 2.6); g.quadraticCurveTo(6.5, 2.6, 6.5, 3.8);
        for (let x = 6.5; x > 0.5; x -= 1.2) g.quadraticCurveTo(x - 0.6, 5, x - 1.2, 3.8); g.fill();
        circ(g, 2, 3.2, 0.45, '#f48fb1'); circ(g, 5, 3.2, 0.45, '#f48fb1');
        g.fillStyle = '#ffffff'; g.fillRect(3.2, 0.9, 0.6, 1.8); circ(g, 3.5, 0.6, 0.5, '#f5c542');
      }),
      star: prop(7, 7, g => {
        g.fillStyle = '#f5c542'; g.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.5 : 3.4; g.lineTo(3.5 + Math.cos(a) * r, 3.8 + Math.sin(a) * r); }
        g.closePath(); g.fill(); circ(g, 2.8, 3.1, 0.6, '#fff3b0');
      }),
      gift: prop(7, 7, g => {
        g.fillStyle = '#5bbf6a'; g.beginPath(); g.roundRect(0.6, 2.4, 5.8, 4.3, 0.6); g.fill();
        g.fillStyle = '#8fd99a'; g.beginPath(); g.roundRect(0.3, 1.9, 6.4, 1.4, 0.5); g.fill();
        g.fillStyle = '#d8424f'; g.fillRect(3.05, 1.9, 0.9, 4.8);
        g.beginPath(); g.ellipse(2.4, 1.2, 1.1, 0.7, -0.5, 0, Math.PI * 2); g.ellipse(4.6, 1.2, 1.1, 0.7, 0.5, 0, Math.PI * 2); g.fill();
      }),
      pouch: prop(7, 7, g => {
        g.fillStyle = '#d8424f'; g.beginPath(); g.moveTo(2.4, 2); g.bezierCurveTo(-0.4, 3, 0.4, 6.8, 3.5, 6.8); g.bezierCurveTo(6.6, 6.8, 7.4, 3, 4.6, 2); g.closePath(); g.fill();
        g.fillStyle = '#f5c542'; g.beginPath(); g.roundRect(2, 1.4, 3, 0.9, 0.4); g.fill();
        circ(g, 2.6, 0.7, 0.55, '#f5c542'); circ(g, 4.4, 0.7, 0.55, '#f5c542');
        g.fillStyle = '#f5c542'; g.beginPath(); g.arc(3.5, 4.4, 1.1, 0, Math.PI * 2); g.fill(); circ(g, 3.5, 4.4, 0.45, '#d8424f');
      }),
      bottle: prop(7, 7, g => {
        g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(1.4, 2, 4.2, 4.8, 1.2); g.fill();
        g.fillStyle = '#bfe3f7'; g.beginPath(); g.roundRect(2, 3.2, 3, 3, 0.8); g.fill();
        g.fillStyle = '#f48fb1'; g.beginPath(); g.moveTo(2.2, 2); g.quadraticCurveTo(3.5, -0.6, 4.8, 2); g.fill();
        g.strokeStyle = '#d9c9d0'; g.lineWidth = 0.25; g.beginPath(); g.roundRect(1.4, 2, 4.2, 4.8, 1.2); g.stroke();
      }),
      sock: prop(7, 7, g => {
        g.fillStyle = '#d8424f'; g.beginPath(); g.moveTo(1.4, 1.3); g.lineTo(4.6, 1.3); g.lineTo(4.6, 4.2); g.quadraticCurveTo(6.8, 4.4, 6.6, 5.8); g.quadraticCurveTo(6.4, 6.9, 4.6, 6.8); g.lineTo(2.4, 6.8); g.quadraticCurveTo(0.6, 6.6, 1.4, 4.6); g.closePath(); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(1.1, 0.3, 3.8, 1.5, 0.6); g.fill();
        circ(g, 3, 3.4, 0.45, '#5bbf6a'); circ(g, 2.6, 5.2, 0.45, '#5bbf6a'); circ(g, 4.6, 5.6, 0.45, '#5bbf6a');
      }),
      songpyeon: prop(7, 7, g => {
        g.fillStyle = '#f2c0d0'; g.beginPath(); g.moveTo(0.6, 4.8); g.quadraticCurveTo(1, 1.4, 3.5, 1.4); g.quadraticCurveTo(6.4, 1.4, 6.4, 4.8); g.quadraticCurveTo(3.5, 6.2, 0.6, 4.8); g.fill();
        g.strokeStyle = '#e3a3b8'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(1.2, 3.8); g.quadraticCurveTo(3.5, 2.8, 5.8, 3.8); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(2.4, 2.6, 0.8, 0.45, -0.4, 0, Math.PI * 2); g.fill();
      }),
      bolt: prop(7, 7, g => {
        g.fillStyle = '#f5c542'; g.beginPath(); g.moveTo(4.4, 0.2); g.lineTo(1.2, 3.8); g.lineTo(3.3, 3.8); g.lineTo(2.2, 6.9); g.lineTo(5.8, 2.9); g.lineTo(3.7, 2.9); g.lineTo(5.2, 0.2); g.closePath(); g.fill();
        g.strokeStyle = '#e09a2a'; g.lineWidth = 0.3; g.stroke();
      }),
      rain: prop(8, 6, g => {
        g.fillStyle = '#8d93a8'; [[2.4, 2.4, 1.6], [4.2, 1.8, 2], [5.9, 2.6, 1.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
        g.beginPath(); g.roundRect(1, 2.6, 6.2, 1.6, 0.8); g.fill();
        g.strokeStyle = '#5aa0e6'; g.lineWidth = 0.45; [[2.2, 4.9], [4.2, 5.3], [6, 4.9]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 0.5); g.lineTo(x - 0.4, y + 0.5); g.stroke(); });
      }),
    };
  }

  return { make, DU, HY, HR, makeProps };
})();

window.TOON = TOON;
// 픽셀 소품을 새 그림체로 바꾼다(PROPS는 characters.js의 공용 객체)
if (typeof PROPS !== 'undefined') Object.assign(PROPS, TOON.makeProps());
