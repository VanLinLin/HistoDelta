// Change-map explorer. Data: static/data/pairs.json (tools/export_interactive.py). Feature space only; images are real sections.
// mount(root, {auto}) builds one instance; the hero uses auto mode (sweep + pair cycling until the reader interacts).
(function () {
  const N = 14, TOPK = 20;
  const NAMES = { histodelta: 'HistoDelta', sd15: 'SD1.5-ControlNet', cekworld: 'CEKWorld 3D ft' };
  const LAYERS = [['none', 'None'], ['true', 'True change'], ['histodelta', 'HistoDelta'], ['sd15', 'SD1.5-ControlNet'], ['cekworld', 'CEKWorld 3D ft']];
  const VIR = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
  const dataP = fetch('static/data/pairs.json').then((r) => r.json());

  function vir(t) {
    t = Math.max(0, Math.min(1, t)) * (VIR.length - 1);
    const i = Math.min(VIR.length - 2, Math.floor(t)), f = t - i, a = VIR[i], b = VIR[i + 1];
    return a.map((v, k) => Math.round(v + (b[k] - v) * f));
  }
  const topk = (a) => a.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, TOPK).map((x) => x[1]);
  const near = (i, set) => set.some((j) => Math.abs(Math.floor(j / N) - Math.floor(i / N)) <= 1 && Math.abs((j % N) - (i % N)) <= 1);
  const fmt = (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);

  function mount(root, opts) {
    const q = (s) => root.querySelector(s);
    const viewer = q('.viewer'), clip = q('.clip'), divider = q('.divider'), cv = q('canvas'), ctx = cv.getContext('2d');
    const imgZ = q('.imgZ'), imgZ1 = q('.imgZ1'), seg = q('.layerSeg'), sel = q('.pairSel'), alpha = q('.alpha'), out = q('.readout'), badge = q('.badge');
    let data = null, pair = null, k = 0, layer = 'histodelta', picked = null, auto = !!opts.auto, timer = null;

    seg.innerHTML = LAYERS.map(([l, t]) => `<button data-l="${l}">${t}</button>`).join('');
    const values = () => (layer === 'none' ? null : layer === 'true' ? pair.true_change : pair.methods[layer].change);

    function draw() {
      const W = cv.width, s = W / N; ctx.clearRect(0, 0, W, W);
      const v = values();
      if (v) {
        const lo = Math.min(...v), hi = Math.max(...v), al = alpha ? alpha.value / 100 : 0.6;
        for (let i = 0; i < N * N; i++) {
          const [r, g, b] = vir((v[i] - lo) / (hi - lo || 1));
          ctx.fillStyle = `rgba(${r},${g},${b},${al})`; ctx.fillRect((i % N) * s, Math.floor(i / N) * s, s, s);
        }
        const tt = topk(pair.true_change); ctx.lineWidth = Math.max(2, W / 220);
        topk(v).forEach((i) => {
          const hit = layer === 'true' || near(i, tt);
          ctx.setLineDash(hit ? [] : [5, 4]); ctx.strokeStyle = layer === 'true' ? '#000' : hit ? '#fff' : '#e03131';
          ctx.strokeRect((i % N) * s + 2, Math.floor(i / N) * s + 2, s - 4, s - 4);
        });
        ctx.setLineDash([]);
      }
      if (picked !== null) { ctx.lineWidth = 3; ctx.strokeStyle = '#2457C5'; ctx.strokeRect((picked % N) * s + 1, Math.floor(picked / N) * s + 1, s - 2, s - 2); }
      [...seg.children].forEach((b) => b.classList.toggle('on', b.dataset.l === layer));
      if (badge) {
        const m = pair.methods[layer];
        badge.innerHTML = m ? `${NAMES[layer]} &middot; SS ${fmt(m.ss)} &middot; ${m.hits}/20 hits${pair.kind === 'random' ? ' *' : ''}` : layer === 'true' ? 'True change (20 largest outlined)' : 'Real H&amp;E only';
        badge.className = 'badge ' + (layer === 'histodelta' ? 'ours' : m ? 'gen' : '');
      }
      if (out) readout();
    }
    function readout() {
      const m = pair.methods;
      let h = '<table><tr><td>Pair skill score (SS)</td><td></td></tr>';
      for (const key of ['histodelta', 'sd15', 'cekworld'])
        h += `<tr><td class="${key === 'histodelta' ? 'ours' : 'gen'}">${NAMES[key]}</td><td>SS ${fmt(m[key].ss)} &middot; ${m[key].hits}/20 hits</td></tr>`;
      h += '</table>';
      if (pair.kind === 'random') h += '<div class="legend">Computed per pair; not in the paper\'s tables.</div>';
      if (picked !== null) {
        const e = (x) => (x * 1e3).toFixed(2);
        h += `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">Token (row ${Math.floor(picked / N) + 1}, col ${(picked % N) + 1}): squared feature error &times;10<sup>&minus;3</sup>`
          + `<table><tr><td>Copy</td><td>${e(pair.copy_error[picked])}</td></tr>`
          + ['histodelta', 'sd15', 'cekworld'].map((key) => `<tr><td class="${key === 'histodelta' ? 'ours' : 'gen'}">${NAMES[key]}</td><td>${e(m[key].error[picked])}</td></tr>`).join('')
          + '</table></div>';
      } else h += '<div style="margin-top:8px;color:var(--muted)">Click a token to compare its error.</div>';
      out.innerHTML = h;
    }
    function setSplit(x) { x = Math.max(0, Math.min(1, x)); clip.style.clipPath = `inset(0 ${(1 - x) * 100}% 0 0)`; divider.style.left = `calc(${x * 100}% - 1.5px)`; }
    function loadPair(i) {
      k = (i + data.pairs.length) % data.pairs.length; pair = data.pairs[k]; picked = null;
      imgZ.src = `static/data/${pair.id}_z.jpg`; imgZ1.src = `static/data/${pair.id}_z1.jpg`;
      if (sel) sel.value = k; draw();
    }
    function sweep() {  // divider glides across once: shows that both panels are real sections
      const t0 = performance.now(), D = 2400;
      (function f(t) { if (!auto) return; const u = Math.min(1, (t - t0) / D);
        setSplit(0.5 + 0.38 * Math.sin(u * 2 * Math.PI)); if (u < 1) requestAnimationFrame(f); })(t0);
    }
    function stopAuto() { auto = false; clearInterval(timer); }

    let dragging = false;
    const pos = (e) => { const r = viewer.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    divider.addEventListener('pointerdown', (e) => { stopAuto(); dragging = true; divider.setPointerCapture(e.pointerId); });
    divider.addEventListener('pointermove', (e) => { if (dragging) setSplit(pos(e)[0]); });
    divider.addEventListener('pointerup', () => { dragging = false; });
    viewer.addEventListener('click', (e) => {
      if (e.target === divider) return; stopAuto();
      const [x, y] = pos(e), i = Math.floor(y * N) * N + Math.floor(x * N); picked = picked === i ? null : i; draw();
    });
    if (alpha) alpha.addEventListener('input', draw);
    seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; stopAuto(); layer = b.dataset.l; draw(); });
    if (sel) sel.addEventListener('change', (e) => { stopAuto(); loadPair(+e.target.value); });
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { stopAuto(); loadPair(k + +b.dataset.step); }));

    dataP.then((d) => {
      data = opts.auto ? { pairs: d.pairs.filter((p) => p.kind === 'selected') } : d;
      if (!opts.auto) window.addEventListener('hd-load', (e) => { stopAuto(); loadPair(e.detail); });
      if (sel) sel.innerHTML = d.pairs.map((p, i) => `<option value="${i}">${p.kind === 'selected' ? 'Selected' : 'Random'} pair ${p.kind === 'selected' ? i + 1 : i + 1 - d.pairs.filter((x) => x.kind === 'selected').length}${p.fig8_row ? ' (Figure 8, row ' + p.fig8_row + ')' : ''}</option>`).join('');
      setSplit(0.5); loadPair(0);
      if (auto) { sweep(); timer = setInterval(() => { if (!auto) return; loadPair(k + 1); sweep(); }, 7000); }
    });
  }
  document.querySelectorAll('[data-explorer]').forEach((el) => mount(el, { auto: el.dataset.explorer === 'auto' }));
})();
