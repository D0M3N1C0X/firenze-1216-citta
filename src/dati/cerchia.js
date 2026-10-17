/* =====================================================================
   LA CERCHIA DEL 1172–1175

   Che cosa sappiamo, da Wikipedia «Mura di Firenze» (consultata il 7 e il
   12 ottobre 2026), che rimanda a Davidsohn, Scampoli 2010 e Bargellini-
   Guarnieri, *Le strade di Firenze* [da verificare su quelle opere]:
   - il Comune la costruisce «piuttosto in fretta a partire dal 1172», in
     «pietre di fiume e materiali di recupero»; i resti sono rarissimi, ma
     il tracciato si legge ancora nelle strade;
   - sulla riva destra corre lungo vie che esistono ancora: il lato ovest
     su via dei Fossi, via del Giglio e via del Canto de' Nelli; il lato
     nord da San Lorenzo per via dei Gori, de' Pucci, Bufalini e
     Sant'Egidio fino a piazza Salvemini; il lato est su via Verdi e via
     de' Benci, con un fossato; il lato sud lungo via dei Vagellai e via
     dei Saponai, «a ridosso» di via Lambertesca, borgo Santi Apostoli e
     via del Parione;
   - in Oltrarno non c'è un vero muro: lo chiudono le case, con le pareti
     verso l'esterno senza aperture, e una palizzata fatta in fretta.

   COME LO COSTRUISCE IL MODELLO
   - Il muro segue l'asse di quelle vie, prese da OpenStreetMap (dati/osm.js):
     il tracciato è «dedotto», altezza, spessore e merli sono «ipotesi».
   - Il lato sud sulla riva destra si costruisce solo lungo Vagellai e
     Saponai, dove la fonte è esplicita. Più a ovest non si sa se il muro
     corresse lungo il fiume o dietro Lambertesca e borgo Santi Apostoli:
     nel secondo caso la torre degli Amidei e Santo Stefano sarebbero fuori
     (PIANO.md, lacuna 33). Lì il modello non mette niente.
   - La palizzata d'Oltrarno è disegnata a mano, dietro le case delle vie
     che le porte nominano: è tutta «ipotesi».
   ===================================================================== */

import { FIUME, STRADE } from './osm.js';

/* ------------------------------------------------------------ geometria */

const vicino = (a, b, r = 1.5) => Math.hypot(a[0] - b[0], a[1] - b[1]) < r;

/** Il punto più vicino di una spezzata (aperta) a p, con la distanza. */
function piede(pts, p) {
  let best = { d: Infinity };
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / l2));
    const q = [ax + t * dx, az + t * dz], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < best.d) best = { d, q, k, t };
  }
  return best;
}

/**
 * Il cammino più breve da «da» ad «a» lungo le vie con quei nomi (le vie di
 * OSM sono spezzate in più tratti, a volte doppi): Dijkstra sui loro nodi.
 */
function lungoLeVie(nomi, da, a) {
  const tratti = STRADE.filter(s => !s.area && nomi.includes(s.nome)).map(s => s.punti);
  const nodi = [], chiave = new Map();
  const nodo = p => { const k = Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2); if (!chiave.has(k)) { chiave.set(k, nodi.length); nodi.push({ p, arch: [] }); } return chiave.get(k); };
  for (const t of tratti) for (let k = 0; k + 1 < t.length; k++) {
    const i = nodo(t[k]), j = nodo(t[k + 1]), l = Math.hypot(t[k + 1][0] - t[k][0], t[k + 1][1] - t[k][1]);
    nodi[i].arch.push([j, l]); nodi[j].arch.push([i, l]);
  }
  if (!nodi.length) return null;
  const piu = q => nodi.reduce((m, n, i) => Math.hypot(n.p[0] - q[0], n.p[1] - q[1]) < Math.hypot(nodi[m].p[0] - q[0], nodi[m].p[1] - q[1]) ? i : m, 0);
  const s = piu(da), e = piu(a);
  if (Math.hypot(nodi[s].p[0] - da[0], nodi[s].p[1] - da[1]) > 25 || Math.hypot(nodi[e].p[0] - a[0], nodi[e].p[1] - a[1]) > 25) return null;
  const dist = new Float64Array(nodi.length).fill(Infinity), prec = new Int32Array(nodi.length).fill(-1), fatto = new Uint8Array(nodi.length);
  dist[s] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < nodi.length; i++) if (!fatto[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === e) break;
    fatto[u] = 1;
    for (const [v, l] of nodi[u].arch) if (dist[u] + l < dist[v]) { dist[v] = dist[u] + l; prec[v] = u; }
  }
  if (dist[e] === Infinity) return null;
  const cammino = [];
  for (let u = e; u >= 0; u = prec[u]) cammino.unshift(nodi[u].p);
  return cammino;
}

