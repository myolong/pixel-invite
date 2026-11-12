// 카톡·문자 링크 미리보기 그림(1200×630)과 종류별 초대장 입구 파일(invite-<종류>.html)을 만든다.
// 저장소 폴더에서 python3 -m http.server 8765 를 켜고: node tools/make-og.js
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { makeHomeOg } = require('./og-home');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://myolong.github.io/pixel-invite/';
const TITLES = {
  wedding: '결혼식 청첩장', yearend: '연말 모임 초대장', newyear: '신년 모임 초대장', xmas: '크리스마스 파티 초대장',
  seollal: '설 연휴 모임 초대장', chuseok: '추석 모임 초대장', notice: '결혼 알림장', bungae: '번개 모임 초대장', gather: '모임 초대장',
  // 목록에서 빠졌지만 예전 링크용으로 남긴 종류
  bihon: '비혼식 초대장', ihon: '이혼식 초대장', babyshower: '베이비샤워 초대장', event: '기념 행사 초대장',
};
// 그림을 바꾸면 이 값을 올린다(카톡은 같은 그림 주소면 예전 그림을 계속 씀)
const OG_VER = '3';
const DESC = '작은 게임을 깨면 열려요. 눌러서 열어 보세요!';

(async () => {
  // 1) 미리보기 그림
  const px = process.env.HTTPS_PROXY || process.env.https_proxy;
  const b = await chromium.launch(px ? { proxy: { server: px, bypass: 'localhost' } } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(800);
  fs.mkdirSync(path.join(ROOT, 'assets/og'), { recursive: true });
  for (const k of Object.keys(TITLES)) {
    await p.evaluate(([k, title, gated]) => {
      // 제목을 두 줄로: 끝 낱말(초대장·청첩장·알림장)을 아랫줄로
      const cut = title.lastIndexOf(' ');
      const top = title.slice(0, cut), last = title.slice(cut + 1);
      const size = Math.min(140, Math.floor(900 / Math.max(top.length, last.length)));
      document.body.innerHTML = `
        <div id="og" style="position:relative;width:1200px;height:630px;font-family:Dongle,sans-serif;color:#2a2033;overflow:hidden;background:#ffd9e2">
          <div style="position:absolute;inset:0;background-image:radial-gradient(#f7a8bd 3px,transparent 3px);background-size:36px 36px"></div>
          <div style="position:absolute;left:56px;top:34px;width:420px;height:562px;background:#e0526e;border:8px solid #2a2033;border-radius:36px 36px 90px 36px;box-shadow:0 12px 0 #2a2033">
            <div style="margin:28px auto 0;width:340px;height:380px;background:#2a2033;border-radius:18px;padding:14px;box-sizing:border-box">
              <canvas style="width:312px;height:352px;display:block;border-radius:8px"></canvas>
            </div>
            <div style="position:absolute;left:44px;bottom:52px;width:84px;height:28px;background:#2a2033;border-radius:6px"></div>
            <div style="position:absolute;left:72px;bottom:24px;width:28px;height:84px;background:#2a2033;border-radius:6px"></div>
            <div style="position:absolute;right:46px;bottom:70px;width:50px;height:50px;background:#f5c542;border:6px solid #2a2033;border-radius:50%"></div>
            <div style="position:absolute;right:110px;bottom:34px;width:50px;height:50px;background:#f5c542;border:6px solid #2a2033;border-radius:50%"></div>
          </div>
          <div style="position:absolute;left:530px;right:40px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
            <p style="margin:0 0 20px;align-self:flex-start;font-size:60px;font-weight:700;line-height:1.1;padding:6px 24px 0;background:#2a2033;color:#fff;border-radius:12px">${last} 도착!</p>
            <p style="margin:0;font-size:${size}px;font-weight:700;line-height:0.95">${top}<br>${last}</p>
            <p style="margin:26px 0 0;font-size:70px;color:#e0526e;font-weight:700">${gated ? '게임을 깨면 열려요' : '게임 한 판 하고 열어요'}</p>
          </div>
        </div>`;
      document.body.style.margin = '0';
      PixelScene.mount(document.querySelector('#og canvas'), k);
    }, [k, TITLES[k], !['wedding', 'notice'].includes(k)]);
    await p.evaluate(t => document.fonts.load('700 80px Dongle', t), TITLES[k] + ' 도착! 게임을 깨면 열려요 한 판 하고');
    await p.waitForTimeout(700);
    await p.locator('#og').screenshot({ path: path.join(ROOT, `assets/og/${k}.png`) });
  }
  await makeHomeOg(p, path.join(ROOT, 'assets/og/home.png'));
  await b.close();

  // 2) 종류별 입구 파일: invite.html과 같고 <head>의 제목·미리보기 정보만 다르다
  const src = fs.readFileSync(path.join(ROOT, 'invite.html'), 'utf8');
  for (const [k, title] of Object.entries(TITLES)) {
    const og = [
      `<title>${title} - 게임초대장</title>`,
      `  <meta name="description" content="${DESC}">`,
      `  <meta property="og:type" content="website">`,
      `  <meta property="og:site_name" content="게임초대장">`,
      `  <meta property="og:title" content="${title}">`,
      `  <meta property="og:description" content="${DESC}">`,
      `  <meta property="og:image" content="${SITE}assets/og/${k}.png?v=${OG_VER}">`,
      `  <meta property="og:image:width" content="1200">`,
      `  <meta property="og:image:height" content="630">`,
      `  <meta name="twitter:card" content="summary_large_image">`,
    ].join('\n');
    const out = src
      .replace(/<title>[^<]*<\/title>\n\s*<meta name="description"[^>]*>/, og)
      .replace('<html lang="ko">', `<html lang="ko">\n<!-- tools/make-og.js가 invite.html로 만든 파일. 직접 고치지 말고 invite.html을 고친 뒤 다시 만드세요. -->`);
    if (out === src) throw new Error('head 교체 실패');
    fs.writeFileSync(path.join(ROOT, `invite-${k}.html`), out);
  }
  console.log('done');
})();
