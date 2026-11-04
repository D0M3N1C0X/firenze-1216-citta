/* =====================================================================
   CHE COSA RESTA DEL 1216

   Per ogni luogo della storia, che cosa si trova oggi in quel punto.
   Stesse regole delle schede del 1216 (dati/luoghi.js): la fonte accanto
   a ogni affermazione, [da verificare] dove il controllo non c'è stato.

   «resta» è una di queste parole:
     si         c'è ancora, anche se restaurato o cambiato
     parte      il luogo c'è, ma ciò che si vede è in gran parte più tardo
     no         non c'è più
     incerto    non è stato ancora verificato: si dice così, non si indovina
     inventato  il luogo è un'invenzione del modello o del gioco

   La traduzione è in dati/inglese.js (OGGI_EN), e la verifica controlla
   che ci sia. Letture di Wikipedia del novembre 2026: sono fonti di
   comodo, da riscontrare su fonti scientifiche.
   ===================================================================== */

const PV = 'Wikipedia, «Ponte Vecchio», novembre 2026 [da verificare su fonte scientifica]';
const POR = 'Wikipedia, «Via Por Santa Maria», novembre 2026 [da verificare su fonte scientifica]';
const MV = 'Wikipedia, «Mercato Vecchio», novembre 2026 [da verificare su fonte scientifica]';

export const COLORI_RESTA = { si: '#2f7d48', parte: '#ad6c14', no: '#b4503f', incerto: '#75726b', inventato: '#7a6aa8' };