/** L'estremo di una via più vicino a un punto: i capi delle vie fanno da caposaldi. */
function capo(nome, versoP) {
  let best = null;
  for (const s of STRADE) if (s.nome === nome && !s.area) for (const p of [s.punti[0], s.punti.at(-1)])
    if (!best || Math.hypot(p[0] - versoP[0], p[1] - versoP[1]) < Math.hypot(best[0] - versoP[0], best[1] - versoP[1])) best = p;
  return best || versoP;
}

/** Il punto della riva (il contorno del fiume di oggi) più vicino a p. */
function riva(p) {
  const anello = FIUME.concat([FIUME[0]]);
  return piede(anello, p).q;
}

/* --------------------------------------------- il muro della riva destra */

// I caposaldi: capi e incroci delle vie che la fonte nomina, in ordine da
// ovest a est. Dove la fonte non nomina una via (piazza Santa Maria
// Novella, piazza Madonna degli Aldobrandini, piazza Salvemini, piazza
// Santa Croce, piazza Mentana) il muro va dritto da un capo all'altro.
const FOSSI_SUD = capo('Via dei Fossi', [-446, -331]);
const TAPPE = [
  { punto: riva(FOSSI_SUD), nota: 'dalla riva, dove oggi è piazza Goldoni' },
  { punto: FOSSI_SUD },
  { vie: ['Via dei Fossi'], a: capo('Via dei Fossi', [-344, -467]) },
  { punto: capo('Via del Trebbio', [-234, -534]), nota: 'incrocio di via del Trebbio e via delle Belle Donne: la postierla del Trebbio' },
  { punto: capo('Via del Giglio', [-209, -590]) },
  { vie: ['Via del Giglio'], a: capo('Via del Giglio', [-82, -725]) },
  { punto: capo("Via del Canto de' Nelli", [-29, -765]) },
  { vie: ["Via del Canto de' Nelli"], a: capo("Via del Canto de' Nelli", [21, -807]) },
  // il vertice presso San Lorenzo: la via del mercato, a nord della basilica
  { vie: ['Piazza San Lorenzo', "Via dell'Ariento"], a: capo('Via dei Gori', [143, -754]) },
  { vie: ['Via dei Gori', 'Via dei Pucci'], a: [364, -654.4] },
  { vie: ['Via Maurizio Bufalini', "Via Sant'Egidio"], a: capo("Via Sant'Egidio", [678, -396]) },
  { punto: capo('Via Giuseppe Verdi', [739, -360]), nota: 'piazza Salvemini' },
  { vie: ['Via Giuseppe Verdi'], a: capo('Via Giuseppe Verdi', [602, -128]) },
  { punto: capo('Via dei Benci', [577, -85]), nota: 'il margine di piazza Santa Croce, che resta fuori' },
  { vie: ['Via dei Benci'], a: [484.8, 64.9] },
  { vie: ['Via dei Vagellai'], a: capo('Via dei Vagellai', [377, 64]) },
  { punto: capo('Via dei Saponai', [347, 68]), nota: 'piazza Mentana: la postierla d\'Arno' },
  { vie: ['Via dei Saponai'], a: capo('Via dei Saponai', [254, 51]) }
];

function traccia(tappe) {
  const out = [], avvisi = [];
  const metti = p => { if (!out.length || !vicino(out.at(-1), p, 0.3)) out.push([+p[0].toFixed(1), +p[1].toFixed(1)]); };
  for (const t of tappe) {
    if (t.punto) { metti(t.punto); continue; }
    const c = lungoLeVie(t.vie, out.at(-1), t.a);
    if (!c) { avvisi.push(`muro: nessun cammino per ${t.vie.join(', ')}; tratto dritto`); metti(t.a); continue; }
    c.forEach(metti);
  }
  return { punti: out, avvisi };
}

