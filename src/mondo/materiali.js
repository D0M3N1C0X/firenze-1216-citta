import {
  Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial,
  NoColorSpace, RGBAFormat, RepeatWrapping, SRGBColorSpace, TextureLoader, UnsignedByteType
} from 'three';
import { GENERATORI } from './texture-gen.js';

/* =====================================================================
   MATERIALI — fotografie CC0 dove le abbiamo, texture generate per il resto.

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

/*
 * I pezzi del kit (kit.js) sono copie dello stesso modello: senza
 * correzione ogni finestra avrebbe le stesse pietre nella stessa foto.
 * Qui le coordinate di texture di ogni copia si spostano di qualche metro,
 * secondo la sua posizione (la stessa regola del cantiere per le case).
 */
const SFASA = `#include <batching_vertex>
#ifdef USE_BATCHING
  vec2 sfasaB = fract(vec2(dot(batchingMatrix[3].xz, vec2(0.1371, 0.0713)), dot(batchingMatrix[3].xz, vec2(0.0517, 0.1931)))) * 7.0;
  #ifdef USE_MAP
  vMapUv += (mapTransform * vec3(sfasaB, 0.0)).xy;
  #endif
  #ifdef USE_NORMALMAP
  vNormalMapUv += (normalMapTransform * vec3(sfasaB, 0.0)).xy;
  #endif
  #ifdef USE_ROUGHNESSMAP
  vRoughnessMapUv += (roughnessMapTransform * vec3(sfasaB, 0.0)).xy;
  #endif
#endif`;

function sfasaCopie(m) {
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <batching_vertex>', SFASA); };
  m.customProgramCacheKey = () => 'sfasa';
}

/**
 * Una variazione di tono su larga scala (qualche metro), calcolata dalla
 * posizione nel mondo: sporco, dilavamento, pietre di cave diverse. Rompe
 * la ripetizione delle foto sulle pareti grandi.
 */
function variaTono(m) {
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMondo;')
      .replace('#include <batching_vertex>', SFASA)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vec4 pMondo = vec4(transformed, 1.0);
#ifdef USE_BATCHING
pMondo = batchingMatrix * pMondo;
#endif
vPosMondo = (modelMatrix * pMondo).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosMondo;
float hashT(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rumoreT(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hashT(i), hashT(i + vec2(1, 0)), f.x), mix(hashT(i + vec2(0, 1)), hashT(i + vec2(1, 1)), f.x), f.y);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 qT = vPosMondo.xz * 0.21 + vec2(vPosMondo.y * 0.13, -vPosMondo.y * 0.09);
        float nT = rumoreT(qT) * 0.6 + rumoreT(qT * 2.7 + 5.3) * 0.4;
        diffuseColor.rgb *= 0.8 + 0.34 * nT;`);
  };
  m.customProgramCacheKey = () => 'variaTono';
}

// risoluzione delle texture generate: piena per quelle che si vedono da vicino
const GRANDI = new Set(['conci', 'intonaco', 'coppi', 'terra']);

/*
 * Texture fotografiche CC0 di Poly Haven, in public/texture/ (autori e
 * misure in FONTI.json). Sono scansioni di materiali veri, ma non dei
 * materiali di Firenze: la tinta le avvicina alla pietraforte grigio-bruna
 * e ai coppi toscani. «scala» allarga una texture che copre troppo poco.
 */
const FOTO = {
  conci: { tinta: [0.96, 0.9, 0.86] },
  pietrame: { tinta: [0.95, 0.92, 0.9] },
  intonaco: {},
  coppi: { tinta: [1.0, 0.92, 0.86] },
  terra: { scala: 2.2, tinta: [0.78, 0.74, 0.7] },
  legno: {},
  lastre: { tinta: [0.88, 0.84, 0.78] },
  ghiaia: { tinta: [0.9, 0.88, 0.84] }
};

async function caricaFoto(nome, info) {
  const loader = new TextureLoader();
  const base = `./texture/${nome}/`;
  const [map, normalMap, roughnessMap] = await Promise.all(['colore', 'rilievo', 'ruvidita'].map(f => loader.loadAsync(base + f + '.jpg')));
  for (const t of [map, normalMap, roughnessMap]) {
    t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = ANISO; t.colorSpace = NoColorSpace;
  }
  map.colorSpace = SRGBColorSpace;
  return { map, normalMap, roughnessMap, dim: info.dimensioni_mm[0] / 1000 * (FOTO[nome].scala || 1) };
}

/** Genera nei worker le texture che servono; se i worker mancano, qui. */
async function generaProcedurali(nomi, S, avanzamento) {
  const dim = n => GRANDI.has(n) ? S : S / 2;
  const risultati = {};
  try {
    const n = Math.max(1, Math.min(nomi.length, (navigator.hardwareConcurrency || 4) - 1));
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
          avanzamento();
        }
      } finally { w.terminate(); }
    }));
  } catch (e) {
    console.warn('worker non disponibili, genero le texture sul filo principale', e);
    for (const nome of nomi) if (!risultati[nome]) { risultati[nome] = GENERATORI[nome](dim(nome)); avanzamento(); }
  }
  const out = {};
  for (const [k, r] of Object.entries(risultati))
    out[k] = { map: dataTex(r.col, r.S, true), normalMap: dataTex(r.nor, r.S, false), roughnessMap: dataTex(r.rgh, r.S, false), dim: r.dim };
  return out;
}

/** Prepara tutti i materiali: foto dove ci sono, texture generate per il resto. */
export async function creaMateriali(qualita = 'alta', avanzamento = () => {}) {
  const S = qualita === 'alta' ? 1024 : 512;
  const tex = {};
  let fatti = 0;
  const totale = Object.keys(GENERATORI).length;
  const passo = () => avanzamento(++fatti, totale);

  let fonti = {};
  try { fonti = await (await fetch('./texture/FONTI.json')).json(); } catch { /* senza foto si va avanti */ }
  await Promise.all(Object.keys(FOTO).map(async nome => {
    if (!fonti[nome]) return;
    try { tex[nome] = await caricaFoto(nome, fonti[nome]); passo(); }
    catch (e) { console.warn('foto non caricata, la genero:', nome, e); }
  }));
  // il legno scuro, se c'è la foto del legno, sono le stesse assi più scure
  const mancanti = Object.keys(GENERATORI).filter(n => !tex[n] && !(n === 'legnoScuro' && tex.legno));
  Object.assign(tex, await generaProcedurali(mancanti, S, passo));

  for (const nome of Object.keys(GENERATORI)) {
    if (nome === 'legnoScuro' && tex.legno && !tex.legnoScuro) { MAT.legnoScuro = materiale(tex.legno, { color: new Color(0.5, 0.4, 0.33) }); sfasaCopie(MAT.legnoScuro); continue; }
    const t = FOTO[nome]?.tinta;
    MAT[nome] = materiale(tex[nome], t ? { color: new Color(...t) } : {});
    if (['conci', 'pietrame', 'intonaco', 'coppi', 'lastre'].includes(nome)) variaTono(MAT[nome]);
    else sfasaCopie(MAT[nome]);
  }
  // ferro battuto (bandelle, chiodi, anelli) e tela oliata delle impannate
  MAT.ferro = new MeshStandardMaterial({ color: 0x2b2826, roughness: 0.55, metalness: 0.7, vertexColors: true });
  MAT.tela = new MeshStandardMaterial({ color: 0xc9b98f, roughness: 0.85, metalness: 0, vertexColors: true });
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
