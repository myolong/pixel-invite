// 청첩장 페이지: 설정을 읽어 오프닝 → (게임) → 예식 정보를 보여준다.
'use strict';

(async function main() {
  const $ = id => document.getElementById(id);
  const canvas = $('screen');
  const ctx = Stage.setupCanvas(canvas);

  // ── 설정 읽기
  //   invite.html?d=<링크 코드>  만들기 화면에서 만든 청첩장(내용이 주소 안에 들어 있음)
  //   invite.html?c=<이름>      invites/<이름>.json
  const params = new URLSearchParams(location.search);
  // 최고 점수·보낸 응답은 이 창에서만 기억한다(창을 닫으면 처음부터). 게임 깬 기록은 기기에 남긴다. 예전 버전이 기기에 남긴 점수·응답은 지운다.
  try { Object.keys(localStorage).filter(k => /^pi-(best|rsvp)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { /* 무시 */ }
  //   invite.html?s=<짧은 번호>  짧은 링크(내용은 Supabase에 저장, js/rsvp.js의 ShortLink)
  const shortId = params.get('s');
  let linkCode = params.get('d');
  const code = linkCode || shortId ? 'link' : (params.get('c') || 'sample').replace(/[^a-z0-9_-]/gi, '');
  let cfg;
  try {
    if (!linkCode && shortId) {
      if (!window.ShortLink || !ShortLink.validId(shortId)) throw new Error('짧은 링크 오류');
      linkCode = await ShortLink.get(shortId);
    }
    if (linkCode) {
      cfg = await InviteCode.decode(linkCode);
    } else {
      const res = await fetch(`invites/${code}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      cfg = await res.json();
    }
    if (!cfg || !cfg.groom || !cfg.groom.name || !cfg.date || isNaN(new Date(cfg.date))) throw new Error('설정 오류');
    cfg.venue = cfg.venue || {};
  } catch (e) {
    document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">초대장을 찾을 수 없어요. 주소를 다시 확인해 주세요.</p>';
    return;
  }

  // 종류(결혼식·비혼식·연말 모임 …)
  const K = InviteKinds.get(cfg.kind);
  Stage.setTheme(K.scene);
  const two = K.people.length > 1 && !!(cfg.bride && cfg.bride.name);
  cfg.bride = two ? cfg.bride : null;
  const DOC = cfg.kind === 'notice' ? '알림장' : (cfg.kind && cfg.kind !== 'wedding' ? '초대장' : '청첩장');
  document.querySelectorAll('.docname').forEach(e => { e.textContent = DOC; });
  const chars = {
    groom: PixelChars.makeCharacter(cfg.groom.look || K.people[0].look),
    bride: two ? PixelChars.makeCharacter(cfg.bride.look || K.people[1].look) : null,
  };
  // 한 사람 초대장에서는 친구 캐릭터가 게임 소품을 던진다
  chars.thrower = chars.bride || PixelChars.makeCharacter({ outfit: 'casual', hair: 'bun', hairColor: 3, color: 1, skin: 1 });
  const when = new Date(cfg.date);
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const pad = n => String(n).padStart(2, '0');
  // 보는 사람의 기기 시간대와 상관없이 한국 시간으로 보여준다
  const kst = d => {
    const k = new Date(d.getTime() + 9 * 3600e3);
    return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate(), wd: k.getUTCDay(), h: k.getUTCHours(), mi: k.getUTCMinutes() };
  };
  const W = kst(when);
  const dateText = `${W.y}년 ${W.m}월 ${W.d}일 ${WEEK[W.wd]}요일`;
  const timeText = cfg.noTime ? '' : `${W.h < 12 ? '오전' : '오후'} ${W.h % 12 || 12}시${W.mi ? ' ' + W.mi + '분' : ''}`;
  const gShort = cfg.groom.short || cfg.groom.name;
  const bShort = two ? (cfg.bride.short || cfg.bride.name) : '';
  const namesText = two ? `${gShort} ♥ ${bShort}` : gShort;
  const headline = K.title && cfg.title ? cfg.title : namesText;
  document.title = InviteKinds.fill(K.pageTitle, { names: namesText, title: headline });

  // ── 예식 정보 채우기
  fillInfo();

  // ── 무대 상태: opening → menu → game → result → (정보로)
  let mode = 'opening';
  let t = 0;
  let game = null;
  const hearts = [];
  const linkTag = linkCode ? linkCode.slice(-16) : code;
  let bestKey = `pi-best-${linkTag}`;
  // 게임 종류와 잠금: 결혼식·결혼 알림장 말고는 게임을 깨야 초대장이 열린다(예시 초대장도 똑같이)
  const GAME_CLASS = { catch: window.BouquetGame, blocks: window.BlockGame, shoot: window.ShootGame, tower: window.TowerGame, whack: window.WhackGame, quiz: window.QuizGame };
  const quizOk = q => q && typeof q.q === 'string' && q.q && typeof q.a === 'string' && q.a && Array.isArray(q.w) && q.w.some(w => typeof w === 'string' && w);
  const gameKind = GAME_CLASS[cfg.game] && (cfg.game !== 'quiz' || quizOk(cfg.quiz)) ? cfg.game : 'catch';
  const gated = InviteKinds.gated(cfg.kind);
  const clearKey = `pi-clear-${linkTag}`, failKey = `pi-fail-${linkTag}`;
  // 게임을 깬 기록은 이 폰에 계속 남긴다(창을 닫았다 열어도 다시 안 깨도 됨). 초안·참석 목록·최고점은 창 단위로 초기화.
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* 저장 안 돼도 진행 */ } return null; };
  // #cal: 카톡 안에서 '휴대폰 캘린더'를 눌러 바깥 브라우저로 넘어온 경우. 이미 게임을 깨고 누른 버튼이라 잠금 없이 바로 캘린더로.
  const fromCal = location.hash === '#cal';
  let unlocked = !gated || fromCal || store(clearKey) === '1';
  if (fromCal && gated) store(clearKey, '1');
  let fails = Number(store(failKey)) || 0;
  const applyGate = () => {
    $('skipBtn').hidden = !unlocked;
    $('viewBtn').hidden = !unlocked;
    $('gateNote').hidden = unlocked;
    $('playBtn').textContent = unlocked ? '게임하고 보기' : `게임 깨고 ${DOC} 열기`;
  };
  applyGate();

  $('stageNames').textContent = headline;
  $('stageWhen').textContent = `${W.m}월 ${W.d}일 ${WEEK[W.wd]}요일 ${timeText}`.trim();

  // 청첩장 본문은 버튼을 눌러야 열린다(스크롤로는 안 보임)
  const stageEl = $('stage'), infoEl = $('info');
  const openInvite = () => {
    stageEl.hidden = true;
    infoEl.hidden = false;
    window.scrollTo(0, 0);
  };
  const openStage = () => {
    infoEl.hidden = true;
    stageEl.hidden = false;
    window.scrollTo(0, 0);
  };
  const toInfo = () => {
    if (!unlocked) return;
    if (!infoEl.hidden) return;
    if (location.hash !== '#invite') history.pushState({ view: 'invite' }, '', '#invite');
    openInvite();
  };
  // 휴대폰 뒤로 가기: 청첩장 → 게임 화면
  window.addEventListener('popstate', () => { if (location.hash === '#invite' && unlocked) openInvite(); else openStage(); });
  if (location.hash === '#invite') history.replaceState(null, '', location.pathname + location.search);
  const showMenu = () => {
    mode = 'menu';
    $('resultUi').hidden = true;
    $('stageUi').hidden = false;
  };
  const startGame = () => {
    $('stageUi').hidden = true;
    $('resultUi').hidden = true;
    const easy = gated && !unlocked && fails >= 3; // 세 번 넘게 못 깨면 쉽게
    game = new GAME_CLASS[gameKind]({ groom: chars.groom, bride: chars.thrower }, endGame, { ...K.game, easy, quiz: cfg.quiz });
    mode = 'game';
  };
  function endGame(score, cleared) {
    mode = 'result';
    let best = 0;
    try { best = Number(sessionStorage.getItem(bestKey)) || 0; } catch (e) { /* 저장 안 돼도 진행 */ }
    if (score > best) { best = score; try { sessionStorage.setItem(bestKey, String(score)); } catch (e) { /* 무시 */ } }
    if (cleared && !unlocked) { unlocked = true; store(clearKey, '1'); applyGate(); }
    if (!cleared && !unlocked) { fails++; store(failKey, String(fails)); }
    $('resultTitle').textContent = cleared ? (gated ? `클리어! ${DOC}이 열렸어요` : '클리어! 와 줘서 고마워요')
      : unlocked ? `수고했어요! ${DOC}이 열렸어요` : fails >= 3 ? `아쉬워요! 다음 판은 쉽게 해 드릴게요` : `아쉬워요! 깨야 ${DOC}이 열려요`;
    $('resultScore').textContent = game.summary(best);
    $('toInfoBtn').hidden = !unlocked;
    $('resultUi').hidden = false;
  }

  $('playBtn').addEventListener('click', startGame);
  $('againBtn').addEventListener('click', startGame);
  $('viewBtn').addEventListener('click', toInfo);
  $('toInfoBtn').addEventListener('click', toInfo);
  $('skipBtn').addEventListener('click', () => {
    if (mode === 'opening') t = 99;
    if (mode === 'game') { game = null; showMenu(); }
    toInfo();
  });
  const backToStage = () => {
    if (location.hash === '#invite') history.back();
    else openStage();
  };

  // ── 입력
  const onPointer = e => {
    if (mode !== 'game' || !game) return;
    return Stage.toLogical(canvas, e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerdown', e => { const p = onPointer(e); if (p) { game.down(p); canvas.setPointerCapture?.(e.pointerId); } });
  canvas.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') { const p = onPointer(e); if (p) game.move(p); } });
  ['pointerup', 'pointercancel'].forEach(n => canvas.addEventListener(n, e => { const p = onPointer(e); if (p) game.up(p); }));
  const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
  window.addEventListener('keydown', e => {
    if (mode !== 'game' || !game || !GAME_KEYS.includes(e.key)) return;
    e.preventDefault();
    if (!e.repeat || e.key === 'ArrowLeft' || e.key === 'ArrowRight') game.key(e.key, true);
  });
  window.addEventListener('keyup', e => {
    if (!game || !GAME_KEYS.includes(e.key)) return;
    game.key(e.key, false);
  });

  // ── 오프닝 장면
  const WALK = 1.8;
  const ease = k => 1 - Math.pow(1 - Math.min(1, k), 3);
  // 춤: 2.4초에 한 바퀴(좌우로 들썩 → 빙글 → 폴짝). 두 사람은 거울처럼 마주 춘다.
  function dancePose(tt, i) {
    const beat = Math.floor(tt / 0.3) % 8, f = (tt % 0.3) / 0.3, side = i ? -1 : 1;
    if (beat < 4) {
      const dx = side * (beat < 2 ? -3 : 3);
      return { dx, dy: f < 0.5 ? -3 : 0, flip: dx < 0, happy: false };
    }
    if (beat < 6) return { dx: 0, dy: 0, flip: Math.floor(tt / 0.1) % 2 === 1, happy: false };
    return { dx: 0, dy: -Math.round(Math.sin(f * Math.PI) * 9), flip: false, happy: true };
  }
  function drawDancers(g, tt) {
    const list = two ? [[chars.groom, Stage.PAIR_X[0]], [chars.bride, Stage.PAIR_X[1]]] : [[chars.groom, 80]];
    list.forEach(([c, x], i) => {
      const d = dancePose(tt, i);
      Stage.drawSprite(g, d.happy ? c.happy : c.stand, x + d.dx, Stage.FLOOR_Y + 8 + d.dy, Stage.CHAR_SCALE, d.flip);
    });
  }
  function drawOpening(dt) {
    t += dt;
    Stage.drawVenue(ctx, t * 3);
    const k = ease(t / WALK);
    const walking = t < WALK;
    const bob = walking ? Math.floor(t * 8) % 2 : 0;
    if (walking) {
      if (two) {
        Stage.drawSprite(ctx, chars.groom.stand, -30 + (Stage.PAIR_X[0] + 30) * k, Stage.FLOOR_Y + 8 - bob, Stage.CHAR_SCALE);
        Stage.drawSprite(ctx, chars.bride.stand, 190 + (Stage.PAIR_X[1] - 190) * k, Stage.FLOOR_Y + 8 - bob, Stage.CHAR_SCALE);
      } else {
        Stage.drawSprite(ctx, chars.groom.stand, -30 + (80 + 30) * k, Stage.FLOOR_Y + 8 - bob, Stage.CHAR_SCALE);
      }
    } else drawDancers(ctx, t - WALK);

    if (!walking) {
      if (Math.random() < dt * 1.6) hearts.push({ x: 80 + (Math.random() - 0.5) * 20, y: 96, life: 2 });
      for (const h of hearts) { h.life -= dt; h.y -= dt * 22; h.x += Math.sin(h.life * 4) * 0.3; }
      for (let i = hearts.length - 1; i >= 0; i--) if (hearts[i].life <= 0) hearts.splice(i, 1);
      for (const h of hearts) {
        ctx.globalAlpha = Math.min(1, h.life);
        ctx.drawImage(PixelChars.PROPS.heart, h.x - 4, h.y, 7, 6);
        ctx.globalAlpha = 1;
      }
      const a = Math.min(1, (t - WALK) * 2);
      ctx.globalAlpha = a;
      Stage.drawText(ctx, K.stage, 80, 42, K.stage.length > 9 ? 11 : 13, '#e0526e');
      ctx.globalAlpha = 1;
      if (mode === 'opening' && t > WALK + 0.4) showMenu();
    }
  }

  // ── 반복
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (stageEl.hidden) { requestAnimationFrame(frame); return; }
    if (mode === 'game' && game) {
      game.update(dt);
      game.draw(ctx);
    } else if (mode === 'result' && game) {
      game.draw(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, 0, Stage.LW, Stage.LH);
    } else {
      drawOpening(dt);
    }
    requestAnimationFrame(frame);
  }
  // 글꼴이 늦게 오면 첫 글자가 기본 글꼴로 보이므로 잠깐 기다린다
  try { await Promise.race([document.fonts.load('700 20px Dongle', '받아 주세요 점수 목표'), new Promise(r => setTimeout(r, 800))]); } catch (e) { /* 무시 */ }
  requestAnimationFrame(frame);

  // ───────── 예식 정보 ─────────
  function fillInfo() {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    // 사진 폴더: 기본은 invites/<이름>/, 예시 초대장은 cfg.base(같은 사이트 안의 상대 경로만)
    const base = typeof cfg.base === 'string' && /^invites\/[a-z0-9_\/-]+\/$/i.test(cfg.base) ? cfg.base : `invites/${code}/`;
    const src = f => (/^(https?:)?\/\//.test(f) || f.startsWith('/') ? f : base + f);

    $('sampleBadge').hidden = !cfg.sample;
    if (linkCode) $('sampleBadge').textContent = `예시 ${DOC}이에요. 이름, 장소, 계좌는 모두 가짜예요.`;

    // 커버: 사진 또는 짧은 영상
    const cover = cfg.cover || {};
    const media = $('coverMedia');
    if (cover.type === 'video' && cover.src) {
      const v = el('video');
      Object.assign(v, { src: src(cover.src), autoplay: true, muted: true, loop: true, playsInline: true });
      v.setAttribute('playsinline', '');
      if (cover.poster) v.poster = src(cover.poster);
      media.append(v);
    } else if (cover.src) {
      const img = el('img');
      img.src = src(cover.src); img.alt = `${namesText} 대표 사진`;
      media.append(img);
    } else {
      drawPixelCover(media);
    }
    $('coverEyebrow').textContent = K.eyebrow;
    if (two) {
      $('cGroom').textContent = gShort;
      $('cJoin').textContent = K.joiner;
      $('cBride').textContent = bShort;
    } else {
      $('cGroom').textContent = headline;
      $('cJoin').remove();
      $('cBride').remove();
    }
    $('coverDate').textContent = `${dateText} ${timeText}`.trim();
    $('coverVenue').textContent = K.title && cfg.title ? `${cfg.venue.name || ''}${cfg.venue.name ? ' · ' : ''}${gShort}` : (cfg.venue.name || '');

    // 인사말과 혼주
    $('inviteHead').textContent = K.inviteHead;
    $('greeting').textContent = cfg.greeting || '';
    const parentLine = (id, who) => {
      if (!who.parents) return;
      const p = $(id);
      p.append(document.createTextNode(who.parents), el('b', '', who.short || who.name));
    };
    if (K.parents) {
      parentLine('groomParents', cfg.groom);
      if (two) parentLine('brideParents', cfg.bride);
    }

    // 달력
    $('calTitle').textContent = `${W.y}. ${pad(W.m)}`;
    const cal = $('cal');
    WEEK.forEach((w, i) => cal.append(el('span', 'head' + (i === 0 ? ' sun' : ''), w)));
    const first = new Date(Date.UTC(W.y, W.m - 1, 1)).getUTCDay();
    const last = new Date(Date.UTC(W.y, W.m, 0)).getUTCDate();
    for (let i = 0; i < first; i++) cal.append(el('span'));
    for (let d = 1; d <= last; d++) {
      const wd = (first + d - 1) % 7;
      cal.append(el('span', [wd === 0 ? 'sun' : '', d === W.d ? 'day-on' : ''].join(' ').trim(), d));
    }
    const N = kst(new Date());
    const days = Math.round((Date.UTC(W.y, W.m - 1, W.d) - Date.UTC(N.y, N.m - 1, N.d)) / 864e5);
    const dl = $('ddayLine');
    // "{n}" 자리만 굵게
    const ddayText = (tpl, n) => {
      const parts = InviteKinds.fill(tpl, { names: namesText, title: headline, n: '\u0000' }).split('\u0000');
      dl.append(parts[0]);
      if (parts.length > 1) dl.append(el('b', '', n), parts[1]);
    };
    if (days > 0) ddayText(K.ddayBefore, `${days}일`);
    else if (days === 0) ddayText(K.ddayToday);
    else ddayText(K.ddayAfter, `${1 - days}일`);

    // 사진첩
    if (!two) $('galleryHead').textContent = '사진첩';
    const photos = (cfg.gallery || []).map(src);
    const gal = $('gallery');
    photos.forEach((u, i) => {
      const b = el('button');
      b.type = 'button';
      b.setAttribute('aria-label', `사진 ${i + 1} 크게 보기`);
      const img = el('img');
      img.src = u; img.alt = ''; img.loading = 'lazy';
      b.append(img);
      b.addEventListener('click', () => openLightbox(photos, i));
      gal.append(b);
    });
    if (!photos.length) $('gallerySec').hidden = true;

    // 오시는 길(장소가 없으면 숨김)
    if (!cfg.venue.name && !cfg.venue.address) $('locSec').hidden = true;
    $('venueName').textContent = cfg.venue.name || '';
    $('venueAddress').textContent = cfg.venue.address;
    const q = encodeURIComponent(cfg.venue.address || cfg.venue.name);
    $('naverMap').href = `https://map.naver.com/p/search/${q}`;
    $('kakaoMap').href = `https://map.kakao.com/?q=${q}`;
    $('copyAddr').addEventListener('click', () => copy(cfg.venue.address, '주소를 복사했어요'));
    const guide = $('guide');
    [['대중교통', cfg.venue.transit], ['주차', cfg.venue.parking]].forEach(([k, v]) => {
      if (v) guide.append(el('dt', '', k), el('dd', '', v));
    });
    if (!guide.children.length) guide.hidden = true;

    // 계좌: 신랑 측 / 신부 측 접기
    $('accNote').textContent = K.accountNote;
    if (K.accountAmount) $('accHead').textContent = '회비 안내';
    const acc = $('accounts');
    const sides = {};
    (cfg.accounts || []).forEach(a => { (sides[a.side] = sides[a.side] || []).push(a); });
    Object.entries(sides).forEach(([side, list]) => {
      const box = el('details', 'acc-group');
      const amt = list.map(a => a.amount).filter(Boolean)[0];
      box.append(el('summary', '', amt ? `${side} ${amt}` : `${side} 계좌번호`));
      if (amt) box.open = true;
      list.forEach(a => {
        const row = el('div', 'account');
        const txt = el('div');
        if (a.amount && list.length > 1) txt.append(el('p', 'amount', `${side} ${a.amount}`));
        txt.append(el('p', '', `${a.bank} ${a.number}`), el('p', 'holder', a.holder));
        const b = el('button', 'lbtn', '복사');
        b.type = 'button';
        b.addEventListener('click', () => copy(`${a.bank} ${a.number}`, '계좌번호를 복사했어요'));
        row.append(txt, b);
        box.append(row);
      });
      acc.append(box);
    });
    if (!acc.children.length) $('accountSec').hidden = true;

    const contacts = $('contacts');
    const callLabel = i => (two ? `${K.people[i].label}에게 연락` : '전화하기');
    [[callLabel(0), cfg.groom.phone], [callLabel(1), two && cfg.bride.phone]].forEach(([label, tel]) => {
      if (!tel) return;
      const a = el('a', 'lbtn', label);
      a.href = `tel:${tel.replace(/[^0-9+]/g, '')}`;
      contacts.append(a);
    });
    if (!contacts.children.length) $('contactSec').hidden = true;

    setupRsvp(el);

    setupCalendar();
    $('shareBtn').addEventListener('click', async () => {
      const data = { title: document.title, text: [`${dateText} ${timeText}`.trim(), cfg.venue.name].filter(Boolean).join(', '), url: location.href };
      if (navigator.share) { try { await navigator.share(data); return; } catch (e) { /* 취소 */ } }
      copy(location.href, `${DOC} 주소를 복사했어요`);
    });
    $('makeLink').href = `kind.html?k=${cfg.kind || 'wedding'}`;
    if (window.top !== window) $('makeLink').target = '_top';
    $('replayBtn').addEventListener('click', () => {
      backToStage();
      startGame();
    });
  }

  // 사진이 없으면 픽셀 신랑·신부 그림을 대표 사진 자리에 둔다
  async function drawPixelCover(media) {
    media.classList.add('pixel');
    // 사진 얼굴이 있으면 다 읽힌 뒤에 그린다
    await Promise.all([chars.groom, chars.bride].filter(c => c && c.face).map(c => c.face.decode().catch(() => {})));
    const S = 4;
    const c = document.createElement('canvas');
    c.width = Stage.LW * S; c.height = Stage.LH * S;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', `${namesText} 캐릭터`);
    const g = c.getContext('2d');
    g.setTransform(S, 0, 0, S, 0, 0);
    g.imageSmoothingEnabled = true;
    media.append(c);
    // 화면에 보일 때만 춤을 그린다
    let seen = true, t0 = performance.now();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(c);
    const paint = now => {
      if (seen) {
        Stage.drawVenue(g, (now - t0) / 1000 * 3);
        drawDancers(g, (now - t0) / 1000);
        [[70, 82], [84, 68], [92, 88], [62, 62], [100, 58]].forEach(([x, y], i) => g.drawImage(PixelChars.PROPS.heart, x, y + Math.sin((now - t0) / 400 + i) * 2, 7, 6));
      }
      requestAnimationFrame(paint);
    };
    requestAnimationFrame(paint);
  }

  // ── 사진 크게 보기(좌우로 넘기기)
  function openLightbox(list, start) {
    const box = $('lightbox'), img = $('lbImg');
    let i = start;
    const show = () => { img.src = list[i]; $('lbCount').textContent = `${i + 1} / ${list.length}`; };
    const go = d => { i = (i + d + list.length) % list.length; show(); };
    show();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    const close = () => { box.hidden = true; document.body.style.overflow = ''; cleanup(); };
    let sx = null;
    const onDown = e => { sx = e.clientX; };
    const onUp = e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); };
    const onKey = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    const prev = () => go(-1), next = () => go(1);
    const onBg = e => { if (e.target === box) close(); };
    $('lbPrev').addEventListener('click', prev);
    $('lbNext').addEventListener('click', next);
    $('lbClose').addEventListener('click', close);
    box.addEventListener('click', onBg);
    img.addEventListener('pointerdown', onDown);
    img.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    function cleanup() {
      $('lbPrev').removeEventListener('click', prev);
      $('lbNext').removeEventListener('click', next);
      $('lbClose').removeEventListener('click', close);
      box.removeEventListener('click', onBg);
      img.removeEventListener('pointerdown', onDown);
      img.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
    }
  }

  // 캘린더: 구글 캘린더 주소(어디서나 열림) + .ics 파일(카톡 안 브라우저는 파일 받기가 막혀서 바깥 브라우저로 연다)
  const inKakao = /KAKAOTALK/i.test(navigator.userAgent);
  function setupCalendar() {
    const z = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const end = new Date(when.getTime() + 2 * 3600e3);
    const place = [cfg.venue.name, cfg.venue.address].filter(Boolean).join(' ');
    const shareUrl = location.href.replace(/#.*$/, '');
    const q = new URLSearchParams({ action: 'TEMPLATE', text: document.title, dates: `${z(when)}/${z(end)}`, details: shareUrl });
    if (place) q.set('location', place);
    $('calGoogle').href = `https://calendar.google.com/calendar/render?${q}`;
    $('calBtn').addEventListener('click', () => {
      const open = $('calPick').hidden;
      $('calPick').hidden = !open;
      $('calBtn').setAttribute('aria-expanded', open);
    });
    $('calIcs').addEventListener('click', () => {
      if (inKakao) {
        toast('바깥 브라우저에서 열어요. 거기서 한 번 더 눌러 주세요');
        location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(shareUrl + '#cal')}`;
        return;
      }
      downloadIcs();
    });
    if (location.hash === '#cal') {
      $('calPick').hidden = false;
      setTimeout(() => { if (mode === 'opening') t = 99; toInfo(); setTimeout(() => $('calPick').scrollIntoView({ block: 'center' }), 400); }, 300);
    }
  }

  function downloadIcs() {
    const z = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const end = new Date(when.getTime() + 2 * 3600e3);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pixel-invite//KO', 'BEGIN:VEVENT',
      `UID:${code}-${when.getTime()}@pixel-invite`, `DTSTAMP:${z(new Date())}`,
      `DTSTART:${z(when)}`, `DTEND:${z(end)}`,
      `SUMMARY:${document.title}`,
      `LOCATION:${[cfg.venue.name, cfg.venue.address].filter(Boolean).join(' ')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'invite.ics';
    a.click();
  }

  // ───────── 참석 여부 ─────────
  function setupRsvp(el) {
    const R = cfg.rsvp;
    const sample = !!cfg.sample;
    if (!R || !(sample || (window.Rsvp && Rsvp.enabled && Rsvp.validId(R.id)))) return;
    const pub = !!R.pub;
    $('rsvpSec').hidden = false;
    $('rsvpNote').textContent = pub
      ? '참석 여부를 알려 주세요. 보낸 응답은 이 초대장을 받은 사람 모두가 볼 수 있어요.'
      : '참석 여부를 알려 주세요. 응답은 초대장을 만든 사람만 볼 수 있어요.';
    const sel = $('rsvpPeople');
    for (let n = 1; n <= 10; n++) sel.add(new Option(`${n}명`, n));
    const store = `pi-rsvp-${R.id}`;
    let attend = null;
    const pick = v => {
      attend = v;
      document.querySelectorAll('[data-attend]').forEach(b => {
        const on = b.dataset.attend === (v ? '1' : '0');
        b.classList.toggle('solid', on); b.setAttribute('aria-pressed', on);
      });
      $('rsvpPeopleRow').hidden = !v;
    };
    document.querySelectorAll('[data-attend]').forEach(b => b.addEventListener('click', () => pick(b.dataset.attend === '1')));
    $('rsvpPeopleRow').hidden = true;

    const showDone = a => {
      $('rsvpForm').hidden = true;
      $('rsvpDone').hidden = false;
      $('rsvpDoneText').textContent = a.attend ? `${a.name} 님, ${a.people}명 참석으로 전했어요.` : `${a.name} 님, 불참으로 전했어요.`;
    };
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(store) || 'null'); } catch (e) { /* 없음 */ }
    if (saved && saved.name) {
      $('rsvpName').value = saved.name; $('rsvpMsg').value = saved.note || ''; sel.value = saved.people || 1; pick(!!saved.attend);
      showDone(saved);
    }
    $('rsvpEdit').addEventListener('click', () => { $('rsvpForm').hidden = false; $('rsvpDone').hidden = true; });

    const renderList = rows => {
      const box = $('rsvpList');
      box.innerHTML = '';
      const yes = rows.filter(r => r.attend), no = rows.filter(r => !r.attend);
      const total = yes.reduce((s, r) => s + (r.people || 1), 0);
      box.append(el('p', 'rsvp-sum', `참석 ${total}명 · 불참 ${no.length}명`));
      const list = el('ul');
      yes.concat(no).forEach(r => {
        const li = el('li', r.attend ? 'yes' : 'no');
        li.append(el('b', '', r.name), el('span', '', r.attend ? `참석 ${r.people}명` : '불참'));
        if (r.note) li.append(el('small', '', r.note));
        list.append(li);
      });
      if (rows.length) box.append(list);
      box.hidden = false;
    };
    const loadList = async () => {
      if (!pub) return;
      if (sample) { renderList([{ name: '예시 친구', attend: true, people: 2, note: '꼭 갈게요!' }, { name: '예시 동료', attend: false, people: 0, note: '' }]); return; }
      try { renderList(await Rsvp.list(R.id)); } catch (e) { /* 명단은 못 불러와도 응답은 가능 */ }
    };
    loadList();

    $('rsvpSend').addEventListener('click', async () => {
      const name = $('rsvpName').value.trim();
      if (attend === null) { toast('참석 또는 못 가요를 골라 주세요'); return; }
      if (!name) { toast('이름을 적어 주세요'); $('rsvpName').focus(); return; }
      const a = { name, attend, people: attend ? +sel.value : 0, note: $('rsvpMsg').value.trim() };
      if (sample) { toast('예시 초대장이라 저장되지 않아요'); showDone(a); return; }
      const btn = $('rsvpSend');
      btn.disabled = true;
      try {
        const ok = await Rsvp.submit(R.id, a);
        if (!ok) throw new Error('rejected');
        try { sessionStorage.setItem(store, JSON.stringify(a)); } catch (e) { /* 무시 */ }
        showDone(a);
        toast('응답을 보냈어요');
        loadList();
      } catch (e) {
        toast('보내지 못했어요. 잠시 뒤 다시 해 주세요');
      } finally { btn.disabled = false; }
    });
  }

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* 무시 */ }
      ta.remove();
    }
    toast(msg);
  }
  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }
})();
