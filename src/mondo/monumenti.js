import {
  CapsuleGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, BufferGeometry,
  Matrix4, Shape, Vector3
} from 'three';
import { IMPRONTE } from '../dati/osm.js';
import { PORTE as PORTE_CERCHIA, TRACCIATO } from '../dati/cerchia.js';
import { falda, matriceLotto, muro, piramide, scatola, tamponamento, timpano, uvMetri } from './cantiere.js';
import { torre } from './edifici.js';
import { MONUMENTO, PONTE, STRADA } from './griglia.js';
import { LIVELLO_ACQUA, distanzaFiume, quota } from './terreno.js';
import { rng } from './rumore.js';

/* =====================================================================
   MONUMENTI E PUNTI FERMI

   Qui sta ciò che ha un nome. Il livello di certezza di ogni pezzo è
   quello della FORMA (vedi dati/luoghi.js): la presenza può essere
   documentata anche quando l'aspetto è un'ipotesi.
   ===================================================================== */

/* ------------------------------------------------ rettangolo minimo */
/** Rettangolo orientato di area minima che contiene il poligono. */
export function rettangoloMinimo(pts) {
  let best = null;
  for (let g = 0; g < 90; g += 0.5) {
    const a = g * Math.PI / 180, ux = Math.cos(a), uz = Math.sin(a), vx = -uz, vz = ux;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const [x, z] of pts) {
      const u = x * ux + z * uz, v = x * vx + z * vz;
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area) best = { area, ux, uz, vx, vz, u0, u1, v0, v1 };
  }
  const b = best, cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2;
  let L = { cx: cu * b.ux + cv * b.vx, cz: cu * b.uz + cv * b.vz, ux: b.ux, uz: b.uz, a: (b.u1 - b.u0) / 2, b: (b.v1 - b.v0) / 2 };
  if (L.b > L.a) L = { cx: L.cx, cz: L.cz, ux: -L.uz, uz: L.ux, a: L.b, b: L.a };
  return L;
}

/* =============================================================== PONTE */
// Asse: dal capo in città (A) al capo in Oltrarno (B), lungo la linea di
// OpenStreetMap del ponte di oggi. Larghezza e arcate: ipotesi.
const A = [8.4, -26.4], B = [-45.6, 74.4];
const LARGH_PONTE = 7.2;
export const PONTE_ASSE = (() => {
  const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz);
  return { A, B, L, dx: dx / L, dz: dz / L, wx: -dz / L, wz: dx / L };
})();

/** Quota dell'impalcato a una distanza s dal capo in città. */
export function quotaPonte(s) {
  const P = PONTE_ASSE, t = Math.max(0, Math.min(1, s / P.L));
  return 0.15 + 1.5 * Math.sin(Math.PI * t);
}

/** Se (x, z) è sul ponte restituisce la quota dell'impalcato, altrimenti null. */
export function sulPonte(x, z) {
  const P = PONTE_ASSE;
  const px = x - P.A[0], pz = z - P.A[1];
  const s = px * P.dx + pz * P.dz, w = px * P.wx + pz * P.wz;
  if (s < -0.5 || s > P.L + 0.5 || Math.abs(w) > LARGH_PONTE / 2 - 0.35) return null;
  return quotaPonte(s);
}

