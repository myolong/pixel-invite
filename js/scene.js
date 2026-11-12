// 작은 미리보기 무대: 종류별 장면 + 기본 캐릭터 + 오프닝 문구를 캔버스에 계속 그린다.
// 여러 개를 한 페이지에 둘 수 있다(애니메이션 반복 하나로 모두 그림).
'use strict';

(function () {
  const scenes = [];
  let running = false;

  function mount(canvas, kindKey, opts = {}) {
    const K = InviteKinds.get(kindKey);
    const ctx = Stage.setupCanvas(canvas);
    const chars = K.people.map(p => PixelChars.makeCharacter(p.look));
    scenes.push({ canvas, ctx, K, chars, phase: scenes.length * 0.7, title: opts.title !== false });
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function loop(now) {
    const t = now / 1000;
    for (const s of scenes) {
      // 화면 밖이면 건너뛰기
      const r = s.canvas.getBoundingClientRect();
      if (s.drawn && (r.bottom < 0 || r.top > innerHeight)) continue;
      s.drawn = true;
      const tt = t + s.phase;
      Stage.setTheme(s.K.scene);
      Stage.drawVenue(s.ctx, tt * 3);
      const xs = s.chars.length > 1 ? Stage.PAIR_X : [80];
      const bob = Math.floor(tt * 2.5) % 2;
      const blink = tt % 3.2 < 0.15;
      s.chars.forEach((c, i) => Stage.drawSprite(s.ctx, blink ? c.happy : c.stand, xs[i], Stage.FLOOR_Y + 8 - (i === bob ? 1 : 0), Stage.CHAR_SCALE));
      // 게임 소품이 떨어지는 모습
      const prop = PixelChars.PROPS[s.K.game.good];
      const fall = (tt * 40) % 150;
      const px = 80 + Math.sin(tt * 1.3) * 30;
      s.ctx.drawImage(prop, Math.round(px - (prop.lw || prop.width)), Math.round(30 + fall), (prop.lw || prop.width) * 2, (prop.lh || prop.height) * 2);
      if (s.title) Stage.drawText(s.ctx, s.K.stage, 80, 42, s.K.stage.length > 9 ? 11 : 13, '#e0526e');
    }
    requestAnimationFrame(loop);
  }

  // 화면 크기가 바뀌면 캔버스가 지워지므로 모두 한 번씩 다시 그린다
  window.addEventListener('resize', () => scenes.forEach(s => { s.drawn = false; }));

  window.PixelScene = { mount };
})();
