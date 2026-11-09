/* =====================================================================
   LE MURA NEL 1300

   Il 1° maggio 1300 Firenze ha due cerchie, una finita e una appena
   cominciata, e in Oltrarno una terza linea, duecentesca.

   1. LA CERCHIA DEL 1172–75 è ancora in piedi: è quella del 1216
      (dati/cerchia.js), e qui non si ridisegna.

   2. LA CERCHIA NUOVA, sulla riva destra, è un cantiere. Villani VIII, 99
      [controllato sul testo il 6/11/2026]: nel febbraio 1284 (1285 per
      noi, nello stile fiorentino [da verificare]), «essendo... la città
      cresciuta di popolo e di grandi borghi», si cominciarono «a fondare le
      nuove porte, ove poi conseguirono le nuove mura»: quella di Santa
      Candida oltre Sant'Ambrogio (poi Porta alla Croce), San Gallo, il Prato
      d'Ognissanti (Porta al Prato) e quella di Faenza; «e rimase il lavoro
      di quelle innanzi che fossono a l'arcora». Il muro tra una porta e
      l'altra viene dopo: finito nel 1333 (Wikipedia, «Mura di Firenze»,
      consultata il 6/11/2026). Che cosa c'era nel 1300 fra le porte (un
      fosso, uno steccato, niente) è la lacuna 64.

   3. IN OLTRARNO le mura nuove sono degli anni Venti e Trenta del Trecento
      (Porta Romana, San Frediano, San Niccolò) e nel 1300 non ci sono.
      C'è invece la linea duecentesca. Wikipedia, «Mura di Firenze»: dopo
      il 1260 il recinto si allarga verso Santo Spirito, «lungo la via
      Mazzetta/Sant'Agostino e girò in via dei Serragli fino alla porta
      Pisana o di San Jacopo (in fondo a via di Santo Spirito) e fino al
      fiume all'altezza del ponte alla Carraia»; poi, alla fine del
      Duecento, «fino a via del Campuccio, con una porta intitolata
      all'allora podestà Giano della Bella in corrispondenza dell'attuale
      via dei Serragli» [da verificare su Sznura 1975 e Davidsohn]. Il
      modello disegna questa seconda linea, quella del 1300.

   IL LIMITE DELLA CITTÀ DEL 1300. Le case arrivano fino alla linea delle
   mura nuove, anche dove le mura non ci sono ancora, e si fanno sempre più
   rade (decisione del 6/11/2026): il poligono LIMITE segue la cerchia
   nuova intera, compresa quella d'Oltrarno, che qui fa solo da confine.

   LIVELLI. Le porte: il luogo è «documentato» (sono le porte di oggi,
   rifatte o finite dopo), la forma nel 1300 è «ipotesi». La linea delle
   mura nuove sulla riva destra: «dedotto», perché i viali dell'Ottocento
   sono stati aperti sul muro abbattuto. La linea d'Oltrarno del 1300:
   «dedotto» dove la fonte nomina le vie, «ipotesi» nei raccordi.
   ===================================================================== */

import { FIUME, STRADE, PORTE as PORTE_OSM, MURA } from './osm-1300.js';
import { traccia, riva, sullaVia, dentro, tondo } from './geometria.js';

const porta = nome => PORTE_OSM.find(p => p.nome === nome)?.punto;
const muro = id => MURA.find(m => m.id === id)?.punti;
const via = (nome, verso) => sullaVia(STRADE, nome, verso);

/* ------------------------------------- la cerchia nuova, riva destra */

