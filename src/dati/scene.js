/* =====================================================================
   LE SCENE DEL COPIONE NELLA CITTÀ

   Per ogni schermata del gioco (storia/copione.md) questo file dice che
   cosa ne fa la città: in quale giornata e a che ora la si vede, quale
   luogo riguarda e da quale punto di vista. I testi, le scelte e le note
   del quaderno vengono dal copione (dati/copione.js, generato).

   - vista: { x, z, verso: [x, z] } = dove stai e dove guardi, a piedi;
     con volo: true e y la vista è dall'alto.
   - fuori: la scena non ha un luogo nella città, e qui si dice perché.
   - gruppo / ramo: le scene alternative di un bivio (I2, III3, IV2).
   - adattamento: che cosa la città mostra di diverso dal copione.

   Il gioco apre la città su una scena con ?scena=CODICE, per esempio
   …/firenze-1216-citta/?scena=IV3. Il racconto guidato si apre con il
   pulsante «Racconto» o con ?racconto.

   Si arriva fino al corteo funebre (IV4): la pagina dell'anno (atto V)
   e l'epilogo si giocano in classe, non per le strade.
   ===================================================================== */

/** I tipi delle note del quaderno, con le parole del copione («Come si legge»). */
export const TIPI_NOTA = {
  visto: { nome: 'visto', testo: 'il notaio l\'ha visto con i propri occhi', colore: '#3f7a52' },
  riferito: { nome: 'riferito', testo: 'gliel\'ha raccontato qualcuno senza un interesse diretto', colore: '#8a6a2f' },
  'di parte': { nome: 'di parte', testo: 'gliel\'ha raccontato qualcuno che ha un interesse', colore: '#a23b32' },
  documento: { nome: 'documento', testo: 'è scritto in un atto', colore: '#5d4a8a' }
};

const CAMPI = 'A Campi, sei miglia fuori Firenze, nella casa del nuovo cavaliere: è fuori dal modello.';

export const SCENE = [
  { id: 'P1', fuori: 'La bottega di Sanzanome: dove fosse non lo sappiamo.' },
  { id: 'I1', fuori: CAMPI },
  { id: 'I2a', gruppo: 'I2', ramo: 'Accanto a Uberto', fuori: CAMPI },
  { id: 'I2b', gruppo: 'I2', ramo: 'Vicino ai Fifanti', fuori: CAMPI },
  { id: 'I2c', gruppo: 'I2', ramo: 'In fondo alla sala', fuori: CAMPI },
  { id: 'I3', fuori: CAMPI },
  { id: 'II1', fuori: 'Dove si riunì il consiglio della pace le fonti non lo dicono.' },
  {
    id: 'II2', giornata: 'febbraio', ora: 9.2, luogo: 'case-donati',
    vista: { x: 280, z: -336, verso: [280, -351] },
    adattamento: 'Nel copione la scena è di sera, alla porta del notaio. La città mostra, di giorno, il luogo di cui parla Cilia: le case dei Donati.'
  },
  {
    id: 'II3', giornata: 'febbraio', ora: 7.3, luogo: 'porta-santa-maria',
    vista: { x: 84, z: -168, verso: [84.4, -197] },
    adattamento: 'Dove la gente fosse radunata per il giuramento non lo sappiamo (dossier, § 2): la città mostra Porta Santa Maria, da cui entrò Buondelmonte. Il copione dice giovedì; il calcolo sul calendario giuliano dà mercoledì [da verificare: dossier, lacuna 18].'
  },
  {
    id: 'III1', giornata: 'febbraio', ora: 10, luogo: 'santa-maria-sopra-porta',
    vista: { x: 19, z: -176, verso: [1.5, -177] },
    adattamento: 'Il giorno del consiglio non lo conosciamo, solo che venne dopo il 10 febbraio: la città lo mostra con la luce di febbraio.'
  },
  { id: 'III2', giornata: 'febbraio', luogo: 'santa-maria-sopra-porta' },
  { id: 'III3a', gruppo: 'III3', ramo: 'Dal messo del podestà', fuori: 'Dove ricevesse il messo del podestà nel 1216 non lo sappiamo: il palazzo del Popolo, oggi Bargello, sarà cominciato nel 1255 [da verificare].' },
  { id: 'III3b', gruppo: 'III3', ramo: 'Il messaggio', fuori: 'Una sera, in città: nessun luogo preciso.' },
  { id: 'III3c', gruppo: 'III3', ramo: 'Il quaderno chiuso', fuori: 'Al banco del notaio: nessun luogo preciso.' },
  {
    id: 'IV1', giornata: 'pasqua', ora: 7, luogo: 'ponte',
    vista: { x: -28, z: 105, y: 62, verso: [15, -45], volo: true }
  },
  {
    id: 'IV2a', gruppo: 'IV2', ramo: 'In Oltrarno', giornata: 'pasqua', ora: 7.9, luogo: 'ponte',
    vista: { x: -71, z: 101, verso: [-46, 74] }
  },
  {
    id: 'IV2b', gruppo: 'IV2', ramo: 'Vicino alle case degli Amidei', giornata: 'pasqua', ora: 8, luogo: 'amidei',
    vista: { x: 48, z: -52, verso: [17, -61] }
  },
  {
    id: 'IV2c', gruppo: 'IV2', ramo: 'A Santa Reparata', giornata: 'pasqua', ora: 8.2, luogo: 'santa-reparata',
    vista: { x: 147, z: -561, verso: [190, -561] },
    adattamento: 'Gli interni non ci sono ancora: la città ti lascia davanti alla facciata.'
  },
  {
    id: 'IV3', giornata: 'pasqua', ora: 8.6, luogo: 'capo-ponte',
    vista: { x: 20, z: -46, verso: [9, -27] },
    adattamento: 'Il delitto non si vede: la città mostra il luogo e la sua mattina di festa (dossier, Lacune n. 8).'
  },
  {
    id: 'IV4', giornata: 'pasqua', ora: 10, luogo: 'santa-reparata',
    vista: { x: 146, z: -552, verso: [175, -561] },
    adattamento: 'Il percorso del corteo «per tutta Firenze» non è tramandato. Il registro dei morti è dell\'11 aprile, il giorno dopo: la città resta alla mattina di Pasqua.'
  }
];
