/* =====================================================================
   THE CITY IN ENGLISH (28 October 2026)

   Translations of the place cards, the guided visit, the class questions
   and the days. The Italian files stay the reference: dati/luoghi.js,
   dati/visita.js, dati/giornate.js. Quotations from the sources stay in
   the original language, with the meaning in English; bibliographic
   references (fonti) are not translated. «[to be checked]» translates
   «[da verificare]», the project's mark for a claim not yet checked on
   the primary source. The game script (racconto) is still Italian only.
   ===================================================================== */

export const LUOGHI_EN = {
  'capo-ponte': {
    nome: 'The head of the Ponte Vecchio',
    luogo: '«appiè di Marzo, in capo del Ponte Vecchio», at the foot of Mars, at the head of the Ponte Vecchio (pseudo-Brunetto; Faini pp. 15–16)',
    forma: 'the open space, the houses and the street surface are reconstructed',
    testo: 'Here, on Easter morning 1216, Buondelmonte dei Buondelmonti was knocked from his horse and killed. He came from Oltrarno, where he lived, and had just crossed the bridge. The model shows the place, not the murder: the city goes on with its feast-day morning.'
  },
  marte: {
    nome: 'The stone of Mars',
    luogo: '«at the foot of the Ponte Vecchio on this side, right at the foot of the pillar where the sign of Mars stood» (Villani VI, 38); Dante, Par. XVI 145–147. The sources disagree: Vossilla (1994, after Cinelli) puts it on the Oltrarno side',
    forma: 'a late Roman equestrian statue according to Vossilla [to be checked]; the pillar and the breaks are invented',
    testo: 'The Florentines called it Mars and believed the city\'s fate depended on it. For Dante it is «quella pietra scema / che guarda \'l ponte», that broken stone that watches the bridge: a mutilated statue, already a fragment then. Tradition says it fell into the Arno in the flood of 1178 and was fished out around 1200. It may have been a late Roman equestrian statue, a horseman the Florentines called Mars: it is shown like that here, broken, but the shape of the break is invented.'
  },
  ponte: {
    nome: 'The Ponte Vecchio of 1216',
    luogo: 'in 1216 it is the only bridge in Florence',
    forma: 'five arches according to popular sources, nine according to another: the sources disagree; the width and the absence of shops are hypotheses',
    testo: 'In 1216 this is the only place to cross the Arno. The Carraia bridge is begun in 1218, the Rubaconte in 1237, Santa Trinita in 1252. This bridge had been rebuilt after it collapsed in the flood of 1177, with five arches [to be checked]. The bridge you see today is a different one: it was rebuilt in 1345, after the flood of 1333 had swept this one away too. We have no description of what it really looked like: arches and roadway are reconstructed by comparison.'
  },
  amidei: {
    nome: 'The Amidei tower',
    luogo: 'the tower that bears the Amidei name today; the conspirators met «in casa gli Amidei da Santo Stefano», in the Amidei house by Santo Stefano (Villani; Faini p. 11)',
    forma: 'double-arched doors, marble lions, stone courses and windows from today\'s tower, rebuilt from photographs after 1944; the height in 1216 is a hypothesis',
    testo: 'This is one of the fixed points of the model: the footprint comes from today\'s tower, in via Por Santa Maria. In 1216 towers could be much taller than now. They were cut down by the government of the Primo Popolo around 1250, to 50 braccia, about 29 metres [to be checked]. The height you see is therefore a hypothesis.'
  },
  'santo-stefano': {
    nome: 'Santo Stefano al Ponte',
    luogo: 'church recorded from the 12th century [to be checked: 1116]',
    forma: 'today\'s Romanesque façade is dated 1233 [to be checked]: in 1216 it was not there yet',
    testo: 'The church that names the place of the ambush: the Amidei houses are «by Santo Stefano». The plan follows today\'s building. The façade is simplified, because the one you see today is a few years later than the murder.'
  },
  'santi-apostoli': {
    nome: 'Santi Apostoli',
    luogo: '11th-century church [to be checked]',
    forma: 'the basilica plan survives; elevation and façade simplified',
    testo: 'One of the oldest churches in the city, on the Borgo that bears its name. In front of it is the Limbo, the small cemetery of children who died unbaptised, which gives the square its name [to be checked].'
  },
  'porta-santa-maria': {
    nome: 'Porta Santa Maria',
    luogo: 'the sources disagree: level with via Vacchereccia, or at the crossing with borgo Santi Apostoli and via Lambertesca (DOSSIER-TOPOGRAFICO.md, § 2)',
    forma: 'a gate tower with an arched passage: no gate of the 1172–75 walls survives',
    testo: 'On 10 February 1216 Buondelmonte enters the city through Porta Santa Maria to go and pledge himself to the Donati woman, instead of the Amidei one. But which gate? The sources place it at two different points of via Por Santa Maria: level with via Vacchereccia, where the older wall ran, or closer to the bridge, at the crossing with borgo Santi Apostoli and via Lambertesca, on the walls of 1172–1175. Perhaps there were two gates with the same name. The first is shown here: it is one of the questions for the medievalist.'
  },
  'santa-maria-sopra-porta': {
    nome: 'Santa Maria sopra Porta',
    luogo: 'today San Biagio, in piazza di Parte Guelfa; recorded from 1038, rebuilt in the second half of the 13th century, perhaps nearer via Por Santa Maria and facing another way (Bargellini-Guarnieri) [to be checked]',
    forma: 'single-nave Romanesque church, by comparison with Florentine churches of the time',
    testo: 'Here, after 10 February, the friends and relatives of Oddo Arrighi met to decide what to do about Buondelmonte. The proposals were to beat him, to scar his face, or to kill him. Mosca dei Lamberti closed the council with «cosa fatta cappa à»: a thing done to the end cannot be undone. In Dante\'s Inferno it is Mosca himself who recalls having said it: «Capo ha cosa fatta». In the 14th century the Guelph Party had its seat in this same place.'
  },
  mannelli: {
    nome: 'The Mannelli tower',
    luogo: 'surviving tower at the Oltrarno end of the bridge; date [to be checked]',
    forma: 'height and top are hypothetical',
    testo: 'On the other side of the bridge. Much later, in 1565, the Mannelli will refuse to let the Vasari corridor pass through it, so the corridor goes round it [to be checked]. The man who commissioned the Chigi codex, with the miniature of the murder, also belonged to the Mannelli (dossier, § 4).'
  },
  strade: {
    nome: 'Earth streets',
    luogo: 'the line of via Por Santa Maria, which survives today',
    forma: 'beaten-earth surface',
    testo: 'In 1216 the streets of Florence are almost all earth. It will be the podestà Rubaconte da Mandello, in 1237, who has them paved, «che prima n\'erano poche lastricate», since few had been paved before. The width of the streets in the model is a hypothesis.'
  },
  fiume: {
    nome: 'The Arno without embankments',
    luogo: 'the river bed is today\'s, from OpenStreetMap',
    forma: 'natural banks and houses on the water: the riverside avenues came later [to be checked: dates of each stretch]',
    testo: 'The embankments and riverside avenues you see today are mostly from the 19th century. In 1216 the houses come down to the water, with wooden overhangs above the river. The banks are earth, gravel and grass. The outline of the bed is today\'s, so narrower and more regular than it was then.'
  },
  case: {
    nome: 'The houses in this model',
    luogo: 'the plots are generated along the streets, not surveyed',
    forma: 'building types taken from Florentine architecture of the 13th and 14th centuries',
    testo: 'Tower-houses, wooden overhangs on the streets, shops on the ground floor with a wide arch: these are the types of 13th-century Florence. But every single house you see is generated by the program. At Easter the shops are closed; on 10 February they are open. Only the towers with a name have the footprint of a real tower.'
  },
  battistero: {
    nome: 'The Baptistery of San Giovanni',
    luogo: 'it existed before 1216; footprint from OpenStreetMap',
    forma: 'the building still stands: an octagon 34 m across, three orders of white and green marble, lantern of 1150, apse; the wooden doors and the design of the panels are hypotheses',
    testo: 'It is the religious and civic heart of the city: every Florentine is baptised here. In 1216 the gold mosaics are not there yet: those of the apse begin in 1225, those of the dome around 1270. The bronze doors will come in the 14th and 15th centuries; the two porphyry columns at the east door, though, are already there: the Pisans gave them a century earlier.'
  },
  'case-donati': {
    nome: 'The Donati houses',
    luogo: 'the tower that bears the Donati name today, near piazza dei Donati and the Corso [to be checked: whether Forese and Gualdrada lived here in 1216]',
    forma: 'the tower\'s footprint is real; the elevation and the houses around it are reconstructed',
    testo: 'Madonna Gualdrada, wife of messer Forese Donati, secretly called Buondelmonte and showed him her own daughter: «Disgraced knight, you have taken a wife out of fear of the Uberti and the Fifanti». The sources do not say where this happened. On 10 February Buondelmonte pledged himself to the Donati daughter instead of his Amidei betrothed. The sources disagree on the woman\'s name: Gualdrada, wife of Forese, in the pseudo-Brunetto; Aldruda, wife of Forteguerra, in Compagni.'
  },
  'case-buondelmonti': {
    nome: 'The Buondelmonti houses',
    luogo: 'in the parish of San Felice in Piazza, in Oltrarno (Stefani; Faini p. 23); we do not know the exact spot',
    forma: 'generated houses; the road towards San Felice is drawn by hand',
    testo: 'Buondelmonte, son of the late Tegliaio, had his house in Oltrarno, in the parish of San Felice in Piazza; the family still held the castle of Montebuoni, outside the city. In 1216 he was not a boy: he was the widower of a certain Ghisola. On Easter morning he came from here and crossed the bridge. On this side of the Arno there is also a tower that bears the Buondelmonti name today [to be checked: its date and its link with Buondelmonte\'s branch of the family].'
  },
  'case-uberti': {
    nome: 'The Uberti houses',
    luogo: 'where, at the end of the 13th century, the square and the palace of the Priors will open, on the demolished Uberti houses [to be checked: Villani, dates]',
    forma: 'generated houses and towers',
    testo: 'The Uberti are one of the great aristocratic families of the city, relatives and allies of Oddo Arrighi. Messer Schiatta degli Uberti is the one who, on Easter morning, knocks Buondelmonte from his horse with a mace. After 1258 the Commune will have their houses pulled down, and in their place piazza della Signoria will slowly take shape [to be checked: dates]. In 1216 there is no square here.'
  },
  'case-lamberti': {
    nome: 'The Lamberti houses',
    luogo: 'two streets still bear the family name: via dei Lamberti, near Orsanmichele, and via Lambertesca [to be checked: where the houses were in 1216]',
    forma: 'generated houses',
    testo: 'Mosca dei Lamberti was the most respected man of the group: at the council in Santa Maria sopra Porta it was he who closed the discussion with «cosa fatta cappa à». In the following years he was podestà of Viterbo, Todi and Reggio, where he died in 1243. Dante puts him in Hell among the sowers of discord.'
  },
  'torre-fifanti': {
    nome: 'The Fifanti tower',
    luogo: 'the tower that bears the Fifanti name today, in Oltrarno [to be checked: date and link with Oddo Arrighi]',
    forma: 'real footprint; height and top are hypothetical',
    testo: 'Messer Oddo Arrighi dei Fifanti is the offended party. Wounded by Buondelmonte at the banquet in Campi, he gathers his people to decide on peace through a marriage and, after the broken promise, on revenge. On Easter morning it is he who strikes the final blow. He will die in the early 1240s, killed by the Buondelmonti in a fight at Campi.'
  },
  'mercato-vecchio': {
    nome: 'The Old Market',
    luogo: 'the market on the site of the Roman forum, where piazza della Repubblica is today [to be checked: first record of the name]',
    forma: 'shape, size and stalls reconstructed: the quarter was demolished in 1885–1895',
    testo: 'The commercial heart of the city, where the streets of Roman Florence crossed. On working days, like 10 February, the stalls stand in rows: butchers, fish, bread, greengrocers, and towards Calimala the money changers\' tables; in a corner a notary writes for whoever asks. At Easter the square is empty. The rows and the stalls are a hypothesis of the model. At the end of the 19th century the quarter was demolished to open today\'s piazza della Repubblica: rebuilding it needs the land register and the photographs taken before the demolition.'
  },
  cambiatori: {
    nome: 'The money changers',
    luogo: 'on the side of the Old Market towards Calimala: we do not know where they were in 1216 (gap 56)',
    forma: 'a table covered with a green cloth, scales, coins, a ledger: by comparison with 13th- and 14th-century images',
    testo: 'In a city where coins from many different mints circulate, someone has to change them and weigh them. The money changers work seated behind a table, with their scales and their ledger: the word banker comes from «banco», bench. Here they sit in a row on the side of the market towards Calimala, the street of the cloth merchants, who needed them every day. They are only there on working days.'
  },
  calimala: {
    nome: 'The shops of Calimala',
    luogo: 'via Calimala bears the name of the cloth merchants\' guild',
    forma: 'stalls in front of the shops, with coloured bolts of cloth and the measuring rod (gap 57)',
    testo: 'The Calimala merchants buy cloth in France and Flanders, have it finished and dyed in Florence and sell it on: it is the richest guild in the city, and the street bears its name. On working days the bolts lie on the stall in front of the shop, and the merchant measures them with the canna, four braccia, about 2.33 metres. The colours are a hypothesis.'
  },
  fucina: {
    nome: 'The smithy and the farrier',
    luogo: 'on via Por Santa Maria, near the gate, where people arriving on horseback stop: a hypothesis of the model (gap 59)',
    forma: 'lean-to roof, forge with its hood, bellows, anvil, quenching tub',
    testo: 'The smith beats the iron on the anvil next to the forge; the boy keeps the tub ready for quenching. In the street a horse waits for the farrier. We do not know where smiths worked in 1216: here they are near the gate because people arriving on horseback need them. You can hear them from far away, but only on working days.'
  },
  cerchia: {
    nome: 'The walls of 1172–1175',
    luogo: 'the line can be read in today\'s streets: via dei Fossi, del Giglio, de\' Pucci, Verdi, de\' Benci, dei Vagellai and others (dati/cerchia.js)',
    forma: 'we do not know the wall\'s height, thickness or battlements; in Oltrarno the palisade is drawn by hand',
    testo: 'Between 1172 and 1175 the Commune built in a hurry, of river stones and reused material, a circle of walls much wider than that of 1078: for the first time it took in Oltrarno. In 1216 it is the wall that closes Florence. The walls are gone, but many of today\'s streets run where the wall and the ditch ran: that is why the model builds the wall along those streets. Here, in piazza dei Giudici, stood the postern of Altafronte, and here the certain stretch ends. Further west we do not know whether the wall ran along the river or behind the houses of via Lambertesca and borgo Santi Apostoli: in the second case the Amidei tower and Santo Stefano would have been left outside. The model does not choose: press «What is certain» and you will see the two possible lines, transparent. In Oltrarno there was no wall: the houses closed the city, with their outer walls without openings, and a palisade.'
  },
  'casa-del-notaio': {
    nome: 'The notary\'s house (a place of the game)',
    luogo: 'the notary is a character of the game: the game chooses his house, not the sources',
    forma: 'one of the generated houses of via delle Terme',
    testo: 'Here the game places the house of the notary who tells the story: in via delle Terme, a few steps from Santa Maria sopra Porta, where the council was held. It is a declared invention. The notary never existed, and his house, with the shop and the stall open on the street on working days, is any one of the houses in the street. The scenes set here, the evening of the message and the closed notebook, are invented in the script too.'
  },
  'santa-reparata': {
    nome: 'Santa Reparata',
    luogo: 'the cathedral of Florence in 1216; the remains are under the Duomo, in the archaeological area. The façade stood about 9.5 m in front of today\'s',
    forma: 'plan from the excavations of 1965–1974: three naves, seven pairs of piers, crypt under the presbytery, apses, portico; heights, windows, the marble façade and the bell tower are hypotheses',
    testo: 'On Easter morning the game\'s notary may be here, at Mass, when the news arrives from the bridge. The next day, 11 April, the cathedral\'s obituary records only: «Obiit Dominus Bondelmonte», messer Buondelmonte has died. Not how, nor by whose hand. You enter through the great portal: three naves divided by seven pairs of piers, the open timber roof, the presbytery raised above the crypt. The Duomo we see today will be begun on top of this church on 8 September 1296, and Santa Reparata will stay in use until 1375.'
  },
  campi: {
    nome: 'The Mazzinghi castle at Campi',
    luogo: 'the banquet «nella terra di Campi, apresso a Florenzia VJ milgla», at Campi, six miles from Florence (pseudo-Brunetto; Faini p. 13); the Mazzinghi castle had stood there since the 10th century',
    forma: 'the castle was destroyed in 1260 and today\'s Rocca Strozzi is from the 14th century: walls, keep, hall and furnishings are reconstructed on the type of the castles of the countryside',
    testo: 'Messer Mazzingo Tegrimi dei Mazzinghi has been made a knight and has invited «all the good people of Florence». The tables are boards on trestles, covered with cloths: at the end of the meal they are taken away, and the chronicle remembers it, because the brawl breaks out «when the tables were taken away». One wooden trencher and one cup for every two guests, knives and bread; no forks. We do not know what this hall really looked like: the Mazzinghi castle is gone.'
  }
};

