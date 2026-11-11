// 만들기 화면: 입력 → 캐릭터 꾸미기 → 청첩장 링크(invite.html?d=...) 만들기
'use strict';

(async function maker() {
  const $ = id => document.getElementById(id);
  const form = $('form');
  const DRAFT_KEY = 'pi-make-draft';
  let toastTimer;

  const GREETINGS = [
    '서로 다른 길을 걷던 두 사람이\n이제 같은 길을 함께 걸으려 합니다.\n\n귀한 걸음 하시어\n저희의 시작을 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.',
    '오랜 시간 서로의 곁을 지켜 온 두 사람이\n이제 한 가족이 되려 합니다.\n\n바쁘시더라도 오셔서\n따뜻한 마음으로 축하해 주세요.',
    '봄날의 햇살처럼 따뜻한 사람을 만나\n평생을 약속하려 합니다.\n\n소중한 분들을 모시고\n첫걸음을 내딛고 싶습니다.\n오셔서 자리를 빛내 주세요.',
    '저희 두 사람, 결혼합니다!\n\n게임 한 판 하시고\n예식장에서 웃으며 만나요.',
  ];
  let greetingIdx = 0;

  // ── 캐릭터 상태
  const looks = {
    groom: { outfit: 'tux', hair: 'short', skin: 0, hairColor: 0, color: 0, glasses: false },
    bride: { outfit: 'dress', hair: 'long', skin: 0, hairColor: 1, color: 0, veil: true },
  };
  let who = 'groom';
  let accounts = [];

  // ── 저장된 내용 불러오기: make.html?d=<링크 코드>(수정용 링크) → 이 기기의 임시 저장
  const editCode = new URLSearchParams(location.search).get('d');
  let loaded = null;
  if (editCode) {
    try { loaded = fromConfig(await InviteCode.decode(editCode)); } catch (e) { toast('수정용 링크를 읽지 못했어요'); }
  }
  if (!loaded) {
    try { loaded = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { /* 없음 */ }
  }
  if (loaded) applyDraft(loaded);
  else {
    form.greeting.value = GREETINGS[0];
    accounts = [{ side: '신랑 측', bank: '', number: '', holder: '' }, { side: '신부 측', bank: '', number: '', holder: '' }];
  }
  renderAccounts();

  // ── 미리보기
  const canvas = $('preview');
  const ctx = Stage.setupCanvas(canvas);
  let t = 0, last = performance.now();
  let sprites = {};
  const rebuild = () => { sprites = { groom: PixelChars.makeCharacter(looks.groom), bride: PixelChars.makeCharacter(looks.bride) }; };
  rebuild();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    Stage.drawVenue(ctx, t * 3);
    const blink = (t % 3.2) < 0.15;
    const bob = Math.floor(t * 2) % 2;
    Stage.drawSprite(ctx, blink ? sprites.groom.happy : sprites.groom.stand, 58, Stage.FLOOR_Y + 8 - (who === 'groom' ? bob : 0), 2);
    Stage.drawSprite(ctx, blink ? sprites.bride.happy : sprites.bride.stand, 102, Stage.FLOOR_Y + 8 - (who === 'bride' ? bob : 0), 2);
    // 지금 꾸미는 사람 위 화살표
    const ax = who === 'groom' ? 58 : 102;
    ctx.fillStyle = '#e0526e';
    for (let r = 0; r < 4; r++) ctx.fillRect(ax - 3 + r, 104 + r + bob, 7 - r * 2, 1);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── 꾸미기 패널
  const HAIR_NAMES = { short: '짧은 머리', bun: '올림머리', bob: '단발', long: '긴 머리' };
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
    group('머리 모양', Object.keys(HAIR_NAMES).map(k => ({ value: k, label: HAIR_NAMES[k] })), L.hair, v => { L.hair = v; });
    group('머리색', PixelChars.HAIR_COLORS.map((c, i) => ({ value: i, color: c })), L.hairColor, v => { L.hairColor = v; }, true);
    group('피부색', PixelChars.SKINS.map((c, i) => ({ value: i, color: c })), L.skin, v => { L.skin = v; }, true);
    group(L.outfit === 'dress' ? '드레스 색' : '턱시도 색',
      (L.outfit === 'dress' ? PixelChars.DRESS_COLORS : PixelChars.SUIT_COLORS).map((c, i) => ({ value: i, color: c })),
      L.color, v => { L.color = v; }, true);
    group('옷', [{ value: 'tux', label: '턱시도' }, { value: 'dress', label: '드레스' }], L.outfit, v => {
      if (L.outfit !== v) L.color = 0;
      L.outfit = v;
    });
    const extras = [{ value: true, label: '쓰기' }, { value: false, label: '안 쓰기' }];
    group('안경', extras, !!L.glasses, v => { L.glasses = v; });
    group('베일', extras, !!L.veil, v => { L.veil = v; });
  }
  document.querySelectorAll('.who').forEach(b => b.addEventListener('click', () => {
    who = b.dataset.who;
    document.querySelectorAll('.who').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    renderLook();
  }));
  renderLook();

  // ── 계좌
  function renderAccounts() {
    const box = $('accounts');
    box.innerHTML = '';
    accounts.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'acc';
      row.innerHTML = `
        <select aria-label="누구 쪽 계좌">
          ${['신랑 측', '신부 측'].map(s => `<option${s === a.side ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <input placeholder="은행" maxlength="12" aria-label="은행">
        <input placeholder="계좌번호" maxlength="30" inputmode="numeric" aria-label="계좌번호">
        <input placeholder="예금주" maxlength="12" aria-label="예금주">
        <button type="button" class="del" aria-label="이 계좌 지우기">✕</button>`;
      const [sel, bank, num, holder] = row.querySelectorAll('select, input');
      bank.value = a.bank; num.value = a.number; holder.value = a.holder;
      const sync = () => { a.side = sel.value; a.bank = bank.value; a.number = num.value; a.holder = holder.value; saveDraft(); };
      [sel, bank, num, holder].forEach(e => e.addEventListener('input', sync));
      row.querySelector('.del').addEventListener('click', () => { accounts.splice(i, 1); renderAccounts(); saveDraft(); });
      box.append(row);
    });
    $('addAccount').hidden = accounts.length >= 6;
  }
  $('addAccount').addEventListener('click', () => {
    accounts.push({ side: accounts.length % 2 ? '신부 측' : '신랑 측', bank: '', number: '', holder: '' });
    renderAccounts();
  });
  $('nextGreeting').addEventListener('click', () => {
    greetingIdx = (greetingIdx + 1) % GREETINGS.length;
    form.greeting.value = GREETINGS[greetingIdx];
    saveDraft();
  });

  // ── 임시 저장
  function readForm() {
    const v = n => (form.elements[n].value || '').trim();
    return {
      groom: { name: v('groom.name'), short: v('groom.short'), parents: v('groom.parents'), phone: v('groom.phone') },
      bride: { name: v('bride.name'), short: v('bride.short'), parents: v('bride.parents'), phone: v('bride.phone') },
      day: v('day'), time: v('time'),
      venue: { name: v('venue.name'), address: v('venue.address'), transit: v('venue.transit'), parking: v('venue.parking') },
      greeting: form.greeting.value.replace(/\r/g, '').trim(),
      accounts, looks,
    };
  }
  function applyDraft(d) {
    const set = (n, val) => { if (form.elements[n] && val != null) form.elements[n].value = val; };
    ['groom', 'bride'].forEach(k => ['name', 'short', 'parents', 'phone'].forEach(f => set(`${k}.${f}`, d[k] && d[k][f])));
    set('day', d.day); set('time', d.time);
    ['name', 'address', 'transit', 'parking'].forEach(f => set(`venue.${f}`, d.venue && d.venue[f]));
    set('greeting', d.greeting || GREETINGS[0]);
    if (Array.isArray(d.accounts)) accounts = d.accounts.map(a => ({ side: a.side || '신랑 측', bank: a.bank || '', number: a.number || '', holder: a.holder || '' }));
    if (d.looks) ['groom', 'bride'].forEach(k => Object.assign(looks[k], d.looks[k] || {}));
  }
  let saveTimer;
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(readForm())); } catch (e) { /* 저장 안 돼도 진행 */ } }, 300);
  }
  form.addEventListener('input', saveDraft);

  // 청첩장 설정(JSON) ↔ 입력 내용
  function toConfig(d) {
    const clean = o => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== '' && x != null));
    return {
      groom: clean({ ...d.groom, look: d.looks.groom }),
      bride: clean({ ...d.bride, look: d.looks.bride }),
      date: `${d.day}T${d.time}:00+09:00`,
      venue: clean(d.venue),
      greeting: d.greeting,
      accounts: d.accounts.filter(a => a.number.trim()).map(a => clean({ side: a.side, bank: a.bank.trim(), number: a.number.trim(), holder: a.holder.trim() })),
      game: 'bouquet',
    };
  }
  function fromConfig(c) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(c.date || '') || [];
    return {
      groom: c.groom, bride: c.bride, day: m[1], time: m[2], venue: c.venue,
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
    if (!d.groom.name) missing.push('신랑 이름');
    if (!d.bride.name) missing.push('신부 이름');
    if (!d.day) missing.push('날짜');
    if (!d.time) missing.push('시간');
    if (!d.venue.name) missing.push('예식장 이름');
    const err = $('err');
    if (missing.length) {
      err.textContent = `아직 비어 있어요: ${missing.join(', ')}`;
      err.hidden = false;
      const first = form.querySelector(':invalid');
      if (first) first.focus();
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
  $('copyLink').addEventListener('click', () => copy(inviteUrl, '청첩장 링크를 복사했어요'));
  $('copyEdit').addEventListener('click', () => copy(editUrl, '수정용 링크를 복사했어요'));
  $('shareLink').addEventListener('click', async () => {
    const d = readForm();
    const title = `${d.groom.short || d.groom.name} ♥ ${d.bride.short || d.bride.name} 결혼합니다`;
    if (navigator.share) { try { await navigator.share({ title, text: '게임을 깨면 청첩장이 열려요', url: inviteUrl }); return; } catch (e) { /* 취소 */ } }
    copy(inviteUrl, '청첩장 링크를 복사했어요');
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
})();
