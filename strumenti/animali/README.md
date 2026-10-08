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

- **Cavalli da sella** (dal 9 ottobre): `sellato`, un baio con la gualdrappa rossa di robbia, e `palafreno`, grigio chiaro con la gualdrappa blu di guado. Hanno la sella con gli arcioni, staffili e staffe. Forme e colori sono un'ipotesi. Il palafreno bianco ricorda quello di Buondelmonte nella cronaca di Villani («in su uno palafreno bianco»).

In città gli animali vanno al passo, condotti a mano da una persona che cammina alla loro testa: più numerosi nei giorni di lavoro, pochi a Pasqua (ipotesi).

**I cavalieri** sono le figure dei ruoli cavaliere e mercante, messe in sella (`monta` e `POSA_SELLA` in `src/mondo/abitanti.js`):
- ossa in posa: cosce aperte sul dorso, piedi nelle staffe, mani all'arcione;
- agganciati all'osso della schiena del cavallo, così seguono il passo e il sobbalzo.

La posa è regolata a occhio, guardando il cavaliere di fianco e di fronte nella città; non viene da una registrazione. Ce ne sono pochi: circa uno ogni trenta persone, un poco meno a Pasqua. Le donne non sono messe in sella: nel Duecento cavalcavano in un altro modo **[da verificare]**.
