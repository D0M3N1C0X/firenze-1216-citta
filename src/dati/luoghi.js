/* =====================================================================
   I LUOGHI E LE LORO SCHEDE

   Ogni luogo ha due livelli di certezza distinti:
   - LUOGO: che cosa sappiamo dell'esistenza e della posizione;
   - FORMA: che cosa sappiamo dell'aspetto che vedi.
   Una chiesa può essere documentatissima e avere, nel modello, una
   facciata del tutto ipotetica. Il modello colora secondo la FORMA,
   perché è la forma che l'occhio prende per vera.

   Convenzioni del progetto: la fonte accanto a ogni affermazione;
   [da verificare] dove non c'è stato il controllo sulla fonte primaria;
   «le fonti divergono» dove le fonti non concordano.
   Le pagine di Faini rimandano a E. Faini, «Il convito del 1216»,
   Annali di Storia di Firenze, I (2006), pp. 9–36.
   ===================================================================== */

export const LUOGHI = [
  {
    id: 'capo-ponte',
    nome: 'Il capo del Ponte Vecchio',
    pos: [9, -29], raggio: 14,
    luogo: { livello: 'documentato', nota: '«appiè di Marzo, in capo del Ponte Vecchio» (pseudo-Brunetto; Faini pp. 15–16)' },
    forma: { livello: 'ipotesi', nota: 'lo slargo, le case e il fondo stradale sono ricostruiti' },
    testo: 'Qui, la mattina di Pasqua del 1216, Buondelmonte dei Buondelmonti fu abbattuto da cavallo e ucciso. Veniva d\'Oltrarno, dove aveva casa, e aveva appena passato il ponte. Il modello mostra il luogo, non il delitto: la città continua la sua mattina di festa.',
    fonti: [
      'Cronaca dello pseudo-Brunetto, ed. Schiaffini 1954, pp. 118–119',
      'G. Villani, Nuova Cronica VI, 38',
      'E. Faini, Il convito del 1216, pp. 11, 15–16'
    ]
  },
  {
    id: 'marte',
    nome: 'La pietra di Marte',
    pos: [17, -31], raggio: 8,
    luogo: { livello: 'documentato', nota: 'a capo del ponte, dal lato della città: tutte le cronache; Dante, Par. XVI 145–147' },
    forma: { livello: 'ipotesi', nota: 'figura e pilastro sono inventati; il lato del ponte su cui stava è scelto da noi' },
    testo: 'I fiorentini la chiamavano Marte e credevano che la città dipendesse da lei. Per Dante è «quella pietra scema / che guarda \'l ponte»: una statua mutila, già allora un frammento. Secondo la tradizione cadde in Arno con la piena del 1178 e fu ripescata verso il 1200. Che cosa raffigurasse davvero non lo sappiamo.',
    fonti: [
      'Dante, Paradiso XVI 145–147; Inferno XIII 146–150',
      'R. Davidsohn, Storia di Firenze, via Faini p. 11 e n. 12',
      'Scomparsa con l\'alluvione del 1333 [da verificare: Villani XII, 1]'
    ]
  },
  {
    id: 'ponte',
    nome: 'Il Ponte Vecchio del 1216',
    pos: [-17, 20], raggio: 30,
    luogo: { livello: 'documentato', nota: 'nel 1216 è l\'unico ponte di Firenze' },
    forma: { livello: 'ipotesi', nota: 'numero delle arcate, larghezza e assenza di botteghe sono ipotesi' },
    testo: 'Nel 1216 l\'Arno si passa solo qui. Il ponte alla Carraia si comincia nel 1218, quello di Rubaconte nel 1237, Santa Trinita nel 1252. Il ponte che vedi oggi è un altro: fu ricostruito nel 1345, dopo che la piena del 1333 aveva travolto il precedente. Di quel ponte precedente, il nostro, non abbiamo una descrizione: le arcate e la carreggiata sono ricostruite per analogia.',
    fonti: [
      'Date dei ponti: G. Villani, Nuova Cronica [da verificare: capitoli]',
      'Ricostruzione del 1345 [da verificare: fonte scientifica]'
    ]
  },
  {
    id: 'amidei',
    nome: 'La torre degli Amidei',
    pos: [15, -61], raggio: 10,
    luogo: { livello: 'dedotto', nota: 'la torre che oggi porta il nome degli Amidei; i congiurati si riunirono «in casa gli Amidei da Santo Stefano» (Villani; Faini p. 11)' },
    forma: { livello: 'ipotesi', nota: 'l\'altezza del 1216 è ignota; la torre di oggi è stata ricostruita nel dopoguerra [da verificare]' },
    testo: 'È uno dei punti fermi del modello: l\'impronta viene dalla torre di oggi, in via Por Santa Maria. Nel 1216 le torri potevano essere molto più alte di adesso. Furono mozzate dal governo del Primo Popolo intorno al 1250, a 50 braccia, circa 29 metri [da verificare]. L\'altezza che vedi è quindi un\'ipotesi.',
    fonti: [
      'G. Villani, Nuova Cronica VI, 38, citato da Faini p. 11',
      'Pseudo-Brunetto: l\'agguato preparato in casa Amidei (Faini p. 15)',
      'Mozzatura delle torri: Villani VII [da verificare]'
    ]
  },
  {
    id: 'santo-stefano',
    nome: 'Santo Stefano al Ponte',
    pos: [52, -54], raggio: 14,
    luogo: { livello: 'documentato', nota: 'chiesa attestata dal XII secolo [da verificare: 1116]' },
    forma: { livello: 'ipotesi', nota: 'la facciata romanica di oggi è datata 1233 [da verificare]: nel 1216 non c\'era ancora' },
    testo: 'La chiesa che dà il nome al luogo dell\'agguato: le case degli Amidei sono «da Santo Stefano». La pianta segue quella dell\'edificio attuale. La facciata è semplificata, perché quella che si vede oggi è di qualche anno successiva al delitto.',
    fonti: ['Faini p. 11 (Villani)', 'Datazioni: [da verificare] su una guida scientifica degli edifici sacri fiorentini']
  },
  {
    id: 'santi-apostoli',
    nome: 'Santi Apostoli',
    pos: [-107, -118], raggio: 16,
    luogo: { livello: 'documentato', nota: 'chiesa dell\'XI secolo [da verificare]' },
    forma: { livello: 'dedotto', nota: 'la pianta basilicale sopravvive; alzato e facciata semplificati' },
    testo: 'Una delle chiese più antiche della città, sul Borgo che porta il suo nome. Davanti c\'è il Limbo, il piccolo cimitero dei bambini morti senza battesimo, da cui viene il nome della piazza [da verificare].',
    fonti: ['[da verificare] su una guida scientifica']
  },
  {
    id: 'porta-santa-maria',
    nome: 'Porta Santa Maria',
    pos: [84, -194], raggio: 12,
    luogo: { livello: 'ipotesi', nota: 'la porta è nominata dalle cronache, la sua posizione esatta non la conosciamo (dossier, Lacune n. 5)' },
    forma: { livello: 'ipotesi', nota: 'arco e torre sono inventati' },
    testo: 'Il 10 febbraio 1216 Buondelmonte entra in città da Porta Santa Maria per andare a giurare la donna dei Donati, invece dell\'Amidei. Era una porta della cerchia più antica. Nel 1216 la cerchia nuova (1172–1175) arriva ormai fino al fiume, e la vecchia porta resta dentro la città. Qui è messa dove la strada che porta il suo nome incontra il vecchio tracciato delle mura romane: è una scelta da verificare.',
    fonti: ['Pseudo-Brunetto, ed. Schiaffini p. 118; Faini pp. 14–16', 'Posizione: da chiedere al medievista (dossier, Lacune n. 5 e 14)']
  },
  {
    id: 'santa-maria-sopra-porta',
    nome: 'Santa Maria sopra Porta',
    pos: [15, -178], raggio: 12,
    luogo: { livello: 'dedotto', nota: 'identificata con l\'attuale San Biagio, in piazza di Parte Guelfa [da verificare]' },
    forma: { livello: 'ipotesi', nota: 'edificio ricostruito' },
    testo: 'Qui, dopo il 10 febbraio, gli amici e i parenti di Oddo Arrighi si riunirono per decidere che cosa fare di Buondelmonte. Le proposte furono bastonarlo, sfregiarlo o ucciderlo. Mosca dei Lamberti chiuse il consiglio con «cosa fatta cappa à»: una cosa fatta fino in fondo non si può più disfare. All\'Inferno, nei versi di Dante, è Mosca stesso a ricordare di averlo detto: «Capo ha cosa fatta». Nel Trecento, nello stesso luogo, ebbe sede la Parte Guelfa.',
    fonti: ['Pseudo-Brunetto, ed. Schiaffini p. 118; Faini p. 15', 'Dante, Inferno XXVIII 103–111', 'Sede della Parte Guelfa: Faini p. 17']
  },
  {
    id: 'mannelli',
    nome: 'La torre dei Mannelli',
    pos: [-36, 75], raggio: 10,
    luogo: { livello: 'dedotto', nota: 'torre superstite al capo d\'Oltrarno del ponte; datazione [da verificare]' },
    forma: { livello: 'ipotesi', nota: 'altezza e coronamento ipotetici' },
    testo: 'Dall\'altra parte del ponte. Molto più tardi, nel 1565, i Mannelli rifiuteranno di farla attraversare dal corridoio vasariano, che le gira intorno [da verificare]. Ai Mannelli appartiene anche il committente del codice Chigi con la miniatura del delitto (dossier, § 4).',
    fonti: ['Dossier storico, § 4 (codice Chigi L.VIII.296)', 'Corridoio vasariano: [da verificare]']
  },
  {
    id: 'strade',
    nome: 'Strade di terra',
    pos: [30, -110], raggio: 18,
    luogo: { livello: 'dedotto', nota: 'tracciato di via Por Santa Maria, sopravvissuto fino a oggi' },
    forma: { livello: 'dedotto', nota: 'fondo in terra battuta' },
    testo: 'Nel 1216 le strade di Firenze sono quasi tutte di terra. Sarà il podestà Rubaconte da Mandello, nel 1237, a farle lastricare, «che prima n\'erano poche lastricate». La larghezza delle strade nel modello è un\'ipotesi.',
    fonti: ['G. Villani, Nuova Cronica VI [da verificare: capitolo e citazione esatta]']
  },
  {
    id: 'fiume',
    nome: 'L\'Arno senza lungarni',
    pos: [-60, -40], raggio: 22,
    luogo: { livello: 'documentato', nota: 'il letto del fiume è quello di oggi, da OpenStreetMap' },
    forma: { livello: 'ipotesi', nota: 'rive naturali e case sull\'acqua: i lungarni sono successivi [da verificare: date dei singoli tratti]' },
    testo: 'Gli argini e i lungarni che vedi oggi sono in gran parte dell\'Ottocento. Nel 1216 le case scendono fino all\'acqua, con gli sporti di legno sul fiume. Le rive sono in terra, ghiaia ed erba. Il contorno del letto è quello di oggi, quindi più stretto e più regolare di allora.',
    fonti: ['Contorno del fiume: © OpenStreetMap contributors (ODbL)', 'Storia dei lungarni: [da verificare]']
  },
  {
    id: 'case',
    nome: 'Le case di questo modello',
    pos: [-40, -96], raggio: 20,
    luogo: { livello: 'ipotesi', nota: 'i lotti sono generati lungo le strade, non rilevati' },
    forma: { livello: 'ipotesi', nota: 'tipi edilizi presi dall\'architettura fiorentina del Due e Trecento' },
    testo: 'Le case-torri, gli sporti di legno sulle strade, le botteghe al piano terra con l\'arco largo: sono i tipi della Firenze del Duecento. Ma ogni singola casa che vedi è generata dal programma. Le botteghe sono chiuse perché è Pasqua. Solo le torri con un nome hanno l\'impronta di una torre vera.',
    fonti: ['Tipi edilizi: G. Fanelli, Firenze. Architettura e città, 1973 [da verificare: pagine]']
  },
  {
    id: 'battistero',
    nome: 'Il Battistero di San Giovanni',
    pos: [128, -542], raggio: 30,
    luogo: { livello: 'documentato', nota: 'esiste da prima del 1216' },
    forma: { livello: 'dedotto', nota: 'volume e rivestimento in marmo bianco e verde; la lanterna è del 1150 [da verificare]' },
    testo: 'Da qui si vede soltanto sopra i tetti. È il cuore religioso e civico della città: i fiorentini vi sono battezzati tutti.',
    fonti: ['[da verificare] su una guida scientifica']
  }
];
