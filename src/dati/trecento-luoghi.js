/* =====================================================================
   NEL 1300: I CRONISTI NEI LUOGHI

   Il racconto della Firenze del 1300 (PIANO-1300.md, § 4): per i luoghi
   della storia del 1216, che cosa ne è nel 1300 e chi lo racconta, con le
   sue parole; e i luoghi nuovi del 1300, con la loro scheda.

   Le parole dei cronisti sono state lette sul testo il 6 novembre 2026, su
   Wikisource: Villani nella Nuova Cronica (numerazione dell'edizione di
   G. Porta), Compagni nella Cronica (ed. Barbèra 1860, citata per pagina),
   Dante nella Commedia. Le date dei racconti sono la tesi: nel 1300 nessuno
   dei tre ha ancora scritto. Villani comincia «negli anni MCCC tornato da
   Roma» (IX, 36), Compagni scrive tra il 1310 e il 1312, la Commedia è
   scritta dal 1306 circa al 1321 [da verificare: le date di Dante].

   Ogni testo ha la traduzione inglese accanto; la verifica del 1300
   controlla che ci sia (scripts/verifica-1300.mjs). Le citazioni restano
   in italiano antico, anche nella versione inglese, con una parafrasi.
   ===================================================================== */

const NC = 'G. Villani, Nuova Cronica, ed. G. Porta (1990–91), letta su Wikisource il 6/11/2026';
const DC = 'D. Compagni, Cronica delle cose occorrenti ne\' tempi suoi, ed. Barbèra 1860, letta su Wikisource il 6/11/2026';
const DA = 'Dante, Commedia, letta su Wikisource il 6/11/2026';

