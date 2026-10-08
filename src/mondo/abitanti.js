import {
  AnimationMixer, Bone, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, Skeleton, SkinnedMesh,
  Uint16BufferAttribute, Vector3
} from 'three';
import { clone as clonaScheletro } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { rng, smooth } from './rumore.js';

/* =====================================================================
   GLI ABITANTI

   Figure generate nel codice: uno scheletro di 19 ossa, un'unica maglia
   per corpo e vesti, una camminata calcolata a ogni fotogramma. Niente
   modelli scaricati, quindi niente licenze altrui e niente peso.

   LE VESTI (livello: ipotesi). Seguono i tratti generali dell'abito
   maschile e femminile dell'Italia comunale fra XII e XIII secolo: la
   gonnella (tunica) più corta per chi lavora e lunga per i ceti alti, le
   calze, il mantello, il cappuccio o la cuffia di lino; per le donne la
   veste lunga e, per le sposate, il capo coperto. I colori: lana non
   tinta per i più, tinte di guado (blu), robbia (rosso mattone) e verde
   per chi può permetterselo, il rosso di grana per pochissimi.
   Riferimento da controllare: M. G. Muzzarelli, Guardaroba medievale,
   Bologna, Il Mulino, 1999 [da verificare: capitoli sul Duecento].

   Il numero di persone in strada è un'ipotesi, e cambia con la giornata
   (dati/giornate.js): a Pasqua la gente va e viene dalle chiese, il
   10 febbraio lavora, compra e vende.
   ===================================================================== */

// posizioni di riposo per una persona alta 1,70 m; S = lato sinistro (+x)
const RIPOSO = {
  radice: [0, 0, 0], anche: [0, 0.95, 0], schiena: [0, 1.08, 0], petto: [0, 1.28, 0], collo: [0, 1.47, 0], testa: [0, 1.55, 0],
  spallaS: [0.19, 1.42, 0], gomitoS: [0.215, 1.13, 0], polsoS: [0.225, 0.88, 0],
  spallaD: [-0.19, 1.42, 0], gomitoD: [-0.215, 1.13, 0], polsoD: [-0.225, 0.88, 0],
  cosciaS: [0.092, 0.92, 0], ginocchioS: [0.092, 0.5, 0], cavigliaS: [0.092, 0.085, 0],
  cosciaD: [-0.092, 0.92, 0], ginocchioD: [-0.092, 0.5, 0], cavigliaD: [-0.092, 0.085, 0]
};
const PADRE = {
  anche: 'radice', schiena: 'anche', petto: 'schiena', collo: 'petto', testa: 'collo',
  spallaS: 'petto', gomitoS: 'spallaS', polsoS: 'gomitoS', spallaD: 'petto', gomitoD: 'spallaD', polsoD: 'gomitoD',
  cosciaS: 'anche', ginocchioS: 'cosciaS', cavigliaS: 'ginocchioS', cosciaD: 'anche', ginocchioD: 'cosciaD', cavigliaD: 'ginocchioD'
};
const NOMI = Object.keys(RIPOSO);
const IDX = Object.fromEntries(NOMI.map((n, i) => [n, i]));

