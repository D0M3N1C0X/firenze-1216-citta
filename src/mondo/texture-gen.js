import { rng, fbm, valore, hash2, clamp, smooth, lerp } from './rumore.js';

/* =====================================================================
   GENERATORI DELLE TEXTURE — puro calcolo, nessuna dipendenza dal
   browser: girano dentro i worker (tex-worker.js), in parallelo.
   Ogni generatore restituisce tre immagini RGBA (colore, normal map,
   ruvidità) e la misura in metri che la texture copre.
   ===================================================================== */

/**
 * Costruisce le tre mappe da una funzione che, per ogni pixel, scrive
 * colore (0–255), altezza (0–1) e ruvidità (0–1) negli array di uscita.
 */
function genera(S, dim, forza, fn) {
  const col = new Uint8Array(S * S * 4);
  const alt = new Float32Array(S * S);
  const ruv = new Float32Array(S * S);
  const c = new Float64Array(5);    // r, g, b, altezza, ruvidità
  for (let j = 0; j < S; j++) {
    const v = j / S;
    for (let i = 0; i < S; i++) {
      const u = i / S, k = j * S + i;
      fn(u, v, c);
      col[k * 4] = clamp(c[0], 0, 255); col[k * 4 + 1] = clamp(c[1], 0, 255); col[k * 4 + 2] = clamp(c[2], 0, 255); col[k * 4 + 3] = 255;
      alt[k] = c[3]; ruv[k] = c[4];
    }
  }
  // normal map dalle differenze dell'altezza, con avvolgimento ai bordi
  const nor = new Uint8Array(S * S * 4), rgh = new Uint8Array(S * S * 4);
  const passo = dim / S;                   // metri per pixel
  const f = forza / passo;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const k = j * S + i;
    const l = alt[j * S + ((i - 1 + S) % S)], r = alt[j * S + ((i + 1) % S)];
    const d = alt[((j - 1 + S) % S) * S + i], u = alt[((j + 1) % S) * S + i];
    let nx = (l - r) * f * 0.5, ny = (d - u) * f * 0.5, nz = 1;
    const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
    nor[k * 4] = (nx * 0.5 + 0.5) * 255; nor[k * 4 + 1] = (ny * 0.5 + 0.5) * 255; nor[k * 4 + 2] = (nz * 0.5 + 0.5) * 255; nor[k * 4 + 3] = 255;
    const g = clamp(ruv[k]) * 255;
    rgh[k * 4] = 255; rgh[k * 4 + 1] = g; rgh[k * 4 + 2] = 0; rgh[k * 4 + 3] = 255;
  }
  return { col, nor, rgh, S, dim };
}

