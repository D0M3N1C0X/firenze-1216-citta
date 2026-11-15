import {
  BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, RepeatWrapping, SRGBColorSpace, Vector3
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MAT_CERTEZZA } from './materiali.js';
import { VICINO, distanzaFiume, fosso, quota } from './terreno.js';
import { dentroCerchia } from './fondale.js';
import { LIBERO, RECINTO } from './griglia.js';
import { rng } from './rumore.js';

/* =====================================================================
   LA CAMPAGNA COLTIVATA

   Decisione del 10 novembre 2026: orti, campi e vigne distinti; i campi
   seguono la stagione della giornata scelta; il dettaglio lungo le strade
   fuori porta, più lontano solo il colore dei campi sul terreno.

   - Lungo ogni strada fuori dalla cerchia del 1172–75, da una parte e
     dall'altra, il terreno libero è diviso in strisce larghe 16–30 m e
     profonde 55–110 m, perpendicolari alla strada: orti recintati dietro
     le case dei borghi e vicino alla città, grano, maggese e prato nella
     piana, vigne basse a filari sui colli (lottizzaCampi).
   - Più lontano il terreno prende solo il colore dei campi, a blocchi di
     strisce (campoLontano).
   - Il colore del terreno e gli oggetti cambiano con la stagione: terra
     arata e viti spoglie d'inverno, grano verde e basso a Pasqua, alto a
     maggio (Campagna.stagione).
   - Viti, siepi, graticci, cavoli e canne sono i modelli di
     strumenti/campagna/campagna.py, ripetuti per istanze solo vicino a chi
     guarda; il grano è fatto di teli verticali con gli steli disegnati.

   Livello: ipotesi, tutto. Le fonti sul contado del Duecento non danno una
   pianta dei campi: la divisione in strisce lungo le strade, le
   proporzioni tra le colture, la vite bassa a palo e non maritata agli
   alberi sono scelte di leggibilità [da verificare: studi sul paesaggio
   agrario toscano]. Siepi e graticci fermano chi cammina (decisione del
   14 novembre 2026): ogni orto e ogni siepe sul fronte ha un varco di 2 m.
   ===================================================================== */

export const TIPI_CAMPO = ['', 'grano', 'maggese', 'prato', 'vigna', 'orto'];
const NUM = Object.fromEntries(TIPI_CAMPO.map((t, i) => [t, i]));

/** La stagione dei campi dal giorno dell'anno (gregoriano) della giornata. */
export function stagioneDi(doy) {
  return doy < 70 || doy > 320 ? 'inverno' : doy < 115 ? 'primavera' : doy < 170 ? 'maggio' : 'estate';
}

