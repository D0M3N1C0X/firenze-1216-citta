import { Matrix4 } from 'three';
import { FOSSATO, IPOTESI_SUD, MURO, PALIZZATA, PORTE } from '../dati/cerchia.js';
import { falda, muro, scatola } from './cantiere.js';
import { EDIFICIO, FIUME, LIBERO, MONUMENTO, PIAZZA, STRADA } from './griglia.js';
import { porta } from './monumenti.js';
import { rng } from './rumore.js';
import { quota } from './terreno.js';

/* =====================================================================
   LE MURA DEL 1172–1175

   Il tracciato viene da dati/cerchia.js. Qui si costruisce:
   - il muro della riva destra, in pietre di fiume, con i merli verso
     fuori; alto 10 m e spesso 2,2 (ipotesi: la fonte non dà misure);
   - le porte, torri come Porta Santa Maria (il modello di Blender), e le
     postierle, varchi stretti nel muro;
   - il fossato lungo via Verdi e via de' Benci, l'unico attestato;
   - in Oltrarno la palizzata, che si interrompe dove una casa fa da muro,
     e le porte di legno;
   - le due ipotesi del lato sud, visibili solo con l'interruttore Certezza.

   Il muro e le porte vanno costruiti prima delle case (costruisciMura), la
   palizzata dopo, perché deve sapere dove stanno le case (costruisciPalizzata).
   ===================================================================== */

const H = 10, SP = 2.2;                       // altezza e spessore del muro: ipotesi
const TINTA = [0.9, 0.88, 0.83];
const PORTA = { W: 9.5, D: 7 };               // la torre di porta di monumenti.js
const POSTIERLA = { W: 6, luce: 2.4, alta: 3.4 };

/** Matrice di un tratto: x lungo (ux, uz), z verso dentro, origine nel centro. */
function tratto(cx, cz, ux, uz) {
  return new Matrix4().makeRotationY(Math.atan2(-uz, ux)).setPosition(cx, quota(cx, cz), cz);
}

/** Gli intervalli di ogni lato del muro da lasciare vuoti per porte e postierle. */
function varchi(a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  const out = [];
  for (const p of PORTE) {
    if (!p.pos || p.lato === 'oltrarno') continue;
    const t = ((p.pos[0] - a[0]) * dx + (p.pos[1] - a[1]) * dz) / L;
    const d = Math.abs((p.pos[0] - a[0]) * dz - (p.pos[1] - a[1]) * dx) / L;
    if (d > 3 || t < -6 || t > L + 6) continue;
    const g = (p.tipo === 'porta' ? PORTA.W : POSTIERLA.W) / 2 - 0.05;
    out.push([t - g, t + g]);
  }
  return out.sort((u, v) => u[0] - v[0]);
}

