# Firenze nel 1216 — dossier topografico

**Stato:** prima raccolta del 7 ottobre 2026, solo da fonti aperte online. Serve a decidere che cosa costruire e come, e a preparare le domande per il medievista.

**Convenzioni:** sono quelle del progetto. Accanto a ogni affermazione c'è la fonte. **[da verificare]** segna ciò che non è stato controllato sulla fonte primaria o sulla letteratura scientifica. **Le fonti divergono** segna i casi in cui le fonti non concordano. Molte voci qui sotto vengono da Wikipedia, che a sua volta cita soprattutto P. Bargellini ed E. Guarnieri, *Le strade di Firenze* (1977–78): vanno lette come piste, non come prove.

---

## 1. Le mura del 1172–1175

| | |
|---|---|
| **Date** | costruite «tra il 1172 e il 1175», «piuttosto in fretta» |
| **Superficie** | circa 75 ettari, contro i circa 24 della città romana |
| **Lato nord** | via dei Gori, dei Pucci, Bufalini e Sant'Egidio, fino a piazza Salvemini; San Lorenzo per la prima volta dentro le mura |
| **Lato est** | via Verdi e via de' Benci, con il fossato |
| **Lato sud, sulla riva destra** | parallelo all'Arno, «lungo via Lambertesca, borgo Santi Apostoli, via del Parione» |
| **Lato ovest** | via dei Fossi, via del Giglio, via del Canto dei Nelli |
| **Oltrarno** | per la prima volta vere fortificazioni in muratura, ma in parte affidate alle pareti delle case senza aperture verso l'esterno e a una palizzata |

**Porte e postierle del lato sud, sulla riva destra:** la postierla d'Arno (piazza Mentana), la postierla d'Altafronte (piazza dei Giudici), **Porta Santa Maria (via Por Santa Maria)** e la postierla di Carraia (piazza Goldoni).
**Porte d'Oltrarno:** Porta Vecchia (via San Niccolò), Porta Romana o di Santa Lucia dei Magnoli (piazza de' Mozzi), Porta di Piazza (piazza San Felice in Piazza) e Porta Pisana o di San Jacopo (in fondo a via di Santo Spirito).

