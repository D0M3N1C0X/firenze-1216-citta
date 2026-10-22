# Firenze 1216 — la città

La Firenze della mattina di Pasqua del 1216, da percorrere a piedi. È la sezione esplorabile del progetto *Cosa fatta capo ha*: il gioco, in preparazione, racconta il delitto; la città mostra i luoghi.

**[▶ Apri la città](https://d0m3n1c0x.github.io/firenze-1216-citta/)**

Serve un computer o un tablet con una buona scheda grafica: il modello è pensato per l'hardware di fascia alta e la prima apertura richiede qualche decina di secondi.

**Prototipo** (ottobre 2026): tutta la città dentro la cerchia del 1172–75, casa per casa, con le mura, le porte e i borghi fuori porta; texture fotografiche e persone animate. Due giornate: **il 10 febbraio**, la promessa rotta, e **la mattina di Pasqua**, il delitto. Il **racconto** porta di scena in scena del gioco, ciascuna nel suo luogo. Il convito di gennaio 1216 è un luogo a parte, il castello dei Mazzinghi a Campi: ci si arriva dalle scene del primo atto o con `?luogo=campi`. Il piano completo, con le fasi, le fonti, il calendario e i rischi, è in [PIANO.md](PIANO.md).

## Dal gioco alla città

Ogni scena del copione ha un link: `?scena=` seguito dal codice della schermata. Per esempio [le voci del ponte](https://d0m3n1c0x.github.io/firenze-1216-citta/?scena=IV3) (IV3), [Santo Stefano](https://d0m3n1c0x.github.io/firenze-1216-citta/?scena=IV2b) (IV2b), [Porta Santa Maria il 10 febbraio](https://d0m3n1c0x.github.io/firenze-1216-citta/?scena=II3) (II3). La città si apre nella giornata, all'ora e nel punto di vista della scena, con il racconto aperto. L'elenco delle scene e di che cosa ne fa la città è in [src/dati/scene.js](src/dati/scene.js).

## Avviare in locale

```bash
npm install
npm run dev
```

Poi aprire http://localhost:5216. Serve una scheda video di fascia alta: il modello è pensato per PC e tablet potenti, non per la LIM.

## Comandi

Pensati per chiunque, anche senza tastiera e anche su iPad. All'ingresso si sceglie tra **Visita guidata** (dieci tappe, dalla casa di Buondelmonte alle mura) ed **Esplora da solo**; si può scegliere anche mentre la città si prepara, e una barra dice quanto manca.

| | |
|---|---|
| **tocca o clicca la strada** | ci vai a piedi, girando gli angoli da solo; un anello dorato segna dove stai andando |
| **trascina** | guardati intorno (con il dito o con il mouse) |
| **Dall'alto** (F) | vista sopra i tetti; tocca un punto della città per volarci sopra |
| **Che cosa è certo** (C) | colora ogni cosa secondo quanto ne sappiamo |
| **Racconto** (R) | le scene del gioco, nei loro luoghi |
| **Vai a…** | l'elenco dei luoghi, con la scheda e le fonti; da qui si ricomincia la visita |
| **Aiuto** | come si usa, in parole semplici |
| **Impostazioni** | giornata (10 febbraio o Pasqua), immagini più belle o più leggere, testo più grande, movimento ridotto |
| **WASD / frecce** | cammina con la tastiera (Maiusc: svelto; Q ed E: girati) |
| **I** | scheda del luogo vicino |
| **M** | silenzia i suoni |

Le impostazioni restano sul dispositivo. Se nei primi secondi la città va a scatti, le immagini si alleggeriscono da sole, e lo si dice.

Parametri: `?scena=IV3` (apre su una scena), `?luogo=campi` (apre il castello del convito invece della città), `?racconto` (apre il racconto dall'inizio), `?giorno=febbraio`, `?ora=7.5` (ora solare), `?gente=300`, `?da=x,z,direzione`.

Dopo ogni modifica a strade, luoghi, scene o tappe della visita: `npm run verifica` controlla che ogni luogo si raggiunga a piedi e che ogni scena e ogni tappa abbiano un punto di vista percorribile. Se cambia il copione del gioco: `npm run copione` (solo dal repository completo del progetto).

## Che cosa NON è

- **Non è validato.** Nessun medievista l'ha ancora visto.
- **Le case sono generate dal programma.** Solo le chiese e le torri con un nome hanno la pianta di un edificio vero.
- **Il delitto non c'è.** Il modello mostra il luogo, non l'uccisione.
- **Il racconto viene da un copione in bozza**, non ancora rivisto da un medievista.
- **Il muro della cerchia è ricostruito sulle vie di oggi**, che ne conservano il tracciato; altezze, merli e torri di porta sono ipotesi. Sul lato sud, verso l'Arno, non sappiamo dove corresse: accendi «Certezza» per vedere le due possibilità.

## Struttura

```
src/dati/        luoghi e schede (luoghi.js), strade del 1216 (strade-1216.js), giornate (giornate.js),
                 scene del gioco (scene.js), testi del copione (copione.js, generato), cerchia (cerchia.js),
                 estratto OSM (osm.js, generato)
src/mondo/       terreno e fiume, cielo e sole, materiali, case, monumenti, abitanti, suoni, vegetazione
src/ui/          interfaccia e racconto
public/          texture fotografiche, figure e animali (da strumenti/figure/ e strumenti/animali/), kit edilizio e monumenti
strumenti/       script di Blender per le figure, gli animali, il kit edilizio (finestre, porte, botteghe, pozzi) e i monumenti
scripts/         osm-estrai.mjs (OpenStreetMap → osm.js), copione-estrai.mjs (copione → copione.js),
                 verifica.mjs (luoghi e scene raggiungibili), pubblica.sh
dati-osm/        estratto OpenStreetMap del 01/10/2026 (ODbL)
app/             l'app per iPhone, iPad e Mac (Capacitor): vedi app/README.md
```

## Licenze e attribuzioni

- **Codice:** MIT (vedi [LICENSE](LICENSE)). **Testi, schede e testi del copione:** CC BY 4.0 (vedi [LICENSE-CONTENUTI.md](LICENSE-CONTENUTI.md)).
- **Citare:** vedi [CITATION.cff](CITATION.cff).
- **Dati cartografici:** © OpenStreetMap contributors, licenza [ODbL 1.0](https://opendatacommons.org/licenses/odbl/). Il letto dell'Arno, i tracciati delle strade e le impronte delle torri, delle chiese e del Battistero vengono da lì (estratti del 1° e del 9 ottobre 2026).
- **three.js** (MIT), incluso nel pacchetto.
- **Texture fotografiche:** Poly Haven, licenza CC0 (autori: Rob Tuytel, Dimitrios Savva, Amal Kumar, Charlotte Baglioni, Dario Barresi; dettagli in `public/texture/FONTI.json`). Erba, marmo e suoni sono generati dal codice.
- **Figure:** corpi MakeHuman (CC0) e movimenti del CMU Graphics Lab Motion Capture Database (http://mocap.cs.cmu.edu, finanziato da NSF EIA-0196217). Come si producono: [strumenti/figure/README.md](strumenti/figure/README.md).
- **Cavalli, muli e asini:** dal «Rigged Horse» di Lyndon Daniels (CC0, OpenGameArt), con le andature costruite da `strumenti/animali/animali.py`. Come si producono: [strumenti/animali/README.md](strumenti/animali/README.md).
- **Monumenti** (il capo del ponte, il Battistero, Santa Reparata, gli interni di Santa Maria sopra Porta e della torre degli Amidei, il castello di Campi con la sala del convito): modellati da `strumenti/monumenti/monumenti.py`; la statua di Marte usa il cavallo «Rigged Horse» di Lyndon Daniels (CC0, OpenGameArt). Fonti e livelli: [strumenti/monumenti/FONTI.md](strumenti/monumenti/FONTI.md).
- **Kit edilizio:** finestre, porte, botteghe e pozzi modellati da `strumenti/kit/kit.py` in Blender, senza materiali di terzi. Fonti, livelli di certezza e anacronismi controllati: [strumenti/kit/FONTI.md](strumenti/kit/FONTI.md).
