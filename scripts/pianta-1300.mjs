/* =====================================================================
   Pianta di controllo della città del 1300: strade, mura e porte.

   Disegna in .catture/pianta-1300.svg (e .png, se c'è Playwright) le
   strade del 1216 e quelle in più del 1300, la cerchia vecchia, la linea
   delle mura nuove, la linea d'Oltrarno del 1300 e le porte, per
   controllare a occhio i dati prima di costruire le case.

   Uso: node scripts/pianta-1300.mjs
   ===================================================================== */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STRADE as STRADE_OGGI, FIUME } from '../src/dati/osm-1300.js';
import { STRADE as STRADE_1216_OSM } from '../src/dati/osm.js';
import { strade1216 } from '../src/dati/strade-1216.js';
import { strade1300 } from '../src/dati/strade-1300.js';
import { MURO, PALIZZATA, PORTE as PORTE_VECCHIE } from '../src/dati/cerchia.js';
import { LINEA_NUOVA, CONFINE_OLTRARNO, OLTRARNO_1300, PORTE, LIMITE } from '../src/dati/cerchia-1300.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const CARTELLA = join(QUI, '..', '.catture');
mkdirSync(CARTELLA, { recursive: true });

// riquadro in metri locali e scala
const X0 = -1350, X1 = 1780, Z0 = -1950, Z1 = 950, S = 0.62;
const W = Math.round((X1 - X0) * S), H = Math.round((Z1 - Z0) * S) + 120;
const px = ([x, z]) => `${((x - X0) * S).toFixed(1)},${((z - Z0) * S).toFixed(1)}`;
const linea = (pts, stile) => `<polyline points="${pts.map(px).join(' ')}" ${stile}/>`;
const poli = (pts, stile) => `<polygon points="${pts.map(px).join(' ')}" ${stile}/>`;

const s1216 = strade1216(STRADE_1216_OSM).filter(s => !s.area && !s.porta);
const s1300 = strade1300(STRADE_OGGI).filter(s => !s.area && !s.porta);
const chiave = s => s.nome + ':' + s.punti[0].join(',');
const nel1216 = new Set(s1216.map(s => s.nome));

const parti = [];
parti.push(`<rect width="${W}" height="${H}" fill="#f6f1e6"/>`);
parti.push(poli(LIMITE, 'fill="#ebe3cf" stroke="none"'));
parti.push(poli(FIUME, 'fill="#9cc3d9" stroke="#6f9fbc" stroke-width="1"'));
// tutte le strade di oggi nel riquadro, chiarissime, per riferimento
for (const s of STRADE_OGGI) if (!s.area) parti.push(linea(s.punti, 'fill="none" stroke="#d8cfbb" stroke-width="1"'));
// le strade del 1300: in grigio quelle che c'erano già nel 1216, in rosso quelle nuove
for (const s of s1300) {
  const nuova = s.fuoriVecchia || !nel1216.has(s.nome);
  parti.push(linea(s.punti, `fill="none" stroke="${nuova ? '#b03a2e' : '#555'}" stroke-width="${nuova ? 2.2 : 1.6}" stroke-linecap="round"`));
}
// mura
parti.push(linea(MURO, 'fill="none" stroke="#6b4f2a" stroke-width="4"'));
parti.push(linea(PALIZZATA, 'fill="none" stroke="#6b4f2a" stroke-width="2.5" stroke-dasharray="6 4"'));
parti.push(linea(OLTRARNO_1300, 'fill="none" stroke="#d07a12" stroke-width="4"'));
parti.push(linea(LINEA_NUOVA, 'fill="none" stroke="#222" stroke-width="2.5" stroke-dasharray="14 7"'));
parti.push(linea(CONFINE_OLTRARNO, 'fill="none" stroke="#888" stroke-width="2" stroke-dasharray="3 6"'));
// porte
const colore = { cantiere: '#222', finita: '#d07a12', dopo: '#aaa' };
for (const p of PORTE) if (p.pos) {
  const [cx, cz] = px(p.pos).split(',');
  parti.push(`<circle cx="${cx}" cy="${cz}" r="8" fill="${colore[p.stato]}" stroke="#fff" stroke-width="2"/>`);
  parti.push(`<text x="${+cx + 11}" y="${+cz + 4}" font-size="13" font-family="sans-serif" fill="#222" stroke="#f6f1e6" stroke-width="3" paint-order="stroke">${p.nome}${p.stato === 'dopo' ? ' (dopo il 1300)' : ''}</text>`);
}
for (const p of PORTE_VECCHIE) if (p.pos) {
  const [cx, cz] = px(p.pos).split(',');
  parti.push(`<rect x="${+cx - 3.5}" y="${+cz - 3.5}" width="7" height="7" fill="#6b4f2a"/>`);
}
// alcuni nomi per orientarsi
const NOMI = [['Ponte Vecchio', [0, 30]], ['Santa Trinita', [-190, -170]], ['Santa Croce', [690, -40]], ['Santa Maria Novella', [-420, -700]], ['San Lorenzo', [80, -800]], ['Santissima Annunziata', [500, -960]], ['Santo Spirito', [-470, 60]], ['il Carmine', [-760, -60]]];
for (const [n, p] of NOMI) {
  const [x, z] = px(p).split(',');
  parti.push(`<text x="${x}" y="${z}" font-size="14" font-style="italic" font-family="serif" fill="#3b3b3b" stroke="#f6f1e6" stroke-width="3" paint-order="stroke">${n}</text>`);
}
// legenda
const L = [
  ['#555', 'strade che c\'erano già nel 1216', ''], ['#b03a2e', 'strade in più nel 1300', ''],
  ['#6b4f2a', 'cerchia del 1172–75 (nel 1300 c\'è ancora)', ''], ['#d07a12', 'Oltrarno: la linea del 1300 (dopo il 1260 e fine Duecento)', ''],
  ['#222', 'cerchia nuova sulla riva destra: nel 1300 un cantiere', '14 7'], ['#888', 'Oltrarno: le mura nuove, del 1320–33, qui solo confine', '3 6']
];
L.forEach(([c, t, d], i) => {
  const y = H - 108 + i * 17;
  parti.push(`<line x1="16" y1="${y}" x2="56" y2="${y}" stroke="${c}" stroke-width="4" ${d ? `stroke-dasharray="${d}"` : ''}/>`);
  parti.push(`<text x="64" y="${y + 4}" font-size="13" font-family="sans-serif" fill="#222">${t}</text>`);
});
parti.push(`<text x="16" y="24" font-size="18" font-weight="bold" font-family="sans-serif" fill="#222">Firenze, 1° maggio 1300 — pianta di controllo di strade, mura e porte</text>`);
parti.push(`<text x="16" y="44" font-size="12" font-family="sans-serif" fill="#555">Dati © OpenStreetMap contributors (ODbL), estratto del 6/11/2026. Strade e mura come le decidono src/dati/strade-1300.js e cerchia-1300.js. Nord in alto.</text>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parti.join('\n')}</svg>`;
const SVG = join(CARTELLA, 'pianta-1300.svg');
writeFileSync(SVG, svg);
console.log(`${SVG}: ${s1300.length} tratti di strada (${s1216.length} nel 1216)`);

try {
  // Playwright può essere installato globalmente, fuori dal progetto: lo si cerca anche con require
  const { createRequire } = await import('node:module');
  const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: join(CARTELLA, 'pianta-1300.png') });
  await b.close();
  console.log(join(CARTELLA, 'pianta-1300.png'));
} catch (e) { console.log('niente PNG:', e.message); }