/* ------------------------------------------------------ costruttore */
class Corpo {
  constructor() { this.p = []; this.c = []; this.si = []; this.sw = []; this.ix = []; }
  vert(x, y, z, col, pesi) {
    this.p.push(x, y, z); this.c.push(...col);
    const w = pesi.slice(0, 4); while (w.length < 4) w.push([0, 0]);
    const tot = w.reduce((a, b) => a + b[1], 0) || 1;
    for (const [b, p] of w) { this.si.push(b); this.sw.push(p / tot); }
    return this.p.length / 3 - 1;
  }
  /** Superficie di rotazione attorno all'asse verticale in (cx, cz). profilo: [[y, r], ...] dall'alto in basso. */
  tornio(cx, cz, profilo, n, col, pesi, opz = {}) {
    const a0 = opz.a0 ?? 0, a1 = opz.a1 ?? Math.PI * 2, chiuso = a1 - a0 >= Math.PI * 2 - 1e-6;
    const sz = opz.sz ?? 1, sx = opz.sx ?? 1, nn = chiuso ? n : n + 1;
    const base = this.p.length / 3;
    for (const [y, r] of profilo) for (let i = 0; i < nn; i++) {
      const a = a0 + (a1 - a0) * i / n;
      const x = cx + Math.sin(a) * r * sx, z = cz + Math.cos(a) * r * sz;
      this.vert(x, y, z, typeof col === 'function' ? col(x, y, z) : col, pesi(x, y, z, Math.sin(a)));
    }
    for (let k = 0; k + 1 < profilo.length; k++) for (let i = 0; i < n; i++) {
      const a = base + k * nn + i, b = base + k * nn + (i + 1) % nn, c = a + nn, d = b + nn;
      if (!chiuso && i === n) continue;
      this.ix.push(a, c, b, b, c, d);
    }
    if (opz.chiudiSotto) {
      const y = profilo.at(-1)[0], cIdx = this.vert(cx, y, cz, typeof col === 'function' ? col(cx, y, cz) : col, pesi(cx, y, cz, 0));
      const last = base + (profilo.length - 1) * nn;
      for (let i = 0; i < n; i++) this.ix.push(last + i, cIdx, last + (i + 1) % nn);
    }
  }
  /** Tubo da p0 a p1 (raggi r0 → r1). */
  tubo(p0, p1, r0, r1, n, m, col, pesi, schiaccia = 1) {
    const d = new Vector3(...p1).sub(new Vector3(...p0)), L = d.length(); d.normalize();
    const u = Math.abs(d.y) < 0.9 ? new Vector3(0, 1, 0).cross(d).normalize() : new Vector3(1, 0, 0).cross(d).normalize();
    const v = d.clone().cross(u).normalize();
    const base = this.p.length / 3;
    for (let k = 0; k <= m; k++) {
      const t = k / m, r = r0 + (r1 - r0) * t;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const x = p0[0] + d.x * L * t + (u.x * Math.cos(a) + v.x * Math.sin(a) * schiaccia) * r;
        const y = p0[1] + d.y * L * t + (u.y * Math.cos(a) + v.y * Math.sin(a) * schiaccia) * r;
        const z = p0[2] + d.z * L * t + (u.z * Math.cos(a) + v.z * Math.sin(a) * schiaccia) * r;
        this.vert(x, y, z, col, pesi(t));
      }
    }
    for (let k = 0; k < m; k++) for (let i = 0; i < n; i++) {
      const a = base + k * n + i, b = base + k * n + (i + 1) % n, c = a + n, dd = b + n;
      this.ix.push(a, b, c, b, dd, c);
    }
  }
  /** Ellissoide. */
  sfera(c, rx, ry, rz, n, col, pesi, taglio = -1) {
    const base = this.p.length / 3, m = Math.ceil(n / 2);
    for (let k = 0; k <= m; k++) {
      const fi = Math.PI * k / m, y = Math.cos(fi);
      // sotto il «taglio» la sfera si appiattisce: cuffie e scarpe
      for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2;
        const yy = Math.max(taglio, y);
        const rr = Math.sin(fi);
        this.vert(c[0] + Math.sin(a) * rr * rx, c[1] + yy * ry, c[2] + Math.cos(a) * rr * rz, typeof col === 'function' ? col(Math.sin(a) * rr, yy, Math.cos(a) * rr) : col, pesi);
      }
    }
    for (let k = 0; k < m; k++) for (let i = 0; i < n; i++) {
      const a = base + k * (n + 1) + i, b = a + 1, cc = a + n + 1, d = cc + 1;
      this.ix.push(a, cc, b, b, cc, d);
    }
  }
  geometria() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.c, 3));
    g.setAttribute('skinIndex', new Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.ix);
    g.computeVertexNormals();
    return g;
  }
}

/* -------------------------------------------------------- tavolozze */
const lin = c => c.map(v => Math.pow(v / 255, 2.2));      // da sRGB a lineare
const PELLE = [[222, 182, 150], [205, 160, 125], [190, 145, 110], [228, 192, 165], [176, 130, 98]].map(lin);
const CAPELLI = [[38, 28, 22], [58, 40, 28], [24, 20, 18], [92, 64, 40], [120, 112, 104]].map(lin);
const LANA_GREZZA = [[112, 92, 70], [88, 76, 64], [132, 118, 96], [78, 74, 70], [104, 84, 60], [146, 134, 112], [96, 88, 66]].map(lin);
const TINTE = [[46, 66, 116], [134, 60, 40], [62, 92, 56], [110, 74, 46], [40, 52, 88], [156, 112, 56], [92, 50, 64], [120, 48, 36], [70, 104, 120]].map(lin);
const GRANA = [[150, 30, 32], [118, 22, 28]].map(lin);
const LINO = [[226, 220, 204], [214, 206, 188]].map(lin);
const CUOIO = [[58, 42, 30], [44, 34, 26], [74, 54, 36]].map(lin);