const MURO_DESTRA = traccia(TAPPE);

/** Il muro della riva destra, da piazza Goldoni a piazza dei Giudici. Tracciato «dedotto». */
export const MURO = MURO_DESTRA.punti;

/* ------------------------------------------------ la palizzata d'Oltrarno */

// Disegnata a mano sopra le vie di OSM, da est a ovest, una trentina di
// metri dietro le case: via di San Niccolò fino a via del Giardino
// Serristori, via de' Bardi, Santa Felicita, la strada davanti a quello che
// sarà palazzo Pitti fino a piazza San Felice. Lì gira e risale lungo via
// Maggio, che resta fuori: la fonte mette una porta a ciascuno dei suoi capi
// (piazza San Felice e piazza de' Frescobaldi), e il recinto di Santo
// Spirito, più a ovest, è «dopo il 1260». Poi corre dietro via di Santo
// Spirito fino in fondo, alla porta di San Jacopo. Livello: ipotesi.
const SERRISTORI = [734.2, 434.7];
const SANTO_SPIRITO_FONDO = capo('Via di Santo Spirito', [-547, -96]);
export const PALIZZATA = [
  riva([760, 400]),
  [762, 440], [735, 462], [660, 466], [600, 446], [470, 432], [380, 414],
  [300, 342], [200, 268], [130, 222], [70, 196], [5, 196], [-60, 198],
  [-120, 200], [-177, 222], [-242, 278], [-316, 326], [-384, 357],
  [-397, 331],
  [-414, 318], [-350, 170], [-282, 8],
  [-302, 32], [-345, 20], [-458, -27], [-481, -40], [-550, -66],
  [-563, -100],
  riva([-570, -130])
].map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]);

/* ------------------------------------------------------------- le porte */

// Dalla fonte: la porta (o postierla) e la via di oggi su cui stava. Il
// modello la mette dove quella via incontra il muro o la palizzata.
export const PORTE = [
  // lato ovest
  { id: 'porta-san-paolo', nome: 'Porta a San Paolo', tipo: 'porta', via: 'Via Palazzuolo', lato: 'ovest' },
  { id: 'postierla-trebbio', nome: 'La postierla del Trebbio', tipo: 'postierla', via: 'Via del Trebbio', lato: 'ovest' },
  { id: 'postierla-baschiera', nome: 'La postierla della Baschiera', tipo: 'postierla', via: 'Via Panzani', lato: 'ovest' },
  { id: 'postierla-campo-corbolini', nome: 'La postierla di Campo Corbolini', tipo: 'postierla', via: 'Via Faenza', lato: 'ovest' },
  // lato nord
  { id: 'porta-san-lorenzo', nome: 'Porta di San Lorenzo', tipo: 'porta', via: 'Via dei Ginori', lato: 'nord' },
  { id: 'postierla-spadai', nome: 'La postierla degli Spadai', tipo: 'postierla', via: 'Via dei Martelli', lato: 'nord' },
  { id: 'porta-di-balla', nome: 'Porta di Balla', tipo: 'porta', via: 'Via dei Servi', lato: 'nord' },
  { id: 'postierla-albertinelli', nome: 'La postierla degli Albertinelli', tipo: 'postierla', via: 'Borgo Pinti', lato: 'nord' },
  { id: 'porta-san-piero', nome: 'Porta San Piero', tipo: 'porta', via: 'Borgo degli Albizi', lato: 'nord' },
  // lato est
  { id: 'porta-ghibellina', nome: 'Porta Ghibellina', tipo: 'porta', via: 'Via Ghibellina', lato: 'est' },
  { id: 'porta-san-simone', nome: 'Porta d\'Isola d\'Arno, o di San Simone', tipo: 'porta', via: "Via dell'Anguillara", lato: 'est' },
  { id: 'porta-dei-buoi', nome: 'Porta dei Buoi', tipo: 'porta', via: 'Corso dei Tintori', lato: 'est' },
  // lato sud, il tratto costruito
  { id: 'postierla-arno', nome: 'La postierla d\'Arno', tipo: 'postierla', via: 'Piazza Mentana', lato: 'sud' },
  { id: 'postierla-altafronte', nome: 'La postierla d\'Altafronte', tipo: 'postierla', via: 'Piazza dei Giudici', lato: 'sud' },
  // Oltrarno
  { id: 'porta-vecchia', nome: 'Porta Vecchia', tipo: 'porta', via: 'Via di San Niccolò', lato: 'oltrarno', presso: SERRISTORI },
  { id: 'porta-santa-lucia', nome: 'Porta di Santa Lucia dei Magnoli, o Romana', tipo: 'porta', via: 'Costa Scarpuccia', lato: 'oltrarno' },
  { id: 'porta-di-piazza', nome: 'Porta di Piazza', tipo: 'porta', via: 'Piazza dei Pitti', lato: 'oltrarno', presso: [-404, 334] },
  { id: 'porta-via-maggio', nome: 'La porta di via Maggio', tipo: 'porta', via: 'Via Maggio', lato: 'oltrarno', presso: [-287, 3] },
  { id: 'porta-san-jacopo', nome: 'Porta Pisana, o di San Jacopo', tipo: 'porta', via: 'Borgo San Frediano', lato: 'oltrarno', presso: SANTO_SPIRITO_FONDO }
];

