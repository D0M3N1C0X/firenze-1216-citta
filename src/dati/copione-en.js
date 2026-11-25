/* =====================================================================
   THE SCRIPT IN ENGLISH — BOZZA DA RIVEDERE

   Traduzione di lavoro del copione (storia/copione.md, testi di Domenico
   Perroni, CC BY 4.0), fatta il 23 novembre 2026 per l'app in inglese
   (decisione: «Sì, traduci tu», da rivedere dall'autore). Copre quello che
   l'app legge e mostra: titoli, paragrafi, scelte, testimoni, note del
   quaderno, e le note «Nella città» e «Fuori dalla città».

   Regole: le frasi tra virgolette usano “ ”, una coppia per ogni «…»
   dell'italiano, nello stesso ordine (la regia dà una voce a ciascuna:
   scripts/verifica-regia.mjs lo controlla). I nomi restano italiani
   (Buondelmonte, Oddo Arrighi, Santa Maria sopra Porta); «messer» diventa
   «Messer», «madonna» «Madonna». Le parole latine del registro restano.
   «Riferito», «di parte», «visto», «documento» (i tipi delle note) sono
   tradotti in TIPI_NOTA_EN.
   ===================================================================== */

export const TIPI_NOTA_EN = {
  visto: { nome: 'seen', testo: 'the notary saw it with his own eyes' },
  riferito: { nome: 'reported', testo: 'someone with no direct interest told him' },
  'di parte': { nome: 'partisan', testo: 'someone with an interest told him' },
  documento: { nome: 'document', testo: 'it is written in a record' }
};

