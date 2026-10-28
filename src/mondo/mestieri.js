import { Matrix4 } from 'three';
import { quota } from './terreno.js';
import { scatola } from './cantiere.js';
import { MONUMENTO } from './griglia.js';
import { rng } from './rumore.js';
import { haKit } from './kit.js';

/* =====================================================================
   I MESTIERI (28 ottobre 2026)

   Botteghe e banchi allestiti, con chi vende e chi compra, nei giorni di
   lavoro (dati/giornate.js, festa: false). A Pasqua il mercato è vuoto e
   le botteghe chiuse: niente di questo si vede, e niente sbarra la strada.

   - Il mercato del cibo al Mercato Vecchio, a file: beccai, pesce, pane,
     ortolani. Che ci fosse il mercato è certo; la disposizione a file e
     per mestieri è un'ipotesi.
   - I cambiatori, seduti alla loro tavola coperta di panno, sul lato del
     mercato verso Calimala, la via dei mercanti di panni: ipotesi.
   - I mercanti di panni lungo via Calimala, con il banco davanti alla
     bottega: la via porta il nome della loro arte (dedotto); i banchi sono
     un'ipotesi.
   - La fucina del fabbro e il maniscalco vicino a Porta Santa Maria, dove
     si ferma chi entra a cavallo: ipotesi.
   - Il notaio al suo scrittoio, davanti alla casa del notaio del gioco e
     in un angolo del mercato: ipotesi.
   Fonti, livelli e lacune in strumenti/kit/FONTI.md, § 7.

   I pezzi vengono dal kit (strumenti/kit/kit.py): il davanti (+Y in
   Blender) diventa -Z in three; ruotato di θ intorno a Y punta verso
   (-sin θ, -cos θ). Le figure sono generiche, come in tutta la città.
   ===================================================================== */

const LIV = 'ipotesi';
const TELE = [[0.92, 0.88, 0.78], [0.78, 0.62, 0.42], [0.62, 0.36, 0.28], [0.55, 0.6, 0.66]];
// i colori dei panni di Calimala: scarlatto, azzurro, verde, bruno, greggio, paonazzo (ipotesi)
const PANNI = [[0.78, 0.14, 0.11], [0.2, 0.32, 0.62], [0.22, 0.44, 0.26], [0.45, 0.31, 0.2], [0.95, 0.9, 0.8], [0.46, 0.18, 0.36]];
const VENDE = ['popolano', 'popolana', 'artigiano'];
const COMPRA = ['popolana', 'fantesca', 'popolano', 'ragazzo', 'mercantessa', 'fanciulla'];

// lo stato: quello che si mette nei giorni di lavoro, e le celle che occupa
const S = { fermi: [], seduti: [], cavalli: [], rettangoli: [], suoni: [], panni: [], vecchie: null, feriale: false };

/** Un sistema locale: centro (x, z), davanti verso (dx, dz). bx lungo il banco, by verso il davanti. */
function posto(x, z, dx, dz) {
  const r = Math.hypot(dx, dz) || 1, fx = dx / r, fz = dz / r;
  return {
    x, z, fx, fz, lx: -fz, lz: fx, theta: Math.atan2(-fx, -fz),
    p(bx, by) { return [x + bx * this.lx + by * fx, z + bx * this.lz + by * fz]; },
    dir(verso) { return verso > 0 ? Math.atan2(fx, fz) : Math.atan2(-fx, -fz); }
  };
}

function posa(cant, nome, P, y, tinta = [1, 1, 1], ombra = true, bx = 0, by = 0, dy = 0) {
  if (!haKit(nome)) return;
  const [x, z] = P.p(bx, by);
  cant.pezzo(nome, new Matrix4().makeRotationY(P.theta).setPosition(x, y + dy, z), LIV, tinta, ombra);
}

/** Un rettangolo in coordinate locali da occupare nei giorni di lavoro. */
function blocca(P, bx0, bx1, by0, by1) {
  const [cx, cz] = P.p((bx0 + bx1) / 2, (by0 + by1) / 2);
  S.rettangoli.push({ cx, cz, ux: P.lx, uz: P.lz, a: (bx1 - bx0) / 2, b: (by1 - by0) / 2 });
}

