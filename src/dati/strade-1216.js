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
  'Piazza di Santo Spirito': 'la piazza si forma con il convento agostiniano, dalla metà del Duecento [da verificare]'
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
    nome: 'Corso degli Adimari',
    larghezza: 5.5,
    // prosegue via dei Calzaiuoli oltre il margine dell'estratto, fino a San Giovanni
    punti: [[157, -444], [155, -480], [151, -514]],
    motivo: 'oggi via dei Calzaiuoli; l\'estratto si ferma a 440 m dal ponte e il tratto finale è tracciato a mano [da verificare: il nome della strada nel 1216]'
  },
  {
    nome: 'Strada per San Felice',
    larghezza: 5.5,
    // dal fondo di via de' Guicciardini verso San Felice in Piazza e la porta
    // di San Pier Gattolino [da verificare: posizione della porta nel 1216], sotto quella
    // che nel Quattrocento diventerà piazza Pitti
    // l'ultimo tratto passa dritto per la porta della cerchia (dati/cerchia.js)
    punti: [[-199, 187], [-258, 232], [-316, 276], [-334, 288], [-338, 300], [-341, 312]],
    motivo: 'la via per Roma attraverso l\'Oltrarno; piazza Pitti è successiva e qui il tracciato è ipotetico [da verificare]'
  }
];

/**
 * Corridoi dove si costruisce anche oltre il raggio della città percorribile:
 * il percorso del corteo funebre verso Santa Reparata (copione, IV4).
 */
export const CORRIDOI = [
  { punti: [[150, -400], [155, -470], [150, -515], [135, -560]], larghezza: 55 }
];

/** Metri dal capo del ponte in cui la città è costruita casa per casa (400 fino al 1° ottobre). */
export const RAGGIO_CITTA = 480;

/** Le strade del 1216: quelle di oggi che valgono, con la loro larghezza, più le aggiunte. */
export function strade1216(tutte) {
  return tutte.filter(s => valeNel1216(s.nome)).map(s => ({ ...s, larghezza: larghezza(s.nome) }))
    .concat(AGGIUNTE.map(a => ({ ...a, larghezza: a.larghezza || 4.2 })));
}
