/* =====================================================================
   Estrazione dei dati OpenStreetMap per la città.

   Legge l'estratto grezzo in dati-osm/ e scrive src/dati/osm.js con le
   coordinate già convertite in metri locali.

   Origine (0, 0): il capo nord del Ponte Vecchio, circa.
   Assi: x verso est, z verso sud, y in alto. 1 unità = 1 metro.
   La proiezione è equirettangolare locale: su 1 km l'errore è
   dell'ordine dei centimetri, ben sotto la precisione del modello.

   Il primo estratto è stato scaricato il 01/10/2026 dall'Overpass API
   con la query riportata in QUERY qui sotto (bbox 43.7655,11.2475 –
   43.7720,11.2590, più il letto dell'Arno su un riquadro più ampio).
   Dal 12/10/2026 strade, torri e chiese vengono da un estratto più grande,
   fino alle mura del 1172–75 (QUERY_CERCHIA); dal primo resta il fiume.

   Dati © OpenStreetMap contributors, licenza ODbL 1.0.
   Per il modello valgono come base di lavoro sulla città DI OGGI: quello
   che vale per il 1216 lo decidono i file in src/dati/, non questo.
   ===================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const QUERY = `[out:json][timeout:80];(
  way["highway"](43.7655,11.2475,43.7720,11.2590);
  way["building"](43.7655,11.2475,43.7720,11.2590);
  way["bridge"](43.7655,11.2475,43.7720,11.2590);
  way["water"="river"](43.7640,11.2440,43.7730,11.2620);
  way["amenity"="place_of_worship"](43.7655,11.2475,43.7720,11.2590);
);out geom;`;

// Il 12 ottobre 2026, per costruire la città fino alla cerchia del 1172–75:
// strade con nome, torri, chiese e resti di mura e porte su un riquadro che
// comprende tutto il perimetro e un tratto di campagna fuori. Scaricato dal
// server Overpass di maps.mail.ru (overpass-api.de era occupato), dati del
// 2026-10-12T16:44:51Z.
export const QUERY_CERCHIA = `[out:json][timeout:90];(
  way["highway"]["name"](43.7630,11.2435,43.7775,11.2640);
  way["building"]["name"~"^Torre "](43.7630,11.2435,43.7775,11.2640);
  way["building"~"^(church|basilica|chapel|cathedral)$"](43.7630,11.2435,43.7775,11.2640);
  way["amenity"="place_of_worship"](43.7630,11.2435,43.7775,11.2640);
  node["historic"~"city_gate|citywalls"](43.7630,11.2435,43.7775,11.2640);
  way["historic"~"city_gate|citywalls"](43.7630,11.2435,43.7775,11.2640);
);out geom tags;`;

const QUI = dirname(fileURLToPath(import.meta.url));
const GREZZO = join(QUI, '..', 'dati-osm', 'ponte-vecchio-2026-10-01.json');
// Il 9 ottobre 2026 un secondo estratto, solo per piazza del Duomo, che il
// primo lasciava fuori: le impronte del Battistero e della cattedrale di oggi.
// Query: way["building"] e way["amenity"="place_of_worship"] nel riquadro
// 43.7718,11.2525 – 43.7740,11.2575, «out geom tags». Dal 12 ottobre non serve più: le stesse impronte sono nell'estratto della cerchia. Il file resta in dati-osm come documento.
const GREZZO_CERCHIA = join(QUI, '..', 'dati-osm', 'cerchia-2026-10-12.json');
const DAL_DUOMO = { 166821303: 'battistero', 43768260: 'cattedrale' };
const USCITA = join(QUI, '..', 'src', 'dati', 'osm.js');

export const LAT0 = 43.76820, LON0 = 11.25335;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const KZ = 110574;
const xz = p => [ +((p.lon - LON0) * KX).toFixed(1), +(-(p.lat - LAT0) * KZ).toFixed(1) ];

const strade = [];
const impronte = [];              // torri e chiese con nome
let fiume = null;

// dal primo estratto, solo il fiume
for (const e of JSON.parse(readFileSync(GREZZO, 'utf8')).elements)
  if (e.type === 'way' && e.id === 307416178 && e.geometry) fiume = e.geometry.map(xz);

// dal secondo, tutto il resto: strade, torri, chiese, il Battistero e la cattedrale
for (const e of JSON.parse(readFileSync(GREZZO_CERCHIA, 'utf8')).elements) {
  if (e.type !== 'way' || !e.geometry) continue;
  const t = e.tags || {};
  const pts = e.geometry.map(xz);
  if (t.highway && t.name) {
    strade.push({ id: e.id, nome: t.name, tipo: t.highway, area: t.area === 'yes' || (pts.length > 3 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1] && /^Piazz/.test(t.name)), punti: pts });
    continue;
  }
  const nome = t.name || '';
  if (!nome) continue;
  // il Battistero (documentato: è l'edificio del 1216) e la cattedrale di oggi,
  // che non è del 1216 ma dà l'asse e la facciata sotto cui sta Santa Reparata
  if (DAL_DUOMO[e.id]) { impronte.push({ id: e.id, nome, tipo: DAL_DUOMO[e.id], wikipedia: t.wikipedia || null, punti: pts }); continue; }
  const torre = /^Torre /.test(nome);
  const chiesa = /^(church|basilica|chapel)$/.test(t.building) || t.amenity === 'place_of_worship';
  if (torre || chiesa) impronte.push({ id: e.id, nome, tipo: torre ? 'torre' : 'chiesa', wikipedia: t.wikipedia || null, punti: pts });
}

const out = `/* Generato da scripts/osm-estrai.mjs il ${new Date().toISOString().slice(0, 10)}. Non modificare a mano.
   Dati © OpenStreetMap contributors (ODbL 1.0): il fiume dall'estratto del 01/10/2026, il resto da quello del 12/10/2026.
   Metri locali: origine al capo nord del Ponte Vecchio, x verso est, z verso sud. */

export const ORIGINE = { lat: ${LAT0}, lon: ${LON0} };

/** Contorno del letto dell'Arno di oggi (way ${307416178}), dentro gli argini ottocenteschi. */
export const FIUME = ${JSON.stringify(fiume)};

/** Strade e piazze con nome fino alle mura e oltre. Quali valgono per il 1216 lo decide strade-1216.js. */
export const STRADE = ${JSON.stringify(strade)};

/** Torri e chiese di oggi con nome, il Battistero e la cattedrale: impronte reali, da usare come punti fermi. */
export const IMPRONTE = ${JSON.stringify(impronte)};
`;
writeFileSync(USCITA, out);
console.log(`strade ${strade.length}, impronte ${impronte.length}, fiume ${fiume ? fiume.length : 0} punti → ${USCITA}`);
