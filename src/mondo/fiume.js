import { FIUME } from '../dati/osm.js';

/* La distanza dal letto dell'Arno, che decide le rive e le case sull'acqua. */

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------------------------- distanza con segno dal letto */
// Precalcolata su una griglia di 2 m: negativa dentro il letto.
const DMIN = -900, DMAX = 900, DP = 2, DN = (DMAX - DMIN) / DP;
let campo = null;

function dentroPoligono(x, z, p) {
  let ok = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i], b = p[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ok = !ok;
  }
  return ok;
}

/** Calcolo puro del campo di distanza: gira anche in un worker. */
export function calcolaCampo() {
  const campo = new Float32Array((DN + 1) * (DN + 1));
  const p = FIUME;
  let zmin = Infinity, zmax = -Infinity;
  for (const q of p) { zmin = Math.min(zmin, q[1]); zmax = Math.max(zmax, q[1]); }
  for (let j = 0; j <= DN; j++) {
    const z = DMIN + j * DP;
    // lontano dal fiume serve solo sapere che si è fuori
    if (z < zmin - 60 || z > zmax + 60) { campo.fill(999, j * (DN + 1), (j + 1) * (DN + 1)); continue; }
    for (let i = 0; i <= DN; i++) {
      const x = DMIN + i * DP;
      let d2 = Infinity;
      for (let k = 0, l = p.length - 1; k < p.length; l = k++) {
        const ax = p[l][0], az = p[l][1], bx = p[k][0], bz = p[k][1];
        const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
        const ex = ax + t * dx - x, ez = az + t * dz - z;
        const q = ex * ex + ez * ez;
        if (q < d2) d2 = q;
      }
      const d = Math.sqrt(d2);
      campo[j * (DN + 1) + i] = dentroPoligono(x, z, p) ? -d : d;
    }
  }
  return campo;
}

export function impostaCampo(c) { campo = c; }

/** Distanza con segno dal bordo del letto (m). Negativa in acqua. */
export function distanzaFiume(x, z) {
  if (!campo) campo = calcolaCampo();
  const fx = (x - DMIN) / DP, fz = (z - DMIN) / DP;
  if (fx < 0 || fz < 0 || fx >= DN || fz >= DN) return 999;
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, W = DN + 1;
  const a = campo[j * W + i], b = campo[j * W + i + 1], c = campo[(j + 1) * W + i], d = campo[(j + 1) * W + i + 1];
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}


/** Calcola il campo in un worker; se non si può, lo calcola qui. */
export function preparaCampo() {
  return new Promise(ok => {
    try {
      const w = new Worker(new URL('./fiume-worker.js', import.meta.url), { type: 'module' });
      w.onmessage = e => { impostaCampo(e.data); w.terminate(); ok(); };
      w.onerror = () => { w.terminate(); impostaCampo(calcolaCampo()); ok(); };
      w.postMessage(0);
    } catch { impostaCampo(calcolaCampo()); ok(); }
  });
}
