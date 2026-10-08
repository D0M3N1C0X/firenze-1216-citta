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
    luogo: { livello: 'documentato', nota: 'a capo del ponte, dal lato della città: le cronache; Dante, Par. XVI 145–147. Le fonti divergono: Vossilla (1994, da Cinelli) la mette dal lato d\'Oltrarno' },
    forma: { livello: 'ipotesi', nota: 'una statua equestre tardoromana secondo Vossilla [da verificare]; il pilastro e le rotture sono inventati' },
    testo: 'I fiorentini la chiamavano Marte e credevano che la città dipendesse da lei. Per Dante è «quella pietra scema / che guarda \'l ponte»: una statua mutila, già allora un frammento. Secondo la tradizione cadde in Arno con la piena del 1178 e fu ripescata verso il 1200. Era forse una statua equestre tardoromana, un cavaliere che i fiorentini chiamavano Marte: qui è mostrata così, spezzata, ma la forma della rottura è inventata.',
    fonti: [
      'Dante, Paradiso XVI 145–147; Inferno XIII 146–150',
      'R. Davidsohn, Storia di Firenze, via Faini p. 11 e n. 12',
      'Scomparsa con l\'alluvione del 1333 [da verificare: Villani XII, 1]',
      'Statua equestre tardoromana; la colloca in Oltrarno: F. Vossilla, «Storia d\'una fontana», Mitteilungen des Kunsthistorischen Institutes in Florenz 38 (1994), da G. Cinelli [da verificare sul testo]'
    ]
  },
  {
    id: 'ponte',
    nome: 'Il Ponte Vecchio del 1216',
    pos: [-17, 20], raggio: 30,
    luogo: { livello: 'documentato', nota: 'nel 1216 è l\'unico ponte di Firenze' },
    forma: { livello: 'ipotesi', nota: 'cinque arcate secondo le fonti divulgative, nove secondo un\'altra: le fonti divergono; larghezza e assenza di botteghe sono ipotesi' },
    testo: 'Nel 1216 l\'Arno si passa solo qui. Il ponte alla Carraia si comincia nel 1218, quello di Rubaconte nel 1237, Santa Trinita nel 1252. Questo ponte era stato ricostruito dopo il crollo per la piena del 1177, con cinque arcate [da verificare]. Il ponte che vedi oggi è un altro: fu rifatto nel 1345, dopo che la piena del 1333 aveva travolto anche questo. Di come fosse davvero non abbiamo una descrizione: arcate e carreggiata sono ricostruite per analogia.',
    fonti: [
      'Date dei ponti: G. Villani, Nuova Cronica [da verificare: capitoli]',
      'Crollo del 1177 e cinque arcate: Wikipedia, «Ponte Vecchio» [da verificare su fonte scientifica]',
      'Ricostruzione del 1345 [da verificare: fonte scientifica]'
    ]
  },
  {
    id: 'amidei',
    nome: 'La torre degli Amidei',
    pos: [15, -61], raggio: 10,
    luogo: { livello: 'dedotto', nota: 'la torre che oggi porta il nome degli Amidei; i congiurati si riunirono «in casa gli Amidei da Santo Stefano» (Villani; Faini p. 11)' },
    forma: { livello: 'dedotto', nota: 'porte a doppia ghiera, leoni di marmo, filaretto e finestre dalla torre di oggi, ricostruita sulle fotografie dopo il 1944; l\'altezza del 1216 è un\'ipotesi' },
    testo: 'È uno dei punti fermi del modello: l\'impronta viene dalla torre di oggi, in via Por Santa Maria. Nel 1216 le torri potevano essere molto più alte di adesso. Furono mozzate dal governo del Primo Popolo intorno al 1250, a 50 braccia, circa 29 metri [da verificare]. L\'altezza che vedi è quindi un\'ipotesi.',
    fonti: [
      'G. Villani, Nuova Cronica VI, 38, citato da Faini p. 11',
      'Pseudo-Brunetto: l\'agguato preparato in casa Amidei (Faini p. 15)',
      'Mozzatura delle torri: Villani VII [da verificare]',
      'La torre di oggi, documentata dal 1241: Wikipedia, «Torre degli Amidei», da E. Pieri, Firenze. Guida di architettura (1992)'
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
    luogo: { livello: 'ipotesi', nota: 'le fonti divergono: all\'altezza di via Vacchereccia, oppure all\'incrocio con borgo Santi Apostoli e via Lambertesca (DOSSIER-TOPOGRAFICO.md, § 2)' },
    forma: { livello: 'ipotesi', nota: 'una torre di porta con il fornice ad arco: nessuna porta della cerchia del 1172–75 è sopravvissuta' },
    testo: 'Il 10 febbraio 1216 Buondelmonte entra in città da Porta Santa Maria per andare a giurare la donna dei Donati, invece dell\'Amidei. Ma quale porta? Le fonti la collocano in due punti diversi di via Por Santa Maria: all\'altezza di via Vacchereccia, dove correva la cinta più antica, oppure più vicino al ponte, all\'incrocio con borgo Santi Apostoli e via Lambertesca, sulla cerchia del 1172–1175. Forse erano due porte con lo stesso nome. Qui è mostrata la prima: è una delle domande per il medievista.',
    fonti: ['Pseudo-Brunetto, ed. Schiaffini p. 118; Faini pp. 14–16', 'Posizione: Wikipedia, «Via Por Santa Maria» e «Mura di Firenze», da Bargellini-Guarnieri [da verificare]', 'Domanda per il medievista: DOSSIER-TOPOGRAFICO.md, n. 34']
  },
  {
    id: 'santa-maria-sopra-porta',
    nome: 'Santa Maria sopra Porta',
    pos: [15, -178], raggio: 12,
    luogo: { livello: 'dedotto', nota: 'oggi San Biagio, in piazza di Parte Guelfa; documentata dal 1038, rifatta nella seconda metà del Duecento, forse più vicino a via Por Santa Maria e con un altro orientamento (Bargellini-Guarnieri) [da verificare]' },
    forma: { livello: 'ipotesi', nota: 'chiesa romanica a navata unica, per analogia con le chiese fiorentine coeve' },
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
  },
  /* --- dal 2 ottobre 2026: le case delle famiglie, il mercato, la cattedrale --- */
  {
    id: 'case-donati',
    nome: 'Le case dei Donati',
    pos: [276, -338], raggio: 18,
    luogo: { livello: 'dedotto', nota: 'la torre che oggi porta il nome dei Donati, presso piazza dei Donati e il Corso [da verificare: se qui abitavano Forese e Gualdrada nel 1216]' },
    forma: { livello: 'ipotesi', nota: 'l\'impronta della torre è reale; alzato e case intorno sono ricostruiti' },
    testo: 'Madonna Gualdrada, moglie di messer Forese Donati, chiamò in segreto Buondelmonte e gli mostrò la propria figlia: «Cavaliere vituperato, hai preso moglie per paura degli Uberti e dei Fifanti». Dove avvenne la chiamata le fonti non lo dicono. Il 10 febbraio Buondelmonte giurò la figlia dei Donati invece della promessa degli Amidei. Le fonti divergono sul nome della donna: Gualdrada moglie di Forese nello pseudo-Brunetto, Aldruda moglie di Forteguerra in Compagni.',
    fonti: [
      'Pseudo-Brunetto, ed. Schiaffini p. 118; Faini p. 14',
      'D. Compagni, Cronica I, 2; Faini p. 12',
      'Impronta della torre: © OpenStreetMap contributors (ODbL)'
    ]
  },
  {
    id: 'case-buondelmonti',
    nome: 'Le case dei Buondelmonti',
    pos: [-318, 276], raggio: 30,
    luogo: { livello: 'dedotto', nota: 'nel popolo di San Felice in Piazza, in Oltrarno (Stefani; Faini p. 23); il punto preciso non lo conosciamo' },
    forma: { livello: 'ipotesi', nota: 'case generate; la strada verso San Felice è tracciata a mano' },
    testo: 'Buondelmonte del fu Tegliaio aveva casa in Oltrarno, nel popolo di San Felice in Piazza; la famiglia teneva ancora il castello di Montebuoni, fuori città. Nel 1216 non era un ragazzo: era vedovo di una certa Ghisola. La mattina di Pasqua veniva da qui e passò il ponte. Al di qua dell\'Arno c\'è anche una torre che oggi porta il nome dei Buondelmonti [da verificare: datazione e rapporto con il ramo di Buondelmonte].',
    fonti: [
      'M. di Coppo Stefani, Cronaca fiorentina, rubr. 64; Faini p. 23',
      'G. Villani, Nuova Cronica VI, 38; Faini p. 11',
      'Documenti d\'archivio del 1212–1214 citati da Faini pp. 21, 23'
    ]
  },
  {
    id: 'case-uberti',
    nome: 'Le case degli Uberti',
    pos: [165, -150], raggio: 35,
    luogo: { livello: 'dedotto', nota: 'dove alla fine del Duecento si apriranno la piazza e il palazzo dei Priori, sulle case abbattute degli Uberti [da verificare: Villani, date]' },
    forma: { livello: 'ipotesi', nota: 'case e torri generate' },
    testo: 'Gli Uberti sono una delle grandi casate aristocratiche della città, parenti e alleati di Oddo Arrighi. Messer Schiatta degli Uberti è quello che, la mattina di Pasqua, abbatte Buondelmonte da cavallo con una mazza. Dopo il 1258 il Comune farà abbattere le loro case, e al loro posto nascerà a poco a poco la piazza della Signoria [da verificare: date]. Nel 1216 qui non c\'è nessuna piazza.',
    fonti: [
      'Pseudo-Brunetto: Schiatta degli Uberti e la mazza; Faini p. 15',
      'Le case abbattute e la piazza dei Priori: G. Villani [da verificare: libro e capitolo]'
    ]
  },
  {
    id: 'case-lamberti',
    nome: 'Le case dei Lamberti',
    pos: [60, -264], raggio: 22,
    luogo: { livello: 'dedotto', nota: 'due strade portano ancora il nome della famiglia: via dei Lamberti, presso Orsanmichele, e via Lambertesca [da verificare: dove erano le case nel 1216]' },
    forma: { livello: 'ipotesi', nota: 'case generate' },
    testo: 'Mosca dei Lamberti era l\'uomo più autorevole del gruppo: nel consiglio di Santa Maria sopra Porta fu lui a chiudere la discussione con «cosa fatta cappa à». Negli anni seguenti fu podestà di Viterbo, di Todi e di Reggio, dove morì nel 1243. Dante lo mette all\'Inferno tra i seminatori di discordia.',
    fonti: [
      'La carriera di Mosca: Faini p. 21',
      'Pseudo-Brunetto, ed. Schiaffini p. 118; Faini pp. 15–16',
      'Dante, Inferno XXVIII 103–111',
      'Toponimi: © OpenStreetMap contributors (ODbL)'
    ]
  },
  {
    id: 'torre-fifanti',
    nome: 'La torre dei Fifanti',
    pos: [-42, 170], raggio: 12,
    luogo: { livello: 'dedotto', nota: 'la torre che oggi porta il nome dei Fifanti, in Oltrarno [da verificare: datazione e rapporto con Oddo Arrighi]' },
    forma: { livello: 'ipotesi', nota: 'impronta reale; altezza e coronamento ipotetici' },
    testo: 'Messer Oddo Arrighi dei Fifanti è la parte offesa. Ferito da Buondelmonte al convito di Campi, riunisce i suoi per decidere la pace con il matrimonio e, dopo la promessa rotta, la vendetta. La mattina di Pasqua è lui a dare il colpo finale. Morirà nei primi anni Quaranta del Duecento, ucciso dai Buondelmonti in uno scontro a Campi.',
    fonti: [
      'Faini pp. 14–16, 19–20',
      'Impronta della torre: © OpenStreetMap contributors (ODbL)'
    ]
  },
  {
    id: 'mercato-vecchio',
    nome: 'Il Mercato Vecchio',
    pos: [63, -365], raggio: 32,
    luogo: { livello: 'dedotto', nota: 'il mercato sul luogo del foro romano, dove oggi è piazza della Repubblica [da verificare: prima attestazione del nome]' },
    forma: { livello: 'ipotesi', nota: 'forma, misure e banchi ricostruiti: il quartiere fu demolito nel 1885–1895' },
    testo: 'Il cuore commerciale della città, nel punto dove si incrociavano le strade della Firenze romana. Nei giorni feriali i banchi si riempiono di merce; a Pasqua la piazza è vuota. Alla fine dell\'Ottocento il quartiere fu demolito per aprire l\'attuale piazza della Repubblica: per ricostruirlo servono il catasto e le fotografie di prima dello sventramento.',
    fonti: [
      'Sventramento del Mercato Vecchio, 1885–1895 [da verificare: date]',
      'Catasto generale toscano, progetto CASTORE della Regione Toscana [da verificare: licenza]',
      'F. Sznura, L\'espansione urbana di Firenze nel Dugento, 1975 [da verificare]'
    ]
  },
  {
    id: 'cerchia',
    nome: 'La cerchia del 1172–1175',
    pos: [-334, 286], raggio: 14,
    luogo: { livello: 'dedotto', nota: 'la cerchia è certa, il tracciato no: nel modello è disegnato a mano (dati/cerchia.js)' },
    forma: { livello: 'ipotesi', nota: 'porta, muro, altezze e merli sono ricostruiti' },
    testo: 'Tra il 1172 e il 1175 il Comune costruì una cerchia molto più ampia di quella del 1078: per la prima volta comprendeva l\'Oltrarno, e con lei la città si divise in sei sestieri. Nel 1216 è il muro che chiude Firenze. Il tracciato si legge ancora nella forma delle strade, ma i resti sono rarissimi. Nel modello il muro si vede soltanto da lontano: dove la città si percorre a piedi non è disegnato, per non costruirci sopra un\'ipotesi. C\'è solo questa porta, sulla strada per San Felice e per Roma.',
    fonti: [
      'Date e sestieri: sintesi consultate in rete il 2 ottobre 2026 [da verificare: Sznura 1975; Fanelli 1973; Davidsohn]',
      'Date di inizio: 1172 o 1173, le fonti divergono [da verificare]',
      'Sei porte e quattro postierle [da verificare]',
      'Porta di San Pier Gattolino: attestata per la cerchia duecentesca d\'Oltrarno [da verificare: se esisteva nel 1216 e dove stava]'
    ]
  },
  {
    id: 'santa-reparata',
    nome: 'Santa Reparata',
    pos: [150, -560], raggio: 22,
    luogo: { livello: 'documentato', nota: 'la cattedrale di Firenze nel 1216; i resti sono sotto il Duomo, nell\'area archeologica' },
    forma: { livello: 'ipotesi', nota: 'basilica a tre navate con misure e facciata ricostruite [da verificare: rilievi degli scavi]' },
    testo: 'La mattina di Pasqua il notaio del gioco può essere qui, alla messa, quando arriva la notizia dal ponte. Il giorno dopo, l\'11 aprile, l\'obituario della cattedrale registra soltanto: «Obiit Dominus Bondelmonte», è morto messer Buondelmonte. Né come, né per mano di chi. Il Duomo che vediamo oggi sarà cominciato sopra questa chiesa alla fine del Duecento [da verificare: 1296].',
    fonti: [
      'Obituario di Santa Reparata: R. Davidsohn, Forschungen IV, p. 53; Faini n. 38',
      'Area archeologica di Santa Reparata: Opera di Santa Maria del Fiore'
    ]
  }
];
