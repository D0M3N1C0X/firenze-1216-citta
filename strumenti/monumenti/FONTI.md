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
- **Dove stava. Le fonti divergono.** Secondo Vossilla stava a capo del ponte più antico, «più o meno» dove oggi si incontrano via de' Bardi e via de' Guicciardini, cioè dal lato d'Oltrarno. Le cronache e la lapide dantesca la mettono invece dal lato della città: lì c'è il capo del ponte dove fu ucciso Buondelmonte. Il modello segue le cronache (lacuna 42).
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

## 6. Lacune (seguono le 37–41 del kit)

42. **Il lato della pietra di Marte**: il capo del ponte in città (le cronache) o in Oltrarno (Vossilla, da Cinelli)? Va controllato il testo di Vossilla e, in Villani, il capitolo sull'omicidio.
43. **Santa Maria sopra Porta prima della ricostruzione**: dove stava esattamente, e come era orientata?
44. **Le porte della cerchia del 1172–75**: com'erano fatte? C'è qualche raffigurazione o qualche descrizione negli atti?
45. **Il ponte del 1216**: quante arcate (cinque o nove), quanto largo, con o senza botteghe?

## 7. Registro delle verifiche

14. **08/10/2026 — Pietra di Marte.** La statua equestre è sostenuta da Vossilla (1994, da Cinelli); la posizione sul lato della città resta quella delle cronache; la divergenza è dichiarata (lacuna 42).
15. **08/10/2026 — Torre degli Amidei.** Porte a doppia ghiera, protomi di leone, filaretto e finestre a tutto sesto ripresi dalla torre di oggi, ricostruita nel dopoguerra sulle fotografie.
16. **08/10/2026 — Ponte.** Cinque arcate contro nove: si tengono cinque, la fonte delle nove è citata (lacuna 45).
