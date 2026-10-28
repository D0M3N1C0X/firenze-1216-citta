import { DOMANDE_EN, GIORNATE_EN, LUOGHI_EN, TAPPE_EN, portaEN } from '../dati/inglese.js';

/* =====================================================================
   LA LINGUA DELLA PAGINA: italiano o inglese (28 ottobre 2026)

   L'italiano resta la lingua di riferimento: i testi italiani stanno nei
   file dei dati, le traduzioni in dati/inglese.js. La lingua si sceglie
   nelle Impostazioni o con ?lang=en; il dispositivo la ricorda. Al primo
   arrivo vale quella del browser: italiano per chi lo usa in italiano,
   inglese per tutti gli altri. Si cambia senza ricaricare la città.
   Il racconto (le scene del copione del gioco) per ora è solo in italiano.
   ===================================================================== */

const PAROLE = {
  'avvio.sopra': ['Cosa fatta capo ha · la città', 'Cosa fatta capo ha · the city'],
  'avvio.titolo': ['Firenze, la mattina di Pasqua del 1216', 'Florence on Easter morning 1216'],
  'giorno.febbraio': ['10 febbraio', '10 February'],
  'giorno.pasqua': ['Pasqua', 'Easter'],
  'campi.titolo': ['Campi, il convito di gennaio 1216', 'Campi, the January 1216 banquet'],
  'campi.data': ['Gennaio 1216 · il castello dei Mazzinghi, sei miglia a nord-ovest di Firenze', 'January 1216 · the Mazzinghi castle, six miles north-west of Florence'],
  'campi.intro': ['Il convito in cui comincia la storia: un castello da percorrere a piedi, costruito a partire dalle fonti. Dove le fonti si fermano, il modello lo dice: l\'interruttore <b>Che cosa è certo</b> colora ogni cosa secondo quanto ne sappiamo.', 'The banquet where the story begins: a castle to walk through, built from the sources. Where the sources stop, the model says so: the <b>What is certain</b> switch colours everything by how much we know.'],
  'campi.nonE.lista': ['<li><b>Non è una ricostruzione validata.</b> È un prototipo, e un medievista non l\'ha ancora visto.</li><li><b>Il castello non c\'è più.</b> Recinto, sala e arredo sono ricostruiti sul tipo dei castelli del contado: sono un\'ipotesi.</li><li><b>Gli invitati non hanno un volto.</b> Chi sia ciascuno non lo diciamo: lo racconta il gioco, con le fonti.</li>', '<li><b>It is not a validated reconstruction.</b> It is a prototype, and no medievalist has seen it yet.</li><li><b>The castle is gone.</b> Walls, hall and furnishings are rebuilt on the type of the castles of the countryside: they are a hypothesis.</li><li><b>The guests have no faces.</b> We do not say who each one is: the game tells it, with the sources.</li>'],
  'errore.webgl': ['<b>Questo browser non riesce a disegnare la città in 3D.</b><br>Prova con Safari, Chrome o Firefox aggiornati, o su un altro computer.', '<b>This browser cannot draw the city in 3D.</b><br>Try an up-to-date Safari, Chrome or Firefox, or another computer.'],
  'avvio.intro': ['Una città da percorrere a piedi, ricostruita a partire dalle fonti. Dove le fonti non dicono niente, la città lo dice.', 'A city to walk through, rebuilt from the sources. Where the sources say nothing, the city tells you so.'],
  'avvio.visita': ['Visita guidata<small>dieci tappe, pochi minuti</small>', 'Guided visit<small>ten stops, a few minutes</small>'],
  'avvio.esplora': ['Esplora da solo<small>vai dove vuoi</small>', 'Explore on your own<small>go wherever you like</small>'],
  'avvio.come': ['Per camminare, tocca la strada dove vuoi andare. Per guardarti intorno, trascina.', 'To walk, tap the street where you want to go. To look around, drag.'],
  'avvio.nonE': ['Che cosa non è', 'What it is not'],
  'avvio.nonE.lista': ['<li><b>Non è una ricostruzione validata.</b> È un prototipo, e un medievista non l\'ha ancora visto.</li><li><b>Le case sono generate.</b> Solo le chiese e le torri con un nome hanno la pianta di un edificio vero.</li><li><b>Il delitto non c\'è.</b> Il modello mostra il luogo, non l\'uccisione.</li>',
    '<li><b>It is not a validated reconstruction.</b> It is a prototype, and no medievalist has seen it yet.</li><li><b>The houses are generated.</b> Only the churches and the named towers have the plan of a real building.</li><li><b>The murder is not shown.</b> The model shows the place, not the killing.</li>'],
  'avvio.crediti': ['Dati cartografici © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL) · texture Poly Haven (CC0) · persone MakeHuman (CC0) con i movimenti del <a href="http://mocap.cs.cmu.edu" target="_blank" rel="noopener">CMU Motion Capture Database</a>',
    'Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL) · textures Poly Haven (CC0) · people MakeHuman (CC0) with movements from the <a href="http://mocap.cs.cmu.edu" target="_blank" rel="noopener">CMU Motion Capture Database</a>'],
  'carico.titolo': ['Preparo la città: {pc}%{quanto}', 'Preparing the city: {pc}%{quanto}'],
  'carico.ancora': [' · ancora circa {n} secondi', ' · about {n} seconds left'],
  'carico.quasi': [' · quasi pronta', ' · almost ready'],
  'carico.pronta': ['La città è pronta.', 'The city is ready.'],
  'carico.inizio': ['Preparo la città…', 'Preparing the city…'],
  'carico.entro': ['entro appena la città è pronta…', 'going in as soon as the city is ready…'],
  'errore.titolo': ['Non sono riuscito a preparare la città.', 'I could not prepare the city.'],
  'errore.testo': ['Ricarica la pagina; se succede ancora, prova con un altro browser. (Dettaglio tecnico: {e})', 'Reload the page; if it happens again, try another browser. (Technical detail: {e})'],
  'errore.riprova': ['Riprova', 'Try again'],
  'barra.ora': ['Ora', 'Time'],
  'barra.certezza': ['Che cosa è certo', 'What is certain'],
  'barra.certezza.t': ['Colora la città secondo quanto ne sappiamo (tasto C)', 'Colour the city by how much we know (key C)'],
  'barra.volo': ['Dall\'alto', 'From above'],
  'barra.volo.t': ['Guarda la città dall\'alto (tasto F)', 'Look at the city from above (key F)'],
  'barra.racconto': ['Racconto', 'Story'],
  'barra.racconto.t': ['Le scene del gioco, nei loro luoghi (tasto R)', 'The scenes of the game, in their places (key R)'],
  'barra.luoghi': ['Vai a…', 'Go to…'],
  'barra.luoghi.a': ['Vai a un luogo', 'Go to a place'],
  'barra.luoghi.t': ['Vai in un luogo e leggi la sua scheda', 'Go to a place and read its card'],
  'barra.aiuto': ['Aiuto', 'Help'],
  'barra.aiuto.t': ['Come si usa', 'How to use it'],
  'barra.impostazioni': ['Impostazioni', 'Settings'],
  'barra.impostazioni.t': ['Giornata, immagini, testo grande, movimento ridotto, lingua', 'Day, images, larger text, reduced motion, language'],
  'barra.ora.t': ['L\'ora del giorno', 'The time of day'],
  'ora.solare': ['{h} ora solare · {c}', '{h} solar time · {c}'],
  'legenda.titolo': ['Che cosa è certo', 'What is certain'],
  'livello.documentato': ['Documentato', 'Documented'],
  'livello.dedotto': ['Dedotto', 'Deduced'],
  'livello.ipotesi': ['Ipotesi', 'Hypothesis'],
  'legenda.documentato': ['lo dicono le fonti, o c\'è ancora oggi', 'the sources say so, or it still stands'],
  'legenda.dedotto': ['ricavato da indizi: resti senza data, piante più tarde, confronti', 'worked out from clues: undated remains, later maps, comparisons'],
  'legenda.ipotesi': ['ricostruito per somiglianza, senza una prova diretta', 'rebuilt by comparison, without direct proof'],
  'scheda.luogo': ['Luogo', 'Place'],
  'scheda.forma': ['Forma', 'Shape'],
  'scheda.fonti': ['Fonti', 'Sources'],
  'scheda.fonti.it': ['Fonti (in italiano)', 'Sources (in Italian)'],
  'scheda.leggi': ['Leggi la scheda', 'Read the card'],
  'scheda.leggiFonti': ['Leggi la scheda, con le fonti', 'Read the card, with its sources'],
  'scheda.chiudi': ['Chiudi la scheda', 'Close the card'],
  'ascolta': ['Ascolta', 'Listen'],
  'ascolta.domanda': ['Ascolta la domanda', 'Listen to the question'],
  'elenco.titolo': ['Vai a…', 'Go to…'],
  'elenco.visita': ['Ricomincia la visita guidata', 'Start the guided visit again'],
  'elenco.porte': ['Le porte della cerchia ({n})', 'The gates of the walls ({n})'],
  'elenco.chiudi': ['Chiudi l\'elenco', 'Close the list'],
  'aiuto.titolo': ['Come si usa', 'How to use it'],
  'aiuto.lista': ['<li><b>Camminare</b>Tocca o clicca la strada dove vuoi andare: ci vai a piedi, girando gli angoli da solo.</li><li><b>Guardarti intorno</b>Trascina con il dito o con il mouse.</li><li><b>Andare in un luogo</b>«Vai a…» apre l\'elenco dei luoghi; la mappa nell\'angolo apre la pianta. Ogni luogo ha una scheda con le fonti.</li><li><b>Vedere dall\'alto</b>Premi «Dall\'alto», poi tocca un punto della città per volarci sopra.</li><li><b>Sapere che cosa è certo</b>«Che cosa è certo» colora ogni edificio secondo quanto ne sappiamo.</li><li><b>Il racconto</b>«Racconto» mostra le scene del gioco, ciascuna nel suo luogo.</li><li><b>Con la tastiera</b>Frecce o W A S D per camminare, Maiuscolo per andare più svelti.</li>',
    '<li><b>Walking</b>Tap or click the street where you want to go: you walk there, turning the corners by yourself.</li><li><b>Looking around</b>Drag with your finger or the mouse.</li><li><b>Going to a place</b>«Go to…» opens the list of places; the map in the corner opens the plan. Every place has a card with its sources.</li><li><b>Seeing from above</b>Press «From above», then tap a point of the city to fly over it.</li><li><b>Knowing what is certain</b>«What is certain» colours every building by how much we know about it.</li><li><b>The story</b>«Story» shows the scenes of the game, each in its place (in Italian).</li><li><b>With the keyboard</b>Arrows or W A S D to walk, Shift to go faster.</li>'],
  'aiuto.visita': ['Fai la visita guidata', 'Take the guided visit'],
  'aiuto.chiudi': ['Chiudi l\'aiuto', 'Close help'],
  'imp.titolo': ['Impostazioni', 'Settings'],
  'imp.giornata': ['Giornata', 'Day'],
  'imp.immagini': ['Immagini', 'Images'],
  'imp.belle': ['Più belle', 'Finer'],
  'imp.leggere': ['Più leggere', 'Lighter'],
  'imp.testo': ['Testo più grande', 'Larger text'],
  'imp.movimento': ['Movimento ridotto<small>il passo non ondeggia, niente dissolvenze</small>', 'Reduced motion<small>no swaying step, no fades</small>'],
  'imp.voce': ['Leggi ad alta voce le tappe<small>con la voce del dispositivo</small>', 'Read the stops aloud<small>with the device\'s voice</small>'],
  'imp.mappa': ['Mappa nell\'angolo', 'Map in the corner'],
  'imp.lingua': ['Lingua', 'Language'],
  'imp.chiudi': ['Chiudi le impostazioni', 'Close settings'],
  'nota.campi': ['A Campi c\'è un giorno solo: il convito di gennaio.', 'At Campi there is only one day: the January banquet.'],
  'nota.pasqua': ['La mattina del delitto: botteghe chiuse, campane a festa.', 'The morning of the murder: shops closed, bells ringing for the feast.'],
  'nota.febbraio': ['Il giorno della promessa rotta: botteghe aperte, mercato.', 'The day of the broken promise: shops open, market.'],
  'avviso.inizio': ['Tocca la strada dove vuoi andare. Trascina per guardarti intorno.', 'Tap the street where you want to go. Drag to look around.'],
  'avviso.volo': ['Tocca un punto della città per volarci sopra. Per tornare a piedi, premi di nuovo «Dall\'alto».', 'Tap a point of the city to fly over it. To walk again, press «From above» once more.'],
  'avviso.dopoVisita': ['Ora esplora da solo: tocca la strada dove vuoi andare, trascina per guardarti intorno.', 'Now explore on your own: tap the street where you want to go, drag to look around.'],
  'avviso.lento': ['Questo computer fa fatica: ho alleggerito le immagini. Puoi cambiarlo in Impostazioni.', 'This computer is struggling: I made the images lighter. You can change it in Settings.'],
  'avviso.cielo': ['Lì non c\'è una strada: tocca un punto della strada, o la facciata di una casa per andarci davanti.', 'There is no street there: tap a point of the street, or a house front to walk up to it.'],
  'avviso.lontano': ['È lontano: per arrivarci prima usa «Vai a…» o «Dall\'alto».', 'It is far away: to get there sooner use «Go to…» or «From above».'],
  'avviso.muro': ['Da qui a piedi non ci si arriva: forse è dietro un muro o dall\'altra parte del fiume.', 'You cannot walk there from here: it may be behind a wall or across the river.'],
  'vicino.leggi': ['Leggi la scheda', 'Read the card'],
  'visita.sopra': ['Visita guidata · tappa {i} di {n}', 'Guided visit · stop {i} of {n}'],
  'visita.esci': ['Esci dalla visita', 'Leave the visit'],
  'visita.indietro': ['◀ Indietro', '◀ Back'],
  'visita.avanti': ['Avanti ▶', 'Next ▶'],
  'visita.fine': ['Esplora da solo ▶', 'Explore on your own ▶'],
  'visita.domande': ['Quattro domande per la classe', 'Four questions for the class'],
  'domande.sopra': ['Domande per la classe · {k} di {n}', 'Questions for the class · {k} of {n}'],
  'domande.titolo': ['Domande per la classe', 'Questions for the class'],
  'domande.risposte': ['Le risposte', 'The answers'],
  'domande.giusto': ['Giusto.', 'Right.'],
  'domande.no': ['Non proprio.', 'Not quite.'],
  'domande.prossima': ['Prossima domanda ▶', 'Next question ▶'],
  'domande.risultato': ['Vedi il risultato ▶', 'See the result ▶'],
  'domande.fine': ['{g} risposte giuste su {n}', '{g} right answers out of {n}'],
  'domande.finetesto': ['Ogni risposta ha la sua scheda, con le fonti: si trovano tutte in «Vai a…».', 'Every answer has its card, with sources: you will find them all in «Go to…».'],
  'domande.ricomincia': ['Ricomincia la visita', 'Start the visit again'],
  'mappa.apri': ['Apri la pianta della città', 'Open the plan of the city'],
  'mappa.titolo': ['La pianta della città', 'The plan of the city'],
  'mappa.nota': ['La freccia rossa sei tu. Tocca un luogo per andarci.', 'The red arrow is you. Tap a place to go there.'],
  'mappa.qui': ['Tu sei qui', 'You are here'],
  'mappa.chiudi': ['Chiudi la pianta', 'Close the plan'],
  'racconto.solo': ['', 'The scenes of the game are in Italian for now.'],
  'scena.dalGioco': ['Dal gioco: scena {id}, «{t}»', 'From the game: scene {id}, «{t}» (in Italian)'],
  'scena.entra': ['Entra nella scena<small>la città si apre lì, con il racconto</small>', 'Enter the scene<small>the city opens there, with the story</small>'],
  'campi.entra': ['Entra nel castello<small>gli invitati sono già a tavola</small>', 'Enter the castle<small>the guests are already at table</small>']
};

