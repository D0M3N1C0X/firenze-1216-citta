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

## Come si producono

```
blender -b -Y --python animali.py -- [cavallo mulo asino] [tavola]
```

Lo script fa questi passi:
- porta il modello in metri: 1,68 m alle orecchie per il cavallo;
- trasforma la posa del file in posa di riposo: criniera, coda e occhi sono modellati sul corpo in posa;
- aggiunge una radice per il sobbalzo del corpo;
- costruisce le andature (fermo, passo, trotto, e il galoppo solo per il cavallo). Ogni zoccolo ha un bersaglio che sta a terra mentre spinge e avanza in arco mentre è sollevato, e la cinematica inversa piega le zampe;
- «cuoce» le andature in rotazioni normali.

Scrive `public/animali/<nome>.glb` e `animali.json`, con la velocità di ogni andatura: la città la usa per accordare il passo alla strada percorsa.

- **Mulo e asino** sono lo stesso modello con orecchie più lunghe, testa più grande, taglia ridotta (l'asino al 72%) e il mantello ritinto. È un'approssimazione: non sono modelli anatomici.
- **Il basto con le some** è un'ipotesi.
- **La taglia** dei cavalli del Duecento, più piccoli di quelli di oggi, è **[da verificare]**.

In città gli animali vanno al passo, condotti a mano da una persona che cammina alla loro testa: più numerosi nei giorni di lavoro, pochi a Pasqua (ipotesi). I cavalieri arriveranno quando le figure avranno una posa a cavallo.
