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
  'Ponte Vecchio': 'il ponte del 1216 è costruito a parte (monumenti.js)'
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
