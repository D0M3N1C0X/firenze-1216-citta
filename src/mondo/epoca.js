/* =====================================================================
   L'EPOCA DELLA CITTÀ COSTRUITA

   La città si costruisce per un'epoca alla volta: il 1216 (predefinita) o
   il 1300 (?epoca=1300). Si sceglie al caricamento della pagina; per
   passare dall'una all'altra la pagina si ricarica nello stesso punto,
   così la memoria della città di prima si libera tutta (decisione del
   6 novembre 2026: «nello stesso punto, ricostruendo»). La Firenze di
   oggi resta un'altra cosa: si sovrappone alla città che c'è
   (mondo/oggi.js) e non passa da qui.

   In Node (la verifica) non c'è location: vale la variabile d'ambiente
   EPOCA (EPOCA=1300 node scripts/verifica-1300.mjs), altrimenti il 1216.
   ===================================================================== */

const scelta = typeof location !== 'undefined' && location.search !== undefined ? new URLSearchParams(location.search).get('epoca')
  : typeof process !== 'undefined' ? process.env?.EPOCA : null;

/** '1216' o '1300'. */
export const EPOCA = scelta === '1300' ? '1300' : '1216';
export const NEL_1300 = EPOCA === '1300';

/**
 * Le torri mozzate. Villani VII, 39 [controllato sul testo il 6/11/2026]:
 * con il Primo Popolo, nel 1250, «tutte le torri di Firenze, che ce n'avea
 * grande quantità alte CXX braccia, si tagliassono e tornassono alla misura
 * di L braccia e non più». Il braccio fiorentino da panno è di 0,5836 m
 * [da verificare: quale braccio]: 50 braccia sono 29,2 m.
 */
export const BRACCIO = 0.5836;
export const TETTO_TORRI = NEL_1300 ? 50 * BRACCIO : Infinity;
