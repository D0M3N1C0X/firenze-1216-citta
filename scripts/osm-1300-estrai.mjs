/* =====================================================================
   Estrazione dei dati OpenStreetMap per la città del 1300.

   Legge l'estratto grezzo fino alla cerchia nuova (1284–1333) e scrive
   src/dati/osm-1300.js, con le coordinate in metri locali come
   src/dati/osm.js: stessa origine, stessa proiezione (scripts/osm-estrai.mjs).
   È un file a parte perché si carica solo quando serve il 1300: la città
   del 1216 non diventa più pesante.

   L'estratto è stato scaricato il 06/11/2026 dal server Overpass di
   maps.mail.ru (overpass-api.de chiudeva la connessione), dati del
   2026-11-06T13:27:50Z, con la query QUERY qui sotto. Il riquadro
   comprende tutta la cerchia nuova, da Porta Romana a Porta San Gallo e
   da Porta al Prato a Porta alla Croce, con un margine di campagna.

   Il letto dell'Arno viene da un secondo estratto dello stesso giorno
   (QUERY_ARNO, dati del 2026-11-06T13:29:57Z): lo stesso contorno di oggi
   (way 307416178) che usa la città del 1216, ma intero, da Varlungo alle
   Cascine, perché la cerchia nuova arriva più lontano lungo il fiume.

   Dati © OpenStreetMap contributors, licenza ODbL 1.0.
   Valgono come base di lavoro sulla città DI OGGI: quello che vale per il
   1300 lo decidono strade-1300.js e cerchia-1300.js.
   ===================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const QUERY = `[out:json][timeout:180];(
  way["highway"]["name"](43.7575,11.2340,43.7885,11.2740);
  way["building"]["name"~"^Torre "](43.7575,11.2340,43.7885,11.2740);
  way["building"~"^(church|basilica|chapel|cathedral)$"](43.7575,11.2340,43.7885,11.2740);
  way["amenity"="place_of_worship"](43.7575,11.2340,43.7885,11.2740);
  node["historic"~"city_gate|citywalls"](43.7575,11.2340,43.7885,11.2740);
  way["historic"~"city_gate|citywalls"](43.7575,11.2340,43.7885,11.2740);
  way["barrier"="city_wall"](43.7575,11.2340,43.7885,11.2740);
);out geom tags;`;

export const QUERY_ARNO = `[out:json][timeout:120];(
  way["water"="river"](43.7575,11.2340,43.7885,11.2740);
  way["waterway"="river"]["name"="Arno"](43.7575,11.2340,43.7885,11.2740);
);out geom tags;`;

const QUI = dirname(fileURLToPath(import.meta.url));
const GREZZO = join(QUI, '..', 'dati-osm', 'cerchia-nuova-2026-11-06.json');
const GREZZO_ARNO = join(QUI, '..', 'dati-osm', 'arno-1300-2026-11-06.json');
const USCITA = join(QUI, '..', 'src', 'dati', 'osm-1300.js');

// gli stessi di scripts/osm-estrai.mjs: le due città devono combaciare al centimetro
const LAT0 = 43.76820, LON0 = 11.25335;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const KZ = 110574;
const xz = p => [+((p.lon - LON0) * KX).toFixed(1), +(-(p.lat - LAT0) * KZ).toFixed(1)];

const grezzo = JSON.parse(readFileSync(GREZZO, 'utf8'));
const strade = [], impronte = [], porte = [], mura = [];
let fiume = null;
for (const e of JSON.parse(readFileSync(GREZZO_ARNO, 'utf8')).elements)
  if (e.type === 'way' && e.id === 307416178 && e.geometry) fiume = e.geometry.map(xz);

for (const e of grezzo.elements) {
  const t = e.tags || {};
  if (e.type === 'node') {
    if (t.historic === 'city_gate') porte.push({ id: e.id, nome: t.name || null, punto: xz(e) });
    continue;
  }
  if (e.type !== 'way' || !e.geometry) continue;
  const pts = e.geometry.map(xz);
  if (t.historic === 'city_gate') {
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    porte.push({ id: e.id, nome: t.name || null, punto: c.map(v => +v.toFixed(1)), inizio: t.start_date || null });
    continue;
  }
  if (t.historic === 'citywalls' || t.barrier === 'city_wall') { mura.push({ id: e.id, nome: t.name || null, punti: pts }); continue; }
  if (t.highway && t.name) {
    const chiusa = pts.length > 3 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1];
    strade.push({ id: e.id, nome: t.name, tipo: t.highway, area: t.area === 'yes' || (chiusa && /^Piazz/.test(t.name)), punti: pts });
    continue;
  }
  const nome = t.name || '';
  if (!nome) continue;
  const torre = /^Torre /.test(nome);
  const chiesa = /^(church|basilica|chapel|cathedral)$/.test(t.building) || t.amenity === 'place_of_worship';
  if (torre || chiesa) impronte.push({ id: e.id, nome, tipo: torre ? 'torre' : 'chiesa', wikipedia: t.wikipedia || null, punti: pts });
}

const out = `/* Generato da scripts/osm-1300-estrai.mjs il ${new Date().toISOString().slice(0, 10)}. Non modificare a mano.
   Dati © OpenStreetMap contributors (ODbL 1.0), estratto del ${grezzo.osm3s?.timestamp_osm_base?.slice(0, 10) || '06/11/2026'}.
   Metri locali come dati/osm.js: origine al capo nord del Ponte Vecchio, x verso est, z verso sud. */

/** Contorno del letto dell'Arno di oggi (way 307416178), intero: dentro gli argini ottocenteschi. */
export const FIUME = ${JSON.stringify(fiume)};

/** Strade e piazze con nome fino alla cerchia nuova. Quali valgono per il 1300 lo decide strade-1300.js. */
export const STRADE = ${JSON.stringify(strade)};

/** Torri e chiese di oggi con nome: impronte reali. */
export const IMPRONTE = ${JSON.stringify(impronte)};

/** Porte della cerchia nuova come sono segnate oggi (centro dell'impronta, o il nodo). */
export const PORTE = ${JSON.stringify(porte)};

/** Tratti di mura che esistono ancora (soprattutto in Oltrarno). */
export const MURA = ${JSON.stringify(mura)};
`;
writeFileSync(USCITA, out);
console.log(`fiume ${fiume ? fiume.length : 0} punti, strade ${strade.length}, impronte ${impronte.length}, porte ${porte.length}, mura ${mura.length} → ${USCITA} (${(out.length / 1024).toFixed(0)} kB)`);