// Da ovest a est: dal fiume sotto Porta al Prato fino al fiume alla Zecca.
// Fra Porta al Prato e il fiume la fonte non nomina vie: tratto dritto.
// Fra viale Fratelli Rosselli e Porta a Faenza la Fortezza da Basso (1534)
// ha cancellato il tracciato: tratto dritto.
const DESTRA = traccia(STRADE, [
  { punto: riva(FIUME, [-1090, -560]), nota: 'il fiume a valle, dove poi starà la torre della Serpe [da verificare]' },
  { punto: porta('Porta al Prato') },
  // viale Fratelli Rosselli è a doppia carreggiata e i suoi tratti non si toccano: lo si segue dai suoi due capi, in linea retta, come il viale
  { punto: via('Viale Fratelli Rosselli', porta('Porta al Prato')) },
  { punto: via('Viale Fratelli Rosselli', [-640, -1290]) },
  { punto: porta('Porta a Faenza') },
  { punto: via('Viale Spartaco Lavagnini', [-48, -1509]) },
  { vie: ['Viale Spartaco Lavagnini'], a: via('Viale Spartaco Lavagnini', [609, -1700]) },
  { punto: porta('Porta San Gallo') },
  { punto: via('Viale Giacomo Matteotti', [732, -1655]) },
  { vie: ['Viale Giacomo Matteotti'], a: via('Viale Giacomo Matteotti', [1123, -1110]) },
  { vie: ['Piazzale Donatello', 'Viale Antonio Gramsci'], a: via('Viale Antonio Gramsci', [1400, -305]) },
  { punto: porta('Porta alla Croce') },
  { punto: via('Viale della Giovine Italia', [1392, -284]) },
  { vie: ['Viale della Giovine Italia'], a: via('Viale della Giovine Italia', [1233, 138]) },
  { punto: riva(FIUME, [1240, 175]), nota: 'il fiume a monte, alla torre della Zecca' }
]);

/** La linea della cerchia nuova sulla riva destra, dal fiume al fiume. «Dedotto». */
export const LINEA_NUOVA = DESTRA.punti;

/* ------------------------ la cerchia nuova d'Oltrarno: solo il confine */

// Da est a ovest, sui muri che esistono ancora (OSM) e, fra l'uno e
// l'altro, in linea retta.
const OLTRARNO_NUOVA = traccia(STRADE, [
  { punto: riva(FIUME, [930, 380]) },
  { punto: porta('Torre San Niccolò') },
  { tratto: muro(690890820) },
  { tratto: muro(140235977), nota: 'da San Miniato a San Giorgio, il muro sul colle' },
  { punto: porta('Porta San Giorgio') },
  { tratto: muro(119943564), nota: 'il muro di Boboli' },
  { tratto: muro(781628029) },
  { tratto: muro(1558637634) },
  { punto: porta('Porta Romana') },
  { tratto: muro(30430358), nota: 'lungo viale Petrarca' },
  { tratto: muro(118821962) },
  { tratto: muro(118821960) },
  { punto: porta('Porta San Frediano') },
  { tratto: muro(118932485) },
  { tratto: muro(118932463) },
  { punto: porta('Porta di Santa Rosa') },
  { punto: riva(FIUME, [-1000, -440]) }
]);

/** La linea della cerchia nuova in Oltrarno: nel 1300 non c'è, segna solo dove arrivano i borghi. */
export const CONFINE_OLTRARNO = OLTRARNO_NUOVA.punti;

/* ------------------------------------- la linea d'Oltrarno del 1300 */

// Dalla porta di Piazza (San Felice) verso sud lungo via Romana fino a via
// del Campuccio (raccordo: ipotesi), lungo via del Campuccio fino a via dei
// Serragli, dove sta la porta di Giano della Bella, e lungo via dei
// Serragli fino alla porta di San Jacopo, in fondo a via di Santo Spirito, e
// al fiume presso il ponte alla Carraia.
const CAMPUCCIO_EST = via('Via del Campuccio', [-537, 420]);
const SERRAGLI_CAMPUCCIO = via('Via dei Serragli', [-640, 300]);
const SAN_JACOPO = via('Via di Santo Spirito', [-547, -96]);
const LINEA_OLTRARNO = traccia(STRADE, [
  { punto: via('Piazza San Felice', [-410, 340]), nota: 'la porta di Piazza, a San Felice' },
  { vie: ['Via Romana'], a: via('Via Romana', CAMPUCCIO_EST), tolleranza: 60 },
  { punto: CAMPUCCIO_EST },
  { vie: ['Via del Campuccio'], a: via('Via del Campuccio', SERRAGLI_CAMPUCCIO), tolleranza: 40 },
  { punto: SERRAGLI_CAMPUCCIO, nota: 'la porta di Giano della Bella' },
  { vie: ['Via dei Serragli'], a: via('Via dei Serragli', SAN_JACOPO) },
  { punto: SAN_JACOPO, nota: 'la porta Pisana, o di San Jacopo' },
  { punto: riva(FIUME, [-560, -130]) }
]);

/** Il recinto d'Oltrarno nel 1300, lato ovest e sud. Il lato est è la palizzata del 1216 (dati/cerchia.js). */
export const OLTRARNO_1300 = LINEA_OLTRARNO.punti;

