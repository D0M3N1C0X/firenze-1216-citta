import { lottizza } from './edifici.js';
import { dentroTracciato } from '../dati/cerchia.js';
import { AGGIUNTE } from '../dati/strade-1216.js';

/* =====================================================================
   LA CITTÀ DEL 1300: LE SCELTE COMUNI AL BROWSER E ALLA VERIFICA

   main.js costruisce la città, scripts/verifica-1300.mjs ne rifà la pianta
   senza disegnarla: le scelte stanno qui, una volta sola, perché le due
   piante siano uguali. Le proporzioni sono tutte ipotesi (PIANO-1300.md).
   ===================================================================== */

/** Tentativi di riempire gli isolati della città vecchia: più che nel 1216 (28000). */
export const RIEMPIMENTO_1300 = 40000;

/** La palizzata d'Oltrarno nel 1300: solo a est di San Felice; a ovest c'è il muro duecentesco. */
export const PALIZZATA_1300 = {
  tiene: (x, z) => x > -395 && !(x < -270 && z < 320),
  senzaPorte: ['porta-via-maggio', 'porta-san-jacopo']
};

/**
 * I lotti dei borghi del 1300: lungo le strade fra la cerchia vecchia e la
 * nuova, anche sul fiume, sempre più radi allontanandosi dal centro. A 450 m
 * dal centro le case sono fitte; a 1350 m ne resta una su cinque.
 */
export function lottiBorghi1300(griglia, strade, dentroLimite, limite) {
  const fuori = strade.filter(s => s.fuoriVecchia && !s.area);
  const xs = limite.map(p => p[0]), zs = limite.map(p => p[1]);
  const lotti = lottizza(griglia, fuori, {
    dentro: (x, z) => dentroLimite(x, z) && !dentroTracciato(x, z),
    riquadro: [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)],
    riempimento: 0,
    radiRive: true,
    radi: (x, z) => 0.06 + 0.74 * Math.min(1, Math.max(0, Math.hypot(x - 60, z + 250) - 450) / 900),
    seme0: 50000
  });
  for (const L of lotti) L.borgo = true;
  return lotti;
}

/**
 * Le strade del 1300 complete: quelle di oggi che valgono (dati/strade-1300.js),
 * le aggiunte del 1216 che valgono ancora e quelle del 1300. Il modulo delle
 * strade si passa come argomento perché si carica solo quando serve.
 */
export function componiStrade1300(modStrade, stradeOsm) {
  return modStrade.strade1300(stradeOsm)
    .concat(AGGIUNTE.map(a => ({ ...a, larghezza: a.larghezza || 4.2 })), modStrade.AGGIUNTE_1300.map(a => ({ ...a, larghezza: 4.2 })));
}
