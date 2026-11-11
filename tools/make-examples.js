// 예시 사진과 화면 캡처를 만든다(개발용).
//   python3 -m http.server 8765 (저장소 폴더에서) 를 켠 뒤: node tools/make-examples.js
// 결과: invites/examples/<종류>/p1~p6.png (예시 초대장 사진첩), assets/shots/<종류>-1~3.jpg (종류 페이지 캡처)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const URL = 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto(URL + 'index.html');
  await page.addScriptTag({ path: path.join(ROOT, 'tools/photo-gen.js') });
  const kinds = await page.evaluate(() => InviteKinds.ORDER);
  for (const k of kinds) {
    const dir = path.join(ROOT, 'invites/examples', k);
    fs.mkdirSync(dir, { recursive: true });
    const shots = await page.evaluate(kk => makePhotos(kk), k);
    shots.forEach((d, i) => fs.writeFileSync(path.join(dir, `p${i + 1}.png`), Buffer.from(d.split(',')[1], 'base64')));
  }
  // 화면 캡처: 휴대폰 크기
  const ctx = await b.newContext({ viewport: { width: 375, height: 700 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  fs.mkdirSync(path.join(ROOT, 'assets/shots'), { recursive: true });
  for (const k of kinds) {
    await p.goto(URL + 'index.html');
    const code = await p.evaluate(async kk => InviteCode.encode(InviteKinds.sampleConfig(kk)), k).catch(() => null)
      || await p.evaluate(async kk => { await new Promise(r => { const s = document.createElement('script'); s.src = 'js/invite-code.js'; s.onload = r; document.head.append(s); }); return InviteCode.encode(InviteKinds.sampleConfig(kk)); }, k);
    await p.goto(URL + 'invite.html?d=' + code);
    await p.waitForTimeout(3200);
    const out = n => ({ path: path.join(ROOT, `assets/shots/${k}-${n}.jpg`), type: 'jpeg', quality: 80 });
    await p.screenshot(out(1));
    await p.click('#playBtn');
    await p.waitForTimeout(4000);
    await p.screenshot(out(2));
    await p.click('#skipBtn');
    await p.waitForTimeout(800);
    await p.evaluate(() => document.getElementById('sampleBadge').remove());
    await p.screenshot(out(3));
    console.log('ok', k);
  }
  await b.close();
})();