export const OGGI_LUOGHI = {
  'capo-ponte': {
    resta: 'parte',
    testo: 'Il punto c\'è ancora: è dove via Por Santa Maria arriva al Ponte Vecchio. Intorno però non resta nulla del 1216, e nemmeno dei secoli dopo. Nella notte tra il 3 e il 4 agosto 1944 le mine dell\'esercito tedesco in ritirata rasero al suolo la via e il lungarno. Le case che vedi sono del dopoguerra.',
    fonti: [PV, POR]
  },
  marte: {
    resta: 'no',
    testo: 'Non c\'è più. La pietra scomparve con la piena del 1333 [da verificare: Villani XII, 1]. Oggi in questo punto passano la strada e il lungarno.',
    fonti: ['La scomparsa nel 1333: vedi la scheda del 1216']
  },
  ponte: {
    resta: 'parte',
    testo: 'Il luogo è lo stesso, il ponte è un altro. Questo è quello rifatto dopo la piena del 1333 e finito nel 1345, a tre arcate. Nel 1495 il Comune vendette quarantotto botteghe ai privati, che le allargarono verso il fiume. Sopra corre il Corridoio Vasariano, del 1565. Nell\'agosto 1944 fu l\'unico ponte di Firenze che i tedeschi non fecero saltare.',
    fonti: [PV, 'Wikipedia, «Corridoio Vasariano», novembre 2026 [da verificare su fonte scientifica]']
  },
  amidei: {
    resta: 'parte',
    testo: 'La torre è qui, in via Por Santa Maria, ma non è quella originale: le mine dell\'agosto 1944 la distrussero quasi del tutto, e fu rifatta su fotografie e disegni, con la direzione di Guido Morozzi. È detta anche torre dei Leoni per le due teste sulla facciata: solo quella di sinistra è antica.',
    fonti: ['Wikipedia, «Torre degli Amidei», novembre 2026 [da verificare su fonte scientifica]']
  },
  'santo-stefano': {
    resta: 'si',
    testo: 'La chiesa c\'è ancora, con il portale di marmo bianco e verde del 1233 circa. Fu colpita dalla guerra e dall\'alluvione del 1966, e subì gravi danni con l\'attentato di via dei Georgofili del 27 maggio 1993. Dal 1986 non è più parrocchia; dal 2015 ospita mostre, e vi si tengono concerti.',
    fonti: ['Wikipedia, «Chiesa di Santo Stefano al Ponte», novembre 2026 [da verificare su fonte scientifica]']
  },
  'santi-apostoli': {
    resta: 'si',
    testo: 'La chiesa c\'è ancora, in piazza del Limbo, lungo borgo Santi Apostoli [da verificare: quanto di ciò che si vede è già del 1216].',
    fonti: ['I nomi della piazza e del borgo: OpenStreetMap']
  },
  'porta-santa-maria': {
    resta: 'no',
    testo: 'La porta non c\'è più: resta nel nome di via Por Santa Maria. Anche le case della strada sono nuove: le mine del 1944 rasero al suolo tutta la cortina, e la via fu ricostruita tra la fine degli anni Quaranta e i primi anni Cinquanta.',
    fonti: [POR]
  },
  'santa-maria-sopra-porta': {
    resta: 'parte',
    testo: 'Al suo posto c\'è un edificio più tardo. La chiesa fu rifatta nella seconda metà del Duecento e dedicata a san Biagio, forse per lasciarsi alle spalle il ricordo delle lotte tra le famiglie. Oggi è sconsacrata ed è la biblioteca del Palagio di Parte Guelfa.',
    fonti: ['Wikipedia, «Chiesa di Santa Maria Sopra Porta», novembre 2026 [da verificare su fonte scientifica]']
  },
  mannelli: {
    resta: 'si',
    testo: 'La torre è ancora qui, al capo d\'Oltrarno del ponte, con il rivestimento di pietra a vista. Le mine del 1944 la danneggiarono ma non irreparabilmente, e la restaurò Nello Baroni. Il Corridoio Vasariano le gira ancora intorno, sospeso sui beccatelli.',
    fonti: ['Wikipedia, «Torre dei Mannelli» e «Corridoio Vasariano», novembre 2026 [da verificare su fonte scientifica]']
  },
  strade: {
    resta: 'parte',
    testo: 'Oggi le strade del centro sono lastricate di pietra. Molti tracciati sono ancora quelli del Medioevo [da verificare], ma non tutti: attorno a piazza della Repubblica la rete fu rifatta alla fine dell\'Ottocento.',
    fonti: [MV]
  },
  fiume: {
    resta: 'no',
    testo: 'Le rive di terra non ci sono più. Oggi l\'Arno corre tra i muraglioni e i lungarni, in gran parte dell\'Ottocento [da verificare: le date dei singoli tratti]. Il muro che vedi è semplificato: quello vero è quasi verticale.',
    fonti: ['La data dei lungarni: vedi la scheda del 1216']
  },
  case: {
    resta: 'parte',
    testo: 'Le case che vedi adesso sono quelle di oggi: forma e altezza misurate dalla Regione Toscana nel 2011, finestre e tetti disegnati. Del Duecento restano soprattutto torri mozzate e pezzi di muro dentro case più recenti [da verificare].',
    fonti: ['Regione Toscana, «Edificato multiscala», unità volumetriche (volo dell\'8 marzo 2011), licenza CC BY']
  },
  battistero: {
    resta: 'si',
    testo: 'È lo stesso edificio del 1216. Intanto sono arrivati i mosaici e le tre porte di bronzo: quelle che vedi oggi sono copie, e gli originali sono nel Museo dell\'Opera del Duomo. Il disegno dei marmi in questo modello è generico, non quello vero.',
    fonti: ['Wikipedia, «Battistero di San Giovanni (Firenze)», novembre 2026 [da verificare su fonte scientifica]']
  },
  'case-donati': {
    resta: 'incerto',
    testo: 'Non l\'abbiamo ancora verificato: non sappiamo se di queste case resti qualcosa di riconoscibile [da verificare].',
    fonti: []
  },
  'case-buondelmonti': {
    resta: 'incerto',
    testo: 'Non l\'abbiamo ancora verificato: non sappiamo se di queste case resti qualcosa di riconoscibile [da verificare].',
    fonti: []
  },
  'case-uberti': {
    resta: 'no',
    testo: 'Non ci sono più. Dopo la vittoria di Benevento i guelfi demolirono le case dei ghibellini, e intorno al 1268 cominciò a formarsi piazza della Signoria. Gli Uberti stavano nella parte nord della piazza. Oggi qui vedi la piazza e Palazzo Vecchio.',
    fonti: ['Wikipedia, «Piazza della Signoria», novembre 2026 [da verificare su fonte scientifica]']
  },
  'case-lamberti': {
    resta: 'incerto',
    testo: 'Non l\'abbiamo ancora verificato: non sappiamo se di queste case resti qualcosa di riconoscibile [da verificare].',
    fonti: []
  },
  'torre-fifanti': {
    resta: 'incerto',
    testo: 'Non l\'abbiamo ancora verificato: non sappiamo se di questa torre resti qualcosa di riconoscibile [da verificare].',
    fonti: []
  },
  'mercato-vecchio': {
    resta: 'no',
    testo: 'Non c\'è più. Fu demolito tra il 1885 e il 1895, insieme al vecchio Ghetto, per fare piazza della Repubblica: lo chiamarono risanamento. Resta la colonna dell\'Abbondanza, rimessa al suo posto nel 1956, dove si incontravano le due strade principali della città romana. Nel modello la colonna non c\'è ancora.',
    fonti: [MV]
  },
  cambiatori: {
    resta: 'no',
    testo: 'Non c\'è più nulla: questo lato del Mercato Vecchio fu demolito con il resto tra il 1885 e il 1895. Oggi è piazza della Repubblica.',
    fonti: [MV]
  },
  calimala: {
    resta: 'parte',
    testo: 'La strada c\'è ancora e si chiama ancora Calimala, ma le botteghe dei panni no. Le case intorno furono in gran parte rifatte con il risanamento di fine Ottocento [da verificare].',
    fonti: ['Il nome della strada: OpenStreetMap', MV]
  },
  fucina: {
    resta: 'inventato',
    testo: 'Questo punto è un\'invenzione del modello: non sappiamo dove lavorassero i fabbri nel 1216, quindi oggi non c\'è niente da cercare.',
    fonti: []
  },
  cerchia: {
    resta: 'no',
    testo: 'Il muro del 1172–75 non si vede più: la città lo superò con la cerchia più grande cominciata alla fine del Duecento [da verificare: se ne restano tratti dentro altri edifici]. Ne resta il percorso, nel giro di alcune strade.',
    fonti: ['Il percorso: vedi la scheda del 1216']
  },
  'casa-del-notaio': {
    resta: 'inventato',
    testo: 'Il notaio e la sua casa sono un\'invenzione del gioco: non c\'è niente da cercare. Via delle Terme invece c\'è ancora.',
    fonti: ['Il nome della strada: OpenStreetMap']
  },
  'santa-reparata': {
    resta: 'parte',
    testo: 'Da fuori non si vede: sta sotto il Duomo, che l\'ha sostituita. I suoi resti furono scavati in sei campagne tra il 1965 e il 1974, e oggi si visitano entrando dalla navata destra della cattedrale.',
    fonti: ['Wikipedia, «Chiesa di Santa Reparata», novembre 2026 [da verificare su fonte scientifica]']
  }
};

/** Le porte della cerchia hanno tutte la stessa risposta. */
export const OGGI_PORTA = {
  resta: 'no',
  testo: 'La porta non c\'è più [da verificare]: la cerchia del 1172–75 fu superata da quella più grande, cominciata alla fine del Duecento. Resta la strada che ci passava.',
  fonti: ['Il percorso della cerchia: vedi la scheda del 1216']
};

/** Quello che si sa di oggi di un luogo; null a Campi, dove il modello di oggi non arriva. */
export const oggiDi = l => OGGI_LUOGHI[l.id] || (l.gruppo === 'porte' ? OGGI_PORTA : null);