/* ----------------------------------------------------------- le porte */

const stato = {
  fondata: 'fondata nel 1284 (1285 per noi) e lasciata prima degli archi (Villani VIII, 99)',
  dopo: 'nel 1300 non c\'è ancora: la porta di oggi è del Trecento inoltrato',
  oltrarno1300: 'porta della linea duecentesca d\'Oltrarno (Wikipedia, «Mura di Firenze»)'
};

/** Le porte del 1300 fuori dalla cerchia vecchia. «Luogo» e «forma» come nelle schede del 1216. */
export const PORTE = [
  { id: 'porta-prato', nome: 'La porta del Prato d\'Ognissanti', oggi: 'Porta al Prato', pos: porta('Porta al Prato'), stato: 'cantiere', nota: stato.fondata, luogo: 'documentato', forma: 'ipotesi' },
  { id: 'porta-faenza', nome: 'La porta di Faenza', oggi: 'Porta a Faenza, dentro la Fortezza da Basso', pos: porta('Porta a Faenza'), stato: 'cantiere', nota: stato.fondata, luogo: 'documentato', forma: 'ipotesi' },
  { id: 'porta-san-gallo', nome: 'Porta San Gallo', oggi: 'Porta San Gallo, piazza della Libertà', pos: porta('Porta San Gallo'), stato: 'cantiere', nota: stato.fondata, luogo: 'documentato', forma: 'ipotesi' },
  { id: 'porta-santa-candida', nome: 'La porta di Santa Candida', oggi: 'Porta alla Croce, piazza Beccaria', pos: porta('Porta alla Croce'), stato: 'cantiere', nota: stato.fondata + '; che sia la Porta alla Croce di oggi è [da verificare]', luogo: 'dedotto', forma: 'ipotesi' },
  { id: 'porta-giano', nome: 'La porta di Giano della Bella', oggi: 'via dei Serragli, all\'incrocio con via del Campuccio', pos: tondo(SERRAGLI_CAMPUCCIO), stato: 'finita', nota: stato.oltrarno1300 + ' [da verificare]', luogo: 'dedotto', forma: 'ipotesi' },
  { id: 'porta-san-jacopo-1300', nome: 'La porta Pisana, o di San Jacopo', oggi: 'in fondo a via di Santo Spirito', pos: tondo(SAN_JACOPO), stato: 'finita', nota: stato.oltrarno1300, luogo: 'dedotto', forma: 'ipotesi' },
  // per confronto: le porte d'Oltrarno di oggi, che nel 1300 non ci sono
  { id: 'porta-romana', nome: 'Porta Romana', oggi: 'Porta Romana', pos: porta('Porta Romana'), stato: 'dopo', nota: stato.dopo + ' [da verificare: anno]', luogo: 'documentato', forma: 'documentato' },
  { id: 'porta-san-frediano', nome: 'Porta San Frediano', oggi: 'Porta San Frediano', pos: porta('Porta San Frediano'), stato: 'dopo', nota: stato.dopo + ' [da verificare: anno]', luogo: 'documentato', forma: 'documentato' },
  { id: 'porta-san-niccolo', nome: 'Porta San Niccolò', oggi: 'Torre San Niccolò', pos: porta('Torre San Niccolò'), stato: 'dopo', nota: stato.dopo + '; 1324 secondo risorgimentofirenze.it [da verificare]', luogo: 'documentato', forma: 'documentato' }
];

/* ------------------------------------------------------- il limite */

// La cerchia nuova intera: la riva destra da ovest a est, il fiume, la
// linea d'Oltrarno da est a ovest, il fiume. Il fiume dentro resta fiume.
export const LIMITE = [...LINEA_NUOVA, ...CONFINE_OLTRARNO];

/** Dentro la città del 1300 (la cerchia nuova intera). */
export const dentroLimite = (x, z) => dentro(LIMITE, x, z);

/** Avvisi della costruzione (li stampa la verifica). */
export const AVVISI = [...DESTRA.avvisi, ...OLTRARNO_NUOVA.avvisi.map(a => 'Oltrarno nuova: ' + a), ...LINEA_OLTRARNO.avvisi.map(a => 'Oltrarno 1300: ' + a),
  ...PORTE.filter(p => !p.pos).map(p => `porta senza posto: ${p.nome}`)];
