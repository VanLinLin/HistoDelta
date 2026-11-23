// Random-pair wall: 8 validation pairs drawn by a fixed rule (see the note under the wall). Real H&E of section z;
// hovering shows HistoDelta's forecast change (CONCH features), clicking opens the pair in the explorer.
(function () {
  const wall = document.querySelector('[data-gallery]'); if (!wall) return;
  const N = 14, VIR = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
  const vir = (t) => { t = Math.max(0, Math.min(1, t)) * 4; const i = Math.min(3, Math.floor(t)), f = t - i; return VIR[i].map((v, k) => Math.round(v + (VIR[i + 1][k] - v) * f)); };
  const fmt = (x) => (x >= 0 ? '+' : '\u2212') + Math.abs(x).toFixed(2);
  fetch('static/data/pairs.json').then((r) => r.json()).then((d) => {
    d.pairs.forEach((p, k) => {
      if (p.kind !== 'random') return;
      const m = p.methods, el = document.createElement('button'); el.className = 'gcard';
      el.innerHTML = `<div class="gimg"><img src="static/data/${p.id}_z.jpg" alt="Real H&amp;E, random validation pair"><canvas width="280" height="280"></canvas><span class="ghint">hover: HistoDelta change</span></div>`
        + `<div class="gtxt"><b>Random pair ${k - d.pairs.filter((q) => q.kind === 'selected').length + 1}</b><span class="ours">HistoDelta SS ${fmt(m.histodelta.ss)} &middot; ${m.histodelta.hits}/20</span>`
        + `<span class="gen">CEKWorld 3D ft SS ${fmt(m.cekworld.ss)} &middot; ${m.cekworld.hits}/20</span></div>`;
      const cv = el.querySelector('canvas'), ctx = cv.getContext('2d'), v = m.histodelta.change, lo = Math.min(...v), hi = Math.max(...v), s = cv.width / N;
      for (let i = 0; i < N * N; i++) { const [r, g, b] = vir((v[i] - lo) / (hi - lo || 1)); ctx.fillStyle = `rgba(${r},${g},${b},0.7)`; ctx.fillRect((i % N) * s, Math.floor(i / N) * s, s, s); }
      el.addEventListener('click', () => { window.dispatchEvent(new CustomEvent('hd-load', { detail: k })); document.getElementById('explore').scrollIntoView({ behavior: 'smooth' }); });
      wall.appendChild(el);
    });
  });
})();