function ponte(cant, griglia) {
  const P = PONTE_ASSE, LIV = 'ipotesi';
  // dove finisce la terra e comincia l'acqua, lungo l'asse
  let s1 = 0, s2 = P.L;
  for (let s = 0; s < P.L; s += 0.25) if (distanzaFiume(P.A[0] + P.dx * s, P.A[1] + P.dz * s) < 0) { s1 = s; break; }
  for (let s = P.L; s > 0; s -= 0.25) if (distanzaFiume(P.A[0] + P.dx * s, P.A[1] + P.dz * s) < 0) { s2 = s; break; }
  // cinque arcate: il ponte ricostruito dopo il crollo del 1177 (DOSSIER-TOPOGRAFICO.md, § 3)
  const n = 5, pila = 3.4;
  const luce = (s2 - s1 - (n - 1) * pila) / n;
  const imposta = LIVELLO_ACQUA + 0.6;

  // prospetto laterale: profilo dell'impalcato meno le arcate ribassate
  const sh = new Shape();
  const N = 40, fondo = LIVELLO_ACQUA - 5;
  sh.moveTo(0, fondo);
  sh.lineTo(P.L, fondo);
  for (let i = N; i >= 0; i--) { const s = P.L * i / N; sh.lineTo(s, quotaPonte(s) - 0.35); }
  sh.lineTo(0, fondo);
  const piedritti = [];
  for (let k = 0; k < n; k++) {
    const x0 = s1 + k * (luce + pila), x1 = x0 + luce;
    const xm = (x0 + x1) / 2, chiave = quotaPonte(xm) - 1.45;
    const f = chiave - imposta, c = luce / 2;
    const r = (c * c + f * f) / (2 * f), yc = chiave - r;
    const a0 = Math.asin(Math.min(1, (imposta - yc) / r));
    const h = new Shape();
    h.moveTo(x0, fondo + 0.5);
    h.lineTo(x1, fondo + 0.5);
    h.lineTo(x1, imposta);
    h.absarc(xm, yc, r, a0, Math.PI - a0, false);
    h.lineTo(x0, fondo + 0.5);
    sh.holes.push(h);
    if (k > 0) piedritti.push(x0 - pila / 2);
  }
  const g = uvMetri(new ExtrudeGeometry(sh, { depth: LARGH_PONTE, bevelEnabled: false, curveSegments: 16 }).toNonIndexed());
  // base locale: x lungo l'asse, y in alto, z di traverso (verso valle)
  const M = new Matrix4().makeBasis(new Vector3(P.dx, 0, P.dz), new Vector3(0, 1, 0), new Vector3(P.wx, 0, P.wz))
    .setPosition(P.A[0] - P.wx * LARGH_PONTE / 2, 0, P.A[1] - P.wz * LARGH_PONTE / 2);
  cant.aggiungi(g, 'conci', LIV, M, [0.94, 0.92, 0.88]);

  // rostri a monte (z < 0) e a valle (z > larghezza) delle pile
  for (const s of piedritti) for (const lato of [-1, 1]) {
    const tri = new Shape();
    tri.moveTo(-pila / 2, 0); tri.lineTo(pila / 2, 0); tri.lineTo(0, pila * 0.9); tri.lineTo(-pila / 2, 0);
    const r = new ExtrudeGeometry(tri, { depth: imposta + 1.6 - fondo, bevelEnabled: false }).toNonIndexed();
    r.rotateX(-Math.PI / 2);            // punta verso −z, estrusione verso l'alto
    if (lato > 0) { r.scale(1, 1, -1); invertiAvvolgimento(r); }
    r.translate(s, fondo, lato > 0 ? LARGH_PONTE : 0);
    cant.aggiungi(uvMetri(r), 'conci', LIV, M, [0.9, 0.88, 0.84]);
  }

  // impalcato lastricato e parapetti che seguono la schiena d'asino
  const pos = [], uv = [];
  const W2 = LARGH_PONTE / 2 - 0.4;
  for (let i = 0; i < N; i++) {
    const sa = P.L * i / N, sb = P.L * (i + 1) / N, ya = quotaPonte(sa), yb = quotaPonte(sb);
    const z0 = LARGH_PONTE / 2 - W2, z1 = LARGH_PONTE / 2 + W2;
    pos.push(sa, ya, z0, sa, ya, z1, sb, yb, z1, sa, ya, z0, sb, yb, z1, sb, yb, z0);
    uv.push(sa, z0, sa, z1, sb, z1, sa, z0, sb, z1, sb, z0);
    for (const [q0, q1] of [[0, 0.4], [LARGH_PONTE - 0.4, LARGH_PONTE]]) {
      const pg = scatola(sa, ya - 0.4, q0, sb + 0.02, ya + 1.0, q1);
      // inclina il tratto di parapetto
      const ang = Math.atan2(yb - ya, sb - sa);
      pg.translate(-sa, -ya, 0); pg.applyMatrix4(new Matrix4().makeRotationZ(ang)); pg.translate(sa, ya, 0);
      cant.aggiungi(pg, 'conci', LIV, M, [0.96, 0.94, 0.9]);
    }
  }
  const imp = new BufferGeometry();
  imp.setAttribute('position', new Float32BufferAttribute(pos, 3));
  imp.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  imp.computeVertexNormals();
  // le normali devono guardare in su
  if (imp.attributes.normal.getY(0) < 0) invertiAvvolgimento(imp), imp.computeVertexNormals();
  cant.aggiungi(imp, 'lastre', LIV, M);

  // griglia: il ponte si percorre, l'acqua sotto no
  griglia.spezzata([P.A, P.B], LARGH_PONTE - 0.6, PONTE, true);
  return { s1, s2 };
}

