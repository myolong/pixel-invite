// 만들기 화면: 종류 고르기 → 입력 → 캐릭터 꾸미기 → 초대장 링크(invite.html?d=...) 만들기
'use strict';

(async function maker() {
  const $ = id => document.getElementById(id);
  const form = $('form');
  const DRAFT_KEY = 'pi-make-draft';
  const { KINDS, ORDER } = InviteKinds;
  const SLOTS = ['groom', 'bride'];
  let toastTimer;

  // ── 상태
  let kind = 'wedding';
  let K = KINDS[kind];
  let greetingIdx = 0;
  const clone = o => JSON.parse(JSON.stringify(o));
  const looks = { groom: clone(K.people[0].look), bride: clone(K.people[1].look) };
  let who = 'groom';
  let accounts = [];
  let sprites = {};

  // ── 미리보기
  const canvas = $('preview');
  const ctx = Stage.setupCanvas(canvas);
  let t = 0, last = performance.now();
  function rebuild() {
    sprites = { groom: PixelChars.makeCharacter(looks.groom), bride: PixelChars.makeCharacter(looks.bride) };
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    Stage.drawVenue(ctx, t * 3);
    const blink = (t % 3.2) < 0.15;
    const bob = Math.floor(t * 2) % 2;
    const two = K.people.length > 1;
    const pos = two ? { groom: Stage.PAIR_X[0], bride: Stage.PAIR_X[1] } : { groom: 80 };
    Object.entries(pos).forEach(([k, x]) => {
      const s = sprites[k];
      Stage.drawSprite(ctx, blink ? s.happy : s.stand, x, Stage.FLOOR_Y + 8 - (who === k ? bob : 0), Stage.CHAR_SCALE);
    });
    if (two) {
      const ax = pos[who];
      ctx.fillStyle = '#e0526e';
      for (let r = 0; r < 4; r++) ctx.fillRect(ax - 3 + r, 99 + r + bob, 7 - r * 2, 1);
    }
    requestAnimationFrame(frame);
  }

  // ── 종류 고르기
  let pickOpen = true;
  $('kindChange').addEventListener('click', () => { pickOpen = true; renderKinds(); });
  function renderKinds() {
    $('kindPicked').hidden = pickOpen;
    $('kindGrid').hidden = !pickOpen;
    $('kindPickedName').textContent = K.name;
    const grid = $('kindGrid');
    grid.innerHTML = '';
    ORDER.forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kind' + (k === kind ? ' on' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', k === kind);
      b.innerHTML = `<span class="kind-no">${i + 1}</span><b></b><small></small>`;
      b.querySelector('b').textContent = KINDS[k].name;
      b.querySelector('small').textContent = KINDS[k].blurb;
      b.addEventListener('click', () => { pickOpen = false; if (k !== kind) { setKind(k); saveDraft(); } else renderKinds(); });
      grid.append(b);
    });
  }

  function setKind(k, opt = {}) {
    const prev = K;
    kind = KINDS[k] ? k : 'wedding';
    K = KINDS[kind];
    Stage.setTheme(K.scene);
    // 캐릭터: 종류를 바꾸면 그 종류의 기본 옷차림으로
    if (!opt.keepLooks && prev !== K) {
      const faces = { groom: looks.groom.face, bride: looks.bride.face };
      looks.groom = clone(K.people[0].look);
      looks.bride = clone((K.people[1] || KINDS.wedding.people[1]).look);
      // 사진 얼굴은 종류를 바꿔도 그대로
      SLOTS.forEach(sl => { if (faces[sl]) looks[sl].face = faces[sl]; });
    }
    // 인사말: 비어 있거나 예시 문구 그대로면 새 종류의 예시로
    const g = form.greeting.value.replace(/\r/g, '').trim();
    const isPreset = !g || Object.values(KINDS).some(x => x.greetings.includes(g));
    if (!opt.keepGreeting && isPreset) { greetingIdx = 0; form.greeting.value = K.greetings[0]; }
    // 계좌 구분
    const sides = K.accountSides;
    accounts.forEach((a, i) => { if (!sides.includes(a.side)) a.side = sides[i % sides.length]; });
    if (!accounts.length) accounts = sides.map(side => ({ side, bank: '', number: '', holder: '' }));

    // 이름표
    const two = K.people.length > 1;
    $('whoLegend').textContent = two ? K.people.map(p => p.label).join('·') : (K.title ? '모임과 대표' : K.people[0].label);
    $('titleRow').hidden = !K.title;
    form.title.placeholder = K.titleHint || '';
    $('slot0Label').textContent = K.people[0].label;
    $('slot1').hidden = !two;
    $('pair').classList.toggle('one', !two);
    if (two) {
      $('slot1Label').textContent = K.people[1].label + (K.people[1].optional ? ' (선택)' : '');
      $('slot1Req').hidden = !!K.people[1].optional;
    }
    form.querySelectorAll('.parents-row').forEach(e => { e.hidden = !K.parents; });
    form.elements['groom.name'].placeholder = two ? '김도윤' : '이름 또는 닉네임';
    form.elements['bride.name'].placeholder = '이서연';
    $('whenLabel').textContent = K.when;
    $('placeLabel').textContent = K.place + (K.placeOptional ? ' (선택)' : '');
    $('placeReq').hidden = !!K.placeOptional;
    $('timeReq').hidden = !!K.placeOptional;
    form.elements['venue.name'].placeholder = K.placeHint;
    if (!two) who = 'groom';
    renderKinds();
    renderTabs();
    renderLook();
    renderAccounts();
    rebuild();
  }

  // ── 꾸미기
  function renderTabs() {
    const tabs = $('whoTabs');
    tabs.innerHTML = '';
    tabs.hidden = K.people.length < 2;
    K.people.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'who' + (SLOTS[i] === who ? ' on' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', SLOTS[i] === who);
      b.textContent = p.label;
      b.addEventListener('click', () => { who = SLOTS[i]; renderTabs(); renderLook(); });
      tabs.append(b);
    });
  }
  const HAIR_NAMES = { short: '짧은 머리', bun: '올림머리', bob: '단발', long: '긴 머리', ponytail: '포니테일', twin: '양갈래', perm: '파마' };
  const OUTFIT_NAMES = { tux: '턱시도', suit: '정장', dress: '드레스', onepiece: '원피스', hanbok: '한복', casual: '티셔츠', hoodie: '후드티' };
  function renderLook() {
    const L = looks[who];
    const panel = $('lookPanel');
    panel.innerHTML = '';
    const group = (title, items, cur, set, swatch) => {
      const g = document.createElement('div');
      g.className = 'opt';
      const h = document.createElement('p');
      h.textContent = title;
      const row = document.createElement('div');
      row.className = 'opt-row';
      items.forEach((it, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (swatch ? ' swatch' : '') + (it.value === cur ? ' on' : '');
        b.setAttribute('aria-pressed', it.value === cur);
        if (swatch) { b.style.background = it.color; b.setAttribute('aria-label', `${title} ${i + 1}`); }
        else b.textContent = it.label;
        b.addEventListener('click', () => { set(it.value); rebuild(); renderLook(); saveDraft(); });
        row.append(b);
      });
      g.append(h, row);
      panel.append(g);
    };
    // 얼굴: 픽셀 얼굴 또는 내 사진 얼굴
    const fb = document.createElement('div');
    fb.className = 'opt face-opt';
    fb.innerHTML = `<p>얼굴</p><div class="opt-row">
      <button type="button" class="chip${L.face ? '' : ' on'}" data-f="pixel">픽셀 얼굴</button>
      <button type="button" class="chip${L.face ? ' on' : ''}" data-f="photo">${L.face ? '<img alt="" class="face-thumb"> 사진 바꾸기' : '내 사진 얼굴'}</button>
      </div><input type="file" accept="image/*" hidden>
      <p class="hint small">${L.face ? '사진 얼굴은 이 링크를 받은 사람 누구나 볼 수 있어요.' : '얼굴이 잘 나온 사진을 고르면 얼굴만 오려서 캐릭터 머리로 써요. 사진은 이 기기 안에서만 처리돼요.'}</p>`;
    if (L.face) fb.querySelector('.face-thumb').src = L.face;
    const file = fb.querySelector('input[type=file]');
    fb.querySelector('[data-f=pixel]').addEventListener('click', () => { delete L.face; rebuild(); renderLook(); saveDraft(); });
    fb.querySelector('[data-f=photo]').addEventListener('click', () => { FaceCrop.detector(); file.click(); });
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      const url = await FaceCrop.open(f);
      if (url) { L.face = url; rebuild(); renderLook(); saveDraft(); toast('사진 얼굴을 붙였어요'); }
    });
    panel.append(fb);

    group('옷', Object.keys(OUTFIT_NAMES).map(k => ({ value: k, label: OUTFIT_NAMES[k] })), L.outfit, v => {
      if (L.outfit !== v) L.color = 0;
      L.outfit = v;
    });
    group('옷 색', (PixelChars.OUTFIT_COLORS[L.outfit] || PixelChars.SUIT_COLORS).map((c, i) => ({ value: i, color: c })), L.color, v => { L.color = v; }, true);
    // 사진 얼굴이면 머리 모양·머리색·안경은 필요 없음
    if (!L.face) group('머리 모양', Object.keys(HAIR_NAMES).map(k => ({ value: k, label: HAIR_NAMES[k] })), L.hair, v => { L.hair = v; });
    if (!L.face) group('머리색', PixelChars.HAIR_COLORS.map((c, i) => ({ value: i, color: c })), L.hairColor, v => { L.hairColor = v; }, true);
    group('피부색', PixelChars.SKIN_ORDER.map(i => ({ value: i, color: PixelChars.SKINS[i] })), L.skin, v => { L.skin = v; }, true);
    const yesNo = [{ value: true, label: '쓰기' }, { value: false, label: '안 쓰기' }];
    if (!L.face) group('안경', yesNo, !!L.glasses, v => { L.glasses = v; });
    group('베일', yesNo, !!L.veil, v => { L.veil = v; });
  }

  // ── 계좌
  function renderAccounts() {
    const box = $('accounts');
    box.innerHTML = '';
    const sides = K.accountSides;
    accounts.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'acc';
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', '구분');
      sides.concat(sides.includes(a.side) ? [] : [a.side]).forEach(s => sel.add(new Option(s, s, false, s === a.side)));
      const inp = (ph, val, max) => { const e = document.createElement('input'); e.placeholder = ph; e.maxLength = max || 12; e.value = val; e.setAttribute('aria-label', ph); return e; };
      const bank = inp('은행', a.bank), num = inp('계좌번호', a.number, 30), holder = inp('예금주', a.holder);
      const amount = inp('금액 (예: 1인 30,000원)', a.amount || '', 20);
      amount.className = 'amount';
      amount.hidden = !K.accountAmount;
      num.inputMode = 'numeric';
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'del'; del.textContent = '✕'; del.setAttribute('aria-label', '이 계좌 지우기');
      row.append(sel, bank, num, holder, amount, del);
      const sync = () => { a.side = sel.value; a.bank = bank.value; a.number = num.value; a.holder = holder.value; a.amount = amount.value; saveDraft(); };
      [sel, bank, num, holder, amount].forEach(e => e.addEventListener('input', sync));
      del.addEventListener('click', () => { accounts.splice(i, 1); renderAccounts(); saveDraft(); });
      box.append(row);
    });
    $('addAccount').hidden = accounts.length >= 6;
  }
  $('addAccount').addEventListener('click', () => {
    const sides = K.accountSides;
    accounts.push({ side: sides[accounts.length % sides.length], bank: '', number: '', holder: '' });
    renderAccounts();
  });
  $('nextGreeting').addEventListener('click', () => {
    greetingIdx = (greetingIdx + 1) % K.greetings.length;
    form.greeting.value = K.greetings[greetingIdx];
    saveDraft();
  });

  // ── 임시 저장
  function readForm() {
    const v = n => (form.elements[n].value || '').trim();
    const person = k => ({ name: v(`${k}.name`), short: v(`${k}.short`), parents: v(`${k}.parents`), phone: v(`${k}.phone`) });
    return {
      kind, title: v('title'),
      groom: person('groom'), bride: person('bride'),
      day: v('day'), time: v('time'),
      venue: { name: v('venue.name'), address: v('venue.address'), transit: v('venue.transit'), parking: v('venue.parking') },
      greeting: form.greeting.value.replace(/\r/g, '').trim(),
      accounts, looks,
    };
  }
  function applyDraft(d) {
    if (KINDS[d.kind]) { kind = d.kind; K = KINDS[kind]; }
    const set = (n, val) => { if (form.elements[n] && val != null) form.elements[n].value = val; };
    set('title', d.title);
    SLOTS.forEach(k => ['name', 'short', 'parents', 'phone'].forEach(f => set(`${k}.${f}`, d[k] && d[k][f])));
    set('day', d.day); set('time', d.time);
    ['name', 'address', 'transit', 'parking'].forEach(f => set(`venue.${f}`, d.venue && d.venue[f]));
    set('greeting', d.greeting);
    if (Array.isArray(d.accounts)) accounts = d.accounts.map(a => ({ side: a.side || '', bank: a.bank || '', number: a.number || '', holder: a.holder || '', amount: a.amount || '' }));
    if (d.looks) {
      SLOTS.forEach((k, i) => {
        if (d.looks[k]) looks[k] = Object.assign(clone((K.people[i] || KINDS.wedding.people[i]).look), d.looks[k]);
      });
    }
  }
  let saveTimer;
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(readForm())); } catch (e) { /* 저장 안 돼도 진행 */ } }, 300);
  }
  form.addEventListener('input', saveDraft);

  // 초대장 설정(JSON) ↔ 입력 내용
  const clean = o => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== '' && x != null && x !== false));
  function toConfig(d) {
    const two = K.people.length > 1 && d.bride.name;
    const person = (p, lk) => {
      const o = { ...p, look: lk };
      if (!K.parents) delete o.parents;
      return clean(o);
    };
    return clean({
      kind,
      title: K.title ? d.title : '',
      groom: person(d.groom, d.looks.groom),
      bride: two ? person(d.bride, d.looks.bride) : null,
      date: `${d.day}T${d.time || '12:00'}:00+09:00`,
      noTime: !d.time,
      venue: clean(d.venue),
      greeting: d.greeting,
      accounts: d.accounts.filter(a => a.number.trim()).map(a => clean({ side: a.side, bank: a.bank.trim(), number: a.number.trim(), holder: a.holder.trim(), amount: K.accountAmount ? (a.amount || '').trim().slice(0, 20) : '' })),
    });
  }
  function fromConfig(c) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(c.date || '') || [];
    return {
      kind: c.kind || 'wedding', title: c.title || '',
      groom: c.groom || {}, bride: c.bride || {}, day: m[1], time: c.noTime ? '' : m[2], venue: c.venue || {},
      greeting: c.greeting, accounts: c.accounts || [],
      looks: { groom: (c.groom || {}).look, bride: (c.bride || {}).look },
    };
  }

  // ── 링크 만들기
  const base = location.href.replace(/[?#].*$/, '').replace(/make\.html$/, '');
  let inviteUrl = '', editUrl = '';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = readForm();
    const missing = [];
    if (K.title && !d.title) missing.push('모임·행사 이름');
    if (!d.groom.name) missing.push(`${K.people[0].label} 이름`);
    if (K.people.length > 1 && !K.people[1].optional && !d.bride.name) missing.push(`${K.people[1].label} 이름`);
    if (!d.day) missing.push(K.when);
    if (!K.placeOptional && !d.time) missing.push('시간');
    if (!K.placeOptional && !d.venue.name) missing.push(K.place);
    const err = $('err');
    if (missing.length) {
      err.textContent = `아직 비어 있어요: ${missing.join(', ')}`;
      err.hidden = false;
      return;
    }
    err.hidden = true;
    const code = await InviteCode.encode(toConfig(d));
    inviteUrl = `${base}invite.html?d=${code}`;
    editUrl = `${base}make.html?d=${code}`;
    $('outLink').value = inviteUrl;
    $('openLink').href = inviteUrl;
    $('done').hidden = false;
    $('done').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('copyLink').addEventListener('click', () => copy(inviteUrl, '초대장 링크를 복사했어요'));
  $('copyEdit').addEventListener('click', () => copy(editUrl, '수정용 링크를 복사했어요'));
  $('shareLink').addEventListener('click', async () => {
    const d = readForm();
    const names = K.people.length > 1 && d.bride.name
      ? `${d.groom.short || d.groom.name} ♥ ${d.bride.short || d.bride.name}` : (d.groom.short || d.groom.name);
    const title = InviteKinds.fill(K.pageTitle, { names, title: d.title || names });
    if (navigator.share) { try { await navigator.share({ title, text: '게임을 깨면 초대장이 열려요', url: inviteUrl }); return; } catch (e) { /* 취소 */ } }
    copy(inviteUrl, '초대장 링크를 복사했어요');
  });

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* 무시 */ }
      ta.remove();
    }
    toast(msg);
  }
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }

  // ── 시작: make.html?d=<코드>(수정용 링크) → 이 기기의 임시 저장 → make.html?k=<종류>
  const params = new URLSearchParams(location.search);
  let loaded = null;
  if (params.get('d')) {
    try { loaded = fromConfig(await InviteCode.decode(params.get('d'))); } catch (e) { toast('수정용 링크를 읽지 못했어요'); }
  }
  if (!loaded) {
    try { loaded = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { /* 없음 */ }
    const askKind = params.get('k');
    if (KINDS[askKind] && (!loaded || loaded.kind !== askKind)) {
      // 쓰던 내용(이름·날짜 등)은 두고 종류만 바꾼다. 예시 인사말·캐릭터는 새 종류 것으로
      const g = loaded && loaded.greeting;
      const custom = g && !Object.values(KINDS).some(x => x.greetings.includes(g));
      loaded = Object.assign({}, loaded, { kind: askKind, looks: null, greeting: custom ? g : '' });
    }
  }
  pickOpen = !(params.get('k') || params.get('d'));
  const startKind = loaded && KINDS[loaded.kind] ? loaded.kind : 'wedding';
  if (loaded) applyDraft(loaded);
  K = null; // 처음 한 번은 종류 기본값을 채우도록
  setKind(startKind, { keepLooks: !!(loaded && loaded.looks), keepGreeting: !!(loaded && loaded.greeting) });
  requestAnimationFrame(frame);
})();