// le ore canoniche: in inglese i nomi della liturgia
const ORE_EN = { 'Mattutino': 'Matins', 'Lodi, all\'alba': 'Lauds, at dawn', 'Prima': 'Prime', 'tra Prima e Terza': 'between Prime and Terce', 'Terza': 'Terce', 'tra Terza e Sesta': 'between Terce and Sext', 'Sesta': 'Sext', 'tra Sesta e Nona': 'between Sext and None', 'Nona': 'None', 'tra Nona e Vespro': 'between None and Vespers', 'Vespro': 'Vespers', 'Compieta': 'Compline', 'Notte': 'Night' };

// le frasi della barra di caricamento
const FASI_EN = {
  'Impasto la calce e cuocio i coppi…': 'Mixing the lime and firing the roof tiles…', 'Il cielo del mattino…': 'The morning sky…', 'Il cielo di gennaio…': 'The January sky…',
  'Il letto dell\'Arno e le colline…': 'The bed of the Arno and the hills…', 'Le strade del 1216…': 'The streets of 1216…', 'Il ponte, le chiese, le torri…': 'The bridge, the churches, the towers…',
  'Le mura, le porte, il fossato…': 'The walls, the gates, the ditch…', 'Le case, una per una…': 'The houses, one by one…', 'Muro su muro…': 'Wall upon wall…',
  'La gente esce di casa…': 'People come out of their houses…', 'La piana di Campi…': 'The plain of Campi…', 'Il castello dei Mazzinghi…': 'The Mazzinghi castle…', 'Gli invitati prendono posto…': 'The guests take their seats…'
};

