import {
  Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial,
  NoColorSpace, RGBAFormat, RepeatWrapping, SRGBColorSpace, UnsignedByteType
} from 'three';
import { GENERATORI } from './texture-gen.js';

/* =====================================================================
   MATERIALI — tutti generati nel codice, niente immagini scaricate.

   Ogni materiale ha tre mappe: colore, rilievo (normal map) e ruvidità.
   Le coordinate di texture della geometria sono in METRI, quindi ogni
   texture dichiara quanti metri copre (DIM) e la ripetizione si regola
   da sola: un concio di pietraforte è lungo un concio ovunque.

   Le tinte sono scelte a occhio su riferimenti fotografici di oggi
   (pietraforte delle torri superstiti, coppi toscani): sono materiali
   plausibili, non analisi dei materiali del 1216.
   ===================================================================== */

let ANISO = 8;
export function impostaAnisotropia(n) { ANISO = n; for (const m of Object.values(MAT)) for (const k of ['map', 'normalMap', 'roughnessMap']) if (m[k]) { m[k].anisotropy = n; m[k].needsUpdate = true; } }

function dataTex(data, S, colore) {
  const t = new DataTexture(data, S, S, RGBAFormat, UnsignedByteType);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = colore ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = ANISO;
  t.needsUpdate = true;
  return t;
}

/* ================================================================ */

function materiale(tex, opz = {}) {
  const m = new MeshStandardMaterial({
    map: tex.map, normalMap: tex.normalMap, roughnessMap: tex.roughnessMap,
    roughness: 1, metalness: 0, vertexColors: true, ...opz
  });
  const r = 1 / tex.dim;
  for (const t of [tex.map, tex.normalMap, tex.roughnessMap]) t.repeat.set(r, r);
  return m;
}

export const MAT = {};

// risoluzione di ogni texture: piena per i materiali che si vedono da vicino
const GRANDI = new Set(['conci', 'intonaco', 'coppi', 'terra']);

/**
 * Genera tutte le texture in parallelo nei worker. Se i worker non ci sono
 * (o falliscono) le genera qui, più lentamente.
 */
export async function creaMateriali(qualita = 'alta', avanzamento = () => {}) {
  const S = qualita === 'alta' ? 1024 : 512;
  const nomi = Object.keys(GENERATORI);
  const dim = n => GRANDI.has(n) ? S : S / 2;
  const risultati = {};
  let fatti = 0;
  try {
    const n = Math.max(2, Math.min(nomi.length, (navigator.hardwareConcurrency || 4) - 1));
    const coda = [...nomi].sort((a, b) => dim(b) - dim(a));
    await Promise.all(Array.from({ length: n }, async () => {
      const w = new Worker(new URL('./tex-worker.js', import.meta.url), { type: 'module' });
      try {
        while (coda.length) {
          const nome = coda.shift();
          risultati[nome] = await new Promise((ok, ko) => {
            w.onmessage = e => ok(e.data);
            w.onerror = ko;
            w.postMessage({ nome, S: dim(nome) });
          });
          avanzamento(++fatti, nomi.length);
        }
      } finally { w.terminate(); }
    }));
  } catch (e) {
    console.warn('worker non disponibili, genero le texture sul filo principale', e);
    for (const nome of nomi) if (!risultati[nome]) { risultati[nome] = GENERATORI[nome](dim(nome)); avanzamento(++fatti, nomi.length); }
  }
  const tex = r => ({ map: dataTex(r.col, r.S, true), normalMap: dataTex(r.nor, r.S, false), roughnessMap: dataTex(r.rgh, r.S, false), dim: r.dim });
  for (const nome of nomi) MAT[nome] = materiale(tex(risultati[nome]));
  MAT.scuro = new MeshStandardMaterial({ color: 0x0d0b09, roughness: 1, metalness: 0, vertexColors: true });
  MAT.marmoVerde = new MeshStandardMaterial({ color: 0x2f4a3c, roughness: 0.4, metalness: 0, vertexColors: true });
  return MAT;
}

/* --------------------------------------------- livelli di certezza */
// Blu, arancio e grigio: si distinguono anche con le forme più comuni
// di daltonismo, a differenza della terna rosso-giallo-verde.
export const LIVELLI = {
  documentato: { nome: 'Documentato', colore: '#3f7fd0', testo: 'esistenza e posizione attestate da fonti o da strutture superstiti datate' },
  dedotto: { nome: 'Dedotto', colore: '#e39a2d', testo: 'ricavato da indizi: strutture superstiti non datate, cartografia successiva, confronti' },
  ipotesi: { nome: 'Ipotesi', colore: '#b9b6ae', testo: 'ricostruzione plausibile senza un riscontro specifico' }
};
export const MAT_CERTEZZA = Object.fromEntries(Object.entries(LIVELLI).map(([k, l]) =>
  [k, new MeshStandardMaterial({ color: new Color(l.colore), roughness: 0.85, metalness: 0 })]));