/* ---------------------------------------------------------- figura */
/** Costruisce la maglia di una figura a partire da un seme. */
export function creaFigura(seme) {
  const R = rng(seme);
  const donna = R.vero(0.48);
  const ceto = R() < 0.62 ? 'popolo' : R() < 0.8 ? 'mercante' : 'nobile';
  const pelle = R.scegli(PELLE), capelli = R.scegli(CAPELLI);
  const veste = ceto === 'popolo' ? (R.vero(0.45) ? R.scegli(TINTE).map(v => v * 0.8) : R.scegli(LANA_GREZZA)) : ceto === 'mercante' ? (R.vero(0.8) ? R.scegli(TINTE) : R.scegli(LANA_GREZZA)) : (R.vero(0.5) ? R.scegli(GRANA) : R.scegli(TINTE));
  const calze = ceto === 'nobile' && R.vero(0.5) ? R.scegli(GRANA) : R.scegli([...LANA_GREZZA, ...TINTE.slice(0, 3)]);
  const scarpe = R.scegli(CUOIO);
  const mantello = (ceto !== 'popolo' && R.vero(0.6)) || R.vero(0.15) ? (ceto === 'nobile' ? R.scegli([...TINTE, ...GRANA]) : R.scegli([...LANA_GREZZA, ...TINTE])) : null;
  const orlo = donna ? 0.04 : ceto === 'popolo' ? R.tra(0.42, 0.55) : ceto === 'mercante' ? R.tra(0.2, 0.32) : R.tra(0.06, 0.14);
  const copricapo = donna ? (R.vero(0.75) ? 'velo' : 'trecce') : R.scegli(['cuffia', 'cappuccio', 'cappuccio', 'nudo', 'nudo', ceto === 'nobile' ? 'berretto' : 'cappuccio']);
  const barba = !donna && R.vero(0.45);
  const vari = v => v.map(c => c * R.tra(0.9, 1.1));

  const C = new Corpo();
  const P = RIPOSO;
  const w1 = b => () => [[IDX[b], 1]];

  // --- gambe: calze, poi le scarpe
  for (const lato of ['S', 'D']) {
    const s = lato === 'S' ? 1 : -1;
    const [cx, cy] = [P['coscia' + lato][0], P['coscia' + lato][1]];
    C.tubo([cx, cy + 0.04, 0], [cx, P['ginocchio' + lato][1], 0.01], 0.072, 0.05, 8, 3, calze,
      t => [[IDX['coscia' + lato], 1 - smooth(0.75, 1, t) * 0.5], [IDX['ginocchio' + lato], smooth(0.75, 1, t) * 0.5]]);
    C.tubo([cx, P['ginocchio' + lato][1], 0.01], [cx * 1.0 + 0.004 * s, 0.1, 0], 0.05, 0.036, 8, 3, calze,
      t => [[IDX['ginocchio' + lato], 1 - smooth(0.85, 1, t) * 0.4], [IDX['caviglia' + lato], smooth(0.85, 1, t) * 0.4]]);
    C.sfera([cx, 0.045, 0.05], 0.048, 0.045, 0.125, 8, scarpe, w1('caviglia' + lato)(), -0.95);
  }

  // --- busto (la parte alta della veste) e gonna
  const vestePesi = (x, y) => {
    const ka = smooth(1.42, 1.2, y), kb = smooth(1.2, 1.0, y);
    return [[IDX.petto, 1 - ka], [IDX.schiena, ka * (1 - kb)], [IDX.anche, kb]];
  };
  const largo = donna ? 0.9 : 1;
  C.tornio(0, 0, [[1.47, 0.07], [1.45, 0.17], [1.38, 0.2 * largo], [1.25, 0.175], [1.1, 0.155], [1.0, 0.165]], 14, veste, vestePesi, { sz: 0.66 });
  // gonna: segue le gambe in proporzione alla distanza dalla vita
  const svasa = donna ? 0.3 : ceto === 'popolo' ? 0.24 : 0.27;
  const prof = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6; const y = 1.0 + (orlo - 1.0) * t; prof.push([y, 0.165 + (svasa - 0.165) * Math.pow(t, 0.8)]); }
  C.tornio(0, 0, prof, 18, veste, (x, y, z, sa) => {
    const k = smooth(1.0, orlo, y) * 0.9;
    const lato = smooth(-0.55, 0.55, sa);
    return [[IDX.anche, 1 - k], [IDX.cosciaS, k * lato], [IDX.cosciaD, k * (1 - lato)]];
  }, { sz: 0.78 });
  // cintura
  if (!donna || R.vero(0.5)) C.tornio(0, 0, [[1.03, 0.172], [0.995, 0.172]], 14, R.scegli(CUOIO), () => [[IDX.anche, 1]], { sz: 0.7 });

  // --- braccia: maniche e mani
  for (const lato of ['S', 'D']) {
    const sp = P['spalla' + lato], go = P['gomito' + lato], po = P['polso' + lato];
    C.tubo([sp[0] * 0.92, sp[1] + 0.02, 0], go, 0.058, 0.045, 8, 3, veste,
      t => [[IDX.petto, (1 - smooth(0, 0.35, t)) * 0.45], [IDX['spalla' + lato], 1 - (1 - smooth(0, 0.35, t)) * 0.45]]);
    C.tubo(go, po, 0.045, 0.038, 8, 3, veste,
      t => [[IDX['spalla' + lato], (1 - smooth(0, 0.25, t)) * 0.5], [IDX['gomito' + lato], 1 - (1 - smooth(0, 0.25, t)) * 0.5]]);
    C.sfera([po[0], po[1] - 0.075, 0.01], 0.034, 0.08, 0.022, 8, pelle, w1('polso' + lato)());
  }
  // mantello: dalle spalle alle ginocchia, aperto davanti
  if (mantello) {
    const fino = donna ? 0.25 : R.tra(0.35, 0.6);
    const pr = [[1.47, 0.12], [1.42, 0.24], [1.2, 0.27], [0.9, 0.3], [fino, 0.34]];
    C.tornio(0, -0.01, pr, 16, vari(mantello), (x, y, z, sa) => {
      const k = smooth(1.0, fino, y) * 0.5, lato = smooth(-0.6, 0.6, sa);
      return [[IDX.petto, smooth(1.0, 1.35, y)], [IDX.anche, (1 - smooth(1.0, 1.35, y)) * (1 - k)], [IDX.cosciaS, k * lato], [IDX.cosciaD, k * (1 - lato)]];
    }, { a0: Math.PI * 0.62, a1: Math.PI * 1.38, sz: 0.85 });
  }

  // --- collo e testa
  C.tubo([0, 1.44, 0], [0, 1.55, 0.005], 0.05, 0.045, 8, 1, pelle, t => [[IDX.collo, 1 - t * 0.5], [IDX.testa, t * 0.5]]);
  const testa = [0, 1.615, 0.01];
  const ombraOcchi = pelle.map(v => v * 0.55), labbra = [pelle[0] * 0.85, pelle[1] * 0.62, pelle[2] * 0.6];
  C.sfera(testa, 0.088, 0.112, 0.1, 18, (x, y, z) => {
    // capelli dietro e sopra, viso davanti; barba sotto
    if (barba && y < -0.22 && z > -0.2) return capelli;
    if (y > 0.4 || (z < -0.15 && y > -0.4)) return capelli;
    // il viso, appena accennato: orbite, sopracciglia, bocca
    if (z > 0.7 && y > 0.06 && y < 0.24 && Math.abs(Math.abs(x) - 0.36) < 0.16) return ombraOcchi;
    if (z > 0.7 && y >= 0.24 && y < 0.32 && Math.abs(Math.abs(x) - 0.36) < 0.18) return capelli;
    if (z > 0.85 && y > -0.42 && y < -0.32 && Math.abs(x) < 0.2) return labbra;
    return pelle;
  }, [[IDX.testa, 1]]);
  C.sfera([0, 1.6, 0.104], 0.016, 0.03, 0.02, 6, pelle.map(v => v * 0.92), [[IDX.testa, 1]]);   // naso
  if (copricapo === 'cuffia') C.sfera([0, 1.635, 0.0], 0.096, 0.1, 0.104, 12, R.scegli(LINO), [[IDX.testa, 1]], -0.05);
  else if (copricapo === 'cappuccio') {
    const col = vari(R.vero(0.5) ? veste : R.scegli(LANA_GREZZA));
    // il cappuccio sta indietro: il viso resta scoperto
    C.sfera([0, 1.645, -0.045], 0.106, 0.12, 0.1, 12, col, [[IDX.testa, 1]], -0.2);
    C.tornio(0, 0, [[1.53, 0.1], [1.47, 0.2], [1.36, 0.27]], 14, col, (x, y) => [[IDX.collo, smooth(1.4, 1.52, y)], [IDX.petto, 1 - smooth(1.4, 1.52, y)]], { sz: 0.8 });
  } else if (copricapo === 'berretto') C.tornio(0, 0.005, [[1.74, 0.05], [1.72, 0.092], [1.67, 0.1]], 12, vari(R.scegli(TINTE)), () => [[IDX.testa, 1]], { chiudiSotto: false });
  else if (copricapo === 'velo') {
    const lino = R.scegli(LINO);
    C.sfera([0, 1.64, -0.005], 0.1, 0.115, 0.11, 12, lino, [[IDX.testa, 1]], -0.15);
    C.tornio(0, -0.01, [[1.6, 0.104], [1.5, 0.12], [1.42, 0.2], [1.36, 0.25]], 14, lino, (x, y) => [[IDX.testa, smooth(1.48, 1.58, y)], [IDX.petto, 1 - smooth(1.48, 1.58, y)]], { a0: Math.PI * 0.7, a1: Math.PI * 1.3, sz: 0.95 });
  } else if (copricapo === 'trecce') {
    C.tubo([0, 1.6, -0.09], [0, 1.25, -0.12], 0.03, 0.02, 6, 3, capelli, t => [[IDX.testa, 1 - t], [IDX.petto, t]]);
  }

  const altezza = (donna ? R.tra(1.5, 1.64) : R.tra(1.6, 1.76)) * (R.vero(0.08) ? 0.68 : 1);   // qualche ragazzo
  return { geometria: C.geometria(), altezza, ceto, donna };
}

