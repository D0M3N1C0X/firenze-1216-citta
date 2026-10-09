/* =====================================================================
   LE GIORNATE DEL RACCONTO

   La città mostra due giornate del 1216, quelle in cui il copione porta
   il notaio per le strade:

   - il 10 febbraio, la promessa rotta (copione, II3) e le scene di
     febbraio che non hanno una data precisa (II2, III1);
   - la mattina di Pasqua, 10 aprile, il delitto (copione, atto IV).

   Le date sono giuliane, come nelle fonti. Per il sole conta la stagione
   astronomica, quindi si usa il giorno dell'anno nel calendario
   gregoriano prolettico (doy): nel Duecento lo scarto è di 7 giorni.

   IL GIORNO DELLA SETTIMANA DEL 10 FEBBRAIO. Il dossier e il copione lo
   dicono giovedì (dossier, § 2). Il calcolo sul calendario giuliano dà
   mercoledì; giovedì era l'11. Verificato il 2 ottobre 2026 con due
   metodi (numero del giorno giuliano e calendario gregoriano prolettico),
   controllando che il 10 aprile 1216, Pasqua, risulti domenica.
   [da verificare con il medievista: la lettura di Faini, p. 16]
   Per il modello conta solo che fosse un giorno feriale.
   ===================================================================== */

export const GIORNATE = {
  febbraio: {
    id: 'febbraio',
    nome: '10 febbraio',
    titolo: '10 febbraio 1216',
    nota: 'per i fiorentini ancora 1215: l\'anno nuovo comincia il 25 marzo',
    doy: 48,                    // 17 febbraio gregoriano
    gregoriano: '17 febbraio',
    festa: false,               // botteghe aperte, banchi al mercato
    rondini: false,             // in Toscana arrivano tra marzo e aprile [da verificare]
    foschia: 1.35,              // mattina d'inverno sull'Arno: scelta d'atmosfera, non un dato
    campane: 'ore',             // solo i rintocchi delle ore canoniche
    gente: 190,
    ora: 7.6,
    // dove la gente si ferma: al mercato e davanti alle botteghe
    gruppi: [[62, -360, 4], [80, -372, 3], [48, -348, 3], [70, -195, 3], [35, -70, 2], [-60, 110, 2], [15, -38, 2], [272, -340, 2]]
  },
  pasqua: {
    id: 'pasqua',
    nome: 'Pasqua',
    titolo: 'Domenica 10 aprile 1216',
    nota: 'la mattina di Pasqua',
    doy: 108,                   // 17 aprile gregoriano
    gregoriano: '17 aprile',
    festa: true,                // botteghe chiuse per la festa
    rondini: true,
    foschia: 1,
    campane: 'festa',
    gente: 150,
    ora: 8.5,
    // dove la gente si ferma a parlare: davanti alle chiese, ai capi del ponte, al mercato
    gruppi: [[15, -38, 3], [47, -54, 4], [-114, -121, 3], [70, -200, 4], [-70, 140, 3], [-52, 86, 2], [-40, -112, 2], [60, -72, 2], [160, -528, 4],
      // in Santa Reparata, alla messa (ipotesi)
      [186, -549, 5], [197, -544, 4], [204, -551, 3]]
  }
};

export const GIORNATA_PREDEFINITA = 'pasqua';