const caso = (a, b) => {                       // un numero in [0, 1) da due interi, sempre lo stesso
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Che cosa si coltiva: sui colli soprattutto vigna, nella piana soprattutto grano. */
function coltura(r, colle) {
  if (colle) return r < 0.6 ? 'vigna' : r < 0.8 ? 'prato' : 'grano';
  return r < 0.5 ? 'grano' : r < 0.72 ? 'maggese' : 'prato';
}

/**
 * Il campo lontano dalle strade: blocchi di 150 × 120 m, ruotati di poco, ognuno a strisce
 * in un verso o nell'altro. Rende [tipo, variazione].
 */
export function campoLontano(x, z, y) {
  const u = x * 0.955 + z * 0.296, v = -x * 0.296 + z * 0.955;
  const bu = Math.floor(u / 150), bv = Math.floor(v / 120), h = caso(bu, bv);
  const larga = 16 + Math.floor(h * 3) * 5;
  const k = Math.floor((h < 0.5 ? u : v) / larga);
  const r = caso(bu * 31 + bv * 17 + 5, k);
  return [NUM[coltura(r, y > 4.5)], caso(k, bu * 7 + bv)];
}

/**
 * I campi lungo le strade fuori porta. Rende { campi, di(x, z) }: l'elenco delle strisce e
 * la funzione che dice di quale striscia è un punto (su una maglia di 2 m).
 * Non tocca la pianta del suolo: sui campi si cammina.
 */
export function lottizzaCampi({ strade, griglia, dentroNuova = null }) {
  const C = 2, x0 = VICINO.x - VICINO.lato / 2, z0 = VICINO.z - VICINO.lato / 2, n = Math.ceil(VICINO.lato / C);
  const id = new Uint16Array(n * n), stato = new Uint8Array(n * n);
  const cella = (x, z) => {
    const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C);
    return i < 8 || j < 8 || i >= n - 8 || j >= n - 8 ? -1 : j * n + i;
  };
  // una cella (2 m) è libera se lo sono tutte le sedici celle da mezzo metro della pianta del suolo che copre:
  // né strada né casa né mura; e fuori dalla cerchia, lontano dall'Arno e dal fossato
  const QUARTI = [-0.75, -0.25, 0.25, 0.75];
  const libera = k => {
    if (stato[k]) return stato[k] === 1;
    const x = x0 + (k % n + 0.5) * C, z = z0 + (Math.floor(k / n) + 0.5) * C;
    let ok = distanzaFiume(x, z) > 14 && fosso(x, z) === 0;
    for (const [dx, dz] of [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) if (ok && dentroCerchia(x + dx, z + dz)) ok = false;
    for (const dx of QUARTI) for (const dz of QUARTI) if (ok && griglia.get(x + dx, z + dz) !== LIBERO) ok = false;
    stato[k] = ok ? 1 : 2;
    return ok;
  };
  const R = rng(4107);
  const campi = [];

  const nuovo = (tipo, ox, oz, ux, uz, vx, vz, w, b0, b1) => {
    const num = campi.length + 1;
    if (num > 65000) return null;
    const mie = [];
    let sx = 0, sz = 0;
    for (let a = 0.5; a < w; a += 1) {
      let cominciato = false;
      for (let b = b0 + 0.5; b < b1; b += 1) {
        const x = ox + ux * a + vx * b, z = oz + uz * a + vz * b, k = cella(x, z);
        if (k >= 0 && id[k] === num) { cominciato = true; continue; }
        if (k < 0 || id[k] || !libera(k)) { if (cominciato) break; continue; }   // oltre una casa o un'altra strada il campo non continua
        id[k] = num; mie.push(k); cominciato = true;
        sx += x0 + (k % n + 0.5) * C; sz += z0 + (Math.floor(k / n) + 0.5) * C;
      }
    }
    if (mie.length < 40) { for (const k of mie) id[k] = 0; return null; }       // meno di 160 m²: niente
    const cx = sx / mie.length, cz = sz / mie.length;
    const c = { n: num, tipo, ox, oz, ux, uz, vx, vz, w, b0, b1, cx, cz, celle: mie.length, var: R(), raggio: Math.hypot(w, b1 - b0) / 2 + 4,
      siepeFronte: R.vero(0.55), siepeLato: R.vero(0.35) };
    campi.push(c);
    return c;
  };

  for (const s of strade) {
    if (s.area || !s.punti || s.punti.length < 2) continue;
    const off = (s.larghezza || 6) / 2 + 2.5;
    for (let k = 0; k + 1 < s.punti.length; k++) {
      const [ax, az] = s.punti[k], [bx, bz] = s.punti[k + 1], L = Math.hypot(bx - ax, bz - az);
      if (L < 10) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L;
      for (const lato of [1, -1]) {
        const vx = -uz * lato, vz = ux * lato;
        let pos = 0;
        while (pos < L - 9) {
          let w = R.tra(16, 30); if (L - pos - w < 9) w = L - pos;
          const fondo = off + R.tra(55, 110);
          const ox = ax + ux * pos, oz = az + uz * pos;
          // ci sono case sul fronte? allora dietro c'è l'orto
          let case_ = 0;
          for (let a = 2; a < w; a += 4) if (griglia.get(ox + ux * a + vx * (off + 5), oz + uz * a + vz * (off + 5)) !== LIBERO) case_++;
          const conCase = case_ >= 1;
          const mx = ox + ux * w / 2 + vx * (off + 35), mz = oz + uz * w / 2 + vz * (off + 35);
          const pOrto = conCase ? 0.85 : dentroNuova?.(mx, mz) ? 0.4 : 0.12;
          let b = off;
          if (R.vero(pOrto)) { const b1 = b + R.tra(22, 34) + (conCase ? 12 : 0); nuovo('orto', ox, oz, ux, uz, vx, vz, w, b, b1); b = b1; }
          if (b < fondo - 15) nuovo(coltura(R(), quota(mx, mz) > 4.5), ox, oz, ux, uz, vx, vz, w, b, fondo);
          pos += w;
        }
      }
    }
  }
  const di = (x, z) => { const k = cella(x, z); return k >= 0 && id[k] ? campi[id[k] - 1] : null; };
  return { campi, di };
}

/**
 * Dove stanno i graticci degli orti e le siepi di un campo: [tipo, a, b, verso] nelle coordinate
 * del campo (a lungo la strada, b in profondità; verso 'u' o 'v'). Lo usano sia il disegno sia la
 * pianta del suolo, così quello che si vede è quello che ferma. Il secondo pezzo del fronte manca: è il varco.
 */
export function recintiDi(c) {
  const out = [];
  if (c.tipo === 'orto') {
    for (let a = 1, k = 0; a < c.w; a += 2, k++) { if (k !== 1) out.push(['graticcio', a, c.b0 + 0.4, 'u']); out.push(['graticcio', a, c.b1 - 0.4, 'u']); }
    for (let b = c.b0 + 1.4; b < c.b1 - 1; b += 2) { out.push(['graticcio', 0.4, b, 'v']); out.push(['graticcio', c.w - 0.4, b, 'v']); }
  } else {
    if (c.siepeFronte) for (let a = 1, k = 0; a < c.w - 0.5; a += 1.9, k++) if (k !== 1) out.push(['siepe', a, c.b0 + 0.5, 'u']);
    if (c.siepeLato) for (let b = c.b0 + 1.5; b < c.b1 - 1; b += 1.9) out.push(['siepe', 0.6, b, 'v']);
  }
  return out;
}

/** Segna siepi e graticci sulla pianta del suolo: lì non si passa. Rende quanti pezzi ha segnato. */
export function segnaRecinti(griglia, lott) {
  let n = 0;
  for (const c of lott.campi) for (const [tipo, a, b, verso] of recintiDi(c)) {
    const x = c.ox + c.ux * a + c.vx * b, z = c.oz + c.uz * a + c.vz * b;
    if (lott.di(x, z) !== c) continue;
    const dx = verso === 'u' ? c.ux : c.vx, dz = verso === 'u' ? c.uz : c.vz;
    griglia.rettangolo(x, z, dx, dz, 1.0, tipo === 'siepe' ? 0.45 : 0.25, (i, j) => { const k = j * griglia.n + i; if (griglia.c[k] === LIBERO) griglia.c[k] = RECINTO; });
    n++;
  }
  return n;
}

/* ------------------------------------------------- i modelli di Blender */
let MODELLI = null;        // { vite: [geo, geo], 'vite-foglie': […], siepe: […], graticcio: [geo], cavolo, canne, 'canne-verdi' }

export async function caricaCampagna() {
  const indice = await fetch('./campagna/indice.json').then(r => r.json());
  const loader = new GLTFLoader();
  const out = {};
  await Promise.all(Object.entries(indice).sort((a, b) => a[0].localeCompare(b[0])).map(async ([nome, info]) => {
    const g = await loader.loadAsync(`./campagna/${nome}.glb`);
    g.scene.updateMatrixWorld(true);
    let geo = null;
    g.scene.traverse(o => { if (o.isMesh && !geo) { geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); } });
    (out[info.tipo] ||= []).push({ nome, geo });
  }));
  for (const t of Object.keys(out)) out[t] = out[t].sort((a, b) => a.nome.localeCompare(b.nome)).map(m => m.geo);
  MODELLI = out;
  return out;
}

