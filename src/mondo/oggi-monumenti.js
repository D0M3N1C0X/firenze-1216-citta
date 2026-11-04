import { ExtrudeGeometry, Float32BufferAttribute, Matrix4, Mesh, Shape, SphereGeometry, Vector3 } from 'three';
import { FIUME, IMPRONTE, STRADE } from '../dati/osm.js';
import { EDIFICIO, PONTE } from './griglia.js';
import { matriceLotto, muro } from './cantiere.js';
import { quota } from './terreno.js';

/* =====================================================================
   I MONUMENTI DELLA FIRENZE DI OGGI

   Il rilievo della Regione (dati/oggi.js) dà ogni volume con la sua
   altezza: la cupola, per esempio, è una pila di prismi (il tamburo a
   58,8 m, la cupola a 90,3, la lanterna a 100,5, la palla con la croce a
   112,6). Qui quei volumi si ritoccano o si sostituiscono con la forma
   vera, tenendo le altezze misurate:

   - la cupola del Brunelleschi: volta ottagonale a sesto acuto sul
     tamburo, con gli otto costoloni bianchi e la lanterna. Il profilo
     passa per le due quote misurate. Diametro esterno 54,8 m, imposta a
     circa 55 m da terra, lanterna alta 21 m (it.wikipedia, «Cupola del
     Brunelleschi»); gli occhi del tamburo, uno per lato, sono otto;
   - la cattedrale, il Battistero e il campanile di Giotto: rivestiti di
     marmi bianchi, verdi (serpentino di Prato) e rosati; il campanile
     alto 85 m, con due piani di bifore e la cella delle campane con le
     trifore, e in cima la piattaforma sporgente al posto della cuspide
     mai costruita (it.wikipedia, «Campanile di Giotto»). Il disegno dei
     riquadri è generico, non quello vero;
   - Palazzo Vecchio: la pietra scura, le due file di bifore (disegnate,
     non contate una per una), il ballatoio merlato in cima al palazzo e
     alla torre;
   - la Loggia dei Lanzi: aperta, con le tre arcate sulla piazza e una per
     lato, sul pavimento rialzato. Il rilievo la divide in due volumi alti
     21,4 m, che insieme fanno 37 × 13 m; le arcate sono a occhio. Le
     statue (il Perseo, il Ratto delle Sabine) non ci sono ancora;
   - il Ponte Vecchio del 1345 (che il rilievo non ha, perché sta sul
     fiume): tre arcate ribassate, la maggiore di 30 m, lungo 95 e largo
     20 (it.wikipedia, «Ponte Vecchio»); le botteghe sui due lati, con i
     retrobottega a sbalzo sul fiume sui beccatelli; il Corridoio
     Vasariano del 1565 sopra le botteghe del lato a monte, con la loggia
     sulla piazzetta di mezzo; dall'altra parte il busto di Cellini.
     Larghezza della strada, numero e misure delle botteghe, altezza del
     Corridoio: a occhio [da verificare: rilievo del ponte].
   ===================================================================== */

export const MARMO = [0.95, 0.94, 0.9];
const SERENA = [0.66, 0.67, 0.66];
export const PIETRAFORTE = [0.66, 0.56, 0.43];
// la stessa pietra sui pezzi che usano la foto dei conci così com'è, più scura di quella ammorbidita delle facciate
export const PIETRAFORTE_CRUDA = [0.92, 0.8, 0.63];
const BOTTEGHE = [[0.88, 0.6, 0.38], [0.86, 0.69, 0.46], [0.76, 0.47, 0.33], [0.92, 0.78, 0.5], [0.82, 0.56, 0.41], [0.9, 0.73, 0.55]];

const centro = p => [p.reduce((a, v) => a + v[0], 0) / p.length, p.reduce((a, v) => a + v[1], 0) / p.length];
const area = p => Math.abs(p.reduce((s, v, i) => { const w = p[(i + 1) % p.length]; return s + v[0] * w[1] - w[0] * v[1]; }, 0) / 2);
const areaCon = p => p.reduce((s, v, i) => { const w = p[(i + 1) % p.length]; return s + v[0] * w[1] - w[0] * v[1]; }, 0) / 2;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const antiorario = p => areaCon(p) > 0 ? p : p.slice().reverse();
function dentro([x, z], p) {
  let d = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d;
  return d;
}
const casoM = n => { const s = Math.sin(n * 78.233 + 1.7) * 43758.5453; return s - Math.floor(s); };

/** La normale di una faccia (a, b, d), girata dalla parte di «verso». */
function normale(a, b, d, verso) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  if (n[0] * verso[0] + n[1] * verso[1] + n[2] * verso[2] < 0) n = n.map(v => -v);
  const l = Math.hypot(...n) || 1;
  return n.map(v => v / l);
}

/**
 * Prepara i ritocchi ai volumi misurati e i volumi da aggiungere.
 * Restituisce { ritocchi: Map(indice → campi), aggiunti: [volumi], costruisci(ctx), quotaPonte(x, z) }.
 * Campi dei volumi: via (non si disegna), mat, stile (0 casa, 1 palazzo, 2 marmo, 3 campanile,
 * 4 tamburo), finestre, tetto (padiglione | piano | nessuno), tettoMat, sporto, tinta,
 * y0 (piede dei muri), rif (il «terreno» per i piani), cima, fh, sospeso (non occupa il suolo).
 */
