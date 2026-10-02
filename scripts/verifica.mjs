/* =====================================================================
   VERIFICA DEI DATI DELLA CITTÀ — npm run verifica

   Costruisce la pianta del suolo come fa la città (strade, monumenti,
   case), senza disegnare niente, e controlla:
   - che ogni luogo con una scheda si possa raggiungere a piedi;
   - che ogni scena del copione con una vista punti a un luogo esistente,
     a una giornata esistente, e che il punto di vista sia percorribile;
   - che ogni nota citata da una scena abbia un tipo valido.
   Esce con codice 1 se qualcosa non va.
   ===================================================================== */

import { FIUME, STRADE } from '../src/dati/osm.js';
import { CORRIDOI, RAGGIO_CITTA, strade1216 } from '../src/dati/strade-1216.js';
import { LUOGHI } from '../src/dati/luoghi.js';
import { GIORNATE } from '../src/dati/giornate.js';
import { SCENE, TIPI_NOTA } from '../src/dati/scene.js';
import { COPIONE } from '../src/dati/copione.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { costruisciMonumenti } from '../src/mondo/monumenti.js';
import { lottizza } from '../src/mondo/edifici.js';

const t0 = Date.now();
const griglia = new Griglia();
griglia.poligono(FIUME, C_FIUME);
const strade = strade1216(STRADE);
for (const s of strade) {
  if (s.area) griglia.poligono(s.punti, PIAZZA, false);
  else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
}
costruisciMonumenti(new Cantiere(), griglia);
const lotti = lottizza(griglia, strade, { raggio: RAGGIO_CITTA, corridoi: CORRIDOI, riempimento: 15000 });
console.log(`pianta pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${strade.length} strade · ${lotti.length} lotti`);

const errori = [];

/** Il punto percorribile più vicino entro r metri, come fa la città quando ti porta a un luogo. */
function vicinoPercorribile(x, z, r = 40) {
  if (griglia.percorribile(x, z)) return 0;
  for (let d = 1; d <= r; d += 1) for (let a = 0; a < Math.PI * 2; a += Math.PI / 16)
    if (griglia.percorribile(x + Math.cos(a) * d, z + Math.sin(a) * d)) return d;
  return null;
}

for (const l of LUOGHI) {
  const d = vicinoPercorribile(l.pos[0], l.pos[1]);
  if (d === null) errori.push(`luogo «${l.nome}»: nessun punto percorribile entro 40 m da ${l.pos}`);
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
  if (s.vista && !s.vista.volo && !griglia.percorribile(s.vista.x, s.vista.z)) errori.push(`scena ${s.id}: la vista (${s.vista.x}, ${s.vista.z}) non è percorribile`);
}

if (errori.length) {
  console.error(errori.map(e => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${LUOGHI.length} luoghi raggiungibili, ${SCENE.length} scene coerenti`);
