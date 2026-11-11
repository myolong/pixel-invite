// 사진에서 얼굴을 찾아 동그랗게 오리기. 사진은 이 기기 안에서만 처리하고 어디에도 보내지 않는다.
// FaceCrop.open(file) → Promise<data URL | null>  (64×64 정사각형, 원 모양 자르기는 그릴 때 함)
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

  // ── 맞추기 화면(끌어서 옮기기, 막대로 크기)
  function editor(src, start) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'fc-modal';
      wrap.innerHTML = `
        <div class="fc-box" role="dialog" aria-label="얼굴 맞추기">
          <p class="fc-title">얼굴을 동그라미 안에 맞춰 주세요</p>
          <p class="fc-note" id="fcNote"></p>
          <canvas class="fc-canvas" width="560" height="560"></canvas>
          <label class="fc-zoom">크기<input type="range" min="0.15" max="3" step="0.01"></label>
          <div class="choice">
            <button type="button" class="btn" data-act="cancel">취소</button>
            <button type="button" class="btn primary" data-act="ok">이 얼굴 쓰기</button>
          </div>
        </div>`;
      document.body.append(wrap);
      document.body.style.overflow = 'hidden';
      const cv = wrap.querySelector('canvas'), g = cv.getContext('2d');
      const zoom = wrap.querySelector('input');
      const V = cv.width, R = V * 0.36;          // 보이는 원 반지름
      // 상태: 사진 위의 원 중심(cx, cy)과 원 지름(size), 사진 픽셀 단위
      let { cx, cy, size } = start;
      const minSide = Math.min(src.width, src.height);
      zoom.min = (minSide * 0.08).toFixed(0);
      zoom.max = minSide.toFixed(0);
      zoom.step = 1;
      const setZoom = () => { zoom.value = (+zoom.max + +zoom.min - size).toFixed(0); };
      const draw = () => {
        const k = (R * 2) / size;               // 사진 → 화면 배율
        g.fillStyle = '#222'; g.fillRect(0, 0, V, V);
        g.drawImage(src, V / 2 - cx * k, V / 2 - cy * k, src.width * k, src.height * k);
        g.save();
        g.fillStyle = 'rgba(0,0,0,.55)';
        g.beginPath(); g.rect(0, 0, V, V); g.arc(V / 2, V / 2, R, 0, Math.PI * 2, true); g.fill('evenodd');
        g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(V / 2, V / 2, R, 0, Math.PI * 2); g.stroke();
        g.restore();
      };
      setZoom(); draw();
      zoom.addEventListener('input', () => { size = +zoom.max + +zoom.min - +zoom.value; draw(); });
      let drag = null;
      cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx, cy }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => {
        if (!drag) return;
        const rect = cv.getBoundingClientRect();
        const k = (R * 2) / size * (rect.width / V);
        cx = drag.cx - (e.clientX - drag.x) / k;
        cy = drag.cy - (e.clientY - drag.y) / k;
        draw();
      });
      cv.addEventListener('pointerup', () => { drag = null; });
      // 자동으로 찾은 얼굴 위치로 옮기기(사용자가 아직 안 움직였을 때만)
      let touched = false;
      cv.addEventListener('pointerdown', () => { touched = true; });
      zoom.addEventListener('input', () => { touched = true; });
      wrap.addEventListener('face', e => {
        if (touched) return;
        ({ cx, cy } = e.detail);
        size = Math.max(+zoom.min, Math.min(+zoom.max, e.detail.size));
        setZoom(); draw();
      });
      cv.addEventListener('wheel', e => { e.preventDefault(); size = Math.max(+zoom.min, Math.min(+zoom.max, size * (e.deltaY > 0 ? 1.06 : 0.94))); setZoom(); draw(); }, { passive: false });
      const close = val => { wrap.remove(); document.body.style.overflow = ''; resolve(val); };
      wrap.addEventListener('click', e => {
        const act = e.target.dataset && e.target.dataset.act;
        if (act === 'cancel') close(null);
        if (act === 'ok') {
          const o = document.createElement('canvas');
          o.width = o.height = OUT;
          const og = o.getContext('2d');
          og.imageSmoothingQuality = 'high';
          og.drawImage(src, cx - size / 2, cy - size / 2, size, size, 0, 0, OUT, OUT);
          let url = o.toDataURL('image/webp', 0.72);
          if (!url.startsWith('data:image/webp')) url = o.toDataURL('image/jpeg', 0.72);
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
        note.textContent = '얼굴을 찾았어요. 필요하면 끌어서 옮기거나 크기를 바꾸세요.';
        editor.current.dispatchEvent(new CustomEvent('face', { detail: f }));
      } else {
        note.textContent = '얼굴을 자동으로 못 찾았어요. 끌어서 옮기고 막대로 크기를 맞춰 주세요.';
      }
    });
    return p;
  }

  window.FaceCrop = { open, detector };
})();
