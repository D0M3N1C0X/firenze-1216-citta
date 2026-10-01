import { Matrix4 } from 'three';
import {
  falda, ghiera, matriceLotto, muro, piramide, scatola, tamponamento, timpano
} from './cantiere.js';
import { EDIFICIO, LIBERO } from './griglia.js';
import { MAT } from './materiali.js';
import { quota, distanzaFiume } from './terreno.js';
import { rng } from './rumore.js';

/* =====================================================================
   LE CASE DEL 1216 — generate, non rilevate

   Tutto ciò che esce da questo file è di livello «ipotesi». I tipi sono
   quelli dell'edilizia fiorentina del Due e Trecento:
   - la casa a schiera su lotto stretto e profondo, con la bottega al
     piano terra aperta da un arco largo;
   - la casa-torre in pietraforte a conci, con poche aperture, le buche
     pontaie e i fori delle travi dei ballatoi;
   - lo sporto: i piani alti che sporgono sulla strada su mensole di
     legno, una caratteristica che gli statuti più tardi cercheranno di
     limitare [da verificare];
   - la gronda larga a travicelli.
   È Pasqua: le botteghe sono chiuse.

   La proporzione tra case in pietra e case in legno non la conosciamo
   [da verificare con il medievista]: qui prevale la pietra.
   ===================================================================== */

const LIV = 'ipotesi';
const TINTE_INTONACO = [[1, 1, 1], [1, 0.95, 0.86], [1, 0.92, 0.8], [0.96, 0.94, 0.9], [1, 0.9, 0.82], [0.94, 0.9, 0.86]];
const tintaPietra = R => { const k = R.tra(0.88, 1.06); return [k, k * R.tra(0.97, 1.01), k * R.tra(0.94, 1.0)]; };

/* ---------------------------------------------------------- aperture */
function riempi(cant, M, a, t, R, tipo) {
  // la finestra si riempie con un'imposta chiusa, una tela (impannata)
  // o resta aperta sul buio dell'interno
  const fondo = t * 0.55;
  if (tipo === 'bottega' || tipo === 'porta') {
    // le assi vanno girate solo nel legno generato: nella foto sono già verticali
    const g = tamponamento(a, 0.08, 7, Boolean(MAT.legno?.map?.isDataTexture)); g.translate(0, 0, fondo);
    cant.aggiungi(g, 'legnoScuro', LIV, M, [R.tra(0.8, 1.1), R.tra(0.8, 1.0), R.tra(0.75, 0.95)]);
    return;
  }
  const r = R();
  if (r < 0.38) {
    const g = tamponamento(a, 0.05); g.translate(0, 0, fondo * 0.6);
    cant.aggiungi(g, 'legnoScuro', LIV, M, [0.9, 0.85, 0.8], false);
  } else if (r < 0.62) {
    const g = tamponamento(a, 0.03); g.translate(0, 0, fondo);
    cant.aggiungi(g, 'intonaco', LIV, M, [0.92, 0.84, 0.66], false);
  }
}

function aperture(cant, M, lista, t, R, materialeMuro, ghiere) {
  for (const a of lista) {
    riempi(cant, M, a, t, R, a.tipo);
    if (a.arco && ghiere) {
      const g = ghiera(a, a.tipo === 'bottega' ? 0.42 : 0.2, 0.1); g.translate(0, 0, -0.05);
      cant.aggiungi(g, 'conci', LIV, M, [0.95, 0.95, 0.95]);
    }
    if (a.tipo === 'finestra') {
      const g = scatola(a.x - a.w / 2 - 0.08, a.y - 0.1, -0.08, a.x + a.w / 2 + 0.08, a.y, 0.12);
      cant.aggiungi(g, materialeMuro === 'intonaco' ? 'conci' : materialeMuro, LIV, M, [0.97, 0.97, 0.97]);
    }
  }
}

/** Finestre di un piano distribuite sulla larghezza. */
function finestrePiano(W, y, R, arco, larga = 0.82, alta = 1.5) {
  const n = Math.max(1, Math.floor((W - 0.8) / 2.3));
  const passo = W / n, out = [];
  for (let i = 0; i < n; i++) out.push({ x: passo * (i + 0.5), y, w: larga, h: alta, arco, tipo: 'finestra' });
  return out;
}

