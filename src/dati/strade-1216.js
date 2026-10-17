/* =====================================================================
   LE STRADE DEL 1216

   Si parte dalle strade di oggi (OpenStreetMap) e si decide, una per
   una, se valgono per il 1216. Il criterio di partenza è che i tracciati
   del centro siano in gran parte medievali, e che le eccezioni siano note:
   i lungarni, gli spazi aperti dal Cinquecento in poi (Uffizi, piazza
   Pitti), gli sventramenti dell'Ottocento (piazza della Repubblica e le
   vie intorno), i ponti costruiti dopo il 1216.

   LIVELLO: i tracciati sono «dedotto» (sopravvivono, ma nessuna pianta
   del 1216 li conferma); le LARGHEZZE sono sempre «ipotesi».

   Fonti di controllo da usare (PIANO.md, sezione Fonti):
   G. Fanelli, Firenze. Architettura e città, 1973;
   F. Sznura, L'espansione urbana di Firenze nel Dugento, 1975.
   ===================================================================== */

import { MURO, PORTE, dentroTracciato } from './cerchia.js';

/** Strade che nel 1216 non c'erano, o non così. Il motivo è dichiarato. */
export const ESCLUSE = {
  'Lungarno degli Acciaioli': 'i lungarni sono successivi; nel Duecento le case arrivano al fiume [da verificare]',
  'Lungarno degli Archibusieri': 'come sopra',
  'Lungarno Corsini': 'come sopra',
  'Lungarno Guicciardini': 'come sopra',
  'Lungarno Torrigiani': 'come sopra',
  'Lungarno Generale Diaz': 'come sopra',
  "Lungarno Anna Maria Luisa de' Medici": 'come sopra',
  'Ponte Santa Trinita': 'ponte costruito nel 1252 (Villani) [da verificare]',
  'Piazzale degli Uffizi': 'gli Uffizi sono del 1560 e seguenti',
  'Via della Ninna': 'aperta con gli Uffizi',
  'Via dei Georgofili': 'aperta con gli Uffizi',
  'Via Roma': 'sventramento del Mercato Vecchio, 1885–1895',
  'Piazza della Repubblica': 'sventramento del Mercato Vecchio, 1885–1895',
  'Via dei Brunelleschi': 'sventramento del Mercato Vecchio',
  'Via dei Pescioni': 'sventramento del Mercato Vecchio',
  'Via dei Sassetti': 'sventramento del Mercato Vecchio',
  'Via dei Medici': 'sventramento del Mercato Vecchio',
  'Vicolo del Bazar': 'Ottocento [da verificare]',
  'Piazza Mentana': 'piazza ottocentesca',
  'Via Vincenzo Malenchini': 'Ottocento',
  'Piazza dei Pitti': 'palazzo Pitti è del Quattrocento',
  'Sdrucciolo dei Pitti': 'legato a palazzo Pitti',
  'Via Maggio': 'si sviluppa dopo il ponte Santa Trinita (1252) [da verificare]',
  'Piazza degli Strozzi': 'palazzo Strozzi è del 1489',
  'Piazza Carlo Levi': 'nome e forma moderni',
  'Piazzetta Salvatore e Nunzia Ferragamo': 'nome e forma moderni',
  'Via Don Giancarlo Setti': 'nome moderno, tracciato da verificare',
  'Vicolo del Giappone': 'da verificare',
  "Piazza de' Frescobaldi": 'slargo successivo [da verificare]',
  'Piazza San Firenze': 'piazza seicentesca',
  'Rampa dei Canigiani': 'rampe moderne',
  'Rampa delle Coste': 'rampe moderne',
  'Rampa di Sotto': 'rampe moderne',
  'Ponte Vecchio': 'il ponte del 1216 è costruito a parte (monumenti.js)',
  // entrate con l'estratto allargato a 560 m (2 ottobre 2026)
  'Ponte alla Carraia': 'ponte cominciato nel 1218 (Villani) [da verificare]',
  'Ponte alle Grazie': 'è il ponte Rubaconte, del 1237 (Villani) [da verificare]',
  'Lungarno Amerigo Vespucci': 'i lungarni sono successivi',
  'Pista Ciclabile Arno Sx': 'pista ciclabile di oggi',
  'Piazza Carlo Goldoni': 'slargo al capo del ponte alla Carraia, successivo al 1218',
  'Piazza di Santo Spirito': 'la piazza si forma con il convento agostiniano, dalla metà del Duecento [da verificare]',
  // entrate con l'estratto fino alla cerchia (12 ottobre 2026)
  'Piazza del Duomo': 'la piazza di oggi si apre con la cattedrale nuova, dal 1296; quella del 1216 è più piccola (AGGIUNTE, piazza di San Giovanni)',
  'Piazza di San Giovanni': 'nella forma di oggi è successiva; quella del 1216 è disegnata a mano (AGGIUNTE)',
  'Piazza della Signoria': 'la piazza si apre dopo il 1268, sulle case degli Uberti, e con il palazzo dei Priori dal 1299',
  'Piazza dei Mozzi': 'slargo al capo del ponte Rubaconte, che è del 1237',
  'Via dei Renai': 'i renai erano i banchi di sabbia lungo il fiume; la strada è successiva [da verificare]',
  'Piazza Demidoff': 'piazza dell\'Ottocento',
  'Lungarno Serristori': 'i lungarni sono successivi',
  'Lungarno delle Grazie': 'i lungarni sono successivi',
  'Lungarno della Zecca Vecchia': 'i lungarni sono successivi',
  'Ponte alle Grazie': 'è il ponte Rubaconte, del 1237 (Villani) [da verificare]'
};

