/* =====================================================================
   LA CITTÀ GENERATA, IN glTF PER UNITY — npm run unity (dopo esporta-unity)

   Fa costruire la città a Node come il browser (strade, monumenti con i
   modelli di Blender, mura, porte, palizzata, torri, case sul fiume,
   botteghe dei mestieri) e scrive tutto quello che il cantiere fonde in
   ../unity/Firenze1216/Assets/Modelli/Citta/cantiere-<epoca>.glb: una
   maglia per materiale, livello di certezza e riquadro di 80 m, con il
   nome del materiale (conci, coppi, legno…), che Unity sostituisce con i
   suoi. Le case comuni NON ci sono: Unity mette i 27 tipi di Blender
   dai dati (esporta-unity.mjs). Neppure i pezzi del kit edilizio
   (finestre, porte, arredo fisso), che qui non si caricano.

   Scrive anche alberi-<epoca>.json: le posizioni di ulivi e cipressi.
   Coordinate come nel browser: x verso est, y in su, z verso sud (in Unity
   l'oggetto va ruotato di 180° attorno alla verticale: glTFast ribalta x,
   la città ribalta z; vedi CostruisciCitta.cs).
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Scene } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FIUME, STRADE as STRADE_1216 } from '../src/dati/osm.js';
import { strade1216 } from '../src/dati/strade-1216.js';
import { TRACCIATO, dentroTracciato } from '../src/dati/cerchia.js';
import { EPOCA, NEL_1300 } from '../src/mondo/epoca.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { costruisciMonumenti } from '../src/mondo/monumenti.js';
import { INDICE, MODELLI } from '../src/mondo/modelli.js';
import * as MOD from '../src/mondo/modelli.js';
import { lottizza, casa, torre } from '../src/mondo/edifici.js';
import { costruisciMura, costruisciPalizzata, ipotesiLatoSud } from '../src/mondo/mura.js';
import { costruisciBorghi } from '../src/mondo/fondale.js';
import { costruisciMestieri } from '../src/mondo/mestieri.js';
import { posizioniAlberi } from '../src/mondo/vegetazione.js';
import { LIVELLO_ACQUA } from '../src/mondo/terreno.js';
import { glb } from './glb.mjs';

const qui = new URL('.', import.meta.url);
const uscita = new URL('../../unity/Firenze1216/Assets/Modelli/Citta/', qui);
mkdirSync(uscita, { recursive: true });

// --- i modelli di Blender dei monumenti, letti dal disco (come caricaModelli nel browser)
globalThis.self ||= globalThis;
const tutti = JSON.parse(readFileSync(new URL('../public/monumenti/indice.json', qui), 'utf8'));
const indice = Object.fromEntries(Object.entries(tutti).filter(([, v]) => !v.epoca || v.epoca === EPOCA));
MOD.soloIndice(tutti);
const loader = new GLTFLoader();
for (const nome of Object.keys(indice)) {
  const buf = readFileSync(new URL(`../public/monumenti/${nome}.glb`, qui));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await new Promise((ok, ko) => loader.parse(ab, '', ok, ko));
  gltf.scene.updateMatrixWorld(true);
  const parti = [];
  gltf.scene.traverse(o => { if (o.isMesh) { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); parti.push({ mat: o.material.name, geo: g }); } });
  MODELLI[nome] = parti;
}
void INDICE;

// --- la pianta e il cantiere, come scripts/esporta-unity.mjs
let griglia, strade, lotti, borghi;
const cant = new Cantiere();
const RIQUADRO = [Math.min(...TRACCIATO.map(p => p[0])), Math.min(...TRACCIATO.map(p => p[1])), Math.max(...TRACCIATO.map(p => p[0])), Math.max(...TRACCIATO.map(p => p[1]))];
if (NEL_1300) {
  const { STRADE } = await import('../src/dati/osm-1300.js');
  const M13 = await import('../src/dati/strade-1300.js');
  const C13 = await import('../src/dati/cerchia-1300.js');
  const { PALIZZATA_1300, RIEMPIMENTO_1300, componiStrade1300, lottiBorghi1300 } = await import('../src/mondo/citta-1300.js');
  const { muraOltrarno1300, porteInCantiere } = await import('../src/mondo/mura-1300.js');
  const { costruisciMonumenti1300 } = await import('../src/mondo/monumenti-1300.js');
  griglia = new Griglia(-2000, 1800); griglia.poligono(FIUME, C_FIUME);
  strade = componiStrade1300(M13, STRADE);
  for (const s of strade) { if (s.area) griglia.poligono(s.punti, PIAZZA, false); else griglia.spezzata(s.punti, s.larghezza, STRADA, false); }
  costruisciMonumenti(cant, griglia); costruisciMonumenti1300(cant, griglia);
  costruisciMura(cant, griglia); ipotesiLatoSud(cant); muraOltrarno1300(cant, griglia); porteInCantiere(cant, griglia);
  lotti = lottizza(griglia, strade.filter(s => !s.fuoriVecchia), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: RIEMPIMENTO_1300 });
  borghi = lottiBorghi1300(griglia, strade, C13.dentroLimite, C13.LIMITE);
  costruisciMestieri(cant, griglia, lotti, strade);
  costruisciPalizzata(cant, griglia, PALIZZATA_1300);
} else {
  griglia = new Griglia(-1100, 1100); griglia.poligono(FIUME, C_FIUME);
  strade = strade1216(STRADE_1216);
  for (const s of strade) { if (s.area) griglia.poligono(s.punti, PIAZZA, false); else griglia.spezzata(s.punti, s.larghezza, STRADA, false); }
  costruisciMonumenti(cant, griglia); costruisciMura(cant, griglia); ipotesiLatoSud(cant);
  lotti = lottizza(griglia, strade.filter(s => !s.fuori), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: 28000 });
  // i borghi: la lottizzazione sola (costruisciBorghi le costruirebbe anche); le case comuni le mette Unity
  borghi = costruisciBorghi(new Cantiere(), griglia, strade);      // un cantiere a perdere: serve solo l'elenco dei lotti
  costruisciMestieri(cant, griglia, lotti, strade);
  costruisciPalizzata(cant, griglia);
}
// delle case: solo le torri e quelle sul fiume (le altre sono i tipi di Blender, che Unity mette da sé)
let torri = 0, sulFiume = 0;
for (const L of [...lotti, ...borghi]) {
  if (L.tipo === 'torre') { torre(cant, L); torri++; } else if (L.retro) { casa(cant, L); sulFiume++; }
}
const scena = new Scene();
cant.costruisci(scena);

// le maglie, con i vertici condivisi (mergeVertices: un quarto dello spazio), divise in riquadri di 400 m:
// un file ciascuno, perché GitHub non accetta file oltre i 100 MB
const RQ = 400, file = new Map(); let tri = 0;
for (const m of scena.children) {
  if (!m.isMesh) continue;
  const u = m.userData; if (u.variante === 'certezza') continue;        // le ipotesi da confrontare restano al browser
  const g = mergeVertices(m.geometry, 1e-3);
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(g.boundingBox.min.clone());
  const k = `${Math.floor(c.x / RQ)}_${Math.floor(c.z / RQ)}`;
  tri += g.index.count / 3;
  if (!file.has(k)) file.set(k, []);
  file.get(k).push({ nome: `${u.mat}|${u.livello}|${u.variante || 'sempre'}`, mat: u.mat, pos: new Float32Array(g.attributes.position.array), nor: g.attributes.normal ? new Float32Array(g.attributes.normal.array) : null, uv: g.attributes.uv ? new Float32Array(g.attributes.uv.array) : null, idx: new Uint32Array(g.index.array) });
}
const elenco = [];
for (const [k, ms] of file) { const b = glb(ms); writeFileSync(new URL(`cantiere-${EPOCA}-${k}.glb`, uscita), b); elenco.push({ file: `cantiere-${EPOCA}-${k}.glb`, maglie: ms.length, mb: Math.round(b.length / 1e5) / 10 }); }
writeFileSync(new URL(`cantiere-${EPOCA}.json`, uscita), JSON.stringify({ riquadro: RQ, file: elenco }, null, 1));
const meshes = elenco;
const alberi = posizioniAlberi({ evita: strade.filter(s => NEL_1300 ? s.fuoriVecchia : s.fuori) });
const r1 = v => Math.round(v * 10) / 10;
writeFileSync(new URL(`alberi-${EPOCA}.json`, uscita), JSON.stringify({ livelloAcqua: LIVELLO_ACQUA, ulivi: alberi.ulivi.flatMap(p => [r1(p[0]), r1(p[1]), r1(p[2])]), cipressi: alberi.cipressi.flatMap(p => [r1(p[0]), r1(p[1]), r1(p[2])]) }));
console.log(`✓ cantiere ${EPOCA}: ${elenco.length} file (il più grande ${Math.max(...elenco.map(e => e.mb))} MB, in tutto ${Math.round(elenco.reduce((a, e) => a + e.mb, 0))} MB), ${Math.round(tri / 1000)} mila triangoli (${torri} torri, ${sulFiume} case sul fiume, monumenti, mura, porte, botteghe); ${alberi.ulivi.length} ulivi e ${alberi.cipressi.length} cipressi`);
