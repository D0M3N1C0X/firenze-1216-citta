/* =====================================================================
   LA VISITA GUIDATA

   Dieci tappe per chi entra per la prima volta, nell'ordine della storia:
   dalla casa di Buondelmonte in Oltrarno, attraverso il ponte, fino alla
   cattedrale e alle mura. Testi brevi e semplici, per tutti; dicono solo
   quello che dicono le schede dei luoghi (dati/luoghi.js), con le stesse
   cautele, e per il resto rimandano alla scheda.

   vista: dove ci si mette e verso che cosa si guarda (come in scene.js);
   pitch, se c'è, alza lo sguardo (in radianti).
   certezza: alla tappa si accende «Che cosa è certo».
   ===================================================================== */

export const TAPPE = [
  {
    luogo: 'case-buondelmonti',
    titolo: 'In Oltrarno, dove abitava Buondelmonte',
    testo: [
      'È la mattina di Pasqua del 1216, domenica 10 aprile. Buondelmonte dei Buondelmonti abitava da queste parti, di là dall\'Arno, vicino alla chiesa di San Felice in Piazza.',
      'Quella mattina passò il ponte, a cavallo. Dove fosse di preciso la sua casa non lo sappiamo: le case che vedi sono ricostruite.'
    ],
    vista: { x: -335, z: 288, verso: [-230, 222] }
  },
  {
    luogo: 'ponte',
    titolo: 'Il Ponte Vecchio del 1216',
    testo: [
      'Nel 1216 l\'Arno si attraversa solo qui: gli altri ponti di Firenze arriveranno dopo, dal 1218 in poi.',
      'Il ponte che conosciamo oggi è un altro, rifatto nel 1345. Com\'era questo non lo descrive nessuno: arcate e carreggiata sono ricostruite per somiglianza con altri ponti.'
    ],
    vista: { x: -62.2, z: 41.4, verso: [-10, 25] }
  },
  {
    luogo: 'capo-ponte',
    titolo: 'Il capo del ponte e la pietra di Marte',
    testo: [
      'Qui, appena passato il ponte, Buondelmonte fu abbattuto da cavallo e ucciso. Il modello mostra il luogo, non il delitto: la città continua la sua mattina di festa.',
      'Accanto stava una vecchia statua spezzata che i fiorentini chiamavano Marte. Dante la ricorda come «quella pietra scema che guarda \'l ponte».'
    ],
    vista: { x: 20, z: -46, verso: [9, -27] }
  },
  {
    luogo: 'amidei',
    titolo: 'La torre degli Amidei e Santo Stefano',
    testo: [
      'La torre degli Amidei c\'è ancora, in via Por Santa Maria. Secondo il cronista Giovanni Villani, chi decise la vendetta si riunì in casa degli Amidei, «da Santo Stefano»: la chiesa qui accanto.',
      'Nel 1216 la torre era probabilmente più alta di oggi: l\'altezza che vedi è un\'ipotesi.'
    ],
    vista: { x: 48, z: -52, verso: [17, -61], pitch: 0.22 }
  },
  {
    luogo: 'santa-maria-sopra-porta',
    titolo: 'Santa Maria sopra Porta',
    testo: [
      'Secondo un\'altra cronaca, è qui che parenti e amici della famiglia offesa decisero che cosa fare di Buondelmonte. Le fonti non sono d\'accordo sul luogo, e la scheda lo dice.',
      'Mosca dei Lamberti chiuse la discussione: una cosa fatta fino in fondo non si può più disfare. È la frase che dà il nome al gioco, «cosa fatta capo ha». Si può entrare nella chiesa.'
    ],
    vista: { x: 19, z: -176, verso: [1.5, -177] }
  },
  {
    luogo: 'mercato-vecchio',
    titolo: 'Il Mercato Vecchio',
    testo: [
      'Il cuore del commercio, dove si incrociavano le strade della Firenze romana. Nei giorni di lavoro è pieno di banchi; a Pasqua è vuoto.',
      'Oggi qui c\'è piazza della Repubblica: il quartiere fu demolito alla fine dell\'Ottocento. Forma e misure del mercato sono un\'ipotesi.'
    ],
    vista: { x: 40, z: -345, verso: [90, -385] }
  },
  {
    luogo: 'battistero',
    titolo: 'Il Battistero di San Giovanni',
    testo: [
      'Qui venivano battezzati tutti i fiorentini. È l\'edificio di questa città che conosciamo meglio, perché è ancora in piedi.',
      'Ma nel 1216 dentro non c\'erano ancora i mosaici d\'oro, che cominciano nel 1225, e le porte di bronzo arriveranno nel Trecento.'
    ],
    vista: { x: 104, z: -512, verso: [137, -547] }
  },
  {
    luogo: 'santa-reparata',
    titolo: 'Santa Reparata, la cattedrale',
    testo: [
      'La cattedrale del 1216, dove oggi sorge il Duomo, che sarà cominciato sopra di lei nel 1296. Si può entrare: tre navate e il tetto di legno a vista.',
      'Il giorno dopo il delitto, il registro dei morti della cattedrale scrive soltanto: «è morto messer Buondelmonte». Né come, né per mano di chi.'
    ],
    vista: { x: 152, z: -527, verso: [180, -549] }
  },
  {
    luogo: 'porta-di-balla',
    titolo: 'Le mura e Porta di Balla',
    testo: [
      'Qui finisce la città: il muro costruito in fretta tra il 1172 e il 1175, con le sue porte. Questa è Porta di Balla, dove oggi è via dei Servi.',
      'Le mura non ci sono più, ma molte strade di oggi corrono dove correvano il muro e il fosso: per questo sappiamo dov\'erano. Altezza e forma sono ipotesi.'
    ],
    vista: { x: 349, z: -635, verso: [366, -657], pitch: 0.08 }
  },
  {
    luogo: null,
    titolo: 'Che cosa è certo, e che cosa no',
    testo: [
      'In questa città non tutto è sicuro allo stesso modo. Adesso ogni edificio è colorato secondo quanto ne sappiamo: azzurro se è documentato, arancione se è dedotto da indizi, grigio se è un\'ipotesi.',
      'Puoi spegnere i colori con «Che cosa è certo». Ogni luogo ha una scheda con le fonti. Ora esplora da solo: tocca la strada dove vuoi andare.'
    ],
    vista: { x: -28, z: 105, y: 62, verso: [15, -45], volo: true },
    certezza: true
  }
];

