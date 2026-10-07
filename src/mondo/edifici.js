import { Matrix4 } from 'three';
import {
  falda, ghiera, matriceLotto, muro, piramide, scatola, tamponamento, timpano
} from './cantiere.js';
import { EDIFICIO, LIBERO } from './griglia.js';
import { KIT, haKit } from './kit.js';
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
   Le botteghe hanno due stati (dati/giornate.js): chiuse dalle imposte
   nei giorni di festa; aperte nei giorni feriali, con il banco sulla
   strada e lo sportello alzato a tettoia. La forma del banco e della
   tettoia viene dalle botteghe di Due e Trecento che si vedono nella
   pittura e negli edifici superstiti [da verificare: un riferimento
   preciso, per esempio gli studi sulle botteghe di Calimala].

   La proporzione tra case in pietra e case in legno non la conosciamo
   [da verificare con il medievista]. Qui il piano terra è sempre di
   pietra e in circa un terzo delle case i piani alti sono di legno,
   tavolato su un'intelaiatura di travi: «pietra in basso, legno in alto»
   (PIANO.md, lacuna 23). È un'ipotesi.

   Finestre, porte e botteghe vengono dal kit edilizio (kit.js): pezzi
   modellati in Blender sugli edifici superstiti di Firenze e della
   Toscana coeva, con le misure qui sotto. Se il kit non si carica si
   torna alle forme semplici.
   ===================================================================== */

const LIV = 'ipotesi';
const TINTE_INTONACO = [[1, 1, 1], [1, 0.95, 0.86], [1, 0.92, 0.8], [0.96, 0.94, 0.9], [1, 0.9, 0.82], [0.94, 0.9, 0.86]];
const tintaPietra = R => { const k = R.tra(0.88, 1.06); return [k, k * R.tra(0.97, 1.01), k * R.tra(0.94, 1.0)]; };
// le tavole della foto sono grigie, di legno vecchio: le scaldiamo verso il castagno
const tintaLegno = R => { const k = R.tra(0.8, 1.05); return [k * 1.12, k * R.tra(0.9, 0.97), k * R.tra(0.72, 0.8)]; };

// misure delle aperture: le stesse dei pezzi del kit (strumenti/kit/kit.py)
const FIN = { w: 0.8, h: 1.5 }, FIN_P = { w: 0.7, h: 1.25 }, FIN_R = { w: 0.8, h: 1.3 };
const BOTTEGHE = [2.4, 3.0, 3.4], IMPOSTA = 2.3;
const PORTA_ARCO = { w: 1.2, h: 2.5 }, PORTA_SENESE = { w: 1.2, h: 2.95 };
const FERITOIA = { w: 0.22, h: 1.1 };
const TW = 0.25;                     // spessore delle pareti di tavole
// con il kit gli archi dei fori hanno più lati: le pietre li coprono tutti
const segArco = () => KIT.pezzi ? 16 : 7;
const larghezzaBottega = max => BOTTEGHE.filter(w => w <= max + 1e-6).pop() || BOTTEGHE[0];