const ricordata = () => { try { return localStorage.getItem('citta.lingua'); } catch (e) { return null; } };
const richiesta = new URLSearchParams(location.search).get('lang');
let lingua = ['it', 'en'].includes(richiesta) ? richiesta : ricordata() || ((navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en');
const ascoltatori = [];

export const lang = () => lingua;
export const inglese = () => lingua === 'en';

/** Un testo dell'interfaccia, con i segnaposto {nome} riempiti. */
export function t(k, v = {}) {
  const coppia = PAROLE[k];
  let s = coppia ? coppia[lingua === 'en' ? 1 : 0] : k;
  for (const [n, x] of Object.entries(v)) s = s.replaceAll(`{${n}}`, x);
  return s;
}

export const ora = c => (lingua === 'en' ? ORE_EN[c] || c : c);
export const fase = f => (lingua === 'en' ? FASI_EN[f] || f : f);

/** La scheda di un luogo nella lingua della pagina: { nome, testo, luogo, forma } (le note dei due livelli). */
export function scheda(l) {
  if (lingua === 'en') {
    const e = l.porta ? portaEN(l.porta) : LUOGHI_EN[l.id];
    if (e) return e;
  }
  return { nome: l.nome, testo: l.testo, luogo: l.luogo.nota, forma: l.forma.nota };
}
export const nomeLuogo = l => scheda(l).nome;

/** Una tappa della visita, una domanda, una giornata: nella lingua della pagina. */
export const tappa = (t0, i) => (lingua === 'en' && TAPPE_EN[i] ? { ...t0, ...TAPPE_EN[i] } : t0);
export const domanda = (d, k) => (lingua === 'en' && DOMANDE_EN[k] ? { ...d, ...DOMANDE_EN[k] } : d);
export const giornata = g => (lingua === 'en' && GIORNATE_EN[g.id] ? { ...g, ...GIORNATE_EN[g.id] } : g);

/** Si chiama quando la lingua cambia: per ridisegnare un pannello aperto. */
export function suLingua(fn) { ascoltatori.push(fn); }

/** I testi fissi della pagina: data-t (testo), data-t-html, data-t-aria, data-t-title. */
export function applicaTesti(radice = document) {
  document.documentElement.lang = lingua;
  for (const el of radice.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of radice.querySelectorAll('[data-t-html]')) el.innerHTML = t(el.dataset.tHtml);
  for (const el of radice.querySelectorAll('[data-t-aria]')) el.setAttribute('aria-label', t(el.dataset.tAria));
  for (const el of radice.querySelectorAll('[data-t-title]')) el.title = t(el.dataset.tTitle);
}

export function impostaLingua(l) {
  if (!['it', 'en'].includes(l) || l === lingua) return;
  lingua = l;
  try { localStorage.setItem('citta.lingua', l); } catch (e) { /* niente */ }
  applicaTesti();
  for (const fn of ascoltatori) fn(l);
}
