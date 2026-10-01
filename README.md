# Firenze 1216 — la città

La Firenze della mattina di Pasqua del 1216, da percorrere a piedi. È la sezione esplorabile del progetto *Cosa fatta capo ha*: il gioco racconta il delitto, la città mostra i luoghi.

**Prototipo v0.1** (1° ottobre 2026): il capo del Ponte Vecchio, con circa 400 metri di città intorno e il resto come fondale. Il piano completo, con le fasi, le fonti, il calendario e i rischi, è in [PIANO.md](PIANO.md).

## Avviare

```bash
npm install
npm run dev
```

Poi aprire http://localhost:5216. Serve una scheda video di fascia alta: il modello è pensato per PC e tablet potenti, non per la LIM.

## Comandi

| | |
|---|---|
| **WASD / frecce** | cammina (Maiusc: svelto) |
| **mouse** | guarda (clic per agganciarlo, Esc per liberarlo) |
| **tablet** | metà sinistra dello schermo per camminare, metà destra per guardare |
| **F** | volo sopra i tetti (Spazio e C per salire e scendere) |
| **C** | certezza: colora ogni cosa secondo quanto ne sappiamo |
| **I** | scheda del luogo vicino, con le fonti |
| **M** | silenzia i suoni |

Parametri per le prove: `?ora=7.5` (ora solare), `?gente=300`, `?da=x,z,direzione`.

## Che cosa NON è

- **Non è validato.** Nessun medievista l'ha ancora visto.
- **Le case sono generate dal programma.** Solo le chiese e le torri con un nome hanno la pianta di un edificio vero.
- **Il delitto non c'è.** Il modello mostra il luogo, non l'uccisione.

## Struttura

```
src/dati/        luoghi e schede (luoghi.js), strade del 1216 (strade-1216.js), estratto OSM (osm.js, generato)
src/mondo/       terreno e fiume, cielo e sole, materiali, case, monumenti, abitanti, suoni, vegetazione
src/ui/          interfaccia
scripts/         osm-estrai.mjs: dall'estratto OpenStreetMap a src/dati/osm.js
dati-osm/        estratto OpenStreetMap del 01/10/2026 (ODbL)
```

## Licenze e attribuzioni

- **Codice:** MIT (vedi [../LICENSE](../LICENSE)). **Testi e schede:** CC BY 4.0 (vedi [../LICENSE-CONTENUTI.md](../LICENSE-CONTENUTI.md)).
- **Dati cartografici:** © OpenStreetMap contributors, licenza [ODbL 1.0](https://opendatacommons.org/licenses/odbl/). Il letto dell'Arno, i tracciati delle strade e le impronte delle torri e delle chiese vengono da lì.
- **three.js** (MIT), incluso nel pacchetto.
- Texture, figure e suoni sono generati dal codice del progetto: non ci sono materiali di terzi.