/* ------------------------------------------------ pietraforte a conci */
// Corsi orizzontali di altezza variabile, conci di lunghezza variabile,
// giunti sottili e incassati, spigoli smussati dal tempo. Ogni tanto una
// buca pontaia: i fori lasciati dai ponteggi sono ovunque sulle torri.
function conci(S, seme) {
  const R = rng(seme), DIM = 3.2;
  const corsi = [];
  let tot = 0;
  while (tot < DIM - 0.2) { const h = R.tra(0.27, 0.43); corsi.push(h); tot += h; }
  const k = DIM / tot;
  let y = 0;
  const righe = corsi.map((h, idx) => {
    const r = { y0: y, y1: y + h * k, tagli: [], off: R() * DIM, idx };
    y = r.y1;
    let x = 0;
    while (x < DIM - 0.35) { const l = R.tra(0.45, 1.15); r.tagli.push(x); x += l; }
    r.tagli.push(DIM);
    r.buche = (idx % 5 === 3) ? [R.tra(0.3, 2.8)] : [];
    return r;
  });
  const giunto = 0.006;
  return genera(S, DIM, 0.5, (u, v, c) => {
    const X = u * DIM, Y = v * DIM;
    const r = righe.find(r => Y < r.y1) || righe[righe.length - 1];
    let xr = (X + r.off) % DIM, bi = 0;
    while (bi < r.tagli.length - 1 && xr >= r.tagli[bi + 1]) bi++;
    const x0 = r.tagli[bi], x1 = r.tagli[bi + 1];
    const bord = Math.min(xr - x0, x1 - xr, Y - r.y0, r.y1 - Y);
    const sbecco = (fbm(u * 40, v * 40, 3, 40, seme + 3) - 0.5) * 0.02;
    const t = smooth(giunto * 0.4, giunto * 1.8, bord + sbecco * 0.6);
    const id = (r.idx * 31 + bi * 7) % 97 / 97;
    // superficie: bocciardatura fine più una leggera bombatura del concio
    const grana = fbm(u * 160, v * 160, 3, 160, seme + 9);
    const macro = fbm(u * 6, v * 6, 4, 6, seme + 21);
    const vena = Math.abs(fbm(u * 3 + id * 3, v * 22, 4, 0, seme + 5) - 0.5);
    // niente bombatura: i conci del Duecento sono spianati, il «cuscino»
    // farebbe pensare al bugnato rinascimentale
    let h = t * (0.86 + 0.12 * grana);
    // tinta: grigio bruno della pietraforte con conci più ocracei o più freddi
    const ocra = clamp(0.35 + (id - 0.5) * 0.9 + (macro - 0.5) * 0.6);
    let rr = lerp(100, 138, ocra), gg = lerp(94, 120, ocra), bb = lerp(84, 94, ocra);
    const sporco = 0.8 + 0.28 * macro + 0.14 * (grana - 0.5) + (id - 0.5) * 0.12;
    rr *= sporco; gg *= sporco; bb *= sporco;
    if (vena < 0.02) { rr *= 0.9; gg *= 0.88; bb *= 0.85; }
    // malta nei giunti
    rr = lerp(112, rr, t); gg = lerp(105, gg, t); bb = lerp(92, bb, t);
    for (const bx of r.buche) {
      const dx = Math.abs(((X - bx + DIM) % DIM)), dy = Y - (r.y0 + r.y1) / 2;
      if (dx < 0.075 * 2 && Math.abs(dx - 0.075) < 0.075 && Math.abs(dy) < 0.075) { h = 0.05; rr = 34; gg = 30; bb = 26; }
    }
    c[0] = rr; c[1] = gg; c[2] = bb;
    c[3] = h; c[4] = 0.86 - 0.08 * grana + (1 - t) * 0.08; return;
  });
}

/* ----------------------------- pietrame (filaretto irregolare) */
// Bozze appena sbozzate, in corsi irregolari, con molta malta: le case
// comuni e i muri di fianco. Come i conci, ma tutto più storto.
function pietrame(S, seme) {
  const R = rng(seme), DIM = 3;
  const corsi = [];
  let tot = 0;
  while (tot < DIM - 0.15) { const h = R.tra(0.14, 0.3); corsi.push(h); tot += h; }
  const k = DIM / tot;
  let y = 0;
  const righe = corsi.map((h, idx) => {
    const r = { y0: y, y1: y + h * k, tagli: [], off: R() * DIM, idx, pend: R.tra(-0.03, 0.03) };
    y = r.y1;
    let x = 0;
    while (x < DIM - 0.18) { const l = R.tra(0.18, 0.55); r.tagli.push(x); x += l; }
    r.tagli.push(DIM);
    return r;
  });
  return genera(S, DIM, 1.0, (u, v, c) => {
    const X = u * DIM;
    // i corsi ondeggiano un poco
    const Y = v * DIM + (fbm(u * 6, v * 2, 3, 6, seme + 4) - 0.5) * 0.06;
    const YY = ((Y % DIM) + DIM) % DIM;
    const r = righe.find(r => YY < r.y1) || righe[righe.length - 1];
    let xr = (X + r.off) % DIM, bi = 0;
    while (bi < r.tagli.length - 1 && xr >= r.tagli[bi + 1]) bi++;
    const x0 = r.tagli[bi], x1 = r.tagli[bi + 1];
    // bordi della bozza deformati dal rumore: pietre, non mattoni
    const n = (fbm(u * 30, v * 30, 3, 30, seme + 7) - 0.5) * 0.07;
    const bord = Math.min(xr - x0, x1 - xr, YY - r.y0, r.y1 - YY) + n;
    const t = smooth(0.008, 0.035, bord);
    const id = ((r.idx * 37 + bi * 11) % 101) / 101;
    const grana = fbm(u * 110, v * 110, 3, 110, seme + 2);
    const macro = fbm(u * 4, v * 4, 4, 4, seme + 8);
    let rr = lerp(96, 142, id), gg = lerp(88, 126, id), bb = lerp(74, 100, id);
    const sp = 0.8 + 0.26 * macro + 0.12 * (grana - 0.5);
    rr *= sp; gg *= sp; bb *= sp;
    rr = lerp(126, rr, t); gg = lerp(118, gg, t); bb = lerp(102, bb, t);
    c[0] = rr; c[1] = gg; c[2] = bb;
    c[3] = t * (0.62 + 0.25 * smooth(0, 0.12, bord)) + 0.1 * grana; c[4] = 0.92; return;
  });
}