/* ------------------------------------------- il colore del terreno */
// per stagione e per coltura: quanta terra, quanta erba, e la tinta che le moltiplica
const SUOLO = {
  // il grano seminato in autunno a gennaio e febbraio è già un velo verde
  inverno: { grano: [0.55, 0.45, [0.82, 0.95, 0.62]], maggese: [1, 0, [0.72, 0.64, 0.56]], prato: [0.15, 0.85, [0.9, 0.86, 0.66]], vigna: [0.75, 0.25, [0.9, 0.84, 0.72]], orto: [0.9, 0.1, [0.68, 0.62, 0.55]] },
  primavera: { grano: [0, 1, [0.72, 1.08, 0.5]], maggese: [0.7, 0.3, [0.8, 0.76, 0.62]], prato: [0, 1, [0.95, 1.05, 0.75]], vigna: [0.6, 0.4, [0.92, 0.9, 0.72]], orto: [0.85, 0.15, [0.7, 0.66, 0.56]] },
  maggio: { grano: [0, 1, [1, 1.12, 0.55]], maggese: [0.5, 0.5, [0.85, 0.85, 0.62]], prato: [0, 1, [1, 1.08, 0.72]], vigna: [0.55, 0.45, [0.92, 0.94, 0.7]], orto: [0.8, 0.2, [0.72, 0.7, 0.56]] },
  estate: { grano: [0.15, 0.85, [1.7, 1.35, 0.6]], maggese: [0.6, 0.4, [0.95, 0.88, 0.62]], prato: [0.1, 0.9, [1.2, 1.1, 0.7]], vigna: [0.6, 0.4, [0.95, 0.92, 0.7]], orto: [0.8, 0.2, [0.75, 0.7, 0.56]] }
};
// il grano: quanto è alto e di che colore
const GRANO = { inverno: null, primavera: [0.32, 0x7da05a], maggio: [0.85, 0x7f9440], estate: [1.0, 0xc9ac55] };

