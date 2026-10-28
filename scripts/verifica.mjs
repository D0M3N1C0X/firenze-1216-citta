/* =====================================================================
   VERIFICA DEI DATI DELLA CITTÀ — npm run verifica

   Costruisce la pianta del suolo come fa la città (strade, monumenti,
   case), senza disegnare niente, e controlla:
   - che ogni luogo con una scheda si possa raggiungere a piedi dal punto
     d'ingresso della città, passando per le strade e le porte;
   - che ogni scena del copione con una vista punti a un luogo esistente,
     a una giornata esistente, e che il punto di vista sia percorribile;
   - che ogni nota citata da una scena abbia un tipo valido.
   Esce con codice 1 se qualcosa non va.
   ===================================================================== */

import { FIUME, STRADE } from '../src/dati/osm.js';
import { strade1216 } from '../src/dati/strade-1216.js';
import { AVVISI, TRACCIATO, dentroTracciato } from '../src/dati/cerchia.js';
import { LUOGHI } from '../src/dati/luoghi.js';
import { GIORNATE } from '../src/dati/giornate.js';
import { SCENE, TIPI_NOTA } from '../src/dati/scene.js';
import { COPIONE } from '../src/dati/copione.js';
import { TAPPE } from '../src/dati/visita.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { costruisciMonumenti } from '../src/mondo/monumenti.js';
import { soloIndice } from '../src/mondo/modelli.js';
import { costruisciCampi } from '../src/mondo/campi.js';
import { Griglia as G2 } from '../src/mondo/griglia.js';
import { readFileSync } from 'node:fs';
import { lottizza } from '../src/mondo/edifici.js';
import { costruisciMura, costruisciPalizzata } from '../src/mondo/mura.js';
import { costruisciBorghi } from '../src/mondo/fondale.js';
import { costruisciMestieri, grigliaDeiMestieri } from '../src/mondo/mestieri.js';
import { EDIFICIO, FIUME as C_FIUME2, MONUMENTO } from '../src/mondo/griglia.js';

// i monumenti modellati in Blender cambiano la pianta (Santa Reparata si
// percorre dentro): qui non si caricano le maglie, ma si segna che ci sono,
// così la griglia è la stessa del browser
soloIndice(JSON.parse(readFileSync(new URL('../public/monumenti/indice.json', import.meta.url), 'utf8')));

const t0 = Date.now();
const griglia = new Griglia(-1100, 1100);
griglia.poligono(FIUME, C_FIUME);
const strade = strade1216(STRADE);
for (const s of strade) {
  if (s.area) griglia.poligono(s.punti, PIAZZA, false);
  else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
}
const cant = new Cantiere();
costruisciMonumenti(cant, griglia);
costruisciMura(cant, griglia);
const RIQUADRO = [Math.min(...TRACCIATO.map(p => p[0])), Math.min(...TRACCIATO.map(p => p[1])), Math.max(...TRACCIATO.map(p => p[0])), Math.max(...TRACCIATO.map(p => p[1]))];
const lotti = lottizza(griglia, strade.filter(s => !s.fuori), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: 28000 });
const borghi = costruisciBorghi(cant, griglia, strade);
// i banchi dei giorni di lavoro occupano la strada: la verifica li mette, così nessun punto di vista finisce sotto un banco
const mestieri = costruisciMestieri(cant, griglia, lotti, strade);
grigliaDeiMestieri(griglia, false);
costruisciPalizzata(cant, griglia);
console.log(`pianta pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${strade.length} strade · ${lotti.length} lotti · ${borghi.length} case nei borghi`);
for (const a of AVVISI) console.warn('! ' + a);

// dove si arriva a piedi dal punto d'ingresso della città (main.js: 20, −46):
// una visita della griglia, cella per cella, come cammina chi gioca
const passabile = v => v !== EDIFICIO && v !== MONUMENTO && v !== C_FIUME2 && v < 100;
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

// Campi, il luogo a parte (?luogo=campi): la sua pianta, come la costruisce il browser
const grigliaCampi = new G2();
costruisciCampi(null, grigliaCampi);
const pianta = x => (x?.mondo || 'citta') === 'campi' ? grigliaCampi : griglia;

const errori = [];