/** Worley periodico con periodi diversi su u e v. */
function worleyPeriodico(x, y, px, py, seme) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i, cy = iy + j;
    const wx = ((cx % px) + px) % px, wy = ((cy % py) + py) % py;
    const hx = valoreHash(wx, wy, seme), hy = valoreHash(wx, wy, seme + 7);
    const d = Math.hypot((cx + 0.15 + 0.7 * hx - x) * 1.0, (cy + 0.15 + 0.7 * hy - y) * 1.0);
    if (d < f1) { f2 = f1; f1 = d; id = valoreHash(wx, wy, seme + 13); }
    else if (d < f2) f2 = d;
  }
  return { f1, f2, id };
}
function valoreHash(a, b, s) { return hash2(a, b, s); }

/* --------------------------------------------------------- intonaco */
// Calce chiara, macchiata dall'umidità dal basso e dalle colature sotto
// le finestre; dove è caduta si vede il pietrame. La tinta di ogni casa
// arriva dal colore dei vertici.
function intonaco(S, seme) {
  const DIM = 4;
  return genera(S, DIM, 0.5, (u, v, c) => {
    const m = fbm(u * 5, v * 5, 5, 5, seme);
    const g = fbm(u * 90, v * 90, 3, 90, seme + 4);
    const colat = fbm(u * 26, v * 2.5, 4, 0, seme + 6);
    const caduto = smooth(0.7, 0.73, fbm(u * 3.5, v * 3.5, 5, 3.5, seme + 11));
    let rr = 196, gg = 184, bb = 160;
    const s = 0.78 + 0.24 * m + 0.06 * (g - 0.5) - 0.12 * smooth(0.5, 0.8, colat);
    rr *= s; gg *= s; bb *= s;
    let h = 0.6 + 0.08 * g + 0.05 * m;
    if (caduto > 0) {
      const ww = worleyPeriodico(u * 12, v * 26, 12, 26, seme + 1);
      const t = smooth(0.06, 0.2, ww.f2 - ww.f1);
      const pr = lerp(140, lerp(110, 150, ww.id), t), pg = lerp(132, lerp(102, 136, ww.id), t), pb = lerp(116, lerp(90, 112, ww.id), t);
      rr = lerp(rr, pr, caduto); gg = lerp(gg, pg, caduto); bb = lerp(bb, pb, caduto);
      h = lerp(h, 0.3 + 0.3 * t, caduto);
    }
    c[0] = rr; c[1] = gg; c[2] = bb;
    c[3] = h; c[4] = 0.93; return;
  });
}

/* ----------------------------------------------------------- coppi */
// Coppi alla toscana: file alternate di canali (concavi) e coperture
// (convesse), sovrapposte ogni 40 cm circa. Licheni gialli e grigi.
function coppi(S, seme) {
  const DIM = 2.4, passo = 0.2, corso = 0.4;
  const nC = Math.round(DIM / passo), nR = Math.round(DIM / corso);
  return genera(S, DIM, 1.6, (u, v, c) => {
    const X = u * DIM, Y = v * DIM;
    const col = Math.floor(X / passo), fx = X / passo - col;
    const coperto = col % 2 === 0;
    const row = Math.floor(Y / corso + (coperto ? 0.5 : 0)), fy = (Y / corso + (coperto ? 0.5 : 0)) - row;
    const prof = Math.sin(fx * Math.PI);
    let h = coperto ? 0.45 + 0.5 * prof : 0.35 - 0.3 * prof;
    // gradino alla sovrapposizione del coppo successivo
    h += (1 - fy) * 0.06 - (fy < 0.06 ? 0.08 : 0);
    const id = valore(col * 3.1 + 0.5, row * 5.3 + 0.5, 0, seme);
    const m = fbm(u * 6, v * 6, 4, 6, seme + 2);
    const g = fbm(u * 120, v * 120, 3, 120, seme + 3);
    let rr = lerp(150, 186, id), gg = lerp(78, 104, id), bb = lerp(52, 70, id);
    const om = coperto ? 0.92 + 0.1 * prof : 0.62 + 0.15 * prof;
    const s = om * (0.82 + 0.25 * m) * (0.95 + 0.1 * g);
    rr *= s; gg *= s; bb *= s;
    const lich = smooth(0.62, 0.7, fbm(u * 18, v * 18, 4, 18, seme + 9));
    rr = lerp(rr, 168, lich * 0.7); gg = lerp(gg, 158, lich * 0.7); bb = lerp(bb, 112, lich * 0.7);
    const nero = smooth(0.6, 0.75, fbm(u * 8, v * 8, 4, 8, seme + 12)) * (coperto ? 0.3 : 0.5);
    rr *= 1 - nero * 0.5; gg *= 1 - nero * 0.5; bb *= 1 - nero * 0.45;
    c[0] = rr; c[1] = gg; c[2] = bb;
    c[3] = h * 0.9 + 0.03 * g; c[4] = 0.78 + 0.1 * lich; return;
  });
}

