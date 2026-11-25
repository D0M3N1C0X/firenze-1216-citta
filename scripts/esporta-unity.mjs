/* =====================================================================
   I DATI DELLA CITTÀ PER UNITY — npm run unity

   Rifà la pianta della città come la costruisce il browser (strade,
   monumenti, mura, case, borghi, campi), senza disegnare niente, e la
   scrive in ../unity/Firenze1216/Assets/Dati/ in file che Unity legge:

     citta-<epoca>.json   strade, case (con il tipo di Blender), campi,
                          siepi e graticci, fiume, cerchie, porte, luoghi,
                          giornate; tutto in metri, x verso est e z verso sud
                          come nel browser (in Unity: x = x, z = −z)
     terreno-<epoca>.bytes  le quote del terreno fine, una ogni 4 m, numeri a
                          32 bit in virgola mobile, per righe da nord a sud

   Si lancia per un'epoca alla volta (EPOCA=1300 per il 1300); npm run
   unity le fa tutte e due. I monumenti non ci sono ancora: le loro
   posizioni stanno in mondo/monumenti.js e vanno esportate a parte.
   ===================================================================== */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FIUME, STRADE as STRADE_1216 } from '../src/dati/osm.js';
import { strade1216 } from '../src/dati/strade-1216.js';
import { PORTE as PORTE_1216, TRACCIATO, dentroTracciato } from '../src/dati/cerchia.js';
import { LUOGHI, dellEpoca } from '../src/dati/luoghi.js';
import { LUOGHI_EN, OGGI_EN } from '../src/dati/inglese.js';
import { TRECENTO } from '../src/dati/trecento-luoghi.js';
import { OGGI_LUOGHI } from '../src/dati/oggi-luoghi.js';
import { GIORNATE } from '../src/dati/giornate.js';
import { DOMANDE, TAPPE } from '../src/dati/visita.js';
import { DOMANDE_EN, TAPPE_EN } from '../src/dati/inglese.js';
import { percorso, lunghezza } from '../src/mondo/percorso.js';
import { EPOCA, NEL_1300 } from '../src/mondo/epoca.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from '../src/mondo/griglia.js';
import { Cantiere } from '../src/mondo/cantiere.js';
import { costruisciMonumenti, interni } from '../src/mondo/monumenti.js';
import { soloIndice } from '../src/mondo/modelli.js';
import { lottizza } from '../src/mondo/edifici.js';
import { costruisciMura, costruisciPalizzata } from '../src/mondo/mura.js';
import { costruisciBorghi } from '../src/mondo/fondale.js';
import { costruisciMestieri } from '../src/mondo/mestieri.js';
import { tipoDi } from '../src/mondo/case-blender.js';
import { lottizzaCampi, oggettiDelCampo, recintiDi, stagioneDi } from '../src/mondo/campagna.js';
import { vitaDiStrada } from '../src/mondo/vita.js';
import { VICINO, quota } from '../src/mondo/terreno.js';

const qui = new URL('.', import.meta.url);
const uscita = new URL('../../unity/Firenze1216/Assets/Dati/', qui);
mkdirSync(uscita, { recursive: true });
soloIndice(JSON.parse(readFileSync(new URL('../public/monumenti/indice.json', qui), 'utf8')));
const r1 = v => Math.round(v * 10) / 10, r3 = v => Math.round(v * 1000) / 1000;
// le liste di punti sono piatte (x0, z0, x1, z1, …): il lettore JSON di Unity non legge liste di liste
const punti = pts => pts.flatMap(p => [r1(p[0]), r1(p[1])]);