export function preparaMonumenti(U) {
  const ritocchi = new Map(), aggiunti = [], lavori = [];
  const metti = (k, r) => ritocchi.set(k, { ...(ritocchi.get(k) || {}), ...r });
  const C = U.map(o => centro(o.p));

  /* ---------------- la cupola: il volume più alto della città è la palla con la croce */
  const kCroce = U.reduce((b, o, k) => o.h > U[b].h ? k : b, 0);
  const cc = C[kCroce];
  const vicini = U.map((_, k) => k).filter(k => dist(C[k], cc) < 5);
  const kTamburo = vicini.reduce((b, k) => area(U[k].p) > area(U[b].p) ? k : b, vicini[0]);
  const sopra = vicini.filter(k => U[k].h > U[kTamburo].h).sort((a, b) => U[a].h - U[b].h);
  if (area(U[kTamburo].p) > 1000 && sopra.length >= 2) {
    for (const k of sopra) metti(k, { via: true });
    metti(kTamburo, { mat: 'marmo', stile: 4, finestre: false, tetto: 'piano', tettoMat: 'bianco' });
    const g = quota(...cc);
    lavori.push(ctx => cupola(ctx, {
      c: cc, poligono: U[kTamburo].p, yTamburo: g + U[kTamburo].h + 0.12,
      yCupola: g + U[sopra[0]].h, yLanterna: g + U[sopra.at(-2)].h, yCroce: g + U[sopra.at(-1)].h
    }));
  }

  /* ---------------- marmi: cattedrale e Battistero (le loro impronte in OpenStreetMap), campanile */
  const impronta = tipo => IMPRONTE.find(i => i.tipo === tipo)?.punti;
  const cattedrale = impronta('cattedrale'), battistero = impronta('battistero');
  const vicinoA = (k, p) => p && (dentro(C[k], p) || p.some(v => dist(v, C[k]) < 3));
  let kBatt = -1;
  U.forEach((o, k) => {
    if (o.t !== 'chiesa' || ritocchi.get(k)?.via || k === kTamburo) return;
    if (vicinoA(k, cattedrale)) metti(k, { mat: 'marmo', stile: 2, finestre: false });
    else if (vicinoA(k, battistero)) {
      metti(k, { mat: 'marmo', stile: 2, finestre: false });
      if (kBatt < 0 || area(o.p) > area(U[kBatt].p)) kBatt = k;
    }
  });
  // il tetto del Battistero è una piramide bassa coperta di marmo bianco [da verificare]
  if (kBatt >= 0) metti(kBatt, { tettoMat: 'bianco', sporto: 0.3 });
  if (cattedrale) {
    const cC = centro(cattedrale);
    const campanili = U.map((_, k) => k).filter(k => U[k].t === 'campanile' && dist(C[k], cC) < 120);
    const kCamp = campanili.reduce((b, k) => b < 0 || U[k].h > U[b].h ? k : b, -1);
    if (kCamp >= 0) metti(kCamp, { mat: 'marmo', stile: 3, finestre: false, tetto: 'piano', sporto: 1.3, tettoMat: 'bianco' });
  }

  /* ---------------- Palazzo Vecchio: il volume monumentale più alto è la torre di Arnolfo */
  const monumenti = U.map((_, k) => k).filter(k => U[k].t === 'monumento');
  const kTorre = monumenti.reduce((b, k) => b < 0 || U[k].h > U[b].h ? k : b, -1);
  if (kTorre >= 0 && U[kTorre].h > 70) {
    const g = quota(...C[kTorre]);
    // il rilievo dà la torre a terra, in una rientranza del palazzo: la torre non ha finestre di casa
    const torre = monumenti.filter(k => dist(C[k], C[kTorre]) < 6 && U[k].h > 41);
    for (const k of torre) metti(k, { finestre: false, tetto: k === kTorre ? 'piano' : 'padiglione' });
    // il corpo del palazzo: la fascia alta 40,5 m tutt'intorno e il tetto più basso dentro
    const corpo = monumenti.filter(k => dist(C[k], C[kTorre]) < 20 && U[k].h >= 35 && U[k].h <= 41.5);
    for (const k of corpo) metti(k, { stile: 5, finestre: false });
    const anelli = [...corpo, ...torre].map(k => U[k].p);
    for (const k of corpo.filter(k => U[k].h >= 38)) lavori.push(ctx => ballatoio(ctx, U[k].p, quota(...C[k]) + U[k].h, anelli.filter(a => a !== U[k].p)));
    lavori.push(ctx => { ballatoio(ctx, U[kTorre].p, g + U[kTorre].h); guglia(ctx, U[kTorre].p, g + U[kTorre].h + 1.4); });
  }

  /* ---------------- le torri con il nome in OpenStreetMap: di pietra, con le finestre ad arco e senza persiane */
  for (const im of IMPRONTE.filter(i => i.tipo === 'torre')) U.forEach((o, k) => {
    if (!ritocchi.has(k) && !o.t && dentro(C[k], im.punti)) metti(k, { mat: 'pietra', stile: 1 });
  });

  /* ---------------- la Loggia dei Lanzi: l'unica loggia grande del rilievo, con il volume che le sta dietro */
  const kLoggia = U.map((_, k) => k).filter(k => U[k].sotto === 'loggia').reduce((b, k) => b < 0 || area(U[k].p) > area(U[b].p) ? k : b, -1);
  let quotaLoggia = () => null;
  if (kLoggia >= 0 && area(U[kLoggia].p) > 150) {
    const dietro = monumenti.filter(k => U[k].h === U[kLoggia].h && dist(C[k], C[kLoggia]) < 15);
    if (dietro.length === 1) {
      metti(kLoggia, { via: true }); metti(dietro[0], { via: true });
      quotaLoggia = logge(lavori, U[kLoggia], U[dietro[0]]);
    }
  }

  /* ---------------- il Ponte Vecchio del 1345 */
  const pv = pontePrepara(aggiunti, lavori);

  return {
    ritocchi, aggiunti,
    assi: pv ? [pv.asse] : [],
    // i piedi dove non si cammina sul terreno: il Ponte Vecchio e il pavimento della Loggia
    quotaPonte: (x, z) => quotaLoggia(x, z) ?? (pv ? pv.quota(x, z) : null),
    costruisci(ctx) { for (const f of lavori) f(ctx); }
  };
}