/* ---------------------------------------------------------------------
   LE DOMANDE ALLA FINE DELLA VISITA

   Quattro domande semplici per la classe. Ogni risposta rimanda alla
   scheda del luogo, dove ci sono le fonti; il «perché» dice solo quello
   che dice la scheda.
   --------------------------------------------------------------------- */
export const DOMANDE = [
  {
    domanda: 'Nel 1216, quanti ponti attraversano l\'Arno a Firenze?',
    risposte: ['Uno, il Ponte Vecchio', 'Due', 'Quattro, come oggi'],
    giusta: 0,
    perche: 'Il Ponte Vecchio è l\'unico: il ponte alla Carraia si comincia nel 1218, quello di Rubaconte nel 1237, Santa Trinita nel 1252.',
    luogo: 'ponte'
  },
  {
    domanda: 'Dove fu ucciso Buondelmonte, la mattina di Pasqua?',
    risposte: ['In Santa Reparata, durante la messa', 'Al capo del Ponte Vecchio, appena passato il fiume', 'Nel castello di Campi'],
    giusta: 1,
    perche: 'Veniva d\'Oltrarno e aveva appena passato il ponte: fu abbattuto da cavallo e ucciso lì, accanto alla pietra di Marte.',
    luogo: 'capo-ponte'
  },
  {
    domanda: 'Che cosa scrive, il giorno dopo, il registro dei morti della cattedrale?',
    risposte: ['Chi l\'ha ucciso e perché', 'Solo «è morto messer Buondelmonte»', 'Niente: non ne parla'],
    giusta: 1,
    perche: 'L\'obituario di Santa Reparata registra soltanto la morte: né come, né per mano di chi. Il resto lo raccontano le cronache, molti anni dopo.',
    luogo: 'santa-reparata'
  },
  {
    domanda: 'In questa città, che cosa vuol dire un edificio colorato di grigio con «Che cosa è certo»?',
    risposte: ['Che è ancora in piedi oggi', 'Che è un\'ipotesi: ricostruito per somiglianza, senza una prova diretta', 'Che è stato distrutto in guerra'],
    giusta: 1,
    perche: 'Azzurro vuol dire documentato, arancione dedotto da indizi, grigio ipotesi. Ogni scheda dice perché.',
    luogo: null
  }
];
