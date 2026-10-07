# La città — piano di lavoro

**Stato:** prototipo v0.3 del 2 ottobre 2026: due giornate (10 febbraio e Pasqua), le scene del copione con il racconto guidato, la città estesa fino alle case delle famiglie e a Santa Reparata. La v0.2 (1° ottobre) aveva il solo capo del Ponte Vecchio la mattina di Pasqua, con figure e texture fotografiche; la v0.1, dello stesso giorno, non le aveva ancora.
**Metodo:** lo stesso di *Dopo il 79* e del dossier del gioco. La fonte accanto a ogni affermazione, **[da verificare]** dove manca il controllo sulla fonte, **le fonti divergono** dove le fonti non concordano. In più, una sezione **Lacune** e un **Registro delle verifiche** (in fondo).

---

## 1. Le decisioni

Le ha prese Domenico il 1° ottobre 2026, in tre giri di domande.

| | |
|---|---|
| **Dove** | in questo repo, come sezione a parte (`citta/`); il gioco resta leggero, per la LIM |
| **Fasi** | Florentia romana · **1216** · Firenze dei cronisti (~1300) · Firenze della Catena (~1480) · oggi |
| **Esplorazione** | tutta a piedi, come Pompei; in più il volo sopra i tetti |
| **«Completa»** | ogni strada dentro la cerchia del 1172–75, Oltrarno compreso; abitanti e mestieri; interni visitabili; luce e suoni |
| **Dispositivi** | hardware di fascia alta: PC, tablet, app iOS. Non la LIM e non lo smartphone sul posto |
| **Stile** | realismo pieno |
| **Abitanti** | animati, in movimento |
| **Calendario** | tutto a dicembre 2026, insieme al gioco. **Se il tempo non basta, si tagliano prima le fasi extra**: il 1216 esce comunque, perché serve al gioco |
| **Pubblicazione** | il repo diventa pubblico a dicembre (GitHub Pages); il PDF di Faini e la corrispondenza restano esclusi |
| **Pubblicazione anticipata** (1° ottobre) | la città esce subito, da sola, nel repository pubblico D0M3N1C0X/firenze-1216-citta con GitHub Pages, prima del parere del medievista; l'avviso «non è validato» resta in apertura. Il resto del progetto resta privato |
| **Figure** (1° ottobre, dopo il prototipo) | catena di produzione in Blender: corpi MakeHuman (MPFB, CC0), vesti costruite da script, movimenti del CMU Motion Capture Database |
| **Texture** (1° ottobre) | fotografiche CC0 da Poly Haven, tinte verso i materiali fiorentini |
| **Collegamento al gioco** (2 ottobre) | dal gioco alla città, con un link a ogni scena (`?scena=IV3`); e nella città un **racconto** guidato, scena per scena, con i testi del copione e le note del quaderno. Niente viste della città dentro il gioco: il gioco resta leggero |
| **Le altre giornate** (2 ottobre) | il 10 febbraio con la luce e la stagione giuste, giorno feriale e botteghe aperte; Pasqua resta com'è |
| **Estensione** (2 ottobre) | case delle famiglie, verso Santa Reparata, mura e porte, Mercato Vecchio |
| **Fonti per le posizioni nuove** (2 ottobre) | fonti aperte e dichiarate: Faini, OpenStreetMap, toponimi. Ogni posizione è dedotta o ipotesi, e le domande vanno al medievista (§ 10) |
| **Computer** (7 ottobre) | a novembre arriva un MacBook Pro Apple Silicon: fino ad allora si lavora con Blender 4.5 da script, sulla ricerca e sui modelli; le prove di fluidità e i render di qualità aspettano il computer nuovo |
| **Interni** (7 ottobre) | Santa Maria sopra Porta, casa degli Amidei, Santa Reparata, la sala del convito a Campi |
| **Figure** (7 ottobre) | vesti con pieghe vere, mestieri e ceti, cavalli, muli e asini, volti e capelli: in quest'ordine si comincia |
| **Fonti** (7 ottobre) | solo fonti aperte online; ogni lacuna diventa una domanda per il medievista (DOSSIER-TOPOGRAFICO.md) |

