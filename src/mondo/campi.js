import { Matrix4 } from 'three';
import { MONUMENTO } from './griglia.js';
import { INDICE, MODELLI, posaModello } from './modelli.js';
import { quotaPianura } from './terreno.js';

/* =====================================================================
   CAMPI, IL CASTELLO DEL CONVITO — un luogo a parte (scene I1–I3)

   Nel gennaio 1216 Mazzingo Tegrimi dei Mazzinghi festeggia l'investitura
   a cavaliere «nella terra di Campi, apresso a Florenzia VJ milgla»
   (pseudo-Brunetto; Faini p. 13). Il castello non c'è più: è un'ipotesi
   (strumenti/monumenti/FONTI.md, § 8). Si apre con ?luogo=campi; la città
   non si costruisce, e la piana intorno è generata.

   Il modello di Blender porta con sé, in indice.json, dove si cammina, che
   cosa ingombra, dove siedono gli invitati e dove stanno servitori e
   cavalli. Coordinate di Blender: x verso est, y verso nord; qui z = -y.
   ===================================================================== */

const direzione = (ax, ay) => Math.atan2(ax, -ay);       // da un verso di Blender all'angolo delle figure

export function costruisciCampi(cant, griglia) {
  const C = INDICE.campi;
  if (cant && MODELLI.campi?.length) posaModello(cant, 'campi', new Matrix4(), 'ipotesi');
  for (const [x0, x1, y0, y1] of C.ostacoli) griglia.poligono([[x0, -y0], [x1, -y0], [x1, -y1], [x0, -y1]], MONUMENTO);
  const quotaIn = (x, z) => {
    for (const [x0, x1, y0, y1, h] of C.pavimenti) if (x > x0 && x < x1 && -z > y0 && -z < y1) return h;
    return quotaPianura(x, z);
  };
  const figura = ([x, y, ax, ay], ruoli, clip) => ({ x, z: -y, dir: direzione(ax, ay), ruoli, clip });
  const servitori = ['popolano', 'fantesca', 'ragazzo', 'popolana'];
  return {
    quotaIn,
    // gli invitati, seduti sulle panche: nobili e mercanti; poche donne (ipotesi)
    seduti: C.posti.map(([x, y, ax, ay, h], i) => ({ x, z: -y, dir: direzione(ax, ay), y: h, ruoli: i % 6 === 2 ? ['nobildonna', 'mercantessa'] : ['cavaliere', 'mercante'] })),
    fermi: [
      ...C.servitori.map((p, i) => figura(p, servitori, ['fermo', 'parla'][i % 2])),
      figura(C.giullare, ['ragazzo'], 'parla'),
      ...C.stallieri.map(p => figura(p, ['popolano', 'ragazzo'], 'fermo'))
    ],
    cavalli: C.cavalli.map(([x, y, ax, ay], i) => ({ tipo: i % 2 ? 'palafreno' : 'sellato', x, z: -y, dir: direzione(ax, ay) })),
    partenza: { x: C.partenza[0], z: -C.partenza[1], verso: [C.partenza[2], -C.partenza[3]] }
  };
}
