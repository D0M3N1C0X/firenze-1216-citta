/* =====================================================================
   LE FIGURE NEGLI INTERNI

   Figure generiche, come a Campi: nessun personaggio storico ha un volto o
   un nome (decisione del 9 ottobre 2026). Chi c'è, dove e in che giornata
   è un'ipotesi del modello, scritta qui perché si veda.

   - Santa Maria sopra Porta: la mattina di Pasqua la messa, con un
     chierico all'altare e i fedeli in piedi, rivolti all'abside (nelle
     chiese del Duecento non c'erano panche per i fedeli: le panche di
     pietra lungo i muri sono per chi non regge in piedi); in un giorno di
     lavoro, qualcuno che prega.
   - La torre degli Amidei: al piano terra, il magazzino, due famigli.

   Coordinate in metri della città; dir è l'angolo verso cui guarda la
   figura (atan2 dello spostamento in x e in z, come in mondo/abitanti.js).
   ===================================================================== */

// Santa Maria sopra Porta: la facciata a est (x 10,5), l'altare a ovest
const VERSO_ALTARE = -Math.PI / 2, VERSO_FEDELI = Math.PI / 2;
const FEDELI = ['popolano', 'popolana', 'artigiano', 'mercante', 'mercantessa', 'fantesca', 'fanciulla', 'ragazzo'];

function messa() {
  const out = [{ x: -3.6, z: -177, dir: VERSO_ALTARE, ruoli: ['chierico'], clip: 'fermo' }];
  // file di fedeli fra 2 e 8 m dalla facciata, con un passaggio nel mezzo
  for (const x of [1.4, 2.9, 4.4, 5.9, 7.4]) for (const z of [-180.2, -179.0, -175.0, -173.8]) {
    out.push({ x: x + ((x * 7 + z) % 0.3), z, dir: VERSO_ALTARE, ruoli: FEDELI, clip: 'fermo' });
  }
  return out;
}

function feriale() {
  return [
    { x: 1.6, z: -178.6, dir: VERSO_ALTARE, ruoli: ['popolana', 'fantesca'], clip: 'fermo' },
    { x: 3.2, z: -175.4, dir: VERSO_ALTARE, ruoli: ['popolano', 'artigiano'], clip: 'fermo' }
  ];
}

// la torre degli Amidei: due famigli che parlano fra le botti e i cassoni
const FAMIGLI = [
  { x: 17.9, z: -61.5, dir: Math.atan2(15.4 - 17.9, -60.2 + 61.5), ruoli: ['popolano', 'artigiano'], clip: 'parla' },
  { x: 15.4, z: -60.2, dir: Math.atan2(17.9 - 15.4, -61.5 + 60.2), ruoli: ['fantesca', 'popolano'], clip: 'fermo' }
];

/** Le figure ferme negli interni della città, per la giornata (dati/giornate.js). */
export function figureNegliInterni(giornata) {
  return [...(giornata.festa ? messa() : feriale()), ...FAMIGLI].map(f => ({ ...f, interno: true }));
}

export { VERSO_FEDELI };
