/* =====================================================================
   Estrazione degli edifici di oggi per la fase «oggi» della città.

   Legge i riquadri grezzi delle unità volumetriche della Regione Toscana
   e scrive src/dati/oggi.js con le impronte già convertite in metri locali
   e l'altezza misurata di ciascuna.

   Un'unità volumetrica è «la porzione elementare di edificato avente
   altezza omogenea, con base a terra»: un palazzo con un'ala più bassa ne
   ha due, la cattedrale una ventina. Rilievo del volo dell'8 marzo 2011,
   scala 1:2000, precisione dichiarata 0,5 m.

   Fonte: Regione Toscana, «Edificato multiscala», strato
   rt_edif.unitavolumetriche del servizio Geoscopio (WFS EDIFICATO),
   licenza CC BY. Scaricato il 04/11/2026 in 16 riquadri, perché il
   servizio dà al più 3000 oggetti per richiesta (RIQUADRO e RICHIESTA qui
   sotto). I 29 MB grezzi non stanno nel repo: si riscaricano con la
   richiesta, e il programma toglie i doppioni ai bordi dei riquadri.

   Uso:  node scripts/oggi-estrai.mjs <cartella con i file uv-*.gml>
   ===================================================================== */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const QUI = dirname(fileURLToPath(import.meta.url));
const USCITA = join(QUI, '..', 'src', 'dati', 'oggi.js');

/** Il riquadro scaricato (lon, lat): la cerchia del 1172–75 con un margine, l'Oltrarno fino alla palizzata. */
export const RIQUADRO = [11.24439, 43.76333, 11.2638, 43.77631];
/** Una richiesta per riquadro: i quattro numeri del BBOX sono lat e lon del riquadro piccolo (4 × 4). */
export const RICHIESTA = 'https://www502.regione.toscana.it/ows2/com.rt.wms.RTmap/wms?map=owsedificato&SERVICE=WFS&VERSION=1.1.0'
  + '&REQUEST=GetFeature&TYPENAME=rt_edif.unitavolumetriche&SRSNAME=urn:ogc:def:crs:EPSG::4326'
  + '&BBOX=<lat0>,<lon0>,<lat1>,<lon1>,urn:ogc:def:crs:EPSG::4326';

// la stessa proiezione di osm-estrai.mjs: le due fonti devono combaciare al decimetro
const LAT0 = 43.76820, LON0 = 11.25335;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const KZ = 110574;
const xz = (lat, lon) => [+((lon - LON0) * KX).toFixed(1), +(-(lat - LAT0) * KZ).toFixed(1)];

const cartella = process.argv[2];
if (!cartella) { console.error('uso: node scripts/oggi-estrai.mjs <cartella con i file uv-*.gml>'); process.exit(1); }
const file = readdirSync(cartella).filter(f => /^uv-\d\d\.gml$/.test(f)).sort();
if (file.length !== 16) { console.error(`servono i 16 riquadri uv-00.gml … uv-33.gml, ce ne sono ${file.length}`); process.exit(1); }

const campo = (s, k) => (s.match(new RegExp(`<ms:${k}>([^<]*)</ms:${k}>`)) || [])[1] ?? '';
const anelli = (s, quale) => [...s.matchAll(new RegExp(`<gml:${quale}>[\\s\\S]*?<gml:posList[^>]*>([^<]*)</gml:posList>`, 'g'))].map(m => {
  const n = m[1].trim().split(/\s+/).map(Number);
  const p = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push(xz(n[i], n[i + 1]));
  return p;
});

