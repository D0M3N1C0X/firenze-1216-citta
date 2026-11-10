import { Color, InstancedMesh, Matrix4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { matriceLotto } from './cantiere.js';
import { MAT, MAT_CERTEZZA } from './materiali.js';
import { quota } from './terreno.js';
import { rng } from './rumore.js';
import { NEL_1300 } from './epoca.js';

/* =====================================================================
   LE CASE DI BLENDER

   I 27 tipi di strumenti/case/case.py (larghezza, piani, finitura dei piani
   alti) prendono il posto delle case generate da edifici.js su ogni lotto
   «casa» (non le torri, non le case sul fiume, che restano generate). Ogni
   lotto prende il tipo più vicino, allungato o accorciato quanto serve;
   tutte le case dello stesso tipo si disegnano insieme, per istanze.

   Il dettaglio è solo vicino (decisione del 9 novembre 2026: «dettaglio
   vicino, semplice lontano»): entro VICINO_CASE metri la casa con le
   finestre, le imposte, lo sporto e la gronda; più lontano la stessa casa
   semplificata. Le botteghe sono chiuse nei giorni di festa e aperte nei
   giorni feriali, come nelle case generate. Con «Che cosa è certo» le case
   prendono il colore dell'ipotesi; con «Oggi» si nascondono. Se i modelli
   non si caricano restano le case generate.
   ===================================================================== */

const VICINO_CASE = 70;
let MODELLI = null;          // { nome: { info, parti: { vicino: [{ mat, geo }], chiusa, aperta, lontano } } }

export async function caricaCase() {
  const indice = await fetch('./case/indice.json').then(r => r.json());
  const loader = new GLTFLoader();
  const out = {};
  await Promise.all(Object.entries(indice).map(async ([nome, info]) => {
    const g = await loader.loadAsync(`./case/${nome}.glb`);
    g.scene.updateMatrixWorld(true);
    const parti = { vicino: [], chiusa: [], aperta: [], lontano: [] };
    g.scene.traverse(o => {
      if (!o.isMesh) return;
      // il nodo si chiama come la parte (vicino, chiusa, aperta, lontano); le sue primitive, una per materiale
      let n = o; while (n && !parti[n.name]) n = n.parent;
      if (!n) return;
      const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
      parti[n.name].push({ mat: o.material.name, geo });
    });
    out[nome] = { info, parti };
  }));
  MODELLI = out;
  return out;
}

/** Questo lotto lo disegnano le case di Blender? (edifici.js non lo costruisce) */
export const daBlender = L => Boolean(MODELLI) && L.tipo === 'casa' && !L.retro;

const LARGHEZZE = [5.2, 6.8, 8.2];
const BIANCO = new Color(1, 1, 1);
const TINTE = {
  pietra: [[1, 0.98, 0.94], [0.95, 0.93, 0.88], [1.04, 1, 0.94], [0.9, 0.88, 0.84]],
  intonaco: [[1, 1, 1], [1, 0.95, 0.86], [1, 0.92, 0.8], [0.96, 0.94, 0.9], [1, 0.9, 0.82], [0.94, 0.9, 0.86]],
  legno: [[0.95, 0.9, 0.85], [0.85, 0.8, 0.76], [1, 0.95, 0.9]]
};

/** Il tipo di un lotto: finitura, larghezza e piani, dal seme del lotto (come edifici.js, ipotesi). */
function tipoDi(L) {
  const R = rng(L.seme * 7 + 3);
  const f = R();
  const finitura = f < 0.35 ? 'pietra' : f < 0.68 ? 'intonaco' : 'legno';
  const W = LARGHEZZE.reduce((a, b) => Math.abs(b - L.W) < Math.abs(a - L.W) ? b : a);
  let piani = NEL_1300 && !L.borgo ? (R.vero(0.15) ? 4 : R.vero(0.55) ? 3 : 2) : R.vero(0.25) ? 3 : 2 + (R.vero(0.35) ? 1 : 0);
  piani = Math.max(2, Math.min(4, piani));
  const tinta = R.scegli(TINTE[finitura]);
  return { nome: `casa-${Math.round(W * 10)}-${piani}-${finitura}`, W, tinta };
}

export class CaseBlender {
  constructor(scene, lotti, opz = {}) {
    this.scene = scene; this.festa = opz.festa ?? true; this.t = 0; this.ultimo = null; this.visibile = true;
    this.materiali = {}; this.certo = false;
    const zero = new Matrix4().makeScale(0, 0, 0); this.zero = zero;
    // le case, raggruppate per tipo
    this.case = [];
    const perTipo = {};
    for (const L of lotti) {
      if (!daBlender(L)) continue;
      let { nome, W, tinta } = tipoDi(L);
      if (!MODELLI[nome]) continue;
      const D = MODELLI[nome].info.D;
      const cx = L.px + L.nz * L.W / 2 + L.nx * L.D / 2, cz = L.pz - L.nx * L.W / 2 + L.nz * L.D / 2;
      const m = matriceLotto(L.px, quota(cx, cz), L.pz, L.nx, L.nz).multiply(new Matrix4().makeScale(L.W / W, 1, L.D / D));
      const c = { nome, m, x: cx, z: cz, tinta: new Color(...tinta), i: (perTipo[nome] ||= []).length, vicina: false };
      perTipo[nome].push(c); this.case.push(c);
    }
    // per ogni tipo e parte, un InstancedMesh per materiale
    this.mesh = [];
    this.tipi = {};
    for (const [nome, lista] of Object.entries(perTipo)) {
      const parti = {};
      for (const [parte, geos] of Object.entries(MODELLI[nome].parti)) {
        parti[parte] = geos.map(({ mat, geo }) => {
          const im = new InstancedMesh(geo, this.materiale(mat), lista.length);
          im.userData.mat = mat; im.castShadow = true; im.receiveShadow = true;
          im.count = parte === 'lontano' ? lista.length : 0;
          if (parte !== 'lontano') im.frustumCulled = false;
          lista.forEach((c, k) => { if (parte === 'lontano') im.setMatrixAt(k, c.m); im.setColorAt(k, c.tinta); });
          im.computeBoundingSphere();
          scene.add(im); this.mesh.push(im);
          return im;
        });
      }
      this.tipi[nome] = { parti, lista };
    }
    console.info(`case di Blender: ${this.case.length} case in ${Object.keys(perTipo).length} tipi`);
  }

  /** Il materiale della città con quel nome, senza i colori nei vertici (il colore è per istanza). */
  materiale(nome) {
    if (!this.materiali[nome]) {
      const base = MAT[nome] || MAT.conci;
      const m = base.clone(); m.vertexColors = false; m.needsUpdate = true;
      this.materiali[nome] = m;
    }
    return this.materiali[nome];
  }

  giornata(festa) { if (festa !== this.festa) { this.festa = festa; this.ultimo = null; } }

  /** «Che cosa è certo»: le case comuni sono un'ipotesi, tutte dello stesso grigio. */
  certezza(on) {
    this.certo = on;
    for (const im of this.mesh) im.material = on ? MAT_CERTEZZA.ipotesi : this.materiale(im.userData.mat);
    for (const { parti, lista } of Object.values(this.tipi)) for (const im of parti.lontano) {
      lista.forEach(c => im.setColorAt(c.i, on ? BIANCO : c.tinta));
      im.instanceColor.needsUpdate = true;
    }
    this.bottega = null; this.ultimo = null;      // le case vicine si rifanno al prossimo aggiornamento
  }

  visibili(on) { this.visibile = on; for (const im of this.mesh) im.visible = on; }

  /** Vicino il dettaglio, lontano il volume: al più due volte al secondo, e solo se ci si è mossi. */
  aggiorna(cam) {
    if (!this.visibile) return;
    const ora = performance.now();
    if (this.ultimo && (ora - this.t < 500 || Math.hypot(cam.x - this.ultimo[0], cam.z - this.ultimo[1]) < 5)) return;
    this.t = ora; this.ultimo = [cam.x, cam.z];
    const bottega = this.festa ? 'chiusa' : 'aperta';
    const tutto = this.bottega !== bottega; this.bottega = bottega;
    for (const { parti, lista } of Object.values(this.tipi)) {
      // solo le case che passano da vicine a lontane o viceversa; un tipo dove non cambia niente non si tocca
      let cambiato = tutto;
      for (const c of lista) {
        const vicina = Math.hypot(c.x - cam.x, c.z - cam.z) < VICINO_CASE;
        if (vicina === c.vicina) continue;
        c.vicina = vicina; cambiato = true;
        for (const im of parti.lontano) im.setMatrixAt(c.i, vicina ? this.zero : c.m);
      }
      if (!cambiato) continue;
      for (const p of ['vicino', 'chiusa', 'aperta']) for (const im of parti[p]) im.count = 0;
      for (const c of lista) {
        if (!c.vicina) continue;
        for (const p of ['vicino', bottega]) for (const im of parti[p]) {
          im.setMatrixAt(im.count, c.m);
          im.setColorAt(im.count, this.certo ? BIANCO : c.tinta);
          im.count++;
        }
      }
      for (const p of Object.keys(parti)) for (const im of parti[p]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
      }
    }
  }
}
