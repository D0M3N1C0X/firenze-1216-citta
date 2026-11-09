/* =====================================================================
   VERIFICA DELLA CITTÀ DEL 1300 — EPOCA=1300 node scripts/verifica-1300.mjs
   (la lancia anche npm run verifica, dopo quella del 1216)

   Rifà la pianta del suolo del 1300 come la costruisce la città con
   ?epoca=1300 (strade, monumenti, mura vecchie e nuove, case, borghi),
   senza disegnare niente, e controlla:
   - che ogni luogo della città con una scheda si raggiunga a piedi dal
     punto d'ingresso, come nel 1216;
   - che si arrivi a piedi alle porte nuove del 1300 e al guasto degli Uberti;
   - che i dati del 1300 siano coerenti: ogni strada con un motivo esiste
     nell'estratto, ogni chiesa citata ha un'impronta, nessuna strada è
     insieme «prima» e «dopo» il 1300, il tracciato delle mura si chiude;
   - che le torri siano mozzate a 50 braccia.
   Esce con codice 1 se qualcosa non va.
   ===================================================================== */

import { readFileSync } from 'node:fs';
import { FIUME } from '../src/dati/osm.js';
import { STRADE, IMPRONTE } from '../src/dati/osm-1300.js';
import * as MOD_STRADE from '../src/dati/strade-1300.js';
import { AVVISI, LIMITE, PORTE, dentroLimite, OLTRARNO_1300 } from '../src/dati/cerchia-1300.js';
import { TRACCIATO, dentroTracciato } from '../src/dati/cerchia.js';
import { LUOGHI } from '../src/dati/luoghi.js';
import { TRECENTO, LUOGHI_1300 } from '../src/dati/trecento-luoghi.js';
import { LUOGHI_EN } from '../src/dati/inglese.js';
import { EPOCA, TETTO_TORRI, BRACCIO } from '../src/mondo/epoca.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA, EDIFICIO, MONUMENTO } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { costruisciMonumenti } from '../src/mondo/monumenti.js';
import { soloIndice } from '../src/mondo/modelli.js';
import { lottizza } from '../src/mondo/edifici.js';
import { costruisciMura, costruisciPalizzata } from '../src/mondo/mura.js';
import { muraOltrarno1300, porteInCantiere } from '../src/mondo/mura-1300.js';
import { costruisciMestieri, grigliaDeiMestieri } from '../src/mondo/mestieri.js';
import { PALIZZATA_1300, RIEMPIMENTO_1300, componiStrade1300, lottiBorghi1300 } from '../src/mondo/citta-1300.js';
import { costruisciMonumenti1300, POSE_1300 } from '../src/mondo/monumenti-1300.js';

const errori = [];
if (EPOCA !== '1300') { console.error('✗ lanciare con EPOCA=1300 (npm run verifica lo fa da sé)'); process.exit(1); }

soloIndice(JSON.parse(readFileSync(new URL('../public/monumenti/indice.json', import.meta.url), 'utf8')));

const t0 = Date.now();
const griglia = new Griglia(-2000, 1800);
griglia.poligono(FIUME, C_FIUME);
const strade = componiStrade1300(MOD_STRADE, STRADE);
for (const s of strade) {
  if (s.area) griglia.poligono(s.punti, PIAZZA, false);
  else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
}
const cant = new Cantiere();
costruisciMonumenti(cant, griglia);
const monumenti1300 = costruisciMonumenti1300(cant, griglia);
costruisciMura(cant, griglia);
muraOltrarno1300(cant, griglia);
porteInCantiere(cant, griglia);
const RIQUADRO = [Math.min(...TRACCIATO.map(p => p[0])), Math.min(...TRACCIATO.map(p => p[1])), Math.max(...TRACCIATO.map(p => p[0])), Math.max(...TRACCIATO.map(p => p[1]))];
const lotti = lottizza(griglia, strade.filter(s => !s.fuoriVecchia), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: RIEMPIMENTO_1300 });
const borghi = lottiBorghi1300(griglia, strade, dentroLimite, LIMITE);
costruisciMestieri(cant, griglia, lotti, strade);
grigliaDeiMestieri(griglia, false);
costruisciPalizzata(cant, griglia, PALIZZATA_1300);
console.log(`pianta del 1300 pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${strade.length} strade · ${lotti.length} lotti · ${borghi.length} case nei borghi`);
for (const a of AVVISI) errori.push('mura del 1300: ' + a);

// dove si arriva a piedi dall'ingresso (main.js: 20, −46), cella per cella
const passabile = v => v !== EDIFICIO && v !== MONUMENTO && v !== C_FIUME && v < 100;
const raggiunta = new Uint8Array(griglia.n * griglia.n);
{
  const coda = new Int32Array(griglia.n * griglia.n);
  let testa = 0, fine = 0;
  const k0 = griglia.i(-46) * griglia.n + griglia.i(20);
  raggiunta[k0] = 1; coda[fine++] = k0;
  while (testa < fine) {
    const k = coda[testa++], i = k % griglia.n, j = (k / griglia.n) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= griglia.n || jj >= griglia.n) continue;
      const kk = jj * griglia.n + ii;
      if (!raggiunta[kk] && passabile(griglia.c[kk])) { raggiunta[kk] = 1; coda[fine++] = kk; }
    }
  }
}
const aPiedi = (x, z) => raggiunta[griglia.i(z) * griglia.n + griglia.i(x)] === 1;
function vicinoRaggiunto(x, z, r) {
  for (let d = 0; d <= r; d += 1) for (let a = 0; a < Math.PI * 2; a += Math.PI / 16)
    if (griglia.percorribile(x + Math.cos(a) * d, z + Math.sin(a) * d) && aPiedi(x + Math.cos(a) * d, z + Math.sin(a) * d)) return d;
  return null;
}

