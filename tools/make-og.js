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
const DESC = '작은 게임을 깨면 열려요. 눌러서 열어 보세요!';

(async () => {
  // 1) 미리보기 그림
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(800);
  fs.mkdirSync(path.join(ROOT, 'assets/og'), { recursive: true });
  for (const k of Object.keys(TITLES)) {
    await p.evaluate(([k, title]) => {
      document.body.innerHTML = `
        <div id="og" style="width:1200px;height:630px;display:flex;background:#fff3f5;font-family:Galmuri11,sans-serif;color:#2a2033;overflow:hidden">
          <canvas style="width:494px;height:630px;display:block;border-right:6px solid #2a2033"></canvas>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 56px">
            <p style="margin:0 0 18px;font-size:30px;color:#e0526e">픽셀 초대장</p>
            <p style="margin:0;font-size:${title.length > 7 ? 64 : 76}px;font-weight:700;line-height:1.2">${title}</p>
            <p style="margin:34px 0 0;font-size:30px;line-height:1.5;color:#7a6d80">게임을 깨면 열리는<br>재밌는 초대장이 도착했어요</p>
            <p style="margin:40px 0 0;display:inline-block;align-self:flex-start;font-size:30px;padding:14px 26px;border:4px solid #2a2033;border-radius:16px;background:#e0526e;color:#fff;box-shadow:0 6px 0 #2a2033">눌러서 열기 ›</p>
          </div>
        </div>`;
      document.body.style.margin = '0';
      PixelScene.mount(document.querySelector('#og canvas'), k);
    }, [k, TITLES[k]]);
    await p.waitForTimeout(700);
    await p.locator('#og').screenshot({ path: path.join(ROOT, `assets/og/${k}.png`) });
  }
  await makeHomeOg(p, path.join(ROOT, 'assets/og/home.png'));
  await b.close();

  // 2) 종류별 입구 파일: invite.html과 같고 <head>의 제목·미리보기 정보만 다르다
  const src = fs.readFileSync(path.join(ROOT, 'invite.html'), 'utf8');
  for (const [k, title] of Object.entries(TITLES)) {
    const og = [
      `<title>${title} - 픽셀 초대장</title>`,
      `  <meta name="description" content="${DESC}">`,
      `  <meta property="og:type" content="website">`,
      `  <meta property="og:site_name" content="픽셀 초대장">`,
      `  <meta property="og:title" content="${title}">`,
      `  <meta property="og:description" content="${DESC}">`,
      `  <meta property="og:image" content="${SITE}assets/og/${k}.png">`,
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