/* ===================================================================== la cupola */

function cupola({ prendi, gruppo, M }, { c, poligono, yTamburo, yCupola, yLanterna, yCroce }) {
  const [cx, cz] = c;
  // l'ottagono del tamburo: l'orientamento che rende più uguali gli otto apotemi
  let best = null;
  for (let th = 0; th < Math.PI / 4; th += Math.PI / 720) {
    const ap = [];
    for (let k = 0; k < 8; k++) {
      const a = th + k * Math.PI / 4, ux = Math.cos(a), uz = Math.sin(a);
      ap.push(Math.max(...poligono.map(([x, z]) => (x - cx) * ux + (z - cz) * uz)));
    }
    const m = ap.reduce((s, v) => s + v, 0) / 8, varianza = ap.reduce((s, v) => s + (v - m) ** 2, 0);
    if (!best || varianza < best.varianza) best = { th, m, varianza };
  }
  const th = best.th, a0 = best.m - 1.0;             // la cupola lascia un gradino sul tamburo
  const yT = yCupola - 1.2, aT = 5.4;                 // dove la volta incontra la base della lanterna
  // il sesto acuto: un arco di cerchio che passa per (a0, yTamburo) e (aT, yT), tangente in verticale alla base
  const H = yT - yTamburo, d = a0 - aT, rho = (d * d + H * H) / (2 * d), k0 = rho - a0;
  const alfaT = Math.asin(H / rho), N = 30;
  const livelli = [];
  for (let i = 0; i <= N; i++) {
    const al = alfaT * i / N;
    livelli.push({ y: yTamburo + rho * Math.sin(al), a: -k0 + rho * Math.cos(al) });
  }
  const cos8 = Math.cos(Math.PI / 8);
  // l'angolo k dell'ottagono (dove corre un costolone) a quota y
  const angolo = (k, a, y, fuori = 0) => {
    const f = th + k * Math.PI / 4 + Math.PI / 8, r = a / cos8 + fuori;
    return [cx + Math.cos(f) * r, y, cz + Math.sin(f) * r];
  };
  const rt = prendi('coppi', cx, cz), rb = prendi('bianco', cx, cz);
  const tegole = [1.0, 0.7, 0.56];
  let arco = 0;
  for (let i = 0; i < N; i++) {
    const L0 = livelli[i], L1 = livelli[i + 1];
    const passo = Math.hypot(L1.y - L0.y, L1.a - L0.a);
    for (let k = 0; k < 8; k++) {
      const p0 = angolo(k - 1, L0.a, L0.y), p1 = angolo(k, L0.a, L0.y), p2 = angolo(k, L1.a, L1.y), p3 = angolo(k - 1, L1.a, L1.y);
      const f = th + (k - 0.5) * Math.PI / 4 + Math.PI / 8, verso = [Math.cos(f), 0.4, Math.sin(f)];
      const s0 = 2 * L0.a * Math.tan(Math.PI / 8), s1 = 2 * L1.a * Math.tan(Math.PI / 8);
      rt.faccia([p0, p1, p2, p3], normale(p0, p1, p3, verso), [[0, arco], [s0, arco], [s1, arco + passo], [0, arco + passo]], tegole);
      // il costolone di marmo bianco sull'angolo: un dorso largo 1,8 m, rialzato di 45 cm
      const q = (kk, LL, verso2) => {
        const A = angolo(kk, LL.a, LL.y), B = angolo(kk + verso2, LL.a, LL.y), l = dist([A[0], A[2]], [B[0], B[2]]) || 1;
        return [A[0] + (B[0] - A[0]) / l * 0.9, LL.y, A[2] + (B[2] - A[2]) / l * 0.9];
      };
      const R0 = angolo(k, L0.a, L0.y + 0.1, 0.45), R1 = angolo(k, L1.a, L1.y + 0.1, 0.45);
      const fk = th + k * Math.PI / 4 + Math.PI / 8, vk = [Math.cos(fk), 0.3, Math.sin(fk)];
      for (const lato of [-1, 1]) {
        const S0 = q(k, L0, lato), S1 = q(k, L1, lato);
        rb.faccia([S0, R0, R1, S1], normale(S0, R0, S1, vk), [[0, arco], [0.9, arco], [0.9, arco + passo], [0, arco + passo]], MARMO);
      }
    }
    arco += passo;
  }

  // la base della lanterna (il «serraglio»), la lanterna con i contrafforti, il cono, la palla e la croce
  const prisma = (r, ap, y0, y1, tinta, cima = true) => {
    for (let k = 0; k < 8; k++) {
      const p0 = angolo(k - 1, ap, y0), p1 = angolo(k, ap, y0), p2 = angolo(k, ap, y1), p3 = angolo(k - 1, ap, y1);
      const f = th + (k - 0.5) * Math.PI / 4 + Math.PI / 8;
      const s = 2 * ap * Math.tan(Math.PI / 8);
      r.faccia([p0, p1, p2, p3], [Math.cos(f), 0, Math.sin(f)], [[0, y0], [s, y0], [s, y1], [0, y1]], tinta);
    }
    if (cima) r.piano(Array.from({ length: 8 }, (_, k) => { const p = angolo(k, ap, y1); return [p[0], p[2]]; }), [], y1, true, tinta);
  };
  prisma(rb, 6.0, yT - 0.3, yCupola, MARMO);
  const yL = yLanterna - 2.2;
  prisma(rb, 3.3, yCupola, yL, MARMO, false);
  // i vani della lanterna: scuri, alti e stretti, uno per lato
  const rs = prendi('sottogronda', cx, cz);
  for (let k = 0; k < 8; k++) {
    const f = th + (k - 0.5) * Math.PI / 4 + Math.PI / 8, ux = Math.cos(f), uz = Math.sin(f), tx = -uz, tz = ux;
    const r = 3.3 + 0.03, w = 0.55, y0 = yCupola + 1.2, y1 = yL - 1.2;
    const P = (s, y) => [cx + ux * r + tx * s, y, cz + uz * r + tz * s];
    rs.faccia([P(-w, y0), P(w, y0), P(w, y1), P(-w, y1)], [ux, 0, uz], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.08, 0.08, 0.09]);
    // il contrafforte sull'angolo: una lama che dalla base si stringe verso l'alto
    const fa = th + k * Math.PI / 4 + Math.PI / 8, ax = Math.cos(fa), az = Math.sin(fa), bx = -az, bz = ax;
    const Q = (rr, s, y) => [cx + ax * rr + bx * s, y, cz + az * rr + bz * s];
    for (const lato of [-1, 1]) {
      const n = [bx * lato, 0, bz * lato];
      rb.faccia([Q(3.5, 0.3 * lato, yCupola), Q(5.6, 0.3 * lato, yCupola), Q(3.9, 0.3 * lato, yL), Q(3.5, 0.3 * lato, yL)], n, [[0, 0], [2, 0], [0.4, 6], [0, 6]], MARMO);
    }
    rb.faccia([Q(5.6, -0.3, yCupola), Q(5.6, 0.3, yCupola), Q(3.9, 0.3, yL), Q(3.9, -0.3, yL)], normale(Q(5.6, -0.3, yCupola), Q(5.6, 0.3, yCupola), Q(3.9, -0.3, yL), [ax, 0.3, az]), [[0, 0], [0.6, 0], [0.6, 6], [0, 6]], MARMO);
  }
  const yA = yCroce - 3.4;
  for (let k = 0; k < 8; k++) {
    const p0 = angolo(k - 1, 3.6, yL), p1 = angolo(k, 3.6, yL), apice = [cx, yA, cz];
    const f = th + (k - 0.5) * Math.PI / 4 + Math.PI / 8;
    rb.faccia([p0, p1, apice], normale(p0, p1, apice, [Math.cos(f), 0.5, Math.sin(f)]), [[0, 0], [3, 0], [1.5, 6]], MARMO);
  }
  const sfera = new SphereGeometry(1.0, 20, 14);
  sfera.setAttribute('color', new Float32BufferAttribute(new Float32Array(sfera.attributes.position.count * 3).fill(1), 3));
  const palla = new Mesh(sfera, M.oro);
  palla.position.set(cx, yA + 1.0, cz); palla.castShadow = true;
  gruppo.add(palla);
  const ro = prendi('oro', cx, cz);
  croce(ro, cx, cz, yA + 1.9, yCroce, th);
}

