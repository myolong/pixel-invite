// 참석 여부(RSVP): Supabase의 함수 3개(supabase/rsvp.sql)를 부른다.
// URL·KEY가 비어 있으면 기능 전체가 꺼진다(초대장·만들기 화면에 안 보임).
'use strict';

(function () {
  // Supabase → Project Settings → API의 Project URL과 anon public 키(공개해도 되는 값)
  const URL_ = 'https://xgkrnbsprvgiaxagslnb.supabase.co';
  const KEY = 'sb_publishable_nb2xjb9FxWDjKISgs7giUQ_xYp85g_9';

  const enabled = !!(URL_ && KEY);
  const B62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randId = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => B62[b % 62]).join('');

  async function sha256hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }

  async function rpc(name, args) {
    const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!r.ok) throw new Error(`rpc ${name} ${r.status}`);
    return r.json();
  }

  // 이 기기 표시(같은 기기에서 다시 보내면 응답이 고쳐짐)
  function device() {
    let d = null;
    try { d = localStorage.getItem('pi-device'); } catch (e) { /* 없음 */ }
    if (!/^[A-Za-z0-9]{16}$/.test(d || '')) {
      d = randId(16);
      try { localStorage.setItem('pi-device', d); } catch (e) { /* 저장 안 돼도 이번엔 진행 */ }
    }
    return d;
  }

  const validId = id => /^[A-Za-z0-9]{12}$/.test(id || '');

  window.Rsvp = {
    enabled,
    validId,
    newId: () => randId(12),
    newKey: () => randId(24),
    register: async (id, key, pub) => rpc('rsvp_register', { p_id: id, p_hash: await sha256hex(key), p_pub: !!pub }),
    submit: (id, a) => rpc('rsvp_submit', { p_invite: id, p_device: device(), p_name: a.name, p_attend: a.attend, p_people: a.people, p_note: a.note || '' }),
    list: (id, key) => rpc('rsvp_list', { p_invite: id, p_key: key || null }),
  };
})();