function figura(P, bx, by, verso, ruoli, clip) {
  const [x, z] = P.p(bx, by);
  S.fermi.push({ x, z, dir: P.dir(verso), ruoli, clip });
}

/* ------------------------------------------------- il Mercato Vecchio */
// il mercato è la piazza disegnata a mano in strade-1216.js (x 30–96, z −395/−335);
// Calimala lo attraversa a x ≈ 86, il decumano (via degli Speziali e degli Strozzi) a z ≈ −366
function mercato(cant, R) {
  const FILE = { '-388': 'banco_beccaio', '-381': 'banco_pesce', '-374': 'banco_pane', '-360': 'banco_pane', '-353': 'banco_ortolano', '-346': 'banco_ortolano' };
  for (let x = 38; x <= 78; x += 6.5) for (const zs of Object.keys(FILE)) {
    const z0 = +zs, px = x + R.tra(-0.5, 0.5), pz = z0 + R.tra(-0.4, 0.4);
    // le file guardano il decumano: quelle a nord verso sud, quelle a sud verso nord
    const P = posto(px, pz, 0, z0 < -366 ? 1 : -1);
    const y = quota(px, pz);
    // la colonna verso Calimala è dei cambiatori; il resto del cibo
    if (x > 75) { cambiatore(cant, P, y, R); continue; }
    if (R.vero(0.12)) continue;                       // qualche posto vuoto
    const nome = FILE[zs];
    posa(cant, nome, P, y, [1, 1, 1], true);
    tenda(cant, P, y, R);
    blocca(P, -1.05, 1.05, -0.5, 0.5);
    if (nome === 'banco_beccaio') blocca(P, 0.9, 1.5, -0.35, 0.3);
    if (R.vero(0.75)) figura(P, R.tra(-0.4, 0.4), -0.85, +1, VENDE, R.vero(0.5) ? 'parla' : 'fermo');
    if (R.vero(0.45)) figura(P, R.tra(-0.5, 0.5), 1.05, -1, COMPRA, R.scegli(['parla', 'guarda', 'attesa']));
  }
  S.suoni.push({ tipo: 'mercato', x: 60, z: -366, r: 45 });
}

/** La tenda sopra il banco del mercato, su quattro pali (come prima del 28 ottobre). */
function tenda(cant, P, y, R) {
  const W = 2.3, D = 1.7, hT = R.tra(2.1, 2.35), tinta = R.scegli(TELE);
  const M = new Matrix4().makeRotationY(P.theta).setPosition(P.x, y, P.z);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    cant.aggiungi(scatola(sx * W / 2 - 0.03, 0, sz * D / 2 - 0.03, sx * W / 2 + 0.03, hT, sz * D / 2 + 0.03), 'legnoScuro', LIV, M, [1, 1, 1], false);
  const t = scatola(-W / 2 - 0.12, 0, -D / 2 - 0.25, W / 2 + 0.12, 0.03, D / 2 + 0.25);
  t.applyMatrix4(new Matrix4().makeRotationX(R.tra(-0.12, 0.12)));
  t.translate(0, hT, 0);
  cant.aggiungi(t, 'intonaco', LIV, M, tinta);
}

/** La tavola del cambiatore, seduto dietro sulla panca; davanti chi cambia. */
function cambiatore(cant, P0, y, R) {
  // le tavole guardano verso Calimala (est), non il decumano
  const P = posto(P0.x, P0.z, 1, 0);
  posa(cant, 'banco_cambio', P, y);
  blocca(P, -0.85, 0.85, -0.95, 0.45);
  const [sx, sz] = P.p(0, -0.75);
  S.seduti.push({ x: sx, z: sz, y, dir: P.dir(+1), ruoli: ['mercante'] });
  if (R.vero(0.7)) figura(P, R.tra(-0.3, 0.3), 1.0, -1, ['mercante', 'cavaliere', 'popolano', 'mercantessa'], 'parla');
  S.suoni.push({ tipo: 'monete', x: P.x, z: P.z, r: 9 });
}

