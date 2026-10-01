/* =====================================================================
   Caso e rumore, tutti con seme: la città deve uscire uguale a ogni
   apertura, altrimenti uno studente e il docente vedono due Firenze
   diverse e il registro delle verifiche non può riferirsi a niente.
   ===================================================================== */

/** Generatore mulberry32: veloce, con seme, sufficiente per la grafica. */
export function rng(seme = 1) {
  let a = seme >>> 0;
  const f = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.tra = (a, b) => a + (b - a) * f();
  f.intero = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.scegli = arr => arr[Math.floor(f() * arr.length)];
  f.vero = p => f() < p;
  return f;
}

/** Hash di due interi e un seme in [0, 1). */
export function hash2(ix, iy, seme = 0) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seme | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Per il rumore si usa una tabella precalcolata invece dell'hash: le
// texture chiamano il rumore decine di milioni di volte, e una lettura da
// tabella costa una frazione dell'aritmetica.
const T = 512, TM = T - 1;
const TAB = new Float32Array(T * T);
{ const r = rng(90210); for (let i = 0; i < TAB.length; i++) TAB[i] = r(); }
const tab = (ix, iy, seme) => TAB[((iy + seme * 97) & TM) * T + ((ix + seme * 53) & TM)];

const liscia = t => t * t * (3 - 2 * t);

/**
 * Rumore di valore periodico: con periodo p (in celle) si ripete senza
 * cuciture, che è ciò che serve a una texture da piastrellare.
 */
export function valore(x, y, p = 0, seme = 0) {
  let ix = Math.floor(x), iy = Math.floor(y);
  const fx = liscia(x - ix), fy = liscia(y - iy);
  let ix1 = ix + 1, iy1 = iy + 1;
  if (p) { ix = ((ix % p) + p) % p; iy = ((iy % p) + p) % p; ix1 = (ix + 1) % p; iy1 = (iy + 1) % p; }
  const a = tab(ix, iy, seme), b = tab(ix1, iy, seme), c = tab(ix, iy1, seme), d = tab(ix1, iy1, seme);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Somma di ottave (fBm) periodica. Restituisce circa [0, 1]. */
export function fbm(x, y, ottave = 5, p = 0, seme = 0, guadagno = 0.5) {
  let s = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < ottave; o++) {
    s += amp * valore(x * freq, y * freq, p ? p * freq : 0, seme + o * 17);
    norm += amp; amp *= guadagno; freq *= 2;
  }
  return s / norm;
}

/**
 * Rumore cellulare periodico (Worley): distanza dal punto più vicino (f1)
 * e dal secondo (f2), più l'identità della cella vincente. Serve a pietre,
 * ciottoli e macchie.
 */
export function worley(x, y, p, seme = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i, cy = iy + j;
    const wx = mod(cx, p), wy = mod(cy, p);
    const px = cx + hash2(wx, wy, seme), py = cy + hash2(wx, wy, seme + 7);
    const d = Math.hypot(px - x, py - y);
    if (d < f1) { f2 = f1; f1 = d; id = hash2(wx, wy, seme + 13); }
    else if (d < f2) f2 = d;
  }
  return { f1, f2, id };
}

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