function croce(r, cx, cz, y0, y1, th) {
  const ux = Math.cos(th), uz = Math.sin(th), m = 0.12;
  const barra = (x0, x1, ya, yb) => {
    // una barra: quattro facce verticali
    const P = (s, t, y) => [cx + ux * s - uz * t, y, cz + uz * s + ux * t];
    r.faccia([P(x0, -m, ya), P(x1, -m, ya), P(x1, -m, yb), P(x0, -m, yb)], [uz, 0, -ux], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
    r.faccia([P(x0, m, ya), P(x1, m, ya), P(x1, m, yb), P(x0, m, yb)], [-uz, 0, ux], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
    r.faccia([P(x1, -m, ya), P(x1, m, ya), P(x1, m, yb), P(x1, -m, yb)], [ux, 0, uz], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
    r.faccia([P(x0, -m, ya), P(x0, m, ya), P(x0, m, yb), P(x0, -m, yb)], [-ux, 0, -uz], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
  };
  barra(-m, m, y0, y1);
  barra(-0.8, 0.8, y1 - 1.4, y1 - 1.1);
}

/* ===================================================================== Palazzo Vecchio */

/**
 * Il ballatoio sporgente con i merli guelfi in cima a un anello di muri (gronda a quota «Ye»),
 * solo sui lati che danno fuori: non su quelli che confinano con gli anelli «vicini».
 */
function ballatoio({ prendi }, anello, Ye, vicini = []) {
  const p = antiorario(anello), n = p.length;
  const r = prendi('conci', p[0][0], p[0][1]);
  const c = PIETRAFORTE_CRUDA, S = 1.2, y0 = Ye - 3.6;
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 1) continue;
    const nx = dz / L, nz = -dx / L, ux = dx / L, uz = dz / L;
    const fuori = [(a[0] + b[0]) / 2 + nx * 0.8, (a[1] + b[1]) / 2 + nz * 0.8];
    if (dentro(fuori, p) || vicini.some(v => dentro(fuori, v))) continue;
    const P = (s, o, y) => [a[0] + ux * s + nx * o, y, a[1] + uz * s + nz * o];
    // la parete sporgente del ballatoio, il suo fondo e la spalletta
    r.faccia([P(-S, S, y0), P(L + S, S, y0), P(L + S, S, Ye), P(-S, S, Ye)], [nx, 0, nz], [[0, y0], [L, y0], [L, Ye], [0, Ye]], c);
    r.faccia([P(-S, 0, y0), P(L + S, 0, y0), P(L + S, S, y0), P(-S, S, y0)], [0, -1, 0], [[0, 0], [L, 0], [L, S], [0, S]], c.map(v => v * 0.75));
    r.faccia([P(-S, S - 0.5, Ye - 0.6), P(L + S, S - 0.5, Ye - 0.6), P(L + S, S - 0.5, Ye), P(-S, S - 0.5, Ye)], [-nx, 0, -nz], [[0, 0], [L, 0], [L, 0.6], [0, 0.6]], c);
    r.faccia([P(-S, S - 0.5, Ye), P(L + S, S - 0.5, Ye), P(L + S, S, Ye), P(-S, S, Ye)], [0, 1, 0], [[0, 0], [L, 0], [L, 0.5], [0, 0.5]], c);
    // i beccatelli sotto il ballatoio, ogni 1,7 m
    for (let s = 0.5; s < L; s += 1.7) {
      r.faccia([P(s - 0.3, 0, y0 - 1.6), P(s + 0.3, 0, y0 - 1.6), P(s + 0.3, S, y0), P(s - 0.3, S, y0)], normale(P(s - 0.3, 0, y0 - 1.6), P(s + 0.3, 0, y0 - 1.6), P(s - 0.3, S, y0), [nx, -1, nz]), [[0, 0], [0.6, 0], [0.6, 1.8], [0, 1.8]], c.map(v => v * 0.85));
    }
    // i merli: 0,9 m di pieno e 0,8 di vuoto
    for (let s = 0.2; s + 0.9 <= L; s += 1.7) {
      const s1 = s + 0.9, y1 = Ye + 1.3;
      r.faccia([P(s, S, Ye), P(s1, S, Ye), P(s1, S, y1), P(s, S, y1)], [nx, 0, nz], [[0, 0], [0.9, 0], [0.9, 1.3], [0, 1.3]], c);
      r.faccia([P(s, S - 0.5, Ye), P(s1, S - 0.5, Ye), P(s1, S - 0.5, y1), P(s, S - 0.5, y1)], [-nx, 0, -nz], [[0, 0], [0.9, 0], [0.9, 1.3], [0, 1.3]], c);
      r.faccia([P(s, S - 0.5, y1), P(s1, S - 0.5, y1), P(s1, S, y1), P(s, S, y1)], [0, 1, 0], [[0, 0], [0.9, 0], [0.9, 0.5], [0, 0.5]], c);
      for (const [ss, sg] of [[s, -1], [s1, 1]])
        r.faccia([P(ss, S - 0.5, Ye), P(ss, S, Ye), P(ss, S, y1), P(ss, S - 0.5, y1)], [ux * sg, 0, uz * sg], [[0, 0], [0.5, 0], [0.5, 1.3], [0, 1.3]], c);
    }
  }
}

/** La cuspide in cima alla torre: una piramide di pietra [da verificare: forma della cella campanaria]. */
function guglia({ prendi }, anello, y) {
  const p = antiorario(anello), [cx, cz] = centro(p), r = prendi('conci', cx, cz), apice = [cx, y + 7.5, cz];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const A = [cx + (a[0] - cx) * 0.8, y, cz + (a[1] - cz) * 0.8], B = [cx + (b[0] - cx) * 0.8, y, cz + (b[1] - cz) * 0.8];
    r.faccia([A, B, apice], normale(A, B, apice, [(a[0] + b[0]) / 2 - cx, 0.3, (a[1] + b[1]) / 2 - cz]), [[0, 0], [3, 0], [1.5, 7.5]], PIETRAFORTE_CRUDA.map(v => v * 0.9));
  }
}

/* ===================================================================== la Loggia dei Lanzi */

/**
 * Il rettangolo dei due volumi del rilievo: il lato di dietro è quello lungo del volume
 * che sta dietro, e la profondità arriva fino al punto più lontano della loggia.
 * Tre arcate sulla piazza, una per lato; il pavimento rialzato di 1,5 m.
 */
function logge(lavori, davanti, dietro) {
  const lati = dietro.p.map((a, i) => [a, dietro.p[(i + 1) % dietro.p.length]]).sort((x, y) => dist(y[0], y[1]) - dist(x[0], x[1]));
  // dei due lati lunghi, quello di dietro è il più lontano dalla loggia
  const cD = centro(davanti.p);
  const [B0, B1] = lati.slice(0, 2).sort((x, y) => dist(centro(y), cD) - dist(centro(x), cD))[0];
  const L = dist(B0, B1), ax = (B1[0] - B0[0]) / L, az = (B1[1] - B0[1]) / L;
  let nx = -az, nz = ax;                                    // verso la piazza
  if ((cD[0] - B0[0]) * nx + (cD[1] - B0[1]) * nz < 0) { nx = -nx; nz = -nz; }
  const D = Math.max(...davanti.p.map(([x, z]) => (x - B0[0]) * nx + (z - B0[1]) * nz));
  const R = (s, d) => [B0[0] + ax * s + nx * d, B0[1] + az * s + nz * d];
  const g = quota(...R(L / 2, D / 2)), yF = g + 1.5, cima = g + dietro.h - 1.1, soffitto = g + 15.6, sp = 2.2;
  const dentroL = (x, z) => { const s = (x - B0[0]) * ax + (z - B0[1]) * az, d = (x - B0[0]) * nx + (z - B0[1]) * nz; return s > 0 && s < L && d > 0 && d < D; };

  lavori.push(({ prendi, gruppo, griglia, M }) => {
    // una parete da A a B, spessa verso (inx, inz): il muro corre lungo (inz, −inx), quindi parte dall'estremo giusto
    const parete = (A, B, inx, inz, aperture) => {
      const W = dist(A, B), P0 = inz * (B[0] - A[0]) - inx * (B[1] - A[1]) > 0 ? A : B;
      const gm = muro(W, g - 0.4, cima, sp, aperture, 14);
      gm.applyMatrix4(matriceLotto(P0[0], 0, P0[1], inx, inz));
      gm.setAttribute('color', new Float32BufferAttribute(new Float32Array(gm.attributes.position.count * 3).fill(0).map((_, i) => PIETRAFORTE_CRUDA[i % 3]), 3));
      const m = new Mesh(gm, M.conci);
      m.castShadow = true; m.receiveShadow = true;
      gruppo.add(m);
    };
    const arco = (x, w) => ({ x, y: yF - g, w, h: 12.5, arco: true });
    const yLoc = a => ({ ...a, y: a.y + g });
    const luce = (L - 4 * sp) / 3;
    parete(R(0, D), R(L, D), -nx, -nz, [0, 1, 2].map(i => yLoc(arco(sp + luce / 2 + i * (luce + sp), luce))));   // sulla piazza
    parete(R(0, 0), R(0, D), ax, az, [yLoc(arco(D / 2, D - 2 * sp))]);                                           // un fianco
    parete(R(L, 0), R(L, D), -ax, -az, [yLoc(arco(D / 2, D - 2 * sp))]);                                         // l'altro
    parete(R(0, 0), R(L, 0), nx, nz, []);                                                                        // il fondo, chiuso

    const V = (s, d, y) => { const [x, z] = R(s, d); return [x, y, z]; };
    const [cx, cz] = R(L / 2, D / 2), r = prendi('conci', cx, cz), rl = prendi('lastre', cx, cz);
    // il pavimento, i tre gradini sulla piazza, il soffitto delle volte, la terrazza con la spalletta
    rl.faccia([V(0, 0, yF), V(L, 0, yF), V(L, D, yF), V(0, D, yF)], [0, 1, 0], [[0, 0], [L, 0], [L, D], [0, D]], [0.86, 0.82, 0.76]);
    for (let i = 0; i < 3; i++) {
      const d = D + 0.45 * (i + 1), y = yF - 0.5 * i, y1 = y - 0.5;
      rl.faccia([V(0, D + 0.45 * i, y1), V(L, D + 0.45 * i, y1), V(L, d, y1), V(0, d, y1)], [0, 1, 0], [[0, 0], [L, 0], [L, 0.45], [0, 0.45]], [0.86, 0.82, 0.76]);
      r.faccia([V(0, D + 0.45 * i, y1), V(L, D + 0.45 * i, y1), V(L, D + 0.45 * i, y), V(0, D + 0.45 * i, y)], [nx, 0, nz], [[0, 0], [L, 0], [L, 0.5], [0, 0.5]], SERENA);
    }
    r.faccia([V(0, 0, soffitto), V(L, 0, soffitto), V(L, D, soffitto), V(0, D, soffitto)], [0, -1, 0], [[0, 0], [L, 0], [L, D], [0, D]], PIETRAFORTE_CRUDA);
    r.faccia([V(0, 0, cima), V(L, 0, cima), V(L, D, cima), V(0, D, cima)], [0, 1, 0], [[0, 0], [L, 0], [L, D], [0, D]], PIETRAFORTE_CRUDA);
    const yP = cima + 1.1;
    for (const [a, b, n] of [[[0, D], [L, D], [nx, 0, nz]], [[L, D], [L, 0], [ax, 0, az]], [[L, 0], [0, 0], [-nx, 0, -nz]], [[0, 0], [0, D], [-ax, 0, -az]]]) {
      r.faccia([V(a[0], a[1], cima), V(b[0], b[1], cima), V(b[0], b[1], yP), V(a[0], a[1], yP)], n, [[0, 0], [10, 0], [10, 1.1], [0, 1.1]], SERENA);
    }
    // si cammina sul pavimento e sui gradini; i pilastri e il fondo occupano il suolo
    griglia.poligono([R(0, 0), R(L, 0), R(L, D + 1.4), R(0, D + 1.4)], PONTE);
    griglia.poligono([R(0, 0), R(L, 0), R(L, sp), R(0, sp)], EDIFICIO);
    for (let i = 0; i <= 3; i++) { const s = i * (luce + sp); griglia.poligono([R(s, D - sp), R(s + sp, D - sp), R(s + sp, D), R(s, D)], EDIFICIO); }
    for (const s of [0, L - sp]) { griglia.poligono([R(s, 0), R(s + sp, 0), R(s + sp, sp), R(s, sp)], EDIFICIO); }
  });
  return (x, z) => dentroL(x, z) ? yF + 0.02 : null;
}

/* ===================================================================== il Ponte Vecchio */

function pontePrepara(aggiunti, lavori) {
  // l'asse: le strade «Ponte Vecchio» di OpenStreetMap, dal capo nord a quello d'Oltrarno
  const punti = STRADE.filter(s => s.nome === 'Ponte Vecchio').flatMap(s => s.punti);
  if (punti.length < 2) return null;
  let A = punti[0], B = punti[1], lmax = 0;
  for (const p of punti) for (const q of punti) { const l = dist(p, q); if (l > lmax) { lmax = l; A = p; B = q; } }
  if (A[1] > B[1]) [A, B] = [B, A];
  const ux = (B[0] - A[0]) / lmax, uz = (B[1] - A[1]) / lmax, ex = uz, ez = -ux;       // e: verso est, a monte
  const P = (t, o) => [A[0] + ux * t + ex * o, A[1] + uz * t + ez * o];
  // dove c'è l'acqua lungo l'asse; il ponte (95 m) le sta a cavallo
  let t0 = null, t1 = null;
  for (let t = 0; t <= lmax; t += 0.5) if (dentro(P(t, 0), FIUME)) { t0 ??= t; t1 = t; }
  if (t0 === null) return null;
  const tc = (t0 + t1) / 2, T0 = tc - 47.5, T1 = tc + 47.5;
  const piano = t => 0.5 + 1.5 * Math.max(0, 1 - ((Math.max(T0, Math.min(T1, t)) - tc) / 47.5) ** 2);
  const STRADA = 3.6, MURO = 8, PIAZZA = 9;           // mezza strada, mezzo ponte di pietra, mezza piazzetta
  const yCorr = 8.6;

  // le botteghe: due file, interrotte dalla piazzetta di mezzo
  const botteghe = [];
  let e = 910000;
  for (const lato of [1, -1]) {
    let t = T0 + 1;
    while (t < T1 - 1) {
      if (t > tc - PIAZZA - 2 && t < tc + PIAZZA) { t = tc + PIAZZA; continue; }
      const w = Math.min(3.2 + 1.3 * casoM(e), (t < tc ? tc - PIAZZA : T1 - 1) - t);
      if (w < 2) { t += w + 0.1; continue; }
      const tm = t + w / 2, sbalzo = 0.6 + 2.0 * casoM(e + 0.5), d = piano(tm);
      const alta = lato > 0 ? Math.min(4.6 + 1.6 * casoM(e + 0.7), yCorr - 0.5 - d) : 5.2 + 4.0 * casoM(e + 0.7);
      const pts = [P(t + 0.02, lato * STRADA), P(t + w - 0.02, lato * STRADA), P(t + w - 0.02, lato * (MURO + sbalzo)), P(t + 0.02, lato * (MURO + sbalzo))];
      const b = { e: e++, h: alta, p: antiorario(pts), y0: d - 1.1, rif: d, cima: d + alta, sporto: 0.5, tinta: BOTTEGHE[Math.floor(casoM(e + 0.3) * BOTTEGHE.length)], strada: [-ex * lato, -ez * lato] };
      aggiunti.push(b);
      botteghe.push({ t, w, lato, sbalzo, y0: b.y0 });
      t += w;
    }
  }
  // il Corridoio Vasariano sopra le botteghe a monte, dritto da un capo all'altro
  aggiunti.push({
    e: e++, h: 4.3, p: antiorario([P(T0 - 1, STRADA), P(T1 + 1, STRADA), P(T1 + 1, MURO + 0.2), P(T0 - 1, MURO + 0.2)]),
    y0: yCorr, rif: yCorr - 4.3, cima: yCorr + 4.3, fh: 4.3, sporto: 0.4, sospeso: true, tinta: [0.93, 0.83, 0.62]
  });

  lavori.push(({ prendi, gruppo, griglia, M }) => {
    // il corpo di pietra: la sagoma (lungo l'asse, in alto) con le tre arcate ribassate, estrusa per 16 m
    const ys = -4.2, fondo = -9.2, archi = [[T0, T0 + 27], [T0 + 32.5, T0 + 62.5], [T0 + 68, T1]];
    const s = new Shape();
    s.moveTo(T0 - 2, fondo);
    for (const [a, b] of archi) {
      s.lineTo(a, fondo); s.lineTo(a, ys);
      const c = b - a, f = c / 6.5, R = (c * c / 4 + f * f) / (2 * f), cy = ys + f - R, m = (a + b) / 2;
      const ang = Math.asin(c / 2 / R);
      for (let i = 0; i <= 16; i++) { const t = -ang + 2 * ang * i / 16; s.lineTo(m + R * Math.sin(t), cy + R * Math.cos(t)); }
      s.lineTo(b, fondo);
    }
    s.lineTo(T1 + 2, fondo);
    for (let t = T1 + 2; t >= T0 - 2; t -= 2) s.lineTo(t, piano(t));
    const g = new ExtrudeGeometry(s, { depth: 2 * MURO, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -MURO);
    // da (t, y, o verso ovest) al mondo
    const X = new Vector3(ux, 0, uz), Y = new Vector3(0, 1, 0), Z = new Vector3(-ex, 0, -ez);
    g.applyMatrix4(new Matrix4().makeBasis(X, Y, Z).setPosition(A[0], 0, A[1]));
    g.setAttribute('color', new Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(0.82), 3));
    const ponte = new Mesh(g, M.conci);
    ponte.castShadow = true; ponte.receiveShadow = true;
    gruppo.add(ponte);

    const r = prendi('conci', A[0], A[1]), rs = prendi('sottogronda', A[0], A[1]), rl = prendi('lastre', A[0], A[1]);
    const V = (t, o, y) => { const [x, z] = P(t, o); return [x, y, z]; };
    // i rostri delle due pile, a monte e a valle
    for (const [a, b] of [[T0 + 27, T0 + 32.5], [T0 + 62.5, T0 + 68]]) for (const lato of [1, -1]) {
      const m = (a + b) / 2, yA = -1.6;
      const p1 = [a, lato * MURO], p2 = [b, lato * MURO], p3 = [m, lato * (MURO + 3.5)];
      for (const [q0, q1] of [[p1, p3], [p3, p2]]) {
        const pts = [V(q0[0], q0[1], fondo), V(q1[0], q1[1], fondo), V(q1[0], q1[1], yA), V(q0[0], q0[1], yA)];
        const [mx, mz] = P((q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2), [cx, cz] = P(m, lato * MURO);
        r.faccia(pts, normale(pts[0], pts[1], pts[3], [mx - cx, 0, mz - cz]), [[0, fondo], [3, fondo], [3, yA], [0, yA]], PIETRAFORTE_CRUDA);
      }
      const tetto = [V(p1[0], p1[1], yA), V(p2[0], p2[1], yA), V(p3[0], p3[1], yA + 1.2)];
      r.faccia(tetto, normale(...tetto, [0, 1, 0]), [[0, 0], [5.5, 0], [2.7, 3.5]], PIETRAFORTE_CRUDA);
    }
    // sotto i retrobottega a sbalzo: il fondo e i beccatelli di legno
    for (const b of botteghe) {
      const o0 = b.lato * MURO, o1 = b.lato * (MURO + b.sbalzo);
      const fondoB = [V(b.t, o0, b.y0), V(b.t + b.w, o0, b.y0), V(b.t + b.w, o1, b.y0), V(b.t, o1, b.y0)];
      rs.faccia(fondoB, [0, -1, 0], [[0, 0], [b.w, 0], [b.w, b.sbalzo], [0, b.sbalzo]], [0.42, 0.32, 0.24]);
      for (let t = b.t + 0.5; t < b.t + b.w - 0.3; t += 0.9) for (const sg of [1, -1]) {
        const tt = t + sg * 0.1, tri = [V(tt, o0, b.y0 - 1.5), V(tt, o0, b.y0), V(tt, o1 - b.lato * 0.1, b.y0)];
        rs.faccia(tri, [ux * sg, 0, uz * sg], [[0, 0], [0, 1.5], [b.sbalzo, 1.5]], [0.36, 0.27, 0.2]);
      }
    }
    // la strada e le piazzette, lastricate, sul piano del ponte che sale verso il mezzo
    for (let t = T0 - 3; t < T1 + 3; t += 2) {
      const t2 = Math.min(t + 2, T1 + 3), y0 = piano(t) + 0.03, y1 = piano(t2) + 0.03;
      const largo = t >= tc - PIAZZA && t2 <= tc + PIAZZA ? MURO : STRADA;
      rl.faccia([V(t, -largo, y0), V(t2, -largo, y1), V(t2, largo, y1), V(t, largo, y0)], [0, 1, 0],
        [[0, 0], [2, 0], [2, 2 * largo], [0, 2 * largo]], [0.92, 0.9, 0.86]);
    }
    // sulle piazzette: la spalletta sul fiume; a monte i pilastri della loggia che regge il Corridoio
    for (const lato of [1, -1]) {
      const o = lato * (MURO - 0.25), oe = lato * MURO;
      const a = tc - PIAZZA, b = tc + PIAZZA, ya = piano(a), yb = piano(b), yc = piano(tc);
      const par = [V(a, oe, ya), V(b, oe, yb), V(b, oe, yb + 1.0), V(a, oe, ya + 1.0)];
      r.faccia(par, [ex * lato, 0, ez * lato], [[0, 0], [18, 0], [18, 1], [0, 1]], PIETRAFORTE_CRUDA);
      const pin = [V(a, o - lato * 0.25, ya), V(b, o - lato * 0.25, yb), V(b, o - lato * 0.25, yb + 1.0), V(a, o - lato * 0.25, ya + 1.0)];
      r.faccia(pin, [-ex * lato, 0, -ez * lato], [[0, 0], [18, 0], [18, 1], [0, 1]], PIETRAFORTE_CRUDA);
      r.faccia([V(a, o - lato * 0.25, ya + 1.0), V(b, o - lato * 0.25, yb + 1.0), V(b, oe, yb + 1.0), V(a, oe, ya + 1.0)], [0, 1, 0], [[0, 0], [18, 0], [18, 0.5], [0, 0.5]], SERENA);
      if (lato > 0) for (const t of [a, tc - 3, tc + 3, b]) for (const oo of [STRADA + 0.4, MURO - 0.4]) {
        const [x, z] = P(t, oo);
        pilastroQ(r, x, z, 0.32, piano(t) - 0.2, yCorr, SERENA, ux, uz);
      }
      if (lato < 0) {
        // il monumento a Benvenuto Cellini: piedistallo di marmo e busto di bronzo
        const [x, z] = P(tc, -(MURO - 1.6));
        pilastroQ(r, x, z, 0.55, yc - 0.1, yc + 2.4, MARMO, ux, uz);
        const busto = new Mesh(new SphereGeometry(0.42, 16, 12), M.bronzo);
        busto.position.set(x, yc + 2.85, z); busto.scale.set(1, 1.25, 0.85); busto.castShadow = true;
        gruppo.add(busto);
      }
    }
    // il fondo del Corridoio, che si vede dalla piazzetta
    rs.faccia([V(T0 - 1, STRADA, yCorr), V(T1 + 1, STRADA, yCorr), V(T1 + 1, MURO + 0.2, yCorr), V(T0 - 1, MURO + 0.2, yCorr)], [0, -1, 0],
      [[0, 0], [T1 - T0 + 2, 0], [T1 - T0 + 2, 4.6], [0, 4.6]], [0.5, 0.42, 0.34]);
    // si cammina sulla strada del ponte e sulle piazzette
    griglia.spezzata([P(T0 - 4, 0), P(T1 + 4, 0)], 2 * STRADA - 0.4, PONTE);
    for (const lato of [1, -1]) griglia.poligono([P(tc - PIAZZA + 0.3, lato * STRADA), P(tc + PIAZZA - 0.3, lato * STRADA), P(tc + PIAZZA - 0.3, lato * (MURO - 0.6)), P(tc - PIAZZA + 0.3, lato * (MURO - 0.6))], PONTE);
  });

  return {
    asse: [P(T0 - 3, 0), P(T1 + 3, 0), 2 * MURO + 4],
    quota(x, z) {
      const t = (x - A[0]) * ux + (z - A[1]) * uz, o = (x - A[0]) * ex + (z - A[1]) * ez;
      return Math.abs(o) <= MURO + 0.5 && t > T0 - 5 && t < T1 + 5 ? piano(t) + 0.03 : null;
    }
  };
}

/** Un pilastro quadrato di lato 2m, allineato all'asse (ux, uz). */
function pilastroQ(r, cx, cz, m, y0, y1, c, ux = 1, uz = 0) {
  const ax = [[ux, uz], [-uz, ux], [-ux, -uz], [uz, -ux]];
  for (const [nx, nz] of ax) {
    const tx = -nz, tz = nx;
    const a = [cx + nx * m - tx * m, cz + nz * m - tz * m], b = [cx + nx * m + tx * m, cz + nz * m + tz * m];
    r.faccia([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [nx, 0, nz], [[0, y0], [2 * m, y0], [2 * m, y1], [0, y1]], c);
  }
  const q = ax.map(([nx, nz]) => [cx + (nx - nz) * m, cz + (nz + nx) * m]);
  r.piano(antiorario(q), [], y1, true, c);
}