function scheletro() {
  const ossa = NOMI.map(n => { const b = new Bone(); b.name = n; return b; });
  for (const n of NOMI) {
    const b = ossa[IDX[n]], p = RIPOSO[n];
    if (PADRE[n]) {
      const q = RIPOSO[PADRE[n]];
      b.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      ossa[IDX[PADRE[n]]].add(b);
    } else b.position.set(...p);
  }
  return ossa;
}

/* =========================================================== PERCORSI */
// Il grafo delle strade del 1216: i nodi sono i vertici delle strade, i
// nodi a meno di 3 m l'uno dall'altro si fondono negli incroci.
function grafo(strade, extra, raggio) {
  const nodi = [], archi = [];
  const trova = (x, z) => {
    for (let i = 0; i < nodi.length; i++) if (Math.hypot(nodi[i].x - x, nodi[i].z - z) < 3) return i;
    nodi.push({ x, z, vicini: [] }); return nodi.length - 1;
  };
  const aggiungi = (pts, larg) => {
    let prec = null;
    for (const [x, z] of pts) {
      if (Math.hypot(x, z) > raggio) { prec = null; continue; }
      const i = trova(x, z);
      if (prec !== null && prec !== i) { nodi[prec].vicini.push({ n: i, larg }); nodi[i].vicini.push({ n: prec, larg }); archi.push([prec, i, larg]); }
      prec = i;
    }
  };
  for (const s of strade) if (!s.area) aggiungi(s.punti, s.larghezza);
  for (const e of extra) aggiungi(e.punti, e.larghezza);
  return { nodi, archi };
}