// --- la pianta, come scripts/verifica.mjs e verifica-1300.mjs
let griglia, strade, lotti, borghi, extra = {};
const cant = new Cantiere();
const RIQUADRO = [Math.min(...TRACCIATO.map(p => p[0])), Math.min(...TRACCIATO.map(p => p[1])), Math.max(...TRACCIATO.map(p => p[0])), Math.max(...TRACCIATO.map(p => p[1]))];
if (NEL_1300) {
  const { STRADE } = await import('../src/dati/osm-1300.js');
  const MOD = await import('../src/dati/strade-1300.js');
  const C13 = await import('../src/dati/cerchia-1300.js');
  const { PALIZZATA_1300, RIEMPIMENTO_1300, componiStrade1300, lottiBorghi1300 } = await import('../src/mondo/citta-1300.js');
  const { muraOltrarno1300, porteInCantiere } = await import('../src/mondo/mura-1300.js');
  const { costruisciMonumenti1300, POSE_1300 } = await import('../src/mondo/monumenti-1300.js');
  griglia = new Griglia(-2000, 1800); griglia.poligono(FIUME, C_FIUME);
  strade = componiStrade1300(MOD, STRADE);
  for (const s of strade) { if (s.area) griglia.poligono(s.punti, PIAZZA, false); else griglia.spezzata(s.punti, s.larghezza, STRADA, false); }
  costruisciMonumenti(cant, griglia); costruisciMonumenti1300(cant, griglia);
  costruisciMura(cant, griglia); muraOltrarno1300(cant, griglia); porteInCantiere(cant, griglia);
  lotti = lottizza(griglia, strade.filter(s => !s.fuoriVecchia), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: RIEMPIMENTO_1300 });
  borghi = lottiBorghi1300(griglia, strade, C13.dentroLimite, C13.LIMITE);
  costruisciMestieri(cant, griglia, lotti, strade);
  costruisciPalizzata(cant, griglia, PALIZZATA_1300);
  extra = { cerchiaNuova: punti(C13.LIMITE), porteNuove: C13.PORTE.filter(p => p.pos).map(p => ({ id: p.id, nome: p.nome, stato: p.stato, pos: punti([p.pos]) })), monumenti1300: Object.entries(POSE_1300).filter(([, p]) => p).map(([nome, p]) => ({ nome, origine: punti([p.origine]), n: p.n })), dentroNuova: C13.dentroLimite };
} else {
  griglia = new Griglia(-1100, 1100); griglia.poligono(FIUME, C_FIUME);
  strade = strade1216(STRADE_1216);
  for (const s of strade) { if (s.area) griglia.poligono(s.punti, PIAZZA, false); else griglia.spezzata(s.punti, s.larghezza, STRADA, false); }
  costruisciMonumenti(cant, griglia); costruisciMura(cant, griglia);
  lotti = lottizza(griglia, strade.filter(s => !s.fuori), { dentro: dentroTracciato, riquadro: RIQUADRO, riempimento: 28000 });
  borghi = costruisciBorghi(cant, griglia, strade);
  costruisciMestieri(cant, griglia, lotti, strade);
  costruisciPalizzata(cant, griglia);
}
const fuori = s => NEL_1300 ? s.fuoriVecchia : s.fuori;
const campagna = lottizzaCampi({ strade: strade.filter(fuori), griglia, dentroNuova: extra.dentroNuova });
delete extra.dentroNuova;

// --- le case: dove, quanto grandi, e quale dei 27 tipi di Blender (le torri e le case sul fiume restano «generate»)
const casa = (L, borgo) => {
  const cx = L.px + L.nz * L.W / 2 + L.nx * L.D / 2, cz = L.pz - L.nx * L.W / 2 + L.nz * L.D / 2;
  const o = { x: r1(L.px), z: r1(L.pz), nx: r3(L.nx), nz: r3(L.nz), w: r1(L.W), d: r1(L.D), y: r1(quota(cx, cz)), seme: L.seme, tipo: L.tipo, borgo };
  if (L.retro) o.sulFiume = true;
  if (L.tipo === 'casa' && !L.retro) { const t = tipoDi({ ...L, borgo }); o.modello = t.nome; o.scalaX = r3(L.W / t.W); o.scalaZ = r3(L.D / 12); o.tinta = t.tinta.map(r3); }
  return o;
};

// --- i campi, con gli oggetti dei recinti già al loro posto
const campi = campagna.campi.map(c => ({
  n: c.n, tipo: c.tipo, ox: r1(c.ox), oz: r1(c.oz), ux: r3(c.ux), uz: r3(c.uz), vx: r3(c.vx), vz: r3(c.vz), w: r1(c.w), b0: r1(c.b0), b1: r1(c.b1), area: c.celle * 4,
  recinti: recintiDi(c).map(([tipo, a, b, verso]) => { const x = c.ox + c.ux * a + c.vx * b, z = c.oz + c.uz * a + c.vz * b; return campagna.di(x, z) === c ? { tipo, x: r1(x), z: r1(z), verso } : null; }).filter(Boolean)
}));

// --- il terreno: una quota ogni 4 m sul riquadro fine
const PASSO = 4, n = Math.round(VICINO.lato / PASSO) + 1, x0 = VICINO.x - VICINO.lato / 2, z0 = VICINO.z - VICINO.lato / 2;
const quote = new Float32Array(n * n);
for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) quote[j * n + i] = quota(x0 + i * PASSO, z0 + j * PASSO);
writeFileSync(new URL(`terreno-${EPOCA}.bytes`, uscita), Buffer.from(quote.buffer));