function steli() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d'), R = rng(77);
  for (let i = 0; i < 300; i++) {
    const x = R() * 512, h = 128 * R.tra(0.55, 0.98), p = R.tra(-7, 7), s = 200 + Math.floor(R() * 55);
    for (const dx of [-512, 0, 512]) {
      g.strokeStyle = `rgb(${s},${s},${s - 25})`; g.lineWidth = R.tra(1.6, 2.8);
      g.beginPath(); g.moveTo(x + dx, 128); g.lineTo(x + dx + p, 128 - h); g.stroke();
      g.fillStyle = `rgb(${s + 0},${s},${s - 15})`;
      g.beginPath(); g.ellipse(x + dx + p * 1.05, 128 - h - 3, 2.6, 9, p * 0.02, 0, Math.PI * 2); g.fill();     // la spiga
    }
  }
  const t = new CanvasTexture(c); t.wrapS = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const CAPIENZA = { vite: 6000, 'vite-foglie': 6000, siepe: 3000, graticcio: 4000, cavolo: 5000, canne: 600, 'canne-verdi': 600 };
const VICINO_CAMPI = 150, VICINO_ORTAGGI = 95;

export class Campagna {
  /**
   * @param terreno   la maglia fine del terreno (creaTerreno().vicino): prende il colore dei campi
   * @param lott      il risultato di lottizzaCampi
   */
  constructor(scene, { lott, terreno, griglia, stagione = 'primavera' }) {
    this.scene = scene; this.lott = lott; this.griglia = griglia; this.visibile = true; this.certo = false;
    this.t = 0; this.ultimo = null; this.chiave = ''; this.cache = new Map();
    // dove sono i campi, a riquadri di 120 m
    this.indice = new Map();
    for (const c of lott.campi) { const k = Math.floor(c.cx / 120) * 4099 + Math.floor(c.cz / 120); (this.indice.get(k) || this.indice.set(k, []).get(k)).push(c); }
    this.preparaTerreno(terreno);
    // gli oggetti, per istanze
    this.materiale = new MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    this.materialeSiepe = this.materiale.clone();
    this.gruppi = {};
    if (MODELLI) for (const [tipo, geos] of Object.entries(MODELLI)) this.gruppi[tipo] = geos.map(geo => {
      const im = new InstancedMesh(geo, tipo === 'siepe' ? this.materialeSiepe : this.materiale, CAPIENZA[tipo] || 500);
      im.count = 0; im.frustumCulled = false; im.receiveShadow = true; im.castShadow = tipo === 'siepe' || tipo === 'graticcio';
      im.userData.tipo = tipo; im.visible = false;
      scene.add(im);
      return im;
    });
    this.grano = typeof document === 'undefined' ? [] : this.teliDelGrano();
    this.stagione(stagione);
    const per = t => lott.campi.filter(c => c.tipo === t).length;
    console.info(`campagna: ${lott.campi.length} campi lungo le strade (${per('orto')} orti, ${per('grano')} di grano, ${per('vigna')} vigne, ${per('maggese')} a maggese, ${per('prato')} prati)`);
  }