/* -------------------------------------------------------------- casa */
/**
 * Casa su un lotto: L = { px, pz (spigolo anteriore sinistro), nx, nz
 * (verso l'interno), W, D, seme, fronti: [true se il retro è visibile] }.
 */
export function casa(cant, L) {
  const R = rng(L.seme);
  const y = quota(L.px + L.nx * L.D / 2, L.pz + L.nz * L.D / 2);
  const M = matriceLotto(L.px, y, L.pz, L.nx, L.nz);
  const W = L.W, D = L.D;

  const H0 = R.tra(4.0, 4.6), Hp = R.tra(3.2, 3.6);
  const piede = L.retro ? -7.5 : -1.2;       // sul fiume le fondazioni scendono in acqua
  const piani = R.vero(0.25) ? 3 : 2 + (R.vero(0.35) ? 1 : 0);
  const Hm = H0 + piani * Hp;
  const t = 0.55;

  const tipo = R();                       // pietra, misto, pietrame
  const matTerra = tipo < 0.35 ? 'conci' : tipo < 0.75 ? 'conci' : 'pietrame';
  const matSopra = tipo < 0.35 ? 'conci' : tipo < 0.75 ? 'intonaco' : R.vero(0.5) ? 'pietrame' : 'intonaco';
  const tinta = matSopra === 'intonaco' ? R.scegli(TINTE_INTONACO) : tintaPietra(R);
  const tintaT = tintaPietra(R);
  const sporto = matSopra !== 'conci' && W > 4.5 && R.vero(0.42) ? R.tra(0.7, 1.15) : 0;
  const arco = R.vero(0.7);

  // --- piano terra: bottega con arco largo, più una porta se c'è spazio
  const ap0 = [];
  if (W >= 7.2) {
    const wb = Math.min(3.4, W * 0.42);
    ap0.push({ x: W * 0.32, y: 0, w: wb, h: Math.min(H0 - 0.5, wb / 2 + 2.3), arco: true, tipo: 'bottega' });
    ap0.push({ x: W * 0.8, y: 0, w: 1.15, h: 2.5, arco: R.vero(0.6), tipo: 'porta' });
  } else if (W >= 4.5) {
    const wb = Math.min(3.0, W - 1.6);
    ap0.push({ x: W / 2, y: 0, w: wb, h: Math.min(H0 - 0.5, wb / 2 + 2.2), arco: true, tipo: 'bottega' });
  } else {
    ap0.push({ x: W / 2, y: 0, w: 1.1, h: 2.4, arco: true, tipo: 'porta' });
  }
  const g0 = muro(W, -1.2, H0, t, ap0); cant.aggiungi(g0, matTerra, LIV, M, tintaT);
  aperture(cant, M, ap0, t, R, matTerra, true);

  // --- piani alti, eventualmente in aggetto sulla strada
  const zF = -sporto;
  const apS = [];
  for (let p = 0; p < piani; p++) apS.push(...finestrePiano(W, H0 + p * Hp + 0.95, R, arco).map(a => ({ ...a, y: a.y - H0 })));
  const gS = muro(W, 0, Hm - H0, t, apS); gS.translate(0, H0, zF);
  cant.aggiungi(gS, matSopra, LIV, M, tinta);
  const MS = new Matrix4().multiplyMatrices(M, new Matrix4().makeTranslation(0, H0, zF));
  aperture(cant, MS, apS, t, R, matSopra, matSopra === 'intonaco' && R.vero(0.6) ? true : matSopra !== 'intonaco');

  // marcapiano in pietra
  if (matSopra !== 'intonaco' || R.vero(0.5)) for (let p = 0; p <= piani - 1; p++) {
    const yy = H0 + p * Hp;
    cant.aggiungi(scatola(-0.02, yy - 0.16, zF - 0.07, W + 0.02, yy, zF + 0.1), 'conci', LIV, M, [0.98, 0.98, 0.98]);
  }

  if (sporto > 0) {
    // impalcato e mensole sotto lo sporto
    cant.aggiungi(scatola(0, H0 - 0.12, zF, W, H0 + 0.02, t), 'legno', LIV, M, [0.9, 0.86, 0.8]);
    const nb = Math.max(2, Math.round(W / 0.9));
    for (let i = 0; i < nb; i++) {
      const x = (i + 0.5) * W / nb;
      cant.aggiungi(scatola(x - 0.09, H0 - 0.36, zF - 0.08, x + 0.09, H0 - 0.12, t + 0.5), 'legnoScuro', LIV, M, [1, 1, 1]);
      if (i % 2 === 0) {
        // saettone: puntone obliquo dal muro alla testa della mensola
        const g = scatola(-0.06, 0, -0.06, 0.06, Math.hypot(sporto * 0.85, 1.1), 0.06);
        g.applyMatrix4(new Matrix4().makeRotationX(-Math.atan2(sporto * 0.85, 1.1)));
        g.translate(x, H0 - 1.45, -0.02);
        cant.aggiungi(g, 'legnoScuro', LIV, M, [0.95, 0.95, 0.95]);
      }
    }
    // fianchi dello sporto
    cant.aggiungi(scatola(0, H0, zF, 0.25, Hm, 0), matSopra, LIV, M, tinta);
    cant.aggiungi(scatola(W - 0.25, H0, zF, W, Hm, 0), matSopra, LIV, M, tinta);
  }

  // --- fianchi e retro (muri ciechi; il retro si apre se dà sul fiume)
  // i fianchi partono dietro la facciata e si fermano prima del retro:
  // niente facce sovrapposte, che sfarfallerebbero
  cant.aggiungi(scatola(0, piede, t, t, Hm, D - t), matSopra, LIV, M, tinta);
  cant.aggiungi(scatola(W - t, piede, t, W, Hm, D - t), matSopra, LIV, M, tinta);
  if (L.retro) {
    const apR = [];
    for (let p = 0; p < piani; p++) apR.push(...finestrePiano(W, H0 + p * Hp + 0.95, R, arco, 0.75, 1.3));
    apR.push({ x: W * 0.5, y: 1.2, w: 0.9, h: 1.4, arco: true, tipo: 'finestra' });
    const gR = muro(W, piede, Hm, t, apR);
    gR.applyMatrix4(new Matrix4().makeRotationY(Math.PI)); gR.translate(W, 0, D);
    const MR = new Matrix4().multiplyMatrices(M, new Matrix4().makeRotationY(Math.PI).setPosition(W, 0, D));
    cant.aggiungi(gR, matSopra, LIV, M, tinta);
    aperture(cant, MR, apR, t, R, matSopra, true);
    if (R.vero(0.55)) {
      // ballatoio di legno sull'acqua
      const yb = H0 + Hp * R.intero(0, piani - 1) + 0.1;
      cant.aggiungi(scatola(W * 0.15, yb - 0.15, D, W * 0.85, yb, D + 1.1), 'legno', LIV, M, [0.85, 0.82, 0.78]);
      cant.aggiungi(scatola(W * 0.15, yb, D + 1.0, W * 0.85, yb + 1.0, D + 1.1), 'legno', LIV, M, [0.8, 0.78, 0.74], false);
      for (let x = W * 0.15; x <= W * 0.86; x += 1.2) {
        const g = scatola(x - 0.07, 0, -0.07, x + 0.07, 1.6, 0.07);
        g.applyMatrix4(new Matrix4().makeRotationX(-0.6)); g.translate(0, yb - 1.45, D);
        cant.aggiungi(g, 'legnoScuro', LIV, M);
      }
    }
  } else {
    cant.aggiungi(scatola(0, -1.2, D - t, W, Hm, D), matSopra === 'conci' ? 'conci' : 'pietrame', LIV, M, tinta);
  }
  // buio dell'interno, visto attraverso le aperture
  cant.aggiungi(scatola(t, -0.5, t + 0.35, W - t, Hm - 0.1, D - t - 0.35), 'scuro', LIV, M, [1, 1, 1], false);
  if (sporto > 0) cant.aggiungi(scatola(0.25, H0 + 0.05, zF + t + 0.35, W - 0.25, Hm - 0.1, t + 0.4), 'scuro', LIV, M, [1, 1, 1], false);

  // --- tetto a capanna con il colmo parallelo alla strada
  tetto(cant, M, R, W, zF, D, Hm);
  return { altezza: Hm };
}