/** Larghezze ipotetiche in metri, per nome. Le altre seguono il tipo di strada. */
const LARGHEZZE = {
  'Via Por Santa Maria': 6.5,
  'Calimala': 6.5,
  'Via dei Calzaiuoli': 5.5,
  'Via del Corso': 5.5,
  'Via dei Guicciardini': 6.5,
  'Borgo San Iacopo': 5,
  'Borgo Santi Apostoli': 4.8,
  'Via dei Bardi': 5,
  'Via Porta Rossa': 5,
  'Pellicceria': 5.5,
  'Via delle Terme': 4.2,
  'Via Lambertesca': 4.2,
  'Via Vacchereccia': 4.5,
  'Via dei Tornabuoni': 7,
  'Via degli Strozzi': 4.5
};

export function larghezza(nome) {
  if (LARGHEZZE[nome]) return LARGHEZZE[nome];
  if (/^(Chiasso|Vicolo|Volta)/.test(nome)) return 2.4;
  if (/^Costa/.test(nome)) return 3.6;
  if (/^Borgo/.test(nome)) return 4.8;
  return 4.2;
}

export const valeNel1216 = nome => !(nome in ESCLUSE);

/* ---------------------------------------------------------------------
   AGGIUNTE: strade e piazze del 1216 che oggi non esistono più, o che
   l'estratto OpenStreetMap non contiene. Sono disegnate a mano, in metri
   locali, e sono tutte di livello «ipotesi» per forma e misure; il
   motivo è dichiarato accanto a ciascuna.
   --------------------------------------------------------------------- */
export const AGGIUNTE = [
  {
    nome: 'Mercato Vecchio',
    area: true,
    // sul foro romano, dove oggi è piazza della Repubblica: incrocio di Calimala
    // (cardine) con via degli Strozzi e via degli Speziali (decumano)
    punti: [[30, -395], [96, -395], [96, -335], [30, -335]],
    motivo: 'il mercato del Duecento, distrutto con lo sventramento del 1885–1895; forma e misure ipotetiche [da verificare: catasto ottocentesco, Sznura 1975]'
  },
  {
    nome: 'Piazza di San Giovanni',
    area: true,
    // tra il Battistero e la facciata di Santa Reparata
    punti: [[98, -512], [178, -512], [178, -546], [159, -546], [159, -582], [98, -582]],
    motivo: 'lo spazio davanti alla cattedrale; nel 1216 era più piccolo della piazza di oggi e in parte cimitero [da verificare]'
  },
  {
    nome: 'Strada per San Felice',
    larghezza: 5.5,
    // dal fondo di via de' Guicciardini a piazza San Felice, sulla strada che
    // oggi passa davanti a palazzo Pitti (la «Piazza dei Pitti» di OSM):
    // all'ingresso della piazza c'è la porta di Piazza (dati/cerchia.js)
    punti: [[-198.8, 187.3], [-209, 200.8], [-226, 217.7], [-263.7, 243.1], [-337.5, 290.9], [-404.3, 334]],
    motivo: 'la via per Roma attraverso l\'Oltrarno; piazza Pitti è del Quattrocento e qui il tracciato è quello della strada di oggi [da verificare]'
  }
];

