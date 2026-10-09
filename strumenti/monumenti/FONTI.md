# I monumenti del capo del ponte: fonti, livelli, scelte

Sono i luoghi dell'omicidio e di cinque scene del gioco: il Ponte Vecchio, la pietra di Marte, la torre degli Amidei, Santa Maria sopra Porta e Porta Santa Maria. L'8 ottobre 2026 Domenico ha scelto di cominciare da qui i monumenti modellati in Blender.

**Come si producono.** Li modella `monumenti.py` in Blender:

```
blender -b -Y --python monumenti.py -- [amidei marte ponte chiesa porta] [tavola]
```

Scrive `public/monumenti/<nome>.glb` e `indice.json`. Le misure che devono combaciare con la città (l'asse e le quote del ponte, l'impronta della torre, il posto di Marte, la pianta della chiesa) vengono da `parametri.json`, scritto da `npm run parametri`. Se cambiano il fiume, le strade o le impronte, va rilanciato prima di Blender.

**Livelli.** Il livello di ogni monumento riguarda la **forma**. Per la **posizione** valgono le schede in `src/dati/luoghi.js`.

## 1. La torre degli Amidei · forma «dedotto»

È la torre che c'è ancora in via Por Santa Maria 9r–11r, detta anche Bigonciola o torre dei Leoni. Nel 1944 fu quasi distrutta dalle mine e poi ricostruita sulle fotografie, rimontando gli stipiti e le ghiere recuperati.

