// 단톡방 정산기 (시안): 서버 저장 없이 브라우저에서 계산하고, 공유 링크(#d=...)에 내용을 담는다.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const won = (n) => Math.round(n).toLocaleString('ko-KR') + '원';

  // 예시 데이터(가짜 이름). 초대장에서 넘어오면 ?names=민준,서연,... 로 받는다.
  let state = {
    title: '연말 모임',
    people: ['민준', '서연', '지호', '하은', '도윤'],
    items: [
      { name: '1차 고깃집', amount: 186000, payer: 0, out: [] },
      { name: '술값', amount: 72000, payer: 0, out: [3] },
      { name: '2차 노래방', amount: 45000, payer: 1, out: [3, 4] },
    ],
    round: true,
    fee: { on: false, amount: 0, by: 0, out: [] },
  };

  const qs = new URLSearchParams(location.search);
  const view = location.hash.startsWith('#d=');
  if (view) {
    try { state = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3))))); } catch (e) { /* 예시 유지 */ }
    document.body.classList.add('view');
  } else if (qs.get('names') || qs.get('t')) {
    state.people = (qs.get('names') || '').split(',').map((s) => s.trim().slice(0, 8)).filter(Boolean).slice(0, 30);
    state.title = (qs.get('t') || '모임').slice(0, 30);
    state.items = [{ name: '1차', amount: 0, payer: 0, out: [] }];
    // 초대장에서 "회비 먼저 걷기"였으면 1인 회비와 받은 사람(계좌 예금주)을 넘겨받는다
    const feeAmt = Number((qs.get('fee') || '').replace(/[^0-9]/g, '')) || 0;
    if (feeAmt) {
      const by = (qs.get('feeby') || '').trim().slice(0, 8);
      let bi = by ? state.people.indexOf(by) : -1;
      if (by && bi < 0) { state.people.unshift(by); bi = 0; }
      state.fee = { on: true, amount: feeAmt, by: Math.max(bi, 0), out: [] };
      state.items[0].payer = Math.max(bi, 0);
    }
    $('sample').hidden = true;
  }
  if (!state.fee) state.fee = { on: false, amount: 0, by: 0, out: [] };
  if (!view) {
    $('fromInvite').hidden = !qs.get('names');
    $('fromInvite').textContent = `초대장 참석자 ${state.people.length}명을 불러왔어요. 안 온 사람은 ✕로 빼세요.`;
    $('title').value = state.title;
  }

  function calc() {
    const n = state.people.length;
    const owe = new Array(n).fill(0), paid = new Array(n).fill(0);
    let total = 0;
    state.items.forEach((it) => {
      const amt = Number(it.amount) || 0;
      if (!amt) return;
      total += amt;
      if (it.payer >= 0 && it.payer < n) paid[it.payer] += amt;
      const ins = state.people.map((_, i) => i).filter((i) => !it.out.includes(i));
      if (!ins.length) return;
      ins.forEach((i) => { owe[i] += amt / ins.length; });
    });
    // 미리 걷은 회비: 낸 사람은 그만큼 낸 것으로, 받은 사람(총무)은 걷은 돈을 갖고 있는 것으로 본다
    const F = state.fee, feeIn = new Array(n).fill(0);
    let feeTotal = 0;
    if (F.on && F.amount > 0 && n) {
      const payers = state.people.map((_, i) => i).filter((i) => !F.out.includes(i));
      payers.forEach((i) => { feeIn[i] += F.amount; });
      feeTotal = F.amount * payers.length;
    }
    const held = new Array(n).fill(0);
    if (feeTotal && F.by >= 0 && F.by < n) held[F.by] = feeTotal;
    let bal = owe.map((o, i) => paid[i] + feeIn[i] - held[i] - o); // +면 받을 돈
    if (state.round) {
      // 보낼 돈은 100원 단위 올림, 받을 돈은 내림. 남는 차이는 가장 많이 받는 사람 몫으로 맞춘다
      bal = bal.map((b) => (b > 0.5 ? Math.floor(b / 100) * 100 : b < -0.5 ? -Math.ceil(-b / 100) * 100 : 0));
      const diff = -bal.reduce((x, y) => x + y, 0);
      let top = -1;
      bal.forEach((b, i) => { if (b > 0 && (top < 0 || b > bal[top])) top = i; });
      if (top >= 0) bal[top] += diff;
    }
    // 큰 빚부터 큰 받을 돈에 맞추는 방식(보내는 횟수 줄이기)
    const cred = [], debt = [];
    bal.forEach((b, i) => { if (b > 0.5) cred.push([i, b]); else if (b < -0.5) debt.push([i, -b]); });
    cred.sort((a, b) => b[1] - a[1]); debt.sort((a, b) => b[1] - a[1]);
    const tr = [];
    let ci = 0, di = 0;
    while (ci < cred.length && di < debt.length) {
      const m = Math.min(cred[ci][1], debt[di][1]);
      if (m >= 1) tr.push({ from: debt[di][0], to: cred[ci][0], amt: m });
      cred[ci][1] -= m; debt[di][1] -= m;
      if (cred[ci][1] < 1) ci++;
      if (debt[di][1] < 1) di++;
    }
    return { total, owe, paid, feeIn, feeTotal, tr };
  }

  function renderFee() {
    const F = state.fee;
    $('feeOn').checked = F.on;
    $('feeRow').hidden = !F.on;
    $('feeAmt').value = F.amount ? F.amount.toLocaleString('ko-KR') : '';
    $('feeBy').innerHTML = state.people.map((p, i) => `<option value="${i}"${i === F.by ? ' selected' : ''}>${esc(p)}</option>`).join('');
    $('feeWho').innerHTML = state.people.map((p, i) => `<button type="button" class="chip${F.out.includes(i) ? '' : ' on'}" data-ftog="${i}">${esc(p)}</button>`).join('');
    const cnt = state.people.length - F.out.filter((i) => i < state.people.length).length;
    $('feeNote').textContent = F.amount ? `${cnt}명 × ${won(F.amount)} = ${won(F.amount * cnt)} 걷음` : '1인 회비를 적어 주세요';
  }

  function renderEditor() {
    renderFee();
    $('people').innerHTML = state.people.map((p, i) => `<span class="person">${esc(p)}<button type="button" data-delp="${i}" aria-label="${esc(p)} 빼기">✕</button></span>`).join('');
    $('items').innerHTML = state.items.map((it, k) => {
      const outNames = it.out.map((i) => state.people[i]).filter(Boolean);
      const ins = state.people.length - outNames.length;
      return `<div class="item" data-k="${k}">
        <div class="item-top">
          <input data-f="name" value="${esc(it.name)}" aria-label="항목 이름">
          <input class="amt" data-f="amount" inputmode="numeric" value="${it.amount ? Number(it.amount).toLocaleString('ko-KR') : ''}" placeholder="금액" aria-label="금액">
          <button class="del" type="button" data-deli="${k}" aria-label="항목 지우기">✕</button>
        </div>
        <div class="payer">낸 사람 <select data-f="payer">${state.people.map((p, i) => `<option value="${i}"${i === it.payer ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></div>
        <div class="who-in">${state.people.map((p, i) => `<button type="button" class="chip${it.out.includes(i) ? '' : ' on'}" data-tog="${i}">${esc(p)}</button>`).join('')}</div>
        <p class="split-note">${ins}명이 나눠요${outNames.length ? ` · ${outNames.map(esc).join(', ')} 빠짐` : ''}${ins && it.amount ? ` · 1인 ${won(it.amount / ins)}` : ''}</p>
      </div>`;
    }).join('');
  }

  function renderResult() {
    const r = calc();
    $('total').textContent = won(r.total);
    const fs = $('feeSum');
    if (r.feeTotal) {
      const diff = r.total - r.feeTotal;
      fs.hidden = false;
      fs.innerHTML = `<span>걷은 회비 ${won(r.feeTotal)}</span><b>${diff > 0 ? `더 쓴 돈 ${won(diff)}` : diff < 0 ? `남은 회비 ${won(-diff)}` : '딱 맞아요'}</b>`;
    } else fs.hidden = true;
    $('transfers').innerHTML = r.tr.length
      ? r.tr.map((t) => `<li><span class="names"><b>${esc(state.people[t.from])}</b><span class="arrow">→</span><b>${esc(state.people[t.to])}</b></span><span></span><span class="money">${won(t.amt)}</span></li>`).join('')
      : '<li class="empty">보낼 돈이 없어요.</li>';
    const bd = breakdown();
    $('feeBd').hidden = !feeLine();
    $('feeBd').textContent = feeLine();
    $('breakdown').innerHTML = bd.length
      ? bd.map((b) => `<li><div class="bd-top"><b>${esc(b.name)}</b><span>${won(b.amt)}</span></div><small>${b.payer ? `${esc(b.payer)} 결제 · ` : ''}${b.ins}명이 1인 ${won(b.each)}${b.out.length ? ` · ${b.out.map(esc).join(', ')} 빠짐` : ''}</small></li>`).join('')
      : '<li class="empty">금액을 넣은 항목이 없어요.</li>';
    const F = state.fee;
    $('per').innerHTML = `<tr><th>이름</th><th>부담</th><th>${r.feeTotal ? '낸 돈(회비 포함)' : '낸 돈'}</th><th>주고받을 돈</th></tr>` +
      state.people.map((p, i) => {
        const pd = r.paid[i] + r.feeIn[i];
        const d = pd - (r.feeTotal && i === F.by ? r.feeTotal : 0) - r.owe[i];
        return `<tr><td>${esc(p)}</td><td>${won(r.owe[i])}</td><td>${pd ? won(pd) : '-'}</td><td class="${d > 0.5 ? 'plus' : d < -0.5 ? 'minus' : ''}">${d > 0.5 ? '+' + won(d) : d < -0.5 ? '-' + won(-d) : '0원'}</td></tr>`;
      }).join('');
    $('perNote').hidden = !r.feeTotal;
    if (r.feeTotal) $('perNote').textContent = `${state.people[F.by] || ''} 님의 주고받을 돈은 걷은 회비 ${won(r.feeTotal)}을 빼고 계산했어요.`;
    $('round100').checked = state.round;
    return r;
  }

  function render() { if (!view) renderEditor(); renderResult(); }

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 1800); }

  function shareUrl() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    return location.origin + location.pathname + '#d=' + data;
  }
  // 항목별 내역: 금액, 낸 사람, 나눈 사람 수, 1인 금액, 빠진 사람
  function feeLine() {
    const F = state.fee;
    if (!F.on || !F.amount) return '';
    const cnt = state.people.length - F.out.filter((i) => i < state.people.length).length;
    const out = F.out.map((i) => state.people[i]).filter(Boolean);
    return `미리 걷은 회비 1인 ${won(F.amount)} × ${cnt}명 = ${won(F.amount * cnt)}${state.people[F.by] ? ` (${state.people[F.by]} 받음)` : ''}${out.length ? ` · ${out.join(', ')} 안 냄` : ''}`;
  }
  function breakdown() {
    return state.items.filter((it) => Number(it.amount) > 0).map((it) => {
      const out = it.out.map((i) => state.people[i]).filter(Boolean);
      const ins = state.people.length - out.length;
      return { name: it.name || '항목', amt: Number(it.amount), payer: state.people[it.payer] || '', ins, each: ins ? it.amount / ins : 0, out };
    });
  }
  function resultText() {
    const r = calc();
    const lines = [`[${state.title} 정산] 총 ${won(r.total)}`];
    if (feeLine()) lines.push('', '■ 회비', feeLine());
    lines.push('', '■ 항목별 내역');
    breakdown().forEach((b) => {
      lines.push(`- ${b.name} ${won(b.amt)}${b.payer ? ` (${b.payer} 결제)` : ''} ÷ ${b.ins}명 = 1인 ${won(b.each)}${b.out.length ? ` · ${b.out.join(', ')} 빠짐` : ''}`);
    });
    lines.push('', '■ 보낼 돈');
    if (r.tr.length) r.tr.forEach((t) => lines.push(`${state.people[t.from]} → ${state.people[t.to]} ${won(t.amt)}`));
    else lines.push('보낼 돈이 없어요.');
    return lines.join('\n');
  }

  // 이벤트
  if (!view) {
    $('clearSample').addEventListener('click', () => {
      state = { title: '모임', people: [], items: [{ name: '1차', amount: 0, payer: 0, out: [] }], round: state.round, fee: { on: false, amount: 0, by: 0, out: [] } };
      $('sample').hidden = true; $('title').value = state.title; render(); $('personName').focus();
    });
    $('title').addEventListener('input', (e) => { state.title = e.target.value.trim().slice(0, 30) || '모임'; });
    $('addPerson').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('personName').value.trim();
      if (v) { state.people.push(v); $('personName').value = ''; render(); }
    });
    $('people').addEventListener('click', (e) => {
      const i = e.target.dataset.delp; if (i === undefined) return;
      const idx = Number(i);
      state.people.splice(idx, 1);
      state.items.forEach((it) => {
        it.out = it.out.filter((o) => o !== idx).map((o) => (o > idx ? o - 1 : o));
        if (it.payer === idx) it.payer = 0; else if (it.payer > idx) it.payer--;
      });
      const F = state.fee;
      F.out = F.out.filter((o) => o !== idx).map((o) => (o > idx ? o - 1 : o));
      if (F.by === idx) F.by = 0; else if (F.by > idx) F.by--;
      render();
    });
    $('items').addEventListener('click', (e) => {
      const box = e.target.closest('.item'); if (!box) return;
      const it = state.items[Number(box.dataset.k)];
      if (e.target.dataset.deli !== undefined) { state.items.splice(Number(box.dataset.k), 1); render(); return; }
      if (e.target.dataset.tog !== undefined) {
        const i = Number(e.target.dataset.tog);
        it.out = it.out.includes(i) ? it.out.filter((o) => o !== i) : it.out.concat(i);
        render();
      }
    });
    $('items').addEventListener('change', (e) => {
      const box = e.target.closest('.item'); if (!box) return;
      const it = state.items[Number(box.dataset.k)];
      const f = e.target.dataset.f;
      if (f === 'name') it.name = e.target.value;
      if (f === 'amount') it.amount = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
      if (f === 'payer') it.payer = Number(e.target.value);
      render();
    });
    $('addItem').addEventListener('click', () => { state.items.push({ name: '', amount: 0, payer: 0, out: [] }); render(); });
    document.querySelector('.quick').addEventListener('click', (e) => {
      const q = e.target.dataset.q; if (!q) return;
      state.items.push({ name: q, amount: 0, payer: 0, out: [] }); render();
    });
    $('feeOn').addEventListener('change', (e) => { state.fee.on = e.target.checked; render(); });
    $('feeAmt').addEventListener('change', (e) => { state.fee.amount = Number(e.target.value.replace(/[^0-9]/g, '')) || 0; render(); });
    $('feeBy').addEventListener('change', (e) => { state.fee.by = Number(e.target.value); render(); });
    $('feeWho').addEventListener('click', (e) => {
      const t = e.target.dataset.ftog; if (t === undefined) return;
      const i = Number(t), F = state.fee;
      F.out = F.out.includes(i) ? F.out.filter((o) => o !== i) : F.out.concat(i);
      render();
    });
    $('round100').addEventListener('change', (e) => { state.round = e.target.checked; renderResult(); });
    $('copyBtn').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(resultText()); toast('정산 결과를 복사했어요'); });
  }
  $('shareBtn').addEventListener('click', async () => {
    const url = shareUrl();
    if (navigator.share) { try { await navigator.share({ title: `${state.title} 정산`, text: resultText(), url }); return; } catch (e) { /* 취소 */ } }
    navigator.clipboard && navigator.clipboard.writeText(resultText() + '\n' + url);
    toast('정산 링크를 복사했어요. 단톡방에 붙여 넣으세요');
  });
  if (view) {
    $('shareBtn').textContent = '이 정산 다시 보내기';
    document.querySelector('.sp-intro h1').innerHTML = `${esc(state.title)} <span>정산</span>`;
    document.querySelector('.sp-intro p').textContent = '아래 금액대로 보내면 정산 끝이에요.';
    const a = document.createElement('a');
    a.className = 'make-cta view-cta'; a.href = 'split.html';
    a.innerHTML = '<b>우리 모임도 정산하기 ›</b><span>술 안 마신 사람 빼고 N빵, 무료로 1분이면 끝나요</span>';
    $('result').after(a);
  }
  render();
})();