function tetto(cant, M, R, W, z0, z1, Hm) {
  const prof = z1 - z0, pend = R.tra(0.36, 0.44);       // ~20–24°
  const ovF = R.tra(1.0, 1.45), ovB = 0.5, ovS = 0.25;
  const colmo = Hm + prof / 2 * pend, zc = (z0 + z1) / 2;
  const tinta = [R.tra(0.88, 1.05), R.tra(0.85, 1.0), R.tra(0.82, 0.98)];
  cant.aggiungi(falda(-ovS, W + ovS, Hm - ovF * pend, z0 - ovF, colmo, zc), 'coppi', LIV, M, tinta);
  cant.aggiungi(falda(-ovS, W + ovS, Hm - ovB * pend, z1 + ovB, colmo, zc), 'coppi', LIV, M, tinta);
  // coppi di colmo
  cant.aggiungi(scatola(-ovS, colmo - 0.02, zc - 0.13, W + ovS, colmo + 0.12, zc + 0.13), 'coppi', LIV, M, tinta);
  // timpani sui fianchi
  for (const x of [0, W - 0.5]) {
    const g = timpano(prof, Hm, prof / 2 * pend, 0.5);
    g.applyMatrix4(new Matrix4().makeRotationY(-Math.PI / 2)); g.translate(x + 0.5, 0, z0);
    cant.aggiungi(g, 'pietrame', LIV, M, [0.95, 0.93, 0.9]);
  }
  // la gronda: tavolato sotto i coppi e travicelli sporgenti
  cant.aggiungi(falda(-ovS, W + ovS, Hm - ovF * pend - 0.14, z0 - ovF, Hm - 0.14, z0, 0.04), 'legno', LIV, M, [0.78, 0.72, 0.66], false);
  const n = Math.floor((W + 2 * ovS) / 0.5);
  const inclin = new Matrix4().makeRotationX(-Math.atan(pend));
  for (let i = 0; i <= n; i++) {
    const x = -ovS + i * (W + 2 * ovS) / n;
    const g = scatola(x - 0.05, -0.3, -(ovF - 0.05), x + 0.05, -0.18, 0.4);
    g.applyMatrix4(inclin);
    g.translate(0, Hm, z0);
    cant.aggiungi(g, 'legnoScuro', LIV, M, [1, 1, 1], false);
  }
}