**Quello che il modello riprende dalla torre di oggi**, secondo [Wikipedia, «Torre degli Amidei»](https://it.wikipedia.org/wiki/Torre_degli_Amidei), che cita E. Pieri, *Firenze. Guida di architettura* (1992):
- il rivestimento a filaretto di pietraforte;
- due porte alte al piano terra, ognuna con una doppia ghiera: un arco molto ribassato e sopra un arco acuto;
- due protomi di leone in marmo bianco sopra le porte. Quella di sinistra è originale, «più probabilmente» del Duecento; quella di destra è una replica;
- le finestre a tutto sesto ai piani alti;
- le buche pontaie con le mensoline sotto.

**Date.** Fu eretta «nei primi decenni del XIII secolo» ed è documentata dal dicembre 1241. Nel 1216 poteva quindi essere nuova o in costruzione (lacuna 35 del dossier).

**Ipotesi:**
- l'altezza: 36 m. Nel Duecento fu abbassata di «alcuni piani», ma di quanti non si sa;
- i merli e il tetto basso;
- la fila di beccatelli per un ballatoio;
- il numero e la posizione delle finestre;
- le porte di oggi hanno un arco acuto, che nel 1216 sarebbe precoce **[da verificare]**: il modello lo tiene perché è nella torre superstite.

## 2. La pietra di Marte · forma «ipotesi»

- **Che cosa era.** Francesco Vossilla la descrive come una statua equestre tardoromana, e riprende Cinelli, che la dice un Marte a cavallo tolto dal tempio di San Giovanni. La fonte è il saggio «Storia d'una fontana: il Bacco del Giambologna in Borgo San Jacopo», *Mitteilungen des Kunsthistorischen Institutes in Florenz* 38 (1994), pp. 130–146, [doi:10.11588/mkhi.1994.1.68070](https://doi.org/10.11588/mkhi.1994.1.68070). L'ho letto solo dai motori di ricerca **[da verificare sul testo]**.
- **Dove stava. Le fonti divergono.** Secondo Vossilla stava a capo del ponte più antico, «più o meno» dove oggi si incontrano via de' Bardi e via de' Guicciardini, cioè dal lato d'Oltrarno. Villani, che scrive nel Trecento, la mette invece dal lato della città: Buondelmonte fu ucciso «a piè del ponte Vecchio dal lato di qua, apunto a piè del pilastro ov'era la 'nsegna di Mars» (*Nuova Cronica* VI, 38, citato da Faini p. 11). Il modello segue Villani, che è anche la fonte del pilastro (lacuna 42, chiarita in parte il 9 ottobre).
- **Com'era ridotta.** Dante la dice «pietra scema», cioè mutila. Il modello mostra:
  - un cavallo con la zampa anteriore alzata, come nelle statue equestri romane;
  - il collo spezzato e la zampa rotta sotto il ginocchio;
  - del cavaliere, solo un moncone sulla sella.

  La forma della rottura, il pilastro e il marmo sono inventati.
- **Il cavallo** viene dal modello CC0 di Lyndon Daniels ([strumenti/animali/README.md](../animali/README.md)), messo in posa e spezzato da script.

## 3. Il Ponte Vecchio · forma «ipotesi»

- **Le arcate. Le fonti divergono.** Le fonti divulgative danno quasi tutte cinque arcate dopo la ricostruzione del 1177. [Finestre sull'Arte](https://www.finestresullarte.info/en/news/florence-ponte-vecchio-prepares-for-first-major-restoration-in-its-history) ne dà nove, con botteghe sporgenti sui due lati. Il modello ne ha cinque (lacuna 18).
- **La storia.** Il ponte fu danneggiato nel 1222 e travolto nel 1333. Allora, secondo Giovanni Villani, restarono in piedi due pile centrali ([Wikipedia, «Ponte Vecchio»](https://en.wikipedia.org/wiki/Ponte_Vecchio)).
- **Le botteghe** sul ponte prima del 1333 sono attestate da una sola fonte: il modello non le mostra **[da verificare]**.
- **Riferimento scientifico da vedere:** T. Flanigan, *The Ponte Vecchio: Architecture, Politics, and Civic Identity in Late Medieval Florence* (Brepols, 2024), che però tratta soprattutto il ponte dopo il 1333.
- **Ipotesi:**
  - la larghezza: 7,2 m;
  - gli archi ribassati;
  - i rostri con il cappello;
  - la cornice e i parapetti;
  - il lastricato.

  Le luci sono quelle che il letto dell'Arno del modello consente.

## 4. Santa Maria sopra Porta · forma «ipotesi»

- **Che cosa si sa.** È documentata dal 1038. Dopo la distruzione delle case ghibelline della zona fu ricostruita nella seconda metà del Duecento: è l'attuale San Biagio, in piazza di Parte Guelfa. Fonte: [Wikipedia, «Chiesa di San Biagio»](https://it.wikipedia.org/wiki/Chiesa_di_San_Biagio_(Firenze)), da Bargellini e Guarnieri, *Le strade di Firenze* III, pp. 38–40.
- **Dove stava nel 1216.** La stessa fonte dice che la ricostruzione «probabilmente» cambiò posizione e orientamento: prima la chiesa stava più vicina a via Por Santa Maria. Il modello la lascia per ora dove era, accanto a San Biagio (lacuna 43).
- **La forma è un'ipotesi**, per analogia con le chiese romaniche fiorentine:
  - navata unica di pietraforte;
  - facciata a capanna con portale a lunetta, con una tarsia bianca e verde come nella facciata di Santo Stefano al Ponte (1233) **[da verificare]**;
  - oculo e campanile a vela;
  - archetti pensili sotto le cornici;
  - abside semicircolare.

## 5. Porta Santa Maria e le porte della cerchia · forma «ipotesi»

- **Dove stava.** Della posizione di Porta Santa Maria si parla nel dossier topografico, § 2: le fonti divergono.
- **La forma.** Nessuna porta della cerchia del 1172–75 è sopravvissuta. Il modello è una torre di porta di 9,5 × 7 m, alta 17, con:
  - il fornice a tutto sesto e la ghiera di conci;
  - i battenti aperti contro le pareti del passaggio;
  - una finestra per faccia;
  - le buche pontaie e i merli.

  Lo stesso modello vale per tutte le porte della cerchia. Le porte trecentesche che si vedono oggi (San Niccolò, San Frediano, Romana) sono di un'altra cerchia e molto più alte: non sono un modello (lacuna 44).

## 5b. Il Battistero · forma «documentato»

L'edificio c'è ancora. Il modello ne riprende:
- l'impronta di OpenStreetMap (estratto del 9 ottobre 2026): ottagono di 34 m sui lati esterni, con la scarsella a ovest. Prima del 9 ottobre il modello usava come larghezza esterna i 25,6 m, che sono il diametro interno, e lo metteva circa 7 m fuori posto;
- i tre ordini rivestiti di marmo bianco di Carrara e verde di Prato, con i pilastri d'angolo a fasce, gli archi ciechi del secondo ordine, l'attico a strisce, il tetto a piramide di lastre bianche, la lanterna;
- l'altezza di circa 39 m (Wikipedia en, «Florence Baptistery»; un'altra fonte dice poco più di 40);
- le due colonne di porfido donate da Pisa alla porta est (1115 o 1117: **le fonti divergono**, nella stessa voce).

Che cosa c'era nel 1216, e che cosa no ([Wikipedia, «Battistero di San Giovanni (Firenze)»](https://it.wikipedia.org/wiki/Battistero_di_San_Giovanni_(Firenze))):
- **la lanterna**, finita nel 1150 secondo Villani. La stessa voce parla però di lavori duecenteschi con cui «venne completamente coperto il foro» dalla lanterna: **le fonti divergono** sulla data;
- **la scarsella** rettangolare: per Richa cominciata nel 1202, forse poco prima del 1150 secondo la voce;
- **non** i mosaici dell'interno: quelli della scarsella cominciano nel 1225, quelli della cupola verso il 1270;
- **non** le porte di bronzo (1330–1336, 1403–1424, 1425–1452): nel 1216 il modello mostra battenti di legno (ipotesi);
- **l'attico e il tetto a piramide**: la data non è nota; il modello li mostra (ipotesi).

## 5c. Santa Reparata · pianta «dedotto», alzato «ipotesi»

Dagli scavi del 1965–1974 (G. Morozzi, F. Toker, A. Herrmann, *Santa Reparata. L'antica cattedrale fiorentina*, 1974; riassunto in [Wikipedia, «Santa Reparata (Firenze)»](https://it.wikipedia.org/wiki/Santa_Reparata_(Firenze))):
- **misure interne:** circa 58,5 m abside compresa e 25–26 m di larghezza;
- **dove stava:** sullo stesso asse del Duomo, con la facciata circa 9,5 m più a ovest di quella di oggi, perché circa tre campate della basilica antica (interasse 3,19 m) sono sotto il sagrato e la scalinata;
- **pianta:** tre navate con sette coppie di pilastri, che nella ricostruzione carolingia presero il posto delle quattordici coppie di colonne. Poi due cappelle laterali absidate, l'abside con le due absidiole aggiunte prima del 1055, la cripta sotto il presbiterio rialzato, con due scale;
- **il portico** a otto pilastri o colonne davanti alla facciata. Tra il Battistero e la chiesa restavano «non più di 17, massimo 18, metri»;
- **il pavimento:** di mattoni, al livello della ricostruzione del 1055;
- **i campanili:** due, accanto all'abside, del IX o X secolo; quello a sud forse fu demolito con le absidiole. Il modello ne mostra uno solo, a nord.

**Ipotesi:**
- le altezze (navatelle 8,5 m, navata 15,5 m, colmo 18,3 m);
- le finestre e le capriate;
- il passo fra i pilastri, uguale per tutte le campate (6,6 m);
- il presbiterio dal sesto pilastro in poi;
- la facciata di marmi bianchi e verdi: «probabilmente», dice la voce, come il Battistero;
- il campanile alto 27 m.

Si entra dal portale grande e si cammina nelle tre navate fino al presbiterio, che non è percorribile.

## 6. Lacune (seguono le 37–41 del kit)

42. **Il lato della pietra di Marte**: il capo del ponte in città (le cronache) o in Oltrarno (Vossilla, da Cinelli)? Va controllato il testo di Vossilla e, in Villani, il capitolo sull'omicidio.
43. **Santa Maria sopra Porta prima della ricostruzione**: dove stava esattamente, e come era orientata?
44. **Le porte della cerchia del 1172–75**: com'erano fatte? C'è qualche raffigurazione o qualche descrizione negli atti?
45. **Il ponte del 1216**: quante arcate (cinque o nove), quanto largo, con o senza botteghe?
46. **Santa Reparata in alzato**: quanto erano alte navata e navatelle? Com'era la facciata nel 1216? Quale campanile era in piedi?
47. **Il Battistero nel 1216**: l'attico e il tetto a piramide erano già finiti? La lanterna è del 1150 o di un rifacimento duecentesco?

## 7. Registro delle verifiche

14. **08/10/2026 — Pietra di Marte.** La statua equestre è sostenuta da Vossilla (1994, da Cinelli); la posizione sul lato della città resta quella delle cronache; la divergenza è dichiarata (lacuna 42).
15. **08/10/2026 — Torre degli Amidei.** Porte a doppia ghiera, protomi di leone, filaretto e finestre a tutto sesto ripresi dalla torre di oggi, ricostruita nel dopoguerra sulle fotografie.
16. **08/10/2026 — Ponte.** Cinque arcate contro nove: si tengono cinque, la fonte delle nove è citata (lacuna 45).
17. **09/10/2026 — Il Battistero.** Spostato sull'impronta reale (OpenStreetMap) e portato da 25,6 m a 34 m di larghezza esterna: i 25,6 m erano il diametro interno.
18. **09/10/2026 — Santa Reparata.** Posta sotto il Duomo, sul suo asse, con la facciata 9,5 m più a ovest di quella di oggi; misure interne e pianta dagli scavi.
