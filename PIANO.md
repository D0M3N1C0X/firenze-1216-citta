# La città — piano di lavoro

**Stato:** prototipo v0.2 del 1° ottobre 2026 (la v0.1, dello stesso giorno, non aveva ancora figure e texture fotografiche): il capo del Ponte Vecchio, la mattina di Pasqua del 1216.
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

## 2. Che cosa c'è nel prototipo

- **Il terreno e l'Arno.** Il letto del fiume viene da OpenStreetMap; le rive sono naturali, perché i lungarni sono successivi. Le colline d'Oltrarno e di San Miniato sono approssimate, con ulivi e cipressi.
- **Il ponte del 1216**: quattro arcate ribassate con rostri, impalcato a schiena d'asino, nessuna bottega. È tutto ipotesi tranne il fatto che il ponte c'era, ed era l'unico.
- **La pietra di Marte** sul suo pilastro, al capo del ponte dal lato della città.
- **Le strade del 1216.** Sono i tracciati di oggi, tolti quelli che nel 1216 non c'erano (`src/dati/strade-1216.js`, con il motivo di ogni esclusione), con il fondo in terra battuta.
- **Circa 2.000 case generate** lungo le strade e sulle rive: case-torri, botteghe chiuse per la festa, sporti di legno, gronde a travicelli, ballatoi sull'acqua.
- **Le torri che esistono ancora** (Amidei, Baldovinetti, Buondelmonti, Mannelli, Rossi-Cerchi, Marsili e altre), costruite sulla loro impronta reale.
- **Le chiese**: Santo Stefano al Ponte, Santi Apostoli, Santa Felicita, San Jacopo, Santa Trinita, Santa Maria sopra Porta. Sullo sfondo il Battistero e Santa Reparata.
- **Porta Santa Maria**, in posizione ipotetica.
- **Il sole del 17 aprile gregoriano**, che corrisponde al 10 aprile giuliano, calcolato per Firenze; l'ora si regola dall'alba a mezzogiorno, con le ore canoniche.
- **150 persone che camminano** e alcuni gruppi fermi a parlare davanti alle chiese e ai capi del ponte.
- **Campane a festa** da cinque chiese, il fiume, il brusio, le rondini.
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
- **Il seme è fisso**: la città è uguale a ogni apertura, così il registro delle verifiche può riferirsi a qualcosa.

## 7. Calendario fino al 15 dicembre

| Settimana | Città | Note |
|---|---|---|
| 1–4 ott | ✅ prototipo v0.1 | giudizio di Domenico sulle figure umane |
| 5–11 ott | ✅ figure (anticipato al 1° ott.); vesti migliori; caricamento sotto gli 8 s | |
| 12–25 ott | il 1216 su tutta la cerchia: mura e porte, strade, Mercato Vecchio, case delle famiglie del gioco | serve il catasto pre-Risanamento |
| 26 ott–1 nov | monumenti del 1216 e primi **interni** (casa Amidei, Santa Maria sopra Porta, Santa Reparata) | |
| 2–8 nov | mestieri, mercato, suoni per luogo | |
| 9–15 nov | **collegamento al gioco**: ogni scena del copione diventa un luogo e un punto di vista | prova con un docente |
| 16–22 nov | fase **oggi** | |
| 23–29 nov | fase **~1300** | |
| 30 nov–6 dic | fasi **~1480** e **Florentia** | prime candidate al taglio |
| 7–15 dic | app iOS, prestazioni, accessibilità | il repo della città è pubblico dal 1° ottobre, prima del parere del medievista |

## 8. Rischi

1. **Le persone realistiche.** Dal 1° ottobre ci sono 20 figure MakeHuman animate con movimenti catturati dal vero (`strumenti/figure/`). Restano da migliorare le vesti (pieghe, tessuto) e la varietà; i volti sono quelli di MakeHuman, non studiati sul Duecento.
2. **Le fonti topografiche.** Del 1216 non esiste nessuna pianta. Tutto ciò che si vede è ricostruito a ritroso, ed è per questo che la scheda dei luoghi e i colori della certezza non sono un accessorio.
3. **Il caricamento**: oggi circa 18 s, di cui 7 per le texture. I rimedi sono la cache nel browser e la costruzione nei worker.
4. **Il tempo.** Città e gioco insieme in dieci settimane: la regola dei tagli è già decisa.

## 9. Domande aperte per Domenico

1. ~~Le figure umane~~: decisa il 1° ottobre la strada Blender + MakeHuman + motion capture.
2. ~~Le texture~~: decise il 1° ottobre le fotografiche CC0.
3. **Il catasto CASTORE.** Prima di usarlo va controllata la licenza. Domenico ha un contatto, o si chiede direttamente alla Regione?
4. **L’hardware per le prove.** Per giudicare la fluidità serve una macchina di fascia alta, almeno per una prova ogni tanto.

## 10. Lacune (da aggiungere a quelle del dossier)

18. **Il ponte del 1216**: arcate, larghezza, presenza di botteghe; la data della ricostruzione dopo la piena del 1178 (se ci fu).
19. **Il pilastro di Marte**: da quale lato del capo del ponte stava, e quanto era alto.
20. **Porta Santa Maria**: dove stava esattamente; se nel 1216 esisteva ancora come struttura.
21. **Le rive**: com'erano nel 1216 i tratti oggi occupati dai lungarni; c'erano mulini o pescaie vicino al ponte?
22. **Le torri**: quante erano nel 1216, quanto erano alte prima della mozzatura, come finivano in cima (tetto o merli).
23. **Le case**: in che proporzione erano di pietra e di legno; quanto erano diffusi gli sporti.
24. **Le vesti**: colori e fogge per ceto nel 1216, a Firenze.

## 11. Registro delle verifiche

1. **01/10/2026 — Data astronomica.** Pasqua 1216 = 10 aprile giuliano (Faini p. 16) = 17 aprile gregoriano prolettico, scarto di 7 giorni nel XIII secolo. Il sole è calcolato su questa data.
2. **01/10/2026 — Ponti.** Nel modello del 1216 non ci sono il ponte alla Carraia (iniziato nel 1218), Rubaconte (1237) e Santa Trinita (1252). Date **[da verificare]** su Villani.
3. **01/10/2026 — Strade.** Esclusi i lungarni, gli Uffizi, l'area del Mercato Vecchio sventrata nell'Ottocento e piazza Pitti; l'elenco con i motivi è in `src/dati/strade-1216.js`.
4. **01/10/2026 — Fondo stradale.** Terra battuta: la lastricatura generale è attribuita al podestà Rubaconte nel 1237 **[da verificare: Villani VI]**.
