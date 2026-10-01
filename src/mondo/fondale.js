import { Matrix4 } from 'three';
import { falda, piramide, scatola } from './cantiere.js';
import { distanzaFiume, quota } from './terreno.js';
import { rng } from './rumore.js';

/* =====================================================================
   IL FONDALE

   Oltre i 400 metri dal ponte la città non si percorre ancora: si vede
   soltanto, sopra i tetti e in fondo alle strade. Qui la generazione è
   del tutto schematica: blocchi di case e torri dentro un perimetro che
   approssima la cerchia del 1172–1175.

   IL PERIMETRO È UN'IPOTESI GROSSOLANA, disegnato a mano per il fondale:
   il tracciato della cerchia va ricostruito sulle fonti (PIANO.md).
   ===================================================================== */

export const CERCHIA = [[-430, -20], [-440, -380], [-330, -640], [-120, -860], [150, -900], [420, -760], [600, -520],
  [640, -200], [640, 120], [420, 270], [150, 310], [-150, 330], [-420, 280], [-540, 100]];

const LIBERI = [[128, -542, 34], [191, -562, 42]];     // Battistero e Santa Reparata

export const dentroCerchia = (x, z) => dentro(x, z, CERCHIA);

function dentro(x, z, p) {
  let ok = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ok = !ok;
  return ok;
}

export function costruisciFondale(cant, raggioInterno = 405) {
  const R = rng(1175);
  const LIV = 'ipotesi';
  const passo = 13;
  let n = 0;
  for (let gx = -560; gx <= 660; gx += passo) for (let gz = -920; gz <= 340; gz += passo) {
    const x = gx + R.tra(-3, 3), z = gz + R.tra(-3, 3);
    if (Math.hypot(x, z) < raggioInterno || !dentro(x, z, CERCHIA)) continue;
    if (LIBERI.some(([lx, lz, r]) => Math.hypot(x - lx, z - lz) < r)) continue;
    if (distanzaFiume(x, z) < 4 || R.vero(0.16)) continue;     // le strade e qualche orto
    const y = quota(x, z);
    if (y > 9) continue;
    const ang = R.tra(-0.06, 0.06) + (R.vero(0.5) ? Math.PI / 2 : 0);
    const M = new Matrix4().makeRotationY(ang).setPosition(x, y, z);
    if (R.vero(0.025)) {
      // le torri del fondale: meno e più basse di quanto l'occhio si aspetti,
      // o la città diventa una selva di grattacieli
      const W = R.tra(5.5, 8), H = R.tra(20, 38);
      cant.aggiungi(scatola(-W / 2, -1, -W / 2, W / 2, H, W / 2), 'conci', LIV, M, [R.tra(0.82, 0.98), 0.92, 0.86], false);
      const g = piramide(W, W, H, W * 0.3, 0.4); cant.aggiungi(g, 'coppi', LIV, M, [1, 1, 1], false);
    } else {
      const W = R.tra(7, 11.5), D = R.tra(9, 12), H = R.tra(9, 15);
      const mat = R.vero(0.55) ? 'intonaco' : R.vero(0.6) ? 'pietrame' : 'conci';
      const tinta = mat === 'intonaco' ? [1, R.tra(0.88, 0.98), R.tra(0.78, 0.92)] : [R.tra(0.9, 1.02), 0.95, 0.92];
      cant.aggiungi(scatola(-W / 2, -1, -D / 2, W / 2, H, D / 2), mat, LIV, M, tinta, false);
      const p = 0.4, c = H + D / 2 * p;
      cant.aggiungi(falda(-W / 2 - 0.3, W / 2 + 0.3, H - 0.8 * p, -D / 2 - 0.8, c, 0), 'coppi', LIV, M, [1, 1, 1], false);
      cant.aggiungi(falda(-W / 2 - 0.3, W / 2 + 0.3, H - 0.8 * p, D / 2 + 0.8, c, 0), 'coppi', LIV, M, [1, 1, 1], false);
    }
    n++;
  }
  return n;
}