/** Per i luoghi del 1216: che cosa ne è nel 1300, e chi lo racconta. */
export const TRECENTO = {
  'capo-ponte': {
    testo: 'Nel 1300 il capo del ponte è lo stesso, e la pietra di Marte è ancora sul suo pilastro. Del delitto si racconta però un\'altra cosa: non più una vendetta fra famiglie, ma l\'inizio delle parti guelfa e ghibellina. Lo scrive Villani, che comincia la sua cronaca proprio nel 1300, tornato da Roma.',
    en: 'In 1300 the head of the bridge is the same, and the stone of Mars still stands on its pillar. But the murder is now told differently: no longer a vendetta between families, but the beginning of the Guelf and Ghibelline parties. Villani writes so; he begins his chronicle in 1300, back from Rome.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VI, 38', parole: '«questa morte di messere Bondelmonte fu la cagione e cominciamento delle maladette parti guelfa e ghibellina in Firenze, con tutto che dinanzi assai erano le sette tra\' nobili cittadini»', en: 'this death was the cause and beginning of the cursed parties, even though factions among the nobles existed long before' }
    ],
    fonti: [`${NC}: VI, 38; IX, 36 («negli anni MCCC tornato da Roma, cominciai a compilare questo libro»)`]
  },
  marte: {
    testo: 'Nel 1300 la statua è ancora lì: cadrà in Arno con la piena del 1333. Dante la ricorda come il punto in cui Firenze, uccidendo Buondelmonte, perse la sua pace.',
    en: 'In 1300 the statue is still there: it will fall into the Arno in the flood of 1333. Dante remembers it as the place where Florence, by killing Buondelmonte, lost its peace.',
    racconta: [
      { chi: 'Dante', dove: 'Paradiso XVI, 145–147', parole: '«Ma conveniesi, a quella pietra scema / che guarda \'l ponte, che Fiorenza fesse / vittima ne la sua pace postrema»', en: 'but it was fitting that Florence, in her last peace, should offer a victim to that broken stone that watches the bridge' },
      { chi: 'Villani', dove: 'Nuova Cronica XII, 1', parole: '«E cadde in Arno la statua di Mars, ch\'era in sul pilastro a piè del detto ponte Vecchio di qua»', en: 'and the statue of Mars, which stood on the pillar at the foot of the Ponte Vecchio on this side, fell into the Arno (1333)' }
    ],
    fonti: [`${DA}: Paradiso XVI, 145–147`, `${NC}: XII, 1`]
  },
  ponte: {
    testo: 'Nel 1216 il Ponte Vecchio era l\'unico ponte. Nel 1300 ce ne sono quattro: il ponte alla Carraia (1218–1220), il ponte Rubaconte (1237) e il ponte Santa Trinita (1252). Com\'era il Ponte Vecchio nel 1300, e se avesse già le botteghe che c\'erano nel 1333, non lo sappiamo (lacuna 66).',
    en: 'In 1216 the Ponte Vecchio was the only bridge. In 1300 there are four: the Carraia bridge (1218–1220), the Rubaconte bridge (1237) and the Santa Trinita bridge (1252). What the Ponte Vecchio looked like in 1300, and whether it already had the shops it had in 1333, we do not know (gap 66).',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VI, 42', parole: '«si compié di fare il ponte alla Carraia, il quale si chiamava il ponte Nuovo, però che allora la città di Firenze nonn-avea che due ponti»', en: 'the Carraia bridge was finished, called the New Bridge, because then Florence had only two bridges (1220)' }
    ],
    fonti: [`${NC}: VI, 41–42; VII, 26; VII, 50; XII, 1`]
  },
  amidei: {
    testo: 'La torre c\'è ancora, ma più bassa: nel 1250 il Primo Popolo fece tagliare tutte le torri a cinquanta braccia, circa 29 metri. Per Dante la casa degli Amidei è quella da cui nacque il pianto di Firenze.',
    en: 'The tower is still there, but lower: in 1250 the First People had every tower cut down to fifty braccia, about 29 metres. For Dante the house of the Amidei is the one from which Florence\'s weeping was born.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VII, 39', parole: '«tutte le torri di Firenze, che ce n\'avea grande quantità alte CXX braccia, si tagliassono e tornassono alla misura di L braccia e non più»', en: 'all the towers of Florence, many of them a hundred and twenty braccia high, were to be cut down to fifty braccia and no more' },
      { chi: 'Dante', dove: 'Paradiso XVI, 136–138', parole: '«La casa di che nacque il vostro fleto, / per lo giusto disdegno che v\'ha morti / e puose fine al vostro viver lieto»', en: 'the house from which your weeping was born, through the just anger that has slain you and ended your happy life' }
    ],
    fonti: [`${NC}: VII, 39`, `${DA}: Paradiso XVI, 136–138`]
  },
  'santa-maria-sopra-porta': {
    testo: 'Qui, secondo la tradizione, le famiglie decisero la morte di Buondelmonte. Nel racconto di Dante la frase che la decise è di Mosca dei Lamberti; nella cronaca di Compagni la dicono gli Uberti, tutti insieme. È lo stesso proverbio, messo in bocca a persone diverse.',
    en: 'Here, according to tradition, the families decided Buondelmonte\'s death. In Dante the sentence that decided it belongs to Mosca dei Lamberti; in Compagni\'s chronicle the Uberti say it, all together. It is the same proverb, put in different mouths.',
    racconta: [
      { chi: 'Dante', dove: 'Inferno XXVIII, 106–108', parole: '«Ricordera\' ti anche del Mosca, / che disse, lasso!, \'Capo ha cosa fatta\', / che fu mal seme per la gente tosca»', en: 'remember Mosca too, who said, alas, «a thing done has an end», which was an evil seed for the Tuscan people' },
      { chi: 'Compagni', dove: 'Cronica I, ed. 1860 p. 30', parole: '«Il che sentendo gli Uberti... dissono voleano fosse morto; chè così fia grande l\'odio della morte come delle ferite: cosa fatta capo ha»', en: 'the Uberti said they wanted him dead, since the hatred would be as great for a death as for wounds: a thing done has an end' }
    ],
    fonti: [`${DA}: Inferno XXVIII, 106–108`, `${DC}, p. 30`]
  },
  'case-buondelmonti': {
    testo: 'Per Dante, ottant\'anni dopo, il guaio cominciò da una promessa rotta: se Buondelmonte avesse sposato la ragazza degli Amidei, molti sarebbero ancora lieti.',
    en: 'For Dante, eighty years later, the trouble began with a broken promise: had Buondelmonte married the Amidei girl, many would still be happy.',
    racconta: [
      { chi: 'Dante', dove: 'Paradiso XVI, 140–144', parole: '«o Buondelmonte, quanto mal fuggisti / le nozze süe per li altrui conforti! / Molti sarebber lieti, che son tristi, / se Dio t\'avesse conceduto ad Ema / la prima volta ch\'a città venisti»', en: 'O Buondelmonte, how wrongly you fled her wedding at others\' urging! Many who are sad would be happy, had God given you to the river Ema the first time you came to the city' }
    ],
    fonti: [`${DA}: Paradiso XVI, 140–144`]
  },
  'case-uberti': {
    testo: 'Le case degli Uberti non ci sono più. Nel 1258 il popolo le assalì, e gli Uberti furono cacciati; le case furono abbattute e lasciate in rovina, perché non si ricostruissero mai. Nel 1300 qui c\'è un guasto, un vuoto di macerie, e accanto il cantiere del palazzo dei Priori, messo storto per non posarlo sul loro terreno.',
    en: 'The Uberti houses are gone. In 1258 the people attacked them and the Uberti were driven out; the houses were pulled down and left in ruins, so that they would never be rebuilt. In 1300 there is a waste ground of rubble here, and next to it the building site of the Priors\' palace, set askew so as not to stand on their land.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VII, 65', parole: '«a·ffurore corsono alle case degli Uberti, ov\'è oggi la piazza del palagio del popolo e de\' priori»', en: 'in fury they ran to the houses of the Uberti, where the square of the palace of the People and the Priors is today (1258)' },
      { chi: 'Villani', dove: 'Nuova Cronica IX, 26', parole: '«di que\' loro casolari feciono piazza, acciò che mai non si rifacessono»', en: 'they made a square of their ruined houses, so that they would never be rebuilt' }
    ],
    fonti: [`${NC}: VII, 65; IX, 26`]
  },
  'case-donati': {
    testo: 'Nel 1300 i Donati, con messer Corso, sono a capo di una delle due parti in cui si divide la città: quella che si chiamerà dei Neri. Alla zuffa di Calendimaggio, in piazza Santa Trinita, c\'era con la brigata dei Donati un nipote di messer Corso.',
    en: 'In 1300 the Donati, led by messer Corso, head one of the two parties into which the city is splitting: the one that will be called the Blacks. At the Calendimaggio brawl in piazza Santa Trinita, a nephew of messer Corso rode with the Donati band.',
    racconta: [
      { chi: 'Compagni', dove: 'Cronica I, ed. 1860 p. 62', parole: '«I giovani de\' Cerchi si riscontrorono con la brigata de\' Donati, tra i quali era uno nipote di messer Corso e Bardellino de\' Bardi e Piero Spini»', en: 'the young Cerchi met the Donati band, among whom were a nephew of messer Corso, Bardellino de\' Bardi and Piero Spini' }
    ],
    fonti: [`${DC}, p. 62`, `${NC}: IX, 39`]
  },
  'santa-reparata': {
    testo: 'Nel 1300 la cattedrale vecchia è ancora in piedi, ma intorno è cominciato il cantiere di quella nuova, più grande e tutta di marmi. Il nome nuovo, Santa Maria del Fiore, il popolo non lo usò mai. Sull\'anno dell\'inizio le fonti divergono: Villani dice 1294, la data comune è l\'8 settembre 1296 (lacuna 74).',
    en: 'In 1300 the old cathedral still stands, but around it the building site of the new one has begun, larger and all of marble. The people never used the new name, Santa Maria del Fiore. The sources disagree on the year it began: Villani says 1294, the usual date is 8 September 1296 (gap 74).',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica IX, 9', parole: '«consagrossi ad onore d\'Iddio e di santa Maria, nominandola Santa Maria del Fiore, con tutto che mai no·lle si mutò il primo nome per l\'universo popolo, Santa Reparata»', en: 'it was consecrated to God and Saint Mary, named Santa Maria del Fiore, although the people as a whole never changed its first name, Santa Reparata' }
    ],
    fonti: [`${NC}: IX, 9`]
  },
  strade: {
    testo: 'Nel 1300 le strade non sono più di terra battuta: nel 1237 il podestà Rubaconte da Mandello le fece lastricare tutte.',
    en: 'In 1300 the streets are no longer beaten earth: in 1237 the podestà Rubaconte da Mandello had them all paved.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VII, 26', parole: '«alla sua signoria si lastricarono tutte le vie di Firenze, che prima ce n\'avea poche lastricate... per lo quale acconcio e lavorio la cittade di Firenze divenne più netta, e più bella, e più sana»', en: 'under his rule all the streets of Florence were paved, where before few were... and the city became cleaner, more beautiful and healthier' }
    ],
    fonti: [`${NC}: VII, 26`]
  },
  case: {
    testo: 'Nel 1300 le torri sono tutte più basse: cinquanta braccia al massimo, circa 29 metri. Le pietre tagliate servirono a murare l\'Oltrarno. Le case sono più fitte e più alte che nel 1216 (ipotesi).',
    en: 'In 1300 all the towers are lower: fifty braccia at most, about 29 metres. The cut stones were used to wall the Oltrarno. The houses are denser and taller than in 1216 (hypothesis).',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VII, 39', parole: '«si tagliassono e tornassono alla misura di L braccia e non più, e così fu fatto; e delle pietre si murò poi la città oltrarno»', en: 'they were to be cut down to fifty braccia and no more, and so it was done; and with the stones the city beyond the Arno was walled' }
    ],
    fonti: [`${NC}: VII, 39`]
  },
  cerchia: {
    testo: 'Nel 1300 la cerchia del 1172–75 c\'è ancora, ma la città è cresciuta oltre: nel 1284 il Comune ha cominciato le porte di una cerchia nuova, molto più grande, e poi ha lasciato il lavoro a metà. Le mura nuove saranno finite nel 1333.',
    en: 'In 1300 the walls of 1172–75 are still there, but the city has grown beyond them: in 1284 the Commune began the gates of a new, much larger circuit, and then left the work half done. The new walls will be finished in 1333.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica VIII, 99', parole: '«essendo i Fiorentini in buono e pacefico stato, e la città cresciuta di popolo e di grandi borghi, sì ordinarono di crescere il circuito della città»', en: 'the Florentines being in a good and peaceful state, and the city grown in people and in great suburbs, they decided to enlarge the circuit of the city' }
    ],
    fonti: [`${NC}: VIII, 99`]
  },
  fiume: {
    testo: 'Sul fiume, nel 1300, i ponti sono quattro. Il ponte alla Carraia crollerà il 1° maggio 1304, proprio a Calendimaggio, sotto la folla che guardava un inferno messo in scena sull\'Arno.',
    en: 'On the river, in 1300, there are four bridges. The Carraia bridge will collapse on 1 May 1304, at Calendimaggio itself, under the crowd watching a hell staged on the Arno.',
    racconta: [
      { chi: 'Villani', dove: 'Nuova Cronica IX, 70', parole: '«per lo calen di maggio MCCCIIII, come al buono tempo passato del tranquillo e buono stato di Firenze, s\'usavano le compagnie e brigate di sollazzi per la cittade»', en: 'for Calendimaggio 1304, as in the good old days of Florence\'s calm, the companies and bands of revellers went through the city' }
    ],
    fonti: [`${NC}: IX, 70`]
  }
};