/* ---------------------------------------------------------- aperture */
function riempi(cant, M, a, t, R, tipo) {
  // la finestra si riempie con un'imposta chiusa, una tela (impannata)
  // o resta aperta sul buio dell'interno
  const fondo = t * 0.55;
  if (tipo === 'bottega' || tipo === 'porta') {
    // le assi vanno girate solo nel legno generato: nella foto sono già verticali
    const tinta = [R.tra(0.8, 1.1), R.tra(0.8, 1.0), R.tra(0.75, 0.95)];
    const chiudi = () => { const g = tamponamento(a, 0.08, 7, Boolean(MAT.legno?.map?.isDataTexture)); g.translate(0, 0, fondo); cant.aggiungi(g, 'legnoScuro', LIV, M, tinta); };
    if (tipo === 'porta') { chiudi(); return; }
    cant.inVariante('festa', chiudi);
    cant.inVariante('feriale', () => bottegaAperta(cant, M, a, t, R, tinta));
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

/* Pezze di stoffa, ceste, orci sul banco: colori di lana e di tinte comuni. */
const MERCI = [[0.62, 0.52, 0.4], [0.42, 0.3, 0.22], [0.3, 0.36, 0.55], [0.6, 0.3, 0.22], [0.36, 0.44, 0.3], [0.78, 0.72, 0.6]];

/** Bottega aperta: banco sulla strada, sportello alzato a tettoia, merce. */
function bottegaAperta(cant, M, a, t, R, tinta) {
  const x0 = a.x - a.w / 2 + 0.06, x1 = a.x + a.w / 2 - 0.06;
  const hB = 0.86, sporge = 0.5;
  // il banco: piano di legno che sporge sulla strada, su un muricciolo
  cant.aggiungi(scatola(x0, 0, -0.05, x1, hB - 0.08, t * 0.55), 'pietrame', LIV, M, [0.9, 0.88, 0.84]);
  cant.aggiungi(scatola(x0 - 0.04, hB - 0.08, -sporge, x1 + 0.04, hB, t * 0.6), 'legno', LIV, M, tinta);
  // lo sportello di sopra, alzato e puntellato in fuori: fa da tettoia
  // (cerniera all'imposta dell'arco; il bordo libero scende un poco verso la strada)
  const yI = a.arco ? a.y + a.h - a.w / 2 : a.y + a.h;
  const lungo = Math.min(1.1, a.w * 0.42), incl = 0.42;
  const g = scatola(x0, -0.04, -lungo, x1, 0, 0);
  g.applyMatrix4(new Matrix4().makeRotationX(-incl));
  g.translate(0, yI, -0.02);
  cant.aggiungi(g, 'legnoScuro', LIV, M, tinta);
  // due puntelli dal bordo del banco al bordo libero dello sportello
  const dy = yI - Math.sin(incl) * lungo - hB, dz = -Math.cos(incl) * lungo + sporge;
  for (const xs of [x0 + 0.1, x1 - 0.1]) {
    const p = scatola(xs - 0.03, 0, -0.03, xs + 0.03, Math.hypot(dy, dz), 0.03);
    p.applyMatrix4(new Matrix4().makeRotationX(Math.atan2(dz, dy))); p.translate(0, hB, -sporge + 0.04);
    cant.aggiungi(p, 'legnoScuro', LIV, M, [0.9, 0.9, 0.9], false);
  }
  merci(cant, M, a, R, hB, sporge);
}

/** La merce sul banco: pezze, ceste, orci. */
function merci(cant, M, a, R, hB = 0.82, sporge = 0.55) {
  const x0 = a.x - a.w / 2 + 0.06, x1 = a.x + a.w / 2 - 0.06;
  let x = x0 + R.tra(0.05, 0.25);
  while (x < x1 - 0.35) {
    const w = R.tra(0.25, 0.5), h = R.tra(0.12, 0.3), d = R.tra(0.25, 0.4);
    if (R.vero(0.75)) cant.aggiungi(scatola(x, hB, -sporge + 0.06, x + w, hB + h, -sporge + 0.06 + d), 'intonaco', LIV, M, R.scegli(MERCI), false);
    x += w + R.tra(0.05, 0.3);
  }
}

/**
 * I pezzi del kit per un'apertura: telaio di pietra (se il muro è di
 * pietra), chiusure e, per le botteghe, i due stati della giornata.
 * Restituisce false se il kit non ha il pezzo: allora si usano le forme
 * semplici. «rientro» sposta le chiusure verso la strada nei muri sottili.
 */
function posaKit(cant, M, a, R, pietra, liv, tintaP, rientro = 0) {
  const Ma = new Matrix4().multiplyMatrices(M, new Matrix4().makeTranslation(a.x, a.y, 0));
  const Mc = rientro ? new Matrix4().multiplyMatrices(Ma, new Matrix4().makeTranslation(0, 0, rientro)) : Ma;
  const tL = [R.tra(0.8, 1.1), R.tra(0.8, 1.0), R.tra(0.75, 0.95)];
  if (a.tipo === 'bottega') {
    const w = Math.round(a.w * 100);
    if (!haKit(`bottega_${w}`)) return false;
    cant.pezzo(`bottega_${w}`, Ma, liv, tintaP);
    cant.inVariante('festa', () => cant.pezzo(`bottega_chiusa_${w}`, Ma, liv, tL));
    cant.inVariante('feriale', () => { cant.pezzo(`bottega_aperta_${w}`, Ma, liv, tL, true); merci(cant, M, a, R); });
    return true;
  }
  let telaio;
  if (a.tipo === 'porta') telaio = a.forma === 'senese' ? 'portale_senese_120x260' : 'portale_arco_120x250';
  else if (a.forma === 'feritoia') telaio = 'feritoia_22x110';
  else telaio = (a.arco ? 'finestra_arco_' : 'finestra_architrave_') + `${Math.round(a.w * 100)}x${Math.round(a.h * 100)}`;
  if (!haKit(telaio)) return false;
  if (pietra) cant.pezzo(telaio, Ma, liv, tintaP);
  const [scuri, tela] = KIT.info[telaio].chiusure;
  if (a.tipo === 'porta') cant.pezzo(scuri, Ma, liv, tL);
  else if (scuri) {
    const r = R();
    if (r < 0.38) cant.pezzo(scuri, Mc, liv, [0.9, 0.85, 0.8]);
    else if (r < 0.62 && tela) cant.pezzo(tela, Mc, liv);
  }
  return true;
}

/** Cornice di travetti attorno a una finestra in una parete di tavole. */
function corniceLegno(cant, M, a, liv, tinta) {
  const c = 0.015, x0 = a.x - a.w / 2, x1 = a.x + a.w / 2, y0 = a.y, y1 = a.y + a.h;
  cant.aggiungi(scatola(x0 - 0.11, y0 - 0.06, -0.06, x0 + c, y1 + 0.06, TW), 'legnoScuro', liv, M, tinta, false);
  cant.aggiungi(scatola(x1 - c, y0 - 0.06, -0.06, x1 + 0.11, y1 + 0.06, TW), 'legnoScuro', liv, M, tinta, false);
  cant.aggiungi(scatola(x0 - 0.16, y1 - c, -0.07, x1 + 0.16, y1 + 0.14, TW), 'legnoScuro', liv, M, tinta, false);
  cant.aggiungi(scatola(x0 - 0.14, y0 - 0.1, -0.12, x1 + 0.14, y0 + c, TW), 'legnoScuro', liv, M, tinta, false);
}

function aperture(cant, M, lista, t, R, materialeMuro, ghiere, liv = LIV, tintaP = [0.97, 0.97, 0.97]) {
  const legno = materialeMuro === 'legno';
  for (const a of lista) {
    if (KIT.pezzi && posaKit(cant, M, a, R, ghiere && !legno, liv, tintaP, legno ? -0.2 : 0)) {
      if (a.tipo === 'finestra' && legno) corniceLegno(cant, M, a, liv, tintaP);
      else if (a.tipo === 'finestra' && !ghiere) {
        const g = scatola(a.x - a.w / 2 - 0.08, a.y - 0.1, -0.08, a.x + a.w / 2 + 0.08, a.y + 0.015, 0.12);
        cant.aggiungi(g, 'conci', liv, M, [0.97, 0.97, 0.97]);
      }
      continue;
    }
    riempi(cant, M, a, t, R, a.tipo);
    if (a.arco && ghiere) {
      const g = ghiera(a, a.tipo === 'bottega' ? 0.42 : 0.2, 0.1); g.translate(0, 0, -0.05);
      cant.aggiungi(g, 'conci', liv, M, [0.95, 0.95, 0.95]);
    }
    if (a.tipo === 'finestra') {
      const g = scatola(a.x - a.w / 2 - 0.08, a.y - 0.1, -0.08, a.x + a.w / 2 + 0.08, a.y, 0.12);
      cant.aggiungi(g, materialeMuro === 'intonaco' || legno ? 'conci' : materialeMuro, liv, M, [0.97, 0.97, 0.97]);
    }
  }
}

/** Finestre di un piano distribuite sulla larghezza, con le misure del kit. */
function finestrePiano(W, y, R, arco, piccole = false) {
  const m = arco ? (piccole ? FIN_P : FIN) : FIN_R;
  const n = Math.max(1, Math.floor((W - 0.8) / 2.3));
  const passo = W / n, out = [];
  for (let i = 0; i < n; i++) out.push({ x: passo * (i + 0.5), y, w: m.w, h: m.h, arco, tipo: 'finestra' });
  return out;
}

/** Anello di ferro accanto a una porta o a una bottega (ipotesi: FONTI.md). */
function anelli(cant, M, lista, W, R, liv, p) {
  for (const a of lista) {
    if ((a.tipo !== 'porta' && a.tipo !== 'bottega') || !R.vero(p)) continue;
    const lato = R.vero(0.5) ? 1 : -1;
    const x = a.x + lato * (a.w / 2 + 0.6);
    if (x < 0.4 || x > W - 0.4 || lista.some(b => b !== a && Math.abs(b.x - x) < b.w / 2 + 0.5)) continue;
    cant.pezzo('anello', new Matrix4().multiplyMatrices(M, new Matrix4().makeTranslation(x, 1.5, 0)), liv, [1, 1, 1], false);
  }
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

  let H0 = R.tra(4.0, 4.6);
  const Hp = R.tra(3.2, 3.6);
  const piede = L.retro ? -7.5 : -1.2;       // sul fiume le fondazioni scendono in acqua
  const piani = R.vero(0.25) ? 3 : 2 + (R.vero(0.35) ? 1 : 0);
  const t = 0.55;

  const tipo = R();                       // pietra, misto, pietrame
  const matTerra = tipo < 0.35 ? 'conci' : tipo < 0.75 ? 'conci' : 'pietrame';
  let matSopra = tipo < 0.35 ? 'conci' : tipo < 0.75 ? 'intonaco' : R.vero(0.5) ? 'pietrame' : 'intonaco';
  // pietra in basso, legno in alto: metà delle case non di conci ha i piani
  // alti di tavole su un'intelaiatura di travi (ipotesi, lacuna 23)
  if (matSopra !== 'conci' && R.vero(0.5)) matSopra = 'legno';
  const legno = matSopra === 'legno';
  const tS = legno ? TW : t;
  const tinta = matSopra === 'intonaco' ? R.scegli(TINTE_INTONACO) : legno ? tintaLegno(R) : tintaPietra(R);
  const tintaT = tintaPietra(R);
  const tintaTelai = tintaT.map(c => c * 1.04);
  const sporto = matSopra !== 'conci' && W > 4.5 && R.vero(legno ? 0.6 : 0.42) ? R.tra(0.7, 1.15) : 0;
  const arco = !legno && R.vero(0.7);       // nelle pareti di tavole le finestre sono rettangolari

  // --- piano terra: bottega con arco largo, più una porta se c'è spazio
  const porta = () => R.vero(0.6) ? { ...PORTA_ARCO, arco: true, tipo: 'porta' } : { ...PORTA_SENESE, arco: true, tipo: 'porta', forma: 'senese' };
  const ap0 = [];
  if (W >= 7.2) {
    const wb = larghezzaBottega(Math.min(3.4, W * 0.42));
    ap0.push({ x: W * 0.32, y: 0, w: wb, h: IMPOSTA + wb / 2, arco: true, tipo: 'bottega' });
    ap0.push({ x: W * 0.8, y: 0, ...porta() });
  } else if (W >= 4.5) {
    const wb = larghezzaBottega(Math.min(3.0, W - 1.6));
    ap0.push({ x: W / 2, y: 0, w: wb, h: IMPOSTA + wb / 2, arco: true, tipo: 'bottega' });
  } else {
    ap0.push({ x: W / 2, y: 0, ...porta() });
  }
  // il piano terra contiene l'arco più alto con la sua ghiera e il marcapiano
  H0 = Math.max(H0, ...ap0.map(a => a.h + (a.tipo === 'bottega' ? 0.75 : 0.55)));
  const Hm = H0 + piani * Hp;
  const g0 = muro(W, -1.2, H0, t, ap0, segArco()); cant.aggiungi(g0, matTerra, LIV, M, tintaT);
  aperture(cant, M, ap0, t, R, matTerra, true, LIV, tintaTelai);
  if (KIT.pezzi) anelli(cant, M, ap0, W, R, LIV, 0.3);

  // --- piani alti, eventualmente in aggetto sulla strada
  const zF = -sporto;
  const apS = [];
  for (let p = 0; p < piani; p++) apS.push(...finestrePiano(W, H0 + p * Hp + 0.95, R, arco).map(a => ({ ...a, y: a.y - H0 })));
  const gS = muro(W, 0, Hm - H0, tS, apS, segArco()); gS.translate(0, H0, zF);
  cant.aggiungi(gS, matSopra, LIV, M, tinta);
  const MS = new Matrix4().multiplyMatrices(M, new Matrix4().makeTranslation(0, H0, zF));
  aperture(cant, MS, apS, tS, R, matSopra, matSopra === 'intonaco' && R.vero(0.6) ? true : matSopra !== 'intonaco', LIV, legno ? tinta : tintaTelai);
  if (legno) intelaiatura(cant, MS, W, Hm - H0, Hp, piani, apS, tinta);

  // marcapiano in pietra
  if (!legno && (matSopra !== 'intonaco' || R.vero(0.5))) for (let p = 0; p <= piani - 1; p++) {
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
  }

  // --- fianchi e retro (muri ciechi; il retro si apre se dà sul fiume)
  // i fianchi partono dietro la facciata e si fermano prima del retro:
  // niente facce sovrapposte, che sfarfallerebbero. Sopra il piano terra
  // partono da dietro la facciata dei piani alti, anche se sporge.
  const fianco = legno ? TW : t;
  cant.aggiungi(scatola(0, piede, t, t, H0, D - t), matTerra, LIV, M, tintaT);
  cant.aggiungi(scatola(W - t, piede, t, W, H0, D - t), matTerra, LIV, M, tintaT);
  cant.aggiungi(scatola(0, H0, zF + tS, fianco, Hm, D - t), matSopra, LIV, M, tinta);
  cant.aggiungi(scatola(W - fianco, H0, zF + tS, W, Hm, D - t), matSopra, LIV, M, tinta);
  if (L.retro) {
    const apR = [];
    for (let p = 0; p < piani; p++) apR.push(...finestrePiano(W, H0 + p * Hp + 0.95, R, arco, true));
    apR.push({ x: W * 0.5, y: 1.2, ...FIN, arco: true, tipo: 'finestra' });
    const MR = new Matrix4().multiplyMatrices(M, new Matrix4().makeRotationY(Math.PI).setPosition(W, 0, D));
    const parti = legno ? [[piede, H0, matTerra, t, tintaT], [H0, Hm, 'legno', TW, tinta]] : [[piede, Hm, matSopra, t, tinta]];
    for (const [y0, y1, mat, sp, ti] of parti) {
      const lista = apR.filter(a => a.y >= y0 && a.y < y1);
      const gR = muro(W, y0, y1, sp, lista, segArco());
      gR.applyMatrix4(new Matrix4().makeRotationY(Math.PI)); gR.translate(W, 0, D);
      cant.aggiungi(gR, mat, LIV, M, ti);
      aperture(cant, MR, lista, sp, R, mat, true, LIV, mat === 'legno' ? ti : tintaTelai);
    }
    if (legno) intelaiatura(cant, new Matrix4().multiplyMatrices(MR, new Matrix4().makeTranslation(0, H0, 0)), W, Hm - H0, Hp, piani,
      apR.filter(a => a.y >= H0), tinta);
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
  } else if (legno) {
    cant.aggiungi(scatola(0, -1.2, D - t, W, H0, D), 'pietrame', LIV, M, tintaT);
    cant.aggiungi(scatola(0, H0, D - TW, W, Hm, D), 'legno', LIV, M, tinta);
  } else {
    cant.aggiungi(scatola(0, -1.2, D - t, W, Hm, D), matSopra === 'conci' ? 'conci' : 'pietrame', LIV, M, tinta);
  }
  // buio dell'interno, visto attraverso le aperture
  cant.aggiungi(scatola(t, -0.5, t + 0.35, W - t, Hm - 0.1, D - t - 0.35), 'scuro', LIV, M, [1, 1, 1], false);
  if (sporto > 0) cant.aggiungi(scatola(0.25, H0 + 0.05, zF + tS + 0.35, W - 0.25, Hm - 0.1, t + 0.4), 'scuro', LIV, M, [1, 1, 1], false);

  // --- tetto a capanna con il colmo parallelo alla strada
  tetto(cant, M, R, W, zF, D, Hm, legno ? 'legno' : 'pietrame');
  return { altezza: Hm };
}

/**
 * Intelaiatura di una parete di tavole: travi dei solai a ogni piano e
 * ritti agli spigoli e tra le finestre. M ha l'origine al piede della
 * parete (y = 0), alta H.
 */
function intelaiatura(cant, M, W, H, Hp, piani, finestre, tinta) {
  const ti = tinta.map(c => c * 0.85);
  for (let p = 0; p <= piani; p++) {
    const y = Math.min(H - 0.225, p * Hp - 0.02);
    cant.aggiungi(scatola(-0.04, y, -0.07, W + 0.04, y + 0.22, TW), 'legnoScuro', LIV, M, ti);
  }
  const xs = [-0.02, W - 0.18];
  const xf = [...new Set(finestre.map(a => +a.x.toFixed(3)))].sort((a, b) => a - b);
  for (let i = 0; i + 1 < xf.length; i++) xs.push((xf[i] + xf[i + 1]) / 2 - 0.1);
  for (const x of xs) cant.aggiungi(scatola(x, 0, -0.05, x + 0.2, H - 0.01, TW), 'legnoScuro', LIV, M, ti);
}

function tetto(cant, M, R, W, z0, z1, Hm, matTimpano = 'pietrame') {
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
    cant.aggiungi(g, matTimpano, LIV, M, [0.95, 0.93, 0.9]);
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
  const tintaTelai = tinta.map(c => c * 1.03);
  lati.forEach((lato, i) => {
    const ap = [];
    // la porta a «doppio arco», come alla torre della Castagna (FONTI.md)
    if (i === 0) ap.push({ x: lato.L / 2, y: 0, ...PORTA_SENESE, arco: true, tipo: 'porta', forma: 'senese' });
    // feritoie sui fianchi, sotto le prime finestre
    else if (R.vero(0.6)) ap.push({ x: lato.L / 2, y: R.tra(3.0, 4.2), ...FERITOIA, arco: true, tipo: 'finestra', forma: 'feritoia' });
    const colonne = lato.L > 6.5 ? [lato.L * 0.3, lato.L * 0.7] : [lato.L / 2];
    for (let yy = 6.5; yy < H - 3; yy += R.tra(3.6, 4.6))
      for (const x of colonne) if (R.vero(i === 0 ? 0.75 : 0.45)) ap.push({ x, y: yy, ...FIN_P, arco: true, tipo: 'finestra' });
    // fori delle travi dei ballatoi: file di buche quadre
    if (R.vero(0.6)) {
      const yb = R.tra(8, Math.max(9, H * 0.6));
      for (let x = 0.7; x < lato.L - 0.6; x += 1.2) ap.push({ x, y: yb, w: 0.28, h: 0.3, arco: false, tipo: 'buca' });
    }
    const g = muro(lato.L, -1.2, H, t, ap, segArco());
    const Mi = new Matrix4().multiplyMatrices(M, lato.m);
    cant.aggiungi(g, 'conci', livello, Mi, tinta);
    const vere = ap.filter(a => a.tipo !== 'buca');
    aperture(cant, Mi, vere, t, R, 'conci', Boolean(KIT.pezzi), livello, tintaTelai);
    if (i === 0 && KIT.pezzi) anelli(cant, Mi, vere, lato.L, R, livello, 0.5);
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

/** Distanza di un punto da una spezzata. */
function distanzaSpezzata(x, z, pts) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}

/**
 * L'area dove la città è costruita casa per casa: un cerchio intorno al capo
 * del ponte più i corridoi (dati/strade-1216.js, CORRIDOI).
 */
export function areaCostruita(raggio, corridoi = []) {
  return (x, z) => Math.hypot(x, z) <= raggio || corridoi.some(c => distanzaSpezzata(x, z, c.punti) <= c.larghezza);
}

export function lottizza(griglia, strade, opz = {}) {
  const R = rng(1216);
  const lotti = [];
  const raggio = opz.raggio || 400;
  const corridoi = opz.corridoi || [];
  const dentro = areaCostruita(raggio, corridoi);
  // il riquadro da campionare comprende anche i corridoi
  let xMin = -raggio, xMax = raggio, zMin = -raggio, zMax = raggio;
  for (const c of corridoi) for (const [x, z] of c.punti) {
    xMin = Math.min(xMin, x - c.larghezza); xMax = Math.max(xMax, x + c.larghezza);
    zMin = Math.min(zMin, z - c.larghezza); zMax = Math.max(zMax, z + c.larghezza);
  }
  let seme = 1;

  const prova = (px, pz, nx, nz, W, D, extra) => {
    // (px,pz) = centro del fronte; il lotto va verso (nx,nz)
    const cx = px + nx * D / 2, cz = pz + nz * D / 2;
    const ux = nz, uz = -nx;
    if (!dentro(cx, cz)) return null;
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
    const x = R.tra(xMin, xMax), z = R.tra(zMin, zMax);
    if (!dentro(x, z) || griglia.get(x, z) !== LIBERO) continue;
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

/**
 * Pozzi nei cortili. La città beveva dai pozzi (FONTI.md del kit), ma dove
 * fossero nel 1216 non lo sappiamo: niente pozzi nelle piazze, dove
 * sarebbero un'affermazione precisa senza fonte, e qualcuno negli spazi
 * liberi chiusi tra le case, i cortili e gli orti. Livello «ipotesi».
 */
export function pozziNeiCortili(cant, griglia, dentro, quanti = 40) {
  const R = rng(1179);
  const libero = (x, z, r) => {
    for (let dx = -r; dx <= r; dx += 0.5) for (let dz = -r; dz <= r; dz += 0.5) if (griglia.get(x + dx, z + dz) !== LIBERO) return false;
    return true;
  };
  // chiuso da case sui quattro lati entro 14 m
  const chiuso = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => {
    for (let d = 2; d <= 14; d++) if (griglia.get(x + dx * d, z + dz * d) === EDIFICIO) return true;
    return false;
  });
  const candidati = [];
  for (let x = griglia.min + 20; x < griglia.max - 20; x += 3) for (let z = griglia.min + 20; z < griglia.max - 20; z += 3)
    if (dentro(x, z) && libero(x, z, 1.5) && chiuso(x, z)) candidati.push([x, z]);
  for (let i = candidati.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [candidati[i], candidati[j]] = [candidati[j], candidati[i]]; }
  const presi = [];
  for (const [x, z] of candidati) {
    if (presi.length >= quanti) break;
    if (presi.some(([px, pz]) => Math.hypot(px - x, pz - z) < 45)) continue;
    presi.push([x, z]);
    const m = new Matrix4().makeRotationY(R.tra(0, Math.PI * 2)).setPosition(x, quota(x, z) - 0.05, z);
    cant.pezzo('pozzo', m, 'ipotesi', tintaPietra(R), true);
    griglia.segnaRett(x, z, 1, 0, 1.0, 1.0, EDIFICIO);
  }
  return presi;
}

export function costruisciLotti(cant, lotti) {
  let n = 0;
  for (const L of lotti) {
    if (L.tipo === 'torre') torre(cant, L); else casa(cant, L);
    n++;
  }
  return n;
}