  /** Di ogni vertice del terreno: che coltura c'è (0 = nessuna) e la sua variazione. */
  preparaTerreno(mesh) {
    this.terreno = mesh;
    const g = mesh.geometry, pos = g.attributes.position, n = pos.count;
    this.pesoBase = g.attributes.peso.array.slice();
    const tipo = new Uint8Array(n), vari = new Float32Array(n), gr = this.griglia;
    for (let k = 0; k < n; k++) {
      if (this.pesoBase[k * 3 + 2] > 0.05) continue;                // la riva e l'acqua
      const x = pos.getX(k), z = pos.getZ(k);
      const c = this.lott.di(x, z);
      if (c) { tipo[k] = NUM[c.tipo]; vari[k] = c.var; continue; }
      const v = gr.get(x, z);
      if ((v !== LIBERO && v < 100) || dentroCerchia(x, z) || fosso(x, z) > 0 || distanzaFiume(x, z) < 14) continue;
      const [t, r] = campoLontano(x, z, pos.getY(k));
      tipo[k] = t; vari[k] = r;
    }
    this.tipo = tipo; this.vari = vari;
  }

  /** Colora il terreno per la stagione; con null torna il terreno senza campi. */
  coloraTerreno(st) {
    const g = this.terreno.geometry, peso = g.attributes.peso, tinta = g.attributes.tinta;
    if (!tinta) return;
    const P = peso.array, T = tinta.array, B = this.pesoBase, S = st ? SUOLO[st] : null;
    for (let k = 0; k < this.tipo.length; k++) {
      const t = this.tipo[k], j = k * 3;
      if (!t || !S) { P[j] = B[j]; P[j + 1] = B[j + 1]; P[j + 2] = B[j + 2]; T[j] = T[j + 1] = T[j + 2] = 1; continue; }
      const [terra, erba, c] = S[TIPI_CAMPO[t]], f = 0.9 + 0.2 * this.vari[k];
      P[j] = terra; P[j + 1] = erba; P[j + 2] = 0;
      T[j] = c[0] * f; T[j + 1] = c[1] * f; T[j + 2] = c[2] * f;
    }
    peso.needsUpdate = true; tinta.needsUpdate = true;
  }

