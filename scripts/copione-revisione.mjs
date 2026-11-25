// npm run copione-revisione: scrive storia/copione-inglese-da-rivedere.html, il copione italiano e la bozza inglese
// (src/dati/copione-en.js) affiancati, scena per scena, per la revisione dell'autore. Nessun dato nuovo.
import { writeFileSync } from 'node:fs';
import { COPIONE } from '../src/dati/copione.js';
import { COPIONE_EN, SCENE_EN } from '../src/dati/copione-en.js';
import { SCENE } from '../src/dati/scene.js';
import { REGIA } from '../src/dati/regia.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const riga = (cosa, it, en) => `<tr><th>${cosa}</th><td>${esc(it)}</td><td lang="en">${esc(en)}</td></tr>`;
let corpo = '';
for (const s of SCENE) {
  const c = COPIONE[s.id], e = COPIONE_EN[s.id] || {}, se = SCENE_EN[s.id] || {};
  corpo += `<section id="${s.id}"><h2>${s.id} · ${esc(c.titolo)} <span lang="en">/ ${esc(e.titolo)}</span></h2><table>`;
  c.testo.forEach((t, i) => { corpo += riga(`¶ ${i + 1}`, t, e.testo?.[i]); });
  c.scelte.forEach((t, i) => { corpo += riga(`scelta ${String.fromCharCode(65 + i)}`, t, e.scelte?.[i]); });
  (c.testimoni || []).forEach((t, i) => { corpo += riga(`testimone ${i + 1}`, t, e.testimoni?.[i]); });
  for (const n of c.note) for (const id of n.id.split('/').map(x => x.trim())) corpo += riga(`nota ${id}`, n.id.includes('/') ? c.scelte[id.charCodeAt(id.length - 1) - 97] : n.testo, e.note?.[id]);
  if (s.ramo) corpo += riga('ramo', s.ramo, se.ramo);
  const ad = REGIA[s.id]?.adattamento ?? s.adattamento;
  if (ad) corpo += riga('nella città', ad, se.adattamento);
  if (s.fuori) corpo += riga('fuori dalla città', s.fuori, se.fuori);
  corpo += '</table></section>\n';
}
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Copione inglese da rivedere</title>
<style>
:root { --carta: #f6efe0; --inchiostro: #2c2216; --rosso: #8e2b1f; --riga: #e3d7bd; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --carta: #1e1a15; --inchiostro: #ece2cf; --rosso: #e07b63; --riga: #3a3127; } }
body { background: var(--carta); color: var(--inchiostro); font: 17px/1.5 Georgia, serif; margin: 0 auto; max-width: 1100px; padding: 16px; }
h1 { color: var(--rosso); font-size: 1.6em; } h2 { color: var(--rosso); font-size: 1.15em; margin-top: 2em; }
h2 span { color: var(--inchiostro); opacity: 0.7; font-weight: normal; }
table { border-collapse: collapse; width: 100%; } th, td { border-top: 1px solid var(--riga); padding: 8px; vertical-align: top; text-align: left; }
th { width: 8em; font-weight: normal; font-size: 0.85em; opacity: 0.75; } td { width: 46%; }
@media (max-width: 700px) { tr { display: grid; } th, td { width: auto; } td[lang="en"] { border-top: 0; font-style: italic; } }
</style></head><body>
<h1>Il copione in inglese — bozza da rivedere</h1>
<p>Traduzione di lavoro (23 novembre 2026) di <i>storia/copione.md</i>, per l'app in inglese. A sinistra l'italiano, a destra l'inglese,
scena per scena. Ogni frase tra «» ha la sua tra “ ”: la regia le dà una voce. Le correzioni vanno in <i>citta/src/dati/copione-en.js</i>
(poi <code>npm run racconto</code>); questa pagina si rifà con <code>node scripts/copione-revisione.mjs</code>.</p>
${corpo}</body></html>`;
writeFileSync(new URL('../../storia/copione-inglese-da-rivedere.html', import.meta.url), html);
console.log('storia/copione-inglese-da-rivedere.html');
