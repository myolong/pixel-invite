// 청첩장 페이지: 설정을 읽어 오프닝 → (게임) → 예식 정보를 보여준다.
'use strict';

(async function main() {
  const $ = id => document.getElementById(id);
  const canvas = $('screen');
  const ctx = Stage.setupCanvas(canvas);

  // ── 설정 읽기: invite.html?c=<이름> → invites/<이름>.json
  const code = (new URLSearchParams(location.search).get('c') || 'sample').replace(/[^a-z0-9_-]/gi, '');
  let cfg;
  try {
    const res = await fetch(`invites/${code}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    cfg = await res.json();
  } catch (e) {
    document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">청첩장을 찾을 수 없어요. 주소를 다시 확인해 주세요.</p>';
    return;
  }

  const chars = {
    groom: PixelChars.makeCharacter(cfg.groom.look || { outfit: 'tux' }),
    bride: PixelChars.makeCharacter(cfg.bride.look || { outfit: 'dress', hair: 'long', veil: true }),
  };
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
  const timeText = `${W.h < 12 ? '오전' : '오후'} ${W.h % 12 || 12}시${W.mi ? ' ' + W.mi + '분' : ''}`;
  const gShort = cfg.groom.short || cfg.groom.name;
  const bShort = cfg.bride.short || cfg.bride.name;
  document.title = `${gShort} ♥ ${bShort} 결혼합니다`;

  // ── 예식 정보 채우기
  fillInfo();

  // ── 무대 상태: opening → menu → game → result → (정보로)
  let mode = 'opening';
  let t = 0;
  let game = null;
  const hearts = [];
  let bestKey = `pi-best-${code}`;

  $('stageNames').textContent = `${gShort} ♥ ${bShort}`;
  $('stageWhen').textContent = `${W.m}월 ${W.d}일 ${WEEK[W.wd]}요일 ${timeText}`;

  const toInfo = () => {
    $('info').scrollIntoView({ behavior: 'smooth' });
  };
  const showMenu = () => {
    mode = 'menu';
    $('resultUi').hidden = true;
    $('stageUi').hidden = false;
  };
  const startGame = () => {
    $('stageUi').hidden = true;
    $('resultUi').hidden = true;
    game = new BouquetGame(chars, endGame);
    mode = 'game';
  };
  function endGame(score, cleared) {
    mode = 'result';
    let best = 0;
    try { best = Number(localStorage.getItem(bestKey)) || 0; } catch (e) { /* 저장 안 돼도 진행 */ }
    if (score > best) { best = score; try { localStorage.setItem(bestKey, String(score)); } catch (e) { /* 무시 */ } }
    $('resultTitle').textContent = cleared ? '클리어! 축하해 줘서 고마워요' : '수고했어요! 청첩장이 열렸어요';
    $('resultScore').textContent = `점수 ${score}점 · 받은 선물 ${game.caught}개 · 내 최고 ${best}점`;
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

  // ── 입력
  const onPointer = e => {
    if (mode !== 'game' || !game) return;
    const p = Stage.toLogical(canvas, e.clientX, e.clientY);
    game.pointer(p.x);
  };
  canvas.addEventListener('pointerdown', e => { onPointer(e); canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') onPointer(e); });
  window.addEventListener('keydown', e => {
    if (!game) return;
    if (e.key === 'ArrowLeft') game.keys.left = true;
    if (e.key === 'ArrowRight') game.keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (!game) return;
    if (e.key === 'ArrowLeft') game.keys.left = false;
    if (e.key === 'ArrowRight') game.keys.right = false;
  });

  // ── 오프닝 장면
  const WALK = 1.8;
  const ease = k => 1 - Math.pow(1 - Math.min(1, k), 3);
  function drawOpening(dt) {
    t += dt;
    Stage.drawVenue(ctx, t * 3);
    const k = ease(t / WALK);
    const walking = t < WALK;
    const bob = walking ? Math.floor(t * 8) % 2 : 0;
    const blink = !walking && (t % 3.2) < 0.15;
    const gx = -20 + (58 - -20) * k;
    const bx = 180 + (102 - 180) * k;
    const gImg = blink || (!walking && t % 6 > 5) ? chars.groom.happy : chars.groom.stand;
    const bImg = blink || (!walking && t % 6 > 5) ? chars.bride.happy : chars.bride.stand;
    Stage.drawSprite(ctx, gImg, gx, Stage.FLOOR_Y + 8 - bob, 2);
    Stage.drawSprite(ctx, bImg, bx, Stage.FLOOR_Y + 8 - bob, 2);

    if (!walking) {
      if (Math.random() < dt * 1.6) hearts.push({ x: 80 + (Math.random() - 0.5) * 20, y: 120, life: 2 });
      for (const h of hearts) { h.life -= dt; h.y -= dt * 22; h.x += Math.sin(h.life * 4) * 0.3; }
      for (let i = hearts.length - 1; i >= 0; i--) if (hearts[i].life <= 0) hearts.splice(i, 1);
      for (const h of hearts) {
        ctx.globalAlpha = Math.min(1, h.life);
        ctx.drawImage(PixelChars.PROPS.heart, Math.round(h.x - 4), Math.round(h.y));
        ctx.globalAlpha = 1;
      }
      const a = Math.min(1, (t - WALK) * 2);
      ctx.globalAlpha = a;
      Stage.drawText(ctx, '저희 결혼합니다', 80, 42, 13, '#e0526e');
      ctx.globalAlpha = 1;
      if (mode === 'opening' && t > WALK + 0.4) showMenu();
    }
  }

  // ── 반복
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
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
  try { await Promise.race([document.fonts.load('700 13px Galmuri11'), new Promise(r => setTimeout(r, 800))]); } catch (e) { /* 무시 */ }
  requestAnimationFrame(frame);

  // ───────── 예식 정보 ─────────
  function fillInfo() {
    $('sampleBadge').hidden = !cfg.sample;
    $('coupleNames').textContent = `${cfg.groom.name} · ${cfg.bride.name}`;
    $('dateText').textContent = `${dateText} ${timeText}`;
    $('venueShort').textContent = cfg.venue.name;
    const N = kst(new Date());
    const days = Math.round((Date.UTC(W.y, W.m - 1, W.d) - Date.UTC(N.y, N.m - 1, N.d)) / 864e5);
    $('dday').textContent = days > 0 ? `D-${days}` : days === 0 ? '오늘이에요!' : '감사합니다';
    $('greeting').textContent = cfg.greeting || '';
    $('groomParents').textContent = cfg.groom.parents ? `${cfg.groom.parents} ${cfg.groom.name}` : '';
    $('brideParents').textContent = cfg.bride.parents ? `${cfg.bride.parents} ${cfg.bride.name}` : '';
    $('venueName').textContent = cfg.venue.name;
    $('venueAddress').textContent = cfg.venue.address;
    const q = encodeURIComponent(cfg.venue.address || cfg.venue.name);
    $('naverMap').href = `https://map.naver.com/p/search/${q}`;
    $('kakaoMap').href = `https://map.kakao.com/?q=${q}`;
    $('copyAddr').addEventListener('click', () => copy(cfg.venue.address, '주소를 복사했어요'));

    const guide = $('guide');
    [['대중교통', cfg.venue.transit], ['주차', cfg.venue.parking]].forEach(([k, v]) => {
      if (!v) return;
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      guide.append(dt, dd);
    });

    const acc = $('accounts');
    (cfg.accounts || []).forEach(a => {
      const row = document.createElement('div');
      row.className = 'account';
      const txt = document.createElement('div');
      const p1 = document.createElement('p'); p1.className = 'side'; p1.textContent = `${a.side} · ${a.holder}`;
      const p2 = document.createElement('p'); p2.textContent = `${a.bank} ${a.number}`;
      txt.append(p1, p2);
      const b = document.createElement('button');
      b.className = 'btn small'; b.type = 'button'; b.textContent = '복사';
      b.addEventListener('click', () => copy(`${a.bank} ${a.number}`, '계좌번호를 복사했어요'));
      row.append(txt, b);
      acc.append(row);
    });
    if (!acc.children.length) acc.closest('.card').hidden = true;

    const contacts = $('contacts');
    [['신랑에게 전화', cfg.groom.phone], ['신부에게 전화', cfg.bride.phone]].forEach(([label, tel]) => {
      if (!tel) return;
      const a = document.createElement('a');
      a.className = 'btn small'; a.textContent = label; a.href = `tel:${tel.replace(/[^0-9+]/g, '')}`;
      contacts.append(a);
    });
    if (!contacts.children.length) contacts.closest('.card').hidden = true;

    $('calBtn').addEventListener('click', downloadIcs);
    $('shareBtn').addEventListener('click', async () => {
      const data = { title: document.title, text: `${dateText} ${timeText}, ${cfg.venue.name}`, url: location.href };
      if (navigator.share) { try { await navigator.share(data); return; } catch (e) { /* 취소 */ } }
      copy(location.href, '청첩장 주소를 복사했어요');
    });
  }

  function downloadIcs() {
    const z = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const end = new Date(when.getTime() + 2 * 3600e3);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//pixel-invite//KO', 'BEGIN:VEVENT',
      `UID:${code}-${when.getTime()}@pixel-invite`, `DTSTAMP:${z(new Date())}`,
      `DTSTART:${z(when)}`, `DTEND:${z(end)}`,
      `SUMMARY:${cfg.groom.name} ♥ ${cfg.bride.name} 결혼식`,
      `LOCATION:${cfg.venue.name} (${cfg.venue.address})`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'wedding.ics';
    a.click();
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
