# Il kit edilizio: fonti, livelli, anacronismi

Il kit sono i pezzi che il generatore delle case posa migliaia di volte: finestre, porte, botteghe, chiusure e arredo di strada. Li modella `kit.py` in Blender, li carica `src/mondo/kit.js` e li posa `src/mondo/edifici.js`.

Il criterio l'ha scelto Domenico l'8 ottobre 2026: **Firenze più la Toscana coeva** (San Gimignano, Volterra, Lucca, Siena, Pisa). Quando il modello viene da un'altra città lo si dichiara come **«dedotto per analogia»**. Ogni pezzo ha il dettaglio pieno a ogni distanza: i conci uno per uno, con lo spessore vero.

Due livelli di certezza, come nel resto della città:

- **dedotto**: la forma ricalca edifici superstiti, di Firenze o di città toscane vicine, di età compatibile;
- **ipotesi**: forma plausibile, senza un riscontro preciso.

Il livello del *pezzo* riguarda la sua forma. Il livello della *casa* su cui è posato resta quello della casa: quasi sempre «ipotesi», perché le case sono generate.

## 1. I pezzi e le loro fonti

| Pezzo | Riferimento | Livello | Fonte |
|---|---|---|---|
| Finestra ad arco a tutto sesto, ghiera di conci radiali, davanzale (80×150 e 70×125 cm) | finestre delle case-torri superstiti, a Firenze e in Toscana | dedotto | [Torre della Castagna](https://it.wikipedia.org/wiki/Torre_della_Castagna); [Torri di via Cavalca, Pisa](https://it.wikipedia.org/wiki/Torri_di_via_Cavalca) |
| Finestra architravata su mensoline modanate, con lunetta e arco di scarico (80×130) | case-torri pisane: architravi su mensole e grandi archi di scarico, schema datato alla metà del XII secolo | dedotto per analogia (Pisa) | [Pisa, Enciclopedia dell'Arte Medievale (Treccani), che cita Redi 1991](https://www.treccani.it/enciclopedia/pisa_(Enciclopedia-dell'-Arte-Medievale)/); [Case torri Miniati](https://www.turismo.pisa.it/en/place/miniati-tower-houses) |
| Feritoia ad arco (22×110) | aperture strette nei piani bassi delle torri | dedotto **[da verificare** su una torre fiorentina precisa**]** | — |
| Portale a «doppio arco», detto senese: architrave, lunetta e arco a tutto sesto (foro 120×295) | il portale al piano terra della torre della Castagna, che ha scampato la mozzatura del Duecento | dedotto | [Torre della Castagna](https://it.wikipedia.org/wiki/Torre_della_Castagna); [Arco senese, Il Capochiave](https://ilcapochiave.it/2018/03/03/arco-senese-quando-la-statica-diventa-architettura/) |
| Portale ad arco a tutto sesto con stipiti e ghiera (120×250) | porte di casa a conci | dedotto | come la finestra ad arco |
| Arco di bottega (240, 300, 340 cm; imposta a 2,30 m) | piani terra aperti da archi larghi e dati in affitto agli artigiani: a Pisa almeno dal Duecento | dedotto per analogia (Pisa) | [Case torri Miniati](https://www.turismo.pisa.it/en/place/miniati-tower-houses); [Treccani, Pisa](https://www.treccani.it/enciclopedia/pisa_(Enciclopedia-dell'-Arte-Medievale)/) |
| Sportelli della bottega: il basso abbassato a banco, l'alto alzato a tettoia | è la forma che si vede nella pittura e negli edifici di Due e Trecento | ipotesi (lacuna 30) | — |
| Battenti di tavole con bandelle, chiodi e anello | — | ipotesi | — |
| Scuri a due ante; impannata di tela oliata su telaio | nel 1216 le finestre delle case non avevano vetri **[da verificare]** | ipotesi | — |
| Pozzo: puteale circolare a conci, due pilastrini, trave e carrucola | la città beveva da «innumerevoli pozzi» alimentati dalle filtrazioni dell'Arno. La fonte è dell'Ottocento e non data il fatto | ipotesi | [L'Ingegneria civile e le arti industriali, 1883](https://digit.biblio.polito.it/4488/1/06_ING.CIV.ART.IND_1883_GIU.pdf) |
| Anello di ferro murato a 1,5 m, per legare cavalli e muli | i ferri «da cavallo» sono attestati a Firenze dal tardo Duecento, cioè qualche decennio dopo il 1216 | ipotesi | [Ferro (architecture), Wikipedia](https://en.wikipedia.org/wiki/Ferro_(architecture)); J. Superti, *I cavalli di Firenze. La storia dei ferri* (2014), riassunto in [The Florentine](https://www.theflorentine.net/?p=3900) |
| Portafiaccola | — | non usato nel 1216 | vedi § 2 |
| Panca di via | — | non usato nel 1216 | vedi § 2 |
| Scala esterna | — | non usato | vedi § 2 |

## 2. Gli anacronismi controllati

Prima di posare l'arredo di strada ho cercato per ogni pezzo una fonte che lo collochi nel 1216 (registro, n. 11).

- **Portafiaccole e reggistendardi.** Gli esempi noti sono quattro e cinquecenteschi, come quelli del Caparra a palazzo Strozzi (circa 1500). Per il Duecento non ho trovato date. Nel 1216 non si usano; restano nel kit per la Firenze della Catena, ~1480.
- **Panca di via.** Le fonti la descrivono come elemento del palazzo fiorentino del Rinascimento ([Firenze, i suoi cortili e il Rinascimento](https://www.meer.com/it/46670-firenze-i-suoi-cortili-e-il-rinascimento)). Nel 1216 non si usa; resta nel kit per il ~1480.
- **Scala esterna.** Il «profferlo» è documentato soprattutto nel Lazio, a Viterbo ([San Pellegrino](https://www.italia.it/it/lazio/viterbo/quartiere-san-pellegrino)). Per Firenze non ho trovato né esempi né norme: gli statuti fiorentini del Duecento sopravvivono solo a frammenti ([Zorzi, Statuti di Firenze](https://www.storiadifirenze.org/pdf_ex_eprints/02-Zorzi-Statuti%20di%20Firenze.pdf)). Non si usa in nessuna fase finché non c'è una fonte (lacuna 41).
- **Anelli di ferro.** Sono attestati dal tardo Duecento. Li uso nel 1216 come ipotesi: è un oggetto semplice e l'uso dei cavalli in città è sicuro, ma è un'estensione all'indietro (lacuna 40). Ne ha uno circa una casa su tre, la metà delle torri.
- **Pozzi nelle piazze.** Non ho trovato un pozzo pubblico documentato nel Mercato Vecchio o in piazza San Giovanni nel 1216. Una piazza con un pozzo sarebbe un'affermazione precisa senza fonte, quindi i pozzi stanno negli spazi liberi chiusi tra le case: cortili e orti (lacuna 39).
- **Tabernacoli.** Non sono nel kit. Quelli che si vedono oggi agli angoli delle strade sono in gran parte più tardi **[da verificare]**.

## 3. Il legno in alto

Domenico ha scelto «pietra in basso, legno in alto» (lacuna 23 del PIANO). Il piano terra è sempre di pietra. In circa un terzo delle case, cioè metà di quelle che non sono di conci, i piani alti sono una parete di tavole su un'intelaiatura di travi: solai a ogni piano, ritti agli spigoli e tra le finestre. Le finestre sono rettangolari, con una cornice di travetti; lo sporto sulla strada è più frequente che nelle case di pietra. È un'ipotesi. Che le case di legno esistessero è probabile, ma in quale proporzione non lo sappiamo.

## 4. Che cosa NON è

- Non è un rilievo di Firenze: nessun pezzo copia una finestra fiorentina precisa, salvo il portale a doppio arco, che riprende la torre della Castagna.
- Non è un catalogo completo dell'edilizia toscana: mancano le bifore, gli archi acuti, i ballatoi con le mensole di pietra, le porte del morto.
- Le misure (finestre da 70–80 cm, archi di bottega da 2,4–3,4 m) sono plausibili, non misurate.

## 5. Lacune (seguono le 33–36 del dossier topografico)

37. **L'arco nel 1216.** A tutto sesto o già acuto, nell'edilizia civile fiorentina? Da quando l'arco acuto? E le finestre architravate pisane valgono anche per Firenze?
38. **Le chiusure.** Vetro, tela, carta o soli scuri? Che cosa dicono gli inventari e la pittura più vicina al 1216?
39. **I pozzi.** C'erano pozzi pubblici nelle piazze nel 1216? Dove? Si può partire dagli scavi di piazza della Repubblica e dai fondi dell'Archivio di Stato su fonti e pozzi comunali. Sulla storia dell'acqua a Firenze gli studi sono pochi ([Publiacqua](https://www.publiacqua.it/sites/publiacqua/files/558b6e5b748e55d9ac66fd4c0f730f25.pdf)).
40. **Gli anelli e i ferri prima del tardo Duecento.** Superti li data da allora: c'è qualcosa di più antico? Il volume da vedere è A. M. Adorisio, *Per uso e per decoro* (1996).
41. **Le scale esterne a Firenze.** C'erano? Una pista è il progetto *Costruire ai tempi di Arnolfo* (G. C. Romby) **[da verificare]**.

## 6. Registro delle verifiche (segue la numerazione del PIANO)

11. **08/10/2026 — Anacronismi dell'arredo di strada.** Esclusi dal 1216 portafiaccole e panche di via, perché le attestazioni note sono rinascimentali; esclusa ovunque la scala esterna, documentata nel Lazio. Ammessi gli anelli, ma come ipotesi, perché sono attestati dal tardo Duecento. Fonti nel § 2.
12. **08/10/2026 — Pozzi.** Nessuno nelle piazze, per mancanza di fonti; nei cortili come ipotesi, dalla notizia generica degli «innumerevoli pozzi» (1883).
13. **08/10/2026 — Portale a doppio arco.** Dalla torre della Castagna, dove è documentato, è esteso a tutte le torri e a circa due porte di casa su cinque: dedotto per analogia.
