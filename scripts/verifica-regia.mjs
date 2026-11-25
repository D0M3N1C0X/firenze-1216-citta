// Controlla la regia delle scene recitate (src/dati/regia.js) contro il copione e le figure:
// una battuta per paragrafo, una voce per ogni «…», personaggi, movimenti e attrezzi che esistono.
import { readFileSync } from 'node:fs';
import { COPIONE } from '../src/dati/copione.js';
import { SCENE } from '../src/dati/scene.js';
import { REGIA, VOCI } from '../src/dati/regia.js';
import { COPIONE_EN } from '../src/dati/copione-en.js';
const U = new URL('../../unity/Firenze1216/Assets/', import.meta.url);
const pers = new Set(JSON.parse(readFileSync(new URL('Modelli/Gente/personaggi/figure.json', U))).map(f => f.nome));
const mov = new Set(Object.keys(JSON.parse(readFileSync(new URL('Modelli/Gente/movimenti.json', U)))));
const attrezzi = new Set(Object.keys(JSON.parse(readFileSync(new URL('Modelli/Attrezzi/indice.json', U)))));
const animali = new Set(Object.keys(JSON.parse(readFileSync(new URL('Modelli/Animali/animali.json', U)))));
const posti = JSON.parse(readFileSync(new URL('Modelli/Monumenti/indice.json', U))).campi.posti.length;
const RUOLI = ['artigiano', 'popolano', 'mercante', 'cavaliere', 'chierico', 'monaco', 'popolana', 'fantesca', 'mercantessa', 'nobildonna', 'fanciulla', 'ragazzo', 'ragazza'];
const POSE = new Set(['fermo', 'seduto', 'in sella', 'a terra', 'bara']);
const err = [];
for (const id of Object.keys(COPIONE)) if (!REGIA[id]) err.push(`${id}: manca la regia`);
for (const [id, r] of Object.entries(REGIA)) {
  const c = COPIONE[id]; if (!c) { err.push(`${id}: non è nel copione`); continue; }
  if (!SCENE.find(s => s.id === id)) err.push(`${id}: non è in scene.js`);
  if (r.battute.length !== c.testo.length) err.push(`${id}: ${r.battute.length} battute per ${c.testo.length} paragrafi`);
  const nomi = new Set((r.attori || []).map(a => a.chi));
  const chiOk = chi => pers.has(chi) || RUOLI.includes(chi.split('#')[0]);
  const posaOk = p => !p || POSE.has(p) || mov.has(p);
  for (const a of r.attori || []) {
    if (!chiOk(a.chi)) err.push(`${id}: attore sconosciuto ${a.chi}`);
    if (!posaOk(a.posa)) err.push(`${id}: posa sconosciuta ${a.posa}`);
    if (a.porta && !attrezzi.has(a.porta)) err.push(`${id}: attrezzo mancante ${a.porta}`);
    if (a.cavallo && !animali.has(a.cavallo)) err.push(`${id}: cavallo mancante ${a.cavallo}`);
    if (a.posto !== undefined && (SCENE.find(s => s.id === id)?.mondo !== 'campi' || a.posto < 0 || a.posto >= posti)) err.push(`${id}: posto ${a.posto} fuori dalla sala di Campi`);
  }
  const presi = (r.attori || []).filter(a => a.posto !== undefined).map(a => a.posto);
  if (new Set(presi).size !== presi.length) err.push(`${id}: due personaggi sullo stesso posto`);
  for (const f of r.folla || []) { for (const ru of f.ruoli) if (!RUOLI.includes(ru)) err.push(`${id}: ruolo ${ru}`); if (!posaOk(f.posa)) err.push(`${id}: posa folla ${f.posa}`); }
  r.battute.forEach((b, i) => {
    const virgolette = (c.testo[i]?.match(/«/g) || []).length;
    if (b.voci && b.voci.length !== virgolette) err.push(`${id}.${i}: ${b.voci.length} voci per ${virgolette} «…»`);
    for (const v of b.voci || []) if (!VOCI[v]) err.push(`${id}.${i}: voce ${v}`);
    for (const f of b.fa || []) {
      if (f.chi && !nomi.has(f.chi)) err.push(`${id}.${i}: ${f.chi} non è tra gli attori`);
      if (f.gesto && !mov.has(f.gesto)) err.push(`${id}.${i}: movimento mancante ${f.gesto}`);
      if (!posaOk(f.posa)) err.push(`${id}.${i}: posa ${f.posa}`);
      if (f.oggetto && !attrezzi.has(f.oggetto.cosa)) err.push(`${id}.${i}: attrezzo mancante ${f.oggetto.cosa}`);
      for (const n of [...(f.compare || []), ...(f.via || [])]) if (n !== 'folla' && !nomi.has(n)) err.push(`${id}.${i}: ${n} non è tra gli attori`);
    }
  });
}
// l'inglese: le stesse scene, gli stessi paragrafi e scelte, una coppia “ ” per ogni «…» (la regia dà una voce a ciascuna)
for (const [id, c] of Object.entries(COPIONE)) {
  const e = COPIONE_EN[id]; if (!e) { err.push(`${id}: manca l'inglese`); continue; }
  if (e.testo.length !== c.testo.length) err.push(`${id}: inglese con ${e.testo.length} paragrafi per ${c.testo.length}`);
  if ((e.scelte || []).length !== c.scelte.length) err.push(`${id}: inglese con ${(e.scelte || []).length} scelte per ${c.scelte.length}`);
  c.testo.forEach((t, i) => { const a = (t.match(/«/g) || []).length, b = (e.testo[i]?.match(/“/g) || []).length; if (a !== b) err.push(`${id}.${i}: ${a} «…» in italiano, ${b} “…” in inglese`); });
  for (const n of c.note) for (const nid of n.id.split('/').map(x => x.trim())) if (!e.note?.[nid]) err.push(`${id}: manca in inglese la nota ${nid}`);
  if (c.testimoni && (e.testimoni || []).length !== c.testimoni.length) err.push(`${id}: testimoni in inglese`);
}
console.log(err.length ? err.join('\n') : 'regia: tutto a posto');
if (err.length) process.exitCode = 1;