export const COPIONE_EN = {
  P1: {
    titolo: 'The judge\'s shop',
    testo: [
      'Florence, January. For you it is still the year 1215: in Florence the new year begins on 25 March.',
      'You are the youngest pupil of Sanzanome, judge and notary. At his desk people write contracts, wills, peace agreements between families. Today your master hands you a notebook.',
      '“Write down what happens in the city. But also write down how you know it: whether you saw it, whether you were told, and who told you. Try now: who is the podestà this year?”',
      'Two men at the desk answer at once. One says “Messer Gherardo Orlandi”, the other “Messer Currado Orlandi”.'
    ],
    scelte: ['Write “Gherardo”', 'Write “Currado”', 'Write both names, and who said them', 'Ask to see a record with the name']
  },
  I1: {
    titolo: 'At table',
    testo: [
      'The first days of the year. At Campi, six miles outside Florence, Messer Mazzingo Tegrimi dei Mazzinghi has been made a knight, and he has invited all the good people of Florence. Your master has sent you: there will be agreements to write and witnesses to count.',
      'The tables are long. Where do you sit?'
    ],
    scelte: [
      'Next to Messer Uberto degli Infangati, who is eating from the same trencher as Messer Buondelmonte',
      'Near the Fifanti, where Messer Oddo Arrighi is sitting',
      'At the far end, with the jesters and the servants'
    ]
  },
  I2a: {
    titolo: 'On Uberto\'s side',
    testo: ['A jester walks by and takes away the full trencher in front of Uberto. Uberto turns red. From the other end of the table Messer Oddo Arrighi shouts something at him; in the noise you cannot make out the words, but the tone is insulting. Uberto answers back. Oddo grabs a trencher loaded with meat and throws it in his face.'],
    scelte: [],
    note: { N02: '“A jester took the trencher away from Uberto degli Infangati. Oddo Arrighi insulted him and, after Uberto answered, threw a trencher of meat in his face.”' }
  },
  I2b: {
    titolo: 'On the Fifanti side',
    testo: ['You cannot see what is happening at the other end of the table: too many people are standing. Then you hear Uberto degli Infangati\'s voice above everyone else: “You lie in your throat!” Messer Oddo Arrighi, next to you, grabs a trencher loaded with meat and throws it in his face.'],
    scelte: [],
    note: { N03: '“Uberto degli Infangati called Oddo Arrighi a liar in front of everyone. Oddo threw a trencher of meat in his face.”' }
  },
  I2c: {
    titolo: 'At the far end of the hall',
    testo: ['You see a jester take the trencher in front of Uberto degli Infangati and carry it off amid laughter. Next to you a servant whispers: “They say Messer Oddo had it taken away, to mock his hunger.” From down there you only hear the shouting. Then a trencher flies over the table.'],
    scelte: [],
    note: { N04: '“A servant says it was Oddo Arrighi who had the trencher taken away from Uberto, to mock him.”' }
  },
  I3: {
    titolo: 'When the tables are cleared',
    testo: [
      'The tables are taken away. A servant asks you to help carry the benches outside. From outside you hear a cry.',
      'When you come back in, Messer Oddo Arrighi is clutching his arm and blood is running between his fingers. Messer Buondelmonte still has the knife in his hand.',
      'Around them, two voices. Uberto degli Infangati: “Oddo was looking for a fight all evening. Buondelmonte defended a friend\'s honour.” A man of the Fifanti: “He struck him in cold blood, after the feast was over. Like a churl.”',
      'Tonight, what do you write in the notebook?'
    ],
    scelte: ['Only the fact', 'The fact and the Fifanti version', 'The fact and Uberto\'s version', 'The fact and both versions, with the names of who told them'],
    note: {
      N05: '“After the banquet, Buondelmonte wounded Oddo Arrighi in the arm with a knife.”',
      N06: '“He struck him in cold blood, after the feast was over.”',
      N07: '“Oddo was looking for a fight; Buondelmonte defended a friend\'s honour.”'
    }
  },
  II1: {
    titolo: 'The peace council',
    testo: [
      'A few days later Messer Oddo gathers friends and kinsmen: the counts of Gangalandi, the Uberti, the Lamberti, the Amidei. Blood has been shed and honour must be repaired. They decide on peace through a marriage: Buondelmonte will marry the daughter of Messer Lambertuccio degli Amidei, Oddo\'s niece.',
      'Your master has to deal with an agreement with Bologna on behalf of the Commune. “You follow the wedding.”',
      'Before the ceremony, whom do you go to, to make the terms clear?'
    ],
    scelte: ['Messer Lambertuccio degli Amidei, the bride\'s father', 'Messer Uberto degli Infangati, the groom\'s friend'],
    note: {
      N08: '“The marriage closes the wound. Whoever swears in front of everyone does not go back.”',
      N09: '“In the city some say that Buondelmonte accepted out of fear of the Uberti and the Fifanti. And that stings him.”'
    }
  },
  II2: {
    titolo: 'A maid at the door',
    testo: [
      'The evening before the wedding Cilia knocks, a maid in the Donati house: you wrote her father\'s will for free, and she has not forgotten. Under her breath she tells you: “Madonna Gualdrada secretly sent for Messer Buondelmonte and showed him her daughter. I heard it myself.”',
      'She repeats her words: “Disgraced knight, you have taken a wife out of fear of the Uberti and the Fifanti. Leave the one you have taken and take this one, and you will always be an honoured knight.”'
    ],
    scelte: ['Thank her and write everything in the notebook', 'Run to warn Messer Lambertuccio', 'Tell her the affairs of the great houses are none of your business'],
    note: { N10: '“Madonna Gualdrada secretly called Buondelmonte, offered him her daughter and told him he had taken a wife out of fear.”' }
  },
  II3: {
    titolo: 'Thursday 10 February',
    testo: [
      'Early morning. Where the promise is to be sworn, the people of both sides have gathered; you have the parchment ready.',
      'Messer Buondelmonte arrives on horseback and enters by Porta Santa Maria. He rides past everyone and goes to pledge himself to the Donati daughter.',
      'Lambertuccio\'s daughter stays there, in front of everyone. The chronicles have not kept her name.',
      'The parchment stays blank. In the notebook, how do you write what Buondelmonte did?',
      'In the margin: “Easter falls on 10 April. Counting backwards, and this year February has twenty-nine days, today is Wednesday.”'
    ],
    scelte: ['“He broke the sworn peace.”', '“He chose another bride.”', '“He left Lambertuccio\'s daughter standing in front of everyone.”'],
    note: {
      N11a: '“He broke the sworn peace.”', N11b: '“He chose another bride.”', N11c: '“He left Lambertuccio\'s daughter standing in front of everyone.”',
      N23: '“Counting from Easter on 10 April, today is Wednesday.”'
    }
  },
  III1: {
    titolo: 'Santa Maria sopra Porta',
    testo: [
      'Messer Oddo calls his friends and kinsmen together again, this time in the church of Santa Maria sopra Porta. The doors close. You stay outside, in the square, with the notebook.',
      'When they come out, three people know something. You have time to listen to two of them.'
    ],
    scelte: ['Father Giunta, who serves in the church and listened from the sacristy', 'Bartolo, a servant of the Lamberti, who stayed on the threshold', 'Messer Uberto degli Infangati, who was not inside'],
    note: {
      N12: '“Someone wanted to beat him. Others wanted to slash his face, so that he would carry the mark for ever. Then Messer Mosca spoke, and nobody added anything more.”',
      N13: '“Messer Mosca said: if you beat him or wound him, dig your own grave first. Strike him so that it shows. A thing done has an end.”',
      N14: '“They decided to kill him in cold blood.”'
    }
  },
  III2: {
    titolo: 'What do you do with what you know?',
    testo: ['Now you know, or think you know, that something is being prepared. A notary writes peace agreements, he does not make them. But you are also a citizen of Florence.'],
    scelte: ['Go to the podestà\'s messenger', 'Have Buondelmonte warned through Uberto', 'Keep silent: it is not a notary\'s job']
  },
  III3a: {
    titolo: 'The podestà\'s messenger',
    testo: ['The messenger listens to you without interrupting. Then: “Affairs between houses. Until someone brings a charge, the Commune does not enter the houses of knights.” And he dismisses you.'],
    scelte: [],
    note: { N15: '“The Commune does not intervene in affairs between houses without a charge.”' }
  },
  III3b: {
    titolo: 'The message',
    testo: ['Uberto comes back in the evening. “I told him. He laughed. He says a knight does not hide.” In the city rumours run: from tomorrow, in the Amidei house, they will know the notary has talked.'],
    scelte: []
  },
  III3c: {
    titolo: 'The closed notebook',
    testo: ['You close the notebook on the page of the council. You write nothing else. Silence too, you think, is a way of taking a side.'],
    scelte: []
  },
  IV1: {
    titolo: 'Easter morning',
    testo: [
      'Sunday 10 April. The 25th of March has passed: now it is 1216 for you too. The bells ring for the Resurrection.',
      'Where are you?'
    ],
    scelte: ['In Oltrarno, where you live, on the road to the Ponte Vecchio', 'Near the Amidei houses, around Santo Stefano', 'Already in the cathedral, at Santa Reparata, for Mass']
  },
  IV2a: {
    titolo: 'Oltrarno',
    testo: ['In front of you, towards the bridge, a knight rides by, with a pale cloak and something on his head, perhaps a garland. It is Messer Buondelmonte. The crowd separates you from him. Soon after, from the other side of the bridge, a scream, then another. People start running.'],
    scelte: [],
    note: { N16: '“Buondelmonte crossed the bridge on horseback, coming from Oltrarno, in a pale cloak. From afar I saw nothing else.”' }
  },
  IV2b: {
    titolo: 'Santo Stefano',
    testo: ['In front of the Amidei houses there are armed men, more than are needed to go to Mass. You recognise Messer Schiatta degli Uberti, with a mace in his hand. Someone sees you and signals you to go away. Soon after, from the end of the bridge, the shouting comes.'],
    scelte: [],
    note: { N17: '“Armed men were waiting by the Amidei houses. Among them Schiatta degli Uberti, with a mace.”' }
  },
  IV2c: {
    titolo: 'Santa Reparata',
    testo: ['During Mass a noise rises from the street, first far away, then loud. A man runs in: “To the bridge! They have killed a knight!” The church empties. When you get there, the city is already in arms.'],
    scelte: []
  },
  IV3: {
    titolo: 'The voices of the bridge',
    testo: [
      'At the end of the bridge, at the foot of the old statue of Mars, people are crowding. Buondelmonte is on the ground. They will not let you near. You gather the voices.',
      'Two people describe his clothes differently. What do you write?'
    ],
    scelte: ['“Dressed in white”', '“In a tunic and cloak, with a garland”', '“The voices do not agree about his clothes”'],
    testimoni: ['Neri, apprentice of a merchant of Oltrarno', 'A man of the Buondelmonti house', 'A man of the Fifanti', 'The podestà\'s messenger'],
    note: {
      N18: '“He was dressed all in white, on a white palfrey. He looked like a bridegroom.”',
      N19: '“A silk tunic, a cloak, a garland on his head. They waited for him armed, like thieves.”',
      N20: '“They struck him in front of everyone, where he had broken his word. As it should be.”',
      N21: '“A brawl. They pulled him off his horse, people came running, weapons came out: one struck, then another.”'
    }
  },
  IV4: {
    titolo: 'The procession and the register',
    testo: [
      'They lay Buondelmonte on a bier. His wife, the Donati daughter pledged two months before, sits beside him and holds his head in her lap, weeping. They carry him like this through all of Florence.',
      'The next day the sacristan of Santa Reparata lets you see the register of the dead. For that day there is a single line: Obiit Dominus Bondelmonte. “Messer Buondelmonte has died.”',
      'Neither how, nor by whose hand.'
    ],
    scelte: [],
    note: { N22: '“Obiit Dominus Bondelmonte. — Register of the dead of Santa Reparata, 11 April.”' }
  }
};