/* ------------------------------------------------------------ legno */
// Tavole e travi di castagno o quercia, ingrigite dal sole e dalla pioggia.
function legno(S, seme, scuro) {
  const DIM = 2;
  return genera(S, DIM, 0.7, (u, v, c) => {
    const tav = Math.floor(v * 10), fv = v * 10 - tav;
    const id = valore(tav * 7.3 + 0.5, 0.5, 0, seme);
    const vena = fbm(u * 3 + id * 9, v * 140 + id * 40, 4, 0, seme + 3);
    const nodi = smooth(0.82, 0.9, fbm(u * 12, v * 30, 3, 12, seme + 5));
    const g = fbm(u * 200, v * 60, 2, 0, seme + 6);
    const giunto = smooth(0.0, 0.05, fv) * smooth(1.0, 0.95, fv);
    const base = scuro ? [78, 60, 44] : [128, 112, 94];
    const s = (0.75 + 0.35 * vena + 0.08 * g) * (1 - nodi * 0.35) * (0.86 + 0.2 * id);
    c[0] = base[0] * s * (0.55 + 0.45 * giunto); c[1] = base[1] * s * (0.55 + 0.45 * giunto); c[2] = base[2] * s * (0.55 + 0.45 * giunto);
    c[3] = 0.5 * giunto + 0.25 * vena + 0.05 * g; c[4] = 0.82; return;
  });
}

/* ------------------------------------------------------ terra battuta */
// Nel 1216 le strade non sono lastricate: la lastricatura generale è del
// 1237 (vedi PIANO.md). Terra battuta, sassi, paglia, pozzanghere.
function terra(S, seme) {
  const DIM = 8;
  return genera(S, DIM, 0.8, (u, v, c) => {
    const m = fbm(u * 4, v * 4, 5, 4, seme);
    const g = fbm(u * 70, v * 70, 4, 70, seme + 1);
    const sassi = worleyPeriodico(u * 70, v * 70, 70, 70, seme + 2);
    const sasso = smooth(0.26, 0.12, sassi.f1) * (sassi.id > 0.82 ? 0.7 : 0);
    const pozza = smooth(0.79, 0.81, fbm(u * 3, v * 3, 5, 3, seme + 5));
    const paglia = smooth(0.985, 0.995, valore(u * 300, v * 40, 0, seme + 8)) * 0.8;
    let rr = lerp(104, 132, m), gg = lerp(88, 112, m), bb = lerp(66, 84, m);
    const s = 0.86 + 0.24 * g;
    rr *= s; gg *= s; bb *= s;
    rr = lerp(rr, lerp(110, 140, sassi.id), sasso); gg = lerp(gg, lerp(102, 128, sassi.id), sasso); bb = lerp(bb, lerp(88, 110, sassi.id), sasso);
    rr = lerp(rr, 170, paglia); gg = lerp(gg, 148, paglia); bb = lerp(bb, 90, paglia);
    rr = lerp(rr, rr * 0.5, pozza); gg = lerp(gg, gg * 0.52, pozza); bb = lerp(bb, bb * 0.55, pozza);
    const h = lerp(0.5 + 0.25 * g + 0.25 * sasso, 0.42, pozza);
    c[0] = rr; c[1] = gg; c[2] = bb; c[3] = h; c[4] = lerp(0.95, 0.3, pozza);
  });
}