/* ---------------------------------------------------------------------
   DENTRO E FUORI LE MURA

   Dal 12 ottobre 2026 la città si costruisce dentro la cerchia del 1172–75
   (dati/cerchia.js). Le strade di oggi si tagliano sul perimetro; lungo il
   muro, dove oggi corrono via dei Fossi, via de' Pucci, via Verdi e le
   altre, nel 1216 c'erano il muro e il fosso, non una strada. Fuori si
   tengono soltanto le strade che escono da una porta, per un tratto: le
   vie dei borghi e della campagna.
   --------------------------------------------------------------------- */

const SUL_MURO = 7;           // metri dall'asse del muro: il muro e il fosso
const FUORI_PORTA = 220;      // metri di strada tenuti fuori da ogni porta

function distanza(pts, x, z) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}

const lunghezza = pts => pts.reduce((l, p, k) => k ? l + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0, 0);

/** Toglie i punti allineati che il taglio aggiunge. */
function semplifica(pts) {
  const out = [pts[0]];
  for (let k = 1; k + 1 < pts.length; k++) {
    const [ax, az] = out.at(-1), [bx, bz] = pts[k], [cx, cz] = pts[k + 1];
    if (Math.abs((bx - ax) * (cz - az) - (bz - az) * (cx - ax)) > 0.05 * Math.hypot(cx - ax, cz - az)) out.push(pts[k]);
  }
  out.push(pts.at(-1));
  return out.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);
}

/** I tratti di una spezzata dove vale tiene(x, z), a passi di al più 3 m. */
function ritaglia(pts, tiene) {
  const tratti = [];
  let cur = null;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3));
    for (let i = 0; i < n; i++) {
      const p0 = [ax + (bx - ax) * i / n, az + (bz - az) * i / n], p1 = [ax + (bx - ax) * (i + 1) / n, az + (bz - az) * (i + 1) / n];
      if (tiene((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) { if (!cur) tratti.push(cur = [p0]); cur.push(p1); } else cur = null;
    }
  }
  return tratti.filter(t => lunghezza(t) > 4).map(semplifica);
}

const PORTE_POSTE = PORTE.filter(p => p.pos);
const sulMuro = (x, z) => distanza(MURO, x, z) < SUL_MURO;
const dentro = (x, z) => dentroTracciato(x, z) && !sulMuro(x, z);
const vicinoPorta = (x, z, r) => PORTE_POSTE.some(p => Math.hypot(x - p.pos[0], z - p.pos[1]) < r);

/** Le strade del 1216: quelle di oggi che valgono, tagliate sulla cerchia, più le aggiunte e i passaggi delle porte. */
export function strade1216(tutte) {
  const out = [];
  for (const s of tutte.filter(s => valeNel1216(s.nome)).map(s => ({ ...s, larghezza: larghezza(s.nome) })).concat(AGGIUNTE.map(a => ({ ...a, larghezza: a.larghezza || 4.2 })))) {
    if (s.area) {
      const c = s.punti.reduce((a, p) => [a[0] + p[0] / s.punti.length, a[1] + p[1] / s.punti.length], [0, 0]);
      if (dentro(c[0], c[1])) out.push(s);
      continue;
    }
    for (const punti of ritaglia(s.punti, dentro)) out.push({ ...s, punti });
    // fuori le mura: solo le strade che escono da una porta, per un tratto
    for (const punti of ritaglia(s.punti, (x, z) => !dentroTracciato(x, z) && !sulMuro(x, z) && vicinoPorta(x, z, FUORI_PORTA)))
      if (vicinoPorta(...punti[0], 16) || vicinoPorta(...punti.at(-1), 16)) out.push({ ...s, punti, larghezza: Math.min(s.larghezza, 4.5), fuori: true });
  }
  // il passaggio di ogni porta, da una parte all'altra del muro
  for (const p of PORTE_POSTE) {
    const [x, z] = p.pos, [dx, dz] = p.dir, l = 13;
    out.push({ nome: p.nome, porta: p.id, larghezza: p.tipo === 'porta' ? 4.2 : 2.6, punti: [[x - dx * l, z - dz * l], [x + dx * l, z + dz * l]] });
  }
  return out;
}