/** I luoghi nuovi del 1300: hanno «epoca»: «1300» e si vedono solo nella città del 1300. */
export const LUOGHI_1300 = [
  {
    id: 'santa-trinita-1300',
    epoca: '1300',
    nome: 'Piazza Santa Trinita, Calendimaggio 1300',
    pos: [-165, -207], raggio: 18,
    luogo: { livello: 'documentato', nota: '«nella piazza di Santa Trinita» (Villani IX, 39). Le fonti divergono: Compagni non nomina la piazza' },
    forma: { livello: 'ipotesi', nota: 'la piazza è quella di oggi, ristretta alle strade del 1300' },
    testo: 'La sera del 1° maggio 1300 qui si balla, e le brigate dei Cerchi e dei Donati vengono alle mani: a Ricoverino de\' Cerchi viene tagliato il naso, e la città passa la notte in armi. Per Villani è l\'inizio della divisione fra Bianchi e Neri. Le due cronache lo raccontano in modo diverso. Per Villani è un incidente: le brigate a cavallo guardano un ballo di donne, si irritano, si spingono con i cavalli. Per Compagni è un agguato: i giovani dei Donati, a cena, decidono di assalire i Cerchi, e la piazza non la nomina. E l\'anno: Villani scrive 1300, Compagni racconta la zuffa dopo fatti dell\'estate del 1300, come se fosse il Calendimaggio del 1301 (lacuna 73). È di nuovo «un fatto, due racconti», come per il delitto del 1216.',
    fonti: [
      `${NC}: IX, 39: «la sera di calen di maggio, anno MCCC, veggendo uno ballo di donne che si facea nella piazza di Santa Trinita, l'una parte contra l'altra si cominciarono a sdegnare, e a pignere l'uno contro a l'altro i cavagli»; «Questo fue il cominciamento dello scandalo e partimento della nostra città»`,
      `${DC}, p. 62: «ritrovandosi insieme a cena una sera di calen di maggio, montorono in tanta superbia che pensorono incontrarsi nella brigata de' Cerchi e contro a loro usare le mani e' ferri»; «Nel quale assalto fu tagliato il naso a Ricoverino de' Cerchi da uno masnadiere de' Donati: il quale, si disse, fu Piero Spini»`,
      'La datazione al 1301 nel racconto di Compagni: dall\'ordine dei fatti, pp. 60–62 [da verificare sulla letteratura, per esempio E. Brilli, Reti Medievali 2017]'
    ]
  },
  {
    id: 'priori-cantiere',
    epoca: '1300',
    nome: 'Il cantiere del palazzo dei Priori',
    pos: [199, -121], raggio: 16,
    luogo: { livello: 'documentato', nota: 'il palazzo cominciato nel 1298 sul terreno accanto alle case abbattute degli Uberti (Villani IX, 26); oggi Palazzo Vecchio' },
    forma: { livello: 'ipotesi', nota: 'quanto fosse alto il 1° maggio 1300 non lo sappiamo (lacuna 72): qui il piano terreno, i ponteggi, un\'antenna da tiro; la pianta è quella del volume di oggi' },
    testo: 'Il palazzo dei Priori si comincia nel 1298, perché i priori, che governano la città a turni di due mesi, non si sentono sicuri dove stavano prima: in una casa dei Cerchi, dietro la chiesa di San Procolo. Lo mettono storto, «musso», per non posarlo sulla terra degli Uberti. Il 15 giugno 1300, sei settimane dopo questa sera, entrerà fra i priori Dante Alighieri [da verificare: la data sulla fonte].',
    fonti: [
      `${NC}: IX, 26: «Nel detto anno MCCLXXXXVIII si cominciò a fondare il palagio de' priori»; i priori «non parea loro essere sicuri ove abitavano innanzi, ch'era ne la casa de' Cerchi bianchi dietro a la chiesa di San Brocolo»; «il puosono musso, che fu grande difalta a lasciare però di non farlo quadro»`,
      'Il priorato di Dante dal 15 giugno al 15 agosto 1300 [da verificare su fonte]'
    ]
  },
  {
    id: 'loggia-grano',
    epoca: '1300',
    nome: 'La loggia del grano, Orto San Michele',
    pos: [155, -278], raggio: 16,
    luogo: { livello: 'documentato', nota: 'la loggia «sopra la piazza d\'Orto Sammichele, ove si vende il grano» (Villani VIII, 99); oggi Orsanmichele' },
    forma: { livello: 'ipotesi', nota: 'pilastri, archi e tetto sono ricostruiti; la pianta è quella dell\'edificio di oggi, che è del 1337' },
    testo: 'Qui si vende il grano. Il Comune ha fatto questa loggia verso il 1284 e ha lastricato la piazza intorno. Su un pilastro c\'è una Madonna dipinta che, dal luglio 1292, si dice faccia miracoli: vengono pellegrini da tutta la Toscana, e la loggia si riempie di immagini di cera. Nel 1304 brucerà; al suo posto, dal 1337, sorgerà Orsanmichele.',
    fonti: [
      `${NC}: VIII, 99: «si fece per lo Comune di Firenze la loggia sopra la piazza d'Orto Sammichele, ove si vende il grano, e lastricossi e amattonossi intorno, la quale allora fu molto ricca e bella opera e utile»`,
      `${NC}: i miracoli della «figura dipinta di santa Maria in uno pilastro della loggia d'Orto Sammichele», dal 3 luglio [da verificare: anno 1292 e capitolo]`,
      'L\'incendio del 1304 e l\'Orsanmichele del 1337 [da verificare su fonte]'
    ]
  },
  {
    id: 'palazzo-popolo',
    epoca: '1300',
    nome: 'Il palazzo del Popolo',
    pos: [371, -240], raggio: 16,
    luogo: { livello: 'documentato', nota: '«il palagio il quale è di dietro a la Badia, e in su la piazza di San Pulinari» (Villani VII, 39); oggi il Bargello' },
    forma: { livello: 'ipotesi', nota: 'il corpo sulla via del Proconsolo e la torre; le aggiunte del Trecento non ci sono. Se la torre fosse mozzata come quelle private non lo sappiamo (lacuna 79)' },
    testo: 'Il primo palazzo del Comune. Prima, dice Villani, il governo della città stava ora in un posto ora in un altro, in case prese in affitto. Lo fece il Primo Popolo, lo stesso governo che tagliò le torri: un palazzo di pietre squadrate, con la torre.',
    fonti: [
      `${NC}: VII, 39: «ordinaro e cominciaro a fare il palagio il quale è di dietro a la Badia, e in su la piazza di San Pulinari, cioè quello ch'è di pietre conce colla torre; ché prima non avea palagio di Comune in Firenze, anzi stava la signoria ora in una parte de la città e ora in altra»`,
      'La data del 1255 è della letteratura [da verificare]'
    ]
  },
  {
    id: 'porta-giano',
    epoca: '1300',
    nome: 'La porta di Giano della Bella',
    pos: [-707, 281], raggio: 14,
    luogo: { livello: 'dedotto', nota: 'su via dei Serragli, all\'incrocio con via del Campuccio (Wikipedia, «Mura di Firenze») [da verificare su Sznura 1975]' },
    forma: { livello: 'ipotesi', nota: 'una torre di porta come quelle della cerchia del 1172–75' },
    testo: 'Alla fine del Duecento il recinto dell\'Oltrarno si allarga fino a via del Campuccio, e la porta nuova prende il nome di Giano della Bella, il popolano che nel 1293 fece gli Ordinamenti di giustizia contro i grandi. Nel 1300 Giano è già in esilio.',
    fonti: [
      'Wikipedia, «Mura di Firenze», letta il 6/11/2026: l\'allargamento «fino a via del Campuccio, con una porta intitolata all\'allora podestà Giano della Bella» [da verificare: Giano non fu podestà]',
      `${NC}: IX, 1 (Giano della Bella e il secondo popolo, dal 1292)`,
      'L\'esilio di Giano nel 1295 [da verificare]'
    ]
  },
  {
    id: 'porte-nuove',
    epoca: '1300',
    nome: 'Porta San Gallo, in cantiere',
    pos: [671, -1700], raggio: 16,
    luogo: { livello: 'documentato', nota: 'una delle quattro porte fondate nel 1284 per le nuove mura (Villani VIII, 99)' },
    forma: { livello: 'ipotesi', nota: 'due piloni fermi all\'imposta dell\'arco; altezza e misure inventate' },
    testo: 'Nel 1284 il Comune fonda quattro porte nuove, lontano dalla città vecchia: qui, sul Mugnone, la porta di San Gallo. Poi il lavoro si ferma prima degli archi. Fra una porta e l\'altra, nel 1300, il muro non c\'è ancora (lacuna 64).',
    fonti: [
      `${NC}: VIII, 99: «cominciarsi a fondare le nuove porte, ove poi conseguirono le nuove mura... e quella di San Gallo in sul Mugnone... e rimase il lavoro di quelle innanzi che fossono a l'arcora»`
    ]
  }
];

