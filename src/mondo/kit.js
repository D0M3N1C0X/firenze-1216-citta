import { BatchedMesh, Color, Float32BufferAttribute } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MAT } from './materiali.js';

/* =====================================================================
   IL KIT EDILIZIO

   Finestre, porte, botteghe e arredo di strada modellati una volta in
   Blender (strumenti/kit/kit.py), con i conci uno per uno, e poi posati
   migliaia di volte dal generatore delle case. Ogni pezzo è fatto di
   parti, una per materiale (conci, legno, ferro…); le parti uguali di
   un riquadro di città finiscono in un solo BatchedMesh per materiale, che la
   scheda video disegna in poche chiamate e che scarta da solo i pezzi
   fuori dall'inquadratura.

   Convenzioni (le stesse del cantiere): il muro ha la faccia esterna in
   z = 0 e l'interno verso +z; il pezzo è centrato in x = 0 e parte da
   y = 0 (soglia o davanzale).

   Le fonti dei pezzi e la verifica degli anacronismi sono in
   strumenti/kit/FONTI.md.
   ===================================================================== */

export const KIT = { pezzi: null, info: {} };

export async function caricaKit() {
  const [elenco, gltf] = await Promise.all([
    fetch('./kit/kit.json').then(r => r.json()),
    new GLTFLoader().loadAsync('./kit/kit.glb')
  ]);
  const pezzi = {};
  gltf.scene.updateMatrixWorld(true);
  for (const nodo of gltf.scene.children) {
    const parti = [];
    nodo.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      // i materiali della città usano il colore per vertice (le tinte): qui è bianco
      g.setAttribute('color', new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      parti.push({ mat: o.material.name, geo: g });
    });
    pezzi[nodo.name] = parti;
  }
  KIT.info = Object.fromEntries(elenco.map(p => [p.nome, p]));
  KIT.pezzi = pezzi;
  return KIT;
}

export const haKit = nome => Boolean(KIT.pezzi?.[nome]);

/*
 * Il dettaglio per distanza. Ogni pezzo ha una versione semplificata
 * (nome_lod1: niente smussi, stipiti in un blocco, pochi conci): entro
 * VICINO metri si vede quello pieno, oltre quello semplice. Senza questo
 * la scheda video disegnerebbe anche le finestre nascoste dietro le
 * facciate: decine di milioni di triangoli. Certi pezzi piccoli, oltre una
 * certa distanza, spariscono del tutto.
 */
export const VICINO = 40;
const SPARISCE = { anello: 70 };
// i pezzi si dividono in riquadri: quelli fuori dall'inquadratura si
// scartano in blocco, senza esaminare pezzo per pezzo
const RIQUADRO = 160;

/**
 * Costruisce i BatchedMesh di tutte le posature raccolte dal cantiere:
 * uno per materiale, livello, ombra, giornata e riquadro di 160 m.
 * @param posature [{ nome, m, livello, tinta, ombra, variante }]
 */
export function costruisciPosature(posature) {
  const gruppi = new Map();
  for (const p of posature) {
    const semplice = KIT.pezzi[p.nome + '_lod1'];
    for (const [k, parte] of (KIT.pezzi[p.nome] || []).entries()) {
      if (!MAT[parte.mat]) continue;
      const e = p.m.elements;
      const chiave = `${parte.mat}|${p.livello}|${p.ombra ? 1 : 0}|${p.variante}|${Math.floor(e[12] / RIQUADRO)}|${Math.floor(e[14] / RIQUADRO)}`;
      let g = gruppi.get(chiave);
      if (!g) gruppi.set(chiave, g = { geo: new Map(), posa: [] });
      // la parte semplificata dello stesso materiale; se il pezzo semplice
      // non ce l'ha (i chiodi, le bandelle) da lontano la parte sparisce
      const s = semplice ? semplice.find(q => q.mat === parte.mat)?.geo || null : parte.geo;
      if (!g.geo.has(p.nome + '#' + k)) g.geo.set(p.nome + '#' + k, { g0: parte.geo, g1: s });
      g.posa.push({ ...p, chiave: p.nome + '#' + k });
    }
  }
  const mesh = [], col = new Color();
  let triangoli = 0;
  for (const [chiave, g] of gruppi) {
    const [mat, livello, ombra, variante] = chiave.split('|');
    let nv = 0, ni = 0;
    const geos = new Set();
    for (const { g0, g1 } of g.geo.values()) for (const geo of [g0, g1]) if (geo && !geos.has(geo)) {
      geos.add(geo); nv += geo.attributes.position.count; ni += geo.index.count;
    }
    const b = new BatchedMesh(g.posa.length, nv, ni, MAT[mat]);
    const idGeo = new Map();
    for (const geo of geos) idGeo.set(geo, b.addGeometry(geo));
    const n = g.posa.length;
    const L = { n, x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n), g0: new Int32Array(n), g1: new Int32Array(n), sp: new Float32Array(n), stato: new Uint8Array(n) };
    g.posa.forEach((p, k) => {
      const { g0, g1 } = g.geo.get(p.chiave);
      L.g0[k] = idGeo.get(g0); L.g1[k] = g1 ? idGeo.get(g1) : L.g0[k];
      // si parte lontani: aggiornaLod porta al dettaglio pieno quelli vicini
      const i = b.addInstance(L.g1[k]);
      b.setMatrixAt(i, p.m);
      b.setColorAt(i, col.setRGB(...p.tinta));
      const e = p.m.elements;
      L.x[k] = e[12]; L.y[k] = e[13]; L.z[k] = e[14];
      L.sp[k] = (g1 ? SPARISCE[p.nome] || 1e5 : VICINO) ** 2;
      L.stato[k] = 1;
      triangoli += g0.index.count / 3;
    });
    b.castShadow = ombra === '1';
    b.receiveShadow = true;
    // l'ordinamento per distanza costa più di quanto fa risparmiare
    b.sortObjects = false;
    b.userData = { mat, livello, variante, kit: true, lod: L };
    mesh.push(b);
  }
  return { mesh, triangoli };
}

/** Sceglie il dettaglio di ogni pezzo secondo la distanza da (cx, cy, cz). */
export function aggiornaLod(mesh, cx, cy, cz) {
  const d0 = VICINO * VICINO;
  for (const b of mesh) {
    const L = b.userData.lod;
    if (!L) continue;
    for (let i = 0; i < L.n; i++) {
      const dx = L.x[i] - cx, dy = L.y[i] - cy, dz = L.z[i] - cz, d2 = dx * dx + dy * dy + dz * dz;
      const s = d2 > L.sp[i] ? 2 : d2 > d0 ? 1 : 0;
      if (s === L.stato[i]) continue;
      if (s === 2) b.setVisibleAt(i, false);
      else {
        if (L.stato[i] === 2) b.setVisibleAt(i, true);
        b.setGeometryIdAt(i, s ? L.g1[i] : L.g0[i]);
      }
      L.stato[i] = s;
    }
  }
}