Fonte: [Wikipedia, «Mura di Firenze»](https://it.wikipedia.org/wiki/Mura_di_Firenze), che rimanda a Bargellini-Guarnieri **[da verificare]**.

**Che cosa cambia per il modello.** Il perimetro della città nel fondale è disegnato a mano e va rifatto su questo tracciato. Il caso più delicato è il lato sud: se le mura correvano lungo Lambertesca e Borgo Santi Apostoli, la striscia tra le mura e il fiume (dove stanno la torre degli Amidei e Santo Stefano al Ponte) era *fuori* dalla cerchia. Oppure le mura correvano più vicine all'acqua e quelle vie le costeggiavano solo dall'interno. Le postierle d'Arno e d'Altafronte, che stanno proprio sul fiume, fanno pensare alla seconda ipotesi **[da verificare: domanda per il medievista]**.

### Aggiornamento del 12–17 ottobre 2026: la cerchia nel modello

La stessa voce di Wikipedia, riletta il 12 ottobre, dà l'elenco completo delle porte, ciascuna con la via o la piazza di oggi:

| Lato | Porte e postierle |
|---|---|
| Ovest | Porta a San Paolo (via Palazzuolo); postierle del Trebbio (via del Trebbio), della Baschiera (via de' Panzani), di Campo Corbolini (via Faenza) |
| Nord | Porta di San Lorenzo (via de' Ginori); postierla degli Spadai (fine di via de' Martelli); Porta di Balla (via dei Servi, piazzetta dei Visdomini); postierla degli Albertinelli (borgo Pinti); Porta San Piero (piazza Salvemini) |
| Est | Porta Ghibellina (via Ghibellina); Porta d'Isola d'Arno o di San Simone (via dell'Anguillara); Porta dei Buoi (corso dei Tintori) |
| Sud, riva destra | postierla d'Arno (piazza Mentana); postierla d'Altafronte (piazza dei Giudici); Porta Santa Maria; postierla di Carraia (piazza Goldoni) |
| Oltrarno | Porta Vecchia (via di San Niccolò, verso via del Giardino Serristori); Porta Romana o di Santa Lucia dei Magnoli (piazza de' Mozzi); Porta di Piazza (piazza San Felice); una porta in piazza de' Frescobaldi, lungo via Maggio; Porta Pisana o di San Jacopo (fondo di via di Santo Spirito) |

La fonte aggiunge che il muro era «in pietre di fiume e materiali di recupero» (Scampoli 2010, p. 233), che il fossato è attestato lungo via Verdi e via de' Benci, e che in Oltrarno non c'erano «vere fortificazioni in muratura»: chiudevano le case, con le pareti verso l'esterno senza aperture, e una palizzata. Il recinto di Santo Spirito è «dopo il 1260».

**Come lo costruisce il modello** (`src/dati/cerchia.js`, `src/mondo/mura.js`):
- il muro segue l'asse delle vie che la fonte nomina, prese da un nuovo estratto OpenStreetMap del 12 ottobre; dove la fonte non nomina una via (piazza Santa Maria Novella, piazza Madonna degli Aldobrandini, piazza Salvemini, piazza Santa Croce, piazza Mentana) va dritto da un capo all'altro. Tracciato «dedotto»; altezza (10 m), spessore (2,2 m) e merli «ipotesi»;
- ogni porta sta dove la sua via incontra il muro; le porte hanno una torre, le postierle un varco ad arco;
- il fossato corre fuori dal muro solo lungo via Verdi e via de' Benci, interrotto davanti alle porte;
- in Oltrarno una palizzata disegnata a mano dietro le case di via di San Niccolò, de' Bardi, della strada davanti a palazzo Pitti e di via di Santo Spirito, con le porte di legno. Via Maggio resta fuori: la fonte mette una porta a ciascuno dei suoi capi, e il recinto di Santo Spirito, più a ovest, è successivo. Tutto «ipotesi»;
- fuori dalle porte, i borghi lungo le strade, per circa 200 m (ipotesi).

**Il lato sud (domanda 33): un indizio nuovo.** Sulla pianta di oggi via dei Vagellai e via dei Saponai, dove la fonte mette il muro, stanno 80–90 m dentro la riva. Almeno a est, dunque, il muro non correva lungo l'acqua. Per il tratto da piazza dei Giudici a piazza Goldoni, «a ridosso» di via Lambertesca, borgo Santi Apostoli e via del Parione, resta aperta la domanda: il modello non costruisce niente e, con l'interruttore Certezza acceso, mostra le due linee possibili, trasparenti.

## 2. Porta Santa Maria e Santa Maria sopra Porta

**Le fonti divergono sulla posizione della porta.**
- Wikipedia, via Por Santa Maria: «All'altezza di via Vacchereccia (o secondo altri all'incrocio tra borgo Santi Apostoli e via Lambertesca) si trovava l'antica Porta di Santa Maria», detta «della prima cinta muraria» ([fonte](https://it.wikipedia.org/wiki/Via_Por_Santa_Maria), da Bargellini-Guarnieri).
- Wikipedia, mura di Firenze: la cerchia del 1172–75 ha una Porta Santa Maria su via Por Santa Maria (vedi § 1).

**Una lettura possibile [da verificare].** Le porte erano due, una dopo l'altra. La più antica, della cinta carolingia o matildina, stava all'altezza di via Vacchereccia e aveva accanto la chiesa che ne prese il nome. La nuova, del 1172–75, stava più vicina al ponte, all'incrocio con Lambertesca e Borgo Santi Apostoli. Se è così, il 10 febbraio 1216 Buondelmonte, venendo dal ponte, passò per prima la porta nuova.

**Santa Maria sopra Porta** (oggi San Biagio, in piazza di Parte Guelfa all'angolo con vicolo della Seta):
- è documentata dal 1038;
- era detta così perché sorgeva presso la porta meridionale della cinta carolingia;
- fu ricostruita nella seconda metà del Duecento, quindi nel 1216 c'era ancora l'edificio precedente;
- fu sede delle riunioni dei capitani di Parte Guelfa fino al 1267.

Fonte: [Wikipedia, «Chiesa di San Biagio (Firenze)»](https://it.wikipedia.org/wiki/Chiesa_di_San_Biagio_(Firenze)) **[da verificare]**.

**Nel modello oggi:** la porta è all'altezza di via Vacchereccia e la chiesa è un edificio ipotetico a ovest della piazza. Vanno mostrate le due posizioni possibili della porta, e la scheda deve dire che le fonti divergono.

## 3. Il Ponte Vecchio e la pietra di Marte

- **1177:** il ponte crolla per la piena e viene ricostruito **con cinque arcate**, inglobando resti lignei della seconda metà del X secolo ([Wikipedia, «Ponte Vecchio»](https://it.wikipedia.org/wiki/Ponte_Vecchio) **[da verificare]**).
- **La statua di Marte** viene ripescata dopo la piena del 1177 («il mozzicone di statua detta di Marte») e si perde per sempre con l'alluvione del 4 novembre 1333 (ivi). Il dossier del gioco, via Faini, dà la caduta nel 1178 e il recupero verso il 1200: **le fonti divergono**.
- **1333–1345:** il ponte è travolto e poi ricostruito, attribuito a Taddeo Gaddi o a Neri di Fioravante (ivi).
- **Le botteghe** sul ponte prima del 1345 non risultano dalle fonti consultate **[da verificare]**.

**Nel modello:** le arcate passano da quattro a cinque, come nella fonte.

## 4. La torre degli Amidei

È stata «eretta nei primi decenni del XIII secolo». Il 4 agosto 1944, quando le mine tedesche distrussero tutta la cortina di via Por Santa Maria, la torre resistette, ma fu restaurata sulle fotografie ([Wikipedia, «Via Por Santa Maria»](https://it.wikipedia.org/wiki/Via_Por_Santa_Maria) **[da verificare]**). Nel 1216 poteva essere recentissima o ancora in costruzione: è una domanda precisa per il medievista.

## 5. Santa Reparata (interno)

L'antica cattedrale, scavata da Franklin Toker e Guido Morozzi tra il 1965 e il 1974 ([Wikipedia, «Santa Reparata»](https://it.wikipedia.org/wiki/Santa_Reparata_(Firenze)) **[da verificare: F. Toker, *On Holy Ground*, 2009]**):

| | |
|---|---|
| **Dimensioni** | circa 58,5 m di lunghezza abside compresa, 25–26 m di larghezza |
| **Pianta** | tre navate; dall'età carolingia sette coppie di pilastri al posto delle quattordici coppie di colonne paleocristiane; due cappelle laterali absidate; cripta |
| **Prima del 1055** | la cripta fu ampliata, si aggiunsero due absidiole accanto all'abside maggiore e un portico con otto pilastri o colonne, circa 13 m davanti alla facciata della cattedrale successiva |
| **Pavimento** | a mosaico, con iscrizioni dei donatori |
| **Durata** | il nuovo duomo si comincia l'8 settembre 1296; Santa Reparata resta in uso fino al 1375 |

È l'interno più documentato dei quattro scelti: livello **dedotto** per la pianta, **ipotesi** per l'alzato e gli arredi.

## 6. L'area dell'attuale piazza della Signoria

Nel 1216 la piazza non c'è. Ci sono le case e le torri degli **Uberti** e le chiese di **Santa Cecilia** e **San Romolo** (i resti, con i cimiteri, emersi negli scavi del 1974–1989), sopra i resti del teatro romano. Le case ghibelline furono abbattute dopo Benevento, verso il 1268; la piazza fu lastricata solo nel 1385 ([Wikipedia, «Piazza della Signoria»](https://it.wikipedia.org/wiki/Piazza_della_Signoria) **[da verificare]**). Nel modello quell'area va costruita come quartiere, ed è il quartiere di Schiatta degli Uberti.

## 7. Campi: il castello dei Mazzinghi (interno del convito)

Nel gennaio 1216 Mazzingo Tegrimi dei Mazzinghi festeggia l'investitura a cavaliere nel suo castello di Campi, alle porte di Firenze. Ci sono le grandi famiglie: Amidei, Buondelmonti, Fifanti, Lamberti, Uberti (Faini 2006; [Wikipedia, «Amidei e Buondelmonti»](https://it.wikipedia.org/wiki/Amidei_e_Buondelmonti)). Il castello è poi diventato la Rocca Strozzi ([Mondi Medievali](https://www.mondimedievali.net/Castelli/Toscana/firenze/campibisenzio.htm) **[da verificare]**). Dell'aspetto del 1216 non sappiamo nulla: la sala del convito sarà un'**ipotesi** dichiarata, sul tipo delle sale dei castelli del contado.

---

## 8. Modifiche al modello che ne derivano

1. **Ponte a cinque arcate** (fatto il 7 ottobre).
2. **Porta Santa Maria:** mostrare le due posizioni e aggiornare la scheda (le fonti divergono).
3. **Le mura del 1172–75:** costruirle sul tracciato del § 1, con le porte (fatto il 12–17 ottobre; il lato sud resta da decidere con il medievista e il modello mostra le due ipotesi).
4. **L'area Uberti:** case e torri al posto della futura piazza, con le chiese di Santa Cecilia e San Romolo.
5. **Gli interni:** prima Santa Reparata, la più documentata; poi Santa Maria sopra Porta, la casa Amidei e la sala del castello di Campi, tutte e tre ipotesi dichiarate.

## 9. Prossime ricerche (fonti aperte)

- R. Davidsohn, *Geschichte von Florenz*, I (1896), e *Forschungen*: di pubblico dominio, da cercare su archive.org, per porte, torri, case delle famiglie.
- G. Villani, *Nuova Cronica*: il testo in edizioni online, per le date dei ponti, della lastricatura (1237) e della mozzatura delle torri.
- Le case delle famiglie del delitto: Fifanti, Lamberti (via Lambertesca?), Donati, Buondelmonti in Oltrarno (popolo di San Felice in Piazza).
- Il Mercato Vecchio prima dello sventramento (1885–1895): piante ottocentesche e catasto CASTORE **[licenza da verificare]**.
- La *Pianta della Catena* e la pianta del Buonsignori (1584), di pubblico dominio, come fonti visive da leggere criticamente.

## 10. Domande per il medievista (seguono le lacune del dossier del gioco e del PIANO, fino alla 32)

33. Il lato sud della cerchia del 1172–75 sulla riva destra correva lungo il fiume o lungo Lambertesca e Borgo Santi Apostoli? Santo Stefano al Ponte e le case degli Amidei erano dentro o fuori?
34. Le Porte Santa Maria erano due, la carolingia o matildina e quella del 1172? Da quale entrò Buondelmonte il 10 febbraio?
35. Il ponte ricostruito dopo il 1177 aveva davvero cinque arcate? Aveva botteghe?
36. Nel 1216 la torre degli Amidei era già finita?
51. In Oltrarno, nel 1216, le porte erano di legno o in muratura? E dove passava la chiusura fra San Niccolò e San Felice: dietro le case delle vie lungo il fiume, come nel modello?
52. Via Maggio era fuori dalla cerchia, con una porta a ciascun capo (piazza San Felice e piazza de' Frescobaldi)?
53. Quali borghi c'erano fuori dalle porte nel 1216, e quanto erano fitti di case e di torri?
54. Che misure avevano nel 1216 le chiese che oggi hanno un edificio successivo (San Lorenzo del 1059, la Badia prima di Arnolfo, Santa Trinita, San Pancrazio), e su quale lato avevano la facciata?
55. Il fossato correva solo lungo via Verdi e via de' Benci? Era pieno d'acqua, e da dove veniva?

## Fonti consultate il 7 ottobre 2026

- [Mura di Firenze](https://it.wikipedia.org/wiki/Mura_di_Firenze) · [Via Por Santa Maria](https://it.wikipedia.org/wiki/Via_Por_Santa_Maria) · [Chiesa di San Biagio](https://it.wikipedia.org/wiki/Chiesa_di_San_Biagio_(Firenze)) · [Ponte Vecchio](https://it.wikipedia.org/wiki/Ponte_Vecchio) · [Santa Reparata](https://it.wikipedia.org/wiki/Santa_Reparata_(Firenze)) · [Piazza della Signoria](https://it.wikipedia.org/wiki/Piazza_della_Signoria) · [Amidei e Buondelmonti](https://it.wikipedia.org/wiki/Amidei_e_Buondelmonti) — Wikipedia in italiano
- [Rocca Strozzi di Campi Bisenzio](https://www.mondimedievali.net/Castelli/Toscana/firenze/campibisenzio.htm) — Mondi Medievali
- E. Faini, *Il convito del 1216*, Annali di Storia di Firenze, I (2006) — [Reti Medievali Open Archive](http://www.rmoa.unina.it/574/1/RM-Faini-Convito1216.pdf)