/* =========================================================== ABITANTI */
export class Abitanti {
  constructor(scene, strade, griglia, quotaIn, opz = {}) {
    this.scene = scene; this.quotaIn = quotaIn; this.griglia = griglia;
    this.mat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
    const R = rng(410);
    const g = grafo(strade, opz.extra || [], opz.raggio || 330);
    this.g = g;
    this.figure = [];
    // le figure di Blender, se ci sono; altrimenti quelle generate qui
    const modelli = opz.modelli;
    this.infoMov = modelli?.infoMov;
    const varianti = modelli ? modelli.varianti : [];
    if (!modelli) for (let i = 0; i < (opz.varianti || 48); i++) varianti.push(creaFigura(1000 + i));
    const altezza = v => modelli ? v.info.altezza : v.altezza;
    const archi = g.archi.filter(([a, b]) => g.nodi[a].vicini.length + g.nodi[b].vicini.length > 2);
    for (let i = 0; i < (opz.numero || 140); i++) {
      const v = varianti[i % varianti.length];
      const [a, b, larg] = R.scegli(archi.length ? archi : g.archi);
      const f = modelli ? this.nuovaModello(v, R, 'cammina') : this.nuova(v, R);
      f.da = a; f.a = b; f.t = R(); f.corsiaMax = Math.max(0, larg / 2 - 0.6); f.corsia = R.tra(-1, 1) * f.corsiaMax * 0.7;
      f.vel = (f.clipVel ? f.clipVel * R.tra(0.9, 1.1) : R.tra(0.95, 1.35)) * (altezza(v) / 1.68);
      if (f.azione && f.clipVel) f.azione.timeScale = f.vel / f.clipVel;
      this.figure.push(f);
    }
    // animali condotti a mano: muli e asini con la soma, qualche cavallo.
    // Chi li conduce cammina al passo dell'animale, alla sua testa.
    const animali = opz.animali;
    if (animali && modelli) {
      const tipi = ['mulo', 'asino', 'mulo', 'cavallo', 'asino'].filter(t => animali[t]);
      const guide = this.figure.filter(f => f.modello);
      for (let i = 0; i < Math.min(opz.numeroAnimali || 0, guide.length, 40); i++) {
        const guida = guide[(i * 7) % guide.length];
        if (guida.conduce) continue;
        const a = this.nuovoAnimale(animali[tipi[i % tipi.length]], R);
        a.guida = guida; guida.conduce = a;
        guida.vel = a.clipVel * R.tra(0.92, 1.04);
        if (guida.azione && guida.clipVel) guida.azione.timeScale = guida.vel / guida.clipVel;
        a.vel = guida.vel;
        this.figure.push(a);
      }
    }
    // gruppi fermi a parlare, dove la gente si raduna
    for (const [x, z, n] of (opz.gruppi || [])) {
      const cx = x, cz = z;
      for (let k = 0; k < n; k++) {
        const v = varianti[R.intero(0, varianti.length - 1)];
        const a = k / n * Math.PI * 2 + R.tra(-0.3, 0.3), r = 0.75 + 0.15 * n;
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        if (!griglia.percorribile(x, z)) continue;
        const f = modelli ? this.nuovaModello(v, R, k === 0 ? 'parla' : R.scegli(['fermo', 'guarda', 'fermo', 'parla'])) : this.nuova(v, R);
        f.fermo = true; f.x = x; f.z = z;
        f.dir = Math.atan2(cx - f.x, cz - f.z);
        f.parla = R.tra(0, 10);
        this.figure.push(f);
      }
    }
    this.tempo = 0;
  }

