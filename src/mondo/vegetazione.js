import {
  Color, CylinderGeometry, IcosahedronGeometry, InstancedMesh, LatheGeometry, Matrix4, MeshStandardMaterial, Quaternion, Vector2, Vector3
} from 'three';
import { dentroCerchia } from './fondale.js';
import { VICINO, distanzaFiume, quota } from './terreno.js';
import { rng } from './rumore.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ---------------------------------------- gli alberi modellati in Blender
   strumenti/vegetazione/vegetazione.py: quattro ulivi e tre cipressi, con i
   colori nei vertici. Si disegnano solo vicino a chi guarda (VICINO_ALBERI);
   più lontano restano le forme semplici di prima (decisione del 9 novembre
   2026: «dettaglio vicino, semplice lontano»). Se i modelli non si
   caricano, restano le forme semplici dappertutto. */
const VICINO_ALBERI = 120;
let MODELLI_ALBERI = null;
export async function caricaAlberi() {
  const indice = await fetch('./vegetazione/indice.json').then(r => r.json());
  const loader = new GLTFLoader();
  const out = { ulivo: [], cipresso: [] };
  await Promise.all(Object.entries(indice).map(async ([nome, info]) => {
    const g = await loader.loadAsync(`./vegetazione/${nome}.glb`);
    g.scene.updateMatrixWorld(true);
    const parti = [];
    g.scene.traverse(o => { if (o.isMesh) { const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); parti.push(geo); } });
    out[info.tipo].push({ nome, parti, altezza: info.altezza || 1 });
  }));
  for (const t of Object.keys(out)) out[t].sort((a, b) => a.nome.localeCompare(b.nome));
  MODELLI_ALBERI = out;
  return out;
}

/* =====================================================================
   LA CAMPAGNA INTORNO

   Fuori dalle mura, sui colli d'Oltrarno e verso San Miniato: ulivi,
   qualche cipresso, campi. È un paesaggio dedotto da quello toscano dei
   secoli successivi (livello: ipotesi): per il 1216 la distribuzione
   delle colture va verificata [da verificare: studi sul contado
   fiorentino, per esempio Ch. M. de La Roncière].
   ===================================================================== */

/**
 * opz.pianura: la piana di Campi (mondo/campi.js), con la sua quota e uno
 * spazio libero attorno al castello; alberi sparsi lungo i campi, niente
 * fiume e niente mura della città.
 */
/** Vero se (x, z) è a meno di r metri dalla spezzata. */
function vicinoA(pts, x, z, r) {
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    if (Math.hypot(ax + t * dx - x, az + t * dz - z) < r) return true;
  }
  return false;
}

export function creaVegetazione(scene, opz = {}) {
  const R = rng(1209);
  const ulivi = [], cipressi = [];
  const tenta = opz.tentativi || 22000;
  const qT = opz.pianura?.quota || quota;
  for (let i = 0; i < tenta; i++) {
    // solo sul terreno a maglia fine: altrove gli alberi galleggerebbero
    const m = VICINO.lato / 2 - 15, x = R.tra(VICINO.x - m, VICINO.x + m), z = R.tra(VICINO.z - m, VICINO.z + m);
    if (opz.pianura) {
      if (Math.hypot(x, z) < opz.pianura.libero || !R.vero(0.35)) continue;
    } else if (dentroCerchia(x, z) || distanzaFiume(x, z) < 10) continue;
    // né sulle strade fuori porta né sulle case dei borghi (opz.evita: le strade)
    if (opz.evita && opz.evita.some(s => vicinoA(s.punti, x, z, 26))) continue;
    const y = qT(x, z);
    // gli ulivi stanno sui colli; la piana resta a campi e orti
    const colle = y > 4;
    if (!opz.pianura && !colle && !R.vero(0.08)) continue;
    // a filari e a macchie: un rumore grossolano decide dove c'è l'oliveto
    if (Math.sin(x * 0.011 + Math.sin(z * 0.007) * 2) * Math.cos(z * 0.013) < -0.15) continue;
    // pochi cipressi: nel Duecento la campagna era coltivata e mista, viti, ulivi e grano insieme
    // [da verificare: studi sul contado fiorentino]; il cipresso fitto è il paesaggio di oggi (decisione del 9 novembre 2026)
    if (R.vero(0.025)) cipressi.push([x, y, z]); else ulivi.push([x, y, z]);
  }

  const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), up = new Vector3(0, 1, 0);
  const c = new Color();

  // ulivi: chioma grigioverde su un tronco corto e storto
  const chioma = new IcosahedronGeometry(1, 1);
  const tronco = new CylinderGeometry(0.14, 0.22, 1, 6); tronco.translate(0, 0.5, 0);
  const matC = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true });
  const matT = new MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1, metalness: 0 });
  const iC = new InstancedMesh(chioma, matC, ulivi.length), iT = new InstancedMesh(tronco, matT, ulivi.length);
  ulivi.forEach(([x, y, z], k) => {
    const r = R.tra(1.5, 2.6), h = R.tra(1.2, 1.9);
    q.setFromAxisAngle(up, R.tra(0, 6.28));
    m.compose(p.set(x, y + h + r * 0.55, z), q, s.set(r, r * R.tra(0.62, 0.8), r)); iC.setMatrixAt(k, m);
    m.compose(p.set(x, y - 0.2, z), q, s.set(1, h + 0.6, 1)); iT.setMatrixAt(k, m);
    iC.setColorAt(k, c.setRGB(0.2 + R() * 0.05, 0.24 + R() * 0.05, 0.16 + R() * 0.03));
  });

  // cipressi: fusi scuri e alti
  const profilo = [[0, 0], [0.5, 0.02], [0.82, 0.18], [0.9, 0.34], [0.8, 0.55], [0.56, 0.75], [0.3, 0.9], [0.06, 0.99], [0, 1]]
    .map(([r, y]) => new Vector2(r, y));
  const fuso = new LatheGeometry(profilo, 8);
  const matF = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true });
  const iF = new InstancedMesh(fuso, matF, cipressi.length);
  cipressi.forEach(([x, y, z], k) => {
    const h = R.tra(9, 17), r = h * R.tra(0.075, 0.1);
    m.compose(p.set(x, y - 0.3, z), q.setFromAxisAngle(up, R() * 6.28), s.set(r, h, r)); iF.setMatrixAt(k, m);
    iF.setColorAt(k, c.setRGB(0.09 + R() * 0.03, 0.14 + R() * 0.03, 0.08 + R() * 0.02));
  });

  for (const im of [iC, iT, iF]) { im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); }
  const lod = MODELLI_ALBERI ? new DettaglioAlberi(scene, { iC, iT, iF }, ulivi, cipressi) : null;
  return { ulivi: ulivi.length, cipressi: cipressi.length, aggiorna: c => lod?.aggiorna(c), escludi: r => lod?.escludi(r), lod: Boolean(lod) };
}