// la campagna: gli oggetti di tutti i campi (mondo/campagna.js, oggettiDelCampo), per tipo, sei numeri ciascuno:
// x, y, z, rotazione attorno alla verticale (radianti, come nel browser), scala orizzontale, scala verticale
const oggettiCampi = { vite: [], siepe: [], graticcio: [], cavolo: [], canne: [] };
for (const c of campagna.campi) for (const [tipo, lista] of Object.entries(oggettiDelCampo(c, campagna))) for (const v of lista) oggettiCampi[tipo].push(...v.map((n, i) => i === 3 ? r3(n) : i >= 4 ? r3(n) : r1(n)));

// la vita di strada (mondo/vita.js): l'arredo e le persone ferme con un gesto, come nella prova ?vita del browser
const vita = vitaDiStrada({ lotti, borghi, strade, griglia, campi: campagna.campi, luoghi: LUOGHI.filter(l => (l.mondo || 'citta') === 'citta') });

const luoghi = LUOGHI.filter(l => (l.mondo || 'citta') === 'citta' && dellEpoca(l, EPOCA)).map(l => ({
  id: l.id, nome: l.nome, pos: l.pos, raggio: l.raggio, testo: l.testo, fonti: l.fonti,
  // il livello di certezza del luogo e delle forme, con la nota che lo giustifica
  livello: l.luogo?.livello, notaLuogo: l.luogo?.nota, livelloForme: l.forma?.livello, notaForme: l.forma?.nota,
  // nel 1300 (dati/trecento-luoghi.js): il testo e le parole dei cronisti
  nel1300: TRECENTO[l.id] ? { testo: TRECENTO[l.id].testo, en: TRECENTO[l.id].en, fonti: TRECENTO[l.id].fonti, cronisti: (TRECENTO[l.id].racconta || []).map(r => ({ chi: r.chi, dove: r.dove, parole: r.parole, en: r.en })) } : undefined,
  // oggi (dati/oggi-luoghi.js): che cosa ne resta
  oggi: OGGI_LUOGHI[l.id] ? { resta: OGGI_LUOGHI[l.id].resta, testo: OGGI_LUOGHI[l.id].testo, en: OGGI_EN[l.id], fonti: OGGI_LUOGHI[l.id].fonti } : undefined,
  en: LUOGHI_EN[l.id] ? { nome: LUOGHI_EN[l.id].nome, testo: LUOGHI_EN[l.id].testo, notaLuogo: LUOGHI_EN[l.id].luogo, notaForme: LUOGHI_EN[l.id].forma } : undefined
}));
// la visita guidata (dati/visita.js, solo nel 1216): le dieci tappe, e tra una tappa e la successiva il percorso a piedi
// per le strade (mondo/percorso.js), che l'app segna a terra (decisione del 23 novembre 2026: «linea a terra e cartiglio»)
let visita;
if (!NEL_1300) {
  const tappe = TAPPE.map((t, k) => ({
    luogo: t.luogo || '', titolo: t.titolo, testo: t.testo, certezza: Boolean(t.certezza),
    vista: { x: t.vista.x, z: t.vista.z, y: t.vista.y || 0, vx: t.vista.verso[0], vz: t.vista.verso[1], volo: Boolean(t.vista.volo), pitch: t.vista.pitch || 0 },
    en: TAPPE_EN[k] ? { titolo: TAPPE_EN[k].titolo, testo: TAPPE_EN[k].testo } : undefined
  }));
  const percorsi = [];
  for (let k = 1; k < tappe.length; k++) {
    const a = tappe[k - 1].vista, b = tappe[k].vista;
    const p = b.volo ? null : percorso(griglia, [a.x, a.z], [b.x, b.z]);
    if (!p && !b.volo) console.warn(`visita: nessun percorso tra la tappa ${k} e la ${k + 1}`);
    percorsi.push({ punti: p ? punti(p) : [], metri: p ? Math.round(lunghezza(p)) : 0 });
  }
  console.log('visita: percorsi di ' + percorsi.map(p => p.metri + ' m').join(', '));
  visita = { tappe, percorsi, domande: DOMANDE.map((d, k) => ({ ...d, luogo: d.luogo || '', en: DOMANDE_EN[k] })) };
}