LUOGHI_1300.push(
  {
    id: 'santa-croce-1300',
    epoca: '1300',
    nome: 'Il cantiere di Santa Croce',
    pos: [703, -58], raggio: 22,
    luogo: { livello: 'documentato', nota: 'la chiesa nuova dei frati minori, fondata il 3 maggio 1294 (Villani IX, 7)' },
    forma: { livello: 'ipotesi', nota: 'quanto fosse costruito nel 1300, e dove stesse la chiesa vecchia, non lo sappiamo (lacuna 80); la pianta è l\'impronta di oggi' },
    testo: 'I francescani sono arrivati a Firenze verso il 1226 e hanno qui una chiesa piccola. Nel 1294 il Comune e i frati fondano la chiesa nuova, enorme: alla posa della prima pietra c\'erano vescovi, il podestà, il capitano, i priori. Dopo sei anni è un cantiere: qui il fondo con il transetto in piedi, la navata a metà, le fondazioni verso la piazza. Sulla piazza i frati predicano: Villani la ricorda così nel Natale del 1301.',
    fonti: [`${NC}: IX, 7: «Negli anni di Cristo MCCLXXXXIIII, il dì di santa Croce di maggio, si fondò la grande chiesa nuova de' frati minori di Firenze detta Santa Croce»; IX, 49 («la piazza di Santa Croce, che vi si facea il predicare»)`, 'L\'arrivo dei francescani nel 1226–28: Wikipedia, «Piazza di Santa Croce» [da verificare]']
  },
  {
    id: 'santa-maria-novella-1300',
    epoca: '1300',
    nome: 'Il cantiere di Santa Maria Novella',
    pos: [-318, -656], raggio: 22,
    luogo: { livello: 'documentato', nota: 'la chiesa dei frati predicatori, i domenicani' },
    forma: { livello: 'ipotesi', nota: 'la chiesa nuova cominciata nel 1279 [da verificare]; quanto fosse costruito nel 1300 non lo sappiamo (lacuna 80); la pianta è l\'impronta di oggi' },
    testo: 'I domenicani hanno la loro chiesa nel prato a ovest della città, fuori dalla cerchia vecchia. Nel 1300 la chiesa nuova è in costruzione da una ventina d\'anni: qui il fondo con le cappelle e il transetto è finito, la navata è a metà. La facciata di marmi che si vede oggi verrà molto dopo.',
    fonti: ['L\'inizio nel 1279 e la facciata del Trecento e del Quattrocento [da verificare su fonte]']
  }
);