/** The gates and posterns (dati/luoghi.js, schedePorte): the same template in English. */
const VIA_EN = {
  'Piazza dei Pitti': 'the road in front of Palazzo Pitti, at the entrance to piazza San Felice',
  'Piazza Mentana': 'piazza Mentana',
  'Via di San Niccolò': 'via di San Niccolò, at the crossing with via del Giardino Serristori',
  'Borgo San Frediano': 'the end of via di Santo Spirito'
};
const FOSSO = new Set(['porta-san-piero', 'porta-ghibellina', 'porta-san-simone', 'porta-dei-buoi']);
export function portaEN(p) {
  const dove = VIA_EN[p.via] || p.via.replace(/^Via /, 'via ').replace(/^Borgo /, 'borgo ').replace(/^Corso /, 'corso ').replace(/^Piazza /, 'piazza ');
  const oltrarno = p.lato === 'oltrarno', fosso = FOSSO.has(p.id);
  const nome = p.nome
    .replace(/^La postierla (d'|del |della |di |degli )/, 'The postern of ').replace(/^La porta di /, 'The gate of ')
    .replace(/, o di /, ', or ').replace(/, o /, ', or ');
  const testo = oltrarno
    ? `In Oltrarno, in 1216, there was no real wall: the houses closed the city, with their outer walls without openings, and a palisade built in a hurry. The source records a gate here, where ${dove} is today. The wooden gate you see is a hypothesis, like the palisade.`
    : p.tipo === 'porta'
      ? `One of the gates of the 1172–75 walls, where ${dove} is today. From here the road went out towards the suburbs and the countryside.${fosso ? ' A ditch ran in front of the wall: you crossed it on an earth bank.' : ''} The tower you see is a hypothesis: it has the same shape given to Porta Santa Maria.`
      : `A postern: a narrow passage in the wall, for people on foot, where ${dove} is today. The arched opening you see is a hypothesis.`;
  return {
    nome, testo,
    luogo: oltrarno ? 'the source names the gate and the street; the point is where the street meets the palisade drawn by hand' : `the source puts it in ${dove}; the point is where the street meets the wall, rebuilt along today's streets`,
    forma: oltrarno ? 'wooden gate in the palisade' : p.tipo === 'porta' ? 'gate tower, like Porta Santa Maria' : 'arched opening in the wall'
  };
}

export const TAPPE_EN = [
  { titolo: 'In Oltrarno, where Buondelmonte lived', testo: ['It is Easter morning 1216, Sunday 10 April. Buondelmonte dei Buondelmonti lived around here, across the Arno, near the church of San Felice in Piazza.', 'That morning he crossed the bridge on horseback. We do not know exactly where his house was: the houses you see are reconstructed.'] },
  { titolo: 'The Ponte Vecchio of 1216', testo: ['In 1216 this is the only place to cross the Arno: the other bridges of Florence will come later, from 1218 on.', 'The bridge we know today is a different one, rebuilt in 1345. Nobody describes what this one looked like: arches and roadway are reconstructed by comparison with other bridges.'] },
  { titolo: 'The head of the bridge and the stone of Mars', testo: ['Here, just across the bridge, Buondelmonte was knocked from his horse and killed. The model shows the place, not the murder: the city goes on with its feast-day morning.', 'Nearby stood an old broken statue the Florentines called Mars. Dante remembers it as «quella pietra scema che guarda \'l ponte», that broken stone that watches the bridge.'] },
  { titolo: 'The Amidei tower and Santo Stefano', testo: ['The Amidei tower still stands, in via Por Santa Maria. According to the chronicler Giovanni Villani, those who decided on revenge met in the Amidei house, «by Santo Stefano»: the church next door.', 'In 1216 the tower was probably taller than today: the height you see is a hypothesis.'] },
  { titolo: 'Santa Maria sopra Porta', testo: ['According to another chronicle, it was here that the relatives and friends of the offended family decided what to do about Buondelmonte. The sources disagree about the place, and the card says so.', 'Mosca dei Lamberti closed the discussion: a thing done to the end cannot be undone. It is the saying that gives the game its name, «cosa fatta capo ha». You can go inside the church.'] },
  { titolo: 'The Old Market', testo: ['The heart of trade, where the streets of Roman Florence crossed. On working days it is full of stalls; at Easter it is empty.', 'Today piazza della Repubblica stands here: the quarter was demolished at the end of the 19th century. The shape and size of the market are a hypothesis.'] },
  { titolo: 'The Baptistery of San Giovanni', testo: ['Every Florentine was baptised here. It is the building of this city we know best, because it still stands.', 'But in 1216 the gold mosaics inside were not there yet: they begin in 1225, and the bronze doors will come in the 14th century.'] },
  { titolo: 'Santa Reparata, the cathedral', testo: ['The cathedral of 1216, where the Duomo stands today; the Duomo will be begun on top of it in 1296. You can go in: three naves and an open timber roof.', 'The day after the murder, the cathedral\'s register of the dead writes only: «messer Buondelmonte has died». Not how, nor by whose hand.'] },
  { titolo: 'The walls and Porta di Balla', testo: ['Here the city ends: the wall built in a hurry between 1172 and 1175, with its gates. This is Porta di Balla, where via dei Servi is today.', 'The walls are gone, but many of today\'s streets run where the wall and the ditch ran: that is how we know where they were. Height and shape are hypotheses.'] },
  { titolo: 'What is certain, and what is not', testo: ['In this city not everything is equally certain. Now every building is coloured by how much we know about it: blue if it is documented, orange if it is deduced from clues, grey if it is a hypothesis.', 'You can turn the colours off with «What is certain». Every place has a card with its sources. Now explore on your own: tap the street where you want to go.'] }
];

export const DOMANDE_EN = [
  { domanda: 'In 1216, how many bridges cross the Arno in Florence?', risposte: ['One, the Ponte Vecchio', 'Two', 'Four, as today'], perche: 'The Ponte Vecchio is the only one: the Carraia bridge is begun in 1218, the Rubaconte in 1237, Santa Trinita in 1252.' },
  { domanda: 'Where was Buondelmonte killed, on Easter morning?', risposte: ['In Santa Reparata, during Mass', 'At the head of the Ponte Vecchio, just across the river', 'In the castle of Campi'], perche: 'He came from Oltrarno and had just crossed the bridge: he was knocked from his horse and killed there, next to the stone of Mars.' },
  { domanda: 'What does the cathedral\'s register of the dead write the next day?', risposte: ['Who killed him and why', 'Only «messer Buondelmonte has died»', 'Nothing: it does not mention it'], perche: 'The obituary of Santa Reparata records only the death: not how, nor by whose hand. The rest is told by the chronicles, many years later.' },
  { domanda: 'In this city, what does a building coloured grey with «What is certain» mean?', risposte: ['That it still stands today', 'That it is a hypothesis: reconstructed by comparison, without direct proof', 'That it was destroyed in a war'], perche: 'Blue means documented, orange deduced from clues, grey hypothesis. Every card says why.' }
];

export const GIORNATE_EN = {
  pasqua: { nome: 'Easter', titolo: 'Sunday 10 April 1216', nota: 'Easter morning' },
  febbraio: { nome: '10 February', titolo: '10 February 1216', nota: 'for the Florentines still 1215: the new year begins on 25 March' },
  gennaio: { nome: 'January', titolo: 'January 1216 · the banquet at Campi', nota: 'for the Florentines still 1215; the day is not recorded: here, mid-January' }
};