/** Un pezzo di muro merlato lungo l, centrato in (cx, cz). */
function pezzoDiMuro(cant, griglia, cx, cz, ux, uz, l) {
  const M = tratto(cx, cz, ux, uz);
  cant.aggiungi(scatola(-l / 2, -1.5, -SP / 2, l / 2, H, SP / 2), 'pietrame', 'ipotesi', M, TINTA);
  // i merli sul filo esterno; il cammino di ronda resta dentro
  for (let m = -l / 2 + 0.35; m < l / 2 - 0.8; m += 1.7)
    cant.aggiungi(scatola(m, H, -SP / 2, m + 0.95, H + 1.2, -SP / 2 + 0.55), 'pietrame', 'ipotesi', M, [0.84, 0.82, 0.78]);
  griglia.rettangolo(cx, cz, ux, uz, l / 2, SP / 2 + 0.4, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
}

/** La postierla: un varco ad arco nel muro, largo 2,4 m. */
function postierla(cant, griglia, p) {
  const [ux, uz] = p.lungo, [x, z] = p.pos;
  const M = tratto(x, z, ux, uz);
  const W = POSTIERLA.W;
  const g = muro(W, -1.5, H, SP, [{ x: W / 2, y: 0, w: POSTIERLA.luce, h: POSTIERLA.alta, arco: true, tipo: 'porta' }]);
  g.translate(-W / 2, 0, -SP / 2);
  cant.aggiungi(g, 'pietrame', 'ipotesi', M, TINTA);
  for (let m = -W / 2 + 0.35; m < W / 2 - 0.8; m += 1.7)
    cant.aggiungi(scatola(m, H, -SP / 2, m + 0.95, H + 1.2, -SP / 2 + 0.55), 'pietrame', 'ipotesi', M, [0.84, 0.82, 0.78]);
  griglia.rettangolo(x, z, ux, uz, W / 2, SP / 2 + 0.4, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
  griglia.rettangolo(x, z, ux, uz, POSTIERLA.luce / 2 - 0.3, SP / 2 + 1.2, (i, j) => { griglia.c[j * griglia.n + i] = STRADA; });
}

/** Il fossato: l'acqua ferma, un metro e mezzo sotto le sponde. */
function fossato(cant, griglia) {
  for (const [[ax, az], [bx, bz]] of FOSSATO) {
    const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
    if (l < 0.2) continue;
    const cx = (ax + bx) / 2, cz = (az + bz) / 2, ux = dx / l, uz = dz / l;
    const M = new Matrix4().makeRotationY(Math.atan2(-uz, ux)).setPosition(cx, quota(cx, cz) + 1.0, cz);
    cant.aggiungi(scatola(-l / 2 - 0.4, -0.05, -3, l / 2 + 0.4, 0, 3), 'fosso', 'ipotesi', M, [1, 1, 1], false);
    griglia.rettangolo(cx, cz, ux, uz, l / 2 + 0.3, 3.2, (i, j) => { const k = j * griglia.n + i; if (griglia.c[k] !== STRADA) griglia.c[k] = FIUME; });
  }
}

/** Il muro, le porte e le postierle della riva destra, e il fossato. Prima delle case. */
export function costruisciMura(cant, griglia) {
  let pezzi = 0;
  for (let k = 0; k + 1 < MURO.length; k++) {
    const a = MURO[k], b = MURO[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.3) continue;
    const ux = dx / L, uz = dz / L;
    // i tratti fra un varco e l'altro, allungati di mezzo spessore per chiudere gli angoli
    let s0 = k === 0 ? 0 : -SP / 2;
    const fine = k + 2 === MURO.length ? L : L + SP / 2;
    for (const [v0, v1] of [...varchi(a, b), [fine, fine]]) {
      const s1 = Math.min(v0, fine);
      // pezzi di al più 8 m, perché il muro segua il terreno
      for (let s = s0; s1 - s > 0.4;) {
        const l = Math.min(8, s1 - s), m = s + l / 2;
        pezzoDiMuro(cant, griglia, a[0] + ux * m, a[1] + uz * m, ux, uz, l + 0.02);
        s += l; pezzi++;
      }
      s0 = Math.max(s0, v1);
    }
  }
  for (const p of PORTE) {
    if (!p.pos || p.lato === 'oltrarno') continue;
    if (p.tipo === 'porta') porta(cant, griglia, p.pos, p.dir); else postierla(cant, griglia, p);
  }
  spiazzi(griglia);
  fossato(cant, griglia);
  return pezzi;
}

/**
 * Davanti a ogni porta, fuori, uno spiazzo libero di una decina di metri: i
 * borghi non ci costruiscono, e chi esce non si trova una casa davanti.
 */
function spiazzi(griglia) {
  for (const p of PORTE) {
    if (!p.pos) continue;
    const g = p.tipo === 'porta' ? 6 : 3.5, x = p.pos[0] - p.dir[0] * 9, z = p.pos[1] - p.dir[1] * 9;
    griglia.rettangolo(x, z, p.lungo[0], p.lungo[1], g, 7, (i, j) => { const k = j * griglia.n + i; if (griglia.c[k] === LIBERO) griglia.c[k] = STRADA; });
  }
}

/* ------------------------------------------------------- Oltrarno */

/** La porta di legno d'Oltrarno: due ritti, l'architrave, un tettuccio, i battenti aperti. */
function portaDiLegno(cant, griglia, p) {
  const [ux, uz] = p.lungo, [x, z] = p.pos;
  const M = tratto(x, z, ux, uz), LIV = 'ipotesi', luce = 3.6, alt = 4.4;
  for (const s of [-1, 1]) {
    cant.aggiungi(scatola(s * (luce / 2 + 0.25) - 0.25, -0.8, -0.3, s * (luce / 2 + 0.25) + 0.25, alt + 0.9, 0.3), 'legnoScuro', LIV, M);
    // il battente, aperto verso dentro
    cant.aggiungi(scatola(s * luce / 2 - (s > 0 ? 0.08 : -0.08) - 0.04, 0.05, 0.3, s * luce / 2 - (s > 0 ? 0.08 : -0.08) + 0.04, alt - 0.3, 0.3 + luce / 2 - 0.1), 'legno', LIV, M);
  }
  cant.aggiungi(scatola(-luce / 2 - 0.6, alt, -0.35, luce / 2 + 0.6, alt + 0.45, 0.35), 'legnoScuro', LIV, M);
  cant.aggiungi(falda(-luce / 2 - 0.9, luce / 2 + 0.9, alt + 0.4, -1.1, alt + 1.25, 0), 'coppi', LIV, M);
  cant.aggiungi(falda(-luce / 2 - 0.9, luce / 2 + 0.9, alt + 0.4, 1.1, alt + 1.25, 0), 'coppi', LIV, M);
  for (const s of [-1, 1]) griglia.rettangolo(x + ux * s * (luce / 2 + 0.25), z + uz * s * (luce / 2 + 0.25), ux, uz, 0.35, 0.4, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
  griglia.rettangolo(x, z, ux, uz, luce / 2 - 0.2, 1.5, (i, j) => { griglia.c[j * griglia.n + i] = STRADA; });
}

/**
 * La palizzata d'Oltrarno: pali appuntiti, uno ogni 32 cm. Dove c'è una
 * casa, il muro è la casa: le pareti verso fuori non hanno aperture (fonte).
 * Si costruisce dopo le case.
 */
export function costruisciPalizzata(cant, griglia) {
  const R = rng(1173);
  const porte = PORTE.filter(p => p.pos && p.lato === 'oltrarno');
  let pali = 0;
  for (let k = 0; k + 1 < PALIZZATA.length; k++) {
    const a = PALIZZATA[k], b = PALIZZATA[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.3) continue;
    const ux = dx / L, uz = dz / L;
    const ang = Math.atan2(-uz, ux);
    for (let s = 0.16; s < L; s += 0.32) {
      const x = a[0] + ux * s, z = a[1] + uz * s;
      const v = griglia.get(x, z);
      if (v === EDIFICIO || v === FIUME || v > 99) continue;
      if (porte.some(p => Math.hypot(p.pos[0] - x, p.pos[1] - z) < 2.6)) continue;
      const h = R.tra(3.6, 4.4), y = quota(x, z);
      const M = new Matrix4().makeRotationY(ang + R.tra(-0.15, 0.15)).setPosition(x, y, z);
      cant.aggiungi(scatola(-0.14, -0.6, -0.13, 0.14, h, 0.13), 'legno', 'ipotesi', M, [R.tra(0.75, 0.95), R.tra(0.72, 0.9), R.tra(0.68, 0.85)], false);
      cant.aggiungi(punta(0.28, 0.26, h, 0.35), 'legno', 'ipotesi', M, [0.7, 0.66, 0.6], false);
      if (v === LIBERO || v === STRADA || v === PIAZZA) griglia.rettangolo(x, z, ux, uz, 0.2, 0.25, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
      pali++;
    }
  }
  for (const p of porte) portaDiLegno(cant, griglia, p);
  return pali;
}

/** La punta di un palo: piramide a base rettangolare. */
function punta(w, d, y, h) {
  const g = scatola(-w / 2, y, -d / 2, w / 2, y + 0.001, d / 2);
  const p = g.attributes.position;
  // gli otto vertici in alto si stringono al centro
  for (let i = 0; i < p.count; i++) if (p.getY(i) > y) { p.setX(i, 0); p.setZ(i, 0); p.setY(i, y + h); }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------ il lato sud: due ipotesi */

/**
 * Le due linee possibili del muro fra piazza dei Giudici e piazza Goldoni.
 * Sono pareti trasparenti, visibili solo con l'interruttore Certezza
 * (cantiere: variante «certezza»); non occupano la griglia.
 */
export function ipotesiLatoSud(cant) {
  cant.inVariante('certezza', () => {
    for (const linea of [IPOTESI_SUD.fiume, IPOTESI_SUD.vie]) for (let k = 0; k + 1 < linea.length; k++) {
      const a = linea[k], b = linea[k + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.3) continue;
      for (let s = 0; s < L; s += 8) {
        const l = Math.min(8, L - s), m = s + l / 2;
        const M = tratto(a[0] + dx / L * m, a[1] + dz / L * m, dx / L, dz / L);
        cant.aggiungi(scatola(-l / 2, -0.5, -0.6, l / 2 + 0.02, H, 0.6), 'muroIncerto', 'ipotesi', M, [1, 1, 1], false);
      }
    }
  });
}
