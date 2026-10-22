/* =====================================================================
   IL CAMMINO

   «Tocca dove vuoi andare»: dal punto in cui sei a quello che hai
   toccato, a piedi, girando gli angoli. Il percorso si cerca sulla
   griglia (A*, celle di mezzo metro, otto direzioni) dentro un riquadro
   che comprende partenza e arrivo; poi si tolgono gli angoli inutili, così
   si cammina dritti finché la strada lo permette.
   ===================================================================== */

/** Si va dritti da a a b senza toccare muri? (un controllo ogni 25 cm) */
export function liberoTra(g, a, b) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.25));
  for (let i = 1; i <= n; i++) if (!g.percorribile(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)) return false;
  return true;
}

/** Il punto percorribile più vicino a p entro r metri, o null. */
export function vicinoPercorribile(g, p, r = 4) {
  if (g.percorribile(p[0], p[1])) return p;
  for (let d = 0.5; d <= r; d += 0.5) for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    const q = [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d];
    if (g.percorribile(q[0], q[1])) return q;
  }
  return null;
}

/**
 * Il percorso da «da» ad «a» ([x, z]), come lista di punti; null se non c'è
 * o se l'arrivo è troppo lontano (oltre «maxLato» metri di riquadro).
 */
export function trovaCammino(g, da, a, { margine = 40, maxLato = 560 } = {}) {
  const s0 = vicinoPercorribile(g, da, 2), e0 = vicinoPercorribile(g, a, 4);
  if (!s0 || !e0) return null;
  if (liberoTra(g, s0, e0)) return [s0, e0];
  const c = g.cella;
  const x0 = Math.min(s0[0], e0[0]) - margine, x1 = Math.max(s0[0], e0[0]) + margine;
  const z0 = Math.min(s0[1], e0[1]) - margine, z1 = Math.max(s0[1], e0[1]) + margine;
  if (x1 - x0 > maxLato || z1 - z0 > maxLato) return null;
  const i0 = g.i(x0), j0 = g.i(z0), W = g.i(x1) - i0 + 1, H = g.i(z1) - j0 + 1, N = W * H;
  const cx = i => g.min + (i0 + i + 0.5) * c, cz = j => g.min + (j0 + j + 0.5) * c;
  const stato = new Uint8Array(N);          // 0 da sapere, 1 si passa, 2 no
  const passa = k => {
    if (!stato[k]) stato[k] = g.percorribile(cx(k % W), cz((k / W) | 0)) ? 1 : 2;
    return stato[k] === 1;
  };
  const cella = p => (g.i(p[1]) - j0) * W + (g.i(p[0]) - i0);
  const s = cella(s0), e = cella(e0);
  const ei = e % W, ej = (e / W) | 0;
  const costo = new Float32Array(N).fill(Infinity), prec = new Int32Array(N).fill(-1), chiuso = new Uint8Array(N);
  const h = k => { const dx = Math.abs(k % W - ei), dz = Math.abs(((k / W) | 0) - ej); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
  // coda con priorità: un mucchio binario su due array
  const hk = [], hf = [];
  const metti = (k, f) => {
    let i = hk.length; hk.push(k); hf.push(f);
    while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= f) break; hk[i] = hk[p]; hf[i] = hf[p]; i = p; }
    hk[i] = k; hf[i] = f;
  };
  const togli = () => {
    const k = hk[0], uk = hk.pop(), uf = hf.pop();
    if (hk.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mf = uf;
        if (l < hk.length && hf[l] < mf) { m = l; mf = hf[l]; }
        if (r < hk.length && hf[r] < mf) { m = r; mf = hf[r]; }
        if (m === i) break;
        hk[i] = hk[m]; hf[i] = hf[m]; i = m;
      }
      hk[i] = uk; hf[i] = uf;
    }
    return k;
  };
  const VICINI = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  costo[s] = 0; metti(s, h(s));
  let trovato = false;
  while (hk.length) {
    const u = togli();
    if (u === e) { trovato = true; break; }
    if (chiuso[u]) continue;
    chiuso[u] = 1;
    const ui = u % W, uj = (u / W) | 0;
    for (const [di, dj, w] of VICINI) {
      const vi = ui + di, vj = uj + dj;
      if (vi < 0 || vj < 0 || vi >= W || vj >= H) continue;
      const v = vj * W + vi;
      if (chiuso[v] || !passa(v)) continue;
      // in diagonale non si tagliano gli spigoli
      if (di && dj && (!passa(uj * W + vi) || !passa(vj * W + ui))) continue;
      const nc = costo[u] + w;
      if (nc < costo[v]) { costo[v] = nc; prec[v] = u; metti(v, nc + h(v)); }
    }
  }
  if (!trovato) return null;
  const celle = [];
  for (let k = e; k >= 0; k = prec[k]) celle.unshift([cx(k % W), cz((k / W) | 0)]);
  celle[0] = s0; celle[celle.length - 1] = e0;
  // via gli angoli inutili: da ogni punto, il più lontano raggiungibile dritto
  const out = [celle[0]];
  let i = 0;
  while (i < celle.length - 1) {
    let j = Math.min(celle.length - 1, i + 1);
    for (let k = Math.min(celle.length - 1, i + 4); k < celle.length; k += 4) { if (liberoTra(g, celle[i], celle[k])) j = k; else break; }
    if (j < celle.length - 1 && liberoTra(g, celle[i], celle[celle.length - 1])) j = celle.length - 1;
    out.push(celle[j]); i = j;
  }
  return out;
}