  nuova(v, R) {
    const mesh = new SkinnedMesh(v.geometria, this.mat);
    const ossa = scheletro();
    mesh.add(ossa[0]);
    mesh.updateMatrixWorld(true);
    mesh.bind(new Skeleton(ossa));
    mesh.scale.setScalar(v.altezza / 1.7);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.frustumCulled = true;
    v.geometria.boundingSphere || v.geometria.computeBoundingSphere();
    this.scene.add(mesh);
    const o = Object.fromEntries(NOMI.map(n => [n, ossa[IDX[n]]]));
    return { mesh, o, fase: R.tra(0, 6.28), x: 0, z: 0, dir: 0, fermo: false, sfasa: R.tra(0, 100), v };
  }

  /** Una figura di Blender: copia dello scheletro e un mixer di animazione. */
  nuovaModello(v, R, ruolo) {
    const radice = clonaScheletro(v.scene);
    const maglie = [];
    radice.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; maglie.push(o); } });
    this.scene.add(radice);
    const mixer = new AnimationMixer(radice);
    let nome = ruolo;
    if (ruolo === 'cammina') nome = v.info.eta > 0.75 ? 'cammina_lento' : R.scegli(['cammina2', 'cammina2', 'passeggia', 'cammina_lento']);
    const clip = v.clip[nome] || v.clip.cammina2 || Object.values(v.clip)[0];
    const azione = mixer.clipAction(clip);
    azione.play();
    azione.time = R() * clip.duration;
    const info = this.infoMov?.[clip.name] || {};
    return {
      mesh: radice, maglie, mixer, azione, clipVel: info.velocita ? info.velocita * v.scala : 0, ombra: true, accum: 0,
      x: 0, z: 0, dir: 0, fermo: false, sfasa: R.tra(0, 100), v: { altezza: v.info.altezza }, modello: true
    };
  }

  /** Un animale di Blender: copia dello scheletro, andatura al passo. */
  nuovoAnimale(v, R) {
    const radice = clonaScheletro(v.scene);
    const maglie = [];
    radice.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; maglie.push(o); } });
    this.scene.add(radice);
    const mixer = new AnimationMixer(radice);
    const clip = v.clip.passo || Object.values(v.clip)[0];
    const azione = mixer.clipAction(clip);
    azione.play();
    azione.time = R() * clip.duration;
    return {
      mesh: radice, maglie, mixer, azione, clipVel: v.info.passo?.velocita || 1.4, ombra: true, accum: 0,
      x: 0, z: 0, dir: 0, fermo: false, sfasa: R.tra(0, 100), v: { altezza: 1.7 }, modello: true, animale: v.nome,
      lato: R.vero(0.5) ? 1 : -1
    };
  }

  visibili(on) { for (const f of this.figure) f.mesh.visible = on; this.nascosti = !on; }

  /** Toglie tutte le figure dalla scena, per esempio quando cambia la giornata. */
  distruggi() {
    for (const f of this.figure) { this.scene.remove(f.mesh); f.mixer?.stopAllAction(); }
    this.figure = [];
  }

  aggiorna(dt, cam) {
    if (this.nascosti) return;
    this.tempo += dt;
    const g = this.g;
    this.separa();
    for (const f of this.figure) {
      if (f.guida) {
        // l'animale segue chi lo conduce: un passo indietro e di lato. Guarda
        // dove va e avanza solo quando è girato da quella parte: quando chi
        // lo conduce torna indietro, prima si volta e poi lo segue
        const g = f.guida, fx = Math.sin(g.dir), fz = Math.cos(g.dir);
        const tx = g.x - fx * 1.1 + fz * f.lato * 0.75, tz = g.z - fz * 1.1 - fx * f.lato * 0.75;
        if (!f.inizio) { f.x = tx; f.z = tz; f.dir = g.dir; f.inizio = true; }
        const mx = tx - f.x, mz = tz - f.z, dist = Math.hypot(mx, mz);
        let dd = (dist > 0.3 ? Math.atan2(mx, mz) : g.dir) - f.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
        f.dir += dd * Math.min(1, dt * 3);
        const allineato = Math.max(0, Math.cos(dd)) ** 2;
        const k = Math.min(1, dt * 3) * allineato;
        let sx = mx * k, sz = mz * k;
        const avanti = sx * Math.sin(f.dir) + sz * Math.cos(f.dir);
        if (avanti < 0) { sx -= avanti * Math.sin(f.dir); sz -= avanti * Math.cos(f.dir); }
        f.x += sx; f.z += sz;
        if (f.azione) f.azione.timeScale = Math.max(0.3 * g.vel, (g.velEff ?? g.vel) * allineato) / f.clipVel;
      } else if (!f.fermo) {
        // avanza lungo l'arco; al nodo sceglie una strada nuova. Si avanza
        // solo nella misura in cui si guarda dove si va: in una svolta
        // stretta, o in fondo a un vicolo cieco dove si torna indietro, la
        // figura prima si gira quasi sul posto e poi riparte (prima arretrava
        // per qualche passo guardando avanti)
        const A = g.nodi[f.da], Bn = g.nodi[f.a];
        const L = Math.hypot(Bn.x - A.x, Bn.z - A.z) || 1;
        let dv = Math.atan2(Bn.x - A.x, Bn.z - A.z) - f.dir; dv = Math.atan2(Math.sin(dv), Math.cos(dv));
        const allineata = f.inizio ? Math.max(0, Math.cos(dv)) ** 2 : 1;
        const vel = (f.velEff ?? f.vel) * allineata;
        f.t += vel * dt / L;
        // mentre si gira fa piccoli passi: il passo non si ferma del tutto
        if (f.azione && f.clipVel) f.azione.timeScale = Math.max(0.3 * f.vel, vel) / f.clipVel;
        if (f.t >= 1) {
          const prima = f.da; f.da = f.a; f.t = 0;
          const scelte = g.nodi[f.da].vicini.filter(v => v.n !== prima);
          const s = scelte.length ? scelte[Math.floor(Math.random() * scelte.length)] : { n: prima, larg: 3 };
          f.a = s.n; f.corsiaMax = Math.max(0, s.larg / 2 - 0.6);
        }
        f.corsia = Math.max(-f.corsiaMax, Math.min(f.corsiaMax, f.corsia));
        const A2 = g.nodi[f.da], B2 = g.nodi[f.a];
        const dx = B2.x - A2.x, dz = B2.z - A2.z, l = Math.hypot(dx, dz) || 1;
        const tx = A2.x + dx * f.t + (-dz / l) * f.corsia, tz = A2.z + dz * f.t + (dx / l) * f.corsia;
        const dirT = Math.atan2(dx, dz);
        if (!f.inizio) { f.x = tx; f.z = tz; f.dir = dirT; f.inizio = true; }
        let dd = dirT - f.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
        // si gira più svelto quando deve voltarsi del tutto
        f.dir += dd * Math.min(1, dt * (Math.abs(dd) > 1.2 ? 8 : 5));
        // verso il punto sulla strada, ma senza mai arretrare rispetto a dove guarda
        const k = Math.min(1, dt * 4);
        const px = f.x, pz = f.z;
        let mx = (tx - f.x) * k, mz = (tz - f.z) * k;
        const avanti = mx * Math.sin(f.dir) + mz * Math.cos(f.dir);
        if (avanti < 0) { mx -= avanti * Math.sin(f.dir); mz -= avanti * Math.cos(f.dir); }
        f.x += mx; f.z += mz;
        const mosso = Math.hypot(f.x - px, f.z - pz);
        // un ciclo (due passi) ogni 1,64 volte l'altezza: circa 1,4 m per un adulto
        f.fase += mosso / (0.82 * f.v.altezza) * Math.PI;
      }
      const d = Math.hypot(f.x - cam.x, f.z - cam.z);
      const vis = d < 160;
      f.mesh.visible = vis;
      if (!vis) continue;
      f.mesh.position.set(f.x, this.quotaIn(f.x, f.z), f.z);
      f.mesh.rotation.y = f.dir;
      if (f.modello) {
        const ombra = d < 50;
        if (ombra !== f.ombra) { f.ombra = ombra; for (const m of f.maglie) m.castShadow = ombra; }
        // da lontano si anima meno spesso, ma il tempo non si perde
        f.accum += dt;
        if (d > 70 && ((this.tempo * 20 + f.sfasa) | 0) % 3) continue;
        f.mixer.update(f.accum); f.accum = 0;
        continue;
      }
      f.mesh.castShadow = d < 50;
      if (d > 70 && ((this.tempo * 20 + f.sfasa) | 0) % 3) continue;   // da lontano si anima meno spesso
      if (f.fermo) this.posaFerma(f); else this.posaCammino(f);
    }
  }

  /** Chi cammina non passa attraverso chi gli sta davanti: si sposta di lato o rallenta. */
  separa() {
    const F = this.figure;
    for (let i = 0; i < F.length; i++) {
      const a = F[i];
      if (a.fermo || a.guida) continue;
      a.velEff = a.vel;
      for (let j = 0; j < F.length; j++) {
        if (i === j) continue;
        const b = F[j], dx = b.x - a.x, dz = b.z - a.z;
        if (dx * dx + dz * dz > 0.64) continue;
        if (b.fermo) { a.corsia += (a.corsia >= 0 ? 0.04 : -0.04); continue; }
        // b è davanti ad a? allora a rallenta e cambia corsia
        if (dx * Math.sin(a.dir) + dz * Math.cos(a.dir) > 0) { a.velEff = Math.min(a.velEff, b.vel * 0.9); a.corsia += (a.corsia >= b.corsia ? 0.03 : -0.03); }
      }
    }
  }

  posaCammino(f) {
    const o = f.o, a = f.fase, s = Math.sin(a), c = Math.cos(a);
    const swS = Math.max(0, c), swD = Math.max(0, -c);
    o.cosciaS.rotation.x = -0.4 * s; o.cosciaD.rotation.x = 0.4 * s;
    o.ginocchioS.rotation.x = 0.85 * swS * swS + 0.08; o.ginocchioD.rotation.x = 0.85 * swD * swD + 0.08;
    o.cavigliaS.rotation.x = -0.3 * s * 0.6 - 0.2 * swS; o.cavigliaD.rotation.x = 0.3 * s * 0.6 - 0.2 * swD;
    o.anche.position.y = 0.95 - 0.012 + 0.018 * Math.cos(2 * a);
    o.anche.rotation.y = 0.07 * s; o.anche.rotation.z = 0.035 * s;
    o.petto.rotation.y = -0.1 * s; o.schiena.rotation.x = 0.04;
    o.spallaS.rotation.x = 0.32 * s; o.spallaD.rotation.x = -0.32 * s;
    o.spallaS.rotation.z = 0.07; o.spallaD.rotation.z = -0.07;
    o.gomitoS.rotation.x = -0.22 - 0.2 * Math.max(0, -s); o.gomitoD.rotation.x = -0.22 - 0.2 * Math.max(0, s);
    o.testa.rotation.y = 0.15 * Math.sin(this.tempo * 0.3 + f.sfasa);
  }

  posaFerma(f) {
    const o = f.o, t = this.tempo + f.sfasa;
    for (const n of ['cosciaS', 'cosciaD', 'ginocchioS', 'ginocchioD', 'cavigliaS', 'cavigliaD']) o[n].rotation.x = 0;
    o.anche.position.y = 0.95;
    o.anche.rotation.z = 0.03 * Math.sin(t * 0.35);
    o.ginocchioS.rotation.x = Math.max(0, 0.08 * Math.sin(t * 0.35));
    o.petto.rotation.x = 0.015 * Math.sin(t * 1.4);
    o.testa.rotation.y = 0.35 * Math.sin(t * 0.21) * Math.sin(t * 0.07);
    o.spallaS.rotation.z = 0.06; o.spallaD.rotation.z = -0.06;
    // chi parla accompagna con la mano
    const parla = Math.sin(t * 0.4) > 0.3;
    o.spallaD.rotation.x = parla ? -0.35 - 0.12 * Math.sin(t * 3.1) : 0.02;
    o.gomitoD.rotation.x = parla ? -1.0 - 0.25 * Math.sin(t * 2.3) : -0.15;
    o.spallaS.rotation.x = 0.02; o.gomitoS.rotation.x = -0.15;
  }
}