/* ------------------------------------------------- lotti e strade */
const fronte = L => [L.px + L.nz * L.W / 2, L.pz - L.nx * L.W / 2];   // il punto di mezzo della facciata

function distanzaSpezzata(x, z, pts) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}

/** I lotti con la facciata su una via (per nome), ordinati lungo la via. */
function lottiSullaVia(lotti, strade, nome, entro = 5.5) {
  const vie = strade.filter(s => s.nome === nome && !s.area);
  return lotti.filter(L => L.tipo === 'casa' && !L.retro && !L.interno && vie.some(s => distanzaSpezzata(...fronte(L), s.punti) < entro));
}

/** Un banco davanti alla facciata di un lotto: davanti verso la strada (-n). */
function davantiA(L, scosta) {
  const [mx, mz] = fronte(L);
  return posto(mx - L.nx * scosta, mz - L.nz * scosta, -L.nx, -L.nz);
}

/* ---------------------------------------------- i panni di Calimala */
function calimala(cant, lotti, strade, R) {
  const sulla = lottiSullaVia(lotti, strade, 'Calimala').filter(L => L.W >= 4.4);
  let n = 0;
  sulla.forEach((L, k) => {
    if (k % 2 || n >= 9) return;
    n++;
    const Pm = davantiA(L, 0), y = quota(...fronte(L));
    S.panni.push([Pm.x, Pm.z, Pm.fx, Pm.fz]);
    posa(cant, 'tenda_muro', Pm, y, R.scegli(TELE));
    const P = davantiA(L, 1.0);
    posa(cant, 'banco_panni', P, y);
    // le pezze sul banco, ciascuna del suo colore
    for (const bx of [-0.72, -0.24, 0.24, 0.72]) if (R.vero(0.85)) posa(cant, 'pezze', P, y, R.scegli(PANNI), true, bx + R.tra(-0.05, 0.05), R.tra(-0.08, 0.04), 0.86);
    blocca(Pm, -1.25, 1.25, 0, 1.5);
    figura(Pm, R.tra(-0.5, 0.5), 0.3, +1, ['mercante', 'artigiano'], R.vero(0.5) ? 'parla' : 'fermo');
    if (R.vero(0.6)) figura(Pm, R.tra(-0.6, 0.6), 2.1, -1, ['mercante', 'mercantessa', 'cavaliere', 'nobildonna', 'fantesca'], 'parla');
  });
  return n;
}

/* --------------------------------------- la fucina e il maniscalco */
function fucina(cant, lotti, strade, R) {
  // il lotto su via Por Santa Maria più vicino alla porta, fra la porta e Vacchereccia
  const cand = lottiSullaVia(lotti, strade, 'Via Por Santa Maria').filter(L => L.W >= 4.2)
    .map(L => ({ L, d: Math.hypot(fronte(L)[0] - 83, fronte(L)[1] + 172) })).sort((a, b) => a.d - b.d);
  if (!cand.length) return null;
  const L = cand[0].L, y = quota(...fronte(L));
  const P = davantiA(L, 1.4);
  posa(cant, 'fucina', P, y);
  blocca(P, -1.8, 1.8, -1.4, 1.35);
  figura(P, 0.4, -0.35, +1, ['artigiano'], 'fermo');            // il fabbro all'incudine
  figura(P, 1.15, 0.35, -1, ['ragazzo', 'artigiano'], 'guarda'); // il garzone alla tinozza
  // in strada, il cavallo da ferrare legato, e il maniscalco accanto
  // un po' più avanti lungo la strada, perché non nasconda la forgia a chi arriva
  const [hx, hz] = P.p(3.6, 3.0);
  S.cavalli.push({ tipo: 'palafreno', x: hx, z: hz, dir: Math.atan2(P.lx, P.lz) });
  figura(P, 3.1, 2.3, -1, ['artigiano', 'popolano'], 'parla');
  S.suoni.push({ tipo: 'incudine', x: P.x, z: P.z, r: 30 });
  return [P.x, P.z];
}

