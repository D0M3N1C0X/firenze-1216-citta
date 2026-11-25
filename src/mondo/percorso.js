/* =====================================================================
   IL PERCORSO A PIEDI TRA DUE PUNTI (la visita guidata dell'app, Unity)

   Un cammino minimo (A*) sulla griglia del suolo, a celle di 1,5 m per non
   pesare: costa poco camminare su strade, piazze e ponte, di più sui
   terreni aperti e sugli orti; case, monumenti, mura, fiume, siepi non si
   attraversano. Se un estremo sta dentro un edificio (una chiesa in cui si
   entra), il percorso arriva al punto calpestabile più vicino. Poi si tira
   il filo (si tolgono i punti che si vedono a vicenda) e si semplifica.
   ===================================================================== */
import { EDIFICIO, FIUME, LIBERO, MONUMENTO, ORTO, RECINTO } from './griglia.js';

const PASSO = 1.5;
const costo = v => v >= 100 || v === EDIFICIO || v === MONUMENTO || v === FIUME || v === RECINTO ? 0 : v === LIBERO ? 2.5 : v === ORTO ? 3 : 1;

/** Il cammino da a = [x, z] a b = [x, z]: una lista di punti [x, z], o null se non c'è. */
export function percorso(griglia, a, b, margine = 120) {
  const x0 = Math.min(a[0], b[0]) - margine, z0 = Math.min(a[1], b[1]) - margine;
  const nx = Math.ceil((Math.max(a[0], b[0]) + margine - x0) / PASSO), nz = Math.ceil((Math.max(a[1], b[1]) + margine - z0) / PASSO);
  const C = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) C[j * nx + i] = costo(griglia.get(x0 + (i + 0.5) * PASSO, z0 + (j + 0.5) * PASSO));
  const cella = p => [Math.max(0, Math.min(nx - 1, Math.floor((p[0] - x0) / PASSO))), Math.max(0, Math.min(nz - 1, Math.floor((p[1] - z0) / PASSO)))];
  // un estremo dentro un edificio: la cella calpestabile più vicina (a spirale)
  const vicina = ([i, j]) => {
    if (C[j * nx + i] > 0) return j * nx + i;
    for (let r = 1; r < 60; r++) {
      let best = -1, bd = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz || !C[jj * nx + ii]) continue;
        const d = di * di + dj * dj; if (d < bd) { bd = d; best = jj * nx + ii; }
      }
      if (best >= 0) return best;
    }
    return -1;
  };
  const s = vicina(cella(a)), t = vicina(cella(b));
  if (s < 0 || t < 0) return null;
  const ti = t % nx, tj = Math.floor(t / nx);
  const g = new Float32Array(nx * nz).fill(Infinity), da = new Int32Array(nx * nz).fill(-1), chiuso = new Uint8Array(nx * nz);
  // una coda con priorità (mucchio binario) di indici, ordinata per g + stima
  const heap = [], f = new Float32Array(nx * nz);
  const su = k => { while (k > 0) { const p = (k - 1) >> 1; if (f[heap[p]] <= f[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const giu = k => { for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l; if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } };
  const stima = k => Math.hypot(k % nx - ti, Math.floor(k / nx) - tj);
  g[s] = 0; f[s] = stima(s); heap.push(s);
  const V = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (heap.length) {
    const k = heap[0]; const ult = heap.pop(); if (heap.length) { heap[0] = ult; giu(0); }
    if (chiuso[k]) continue; chiuso[k] = 1;
    if (k === t) break;
    const i = k % nx, j = Math.floor(k / nx);
    for (const [di, dj, l] of V) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const kk = jj * nx + ii; if (!C[kk] || chiuso[kk]) continue;
      if (di && dj && (!C[j * nx + ii] || !C[jj * nx + i])) continue;          // niente diagonali tra due spigoli
      const ng = g[k] + l * (C[k] + C[kk]) / 2;
      if (ng < g[kk]) { g[kk] = ng; da[kk] = k; f[kk] = ng + stima(kk); heap.push(kk); su(heap.length - 1); }
    }
  }
  if (!chiuso[t]) return null;
  const celle = []; for (let k = t; k >= 0; k = da[k]) celle.push(k); celle.reverse();
  const p = celle.map(k => [x0 + (k % nx + 0.5) * PASSO, z0 + (Math.floor(k / nx) + 0.5) * PASSO]);
  // tirare il filo: da ogni punto si salta al più lontano che si vede su celle di strada (costo 1) o comunque calpestabili
  const vede = (u, w) => {
    const n = Math.ceil(Math.hypot(w[0] - u[0], w[1] - u[1]) / (PASSO / 2));
    let peggio = 1;
    for (let q = 0; q <= n; q++) {
      const x = u[0] + (w[0] - u[0]) * q / n, z = u[1] + (w[1] - u[1]) * q / n;
      const c = C[Math.min(nz - 1, Math.max(0, Math.floor((z - z0) / PASSO))) * nx + Math.min(nx - 1, Math.max(0, Math.floor((x - x0) / PASSO)))];
      if (!c) return false; peggio = Math.max(peggio, c);
    }
    return peggio <= 1 || peggio <= costo(griglia.get(u[0], u[1]));
  };
  const out = [p[0]];
  for (let k = 0; k < p.length - 1;) {
    let m = p.length - 1; while (m > k + 1 && !vede(p[k], p[m])) m--;
    out.push(p[m]); k = m;
  }
  return out.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
}

export const lunghezza = pts => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