## 2. Che cosa c'è nel prototipo

- **Il terreno e l'Arno.** Il letto del fiume viene da OpenStreetMap; le rive sono naturali, perché i lungarni sono successivi. Le colline d'Oltrarno e di San Miniato sono approssimate, con ulivi e cipressi.
- **Il ponte del 1216**: quattro arcate ribassate con rostri, impalcato a schiena d'asino, nessuna bottega. È tutto ipotesi tranne il fatto che il ponte c'era, ed era l'unico.
- **La pietra di Marte** sul suo pilastro, al capo del ponte dal lato della città.
- **Le strade del 1216.** Sono i tracciati di oggi, tolti quelli che nel 1216 non c'erano (`src/dati/strade-1216.js`, con il motivo di ogni esclusione), con il fondo in terra battuta.
- **Circa 2.750 case generate** lungo le strade e sulle rive, entro 480 m dal ponte e lungo il percorso verso Santa Reparata: case-torri, botteghe, sporti di legno, gronde a travicelli, ballatoi sull'acqua.
- **Due giornate** (`src/dati/giornate.js`). **Il 10 febbraio**, la promessa rotta: sole del 17 febbraio gregoriano, foschia d'inverno, botteghe aperte con il banco sulla strada, banchi al Mercato Vecchio, rintocchi lenti e niente rondini. **La mattina di Pasqua**, il delitto: botteghe chiuse, campane a festa. Si passa dall'una all'altra con il pulsante «Giorno» o con `?giorno=febbraio`.
- **Le case delle famiglie del gioco**, ciascuna con la sua scheda: Amidei, Buondelmonti (a San Felice in Piazza), Donati (la torre presso il Corso), Uberti (dove poi sarà piazza della Signoria), Lamberti, la torre dei Fifanti.
- **Il Mercato Vecchio**, sul foro romano, e **la piazza di San Giovanni** con il Battistero e **Santa Reparata**, che ora si raggiungono a piedi; le strade aggiunte a mano sono in `src/dati/strade-1216.js` (AGGIUNTE), ciascuna con il suo motivo.
- **La cerchia del 1172–75** (`src/dati/cerchia.js`): il muro si vede nel fondale, lungo un tracciato ancora provvisorio; nell'area percorribile c'è solo la porta sulla strada per San Felice.
- **Il racconto** (pulsante «Racconto», tasto R): le scene del copione dal prologo al corteo funebre, ciascuna nel suo luogo, giornata e ora, con le scelte della classe, le note del quaderno, le parole delle fonti e la base storica. Le scene che non hanno un luogo nella città (il convito di Campi, la bottega del giudice) dicono perché. Il gioco apre la città su una scena con `?scena=CODICE`.
- **Le torri che esistono ancora** (Amidei, Baldovinetti, Buondelmonti, Mannelli, Rossi-Cerchi, Marsili e altre), costruite sulla loro impronta reale.
- **Le chiese**: Santo Stefano al Ponte, Santi Apostoli, Santa Felicita, San Jacopo, Santa Trinita, Santa Maria sopra Porta; il Battistero e Santa Reparata.
- **Porta Santa Maria**, in posizione ipotetica.
- **Il sole** calcolato per Firenze nel giorno gregoriano della giornata (17 aprile per Pasqua, 17 febbraio per il 10 febbraio); l'ora si regola dall'alba a mezzogiorno, con le ore canoniche.
- **150 persone a Pasqua, 190 il 10 febbraio**, che camminano, e gruppi fermi a parlare: davanti alle chiese a Pasqua, al mercato nei giorni feriali.
- **Le campane** (a festa a Pasqua, rintocchi lenti il 10 febbraio), il fiume, il brusio, le rondini ad aprile.
- **L'interruttore «Certezza»**, che colora tutto secondo quanto ne sappiamo. Ogni luogo ha una **scheda** con due livelli, *luogo* e *forma*, e le fonti.

