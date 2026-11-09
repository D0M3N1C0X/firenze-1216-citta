import { Matrix4 } from 'three';
import { LINEA_NUOVA, OLTRARNO_1300, PORTE } from '../dati/cerchia-1300.js';
import { scatola } from './cantiere.js';
import { MONUMENTO, STRADA } from './griglia.js';
import { porta } from './monumenti.js';
import { pezzoDiMuro, tratto } from './mura.js';
import { quota } from './terreno.js';

/* =====================================================================
   LE MURA NUOVE DEL 1300

   Il tracciato e le fonti sono in dati/cerchia-1300.js. Qui si costruisce:
   - in Oltrarno, la linea duecentesca (dopo il 1260 e fine Duecento) come
     muro merlato, con le stesse misure ipotetiche del muro del 1172–75, e
     le sue due porte (Giano della Bella, San Jacopo) come torri di porta;
   - sulla riva destra, le quattro porte fondate nel 1284 e lasciate
     «innanzi che fossono a l'arcora» (Villani VIII, 99): due piloni di
     pietra alti fino all'imposta dell'arco, senza arco e senza muro ai
     lati. L'altezza (7 m) e le misure sono ipotesi.
   Fra le porte nuove non si costruisce niente (lacuna 64).
   Tutto è di livello «ipotesi».
   ===================================================================== */

const LIV = 'ipotesi', TINTA = [0.92, 0.9, 0.85];

/** La direzione della linea nel punto più vicino a p: [lungo, verso dentro]. */
function direzione(linea, p) {
  let best = null;
  for (let k = 0; k + 1 < linea.length; k++) {
    const a = linea[k], b = linea[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (l * l)));
    const d = Math.hypot(a[0] + t * dx - p[0], a[1] + t * dz - p[1]);
    if (!best || d < best.d) best = { d, u: [dx / l, dz / l] };
  }
  return best.u;
}

/** Il muro d'Oltrarno del 1300, con i varchi delle sue porte. Prima delle case. */
export function muraOltrarno1300(cant, griglia) {
  const porte = PORTE.filter(p => p.stato === 'finita' && p.pos);
  let pezzi = 0;
  for (let k = 0; k + 1 < OLTRARNO_1300.length; k++) {
    const a = OLTRARNO_1300[k], b = OLTRARNO_1300[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.3) continue;
    const ux = dx / L, uz = dz / L;
    for (let s = 0; L - s > 0.4;) {
      const l = Math.min(8, L - s), m = s + l / 2, cx = a[0] + ux * m, cz = a[1] + uz * m;
      s += l;
      if (porte.some(p => Math.hypot(p.pos[0] - cx, p.pos[1] - cz) < 5.5 + l / 2)) continue;
      pezzoDiMuro(cant, griglia, cx, cz, ux, uz, l + 0.02); pezzi++;
    }
  }
  for (const p of porte) {
    const [ux, uz] = direzione(OLTRARNO_1300, p.pos);
    porta(cant, griglia, p.pos, [-uz, ux]);
  }
  return pezzi;
}

/** Le porte nuove della riva destra nel 1300: i piloni di un cantiere fermo. */
export function porteInCantiere(cant, griglia) {
  const luce = 4.2, P = 2.8, D = 7, H = 7;
  let n = 0;
  for (const p of PORTE.filter(p => p.stato === 'cantiere' && p.pos)) {
    const [ux, uz] = direzione(LINEA_NUOVA, p.pos);
    const [x, z] = p.pos;
    const M = tratto(x, z, ux, uz);
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -luce / 2 - P : luce / 2, x1 = x0 + P;
      cant.aggiungi(scatola(x0, -1.2, -D / 2, x1, H, D / 2), 'conci', LIV, M, TINTA);
      // i conci dell'imposta, che sporgono verso la luce: l'arco non c'è
      cant.aggiungi(scatola(s < 0 ? x1 : x0 - 0.35, H - 0.6, -D / 2, s < 0 ? x1 + 0.35 : x0, H, D / 2), 'conci', LIV, M, [0.86, 0.84, 0.8]);
      const c = s * (luce / 2 + P / 2);
      griglia.rettangolo(x + ux * c, z + uz * c, ux, uz, P / 2, D / 2, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
    }
    griglia.rettangolo(x, z, ux, uz, luce / 2 - 0.2, D / 2 + 6, (i, j) => { griglia.c[j * griglia.n + i] = STRADA; });
    n++;
  }
  return n;
}

/** Per la verifica: quota del piede di una porta nuova. */
export const quotaPorta = p => quota(p.pos[0], p.pos[1]);
