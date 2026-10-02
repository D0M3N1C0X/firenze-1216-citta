/* =====================================================================
   Dal copione del gioco ai testi del racconto nella città.

   Legge storia/copione.md (nel repository del progetto, fuori da citta/)
   e scrive src/dati/copione.js: per ogni schermata il titolo, il testo,
   le scelte, le note del quaderno, le citazioni e la base storica.
   Va lanciato dal repository completo: nel repository pubblico della
   città il copione non c'è, c'è solo il file generato.

   Le decisioni che riguardano la città (luogo, giornata, ora, punto di
   vista) non stanno qui ma in src/dati/scene.js, scritto a mano.
   ===================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCENE } from '../src/dati/scene.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const COPIONE = join(QUI, '..', '..', 'storia', 'copione.md');
const USCITA = join(QUI, '..', 'src', 'dati', 'copione.js');

const md = readFileSync(COPIONE, 'utf8');
const stato = (md.match(/\*\*Stato:\*\* ([^\n]+)/) || [])[1] || '';

// il testo semplice: via il grassetto, il corsivo e i `marcatori` del copione
const piano = s => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();

// solo le schermate che la città usa: l'atto V e l'epilogo restano nel gioco
const USATE = new Set(SCENE.map(s => s.id));
const schermate = {};
const sezioni = md.split(/^### /m).slice(1);
for (const sez of sezioni) {
  const righe = sez.split('\n');
  const intest = righe[0].match(/^([A-Z]+[0-9]+[a-z]?) · (.+?)(\s+\*\(facoltativo\)\*)?\s*$/);
  if (!intest) continue;
  const [, id, titolo, facoltativo] = intest;
  if (!USATE.has(id)) continue;
  // la sezione finisce al prossimo titolo di livello 2
  const corpo = [];
  for (const r of righe.slice(1)) { if (/^## /.test(r)) break; corpo.push(r); }

  const testo = [];
  let par = [];
  const scelte = [], testimoni = [], note = [], citazioni = [];
  let base = '';
  let tabella = null;            // la prima cella dell'intestazione: «Scelta» o «Testimone»
  for (const r of corpo) {
    if (r.startsWith('>')) {
      const t = r.replace(/^>\s?/, '');
      if (t.trim() === '') { if (par.length) testo.push(piano(par.join(' '))); par = []; }
      else par.push(t);
      continue;
    }
    if (par.length) { testo.push(piano(par.join(' '))); par = []; }
    if (r.startsWith('|')) {
      const celle = r.split('|').slice(1, -1).map(c => c.trim());
      if (!tabella) { tabella = celle[0]; continue; }           // intestazione
      if (/^-+$/.test(celle[0])) continue;                      // separatore
      if (tabella === 'Scelta') scelte.push(piano(celle[0]));
      else if (tabella === 'Testimone') testimoni.push(piano(celle[0]));
      continue;
    }
    tabella = null;
    const n = r.match(/^\*\*Nota ([^*]+)\*\* · \*([^*]+)\*(?: \(([^)]+)\))? · (.+?)(?: → \w+)?\s*$/);
    if (n) { note.push({ id: n[1].trim(), tipo: n[2].trim(), ...(n[3] ? { chi: n[3].trim() } : {}), testo: piano(n[4]) }); continue; }
    const c = r.match(/^\*(Citazione per le superiori|Parafrasi per le medie|Glossa per le superiori|Glossa):\* (.+)$/);
    if (c) { citazioni.push({ tipo: c[1], testo: piano(c[2]) }); continue; }
    const b = r.match(/^\*\*Base storica[^*]*\*\* (.+)$/);
    if (b) { base = piano(b[1]); continue; }
  }
  if (par.length) testo.push(piano(par.join(' ')));
  schermate[id] = { titolo: piano(titolo), ...(facoltativo ? { facoltativo: true } : {}), testo, scelte, ...(testimoni.length ? { testimoni } : {}), note, citazioni, base };
}

const out = `/* Generato da scripts/copione-estrai.mjs il ${new Date().toISOString().slice(0, 10)}. Non modificare a mano.
   Fonte: storia/copione.md del progetto «Cosa fatta capo ha» (${stato.replace(/\*/g, '')}).
   Testi di Domenico Perroni, licenza CC BY 4.0. */

export const COPIONE = ${JSON.stringify(schermate, null, 1)};
`;
writeFileSync(USCITA, out);
console.log(`${Object.keys(schermate).length} schermate → ${USCITA}`);