/** Toglie il punto di chiusura, i doppioni e i punti allineati (scarto sotto i 15 cm). */
function semplifica(p) {
  let q = p.slice();
  if (q.length > 1 && q[0][0] === q.at(-1)[0] && q[0][1] === q.at(-1)[1]) q.pop();
  q = q.filter((v, i) => { const w = q[(i + 1) % q.length]; return v[0] !== w[0] || v[1] !== w[1]; });
  for (let cambiato = true; cambiato && q.length > 3;) {
    cambiato = false;
    for (let i = 0; i < q.length && q.length > 3; i++) {
      const a = q[(i + q.length - 1) % q.length], b = q[i], c = q[(i + 1) % q.length];
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const d = l ? Math.abs((c[0] - a[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (c[1] - a[1])) / l : 0;
      if (d < 0.15) { q.splice(i, 1); cambiato = true; i--; }
    }
  }
  return q;
}
const area = p => p.reduce((s, v, i) => { const w = p[(i + 1) % p.length]; return s + v[0] * w[1] - w[0] * v[1]; }, 0) / 2;
// tutti gli anelli esterni nello stesso verso (area positiva in x, z), i buchi nel verso opposto
const verso = (p, positivo) => (area(p) > 0) === positivo ? p : p.slice().reverse();

const TIPO = { 'Chiesa': 'chiesa', 'Edificio Monumentale': 'monumento', 'Campanile': 'campanile', 'Anfiteatro': 'monumento' };
const MINORE = { 'Baracca, Manufatto Precario': 'baracca', 'Chiosco': 'chiosco', 'Garage, Box Auto': 'baracca', 'Loggiato': 'loggiato' };
const PORTICO = { 'Soffitto Di Portico': 'portico', 'Soffitto Di Loggia': 'loggia', 'Soffitto Di Sottopassaggio': 'sottopassaggio' };

// volumi del rilievo che oggi non ci sono, con il motivo
const ESCLUSI = {
  // 93 m² alti 75,9 m segnati «residenziale» sul lungarno, accanto a piazza dei Giudici:
  // più alto di Palazzo Vecchio senza la torre. Quasi certamente una gru del cantiere dei
  // Nuovi Uffizi nel volo del 2011 [da verificare: ortofoto del marzo 2011]
  792458: 'una gru del 2011, non un edificio'
};

const visti = new Set(), edifici = new Map(), uv = [];
let doppioni = 0, fuori = 0, scartati = 0;
const [X0, Z1] = xz(RIQUADRO[1], RIQUADRO[0]), [X1, Z0] = xz(RIQUADRO[3], RIQUADRO[2]);
for (const f of file) {
  const testo = readFileSync(join(cartella, f), 'utf8');
  for (const m of testo.matchAll(/<ms:rt_edif\.unitavolumetriche [\s\S]*?<\/ms:rt_edif\.unitavolumetriche>/g)) {
    const s = m[0], pk = campo(s, 'uv_pk');
    if (visti.has(pk)) { doppioni++; continue; }
    visti.add(pk);
    if (campo(s, 'edifc_dsot') === 'Sotterraneo' || ESCLUSI[pk]) { scartati++; continue; }
    // un'unità può essere fatta di più poligoni: ognuno diventa un volume a sé, con la stessa altezza
    const esterni = anelli(s, 'exterior').map(semplifica).filter(p => p.length >= 3 && Math.abs(area(p)) >= 1);
    const interni = anelli(s, 'interior').map(semplifica).filter(p => p.length >= 3 && Math.abs(area(p)) >= 1);
    if (!esterni.length) { scartati++; continue; }
    const cx = esterni[0].reduce((a, v) => a + v[0], 0) / esterni[0].length, cz = esterni[0].reduce((a, v) => a + v[1], 0) / esterni[0].length;
    if (cx < X0 || cx > X1 || cz < Z0 || cz > Z1) { fuori++; continue; }
    const id = campo(s, 'edifc_id') || `uv${pk}`;
    if (!edifici.has(id)) edifici.set(id, edifici.size);
    const tipo = MINORE[campo(s, 'edi_min_dty')] || TIPO[campo(s, 'edifc_dty')];
    const portico = PORTICO[campo(s, 'uv_dpor')];
    for (const p of esterni) {
      const o = { e: edifici.get(id), h: +(+campo(s, 'uv_av')).toFixed(1), q: +(+campo(s, 'uv_qs')).toFixed(1), p: verso(p, true) };
      if (tipo) o.t = tipo;
      if (portico) o.sotto = portico;
      // i buchi (cortili chiusi) vanno al poligono che li contiene; quasi sempre ce n'è uno solo
      const buchi = interni.filter(b => esterni.length === 1 || dentro(b[0], p)).map(b => verso(b, false));
      if (buchi.length) o.b = buchi;
      uv.push(o);
    }
  }
}
function dentro([x, z], p) {
  let d = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d;
  return d;
}

// i portici: il volume comincia dal soffitto. Il suolo sotto è quello delle unità «al suolo» più vicine.
// In più di metà dei portici la quota è quella del pavimento, non del soffitto: sotto i 3,6 m si mette
// l'altezza di un portico qualsiasi [da verificare]
for (const o of uv.filter(o => o.sotto)) {
  const [cx, cz] = o.p[0];
  const vicini = uv.filter(v => !v.sotto && Math.hypot(v.p[0][0] - cx, v.p[0][1] - cz) < 40).map(v => v.q).sort((a, b) => a - b);
  const suolo = vicini.length ? vicini[Math.floor(vicini.length / 2)] : o.q;
  o.soffitto = +Math.max(3.6, o.q - suolo).toFixed(1);
}

const conta = k => uv.filter(o => o.t === k).length;
const out = `/* Generato da scripts/oggi-estrai.mjs il ${new Date().toISOString().slice(0, 10)}. Non modificare a mano.
   Dati: Regione Toscana, «Edificato multiscala», unità volumetriche (volo dell'8 marzo 2011, scala 1:2000), licenza CC BY.
   Metri locali: origine al capo nord del Ponte Vecchio, x verso est, z verso sud. */

/**
 * Gli edifici di oggi, un volume per unità volumetrica.
 *   e  l'edificio a cui appartiene (le unità di uno stesso edificio hanno lo stesso numero)
 *   h  altezza del volume in metri, misurata
 *   q  quota del piede del volume sul livello del mare (per i portici è il soffitto)
 *   p  impronta [x, z], in senso antiorario visto dall'alto; b  i cortili chiusi, se ci sono
 *   t  chiesa, monumento, campanile, baracca, chiosco, loggiato (assente: un edificio qualsiasi)
 *   sotto, soffitto  portico, loggia o sottopassaggio: il volume comincia a «soffitto» metri da terra
 */
export const EDIFICI_OGGI = ${JSON.stringify(uv)};

/** Il riquadro scaricato in metri locali [x0, z0, x1, z1]: fuori non ci sono dati. */
export const RIQUADRO_OGGI = ${JSON.stringify([X0, Z0, X1, Z1])};
`;
writeFileSync(USCITA, out);
console.log(`${uv.length} volumi di ${edifici.size} edifici (doppioni ai bordi ${doppioni}, fuori dal riquadro ${fuori}, scartati ${scartati}) · `
  + `chiese ${conta('chiesa')}, monumenti ${conta('monumento')}, campanili ${conta('campanile')}, portici ${uv.filter(o => o.sotto).length} → ${USCITA} (${(out.length / 1e6).toFixed(2)} MB)`);
