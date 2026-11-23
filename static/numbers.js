// Numbers section (A), low-data slider (B), use-card demos (C), count-up and theme toggle (D).
// Every number below is copied from a table of the paper or its supplement; the source is named next to each block.
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const OURS = '#2457C5', GEN = '#B8673E', FEAT = '#8A93A6';
  const onView = (el, fn, th = 0.3) => { if (!el) return; const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold: th }); io.observe(el); };
  const sgn = (x, d) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

  // ---------- A1. Val SS, every method (Table 2, "Val (100%)" column) ----------
  const VAL = [ // name, SS, group
    ['Null (input-agnostic)', -2.49, 'ref'], ['CEKWorld 2D', -2.63, 'gen'], ['CEKWorld 3D', -2.46, 'gen'],
    ['SD1.5-ControlNet', -1.22, 'gen'], ['CEKWorld 3D fine-tuned on skin', -0.95, 'gen'],
    ['Copy', 0, 'ref'], ['Ridge (3×3 tokens)', 0.219, 'feat'], ['DINO-Foresight (CONCH port)', 0.304, 'feat'],
    ['Direct transformer', 0.326, 'feat'], ['HistoDelta w/o 3D pretraining', 0.310, 'feat'], ['HistoDelta', 0.310, 'ours']];
  const div = $('[data-diverge]');
  if (div) {
    const LO = -2.8, HI = 0.5, z = (-LO) / (HI - LO) * 100;
    div.innerHTML = VAL.map(([n, v, g]) => {
      const w = Math.abs(v) / (HI - LO) * 100, left = v < 0 ? z - w : z;
      const col = g === 'ours' ? OURS : g === 'gen' ? GEN : g === 'feat' ? FEAT : '#C4C8D2';
      return `<div class="drow ${g}"><span class="dname">${n}</span><span class="dtrack"><span class="dzero" style="left:${z}%"></span>`
        + `<span class="dbar" data-w="${w}" style="left:${left}%;width:0;background:${col};${v < 0 ? 'margin-left:' + w + '%' : ''}"></span>`
        + `<span class="dval" style="${v < 0 ? 'right:' + (100 - left + 1) + '%' : 'left:' + (z + w + 1) + '%'}">${v === 0 ? '0' : sgn(v, v > -0.5 && v < 0.5 ? 3 : 2)}</span></span></div>`;
    }).join('') + `<div class="daxis" style="padding-left:var(--dname)"><span style="left:${z}%">copy = 0</span><span style="left:0">← worse than copy</span><span style="right:0">better →</span></div>`;
    onView(div, () => $$('.dbar', div).forEach((b, i) => setTimeout(() => { b.style.width = b.dataset.w + '%'; b.style.marginLeft = '0'; }, 120 * i)));
  }

  // ---------- A2. ms per pair, batched (Supp. Table S9) ----------
  const MS = [['CEKWorld 2D / 3D', 270, 'gen'], ['SD1.5-ControlNet, CEKWorld 3D ft', 139, 'gen'], ['DINO-Foresight', 0.29, 'feat'],
    ['Direct transformer', 0.09, 'feat'], ['Ridge', 0.06, 'feat'], ['HistoDelta', 0.09, 'ours']];
  const tm = $('[data-time]');
  if (tm) {
    const L0 = Math.log10(0.03), L1 = Math.log10(500), pct = (v) => (Math.log10(v) - L0) / (L1 - L0) * 100;
    tm.innerHTML = MS.map(([n, v, g]) => `<div class="drow ${g}"><span class="dname">${n}</span><span class="dtrack">`
      + `<span class="dbar" data-w="${pct(v)}" style="left:0;width:0;background:${g === 'ours' ? OURS : g === 'gen' ? GEN : FEAT}"></span>`
      + `<span class="dval" style="left:${pct(v) + 1}%">${v >= 1 ? v : v.toFixed(2)} ms</span></span></div>`).join('')
      + `<div class="daxis" style="padding-left:var(--dname)">${[0.1, 1, 10, 100].map((t) => `<span style="left:${pct(t)}%">${t} ms</span>`).join('')}</div>`;
    onView(tm, () => $$('.dbar', tm).forEach((b, i) => setTimeout(() => { b.style.width = b.dataset.w + '%'; }, 120 * i)));
  }

  // ---------- B. Low-data slider (Supp. Table S5; Direct is validation-rescaled, all others raw, as in Figure 5) ----------
  const FR = ['1%', '2%', '5%', '10%', '20%'], NP = [4, 7, 18, 36, 73];
  const LD = [['Ridge', [0.192, 0.202, 0.211, 0.214, 0.215], FEAT, [4, 3]],
    ['Direct transformer (rescaled)', [0.222, 0.235, 0.264, 0.287, 0.299], '#3A3F4B', [7, 4]],
    ['HistoDelta w/o 3D pretraining', [0.129, 0.159, 0.224, 0.266, 0.282], '#8DB8F5', [2, 3]],
    ['HistoDelta', [0.229, 0.244, 0.262, 0.279, 0.287], OURS, []]];
  const ld = $('[data-lowdata]');
  if (ld) {
    const cv = $('canvas', ld), ctx = cv.getContext('2d'), sl = $('input', ld), out = $('.ldout', ld);
    let k = 0, grow = 0;
    function draw() {
      const r = window.devicePixelRatio || 1, W = cv.clientWidth * r, H = W * 0.58; cv.width = W; cv.height = H; cv.style.height = H / r + 'px';
      const pl = 44 * r, pr = 14 * r, pt = 12 * r, pb = 34 * r, Y0 = 0.10, Y1 = 0.31;
      const X = (i) => pl + i / 4 * (W - pl - pr), Y = (v) => H - pb - (v - Y0) / (Y1 - Y0) * (H - pb - pt);
      ctx.clearRect(0, 0, W, H); ctx.font = `${11 * r}px Noto Sans, sans-serif`; ctx.fillStyle = '#5E6472'; ctx.strokeStyle = '#E6E4DF'; ctx.lineWidth = r;
      for (let v = 0.10; v <= 0.301; v += 0.05) { ctx.beginPath(); ctx.moveTo(pl, Y(v)); ctx.lineTo(W - pr, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(v.toFixed(2), pl - 6 * r, Y(v) + 4 * r); }
      ctx.textAlign = 'center'; FR.forEach((f, i) => ctx.fillText(`${f} (${NP[i]})`, X(i), H - pb + 16 * r));
      ctx.fillText('training patients', (pl + W - pr) / 2, H - 4 * r);
      ctx.fillStyle = 'rgba(36,87,197,.08)'; ctx.fillRect(X(k) - 18 * r, pt, 36 * r, H - pb - pt);
      const upto = grow * 4;
      for (const [, v, c, dash] of LD) {
        ctx.strokeStyle = c; ctx.lineWidth = (c === OURS ? 3 : 2) * r; ctx.setLineDash(dash.map((d) => d * r)); ctx.beginPath();
        for (let i = 0; i <= Math.min(4, Math.ceil(upto)); i++) { const f = Math.min(1, upto - i + 1), xi = i === 0 ? 0 : i - 1 + f, vi = i === 0 ? v[0] : v[i - 1] + (v[i] - v[i - 1]) * f; i ? ctx.lineTo(X(xi), Y(vi)) : ctx.moveTo(X(0), Y(v[0])); }
        ctx.stroke(); ctx.setLineDash([]);
        if (upto >= k) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(k), Y(v[k]), 4.5 * r, 0, 7); ctx.fill(); }
      }
    }
    function readout() {
      const rows = LD.map(([n, v, c]) => [n, v[k], c]).sort((a, b) => b[1] - a[1]);
      const lead = rows[0][0] === 'HistoDelta';
      out.innerHTML = `<div class="ldhead ${lead ? 'ours' : ''}">${FR[k]} of the training patients (${NP[k]}): ${lead ? 'HistoDelta leads' : 'the rescaled direct transformer leads'}</div>`
        + rows.map(([n, v, c]) => `<div class="ldrow"><span class="dot" style="background:${c}"></span>${n}<b>${sgn(v, 3)}</b></div>`).join('')
        + `<div class="ldnote">${lead ? 'Scarce pairs: the residual on copy and 3D pretraining help most here.' : 'With more patients the advantage narrows; the paper reports this too.'}</div>`;
    }
    sl.addEventListener('input', () => { k = +sl.value; draw(); readout(); });
    window.addEventListener('resize', draw); draw(); readout();
    onView(ld, () => { const t0 = performance.now(); (function f(t) { grow = Math.min(1, (t - t0) / 1800); draw(); if (grow < 1) requestAnimationFrame(f); })(t0); });
  }

  // ---------- C. Use cards: small live demos ----------
  const VIR = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
  const vir = (t) => { t = Math.max(0, Math.min(1, t)) * 4; const i = Math.min(3, Math.floor(t)), f = t - i; return VIR[i].map((v, j) => Math.round(v + (VIR[i + 1][j] - v) * f)); };
  const cm = $('[data-demo="change"]');
  if (cm) fetch('static/data/pairs.json').then((r) => r.json()).then((d) => {
    const P = d.pairs.filter((p) => p.kind === 'selected'), img = $('img', cm), cv = $('canvas', cm), ctx = cv.getContext('2d'); let i = 0, t0 = 0;
    function paint(a) { const v = P[i].methods.histodelta.change, lo = Math.min(...v), hi = Math.max(...v), s = cv.width / 14; ctx.clearRect(0, 0, cv.width, cv.width);
      for (let j = 0; j < 196; j++) { const [r, g, b] = vir((v[j] - lo) / (hi - lo || 1)); ctx.fillStyle = `rgba(${r},${g},${b},${0.7 * a})`; ctx.fillRect((j % 14) * s, Math.floor(j / 14) * s, s, s); } }
    function loop(t) { if (!t0) t0 = t; const u = ((t - t0) % 4000) / 4000; if ((t - t0) % 4000 < 20 && t - t0 > 100) {}
      const a = u < 0.2 ? 0 : u < 0.45 ? (u - 0.2) / 0.25 : u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15; paint(a);
      const n = Math.floor((t - t0) / 4000) % P.length; if (n !== i) { i = n; img.src = `static/data/${P[i].id}_z.jpg`; }
      requestAnimationFrame(loop); }
    img.src = `static/data/${P[0].id}_z.jpg`; requestAnimationFrame(loop);
  });
  // Tumor card: AUROC x100 from Supp. Table S10 (count-up, no bars: the differences are small and bars would exaggerate them)
  // Deeper card: Supp. Table S8 Mean column, axis starts at copy = 0 so the gap is not stretched
  const dp = $('[data-demo="deeper"]');
  if (dp) {
    const cv = $('canvas', dp), ctx = cv.getContext('2d'), S = [['HistoDelta', [0.355, 0.360, 0.361], OURS], ['Ridge', [0.324, 0.338, 0.343], FEAT], ['Copy', [0, 0, 0], '#C4C8D2']];
    function draw(g) { const r = window.devicePixelRatio || 1, W = cv.clientWidth * r, H = W * 0.62; cv.width = W; cv.height = H; cv.style.height = H / r + 'px';
      const pl = 34 * r, pr = 10 * r, pt = 10 * r, pb = 24 * r, X = (i) => pl + i / 2 * (W - pl - pr), Y = (v) => H - pb - v / 0.4 * (H - pb - pt);
      ctx.font = `${10.5 * r}px Noto Sans, sans-serif`; ctx.fillStyle = '#5E6472'; ctx.textAlign = 'right'; [0, 0.2, 0.4].forEach((v) => ctx.fillText(v.toFixed(1), pl - 5 * r, Y(v) + 4 * r));
      ctx.textAlign = 'center'; ['100 µm', '200 µm', '300 µm'].forEach((t, i) => ctx.fillText(t, X(i), H - 6 * r));
      for (const [n, v, c] of S) { ctx.strokeStyle = c; ctx.lineWidth = (n === 'HistoDelta' ? 3 : 2) * r; ctx.beginPath(); const e = g * 2;
        for (let i = 0; i <= Math.min(2, Math.ceil(e)); i++) { const f = Math.min(1, e - i + 1), xi = i ? i - 1 + f : 0, vi = i ? v[i - 1] + (v[i] - v[i - 1]) * f : v[0]; i ? ctx.lineTo(X(xi), Y(vi)) : ctx.moveTo(X(0), Y(v[0])); }
        ctx.stroke(); if (g >= 1) { ctx.fillStyle = c; ctx.textAlign = 'left'; ctx.fillText(n, X(0) + 4 * r, Y(v[0]) + (n === 'Ridge' ? 15 : -7) * r); } } }
    draw(0); onView(dp, () => { const t0 = performance.now(); (function f(t) { const g = Math.min(1, (t - t0) / 1600); draw(g); if (g < 1) requestAnimationFrame(f); })(t0); });
  }

  // ---------- D. Count-up for [data-count] numbers ----------
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, fin = el.innerHTML;
    onView(el, () => { const t0 = performance.now(); (function f(t) { const u = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - u, 3);
      el.textContent = (end * e).toFixed(dec); if (u < 1) requestAnimationFrame(f); else el.innerHTML = fin; })(t0); }, 0.6);
  });
  // Theme toggle (per-viewer convenience only)
  const tb = $('.themeBtn'), root = document.documentElement;
  const setT = (t) => { root.dataset.theme = t; if (tb) tb.textContent = t === 'dark' ? '☀' : '☾'; try { localStorage.setItem('hd-theme', t); } catch (e) {} };
  let saved = null; try { saved = localStorage.getItem('hd-theme'); } catch (e) {}
  setT(saved || 'light');
  if (tb) tb.addEventListener('click', () => setT(root.dataset.theme === 'dark' ? 'light' : 'dark'));
})();
