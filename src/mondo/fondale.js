import { PORTE, TRACCIATO, dentroTracciato } from '../dati/cerchia.js';
import { costruisciLotti, lottizza } from './edifici.js';

/* =====================================================================
   FUORI LE MURA: I BORGHI

   Fino al 12 ottobre 2026 qui c'era il «fondale»: blocchi schematici di
   case dentro un perimetro disegnato a mano, oltre l'area costruita casa per
   casa. Dal 13 ottobre la città è costruita casa per casa fino alle mura
   (dati/cerchia.js), e fuori restano i borghi.

   La fonte dice che fuori dalle mura c'erano borghi, con numerose torri
   private (Wikipedia, «Mura di Firenze» [da verificare]). Dove fossero, nel
   1216, non lo sappiamo: il modello li mette lungo le strade che escono
   dalle porte, fitti vicino alla porta e sempre più radi, per circa 200 m.
   Dopo, orti e campi. Livello: ipotesi.
   ===================================================================== */

export const CERCHIA = TRACCIATO;
export const dentroCerchia = dentroTracciato;

function distanzaSpezzata(x, z, pts) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}

/** Le case dei borghi lungo le strade fuori porta (strade con fuori: true). Dopo il muro. */
export function costruisciBorghi(cant, griglia, strade) {
  const fuori = strade.filter(s => s.fuori);
  if (!fuori.length) return [];
  const porte = PORTE.filter(p => p.pos);
  const daPorta = (x, z) => Math.min(...porte.map(p => Math.hypot(p.pos[0] - x, p.pos[1] - z)));
  const xs = fuori.flatMap(s => s.punti.map(p => p[0])), zs = fuori.flatMap(s => s.punti.map(p => p[1]));
  const lotti = lottizza(griglia, fuori, {
    dentro: (x, z) => !dentroTracciato(x, z) && fuori.some(s => distanzaSpezzata(x, z, s.punti) < 22),
    riquadro: [Math.min(...xs) - 30, Math.min(...zs) - 30, Math.max(...xs) + 30, Math.max(...zs) + 30],
    riempimento: 0,
    radi: (x, z) => 0.12 + 0.6 * Math.min(1, daPorta(x, z) / 220),
    seme0: 50000
  });
  costruisciLotti(cant, lotti);
  return lotti;
}