/** Dove una via incontra una spezzata: il primo incrocio, o il punto più vicino entro 30 m. */
function incontro(nomeVia, linea, presso) {
  let best = null;
  for (const s of STRADE) if (s.nome === nomeVia) for (let k = 0; k + 1 < s.punti.length; k++) {
    const [ax, az] = s.punti[k], [bx, bz] = s.punti[k + 1];
    for (let m = 0; m + 1 < linea.length; m++) {
      const [cx, cz] = linea[m], [dx, dz] = linea[m + 1];
      const den = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx);
      if (Math.abs(den) < 1e-9) continue;
      const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / den, u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const q = [ax + t * (bx - ax), az + t * (bz - az)];
      const d = presso ? Math.hypot(q[0] - presso[0], q[1] - presso[1]) : 0;
      if (!best || d < best.d) best = { q, m, d };
    }
  }
  if (!best) {
    // nessun incrocio: il punto della linea più vicino alla via
    for (const s of STRADE) if (s.nome === nomeVia) for (const p of s.punti) {
      const f = piede(linea, p);
      if (f.d < 30 && (!best || f.d < best.d)) best = { q: f.q, m: f.k, d: f.d };
    }
  }
  if (!best) return null;
  const [cx, cz] = linea[best.m], [dx, dz] = linea[best.m + 1], l = Math.hypot(dx - cx, dz - cz) || 1;
  // dir: perpendicolare alla linea, verso l'interno della città
  return { pos: [+best.q[0].toFixed(1), +best.q[1].toFixed(1)], lungo: [(dx - cx) / l, (dz - cz) / l], dir: [-(dz - cz) / l, (dx - cx) / l] };
}

for (const p of PORTE) {
  const linea = p.lato === 'oltrarno' ? PALIZZATA : MURO;
  const dove = incontro(p.via, linea, p.presso);
  if (dove) Object.assign(p, dove); else MURO_DESTRA.avvisi.push(`porta senza posto: ${p.nome} (${p.via})`);
}

/* ------------------------------------------------------------ il fossato */

// La fonte lo attesta soltanto lungo via Verdi e via de' Benci: qui corre
// fuori dal muro, a 6 m dall'asse, e si interrompe davanti alle porte, dove
// la strada lo passa su un terrapieno. Larghezza e profondità: ipotesi.
const piuVicino = (pts, q) => pts.reduce((m, p, i) => Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(pts[m][0] - q[0], pts[m][1] - q[1]) ? i : m, 0);
function fossato() {
  const i0 = piuVicino(MURO, capo('Via Giuseppe Verdi', [739, -360])), i1 = piuVicino(MURO, [484.8, 64.9]);
  const out = [];
  for (let k = i0; k < i1; k++) {
    const [ax, az] = MURO[k], [bx, bz] = MURO[k + 1], l = Math.hypot(bx - ax, bz - az);
    if (l < 0.5) continue;
    // fuori: l'opposto di dir (che guarda dentro la città)
    const ox = (bz - az) / l * 6, oz = -(bx - ax) / l * 6;
    const n = Math.ceil(l / 4);
    for (let i = 0; i < n; i++) {
      const a = [ax + (bx - ax) * i / n + ox, az + (bz - az) * i / n + oz], b = [ax + (bx - ax) * (i + 1) / n + ox, az + (bz - az) * (i + 1) / n + oz];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (PORTE.some(p => p.pos && Math.hypot(p.pos[0] - m[0], p.pos[1] - m[1]) < 10)) continue;
      out.push([a, b]);
    }
  }
  return out;
}
/** I tratti del fossato, [[x0, z0], [x1, z1]], fuori dal muro est. */
export const FOSSATO = fossato();