## 3. Che cosa NON è

- **Non è validato.** Nessun medievista l'ha visto.
- **Le case sono generate dal programma**, non rilevate. Solo le torri con un nome hanno l'impronta di un edificio vero.
- **Il rilievo non viene da un modello del terreno**, e il letto del fiume è quello di oggi, più stretto e più regolare di allora.
- **Il delitto non c'è.** Il modello mostra il luogo, coerente con la Lacuna n. 8 del dossier sulla violenza per un pubblico di 11–12 anni.

## 4. Metodo: due livelli e tre gradi di certezza

Per ogni luogo si separano due domande. La prima riguarda il **luogo**: sappiamo che c'era, e dove? La seconda riguarda la **forma**: sappiamo com'era? La chiesa di Santo Stefano è documentata, la sua facciata nel modello è un'ipotesi. Il modello colora secondo la **forma**, perché è la forma che l'occhio prende per vera.

| Grado | Colore | Significato |
|---|---|---|
| **Documentato** | blu | attestato da fonti o da strutture superstiti datate |
| **Dedotto** | arancio | ricavato da indizi: strutture superstiti non datate, cartografia successiva, confronti |
| **Ipotesi** | grigio | ricostruzione plausibile senza un riscontro specifico |

Blu, arancio e grigio si distinguono anche con le forme più comuni di daltonismo.

## 5. Le fasi e le loro fonti

L'ordine di lavoro è anche l'ordine dei tagli: le fasi in fondo all'elenco sono le prime a slittare.

