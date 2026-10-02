/* =====================================================================
   LA CERCHIA DEL 1172–1175

   Che cosa sappiamo (da verificare sulla letteratura, PIANO.md § 5.1):
   - il Comune la costruisce a partire dal 1172 e la finisce nel 1175;
     alcune fonti dicono dal 1173: le fonti divergono;
   - è molto più ampia della cerchia matildina del 1078 e per la prima
     volta comprende l'Oltrarno; con lei la città si divide in sestieri;
   - ha sei porte e quattro postierle [da verificare];
   - il tracciato si legge ancora nella forma delle strade, ma i resti
     delle mura e delle fondazioni sono rarissimi.
   Queste notizie vengono da sintesi consultate in rete il 2 ottobre 2026
   (la voce «Mura di Firenze» di Wikipedia e siti divulgativi), non dalle
   fonti: vanno controllate su Sznura 1975, Fanelli 1973 e Davidsohn.

   IL TRACCIATO QUI SOTTO È UN'IPOTESI GROSSOLANA, disegnato a mano per il
   fondale il 1° ottobre 2026. Per questo il muro si costruisce soltanto
   lontano, nel fondale; dove la città si percorre a piedi non c'è, per
   non costruirci sopra un'ipotesi. Fa eccezione una porta, sulla strada
   per San Felice, segnata come ipotesi.
   ===================================================================== */

/** Il perimetro, in metri locali (x est, z sud). Livello: ipotesi. */
export const TRACCIATO = [[-430, -20], [-440, -380], [-330, -640], [-120, -860], [150, -900], [420, -760], [600, -520],
  [640, -200], [640, 120], [420, 270], [150, 310], [-150, 330], [-420, 280], [-540, 100]];

/**
 * Le porte con una posizione nel modello. Delle altre conosciamo, al più,
 * il nome: la ricostruzione del tracciato viene prima.
 */
export const PORTE = [
  {
    id: 'porta-san-felice',
    nome: 'La porta verso San Felice',
    // dove la strada per San Felice incontra il perimetro provvisorio
    pos: [-336, 295.6],
    dir: [-0.18, 0.98],          // direzione del passaggio: perpendicolare al muro
    nota: 'una porta «di San Pier Gattolino» è attestata per la cerchia duecentesca d\'Oltrarno [da verificare: se esisteva nel 1216 e dove stava]'
  }
];

export const dentroTracciato = (x, z) => {
  let ok = false;
  const p = TRACCIATO;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ok = !ok;
  return ok;
};