/* ------------------------------------------- il lato sud: due ipotesi */

// Sulla riva destra, fra piazza dei Giudici e piazza Goldoni, il muro
// poteva correre (A) lungo il fiume o (B) «a ridosso» di via Lambertesca,
// borgo Santi Apostoli e via del Parione, cioè dietro le case del loro lato
// verso l'Arno. Il modello le mostra entrambe, solo con l'interruttore
// Certezza acceso, e non ne costruisce nessuna (PIANO.md, lacuna 33).
function lungoRiva(da, a) {
  // il tratto più corto del contorno del fiume fra le due rive
  const i = piuVicino(FIUME, da), j = piuVicino(FIUME, a), n = FIUME.length;
  const avanti = [], indietro = [];
  for (let k = i; k !== j; k = (k + 1) % n) avanti.push(FIUME[k]);
  for (let k = i; k !== j; k = (k - 1 + n) % n) indietro.push(FIUME[k]);
  const lung = pts => pts.reduce((l, p, k) => k ? l + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0, 0);
  // i due vertici estremi possono stare oltre i punti cercati: si tengono quelli in mezzo
  return [da, ...(lung(avanti) < lung(indietro) ? avanti : indietro).slice(1), a];
}
function dietro(nomi, verso, d) {
  // le vie, nell'ordine, spostate di d metri verso il fiume
  const pts = [];
  for (const [nome, da, a] of nomi) {
    const c = lungoLeVie([nome], da, a) || [da, a];
    for (let k = 0; k < c.length; k++) {
      const p = c[k], q = c[Math.min(k + 1, c.length - 1)], r = c[Math.max(k - 1, 0)];
      const tx = q[0] - r[0], tz = q[1] - r[1], l = Math.hypot(tx, tz) || 1;
      let nx = -tz / l, nz = tx / l;
      if ((verso[0] - p[0]) * nx + (verso[1] - p[1]) * nz < 0) { nx = -nx; nz = -nz; }
      pts.push([+(p[0] + nx * d).toFixed(1), +(p[1] + nz * d).toFixed(1)]);
    }
  }
  return pts;
}
export const IPOTESI_SUD = {
  fiume: [MURO.at(-1), ...lungoRiva(riva(MURO.at(-1)), riva(MURO[0])).map(p => [+p[0].toFixed(1), +p[1].toFixed(1)])],
  vie: [MURO.at(-1),
    ...dietro([
      ['Via Lambertesca', capo('Via Lambertesca', [174, -37]), capo('Via Lambertesca', [38, -82])],
      ['Borgo Santi Apostoli', capo('Borgo Santi Apostoli', [37, -79]), capo('Borgo Santi Apostoli', [-158, -179])],
      ['Via del Parione', capo('Via del Parione', [-168, -224]), capo('Via del Parione', [-421, -308])]
    ], [0, 60], 12),
    MURO[0]]
};

/** Avvisi della costruzione del tracciato (li stampa la verifica). */
export const AVVISI = MURO_DESTRA.avvisi;

/* ------------------------------------------------------- dentro e fuori */

// L'area della città nel 1216, per costruire casa per casa: il muro della
// riva destra, poi la riva fino al fiume (il lato sud lungo l'acqua, perché
// la lacuna 33 è aperta), attraverso il fiume fino alla palizzata, e di nuovo
// attraverso il fiume fino a piazza Goldoni. Il fiume, dentro, resta fiume.
const GIUDICI = MURO.at(-1);
export const TRACCIATO = [
  ...MURO,
  riva([GIUDICI[0], GIUDICI[1] + 40]),
  ...PALIZZATA,
];

export const dentroTracciato = (x, z) => {
  let ok = false;
  const p = TRACCIATO;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ok = !ok;
  return ok;
};