/** Il punto percorribile più vicino entro r metri, come fa la città quando ti porta a un luogo. */
function vicinoPercorribile(g, x, z, r = 40) {
  if (g.percorribile(x, z)) return 0;
  for (let d = 1; d <= r; d += 1) for (let a = 0; a < Math.PI * 2; a += Math.PI / 16)
    if (g.percorribile(x + Math.cos(a) * d, z + Math.sin(a) * d)) return d;
  return null;
}

/** Come vicinoPercorribile, ma il punto deve anche essere collegato all'ingresso. */
function vicinoRaggiunto(x, z, r = 40) {
  for (let d = 0; d <= r; d += 1) for (let a = 0; a < Math.PI * 2; a += Math.PI / 16)
    if (griglia.percorribile(x + Math.cos(a) * d, z + Math.sin(a) * d) && aPiedi(x + Math.cos(a) * d, z + Math.sin(a) * d)) return d;
  return null;
}

for (const l of LUOGHI) {
  const campi = (l.mondo || 'citta') === 'campi';
  const d = campi ? vicinoPercorribile(pianta(l), l.pos[0], l.pos[1]) : vicinoRaggiunto(l.pos[0], l.pos[1]);
  if (d === null) errori.push(`luogo «${l.nome}»: nessun punto ${campi ? 'percorribile' : 'raggiungibile a piedi dall\'ingresso'} entro 40 m da ${l.pos}`);
}

const ids = new Set(LUOGHI.map(l => l.id));
const idScene = new Set();
for (const s of SCENE) {
  if (idScene.has(s.id)) errori.push(`scena ${s.id}: codice ripetuto`);
  idScene.add(s.id);
  const c = COPIONE[s.id];
  if (!c) { errori.push(`scena ${s.id}: non c'è nel copione (rigenera con node scripts/copione-estrai.mjs)`); continue; }
  if (s.giornata && !GIORNATE[s.giornata]) errori.push(`scena ${s.id}: giornata «${s.giornata}» inesistente`);
  if (s.luogo && !ids.has(s.luogo)) errori.push(`scena ${s.id}: luogo «${s.luogo}» inesistente`);
  if (!s.fuori && !s.luogo) errori.push(`scena ${s.id}: né un luogo né il motivo per cui è fuori dalla città`);
  if (s.vista && !s.giornata) errori.push(`scena ${s.id}: una vista senza giornata`);
  for (const n of c.note) if (!TIPI_NOTA[n.tipo]) errori.push(`scena ${s.id}, nota ${n.id}: tipo «${n.tipo}» sconosciuto`);
  if (s.vista && !s.vista.volo && !pianta(s).percorribile(s.vista.x, s.vista.z)) errori.push(`scena ${s.id}: la vista (${s.vista.x}, ${s.vista.z}) non è percorribile`);
  else if (s.vista && !s.vista.volo && (s.mondo || 'citta') === 'citta' && !aPiedi(s.vista.x, s.vista.z)) errori.push(`scena ${s.id}: la vista (${s.vista.x}, ${s.vista.z}) non si raggiunge a piedi dall'ingresso`);
  if (s.luogo && ids.has(s.luogo) && (LUOGHI.find(l => l.id === s.luogo).mondo || 'citta') !== (s.mondo || 'citta')) errori.push(`scena ${s.id}: il luogo è in un altro mondo`);
}

// la visita guidata: ogni tappa in un luogo che esiste, da un punto dove si può stare
TAPPE.forEach((t, k) => {
  if (t.luogo && !ids.has(t.luogo)) errori.push(`visita, tappa ${k + 1}: luogo «${t.luogo}» inesistente`);
  if (!t.vista.volo && !griglia.percorribile(t.vista.x, t.vista.z)) errori.push(`visita, tappa ${k + 1}: la vista (${t.vista.x}, ${t.vista.z}) non è percorribile`);
  else if (!t.vista.volo && !aPiedi(t.vista.x, t.vista.z)) errori.push(`visita, tappa ${k + 1}: la vista non si raggiunge a piedi dall'ingresso`);
});

if (errori.length) {
  console.error(errori.map(e => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${LUOGHI.length} luoghi raggiungibili, ${SCENE.length} scene coerenti, ${TAPPE.length} tappe della visita`);
