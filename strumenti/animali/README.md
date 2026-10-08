# Gli animali

Cavalli, muli e asini della città. Il 7 ottobre 2026 Domenico ha messo gli animali tra le priorità delle figure; l'8 ottobre ha scelto un modello che si scarichi senza account.

## Il modello di partenza

**Rigged Horse**, di Lyndon Daniels, con scheletro aggiunto da ChadM. Licenza **CC0**.

- Pagina: https://opengameart.org/content/rigged-horse
- File: `riggedHorse.blend` (20,2 MB, Blender 2.63), scaricato l'8 ottobre 2026
- Contenuto:
  - mesh di circa 3.700 vertici;
  - scheletro di 19 ossa;
  - texture 2K incluse nel file: colore, occlusione e rilievo;
  - criniera e coda come mesh a parte;
  - nessuna animazione.
- Il modello viene dal pacchetto «Realtime Ranchers» di Lyndon: https://opengameart.org/content/realtime-ranchers-3d-model-pack

Il file non sta in git: si riscarica in `sorgenti/opengameart-rigged-horse/`. Va aperto solo con Blender e con gli script automatici disattivati (`blender -b -Y`).

## Da fare

- portarlo alla scala giusta (un cavallo da sella del Duecento è più piccolo di quelli di oggi **[da verificare]**);
- le andature: passo, trotto e galoppo, costruite in Blender sullo scheletro;
- ricavarne mulo e asino;
- esportare in glTF per la città.