/** La traduzione inglese dei luoghi del 1300 (la verifica controlla che ci sia). */
export const LUOGHI_1300_EN = {
  'santa-trinita-1300': {
    nome: 'Piazza Santa Trinita, Calendimaggio 1300',
    luogo: '«in the square of Santa Trinita» (Villani IX, 39). The sources disagree: Compagni does not name the square',
    forma: 'the square is today\'s, narrowed to the streets of 1300',
    testo: 'On the evening of 1 May 1300 there is dancing here, and the bands of the Cerchi and the Donati come to blows: Ricoverino de\' Cerchi has his nose cut off, and the city spends the night under arms. For Villani it is the beginning of the split between Whites and Blacks. The two chronicles tell it differently. For Villani it is an accident: the bands on horseback watch a women\'s dance, grow angry, push their horses against each other. For Compagni it is an ambush: the young Donati, at supper, decide to attack the Cerchi, and he does not name the square. And the year: Villani writes 1300, Compagni tells the brawl after events of the summer of 1300, as if it were Calendimaggio 1301 (gap 73). Once again «one fact, two stories», as with the murder of 1216.'
  },
  'priori-cantiere': {
    nome: 'The building site of the Priors\' palace',
    luogo: 'the palace begun in 1298 on the land next to the pulled-down houses of the Uberti (Villani IX, 26); today Palazzo Vecchio',
    forma: 'how high it stood on 1 May 1300 we do not know (gap 72): here the ground floor, the scaffolding, a lifting mast; the plan is that of today\'s building',
    testo: 'The Priors\' palace is begun in 1298, because the priors, who govern the city in two-month turns, do not feel safe where they used to meet: in a house of the Cerchi, behind the church of San Procolo. They set it askew, «musso», so as not to build on the Uberti land. On 15 June 1300, six weeks after this evening, Dante Alighieri will become one of the priors [to be checked: the date in the source].'
  },
  'loggia-grano': {
    nome: 'The grain loggia, Orto San Michele',
    luogo: 'the loggia «on the square of Orto San Michele, where grain is sold» (Villani VIII, 99); today Orsanmichele',
    forma: 'pillars, arches and roof are reconstructed; the plan is that of today\'s building, which dates from 1337',
    testo: 'Grain is sold here. The Commune built this loggia around 1284 and paved the square around it. On one pillar there is a painted Madonna which, since July 1292, is said to work miracles: pilgrims come from all over Tuscany, and the loggia fills with wax images. It will burn in 1304; in its place, from 1337, Orsanmichele will rise.'
  },
  'palazzo-popolo': {
    nome: 'The palace of the People',
    luogo: '«the palace behind the Badia, on the square of San Pulinari» (Villani VII, 39); today the Bargello',
    forma: 'the block on via del Proconsolo and the tower; the fourteenth-century additions are not there. Whether the tower was cut down like the private ones we do not know (gap 79)',
    testo: 'The Commune\'s first palace. Before, Villani says, the city\'s government met now in one place, now in another, in rented houses. It was built by the First People, the same government that cut down the towers: a palace of squared stones, with its tower.'
  },
  'porta-giano': {
    nome: 'The gate of Giano della Bella',
    luogo: 'on via dei Serragli, at the corner of via del Campuccio (Wikipedia, «Mura di Firenze») [to be checked in Sznura 1975]',
    forma: 'a gate tower like those of the walls of 1172–75',
    testo: 'At the end of the thirteenth century the Oltrarno enclosure is extended to via del Campuccio, and the new gate is named after Giano della Bella, the commoner who in 1293 made the Ordinances of Justice against the magnates. In 1300 Giano is already in exile.'
  },
  'santa-croce-1300': {
    nome: 'The building site of Santa Croce',
    luogo: 'the new church of the Friars Minor, founded on 3 May 1294 (Villani IX, 7)',
    forma: 'how much was built by 1300, and where the old church stood, we do not know (gap 80); the plan is today\'s footprint',
    testo: 'The Franciscans came to Florence around 1226 and have a small church here. In 1294 the Commune and the friars found the new church, a huge one: bishops, the podestà, the captain and the priors attended the laying of the first stone. Six years later it is a building site: here the east end with the transept standing, the nave half built, the foundations towards the square. On the square the friars preach: Villani remembers it so at Christmas 1301.'
  },
  'santa-maria-novella-1300': {
    nome: 'The building site of Santa Maria Novella',
    luogo: 'the church of the Friars Preachers, the Dominicans',
    forma: 'the new church begun in 1279 [to be checked]; how much was built by 1300 we do not know (gap 80); the plan is today\'s footprint',
    testo: 'The Dominicans have their church in the meadow west of the city, outside the old walls. In 1300 the new church has been under construction for some twenty years: here the east end with the chapels and the transept is finished, the nave half built. The marble façade seen today will come much later.'
  },
  'porte-nuove': {
    nome: 'Porta San Gallo, under construction',
    luogo: 'one of the four gates founded in 1284 for the new walls (Villani VIII, 99)',
    forma: 'two piers stopped at the springing of the arch; height and measurements invented',
    testo: 'In 1284 the Commune founds four new gates, far from the old city: here, on the Mugnone, the gate of San Gallo. Then the work stops before the arches. Between one gate and the next, in 1300, the wall does not exist yet (gap 64).'
  }
};