/* ------------------------------------------------------- casa-torre */
/**
 * Torre su base rettangolare. Se L.impronta è dato (torre con un nome),
 * il lotto viene da OpenStreetMap e il livello lo decide chi chiama.
 */
export function torre(cant, L, livello = LIV) {
  const R = rng(L.seme);
  const y = quota(L.px + L.nx * L.D / 2, L.pz + L.nz * L.D / 2);
  const M = matriceLotto(L.px, y, L.pz, L.nx, L.nz);
  const W = L.W, D = L.D, H = L.H || R.tra(24, 42), t = 1.1;
  const tinta = tintaPietra(R);

  const lati = [
    { L: W, m: new Matrix4() },
    { L: D, m: new Matrix4().makeRotationY(-Math.PI / 2).setPosition(W, 0, 0) },
    { L: W, m: new Matrix4().makeRotationY(Math.PI).setPosition(W, 0, D) },
    { L: D, m: new Matrix4().makeRotationY(Math.PI / 2).setPosition(0, 0, D) }
  ];
  lati.forEach((lato, i) => {
    const ap = [];
    if (i === 0) ap.push({ x: lato.L / 2, y: 0, w: 1.3, h: 2.8, arco: true, tipo: 'porta' });
    const colonne = lato.L > 6.5 ? [lato.L * 0.3, lato.L * 0.7] : [lato.L / 2];
    for (let yy = 6.5; yy < H - 3; yy += R.tra(3.6, 4.6))
      for (const x of colonne) if (R.vero(i === 0 ? 0.75 : 0.45)) ap.push({ x, y: yy, w: 0.7, h: 1.25, arco: true, tipo: 'finestra' });
    // fori delle travi dei ballatoi: file di buche quadre
    if (R.vero(0.6)) {
      const yb = R.tra(8, Math.max(9, H * 0.6));
      for (let x = 0.7; x < lato.L - 0.6; x += 1.2) ap.push({ x, y: yb, w: 0.28, h: 0.3, arco: false, tipo: 'buca' });
    }
    const g = muro(lato.L, -1.2, H, t, ap);
    const Mi = new Matrix4().multiplyMatrices(M, lato.m);
    cant.aggiungi(g, 'conci', livello, Mi, tinta);
    for (const a of ap) if (a.tipo !== 'buca') riempi(cant, Mi, a, t, R, a.tipo);
  });
  cant.aggiungi(scatola(t, -0.5, t, W - t, H - 0.2, D - t), 'scuro', livello, M, [1, 1, 1], false);

  // coronamento: tetto a padiglione basso, oppure merli
  if (R.vero(0.6)) {
    const g = piramide(W, D, H, Math.min(W, D) * 0.28, 0.55);
    g.translate(W / 2, 0, D / 2);
    cant.aggiungi(g, 'coppi', livello, M, [R.tra(0.9, 1.05), 0.95, 0.92]);
  } else {
    cant.aggiungi(scatola(0.2, H - 0.3, 0.2, W - 0.2, H - 0.1, D - 0.2), 'lastre', livello, M);
    const passo = 1.1;
    for (const [x0, z0, x1, z1] of [[0, 0, W, 0.6], [0, D - 0.6, W, D], [0, 0, 0.6, D], [W - 0.6, 0, W, D]]) {
      const lungo = Math.max(x1 - x0, z1 - z0), lungoX = x1 - x0 >= z1 - z0;
      for (let s = 0; s < lungo - 0.3; s += passo) {
        const a = s, b = Math.min(lungo, s + passo * 0.55);
        const g = lungoX ? scatola(x0 + a, H, z0, x0 + b, H + 1.0, z1) : scatola(x0, H, z0 + a, x1, H + 1.0, z0 + b);
        cant.aggiungi(g, 'conci', livello, M, tinta);
      }
    }
  }
  // ballatoio di legno a mezza altezza, a volte
  if (R.vero(0.3)) {
    const yb = R.tra(9, H * 0.55);
    cant.aggiungi(scatola(-1.1, yb - 0.15, -1.1, W + 0.1, yb, 0), 'legno', livello, M, [0.85, 0.82, 0.78]);
    cant.aggiungi(scatola(-1.1, yb, -1.1, W + 0.1, yb + 1.0, -1.0), 'legno', livello, M, [0.8, 0.78, 0.74], false);
    cant.aggiungi(falda(-1.2, W + 0.2, yb + 2.3, -1.4, yb + 2.9, 0.1, 0.06), 'coppi', livello, M);
  }
  return { altezza: H };
}

