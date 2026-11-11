// 사진에서 얼굴을 찾아 동그랗게 오리기. 사진은 이 기기 안에서만 처리하고 어디에도 보내지 않는다.
// FaceCrop.open(file) → Promise<data URL | null>  (타원 모양으로 오린 얼굴, 바깥은 투명, 긴 쪽 72px)
'use strict';

(function () {
  const OUT = 72;                // 저장 크기(px)
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
  let detectorP = null;

  // 얼굴 찾기 도구는 처음 쓸 때 한 번만 받는다. 못 받으면 null(직접 맞추기로)
  function detector() {
    if (!detectorP) {
      detectorP = (async () => {
        const { FilesetResolver, FaceDetector } = await import(`${MP}/vision_bundle.mjs`);
        const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
        return FaceDetector.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'IMAGE' });
      })().catch(e => { console.warn('얼굴 찾기 도구를 못 받았어요', e); return null; });
    }
    return detectorP;
  }

  const loadImage = file => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });

  // 큰 사진은 줄여서 다룬다(빠르게)
  function shrink(img, max = 1200) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  async function findFace(canvas) {
    const det = await Promise.race([detector(), new Promise(r => setTimeout(() => r(null), 15000))]);
    if (!det) return null;
    try {
      const r = det.detect(canvas);
      const best = (r.detections || []).sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height)[0];
      if (!best) return null;
      const b = best.boundingBox;
      // 머리카락과 턱까지 들어가게 넓힌다
      const size = Math.max(b.width, b.height) * 1.75;
      return { cx: b.originX + b.width / 2, cy: b.originY + b.height / 2 - b.height * 0.12, size };
    } catch (e) { return null; }
  }

  // ── 맞추기 화면
  // 사진은 끌어서 옮기고 막대로 확대, 흰 타원 선(또는 동그란 손잡이)을 끌면 가로·세로 크기를 따로 바꾼다.
  function editor(src, start) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'fc-modal';
      wrap.innerHTML = `
        <div class="fc-box" role="dialog" aria-label="얼굴 맞추기">
          <p class="fc-title">얼굴만 흰 선 안에 들어오게 맞춰 주세요</p>
          <p class="fc-note" id="fcNote"></p>
          <canvas class="fc-canvas" width="560" height="560"></canvas>
          <p class="fc-tip">사진을 끌면 옮겨져요. 흰 선이나 동그란 손잡이를 끌면 가로·세로로 늘이고 줄일 수 있어요.</p>
          <label class="fc-zoom">사진 확대<input type="range" step="0.001"></label>
          <div class="choice">
            <button type="button" class="btn" data-act="cancel">취소</button>
            <button type="button" class="btn primary" data-act="ok">이 얼굴 쓰기</button>
          </div>
        </div>`;
      document.body.append(wrap);
      document.body.style.overflow = 'hidden';
      const cv = wrap.querySelector('canvas'), g = cv.getContext('2d');
      const zoom = wrap.querySelector('input');
      const V = cv.width, MIN_R = 40, MAX_R = V * 0.48, GRAB = 26;
      // 상태: 화면 가운데에 오는 사진 위치(cx, cy, 사진 픽셀), 배율 k(사진 → 화면), 타원 반지름 rx, ry(화면 픽셀)
      let { cx, cy } = start;
      let rx = V * 0.33, ry = V * 0.38;
      const minSide = Math.min(src.width, src.height);
      const kMin = (V * 0.6) / Math.max(src.width, src.height), kMax = (V * 0.9) / (minSide * 0.08);
      let k = (ry * 2) / start.size;
      zoom.min = Math.log(kMin); zoom.max = Math.log(kMax);
      const clampK = v => Math.max(kMin, Math.min(kMax, v));
      const clampR = v => Math.max(MIN_R, Math.min(MAX_R, v));
      const setZoom = () => { k = clampK(k); zoom.value = Math.log(k); };
      const draw = () => {
        g.fillStyle = '#222'; g.fillRect(0, 0, V, V);
        g.drawImage(src, V / 2 - cx * k, V / 2 - cy * k, src.width * k, src.height * k);
        g.save();
        g.fillStyle = 'rgba(0,0,0,.55)';
        g.beginPath(); g.rect(0, 0, V, V); g.ellipse(V / 2, V / 2, rx, ry, 0, 0, Math.PI * 2, true); g.fill('evenodd');
        g.strokeStyle = '#fff'; g.lineWidth = 4;
        g.beginPath(); g.ellipse(V / 2, V / 2, rx, ry, 0, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#fff'; g.strokeStyle = '#e8578a'; g.lineWidth = 3;
        [[rx, 0], [-rx, 0], [0, ry], [0, -ry]].forEach(([dx, dy]) => {
          g.beginPath(); g.arc(V / 2 + dx, V / 2 + dy, 11, 0, Math.PI * 2); g.fill(); g.stroke();
        });
        g.restore();
      };
      setZoom(); draw();
      let touched = false;
      zoom.addEventListener('input', () => { touched = true; k = Math.exp(+zoom.value); draw(); });
      // 화면 좌표(캔버스 픽셀)
      const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * V / r.width, y: (e.clientY - r.top) * V / r.height }; };
      // 흰 선 근처면 'x'(가로) 또는 'y'(세로), 아니면 null
      const edgeAt = p => {
        const dx = p.x - V / 2, dy = p.y - V / 2;
        const t = Math.atan2(dy / ry, dx / rx);
        const ex = rx * Math.cos(t), ey = ry * Math.sin(t);
        if (Math.hypot(dx - ex, dy - ey) > GRAB) return null;
        return Math.abs(Math.cos(t)) >= Math.abs(Math.sin(t)) ? 'x' : 'y';
      };
      let drag = null;
      cv.addEventListener('pointerdown', e => {
        touched = true;
        const p = pos(e);
        drag = { mode: edgeAt(p) || 'move', p, cx, cy };
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', e => {
        const p = pos(e);
        if (!drag) {
          const m = edgeAt(p);
          cv.style.cursor = m === 'x' ? 'ew-resize' : m === 'y' ? 'ns-resize' : 'grab';
          return;
        }
        if (drag.mode === 'x') rx = clampR(Math.abs(p.x - V / 2));
        else if (drag.mode === 'y') ry = clampR(Math.abs(p.y - V / 2));
        else {
          cx = drag.cx - (p.x - drag.p.x) / k;
          cy = drag.cy - (p.y - drag.p.y) / k;
        }
        draw();
      });
      const end = () => { drag = null; };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      // 자동으로 찾은 얼굴 위치로 옮기기(사용자가 아직 안 만졌을 때만)
      wrap.addEventListener('face', e => {
        if (touched) return;
        ({ cx, cy } = e.detail);
        k = (ry * 2) / e.detail.size;
        setZoom(); draw();
      });
      cv.addEventListener('wheel', e => { e.preventDefault(); touched = true; k *= e.deltaY > 0 ? 0.94 : 1.06; setZoom(); draw(); }, { passive: false });
      const close = val => { wrap.remove(); document.body.style.overflow = ''; resolve(val); };
      wrap.addEventListener('click', e => {
        const act = e.target.dataset && e.target.dataset.act;
        if (act === 'cancel') close(null);
        if (act === 'ok') {
          // 타원 안쪽만 남기고 바깥은 투명하게. 긴 쪽이 OUT 픽셀
          const w = (rx * 2) / k, h = (ry * 2) / k;
          const s = OUT / Math.max(w, h);
          const o = document.createElement('canvas');
          o.width = Math.max(8, Math.round(w * s));
          o.height = Math.max(8, Math.round(h * s));
          const og = o.getContext('2d');
          og.imageSmoothingQuality = 'high';
          og.beginPath(); og.ellipse(o.width / 2, o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2); og.clip();
          og.drawImage(src, cx - w / 2, cy - h / 2, w, h, 0, 0, o.width, o.height);
          let url = o.toDataURL('image/webp', 0.8);
          if (!url.startsWith('data:image/webp')) url = o.toDataURL('image/png');
          close(url);
        }
      });
      wrap.note = wrap.querySelector('#fcNote');
      editor.current = wrap;
    });
  }

  async function open(file) {
    let img;
    try { img = await loadImage(file); } catch (e) { alert('사진을 열지 못했어요. 다른 사진으로 해 주세요.'); return null; }
    const src = shrink(img);
    URL.revokeObjectURL(img.src);
    const minSide = Math.min(src.width, src.height);
    const guess = { cx: src.width / 2, cy: src.height * 0.42, size: minSide * 0.6 };
    const p = editor(src, guess);
    const note = editor.current.note;
    note.textContent = '얼굴을 찾고 있어요…';
    findFace(src).then(f => {
      if (!document.body.contains(editor.current)) return;
      if (f) {
        note.textContent = '얼굴을 찾았어요. 흰 선을 끌어서 얼굴에 딱 맞게 줄여 보세요.';
        editor.current.dispatchEvent(new CustomEvent('face', { detail: f }));
      } else {
        note.textContent = '얼굴을 자동으로 못 찾았어요. 사진을 끌어서 옮기고 흰 선으로 크기를 맞춰 주세요.';
      }
    });
    return p;
  }

  window.FaceCrop = { open, detector };
})();