const dati = {
  epoca: EPOCA, fatto: new Date().toISOString().slice(0, 10),
  nota: 'metri; x verso est, z verso sud (in Unity: x = x, z = -z); origine: il capo nord del ponte. Livelli di certezza: documentato, dedotto, ipotesi.',
  terreno: { file: `terreno-${EPOCA}`, x0, z0, passo: PASSO, lato: n, min: r1(quote.reduce((a, b) => Math.min(a, b), Infinity)), max: r1(quote.reduce((a, b) => Math.max(a, b), -Infinity)) },
  fiume: punti(FIUME),
  cerchia1172: punti(TRACCIATO),
  porte: PORTE_1216.filter(p => p.pos).map(p => ({ id: p.id, nome: p.nome, pos: punti([p.pos]) })),
  ...extra,
  strade: strade.filter(s => s.punti?.length > 1).map(s => ({ nome: s.nome, larghezza: s.larghezza, piazza: Boolean(s.area) || undefined, fuori: Boolean(fuori(s)) || undefined, livello: s.livello, lastricata: NEL_1300 && !s.porta && (!s.fuoriVecchia || (s.larghezza || 0) >= 5 && s.livello !== 'ipotesi') || undefined, punti: punti(s.punti) })),
  case: [...lotti.map(L => casa(L, false)), ...borghi.map(L => casa(L, true))],
  campi,
  luoghi,
  visita,
  // gli interni in cui si entra (Santa Reparata, Santa Maria sopra Porta, la torre degli Amidei…): Interni.cs li illumina
  interni: interni().map(i => ({ nome: i.nome, chiesa: i.chiesa, y: r1(i.y), poligoni: i.poligoni.map(p => ({ punti: punti(p) })) })),
  campagna: oggettiCampi,
  arredo: vita.arredo.map(o => ({ nome: o.nome, x: r1(o.x), z: r1(o.z), y: r1(o.y), dir: r3(o.dir), scala: r3(o.scala), appeso: Boolean(o.appeso) || undefined })),
  gente: vita.gente.map(g => ({ x: r1(g.x), z: r1(g.z), dir: r3(g.guarda ? Math.atan2(g.guarda[0] - g.x, g.guarda[1] - g.z) : g.dir), clip: g.clip, attrezzo: g.attrezzo || undefined, quando: g.quando, ruoli: g.ruoli || undefined })),
  giornate: Object.values(GIORNATE).filter(g => (g.epoca || '1216') === EPOCA).map(g => ({ id: g.id, titolo: g.titolo, nota: g.nota, giornoDellAnno: g.doy, festa: g.festa, ora: g.ora, gente: g.gente, stagione: stagioneDi(g.doy), nuvole: g.nuvole, foschia: g.foschia }))
};
writeFileSync(new URL(`citta-${EPOCA}.json`, uscita), JSON.stringify(dati));
// i modelli di Blender e le texture CC0, copiati nel progetto Unity (una volta sola: sono gli stessi per le due epoche)
if (!NEL_1300) {
  const assets = new URL('../../unity/Firenze1216/Assets/', qui);
  for (const [da, a] of [['case', 'Modelli/Case'], ['vegetazione', 'Modelli/Vegetazione'], ['campagna', 'Modelli/Campagna'], ['monumenti', 'Modelli/Monumenti'], ['texture', 'Texture'],
    // la gente: le 36 figure per epoca e gli animali; i movimenti li scrive strumenti/figure/movimenti.py con GENTE=unity
    ['figure', 'Modelli/Gente/1216'], ['figure-1300', 'Modelli/Gente/1300'], ['animali', 'Modelli/Animali']])
    cpSync(new URL(`../public/${da}/`, qui), new URL(a + '/', assets), { recursive: true });
}
const perTipo = {}; for (const c of dati.case) perTipo[c.modello ? 'blender' : c.sulFiume ? 'sul fiume' : c.tipo] = (perTipo[c.modello ? 'blender' : c.sulFiume ? 'sul fiume' : c.tipo] || 0) + 1;
console.log(`✓ unity ${EPOCA}: ${dati.strade.length} strade, ${dati.case.length} case (${Object.entries(perTipo).map(([k, v]) => v + ' ' + k).join(', ')}), ${campi.length} campi (${Object.entries(oggettiCampi).map(([k, v]) => v.length / 6 + ' ' + k).join(', ')}), ${dati.arredo.length} pezzi d'arredo, ${dati.gente.length} persone con un gesto, ${luoghi.length} luoghi, ${dati.giornate.length} giornate, terreno ${n}×${n}`);
