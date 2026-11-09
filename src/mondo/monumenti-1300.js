import { matriceLotto } from './cantiere.js';
import { MONUMENTO, PIAZZA } from './griglia.js';
import { INDICE, MODELLI, posaModello } from './modelli.js';
import { quota } from './terreno.js';
import { SANTA_REPARATA } from './monumenti.js';

/* =====================================================================
   I MONUMENTI DEL 1300 NELLA CITTÀ

   I modelli vengono da strumenti/monumenti/monumenti1300.py (cantiere dei
   Priori, guasto degli Uberti, loggia del grano, palazzo del Popolo, i
   cantieri di Santa Croce e di Santa Maria Novella). Qui
   si posano: l'angolo della facciata (origine), la direzione verso
   l'interno (n), come le misure dei volumi di oggi (dati/oggi.js) da cui
   vengono le piante. Nella griglia: muri e cataste non si attraversano,
   dentro il cantiere e sotto la loggia si cammina, e lì non si costruiscono
   case. Si posano prima delle case. Livello: «ipotesi» per la forma.
   ===================================================================== */

export const POSE_1300 = {
  // la facciata ovest sul guasto, da via della Ninna verso nord (edificio 4148 di oggi)
  priori: { origine: [207, -95], n: [1, 0], dentro: true },
  // il contorno di AGGIUNTE_1300 in dati/strade-1300.js: origine all'angolo nord-est, x verso sud
  guasto: { origine: [203, -205], n: [-1, 0] },
  // Orsanmichele: il lato su via dei Calzaiuoli (edificio 4426)
  loggia_grano: { origine: [151, -290], n: [-1, 0], loggia: true },
  // il corpo sulla via del Proconsolo (edificio 4396), con la torre all'angolo sud
  palazzo_popolo: { origine: [378, -221], n: [1, 0], pieno: true },
  // i cantieri delle chiese nuove: l'angolo sinistro della facciata e la direzione dell'abside,
  // dal rettangolo minimo dell'impronta di oggi (OpenStreetMap; calcolati l'8/11/2026)
  santa_croce: { origine: [697.2, -22.5], n: [0.875, 0.485], dentro: true },
  santa_maria_novella: { origine: [-287.6, -663.6], n: [0.035, -0.999], dentro: true },
  // la facciata nuova 9,5 m dietro quella di Santa Reparata, sullo stesso asse, larga 43 m (monumenti1300.py)
  cattedrale: SANTA_REPARATA ? { origine: [SANTA_REPARATA.facciata + 9.5, SANTA_REPARATA.asse + 21.5], n: [1, 0] } : null
};

function sistema([px, pz], [nx, nz]) {
  const tx = nz, tz = -nx;
  return (bx, by) => [px + bx * tx - by * nx, pz + bx * tz - by * nz];
}

/** Posa i monumenti del 1300 che ci sono; restituisce i loro nomi. */
export function costruisciMonumenti1300(cant, griglia) {
  const posati = [];
  for (const [nome, posa] of Object.entries(POSE_1300)) {
    const info = INDICE[nome];
    if (!posa || !info || !MODELLI[nome]) continue;
    const S = sistema(posa.origine, posa.n);
    const rett = ([x0, x1, y0, y1], v) => griglia.poligono([S(x0, y0), S(x1, y0), S(x1, y1), S(x0, y1)], v);
    const W = info.W, D = info.D;
    const [cx, cz] = S(W / 2, -D / 2);
    if (MODELLI[nome].length) posaModello(cant, nome, matriceLotto(posa.origine[0], quota(cx, cz) - 0.05, posa.origine[1], posa.n[0], posa.n[1]), 'ipotesi');
    if (posa.pieno) rett([0, W, -D, 0], MONUMENTO);
    if (posa.dentro || posa.loggia) rett([0.2, W - 0.2, -D + 0.2, -0.2], PIAZZA);
    for (const r of info.ostacoli || []) rett(r, MONUMENTO);
    for (const r of info.fuori || []) rett(r, MONUMENTO);
    for (const r of info.varchi || []) rett(r, PIAZZA);
    posati.push(nome);
  }
  return posati;
}
