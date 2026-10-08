import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* =====================================================================
   I MONUMENTI MODELLATI IN BLENDER (strumenti/monumenti/monumenti.py)

   Ogni modello è un file public/monumenti/<nome>.glb con le parti divise
   per materiale; indice.json dice quali ci sono e dove vanno (misure prese
   dalla città da scripts/parametri-monumenti.mjs). Qui si caricano; li
   posa monumenti.js attraverso il cantiere, come le case, così valgono
   anche per i colori della certezza. Se un modello manca, monumenti.js usa
   le forme semplici di prima.
   ===================================================================== */

export const MODELLI = {};
export let INDICE = {};

export async function caricaModelli() {
  INDICE = await fetch('./monumenti/indice.json').then(r => r.json());
  const loader = new GLTFLoader();
  await Promise.all(Object.keys(INDICE).map(async nome => {
    const gltf = await loader.loadAsync(`./monumenti/${nome}.glb`);
    gltf.scene.updateMatrixWorld(true);
    const parti = [];
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      parti.push({ mat: o.material.name, geo: g });
    });
    MODELLI[nome] = parti;
  }));
  return MODELLI;
}

/** Posa un modello nel cantiere con la matrice M (da modello a mondo). */
export function posaModello(cant, nome, M, livello, tinta = [1, 1, 1], ombra = true) {
  for (const p of MODELLI[nome]) cant.aggiungi(p.geo.clone(), p.mat, livello, M, tinta, ombra);
}