/** Le note «Nella città» e «Fuori dalla città», i nomi dei rami, e i testi dell'app che non sono del copione. */
export const SCENE_EN = {
  P1: { fuori: 'Sanzanome\'s shop: we do not know where it was.' },
  I1: { adattamento: 'The Mazzinghi castle no longer exists: the castle, the hall and the banquet are a hypothesis. The characters with a name have a figure and the colours of their house, so that you can recognise them (hypothesis); where each one sits is a staging hypothesis.' },
  I2a: { ramo: 'Next to Uberto' }, I2b: { ramo: 'Near the Fifanti' }, I2c: { ramo: 'At the far end of the hall' },
  I3: { adattamento: 'The notary is in the courtyard carrying the benches. When he comes back in, the tables in the hall are still laid: the script says they are taken away, the app does not take them away.' },
  II1: { fuori: 'The sources do not say where the peace council met.' },
  II2: { adattamento: 'In the script the scene takes place in the evening, at the notary\'s door. The city shows, by day, the place Cilia talks about: the Donati houses.' },
  II3: { adattamento: 'We do not know where the people gathered for the oath (dossier, § 2): the city shows Porta Santa Maria, through which Buondelmonte entered. The script says Thursday; the calculation on the Julian calendar gives Wednesday [to be verified: dossier, gap 18].' },
  III1: { adattamento: 'We do not know the day of the council, only that it came after 10 February: the city shows it in February light.' },
  III3a: { ramo: 'To the podestà\'s messenger', fuori: 'We do not know where the podestà\'s messenger received people in 1216: the Palazzo del Popolo, today the Bargello, was begun in 1255 [to be verified].' },
  III3b: { ramo: 'The message', adattamento: 'One evening, in the city: the script does not say where the notary lives. The city puts him in Via delle Terme, near Santa Maria sopra Porta, in February light.' },
  III3c: { ramo: 'The closed notebook', adattamento: 'The notary\'s desk: in the city it is a shop in Via delle Terme, with the desk open onto the street. It is a place of the game, not of the sources.' },
  IV2a: { ramo: 'In Oltrarno' }, IV2b: { ramo: 'Near the Amidei houses' },
  IV2c: { ramo: 'At Santa Reparata', adattamento: 'You are inside the cathedral, at the start of the nave, facing the chancel: Easter Mass. The people in the church are a hypothesis.' },
  IV3: { adattamento: 'The killing is not seen: the city shows the place and its holiday morning (dossier, Gaps no. 8).' },
  IV4: { adattamento: 'The route of the procession “through all of Florence” has not come down to us. The register of the dead is dated 11 April, the day after: the city stays on Easter morning.' }
};