/**
 * Il dettaglio vicino: ogni mezzo secondo, gli alberi entro VICINO_ALBERI
 * metri passano ai modelli di Blender (un InstancedMesh per modello e per
 * parte) e la loro forma semplice si nasconde; quelli lontani tornano
 * semplici. Con «escludi» si tolgono quelli dentro un riquadro (la Firenze
 * di oggi, dove al loro posto ci sono le case).
 */
class DettaglioAlberi {
  constructor(scene, lontani, ulivi, cipressi) {
    this.lontani = lontani; this.t = 0; this.escluso = null; this.ultimo = null;
    const R = rng(1210);
    const materiale = new MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
    const alberi = [];
    // le matrici delle forme semplici, per rimetterle
    for (const im of [lontani.iC, lontani.iT, lontani.iF]) im.userData.originali = im.instanceMatrix.array.slice();
    const zero = new Matrix4().makeScale(0, 0, 0);
    this.zero = zero;
    const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), up = new Vector3(0, 1, 0);
    ulivi.forEach(([x, y, z], k) => alberi.push({ tipo: 'ulivo', k, x, y, z, v: k % MODELLI_ALBERI.ulivo.length, sc: R.tra(0.85, 1.2), rot: R.tra(0, 6.28) }));
    cipressi.forEach(([x, y, z], k) => alberi.push({ tipo: 'cipresso', k, x, y, z, v: k % MODELLI_ALBERI.cipresso.length, sc: R.tra(9, 17) / 12, rot: R.tra(0, 6.28) }));
    this.alberi = alberi;
    // un InstancedMesh per modello e per parte, grande quanto serve
    this.vicini = {};
    for (const tipo of ['ulivo', 'cipresso']) this.vicini[tipo] = MODELLI_ALBERI[tipo].map((mod, v) => {
      const quanti = alberi.filter(a => a.tipo === tipo && a.v === v).length;
      return mod.parti.map(geo => {
        const im = new InstancedMesh(geo, materiale, Math.max(1, quanti));
        im.count = 0; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
        scene.add(im);
        return im;
      });
    });
    for (const a of alberi) {
      const larg = a.tipo === 'ulivo' ? a.sc : a.sc * R.tra(0.85, 1.1);
      a.m = new Matrix4().compose(p.set(a.x, a.y - 0.15, a.z), q.setFromAxisAngle(up, a.rot), s.set(larg, a.sc, larg)).clone();
    }
    void m;
  }

  escludi(r) { this.escluso = r; this.ultimo = null; }

  aggiorna(c) {
    // al più due volte al secondo, a tempo vero (non a fotogrammi: su un computer lento un fotogramma dura molto)
    const ora = performance.now();
    if (this.ultimo && ora - this.t < 500) return;
    this.t = ora;
    const cx = c.x, cz = c.z;
    if (this.ultimo && Math.hypot(cx - this.ultimo[0], cz - this.ultimo[1]) < 6) return;
    this.ultimo = [cx, cz];
    const { iC, iT, iF } = this.lontani, E = this.escluso;
    for (const tipo of ['ulivo', 'cipresso']) for (const parti of this.vicini[tipo]) for (const im of parti) im.count = 0;
    for (const a of this.alberi) {
      const fuori = E && a.x > E[0] && a.x < E[2] && a.z > E[1] && a.z < E[3];
      const vicino = !fuori && Math.hypot(a.x - cx, a.z - cz) < VICINO_ALBERI;
      const semplici = a.tipo === 'ulivo' ? [iC, iT] : [iF];
      for (const im of semplici) {
        const o = im.userData.originali, arr = im.instanceMatrix.array, j = a.k * 16;
        if (vicino || fuori) this.zero.toArray(arr, j); else for (let i = 0; i < 16; i++) arr[j + i] = o[j + i];
      }
      if (vicino) for (const im of this.vicini[a.tipo][a.v]) { im.setMatrixAt(im.count, a.m); im.count++; }
    }
    for (const im of [iC, iT, iF]) im.instanceMatrix.needsUpdate = true;
    for (const tipo of ['ulivo', 'cipresso']) for (const parti of this.vicini[tipo]) for (const im of parti) im.instanceMatrix.needsUpdate = true;
  }
}