/* =====================================================================
   LOTTIZZAZIONE

   1. lotti lungo le strade del 1216, su entrambi i lati;
   2. lotti lungo le rive, con il retro sull'acqua;
   3. riempimento degli isolati, per i tetti visti dall'alto e da lontano.
   ===================================================================== */

export function lottizza(griglia, strade, opz = {}) {
  const R = rng(1216);
  const lotti = [];
  const raggio = opz.raggio || 400;
  let seme = 1;

  const prova = (px, pz, nx, nz, W, D, extra) => {
    // (px,pz) = centro del fronte; il lotto va verso (nx,nz)
    const cx = px + nx * D / 2, cz = pz + nz * D / 2;
    const ux = nz, uz = -nx;
    if (Math.hypot(cx, cz) > raggio) return null;
    if (quota(cx, cz) > 7) return null;
    if (!griglia.liberoRett(cx, cz, ux, uz, W / 2 - 0.05, D / 2 - 0.05)) return null;
    griglia.segnaRett(cx, cz, ux, uz, W / 2, D / 2, EDIFICIO);
    const L = { px: px - ux * W / 2, pz: pz - uz * W / 2, nx, nz, W, D, seme: seme++, ...extra };
    lotti.push(L);
    return L;
  };

  // 1. lungo le strade
  for (const s of strade) {
    if (s.area) continue;
    const pts = s.punti;
    for (const lato of [1, -1]) {
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
        const L = Math.hypot(bx - ax, bz - az);
        if (L < 3) continue;
        const tx = (bx - ax) / L, tz = (bz - az) / L;
        const nx = -tz * lato, nz = tx * lato;
        let s0 = 0.6;
        while (s0 < L - 2.5) {
          const torreQui = R.vero(0.065);
          const W = torreQui ? R.tra(5.6, 7.4) : R.tra(4.6, 8.6);
          if (s0 + W > L - 0.4) break;
          const off = s.larghezza / 2 + R.tra(0.05, 0.35);
          const cx = ax + tx * (s0 + W / 2) + nx * off, cz = az + tz * (s0 + W / 2) + nz * off;
          const D = torreQui ? W * R.tra(0.95, 1.2) : R.tra(9, 16);
          let ok = prova(cx, cz, nx, nz, W, D, { tipo: torreQui ? 'torre' : 'casa' })
            || (!torreQui && prova(cx, cz, nx, nz, W, D * 0.55, { tipo: 'casa' }));
          s0 += ok ? W : 1.0;
        }
      }
    }
  }

  // 2. lungo le rive: il fronte sull'acqua diventa il retro della casa
  const passoRiva = 2;
  const vist = new Set();
  for (let x = -raggio; x < raggio; x += passoRiva) for (let z = -raggio; z < raggio; z += passoRiva) {
    const d = distanzaFiume(x, z);
    if (d < 0.5 || d > 2.5) continue;
    const key = Math.round(x / 7) + ',' + Math.round(z / 7);
    if (vist.has(key)) continue;
    vist.add(key);
    // normale verso terra: gradiente della distanza
    const gx = distanzaFiume(x + 1, z) - distanzaFiume(x - 1, z), gz = distanzaFiume(x, z + 1) - distanzaFiume(x, z - 1);
    const g = Math.hypot(gx, gz) || 1;
    const nx = gx / g, nz = gz / g;
    const W = R.tra(5, 8.5), D = R.tra(10, 15);
    // il fronte vero della casa dà verso terra: costruiamo il lotto girato
    const fx = x + nx * D, fz = z + nz * D;
    prova(fx, fz, -nx, -nz, W, D, { tipo: 'casa', retro: true });
  }

  // 3. riempimento degli isolati
  const segmenti = [];
  for (const s of strade) if (!s.area) for (let k = 0; k + 1 < s.punti.length; k++) segmenti.push([s.punti[k], s.punti[k + 1]]);
  for (let tent = 0; tent < (opz.riempimento || 9000); tent++) {
    const x = R.tra(-raggio, raggio), z = R.tra(-raggio, raggio);
    if (Math.hypot(x, z) > raggio || griglia.get(x, z) !== LIBERO) continue;
    // orienta come la strada più vicina
    let best = 1e9, tx = 1, tz = 0;
    for (const [a, b] of segmenti) {
      const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
      const d = Math.hypot(a[0] + t * dx - x, a[1] + t * dz - z);
      if (d < best) { best = d; const l = Math.sqrt(l2); tx = dx / l; tz = dz / l; }
    }
    if (best > 60) continue;
    const W = R.tra(6, 11), D = R.tra(8, 14);
    const nx = -tz, nz = tx;
    const L = prova(x - nx * D / 2, z - nz * D / 2, nx, nz, W, D, { tipo: R.vero(0.04) ? 'torre' : 'casa', interno: true });
    if (L && L.tipo === 'torre') { L.W = L.D = Math.min(W, 7); }
  }

  // gli spazi rimasti dentro gli isolati sono orti e cortili
  return lotti;
}

export function costruisciLotti(cant, lotti) {
  let n = 0;
  for (const L of lotti) {
    if (L.tipo === 'torre') torre(cant, L); else casa(cant, L);
    n++;
  }
  return n;
}