function invertiAvvolgimento(g) {
  for (const a of Object.values(g.attributes)) {
    const s = a.itemSize;
    for (let i = 0; i < a.count; i += 3) for (let k = 0; k < s; k++) {
      const t = a.array[(i + 1) * s + k]; a.array[(i + 1) * s + k] = a.array[(i + 2) * s + k]; a.array[(i + 2) * s + k] = t;
    }
    a.needsUpdate = true;
  }
}

/* ======================================================= LA PIETRA DI MARTE */
// Posizione: a capo del ponte, dal lato della città (documentato). Lato
// a monte e forma della statua: ipotesi. Dante la dice «scema», mutila.
export const MARTE = (() => {
  const P = PONTE_ASSE;
  return [P.A[0] + P.dx * 2.2 - P.wx * (LARGH_PONTE / 2 + 1.6), P.A[1] + P.dz * 2.2 - P.wz * (LARGH_PONTE / 2 + 1.6)];
})();

function marte(cant, griglia) {
  const [x, z] = MARTE, y = quota(x, z);
  const P = PONTE_ASSE;
  // la statua guarda il ponte
  const M = new Matrix4().makeRotationY(Math.atan2(P.dx, P.dz)).setPosition(x, y, z);
  const LIV = 'ipotesi';
  const pietra = [0.82, 0.8, 0.74];
  cant.aggiungi(scatola(-0.95, -0.5, -0.95, 0.95, 0.45, 0.95), 'conci', LIV, M, [0.92, 0.9, 0.86]);
  cant.aggiungi(scatola(-0.7, 0.45, -0.7, 0.7, 3.1, 0.7), 'conci', LIV, M, [0.95, 0.93, 0.88]);
  cant.aggiungi(scatola(-0.85, 3.1, -0.85, 0.85, 3.4, 0.85), 'lastre', LIV, M, [0.95, 0.93, 0.9]);
  // il cavallo, senza testa e con le zampe spezzate
  const pezzo = (geo, mtx) => { const g = uvMetri(geo.toNonIndexed()); g.applyMatrix4(mtx); cant.aggiungi(g, 'marmo', LIV, M, pietra); };
  pezzo(new CapsuleGeometry(0.34, 1.05, 4, 10), new Matrix4().makeRotationX(Math.PI / 2).setPosition(0, 4.15, 0));
  pezzo(new CapsuleGeometry(0.17, 0.45, 4, 8), new Matrix4().makeRotationX(Math.PI / 2 - 0.75).setPosition(0, 4.55, 0.78));
  for (const [lx, lz, h] of [[-0.2, 0.5, 0.55], [0.2, 0.5, 0.35], [-0.2, -0.5, 0.6], [0.2, -0.5, 0.45]])
    pezzo(new CylinderGeometry(0.09, 0.11, h, 8), new Matrix4().makeTranslation(lx, 3.4 + h / 2, lz));
  // il cavaliere: busto mutilo
  pezzo(new CapsuleGeometry(0.2, 0.42, 4, 8), new Matrix4().makeRotationX(-0.12).setPosition(0, 4.95, -0.05));
  pezzo(new CylinderGeometry(0.11, 0.14, 0.5, 8), new Matrix4().makeRotationZ(0.5).setPosition(-0.28, 4.62, 0.0));
  griglia.rettangolo(x, z, 1, 0, 1.0, 1.0, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
}

/* ============================================================= CHIESE */
/**
 * Chiesa basilicale sul rettangolo minimo di un'impronta. La facciata va
 * dal lato del punto «verso» (la piazza o la strada su cui si apre).
 */
function chiesa(cant, griglia, imp, opz) {
  const R = rng(opz.seme || 7);
  const LIV = opz.livello;
  const O = rettangoloMinimo(imp);
  // asse lungo: facciata dal lato più vicino a «verso»
  let ux = O.ux, uz = O.uz;
  const fx = O.cx - ux * O.a, fz = O.cz - uz * O.a, bx = O.cx + ux * O.a, bz = O.cz + uz * O.a;
  if (Math.hypot(bx - opz.verso[0], bz - opz.verso[1]) < Math.hypot(fx - opz.verso[0], fz - opz.verso[1])) { ux = -ux; uz = -uz; }
  const lungo = 2 * O.a, largo = 2 * O.b;
  // lotto: fronte = facciata; x lungo la facciata, z verso l'abside
  const nx = ux, nz = uz;
  const tx = nz, tz = -nx;
  const px = O.cx - ux * O.a - tx * O.b, pz = O.cz - uz * O.a - tz * O.b;
  const y = quota(O.cx, O.cz);
  const M = matriceLotto(px, y, pz, nx, nz);
  const t = 0.9, H = opz.altezza || R.tra(12, 15);
  const tinta = [0.95, 0.93, 0.88];
  const tre = opz.navate === 3 && largo > 14;
  const Hn = H, Ha = tre ? H * 0.62 : H, wN = tre ? largo * 0.46 : largo, xa = (largo - wN) / 2;

  // facciata: portale, oculo, timpano
  const portale = { x: largo / 2, y: 0, w: 2.3, h: 4.6, arco: true, tipo: 'porta' };
  const ap = [portale];
  if (tre) for (const xs of [xa / 2, largo - xa / 2]) ap.push({ x: xs, y: 0, w: 1.4, h: 3.2, arco: true, tipo: 'porta' });
  ap.push({ x: largo / 2, y: Hn - 4.2, w: 1.0, h: 1.9, arco: true, tipo: 'finestra' });
  const f = muro(largo, -1.2, Ha, t, ap.filter(a => a.y + a.h < Ha - 0.3));
  cant.aggiungi(f, 'conci', LIV, M, tinta);
  if (tre) {
    const fc = muro(wN, Ha, Hn, t, ap.filter(a => a.y + a.h >= Ha - 0.3).map(a => ({ ...a, x: a.x - xa })));
    fc.translate(xa, 0, 0);
    cant.aggiungi(fc, 'conci', LIV, M, tinta);
  }
  for (const a of ap) {
    const g = tamponamento(a, 0.1); g.translate(0, 0, t * 0.55);
    cant.aggiungi(g, a.tipo === 'porta' ? 'legnoScuro' : 'scuro', LIV, M);
  }
  // timpano della navata centrale
  const pend = 0.42, hT = wN / 2 * pend;
  const tg = timpano(wN, Hn, hT, t); tg.translate(xa, 0, 0);
  cant.aggiungi(tg, 'conci', LIV, M, tinta);
  // fianchi con monofore alte
  const mono = [];
  for (let s = 5; s < lungo - 4; s += 5.5) mono.push({ x: s, y: Hn - 4.5, w: 0.7, h: 2.0, arco: true, tipo: 'finestra' });
  for (const lato of [0, 1]) {
    const x0 = lato ? largo : 0;
    const g = muro(lungo - 2 * t, -1.2, Ha, t, tre ? [] : mono.map(a => ({ ...a, x: a.x - t })));
    g.applyMatrix4(new Matrix4().makeRotationY(lato ? -Math.PI / 2 : Math.PI / 2));
    g.translate(x0, 0, lato ? t : lungo - t);
    cant.aggiungi(g, 'conci', LIV, M, tinta);
    if (tre) {
      const c = muro(lungo, Ha, Hn, t, mono);
      c.applyMatrix4(new Matrix4().makeRotationY(lato ? -Math.PI / 2 : Math.PI / 2));
      c.translate(lato ? largo - xa : xa, 0, lato ? 0 : lungo);
      cant.aggiungi(c, 'conci', LIV, M, tinta);
      // tetti a spiovente delle navatelle: dalla gronda esterna al cleristorio
      const gTett = falda(-0.4, lungo + 0.4, Ha - 0.25, 0, Ha + xa * 0.32, xa + 0.4);
      gTett.applyMatrix4(new Matrix4().makeRotationY(lato ? -Math.PI / 2 : Math.PI / 2));
      gTett.translate(lato ? largo + 0.4 : -0.4, 0, lato ? 0 : lungo);
      cant.aggiungi(gTett, 'coppi', LIV, M, [0.95, 0.92, 0.9]);
    }
  }
  // fondo (dove si apre l'abside)
  cant.aggiungi(scatola(0, -1.2, lungo - t, largo, Hn, lungo), 'conci', LIV, M, tinta);
  const tgB = timpano(wN, Hn, hT, t); tgB.translate(xa, 0, lungo - t);
  cant.aggiungi(tgB, 'conci', LIV, M, tinta);
  // abside semicircolare
  const rA = Math.min(wN * 0.38, 5.5);
  const abs = uvMetri(new CylinderGeometry(rA, rA, Hn * 0.72 + 1.2, 18, 1, false, -Math.PI / 2, Math.PI).toNonIndexed());
  abs.translate(largo / 2, (Hn * 0.72 + 1.2) / 2 - 1.2, lungo);
  cant.aggiungi(abs, 'conci', LIV, M, tinta);
  const absT = uvMetri(new ConeGeometry(rA + 0.4, rA * 0.45, 18, 1, false, -Math.PI / 2, Math.PI).toNonIndexed());
  absT.translate(largo / 2, Hn * 0.72 + rA * 0.225, lungo);
  cant.aggiungi(absT, 'coppi', LIV, M);
  // tetto della navata
  cant.aggiungi(falda(-0.3, lungo + 0.3, Hn - 0.6 * pend, -0.6, Hn + hT, wN / 2).applyMatrix4(new Matrix4().makeRotationY(Math.PI / 2)).translate(xa, 0, lungo), 'coppi', LIV, M);
  cant.aggiungi(falda(-0.3, lungo + 0.3, Hn - 0.6 * pend, wN + 0.6, Hn + hT, wN / 2).applyMatrix4(new Matrix4().makeRotationY(Math.PI / 2)).translate(xa, 0, lungo), 'coppi', LIV, M);
  // il buio dell'interno, visto dalle aperture: con tre navate, sopra i tetti
  // delle navatelle resta dentro il cleristorio, o spunterebbe nero dai tetti
  if (tre) {
    cant.aggiungi(scatola(t, -0.5, t + 0.3, largo - t, Ha - 0.3, lungo - t - 0.3), 'scuro', LIV, M, [1, 1, 1], false);
    cant.aggiungi(scatola(xa + t, Ha - 0.3, t + 0.3, largo - xa - t, Hn - 0.3, lungo - t - 0.3), 'scuro', LIV, M, [1, 1, 1], false);
  } else cant.aggiungi(scatola(t, -0.5, t + 0.3, largo - t, Hn - 0.3, lungo - t - 0.3), 'scuro', LIV, M, [1, 1, 1], false);
  // campanile a vela sulla facciata, a volte
  if (opz.vela) {
    const v = muro(3.2, Hn + hT - 0.6, Hn + hT + 3.4, 0.6, [{ x: 1.6, y: Hn + hT + 0.3, w: 1.1, h: 2.2, arco: true, tipo: 'finestra' }]);
    v.translate(largo / 2 - 1.6, 0, t * 0.2);
    cant.aggiungi(v, 'conci', LIV, M, tinta);
  }
  griglia.poligono(imp, MONUMENTO);
  griglia.rettangolo(O.cx, O.cz, O.ux, O.uz, O.a + 0.3, O.b + 0.3, (i, j) => { const k = j * griglia.n + i; if (griglia.c[k] === 0) griglia.c[k] = MONUMENTO; });
}

/* ===================================================== PORTA SANTA MARIA */
function porta(cant, griglia, [x, z], dir) {
  const LIV = 'ipotesi';
  const W = 9.5, D = 7, H = 17;
  const nx = dir[0], nz = dir[1], tx = nz, tz = -nx;
  const px = x - tx * W / 2 - nx * D / 2, pz = z - tz * W / 2 - nz * D / 2;
  const M = matriceLotto(px, quota(x, z), pz, nx, nz);
  const arco = { x: W / 2, y: 0, w: 4.2, h: 6.8, arco: true, tipo: 'porta' };
  const tinta = [0.93, 0.92, 0.88];
  cant.aggiungi(muro(W, -1.2, H, 1.2, [arco, { x: W / 2, y: 10, w: 0.8, h: 1.4, arco: true }]), 'conci', LIV, M, tinta);
  const retro = muro(W, -1.2, H, 1.2, [arco]);
  retro.applyMatrix4(new Matrix4().makeRotationY(Math.PI)); retro.translate(W, 0, D);
  cant.aggiungi(retro, 'conci', LIV, M, tinta);
  cant.aggiungi(scatola(0, -1.2, 1.2, 1.2, H, D - 1.2), 'conci', LIV, M, tinta);
  cant.aggiungi(scatola(W - 1.2, -1.2, 1.2, W, H, D - 1.2), 'conci', LIV, M, tinta);
  // il fornice: pareti interne e volta
  cant.aggiungi(scatola(W / 2 - 2.6, -0.2, 1.2, W / 2 - 2.1, 6.8, D - 1.2), 'conci', LIV, M, [0.8, 0.78, 0.74]);
  cant.aggiungi(scatola(W / 2 + 2.1, -0.2, 1.2, W / 2 + 2.6, 6.8, D - 1.2), 'conci', LIV, M, [0.8, 0.78, 0.74]);
  cant.aggiungi(scatola(1.2, 6.8, 1.2, W - 1.2, 7.4, D - 1.2), 'conci', LIV, M, [0.7, 0.68, 0.64]);
  cant.aggiungi(scatola(1.2, 7.4, 1.2, W - 1.2, H - 0.3, D - 1.2), 'scuro', LIV, M, [1, 1, 1], false);
  for (let s = 0; s < W - 0.3; s += 1.2) {
    cant.aggiungi(scatola(s, H, 0, Math.min(W, s + 0.7), H + 1.1, 0.7), 'conci', LIV, M, tinta);
    cant.aggiungi(scatola(s, H, D - 0.7, Math.min(W, s + 0.7), H + 1.1, D), 'conci', LIV, M, tinta);
  }
  griglia.rettangolo(x, z, tx, tz, W / 2, D / 2, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
  griglia.rettangolo(x, z, tx, tz, 2.0, D / 2 + 0.5, (i, j) => { griglia.c[j * griglia.n + i] = STRADA; });
}

/* ================================================ PORTE DELLA CERCHIA */
// Una porta del 1172–75 con un tratto di muro per parte, lungo il perimetro
// provvisorio (dati/cerchia.js). Tutto di livello «ipotesi».
function portaDellaCerchia(cant, griglia, p) {
  porta(cant, griglia, p.pos, p.dir);
  // il lato del perimetro più vicino dà la direzione del muro
  let best = null;
  for (let i = 0; i < TRACCIATO.length; i++) {
    const a = TRACCIATO[i], b = TRACCIATO[(i + 1) % TRACCIATO.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((p.pos[0] - a[0]) * dx + (p.pos[1] - a[1]) * dz) / l2));
    const d = Math.hypot(a[0] + t * dx - p.pos[0], a[1] + t * dz - p.pos[1]);
    if (!best || d < best.d) best = { d, ux: dx / Math.sqrt(l2), uz: dz / Math.sqrt(l2) };
  }
  const { ux, uz } = best, H = 10, SP = 2.2, LIV = 'ipotesi', tinta = [0.9, 0.88, 0.83];
  for (const lato of [-1, 1]) {
    // da 5 m a 20 m dal centro della porta
    const cx = p.pos[0] + ux * lato * 12.5, cz = p.pos[1] + uz * lato * 12.5;
    const M = new Matrix4().makeRotationY(Math.atan2(-uz, ux)).setPosition(cx, quota(cx, cz), cz);
    cant.aggiungi(scatola(-7.5, -1.5, -SP / 2, 7.5, H, SP / 2), 'pietrame', LIV, M, tinta);
    for (let m = -7.2; m < 7; m += 1.6) cant.aggiungi(scatola(m, H, -SP / 2, m + 0.9, H + 1.1, -SP / 2 + 0.6), 'conci', LIV, M, tinta);
    griglia.rettangolo(cx, cz, ux, uz, 7.5, SP / 2 + 0.2, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
  }
}

/* ============================================================ BATTISTERO */
function battistero(cant, griglia, [x, z]) {
  const LIV = 'dedotto', y = quota(x, z);
  griglia.rettangolo(x, z, 1, 0, 14.6, 14.6, (i, j) => {
    const cx = griglia.min + (i + 0.5) * griglia.cella - x, cz = griglia.min + (j + 0.5) * griglia.cella - z;
    if (Math.hypot(cx, cz) < 14.6) griglia.c[j * griglia.n + i] = MONUMENTO;
  });
  const M = new Matrix4().makeRotationY(Math.PI / 8).setPosition(x, y, z);
  const R = 13.8;
  const corpo = uvMetri(new CylinderGeometry(R, R, 27, 8, 1).toNonIndexed());
  corpo.translate(0, 13.5 - 1, 0);
  cant.aggiungi(corpo, 'marmo', LIV, M);
  for (const h of [0.6, 10.5, 18.8, 25.5]) {
    const f = uvMetri(new CylinderGeometry(R + 0.12, R + 0.12, 0.5, 8, 1).toNonIndexed());
    f.translate(0, h, 0);
    cant.aggiungi(f, 'marmoVerde', LIV, M);
  }
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    const p = uvMetri(new CylinderGeometry(0.45, 0.45, 25, 6).toNonIndexed());
    p.translate(Math.sin(a) * R * 1.0, 12.5, Math.cos(a) * R * 1.0);
    cant.aggiungi(p, 'marmoVerde', LIV, M);
  }
  const tetto = uvMetri(new ConeGeometry(R + 0.4, 6.5, 8, 1).toNonIndexed());
  tetto.translate(0, 26 + 3.25, 0);
  cant.aggiungi(tetto, 'marmo', LIV, M, [0.92, 0.92, 0.9]);
  const lant = uvMetri(new CylinderGeometry(1.6, 1.6, 4.5, 8).toNonIndexed());
  lant.translate(0, 32.4 + 1.5, 0);
  cant.aggiungi(lant, 'marmo', LIV, M);
  const cup = uvMetri(new ConeGeometry(1.9, 2.4, 8).toNonIndexed());
  cup.translate(0, 37.2, 0);
  cant.aggiungi(cup, 'marmo', LIV, M);
  const scars = scatola(-5, -1, R * 0.85, 5, 15, R + 7);
  cant.aggiungi(scars, 'marmo', LIV, new Matrix4().multiplyMatrices(M, new Matrix4().makeRotationY(-5 * Math.PI / 8)));
}

/* ====================================================== SANTA REPARATA */
// La cattedrale del 1216, i cui resti sono sotto il Duomo. Pianta e misure
// del modello sono ipotesi [da verificare: rilievi degli scavi del 1965–1974].
// Dal 2 ottobre la piazza davanti si percorre: la chiesa occupa la griglia.
function santaReparata(cant, griglia) {
  const imp = [[160, -575], [222, -575], [222, -548], [160, -548]];
  chiesa(cant, griglia, imp, { verso: [128, -560], livello: 'ipotesi', altezza: 19, navate: 3, seme: 31 });
}

/* ======================================================= MERCATO VECCHIO */
// Banchi con le tende, solo nei giorni feriali (dati/giornate.js). Quanti
// fossero e come fossero disposti non lo sappiamo: è un'ipotesi d'insieme.
// I banchi non fermano chi cammina: la griglia è la stessa in ogni giornata.
const TELE = [[0.86, 0.82, 0.72], [0.74, 0.5, 0.36], [0.5, 0.56, 0.68], [0.82, 0.74, 0.56], [0.62, 0.66, 0.5]];
function mercatoVecchio(cant) {
  const R = rng(1885), LIV = 'ipotesi';
  cant.inVariante('feriale', () => {
    for (let x = 38; x <= 90; x += 6.5) for (let z = -388; z <= -342; z += 7) {
      const px = x + R.tra(-0.8, 0.8), pz = z + R.tra(-0.8, 0.8);
      // lasciano libero il passaggio lungo Calimala e il decumano
      if (Math.abs(px - 86) < 3.5 || Math.abs(pz + 366) < 3.5 || R.vero(0.15)) continue;
      const M = new Matrix4().makeRotationY(R.vero(0.5) ? 0 : Math.PI / 2).setPosition(px, quota(px, pz), pz);
      const W = R.tra(1.8, 2.6), D = R.tra(0.8, 1.0), h = 0.85;
      cant.aggiungi(scatola(-W / 2, h - 0.06, -D / 2, W / 2, h, D / 2), 'legno', LIV, M, [0.9, 0.86, 0.8]);
      for (const sx of [-1, 1]) cant.aggiungi(scatola(sx * (W / 2 - 0.25) - 0.04, 0, -D / 2 + 0.05, sx * (W / 2 - 0.25) + 0.04, h - 0.06, D / 2 - 0.05), 'legnoScuro', LIV, M, [1, 1, 1], false);
      // la tenda su quattro pali
      const hT = R.tra(2.1, 2.4), tinta = R.scegli(TELE);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
        cant.aggiungi(scatola(sx * W / 2 - 0.03, 0, sz * (D / 2 + 0.3) - 0.03, sx * W / 2 + 0.03, hT, sz * (D / 2 + 0.3) + 0.03), 'legnoScuro', LIV, M, [1, 1, 1], false);
      const tenda = scatola(-W / 2 - 0.15, 0, -D / 2 - 0.45, W / 2 + 0.15, 0.03, D / 2 + 0.45);
      tenda.applyMatrix4(new Matrix4().makeRotationX(R.tra(-0.12, 0.12)));
      tenda.translate(0, hT, 0);
      cant.aggiungi(tenda, 'intonaco', LIV, M, tinta);
      // la merce
      for (let k = 0, n = R.intero(2, 5); k < n; k++) {
        const w = R.tra(0.25, 0.5), xx = -W / 2 + 0.15 + k * (W - 0.3) / n;
        cant.aggiungi(scatola(xx, h, -D / 2 + 0.1, xx + w, h + R.tra(0.1, 0.3), -D / 2 + 0.1 + R.tra(0.25, 0.5)), 'intonaco', LIV, M, R.scegli([[0.55, 0.42, 0.28], [0.7, 0.62, 0.4], [0.45, 0.5, 0.3], [0.62, 0.3, 0.2]]), false);
      }
    }
  });
}

/* =============================================================== TUTTO */
export function costruisciMonumenti(cant, griglia) {
  const info = ponte(cant, griglia);
  marte(cant, griglia);

  const imp = nome => (IMPRONTE.find(i => i.nome === nome) || {}).punti;
  const chiese = [
    ['Chiesa di Santo Stefano al Ponte', { verso: [44, -55], livello: 'ipotesi', altezza: 13, vela: true, seme: 3 }],
    ['Chiesa dei Santi Apostoli', { verso: [-116, -118], livello: 'dedotto', altezza: 14, navate: 3, seme: 5 }],
    ['Chiesa di Santa Felicita', { verso: [-72, 140], livello: 'ipotesi', altezza: 13, seme: 9 }],
    ['Chiesa di San Jacopo Soprarno', { verso: [-205, 20], livello: 'ipotesi', altezza: 10, vela: true, seme: 11 }],
    ['Basilica di Santa Trinita', { verso: [-235, -215], livello: 'ipotesi', altezza: 13, seme: 13 }]
  ];
  for (const [nome, opz] of chiese) { const p = imp(nome); if (p) chiesa(cant, griglia, p, opz); }

  // Santa Maria sopra Porta (oggi San Biagio, in piazza di Parte Guelfa): pianta ipotetica
  chiesa(cant, griglia, [[-4, -186], [7, -186], [7, -168], [-4, -168]], { verso: [16, -177], livello: 'ipotesi', altezza: 10, vela: true, seme: 17 });

  porta(cant, griglia, [84.4, -197], [0, 1]);
  for (const p of PORTE_CERCHIA) portaDellaCerchia(cant, griglia, p);
  battistero(cant, griglia, [128, -542]);
  santaReparata(cant, griglia);
  mercatoVecchio(cant);

  // le torri con un nome: impronta reale, alzato ipotetico
  const torriNote = [];
  for (const t of IMPRONTE.filter(i => i.tipo === 'torre')) {
    const O = rettangoloMinimo(t.punti);
    if (Math.hypot(O.cx, O.cz) > 500) continue;
    const R = rng(t.id % 100000);
    const amidei = t.nome === 'Torre degli Amidei';
    const nx = -O.uz, nz = O.ux;               // fronte su un lato lungo
    const W = 2 * O.a, D = 2 * O.b;
    const L = { px: O.cx - O.ux * O.a - nx * O.b, pz: O.cz - O.uz * O.a - nz * O.b, nx, nz, W, D, seme: t.id % 9973, H: amidei ? 32 : R.tra(26, 44) };
    torre(cant, L, 'dedotto');
    griglia.poligono(t.punti, MONUMENTO);
    griglia.rettangolo(O.cx, O.cz, O.ux, O.uz, O.a, O.b, (i, j) => { griglia.c[j * griglia.n + i] = MONUMENTO; });
    torriNote.push({ nome: t.nome, x: O.cx, z: O.cz, h: L.H });
  }
  return { ...info, torriNote };
}
