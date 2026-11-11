// 청첩장 설정을 주소(링크) 한 줄로 바꾸고 되돌린다. 서버에 아무것도 저장하지 않는다.
// 형식: "z." + 압축(deflate-raw)한 JSON의 base64url, 압축을 못 쓰는 기기는 "j." + JSON의 base64url
'use strict';

(function () {
  const toB64 = bytes => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const fromB64 = str => {
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  };
  const pipe = async (bytes, stream) =>
    new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

  async function encode(obj) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (canZip) {
      try { return 'z.' + toB64(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) { /* 아래로 */ }
    }
    return 'j.' + toB64(raw);
  }

  async function decode(code) {
    const kind = code.slice(0, 2), body = code.slice(2);
    let bytes = fromB64(body);
    if (kind === 'z.') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (kind !== 'j.') throw new Error('알 수 없는 형식');
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  window.InviteCode = { encode, decode };
})();
