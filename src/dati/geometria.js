/* =====================================================================
   GEOMETRIA DELLE VIE, PER LE CERCHIE

   Le stesse operazioni di dati/cerchia.js (il cammino lungo vie con un
   nome, il capo di una via, la riva più vicina, dentro o fuori un
   poligono), ma con le strade e il fiume passati come argomento: così le
   usa anche la città del 1300, che ha un estratto OpenStreetMap suo
   (dati/osm-1300.js). La cerchia del 1216 resta com'è, con le sue copie.
   ===================================================================== */

export const vicino = (a, b, r = 1.5) => Math.hypot(a[0] - b[0], a[1] - b[1]) < r;
export const tondo = p => [+p[0].toFixed(1), +p[1].toFixed(1)];

/** Il punto più vicino di una spezzata (aperta) a p, con la distanza. */
export function piede(pts, p) {
  let best = { d: Infinity };
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / l2));
    const q = [ax + t * dx, az + t * dz], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < best.d) best = { d, q, k, t };
  }
  return best;
}

/** Il cammino più breve da «da» ad «a» lungo le vie con quei nomi (Dijkstra sui nodi di OSM). */
export function lungoLeVie(strade, nomi, da, a, tolleranza = 25) {
  const tratti = strade.filter(s => !s.area && nomi.includes(s.nome)).map(s => s.punti);
  const nodi = [], chiave = new Map();
  const nodo = p => { const k = Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2); if (!chiave.has(k)) { chiave.set(k, nodi.length); nodi.push({ p, arch: [] }); } return chiave.get(k); };
  for (const t of tratti) for (let k = 0; k + 1 < t.length; k++) {
    const i = nodo(t[k]), j = nodo(t[k + 1]), l = Math.hypot(t[k + 1][0] - t[k][0], t[k + 1][1] - t[k][1]);
    nodi[i].arch.push([j, l]); nodi[j].arch.push([i, l]);
  }
  if (!nodi.length) return null;
  const piu = q => nodi.reduce((m, n, i) => Math.hypot(n.p[0] - q[0], n.p[1] - q[1]) < Math.hypot(nodi[m].p[0] - q[0], nodi[m].p[1] - q[1]) ? i : m, 0);
  const s = piu(da), e = piu(a);
  if (Math.hypot(nodi[s].p[0] - da[0], nodi[s].p[1] - da[1]) > tolleranza || Math.hypot(nodi[e].p[0] - a[0], nodi[e].p[1] - a[1]) > tolleranza) return null;
  const dist = new Float64Array(nodi.length).fill(Infinity), prec = new Int32Array(nodi.length).fill(-1), fatto = new Uint8Array(nodi.length);
  dist[s] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < nodi.length; i++) if (!fatto[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === e) break;
    fatto[u] = 1;
    for (const [v, l] of nodi[u].arch) if (dist[u] + l < dist[v]) { dist[v] = dist[u] + l; prec[v] = u; }
  }
  if (dist[e] === Infinity) return null;
  const cammino = [];
  for (let u = e; u >= 0; u = prec[u]) cammino.unshift(nodi[u].p);
  return cammino;
}

/** Il nodo di una via più vicino a un punto (non solo i capi: le vie di OSM sono spezzate in tratti). */
export function sullaVia(strade, nome, verso) {
  let best = null;
  for (const s of strade) if (s.nome === nome && !s.area) for (const p of s.punti)
    if (!best || Math.hypot(p[0] - verso[0], p[1] - verso[1]) < Math.hypot(best[0] - verso[0], best[1] - verso[1])) best = p;
  return best;
}

/** Il punto della riva (il contorno chiuso del fiume) più vicino a p. */
export const riva = (fiume, p) => piede(fiume.concat([fiume[0]]), p).q;

/**
 * Una linea fatta di tappe: { punto }, { vie, a } (lungo le vie fino ad a),
 * { tratto } (una spezzata già pronta, per esempio un muro che esiste ancora).
 * Dove le vie non portano da un capo all'altro si va dritti, e lo si dice.
 */
export function traccia(strade, tappe) {
  const out = [], avvisi = [];
  const metti = p => { if (!out.length || !vicino(out.at(-1), p, 0.3)) out.push(tondo(p)); };
  for (const t of tappe) {
    if (t.punto) { metti(t.punto); continue; }
    if (t.tratto) {
      // il verso giusto è quello che comincia più vicino all'ultimo punto
      const pts = out.length && Math.hypot(t.tratto.at(-1)[0] - out.at(-1)[0], t.tratto.at(-1)[1] - out.at(-1)[1]) < Math.hypot(t.tratto[0][0] - out.at(-1)[0], t.tratto[0][1] - out.at(-1)[1]) ? [...t.tratto].reverse() : t.tratto;
      pts.forEach(metti);
      continue;
    }
    const c = lungoLeVie(strade, t.vie, out.at(-1), t.a, t.tolleranza);
    if (!c) { avvisi.push(`nessun cammino per ${t.vie.join(', ')}: tratto dritto`); metti(t.a); continue; }
    c.forEach(metti);
  }
  return { punti: out, avvisi };
}

/** Dentro un poligono (regola pari-dispari). */
export function dentro(poligono, x, z) {
  let ok = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, zi] = poligono[i], [xj, zj] = poligono[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ok = !ok;
  }
  return ok;
}

/** Lunghezza di una spezzata. */
export const lunghezza = pts => pts.reduce((l, p, k) => k ? l + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0, 0);