/* ----------------------------------------------- lastre del ponte */
// Lastre rettangolari di pietraforte in filari, consumate dal passaggio.
function lastre(S, seme) {
  const R = rng(seme), DIM = 4;
  const file = [];
  let tot = 0;
  while (tot < DIM - 0.3) { const h = R.tra(0.45, 0.75); file.push(h); tot += h; }
  const k = DIM / tot;
  let y = 0;
  const righe = file.map((h, idx) => {
    const r = { y0: y, y1: y + h * k, tagli: [], off: R() * DIM, idx };
    y = r.y1;
    let x = 0;
    while (x < DIM - 0.5) { const l = R.tra(0.6, 1.3); r.tagli.push(x); x += l; }
    r.tagli.push(DIM);
    return r;
  });
  return genera(S, DIM, 0.9, (u, v, c) => {
    const X = u * DIM, Y = v * DIM;
    const r = righe.find(r => Y < r.y1) || righe[righe.length - 1];
    let xr = (X + r.off) % DIM, bi = 0;
    while (bi < r.tagli.length - 1 && xr >= r.tagli[bi + 1]) bi++;
    const bord = Math.min(xr - r.tagli[bi], r.tagli[bi + 1] - xr, Y - r.y0, r.y1 - Y) + (fbm(u * 40, v * 40, 2, 40, seme) - 0.5) * 0.02;
    const t = smooth(0.006, 0.03, bord);
    const id = ((r.idx * 31 + bi * 7) % 97) / 97;
    const g = fbm(u * 120, v * 120, 3, 120, seme + 1);
    const m = fbm(u * 5, v * 5, 4, 5, seme + 3);
    const s = (0.78 + 0.22 * m) * (0.92 + 0.12 * g) * (0.86 + 0.22 * id);
    let rr = 128 * s, gg = 120 * s, bb = 104 * s;
    rr = lerp(76, rr, t); gg = lerp(70, gg, t); bb = lerp(60, bb, t);
    c[0] = rr; c[1] = gg; c[2] = bb;
    c[3] = t * (0.75 + 0.1 * g); c[4] = 0.7 - 0.15 * m; return;
  });
}

/* ------------------------------------------------- erba e ghiaia */
function erba(S, seme) {
  const DIM = 6;
  return genera(S, DIM, 0.6, (u, v, c) => {
    const m = fbm(u * 4, v * 4, 5, 4, seme);
    const g = fbm(u * 160, v * 160, 3, 160, seme + 1);
    const sec = smooth(0.55, 0.75, fbm(u * 7, v * 7, 4, 7, seme + 2));
    let rr = lerp(74, 118, sec), gg = lerp(92, 108, sec), bb = lerp(46, 64, sec);
    const s = (0.75 + 0.35 * m) * (0.8 + 0.35 * g);
    c[0] = rr * s; c[1] = gg * s; c[2] = bb * s;
    c[3] = 0.5 + 0.4 * g; c[4] = 0.92; return;
  });
}
function ghiaia(S, seme) {
  const DIM = 3;
  return genera(S, DIM, 1.0, (u, v, c) => {
    const w = worleyPeriodico(u * 40, v * 40, 40, 40, seme);
    const t = smooth(0.0, 0.25, w.f2 - w.f1);
    const m = fbm(u * 4, v * 4, 4, 4, seme + 2);
    const s = (0.7 + 0.4 * w.id) * (0.8 + 0.3 * m);
    c[0] = 150 * s; c[1] = 140 * s; c[2] = 122 * s;
    const umido = smooth(0.5, 0.7, m);
    c[0] *= 1 - umido * 0.35; c[1] *= 1 - umido * 0.33; c[2] *= 1 - umido * 0.3;
    c[3] = t; c[4] = lerp(0.85, 0.35, umido); return;
  });
}

/* ------------------------------------------------- marmo (Battistero) */
function marmo(S, seme) {
  const DIM = 3;
  return genera(S, DIM, 0.25, (u, v, c) => {
    const ven = Math.abs(fbm(u * 3 + fbm(u * 6, v * 6, 4, 6, seme) * 2, v * 3, 5, 3, seme + 1) - 0.5);
    const m = fbm(u * 5, v * 5, 4, 5, seme + 3);
    const s = (0.88 + 0.12 * m) * (ven < 0.025 ? 0.86 : 1);
    c[0] = 226 * s; c[1] = 222 * s; c[2] = 210 * s;
    c[3] = 0.5 + 0.1 * m; c[4] = 0.42; return;
  });
}


export const GENERATORI = {
  conci: S => conci(S, 11),
  pietrame: S => pietrame(S, 23),
  intonaco: S => intonaco(S, 37),
  coppi: S => coppi(S, 41),
  legno: S => legno(S, 53, false),
  legnoScuro: S => legno(S, 59, true),
  terra: S => terra(S, 61),
  lastre: S => lastre(S, 67),
  erba: S => erba(S, 71),
  ghiaia: S => ghiaia(S, 73),
  marmo: S => marmo(S, 79)
};
