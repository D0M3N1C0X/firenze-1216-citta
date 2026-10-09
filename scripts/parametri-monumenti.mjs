/* =====================================================================
   PARAMETRI DEI MONUMENTI — npm run parametri

   I monumenti modellati in Blender (strumenti/monumenti/) devono
   combaciare con la città generata: il ponte con il letto dell'Arno e con
   la quota dell'impalcato su cui si cammina, la torre degli Amidei con la
   sua impronta di OpenStreetMap, il pilastro di Marte con il suo posto.
   Questo script costruisce la pianta come fa la città e scrive le misure
   in strumenti/monumenti/parametri.json, che gli script di Blender leggono.
   Va rilanciato se cambiano il fiume, le strade o le impronte.
   ===================================================================== */

import { writeFileSync } from 'node:fs';
import { FIUME, IMPRONTE, STRADE } from '../src/dati/osm.js';
import { strade1216 } from '../src/dati/strade-1216.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { BATTISTERO, LARGH_PONTE, MARTE, PONTE_ASSE, SANTA_REPARATA, SMSP, costruisciMonumenti, quotaPonte, rettangoloMinimo } from '../src/mondo/monumenti.js';
import { LIVELLO_ACQUA, quota } from '../src/mondo/terreno.js';

const griglia = new Griglia();
griglia.poligono(FIUME, C_FIUME);
const strade = strade1216(STRADE);
for (const s of strade) {
  if (s.area) griglia.poligono(s.punti, PIAZZA, false);
  else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
}
const { s1, s2 } = costruisciMonumenti(new Cantiere(), griglia);
const r = v => Math.round(v * 1000) / 1000;

// il ponte: profilo dell'impalcato campionato ogni metro
const P = PONTE_ASSE;
const profilo = [];
for (let s = 0; s <= P.L + 1e-6; s += 1) profilo.push([r(s), r(quotaPonte(s))]);

// la torre degli Amidei: rettangolo minimo dell'impronta e lato sulla strada
const imp = IMPRONTE.find(i => i.nome === 'Torre degli Amidei');
const O = rettangoloMinimo(imp.punti);
const lati = [
  { nome: '+u', nx: O.ux, nz: O.uz, d: O.a, largo: 2 * O.b },
  { nome: '-u', nx: -O.ux, nz: -O.uz, d: O.a, largo: 2 * O.b },
  { nome: '+v', nx: -O.uz, nz: O.ux, d: O.b, largo: 2 * O.a },
  { nome: '-v', nx: O.uz, nz: -O.ux, d: O.b, largo: 2 * O.a }
].map(l => {
  // quante celle di strada ci sono davanti al lato, tra 1 e 5 m
  let n = 0;
  for (let k = 1; k <= 5; k++) for (let t = -0.4; t <= 0.4; t += 0.2) {
    const tx = -l.nz, tz = l.nx;
    const v = griglia.get(O.cx + l.nx * (l.d + k) + tx * t * l.largo, O.cz + l.nz * (l.d + k) + tz * t * l.largo);
    if (v === STRADA || v === PIAZZA) n++;
  }
  return { ...l, strada: n };
}).sort((a, b) => b.strada - a.strada);

// Santa Maria sopra Porta: le misure del rettangolo, come le prende chiesa()
const C = rettangoloMinimo(SMSP.impronta);

const out = {
  nota: 'generato da scripts/parametri-monumenti.mjs: non modificare a mano',
  livello_acqua: LIVELLO_ACQUA,
  ponte: { A: P.A, B: P.B, L: r(P.L), dx: r(P.dx), dz: r(P.dz), larghezza: LARGH_PONTE, s1: r(s1), s2: r(s2), arcate: 5, pila: 3.4, profilo },
  marte: { x: r(MARTE[0]), z: r(MARTE[1]), y: r(quota(...MARTE)), guarda: r(Math.atan2(P.dx, P.dz)) },
  amidei: {
    cx: r(O.cx), cz: r(O.cz), y: r(quota(O.cx, O.cz)),
    // la facciata: il lato con più strada davanti; W lungo la facciata, D in profondità
    fronte: { nx: r(lati[0].nx), nz: r(lati[0].nz) }, W: r(lati[0].largo), D: r(2 * lati[0].d),
    lati: lati.map(l => `${l.nome}: ${l.strada}`)
  },
  chiesa: { W: r(2 * C.b), L: r(2 * C.a) },
  battistero: { apotema: r(BATTISTERO.apotema), scarsella: { prof: r(BATTISTERO.scarsella.prof), larg: r(BATTISTERO.scarsella.larg) } },
  santa_reparata: Object.fromEntries(Object.entries(SANTA_REPARATA).filter(([k]) => !['facciata', 'asse'].includes(k)))
};
writeFileSync(new URL('../strumenti/monumenti/parametri.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('ponte', out.ponte.L, 'm, acqua da', out.ponte.s1, 'a', out.ponte.s2, '· Amidei', out.amidei.W, '×', out.amidei.D, 'm, lati', out.amidei.lati.join(' '), '· Marte', out.marte.x, out.marte.z, '· chiesa', out.chiesa.W, '×', out.chiesa.L,
  '· Battistero', JSON.stringify(out.battistero), BATTISTERO.x.toFixed(2), BATTISTERO.z.toFixed(2),
  '· Santa Reparata facciata x', SANTA_REPARATA.facciata.toFixed(2), 'asse z', SANTA_REPARATA.asse.toFixed(2));
