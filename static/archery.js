// Interactive Figure 2: one point per validation pair, copy at (0,0), the true next section at (1,0).
// Same data as the paper figure (static/data/archery.json, tools/export_archery.py). No per-point numbers are shown.
(function () {
  const root = document.querySelector('[data-archery]'); if (!root) return;
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), seg = root.querySelector('.methodSeg');
  const M = [['cek2d', 'CEKWorld 2D', '#8C4A12'], ['cek3d', 'CEKWorld 3D', '#C96B1E'], ['cek3dft', 'CEKWorld 3D ft', '#E69A55'],
             ['sd15', 'SD1.5-ControlNet', '#B8673E'], ['sw', 'HistoDelta', '#2457C5']];   // HistoDelta drawn last = on top
  const XL = [-0.2, 2.1], YL = [0, 3.0];
  let data = null, on = Object.fromEntries(M.map(([k]) => [k, true])), tm = 1e9, started = false;
  const STEP = 1500, DUR = 2200, TOTAL = STEP * (M.length - 1) + DUR;   // methods fly one after another, HistoDelta last
  const ease = (u) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

  seg.innerHTML = M.slice().reverse().map(([k, t, c]) => `<button class="on" data-k="${k}"><span class="dot" style="background:${c}"></span>${t}</button>`).join('');
  seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; on[b.dataset.k] = !on[b.dataset.k]; b.classList.toggle('on', on[b.dataset.k]); draw(); });

  function size() { const w = cv.clientWidth, r = window.devicePixelRatio || 1; cv.width = w * r; cv.height = w * 0.62 * r; cv.style.height = w * 0.62 + 'px'; draw(); }
  function draw() {
    const W = cv.width, H = cv.height, r = window.devicePixelRatio || 1, pl = 46 * r, pb = 40 * r, pt = 12 * r, pr = 12 * r;
    const X = (x) => pl + (x - XL[0]) / (XL[1] - XL[0]) * (W - pl - pr), Y = (y) => H - pb - (Math.min(y, YL[1]) - YL[0]) / (YL[1] - YL[0]) * (H - pb - pt);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#C9CEDA'; ctx.lineWidth = r; ctx.beginPath(); ctx.moveTo(pl, pt); ctx.lineTo(pl, H - pb); ctx.lineTo(W - pr, H - pb); ctx.stroke();
    ctx.fillStyle = '#5E6472'; ctx.font = `${12 * r}px Noto Sans, sans-serif`; ctx.textAlign = 'center';
    [0, 0.5, 1, 1.5, 2].forEach((t) => ctx.fillText(t, X(t), H - pb + 16 * r));
    ctx.textAlign = 'right'; [0, 1, 2, 3].forEach((t) => ctx.fillText(t, pl - 8 * r, Y(t) + 4 * r));
    ctx.textAlign = 'center'; ctx.fillText('progress toward the true next section', (pl + W - pr) / 2, H - 6 * r);
    ctx.save(); ctx.translate(14 * r, (pt + H - pb) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('error off its direction', 0, 0); ctx.restore();
    // dashed arc: points inside are closer to the true section than copy
    ctx.setLineDash([6 * r, 4 * r]); ctx.strokeStyle = '#555'; ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const th = Math.PI * i / 100, x = X(1 + Math.cos(th)), y = Y(Math.sin(th)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    if (data) {
      let flying = null;
      for (const [j, [k, t, c]] of M.entries()) {
        const e = ease((tm - j * STEP) / DUR); if (e <= 0) continue; if (e < 1) flying = [t, c, k];
        if (!on[k]) continue; const p = data[k], n = p.length / 2;
        ctx.strokeStyle = c; ctx.globalAlpha = 0.45; ctx.lineWidth = 0.8 * r;
        for (let i = 0; i < n; i += 50) { ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(p[2 * i] * e), Y(p[2 * i + 1] * e)); ctx.stroke(); }
        ctx.fillStyle = c; ctx.globalAlpha = 0.22;
        for (let i = 0; i < n; i++) ctx.fillRect(X(p[2 * i] * e) - r, Y(p[2 * i + 1] * e) - r, 2.2 * r, 2.2 * r);
      }
      ctx.globalAlpha = 1;
      const anim = tm < TOTAL; [...seg.children].forEach((b) => b.classList.toggle('dim', anim && (!flying || b.dataset.k !== flying[2])));
      if (flying) { ctx.font = `700 ${15 * r}px Figtree, sans-serif`; ctx.textAlign = 'right'; ctx.fillStyle = flying[1]; ctx.fillText(flying[0], W - pr - 6 * r, pt + 18 * r); }
    }
    ctx.fillStyle = '#8A8F9C'; ctx.beginPath(); ctx.arc(X(0), Y(0), 5 * r, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5 * r; ctx.beginPath(); ctx.arc(X(1), Y(0), 6 * r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(X(1), Y(0), 2 * r, 0, 7); ctx.fill();
    ctx.font = `600 ${12 * r}px Noto Sans, sans-serif`; ctx.textAlign = 'left';
    const lab = (t, x, y, c) => { ctx.lineWidth = 4 * r; ctx.strokeStyle = '#fff'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); };
    ctx.textAlign = 'right'; lab('copy', X(0) - 8 * r, Y(0) - 10 * r, '#5E6472'); ctx.textAlign = 'left'; lab('true next section', X(1) + 9 * r, Y(0) - 9 * r, '#000');
  }
  function play(force) { if (started && !force) return; started = true; const t0 = performance.now();
    (function f(t) { tm = t - t0; draw(); if (tm < TOTAL) requestAnimationFrame(f); })(t0); }
  const rb = root.querySelector('.replay'); if (rb) rb.addEventListener('click', () => play(true));

  fetch('static/data/archery.json').then((r) => r.json()).then((d) => {
    data = d; size();
    new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && play()), { threshold: 0.35 }).observe(cv);
  });
  window.addEventListener('resize', size); size();
})();