### 5.1 · 1216 (serve al gioco)
- **Fatti e luoghi del delitto:** il dossier del gioco (`docs/dossier-storico.md`), con le cronache viste attraverso Faini 2006.
- **Città:** R. Davidsohn, *Storia di Firenze*; F. Sznura, *L'espansione urbana di Firenze nel Dugento*, 1975; G. Fanelli, *Firenze. Architettura e città*, 1973 **[da verificare: reperibilità]**.
- **Lotti e isolati prima degli sventramenti:** il catasto generale toscano (anni Trenta dell'Ottocento), georeferenziato dalla Regione Toscana nel progetto CASTORE **[da verificare: licenza]**. Serve soprattutto per il Mercato Vecchio, distrutto tra il 1885 e il 1895.
- **Cartografia storica:** la pianta del Buonsignori (1584) e la *Pianta della Catena* (1471–1482 circa) **[da verificare: datazioni]**, da usare con prudenza perché sono di secoli dopo.
- **Le torri superstiti:** impronte da OpenStreetMap; per ciascuna la datazione **[da verificare]**.
- **Da ricostruire:** il tracciato della **cerchia del 1172–75** e delle sue porte. Il perimetro di `fondale.js` è disegnato a mano ed è provvisorio.

### 5.2 · Oggi
- OpenStreetMap (ODbL), con le altezze degli edifici quando ci sono; il modello digitale del terreno della Regione Toscana **[da verificare: licenza]**.
- Serve a far vedere *che cosa resta*: torri mozzate, tracciati, chiese.

### 5.3 · Firenze dei cronisti, ~1300
- Il palazzo del Popolo (Bargello, dal 1255), il palazzo dei Priori (dal 1299), la cerchia arnolfiana in costruzione (1284–1333), le torri mozzate verso il 1250, i nuovi ponti (Carraia 1218–20, Rubaconte 1237, Santa Trinita 1252), il lastricato (1237), la piazza dei Priori che si apre sulle case abbattute degli Uberti (dal 1258). Tutte le date sono **[da verificare]** su Villani e sulla letteratura.
- **La tesi resa visibile:** chi racconta il delitto (Compagni, Dante, Villani) vive in questa città, non in quella del 1216.

### 5.4 · Firenze della Catena, ~1480
- La *Pianta della Catena* come fonte da leggere criticamente, nello stesso spirito del codice Chigi nel gioco: anche un'immagine è una versione.

### 5.5 · Florentia romana
- Il castrum a scacchiera, il foro, le terme (via delle Terme), il teatro e l'anfiteatro (la curva di via Torta) **[da verificare: bibliografia archeologica aggiornata]**.

## 6. Come è fatto

- **Vite e three.js 0.169**, le stesse versioni di *Dopo il 79*. Sono anche le uniche dipendenze.
- **Che cosa è generato e che cosa no.** Case, suoni, erba e marmo sono generati nel codice (le texture in parallelo nei worker). Dal 1° ottobre le texture dei materiali da costruzione sono fotografiche (Poly Haven, CC0) e le persone vengono da Blender (MakeHuman, CC0, con i movimenti del CMU Motion Capture Database): si scaricano all'apertura, circa 90 MB in tutto, e dopo non si scarica più niente. Le licenze di terzi sono elencate nel README e nella schermata d'avvio.
- **Coordinate:** 1 unità = 1 metro, con origine al capo nord del Ponte Vecchio (x verso est, z verso sud).
- **Il cantiere** (`src/mondo/cantiere.js`) fonde migliaia di pezzi in pochi oggetti, divisi per materiale, livello di certezza e riquadro di 80 m. Per questo l'interruttore «Certezza» costa un cambio di materiale.
- **La griglia** (`src/mondo/griglia.js`) è una mappa del suolo a celle di 50 cm: strade, fiume, ponte, edifici. Decide dove si costruisce, dove si cammina e dove camminano gli abitanti.
- **Il seme è fisso**: la città è uguale a ogni apertura, così il registro delle verifiche può riferirsi a qualcosa. Attenzione: aggiungere o togliere una strada cambia la sequenza e quindi le case.
- **Le varianti di giornata.** Il cantiere costruisce a parte i pezzi che esistono solo nei giorni di festa (botteghe chiuse) o solo in quelli feriali (botteghe aperte, banchi del mercato), e la giornata li mostra o li nasconde. I banchi non fermano chi cammina: la griglia è la stessa in ogni giornata.
- **Le scene.** I testi vengono da `storia/copione.md` attraverso `scripts/copione-estrai.mjs` (`npm run copione`), che scrive `src/dati/copione.js` con le sole schermate usate dalla città (prologo–atto IV). Che cosa la città fa di ogni scena (luogo, giornata, ora, punto di vista) è deciso a mano in `src/dati/scene.js`.
- **La verifica** (`npm run verifica`) costruisce la pianta del suolo senza disegnarla e controlla che ogni luogo sia raggiungibile a piedi e che ogni scena abbia un luogo, una giornata e un punto di vista percorribile. Va lanciata dopo ogni modifica a strade, luoghi o scene.

## 7. Calendario fino al 15 dicembre

| Settimana | Città | Note |
|---|---|---|
| 1–4 ott | ✅ prototipo v0.1 e v0.2; ✅ v0.3 il 2 ottobre | giudizio di Domenico sulle figure umane |
| 5–11 ott | ✅ figure: 36 varianti in 13 ruoli, pieghe simulate, volti variati; ✅ dossier topografico avviato; ponte a cinque arcate | animali: serve il modello del cavallo |
| 12–25 ott | il 1216 su tutta la cerchia: mura e porte, strade, Mercato Vecchio, case delle famiglie del gioco; **kit edilizio** in Blender | ◐ anticipato il 2 ottobre: case delle famiglie, Mercato Vecchio e Santa Reparata come ipotesi, muro solo nel fondale. Per il resto servono il catasto pre-Risanamento e un estratto OSM più grande |
| 26 ott–1 nov | **monumenti** modellati in Blender e primi **interni** (Santa Reparata, Santa Maria sopra Porta, casa Amidei, sala di Campi) | |
| 2–8 nov | mestieri, mercato, suoni per luogo | |
| 9–15 nov | **collegamento al gioco**: ogni scena del copione diventa un luogo e un punto di vista | ◐ anticipato il 2 ottobre dalla parte della città (`?scena=`, racconto); resta il pulsante nel gioco e la prova con un docente |
| 16–22 nov | fase **oggi** | |
| 23–29 nov | fase **~1300** | |
| 30 nov–6 dic | fasi **~1480** e **Florentia** | prime candidate al taglio |
| 7–15 dic | app iOS, prestazioni, accessibilità | il repo della città è pubblico dal 1° ottobre, prima del parere del medievista |

## 8. Rischi

1. **Le persone realistiche.** Dal 7 ottobre ci sono 36 figure MakeHuman in 13 ruoli, con vesti piegate dalla simulazione del tessuto e movimenti catturati dal vero (`strumenti/figure/`). Mancano gli animali, la trama della lana e le barbe; i volti sono variati, ma non studiati sul Duecento.
2. **Le fonti topografiche.** Del 1216 non esiste nessuna pianta. Tutto ciò che si vede è ricostruito a ritroso, ed è per questo che la scheda dei luoghi e i colori della certezza non sono un accessorio.
3. **Il caricamento**: oggi circa 18 s, di cui 7 per le texture. I rimedi sono la cache nel browser e la costruzione nei worker. L'estensione del 2 ottobre (2.750 case invece di 2.050, botteghe aperte e banchi come varianti) aggiunge circa 2 s su una macchina lenta: misurati 21,4 s contro 19,6 s, senza scheda grafica.
4. **Il tempo.** Il 7 ottobre Domenico ha confermato tutto a dicembre, fasi comprese, con il computer nuovo solo a novembre: la regola dei tagli resta la rete di sicurezza.

## 9. Domande aperte per Domenico

1. ~~Le figure umane~~: decisa il 1° ottobre la strada Blender + MakeHuman + motion capture.
2. ~~Le texture~~: decise il 1° ottobre le fotografiche CC0.
3. **Il catasto CASTORE.** Prima di usarlo va controllata la licenza. Domenico ha un contatto, o si chiede direttamente alla Regione?
4. **L’hardware per le prove.** Per giudicare la fluidità serve una macchina di fascia alta, almeno per una prova ogni tanto.
5. ~~I testi del copione nella città pubblica~~: l'8 ottobre Domenico ha deciso di pubblicarli subito, insieme alla città, con l'avviso «non è validato» in apertura.
6. **Un estratto OpenStreetMap più grande.** Per la cerchia intera serve un estratto oltre i 560 m dal ponte. Da questo ambiente di lavoro l'Overpass API non è raggiungibile: si scarica da un computer con la query di `scripts/osm-estrai.mjs` allargata, o si apre l'accesso alla rete.

## 10. Lacune (da aggiungere a quelle del dossier)

18. **Il ponte del 1216**: arcate, larghezza, presenza di botteghe; la data della ricostruzione dopo la piena del 1178 (se ci fu).
19. **Il pilastro di Marte**: da quale lato del capo del ponte stava, e quanto era alto.
20. **Porta Santa Maria**: dove stava esattamente; se nel 1216 esisteva ancora come struttura.
21. **Le rive**: com'erano nel 1216 i tratti oggi occupati dai lungarni; c'erano mulini o pescaie vicino al ponte?
22. **Le torri**: quante erano nel 1216, quanto erano alte prima della mozzatura, come finivano in cima (tetto o merli).
23. **Le case**: in che proporzione erano di pietra e di legno; quanto erano diffusi gli sporti.
24. **Le vesti**: colori e fogge per ceto nel 1216, a Firenze; il colore dell'abito vallombrosano; chi portava il mantello.
Emerse il 2 ottobre 2026, estendendo la città e collegandola al gioco:

25. **Il giorno della settimana del 10 febbraio 1216.** Il dossier e il copione dicono giovedì; il calcolo sul calendario giuliano dà mercoledì (registro, n. 6). Che cosa dice esattamente la cronaca, e che cosa ne ricava Faini (p. 16)?
26. **Le case delle famiglie.** Dove abitavano nel 1216 i Donati (la torre presso il Corso?), gli Uberti (l'area della futura piazza della Signoria), i Lamberti (via dei Lamberti o via Lambertesca?), i Fifanti (la torre d'Oltrarno che porta il loro nome?), gli Amidei e i Buondelmonti (popolo di San Felice in Piazza).
27. **Il Mercato Vecchio**: forma, misure, chiese intorno e disposizione dei banchi prima dello sventramento del 1885–1895.
28. **Santa Reparata e la piazza di San Giovanni**: pianta e misure della cattedrale dai rilievi degli scavi; estensione della piazza e del cimitero nel 1216.
29. **La cerchia del 1172–75**: tracciato, porte (sei e quattro postierle?), data d'inizio (1172 o 1173), altezza del muro; dove stava la porta d'Oltrarno verso San Felice e se si chiamava già di San Pier Gattolino.
30. **Le botteghe aperte**: forma del banco e degli sportelli nel Duecento fiorentino.
31. **La strada da via de' Guicciardini a San Felice**: tracciato prima di piazza Pitti; e il nome nel 1216 della strada che oggi è via dei Calzaiuoli.
32. **Il corteo funebre**: per quali strade passò (le fonti dicono solo «per tutta Firenze»).

Emerse il 7 ottobre 2026 dalla ricerca topografica: 33–36, in DOSSIER-TOPOGRAFICO.md, § 10.

## 11. Registro delle verifiche

1. **01/10/2026 — Data astronomica.** Pasqua 1216 = 10 aprile giuliano (Faini p. 16) = 17 aprile gregoriano prolettico, scarto di 7 giorni nel XIII secolo. Il sole è calcolato su questa data.
2. **01/10/2026 — Ponti.** Nel modello del 1216 non ci sono il ponte alla Carraia (iniziato nel 1218), Rubaconte (1237) e Santa Trinita (1252). Date **[da verificare]** su Villani.
3. **01/10/2026 — Strade.** Esclusi i lungarni, gli Uffizi, l'area del Mercato Vecchio sventrata nell'Ottocento e piazza Pitti; l'elenco con i motivi è in `src/dati/strade-1216.js`.
4. **01/10/2026 — Fondo stradale.** Terra battuta: la lastricatura generale è attribuita al podestà Rubaconte nel 1237 **[da verificare: Villani VI]**.
5. **02/10/2026 — Strade entrate con l'estratto allargato.** Portando l'estrazione da 420 a 560 m sono entrati il ponte alla Carraia (1218), il ponte alle Grazie (Rubaconte, 1237), il lungarno Vespucci, una pista ciclabile, piazza Goldoni e piazza Santo Spirito: esclusi dal 1216, con il motivo, in `strade-1216.js`.
6. **02/10/2026 — Il 10 febbraio 1216 era un mercoledì.** Calcolo con il numero del giorno giuliano e, in modo indipendente, con il calendario gregoriano prolettico (scarto di 7 giorni nel Duecento); per controllo, il 10 aprile 1216 risulta domenica, cioè Pasqua. Il dossier e il copione dicono giovedì: **[da verificare]** sulla cronaca e su Faini p. 16 (lacuna n. 25). La città scrive solo «10 febbraio».
7. **02/10/2026 — La citazione di Mosca.** Nella scheda di Santa Maria sopra Porta: «cosa fatta cappa à», come nello pseudo-Brunetto, e non la forma del proverbio.
8. **02/10/2026 — Nessuna piazza della Signoria nel 1216.** Controllato che l'area della futura piazza sia costruita: l'estratto non la contiene come strada, e lì il modello mette le case degli Uberti.
9. **07/10/2026 — Ponte.** Da quattro a cinque arcate: il ponte ricostruito dopo il crollo del 1177 ne aveva cinque secondo Wikipedia **[da verificare su fonte scientifica]** (DOSSIER-TOPOGRAFICO.md, § 3).
10. **07/10/2026 — Porta Santa Maria.** Le fonti divergono sulla posizione (via Vacchereccia o incrocio con Lambertesca e Borgo Santi Apostoli): la scheda lo dice, il modello mostra per ora la prima.