  /** Il grano lungo le strade: teli verticali con gli steli, paralleli alla strada e, più radi, di traverso. */
  teliDelGrano() {
    const mat = new MeshStandardMaterial({ map: steli(), alphaTest: 0.35, side: DoubleSide, roughness: 1, metalness: 0 });
    this.materialeGrano = mat;
    const pezzi = new Map();
    for (const c of this.lott.campi) {
      if (c.tipo !== 'grano') continue;
      const k = Math.floor(c.cx / 300) * 4099 + Math.floor(c.cz / 300);
      const p = pezzi.get(k) || pezzi.set(k, { pos: [], uv: [], alto: [] }).get(k);
      const R = rng(c.n * 13 + 5);
      const telo = (a0, b0, a1, b1) => {
        const xa = c.ox + c.ux * a0 + c.vx * b0, za = c.oz + c.uz * a0 + c.vz * b0, xb = c.ox + c.ux * a1 + c.vx * b1, zb = c.oz + c.uz * a1 + c.vz * b1;
        if (this.lott.di((xa + xb) / 2, (za + zb) / 2) !== c) return;
        const ya = quota(xa, za) - 0.03, yb = quota(xb, zb) - 0.03, u0 = R() * 3, u1 = u0 + Math.hypot(xb - xa, zb - za) / 1.4;
        // due triangoli: in basso (alto = 0) e in alto (alto = 1)
        for (const [x, y, z, u, alto] of [[xa, ya, za, u0, 0], [xb, yb, zb, u1, 0], [xb, yb, zb, u1, 1], [xa, ya, za, u0, 0], [xb, yb, zb, u1, 1], [xa, ya, za, u0, 1]]) {
          p.pos.push(x, y, z); p.uv.push(u, alto); p.alto.push(alto);
        }
      };
      // fitti: un telo ogni 1,2 m lungo la strada e uno ogni 2,4 m di traverso, spostati di poco perché non facciano una rete
      for (let b = c.b0 + 0.8; b < c.b1 - 0.5; b += 1.2) for (let a = 0; a < c.w - 1; a += 6) { const d = R.tra(-0.25, 0.25); telo(a, b + d, Math.min(c.w, a + 6), b + d + R.tra(-0.2, 0.2)); }
      for (let a = 1.2; a < c.w; a += 2.4) for (let b = c.b0 + 0.5; b < c.b1 - 1; b += 6) { const d = R.tra(-0.3, 0.3); telo(a + d, b, a + d + R.tra(-0.25, 0.25), Math.min(c.b1, b + 6)); }
    }
    const out = [];
    for (const p of pezzi.values()) {
      if (!p.pos.length) continue;
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(new Float32Array(p.pos), 3));
      g.setAttribute('uv', new BufferAttribute(new Float32Array(p.uv), 2));
      // le normali in su: il grano prende la luce come il suolo, da tutti e due i lati
      const nrm = new Float32Array(p.pos.length); for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
      g.setAttribute('normal', new BufferAttribute(nrm, 3));
      g.userData = { base: new Float32Array(p.pos), alto: p.alto };
      const m = new Mesh(g, mat); m.receiveShadow = true;
      this.scene.add(m); out.push(m);
    }
    return out;
  }

  /** inverno, primavera, maggio, estate: il terreno, il grano, le viti, le canne degli orti. */
  stagione(st) {
    if (st === this.st) return;
    this.st = st;
    if (this.visibile) this.coloraTerreno(st);
    const gr = GRANO[st];
    for (const m of this.grano) {
      m.visible = this.visibile && !this.certo && Boolean(gr);
      if (!gr) continue;
      const pos = m.geometry.attributes.position, { base, alto } = m.geometry.userData;
      for (let i = 0; i < alto.length; i++) pos.array[i * 3 + 1] = base[i * 3 + 1] + alto[i] * gr[0];
      pos.needsUpdate = true; m.geometry.computeBoundingSphere();
    }
    if (gr && this.materialeGrano) this.materialeGrano.color.setHex(gr[1]);
    // d'inverno la siepe è spoglia: più bruna
    this.materialeSiepe.color.setRGB(...(st === 'inverno' ? [0.78, 0.62, 0.5] : [1, 1, 1]));
    this.chiave = ''; this.ultimo = null;
  }

  certezza(on) {
    this.certo = on;
    for (const lista of Object.values(this.gruppi)) for (const im of lista) im.material = on ? MAT_CERTEZZA.ipotesi : im.userData.tipo === 'siepe' ? this.materialeSiepe : this.materiale;
    for (const m of this.grano) m.visible = this.visibile && !on && Boolean(GRANO[this.st]);
  }

  /** Con la Firenze di oggi la campagna del 1216 sparisce, e il terreno torna senza campi. */
  visibili(on) {
    if (on === this.visibile) return;
    this.visibile = on;
    this.coloraTerreno(on ? this.st : null);
    for (const lista of Object.values(this.gruppi)) for (const im of lista) im.visible = on && im.count > 0;
    for (const m of this.grano) m.visible = on && !this.certo && Boolean(GRANO[this.st]);
    this.chiave = ''; this.ultimo = null;
  }

  /** Gli oggetti di un campo: { vite: [Matrix4…], siepe, graticcio, cavolo, canne }. Sempre gli stessi. */
  oggettiDi(c) {
    let o = this.cache.get(c.n);
    if (o) return o;
    o = { vite: [], siepe: [], graticcio: [], cavolo: [], canne: [] };
    const R = rng(c.n * 31 + 7), q = new Quaternion(), su = new Vector3(0, 1, 0), p = new Vector3(), s = new Vector3();
    const lungoU = Math.atan2(-c.uz, c.ux), lungoV = Math.atan2(-c.vz, c.vx);
    const metti = (lista, a, b, rot, sx, sy = sx) => {
      const x = c.ox + c.ux * a + c.vx * b, z = c.oz + c.uz * a + c.vz * b;
      if (this.lott.di(x, z) !== c) return;
      lista.push(new Matrix4().compose(p.set(x, quota(x, z), z), q.setFromAxisAngle(su, rot), s.set(sx, sy, sx)));
    };
    if (c.tipo === 'vigna') {
      for (let a = 1.1; a < c.w - 0.6; a += 2.0) for (let b = c.b0 + 1; b < c.b1 - 0.8; b += 1.25) metti(o.vite, a, b + R.tra(-0.12, 0.12), R.tra(0, 6.28), R.tra(0.85, 1.05));
    }
    if (c.tipo === 'orto') {
      // le prode: cavoli, canne, o terra nuda
      for (let b = c.b0 + 3; b < c.b1 - 2.5; b += 2.2) {
        const r = R();
        if (r < 0.55) { for (let a = 2; a < c.w - 2; a += 0.9) if (R.vero(0.9)) metti(o.cavolo, a + R.tra(-0.1, 0.1), b + R.tra(-0.1, 0.1), R.tra(0, 6.28), R.tra(0.8, 1.25)); }
        else if (r < 0.75) { for (let a = 2.2; a < c.w - 2; a += 1.5) metti(o.canne, a, b, R.tra(0, 6.28), 1, R.tra(0.9, 1.1)); }
      }
    }
    // il recinto di graticci degli orti e le siepi dei campi, con il varco (recintiDi)
    for (const [tipo, a, b, verso] of recintiDi(c)) {
      const rot = verso === 'u' ? lungoU : lungoV;
      if (tipo === 'graticcio') metti(o.graticcio, a, b, rot, 1);
      else metti(o.siepe, a, b, rot + R.tra(-0.1, 0.1), 1, R.tra(0.85, 1.15));
    }
    this.cache.set(c.n, o);
    return o;
  }

  /** Mette gli oggetti dei campi vicini: al più due volte al secondo, e solo se ci si è mossi. */
  aggiorna(cam) {
    if (!this.visibile || !MODELLI) return;
    const ora = performance.now();
    if (this.ultimo && (ora - this.t < 500 || Math.hypot(cam.x - this.ultimo[0], cam.z - this.ultimo[1]) < 8)) return;
    this.t = ora; this.ultimo = [cam.x, cam.z];
    const vicini = [];
    const i0 = Math.floor(cam.x / 120), j0 = Math.floor(cam.z / 120);
    for (let i = i0 - 2; i <= i0 + 2; i++) for (let j = j0 - 2; j <= j0 + 2; j++) for (const c of this.indice.get(i * 4099 + j) || []) {
      const d = Math.hypot(c.cx - cam.x, c.cz - cam.z) - c.raggio;
      if (d < VICINO_CAMPI) vicini.push([d, c]);
    }
    vicini.sort((a, b) => a[0] - b[0]);
    const chiave = this.st + ':' + vicini.map(v => v[1].n + (v[0] < VICINO_ORTAGGI ? 'v' : '')).join(',');
    if (chiave === this.chiave) return;
    this.chiave = chiave;
    for (const lista of Object.values(this.gruppi)) for (const im of lista) im.count = 0;
    const st = this.st;
    const viti = st === 'maggio' || st === 'estate' ? 'vite-foglie' : 'vite';
    const canne = st === 'inverno' ? null : st === 'primavera' ? 'canne' : 'canne-verdi';
    const aggiungi = (tipo, matrici) => {
      const lista = this.gruppi[tipo];
      if (!lista || !lista.length) return;
      matrici.forEach((m, k) => { const im = lista[k % lista.length]; if (im.count < im.instanceMatrix.count) im.setMatrixAt(im.count++, m); });
    };
    const tenuti = new Set();
    for (const [d, c] of vicini) {
      const o = this.oggettiDi(c); tenuti.add(c.n);
      aggiungi(viti, o.vite); aggiungi('siepe', o.siepe); aggiungi('graticcio', o.graticcio);
      if (d < VICINO_ORTAGGI) { aggiungi('cavolo', o.cavolo); if (canne) aggiungi(canne, o.canne); }
    }
    for (const k of this.cache.keys()) if (!tenuti.has(k)) this.cache.delete(k);
    for (const lista of Object.values(this.gruppi)) for (const im of lista) { im.visible = im.count > 0; im.instanceMatrix.needsUpdate = true; }
  }
}