/* ------------------------------------------------------- i notai */
function notai(cant, lotti, strade, R) {
  const out = [];
  // davanti alla casa del notaio del gioco, in via delle Terme (dati/luoghi.js, casa-del-notaio)
  const casa = lotti.filter(L => L.tipo === 'casa' && !L.retro && !L.interno)
    .map(L => ({ L, d: Math.hypot(fronte(L)[0] + 26.6, fronte(L)[1] + 163.2) })).sort((a, b) => a.d - b.d)[0];
  if (casa && casa.d < 12) {
    const L = casa.L, y = quota(...fronte(L));
    const Pm = davantiA(L, 0), P = davantiA(L, 1.0);
    posa(cant, 'tenda_muro', Pm, y, [0.9, 0.86, 0.78]);
    posa(cant, 'banco_notaio', P, y);
    blocca(Pm, -1.25, 1.25, 0, 1.5);
    const [sx, sz] = P.p(0, -0.75);
    S.seduti.push({ x: sx, z: sz, y: y + 0.03, dir: P.dir(+1), ruoli: ['mercante', 'chierico'] });
    figura(Pm, 0.3, 2.2, -1, ['popolano', 'popolana', 'mercante'], 'parla');
    out.push([P.x, P.z]);
  }
  // all'angolo sud-ovest del mercato, all'aperto
  const P = posto(33.5, -339, 0, -1), y = quota(33.5, -339);
  posa(cant, 'banco_notaio', P, y);
  blocca(P, -0.55, 0.55, -0.95, 0.35);
  const [sx, sz] = P.p(0, -0.75);
  S.seduti.push({ x: sx, z: sz, y, dir: P.dir(+1), ruoli: ['mercante', 'chierico'] });
  figura(P, -0.3, 1.0, -1, ['artigiano', 'mercante'], 'parla');
  figura(P, 0.45, 1.25, -1, ['popolana', 'mercantessa'], 'attesa');
  out.push([P.x, P.z]);
  return out;
}

/**
 * Costruisce i mestieri nella variante «feriale» del cantiere. Va chiamata
 * dopo la lottizzazione (le botteghe stanno davanti alle case).
 */
export function costruisciMestieri(cant, griglia, lotti, strade) {
  const R = rng(1202);
  Object.assign(S, { fermi: [], seduti: [], cavalli: [], rettangoli: [], suoni: [], panni: [], vecchie: null, feriale: false });
  let n = 0, posti = {};
  cant.inVariante('feriale', () => {
    mercato(cant, R);
    n = calimala(cant, lotti, strade, R);
    posti.fucina = fucina(cant, lotti, strade, R);
    posti.notai = notai(cant, lotti, strade, R);
  });
  posti.panni = S.panni;
  return { panni: n, figure: S.fermi.length + S.seduti.length, posti };
}

/** Chi sta ai banchi, per la giornata: nessuno nei giorni di festa. */
export function figureDeiMestieri(giornata) {
  if (giornata.festa) return { fermi: [], seduti: [], cavalliFermi: [] };
  return { fermi: S.fermi, seduti: S.seduti, cavalliFermi: S.cavalli };
}

/** I suoni dei mestieri, per suoni.js: solo nei giorni di lavoro. */
export const suoniDeiMestieri = giornata => (giornata.festa ? [] : S.suoni);

/**
 * Nei giorni di lavoro i banchi occupano la strada; nei giorni di festa la
 * lasciano libera. Si ricordano le celle di prima per rimetterle.
 */
export function grigliaDeiMestieri(griglia, festa) {
  const feriale = !festa;
  if (feriale === S.feriale) return;
  if (feriale) {
    S.vecchie = [];
    for (const r of S.rettangoli) griglia.rettangolo(r.cx, r.cz, r.ux, r.uz, r.a, r.b, (i, j) => {
      const k = j * griglia.n + i;
      if (griglia.c[k] !== MONUMENTO) { S.vecchie.push(k, griglia.c[k]); griglia.c[k] = MONUMENTO; }
    });
  } else if (S.vecchie) {
    for (let q = S.vecchie.length - 2; q >= 0; q -= 2) griglia.c[S.vecchie[q]] = S.vecchie[q + 1];
    S.vecchie = null;
  }
  S.feriale = feriale;
}