// i luoghi della città, come nel 1216
let luoghi = 0;
for (const l of LUOGHI) {
  if ((l.mondo || 'citta') !== 'citta') continue;
  luoghi++;
  if (vicinoRaggiunto(l.pos[0], l.pos[1], 40) === null) errori.push(`luogo «${l.nome}»: nel 1300 non si raggiunge a piedi entro 40 m da ${l.pos}`);
}
// le porte nuove e il guasto
for (const p of PORTE.filter(p => p.pos && p.stato !== 'dopo'))
  if (vicinoRaggiunto(p.pos[0], p.pos[1], 15) === null) errori.push(`porta «${p.nome}»: non si raggiunge a piedi entro 15 m`);
const guasto = MOD_STRADE.AGGIUNTE_1300.find(a => a.nome === 'Il guasto degli Uberti');
const cg = guasto.punti.reduce((a, p) => [a[0] + p[0] / guasto.punti.length, a[1] + p[1] / guasto.punti.length], [0, 0]);
if (griglia.get(cg[0], cg[1]) !== PIAZZA) errori.push('il guasto degli Uberti: al centro non c\'è lo spazio vuoto');
if (!aPiedi(cg[0], cg[1])) errori.push('il guasto degli Uberti: non si raggiunge a piedi');

// coerenza dei dati
const nomiOsm = new Set(STRADE.map(s => s.nome));
for (const n of Object.keys(MOD_STRADE.FUORI)) if (!nomiOsm.has(n)) errori.push(`strade del 1300: «${n}» ha un motivo ma non c'è nell'estratto`);
for (const n of Object.keys(MOD_STRADE.NEL_1300)) if (!nomiOsm.has(n)) errori.push(`strade del 1300: «${n}» (NEL_1300) non c'è nell'estratto`);
for (const n of Object.keys(MOD_STRADE.FUORI)) if (n in MOD_STRADE.DOPO) errori.push(`strade del 1300: «${n}» è sia prima sia dopo il 1300`);
const nomiImpronte = new Set(IMPRONTE.map(i => i.nome));
for (const n of Object.keys(MOD_STRADE.CHIESE)) if (!nomiImpronte.has(n)) errori.push(`chiese del 1300: «${n}» non ha un'impronta nell'estratto`);
if (LIMITE.length < 50) errori.push('il limite della cerchia nuova ha troppo pochi punti');
if (OLTRARNO_1300.length < 10) errori.push('la linea d\'Oltrarno del 1300 ha troppo pochi punti');

// i monumenti del 1300: ci sono tutti, e si arriva davanti a ciascuno
for (const nome of Object.keys(POSE_1300)) if (!monumenti1300.includes(nome)) errori.push(`monumento del 1300 «${nome}»: manca in public/monumenti/indice.json`);
for (const [nome, p] of Object.entries(POSE_1300)) if (p && vicinoRaggiunto(p.origine[0] - p.n[0] * 3, p.origine[1] - p.n[1] * 3, 12) === null) errori.push(`monumento del 1300 «${nome}»: davanti non ci si arriva a piedi`);

// le schede del 1300: ogni parte «nel 1300» è di un luogo che esiste, con il testo inglese e almeno un cronista
const ids = new Set(LUOGHI.map(l => l.id));
for (const [k, v] of Object.entries(TRECENTO)) {
  if (!ids.has(k)) errori.push(`scheda del 1300 «${k}»: non corrisponde a nessun luogo`);
  if (!v.en) errori.push(`scheda del 1300 «${k}»: manca l'inglese`);
  if (!v.racconta?.length || v.racconta.some(r => !r.chi || !r.dove || !r.parole || !r.en)) errori.push(`scheda del 1300 «${k}»: un cronista senza nome, rimando, parole o parafrasi inglese`);
  if (!v.fonti?.length) errori.push(`scheda del 1300 «${k}»: senza fonti`);
}
for (const l of LUOGHI_1300) {
  if (l.epoca !== '1300') errori.push(`luogo del 1300 «${l.id}»: senza «epoca»`);
  const en = LUOGHI_EN[l.id];
  if (!en || !en.nome || !en.testo || !en.luogo || !en.forma) errori.push(`luogo del 1300 «${l.id}»: manca l'inglese`);
}

// le torri mozzate
if (Math.abs(TETTO_TORRI - 50 * BRACCIO) > 1e-9 || TETTO_TORRI > 30) errori.push(`torri: il tetto è ${TETTO_TORRI} m invece di 50 braccia`);

if (errori.length) {
  console.error(errori.map(e => '✗ ' + e).join('\n'));
  process.exit(1);
}
const ipotesi = strade.filter(s => s.livello === 'ipotesi').length;
console.log(`✓ 1300: ${luoghi} luoghi della città raggiungibili (${LUOGHI_1300.length} nuovi), ${Object.keys(TRECENTO).length} schede «nel 1300», ${PORTE.filter(p => p.stato !== 'dopo').length} porte nuove raggiungibili, il guasto aperto, ${monumenti1300.length} monumenti del 1300, ${Object.keys(MOD_STRADE.FUORI).length} strade con il motivo e ${ipotesi} tratti di strada «ipotesi», torri a ${TETTO_TORRI.toFixed(1)} m`);
