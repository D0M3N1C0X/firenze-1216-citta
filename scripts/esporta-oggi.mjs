/* =====================================================================
   FIRENZE DI OGGI, IN glTF PER UNITY — npm run unity (24 novembre 2026)

   Fa costruire a Node la città di oggi come il browser (mondo/oggi.js:
   novemila volumi misurati dalla Regione Toscana nel 2011, tetti, ponti,
   lungarni, i monumenti curati a parte) e la scrive in riquadri di 400 m:
   ../unity/Firenze1216/Assets/Modelli/Oggi/oggi-<i>_<j>.glb, una maglia
   per materiale e riquadro, con il nome del materiale (intonaco, pietra,
   marmo, coppi, conci, lastre, bianco, oro, bronzo, sottogronda).
   Le facciate portano i dati per disegnare finestre, persiane, botteghe
   e marmi (gli attributi «fa» e «fb» del browser) in TEXCOORD_1–4; li
   legge lo shader Firenze/Oggi. I colori degli intonaci nei vertici.
   Coordinate come nel browser (in Unity si gira di 180°: vedi
   CostruisciCitta.cs). I file sono nel .gitignore, come quelli della città.
   ===================================================================== */
import { mkdirSync, writeFileSync } from 'node:fs';
import { MeshStandardMaterial, Scene } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { costruisciOggi } from '../src/mondo/oggi.js';
import { glb } from './glb.mjs';
import { MAT } from '../src/mondo/materiali.js';

globalThis.self ||= globalThis;
// in Node le foto dei materiali non si caricano: bastano i nomi (Unity mette i suoi)
for (const n of ['lastre', 'intonaco', 'conci', 'coppi', 'legno', 'legnoScuro']) MAT[n] ||= new MeshStandardMaterial({ name: n });
const uscita = new URL('../../unity/Firenze1216/Assets/Modelli/Oggi/', import.meta.url);
mkdirSync(uscita, { recursive: true });

const t0 = Date.now();
const scena = new Scene();
const oggi = await costruisciOggi(scena);
oggi.gruppo.updateMatrixWorld(true);
const RQ = 400, file = new Map(); let tri = 0, maglie = 0;
const senzaNome = new Set();
oggi.gruppo.traverse(m => {
  if (!m.isMesh) return;
  const mat = m.material?.userData?.chiaveOggi || m.material?.name || '';
  if (!mat) { senzaNome.add(m.material?.type); return; }
  let g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
  // i vertici delle facciate hanno dati propri (fa, fb): si fondono solo quelli davvero uguali
  g = mergeVertices(g, 1e-4);
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(g.boundingBox.min.clone());
  const k = `${Math.floor(c.x / RQ)}_${Math.floor(c.z / RQ)}`;
  const A = g.attributes, n = A.position.count;
  const due = (attr, a, b) => { const out = new Float32Array(n * 2); for (let i = 0; i < n; i++) { out[i * 2] = attr.array[i * 4 + a]; out[i * 2 + 1] = attr.array[i * 4 + b]; } return out; };
  const uv2 = A.fa && A.fb ? [due(A.fa, 0, 1), due(A.fa, 2, 3), due(A.fb, 0, 1), due(A.fb, 2, 3)] : null;
  if (!file.has(k)) file.set(k, []);
  file.get(k).push({
    nome: `oggi|${mat}`, mat, pos: new Float32Array(A.position.array), nor: A.normal ? new Float32Array(A.normal.array) : null,
    uv: A.uv ? new Float32Array(A.uv.array) : null, colori: A.color ? new Float32Array(A.color.array) : null, uv2,
    idx: new Uint32Array(g.index ? g.index.array : Array.from({ length: n }, (_, i) => i))
  });
  tri += (g.index ? g.index.count : n) / 3; maglie++;
});
if (senzaNome.size) console.warn('materiali senza nome, saltati:', [...senzaNome].join(', '));
const elenco = [];
for (const [k, ms] of file) { const b = glb(ms, 'firenze-1216 esporta-oggi.mjs'); writeFileSync(new URL(`oggi-${k}.glb`, uscita), b); elenco.push({ file: `oggi-${k}.glb`, maglie: ms.length, mb: Math.round(b.length / 1e5) / 10 }); }
writeFileSync(new URL('oggi.json', uscita), JSON.stringify({ riquadro: RQ, volumi: oggi.volumi.length, file: elenco }, null, 1));
console.log(`✓ oggi: ${oggi.volumi.length} volumi, ${maglie} maglie in ${elenco.length} file (il più grande ${Math.max(...elenco.map(e => e.mb))} MB, in tutto ${Math.round(elenco.reduce((a, e) => a + e.mb, 0))} MB), ${Math.round(tri / 1000)} mila triangoli, in ${Math.round((Date.now() - t0) / 1000)} s`);
