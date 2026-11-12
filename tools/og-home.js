// 사이트 첫 화면·종류 안내·만들기 페이지를 카톡에 공유할 때 나오는 미리보기 그림(assets/og/home.png, 1200×630).
// tools/make-og.js가 함께 부른다.
'use strict';

async function makeHomeOg(p, file) {
  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const card = (k, rot, top, left, z) => `
      <div style="position:absolute;top:${top}px;left:${left}px;z-index:${z};transform:rotate(${rot}deg);background:#fff;border:5px solid #2a2033;border-radius:22px;padding:12px 12px 16px;box-shadow:0 10px 0 #2a2033">
        <canvas data-k="${k}" style="width:224px;height:286px;display:block;border-radius:10px"></canvas>
      </div>`;
    document.body.innerHTML = `
      <div id="og" style="position:relative;width:1200px;height:630px;background:#fff3f5;font-family:sans-serif;color:#2a2033;overflow:hidden">
        <div style="position:absolute;inset:0;background-image:radial-gradient(#f7c6d9 2px,transparent 2px);background-size:28px 28px;opacity:.7"></div>
        <div style="position:absolute;top:0;left:0;width:620px;height:630px;display:flex;flex-direction:column;justify-content:center;padding-left:64px">
          <p style="margin:0 0 22px;align-self:flex-start;font-family:Dongle;font-weight:700;font-size:42px;line-height:1.1;padding:6px 20px 2px;border:3px solid #2a2033;border-radius:999px;background:#fff">🎮 픽셀 초대장</p>
          <p style="margin:0;font-family:Dongle;font-size:104px;font-weight:700;line-height:0.95">게임을 깨면<br><span style="color:#e0526e">열리는 초대장</span></p>
          <p style="margin:26px 0 0;font-size:28px;line-height:1.55;color:#7a6d80">송년회·신년회·크리스마스 파티<br>명절 모임·결혼식까지 1분이면 끝</p>
          <div style="margin-top:36px;display:flex;gap:14px;align-items:center">
            <span style="font-family:Dongle;font-weight:700;font-size:50px;line-height:1;padding:12px 28px 6px;border:4px solid #2a2033;border-radius:16px;background:#e0526e;color:#fff;box-shadow:0 6px 0 #2a2033">무료로 만들기 ›</span>
            <span style="font-size:24px;color:#7a6d80">가입 없이</span>
          </div>
        </div>
        ${card('xmas', -9, 70, 632, 1)}
        ${card('wedding', 8, 92, 912, 2)}
        ${card('yearend', -1, 232, 772, 3)}
      </div>`;
    document.body.style.margin = '0';
    document.querySelectorAll('#og canvas').forEach(c => PixelScene.mount(c, c.dataset.k));
  });
  await p.evaluate(() => document.fonts.load('700 80px Dongle', '픽셀 초대장 게임을 깨면 열리는 무료로 만들기'));
  await p.waitForTimeout(900);
  await p.locator('#og').screenshot({ path: file });
}

module.exports = { makeHomeOg };
