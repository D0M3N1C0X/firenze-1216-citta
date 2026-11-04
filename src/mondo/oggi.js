import {
  BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, ShapeUtils, Vector2
} from 'three';
import { FIUME, STRADE } from '../dati/osm.js';
import { MAT } from './materiali.js';
import { EDIFICIO, FIUME as C_FIUME, Griglia, PONTE } from './griglia.js';
import { LIVELLO_ACQUA, distanzaFiume, quota } from './terreno.js';
import { MARMO, PIETRAFORTE, PIETRAFORTE_CRUDA, preparaMonumenti } from './oggi-monumenti.js';

/* =====================================================================
   LA CITTÀ DI OGGI

   La stessa Firenze com'è adesso, nello stesso punto: si costruisce la
   prima volta che si tocca «Oggi», poi si accende al posto del 1216 e si
   spegne. Ogni edificio dentro la cerchia del 1172–75, e l'Oltrarno fino
   alla palizzata, ha l'impronta e l'altezza misurate dalla Regione
   Toscana nel 2011 (dati/oggi.js, scripts/oggi-estrai.mjs).

   Che cosa è misurato e che cosa è disegnato:
   - misurati: la forma di ogni volume, la sua altezza, i portici e i
     sottopassaggi con il loro soffitto;
   - disegnati: finestre, persiane, botteghe, portoni e tetti. Le finestre
     sono allineate ai piani (circa 3,8 m l'uno) e spaziate a passo
     regolare: sono quelle di una casa fiorentina qualsiasi, non quelle
     vere edificio per edificio. I tetti sono a padiglione, con la gronda
     sporgente, perché così sono quasi tutti in centro [da verificare:
     pendenza e sporto medi];
   - semplificati: i lungarni (un muro a scarpa con la spalletta) e i
     ponti (piano, spallette e pile, senza le arcate vere), tranne il
     Ponte Vecchio;
   - curati a parte (mondo/oggi-monumenti.js): la cupola, i marmi della
     cattedrale, del Battistero e del campanile, Palazzo Vecchio e il
     Ponte Vecchio con le botteghe e il Corridoio Vasariano.

   Le finestre non sono geometria: le disegna il materiale della
   facciata, che sa per ogni punto del muro a che piano e a che campata
   è (attributi «fa» e «fb»). Così novemila edifici restano leggeri.
   ===================================================================== */

const TESSERA = 160;                  // metri: un oggetto per materiale e per riquadro
const PIANO = 3.8;                    // altezza media di un piano in centro [da verificare]
const PIANO_PALAZZO = 5.4;            // i piani di un palazzo storico, più alti [da verificare]
const PENDENZA = 0.3;                 // falde a circa 17°: i coppi toscani [da verificare]

// gli intonaci del centro: crema, ocra, giallo, beige, rosato, grigio caldo, arancio tenue
// (a occhio, da foto di oggi: più carichi del vero, perché la luce del modello li sbianca)
const INTONACI = [[0.93, 0.83, 0.64], [0.9, 0.73, 0.48], [0.92, 0.77, 0.46], [0.86, 0.79, 0.66], [0.9, 0.71, 0.59], [0.82, 0.79, 0.72], [0.9, 0.67, 0.45], [0.94, 0.86, 0.7]];
const SERENA = [0.66, 0.67, 0.66];

const FACCIATE = new Set(['intonaco', 'pietra', 'marmo']);
const stileDi = o => o.stile ?? (o.t === 'monumento' ? 1 : 0);
const caso = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
const area = p => p.reduce((s, v, i) => { const w = p[(i + 1) % p.length]; return s + v[0] * w[1] - w[0] * v[1]; }, 0) / 2;

/* --------------------------------------------- raccolte di geometria */

class Raccolta {
  constructor(facciata = false) {
    this.p = []; this.n = []; this.uv = []; this.c = []; this.i = [];
    if (facciata) { this.fa = []; this.fb = []; }
  }
  vertice([x, y, z], n, u, v, c, fa, fb) {
    this.p.push(x, y, z); this.n.push(n[0], n[1], n[2]); this.uv.push(u, v); this.c.push(c[0], c[1], c[2]);
    if (this.fa) { this.fa.push(...fa); this.fb.push(...fb); }
    return this.p.length / 3 - 1;
  }
  /** Una faccia piana di 3 o 4 punti, girata verso n. */
  faccia(pts, n, uv, c, fa, fb) {
    const k = pts.map((p, j) => this.vertice(p, n, uv[j][0], uv[j][1], c, fa?.[j], fb));
    const [a, b, d] = pts, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const giusto = (e1[1] * e2[2] - e1[2] * e2[1]) * n[0] + (e1[2] * e2[0] - e1[0] * e2[2]) * n[1] + (e1[0] * e2[1] - e1[1] * e2[0]) * n[2] >= 0;
    const t = (x, y, z) => giusto ? this.i.push(x, y, z) : this.i.push(x, z, y);
    t(k[0], k[1], k[2]);
    if (k.length === 4) t(k[0], k[2], k[3]);
  }
  /** Un poligono orizzontale (con buchi), rivolto in su o in giù. */
  piano(anello, buchi, y, su, c, uvScala = 1) {
    const v2 = r => r.map(([x, z]) => new Vector2(x, z));
    const tri = ShapeUtils.triangulateShape(v2(anello), buchi.map(v2));
    const tutti = [...anello, ...buchi.flat()];
    const base = this.p.length / 3;
    for (const [x, z] of tutti) this.vertice([x, y, z], [0, su ? 1 : -1, 0], x * uvScala, z * uvScala, c);
    for (const [a, b, d] of tri) {
      const A = tutti[a], B = tutti[b], D = tutti[d];
      // in x, z con y in su, una faccia rivolta in su ha (B−A)×(D−A) con y positivo
      const cy = (B[1] - A[1]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[1] - A[1]);
      if ((cy > 0) === su) this.i.push(base + a, base + b, base + d); else this.i.push(base + a, base + d, base + b);
    }
  }
  vuota() { return !this.i.length; }
  geometria() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new Float32BufferAttribute(this.c, 3));
    if (this.fa) { g.setAttribute('fa', new Float32BufferAttribute(this.fa, 4)); g.setAttribute('fb', new Float32BufferAttribute(this.fb, 4)); }
    g.setIndex(this.i);
    g.computeBoundingSphere();
    // una volta sulla scheda video, i numeri non servono più qui
    for (const a of Object.values(g.attributes)) a.onUpload(function () { this.array = null; });
    return g;
  }
}

/* --------------------------------------------- materiali */

const GLSL_FACCIATA = `
float hO(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float hO2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// 1 dentro il rettangolo |p| < m, con un bordo morbido largo s
float dentroR(vec2 p, vec2 m, float s) { vec2 d = abs(p) - m; return 1.0 - smoothstep(-s, s, max(d.x, d.y)); }

// un'apertura a sesto acuto larga 2w e alta circa h, con la base in 0
float arcoAcuto(vec2 p, float w, float h, float s) {
  float corpo = dentroR(vec2(p.x, p.y - (h - w) * 0.5), vec2(w, (h - w) * 0.5), s);
  vec2 q = vec2(abs(p.x), p.y - (h - w));
  float punta = step(0.0, q.y) * (1.0 - smoothstep(2.0 * w - s, 2.0 * w + s, length(q - vec2(-w, 0.0))));
  return max(corpo, punta);
}

/*
 * I marmi di Santa Maria del Fiore, del Battistero e del campanile: bianco
 * con le lesene e le fasce di verde, i riquadri, qualche specchiatura rosa.
 * Un disegno generico, non quello vero. Il campanile (stile 3) ha le bifore
 * e le trifore; il tamburo della cupola (stile 4) un occhio per lato.
 */
vec3 marmi(vec3 bianco, vec4 a, vec4 b, out float vetro) {
  vetro = 0.0;
  float u = a.x, v = a.y, L = a.z, H = b.z, stile = b.w;
  float pix = max(fwidth(u), fwidth(v)), s = max(0.012, 0.6 * pix);
  vec3 verde = vec3(0.13, 0.2, 0.16), rosa = vec3(0.86, 0.64, 0.58);
  if (L < 1.0) return bianco;
  float nb = max(1.0, floor(L / 5.5 + 0.5)), pp = L / nb;
  float x = fract(u / pp) * pp, fascia = 6.5, y = mod(v, fascia);
  float lesena = 1.0 - smoothstep(0.22 - s, 0.22 + s, min(x, pp - x));
  float banda = 1.0 - smoothstep(0.2 - s, 0.2 + s, min(y, fascia - y));
  vec2 q = vec2(x - pp * 0.5, y - fascia * 0.5), m = vec2(pp * 0.5 - 0.6, fascia * 0.5 - 0.6);
  float bordo = dentroR(q, m, s) * (1.0 - dentroR(q, m - 0.14, s));
  float riquadro = dentroR(q, m - 0.5, s) * step(0.5, fract(floor(v / fascia) * 0.5));
  vec3 c = mix(bianco, rosa, riquadro * 0.7);
  c = mix(c, verde, max(max(lesena, banda), bordo));
  if (stile > 2.5 && stile < 3.5 && L > 8.0) {
    float cx = u - L * 0.5, ap = 0.0;
    for (int i = 0; i < 2; i++) {
      float y0 = H * (i == 0 ? 0.47 : 0.6);
      ap = max(ap, arcoAcuto(vec2(cx - L * 0.18, v - y0), 0.75, H * 0.09, s));
      ap = max(ap, arcoAcuto(vec2(cx + L * 0.18, v - y0), 0.75, H * 0.09, s));
    }
    // la cella delle campane: trifore, tre luci strette sotto un arco
    for (int j = -1; j <= 1; j++) ap = max(ap, arcoAcuto(vec2(cx - float(j) * L * 0.15, v - H * 0.75), L * 0.055, H * 0.13, s));
    c = mix(c, vec3(0.04, 0.04, 0.05), ap);
  }
  if (stile > 3.5 && L > 9.0) {
    float r = length(vec2(u - L * 0.5, v - (H - 5.5)));
    c = mix(c, verde, 1.0 - smoothstep(2.4 - s, 2.4 + s, r));
    c = mix(c, vec3(0.04, 0.04, 0.05), 1.0 - smoothstep(1.8 - s, 1.8 + s, r));
  }
  return mix(c, mix(bianco, verde, 0.18), smoothstep(0.3, 1.0, pix));
}

// un'apertura ad arco tondo larga 2w e alta h, con la base in 0
float arcoTondo(vec2 p, float w, float h, float s) {
  float corpo = dentroR(vec2(p.x, p.y - (h - w) * 0.5), vec2(w, (h - w) * 0.5), s);
  float cima = step(h - w, p.y) * (1.0 - smoothstep(w - s, w + s, length(vec2(p.x, p.y - (h - w)))));
  return max(corpo, cima);
}

/*
 * Palazzo Vecchio (stile 5): pietra scura e due file di bifore, ciascuna sulla
 * sua cornice. Quante bifore e dove è a passo regolare, non contato sul vero.
 */
vec3 palazzoVecchio(vec3 muro, vec4 a, vec4 b, out float vetro) {
  vetro = 0.0;
  float u = a.x, v = a.y, L = a.z, H = b.z;
  float pix = max(fwidth(u), fwidth(v)), s = max(0.012, 0.6 * pix);
  vec3 c = muro, serena = vec3(0.5, 0.48, 0.44);
  if (L < 6.0) return c;
  float nb = max(1.0, floor(L / 7.2 + 0.5)), baia = L / nb, bx = u - (floor(u / baia) + 0.5) * baia;
  for (int i = 0; i < 2; i++) {
    float y0 = H * (i == 0 ? 0.38 : 0.6);
    c = mix(c, serena, dentroR(vec2(0.0, v - y0 + 0.25), vec2(1e3, 0.16), s));
    vec2 p = vec2(bx, v - y0);
    float fuori = arcoTondo(p, 1.45, 4.5, s), dentroA = arcoTondo(p, 1.25, 4.3, s);
    c = mix(c, serena, fuori);
    c = mix(c, muro * 0.8, dentroA);
    float l1 = arcoTondo(p - vec2(0.56, 0.1), 0.42, 3.0, s), l2 = arcoTondo(p + vec2(0.56, -0.1), 0.42, 3.0, s);
    c = mix(c, vec3(0.04, 0.045, 0.05), max(l1, l2));
    vetro = max(vetro, max(l1, l2) * 0.5);
  }
  return mix(c, muro * 0.88, smoothstep(0.3, 1.0, pix));
}

/*
 * a = (u lungo il muro, v da terra, lunghezza del muro, altezza del piano)
 * b = (seme dell'edificio, finestre: 0 no, 1 sì, 2 sì ma senza botteghe,
 *      altezza della gronda da terra,
 *      stile: 0 casa, 1 palazzo, 2 marmi, 3 campanile, 4 tamburo, 5 Palazzo Vecchio)
 */
vec3 facciata(vec3 muro, vec4 a, vec4 b, out float vetro) {
  vetro = 0.0;
  if (b.w > 4.5) return palazzoVecchio(muro, a, b, vetro);
  if (b.w > 1.5) return marmi(muro, a, b, vetro);
  float u = a.x, v = a.y, L = a.z, fh = a.w, seme = b.x, H = b.z;
  bool palazzo = b.w > 0.5;
  if (b.y < 0.5 || L < 1.6 || v < 0.0 || v > H - 0.55) return muro;
  float pix = max(fwidth(u), fwidth(v));
  float s = max(0.012, 0.6 * pix);
  float passo = palazzo ? 4.3 : mix(3.0, 3.7, hO(seme * 1.7));
  float nb = max(1.0, floor(L / passo + 0.3));
  float baia = L / nb;
  float ib = floor(u / baia);
  float bx = u - (ib + 0.5) * baia;
  float f = floor(v / fh), fv = v - f * fh;
  float k = hO2(vec2(ib + 0.5, f + 0.5) + seme);
  vec3 serena = vec3(0.56, 0.57, 0.56);
  vec3 c = muro;
  if (f < 0.5 && b.y < 1.5) {
    c *= mix(0.8, 1.0, step(0.5, v));                                  // lo zoccolo
    if (k < 0.62 && baia > 2.3) {                                      // una bottega
      float w = min(baia - 0.9, 2.7) * 0.5, h = min(fh - 0.6, 3.1);
      float arco = step(hO(seme * 7.7 + ib), 0.3);
      vec2 p = vec2(bx, v - h * 0.5);
      float vano = dentroR(p, vec2(w, h * 0.5), s);
      float cy = h - w;
      if (arco > 0.5 && v > cy) vano *= 1.0 - smoothstep(w - s, w + s, length(vec2(bx, v - cy)));
      float cornice = dentroR(p, vec2(w + 0.16, h * 0.5 + 0.16), s) * (1.0 - vano);
      c = mix(c, serena, cornice * (palazzo ? 1.0 : 0.8));
      vec3 vetrina = mix(vec3(0.03, 0.035, 0.04), vec3(0.1, 0.085, 0.07), hO(ib + seme * 2.0));
      // i montanti della vetrina ogni 90 cm circa, e l'insegna in alto
      float montanti = 1.0 - smoothstep(0.03, 0.03 + s, abs(fract(bx / 0.9 + 0.5) - 0.5) * 0.9);
      vetrina = mix(vetrina, vec3(0.16, 0.16, 0.17), montanti * step(v, h - 0.45));
      float insegna = step(h - 0.45, v) * (1.0 - arco);
      vetrina = mix(vetrina, vec3(0.06, 0.06, 0.07), insegna);
      c = mix(c, vetrina, vano);
      vetro = vano * (1.0 - insegna) * (1.0 - montanti) * 0.6;
    } else if (k < 0.84) {                                             // un portone
      float h = min(fh - 0.7, 2.9);
      vec2 p = vec2(bx, v - h * 0.5);
      float vano = dentroR(p, vec2(0.7, h * 0.5), s);
      float cornice = dentroR(p, vec2(0.88, h * 0.5 + 0.18), s) * (1.0 - vano);
      c = mix(c, serena, cornice);
      vec3 legno = vec3(0.27, 0.18, 0.11) * (0.85 + 0.3 * hO(seme + ib));
      legno *= 0.86 + 0.14 * step(0.05, abs(bx));                    // le due ante
      c = mix(c, legno, vano);
    } else {                                                           // una finestrella con l'inferriata
      float vano = dentroR(vec2(bx, v - 2.1), vec2(0.4, 0.45), s);
      float ferro = step(0.86, fract(bx * 6.0 + 0.5));
      c = mix(c, mix(vec3(0.05), vec3(0.16, 0.15, 0.14), ferro), vano);
    }
  } else {
    // il marcapiano, la finestra con la cornice di pietra e il davanzale, le persiane
    if (palazzo || hO(seme * 9.1) < 0.35) c = mix(c, palazzo ? serena : muro * 1.08, dentroR(vec2(0.0, fv - 0.06), vec2(1e3, 0.07), s));
    if (k > 0.05) {
      float ww = palazzo ? 0.72 : 0.54, wh = min(palazzo ? 3.0 : 2.0, fh * 0.56), sy = fh * 0.3;
      vec2 p = vec2(bx, fv - sy - wh * 0.5);
      float vano = dentroR(p, vec2(ww, wh * 0.5), s);
      // i palazzi storici: finestra ad arco e niente persiane
      if (palazzo) vano = arcoTondo(vec2(bx, fv - sy), ww, wh, s);
      float cornice = dentroR(p, vec2(ww + 0.12, wh * 0.5 + 0.12), s) * (1.0 - vano);
      float davanzale = dentroR(vec2(bx, fv - sy + 0.1), vec2(ww + 0.2, 0.06), s);
      vec3 telaio = (palazzo || hO(seme * 4.3) < 0.5) ? serena : muro * 1.12;
      c = mix(c, telaio, max(cornice, davanzale));
      vec3 persiana = hO(seme * 3.3) < 0.72 ? vec3(0.1, 0.17, 0.11) : (hO(seme * 5.1) < 0.7 ? vec3(0.22, 0.14, 0.08) : vec3(0.32, 0.31, 0.29));
      float stecche = 0.8 + 0.2 * step(0.5, fract(fv * 16.0));
      float stato = hO2(vec2(ib * 3.1, f * 1.7) + seme * 2.3);
      vec3 vetroC = vec3(0.05, 0.06, 0.07) * (0.6 + 0.4 * smoothstep(0.0, 0.35, wh * 0.5 - p.y));
      float infisso = max(1.0 - smoothstep(0.025, 0.025 + s, abs(bx)), 1.0 - smoothstep(0.025, 0.025 + s, abs(p.y - wh * 0.17)));
      vetroC = mix(vetroC, vec3(0.72, 0.7, 0.64), infisso * 0.8);
      if (palazzo) stato = 0.9;
      if (stato < 0.38) c = mix(c, persiana * stecche, vano);           // persiane chiuse
      else {
        c = mix(c, vetroC, vano);
        vetro = vano * (1.0 - infisso);
        if (stato < 0.86) {                                             // persiane aperte, contro il muro
          float ante = dentroR(vec2(abs(bx) - ww * 1.5 - 0.12, p.y), vec2(ww * 0.5, wh * 0.5), s);
          c = mix(c, persiana * stecche, ante);
        }
      }
    }
  }
  // da lontano il disegno si confonde: si va verso il colore medio della facciata
  return mix(c, muro * 0.86, smoothstep(0.25, 0.9, pix));
}`;

/**
 * La facciata: la foto del materiale con il contrasto ridotto (l'intonaco di
 * oggi è liscio, la foto è di un muro grezzo) e sopra il disegno di finestre,
 * persiane e botteghe.
 */
function materialeFacciata(base, contrasto, chiave) {
  const m = new MeshStandardMaterial({
    map: base.map, normalMap: base.normalMap, roughnessMap: base.roughnessMap,
    roughness: 1, metalness: 0, vertexColors: true
  });
  m.normalScale.set(contrasto, contrasto);
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 fa;\nattribute vec4 fb;\nvarying vec4 vFa;\nvarying vec4 vFb;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFa = fa; vFb = fb;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vFa;\nvarying vec4 vFb;\n' + GLSL_FACCIATA)
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb = mix(vec3(0.8), diffuseColor.rgb / max(vec3(0.05), vec3(${TONO[chiave].join(', ')})) * 0.8, ${contrasto.toFixed(2)});`)
      // dopo il colore dei vertici (la tinta dell'intonaco), che non deve tingere vetri e persiane
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat vetroO = 0.0;\ndiffuseColor.rgb = facciata(diffuseColor.rgb, vFa, vFb, vetroO);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.22, vetroO);');
  };
  m.customProgramCacheKey = () => `facciataOggi|${chiave}|${contrasto}`;
  return m;
}

// il colore medio delle due foto (misurato a occhio sulle texture): serve a togliere la loro tinta
const TONO = { intonaco: [0.62, 0.6, 0.55], conci: [0.55, 0.5, 0.45] };

let MAT_OGGI = null;
function materiali() {
  if (MAT_OGGI) return MAT_OGGI;
  const lastre = MAT.lastre.clone();
  // il lastricato sta 5 cm sopra il terreno: da lontano gli si dà la precedenza
  lastre.polygonOffset = true; lastre.polygonOffsetFactor = -2; lastre.polygonOffsetUnits = -4;
  MAT_OGGI = {
    intonaco: materialeFacciata(MAT.intonaco, 0.22, 'intonaco'),
    pietra: materialeFacciata(MAT.conci, 0.55, 'conci'),
    marmo: materialeFacciata(MAT.intonaco, 0.08, 'intonaco'),
    bianco: new MeshStandardMaterial({ roughness: 0.45, metalness: 0, vertexColors: true }),
    oro: new MeshStandardMaterial({ color: 0xc9a43a, roughness: 0.3, metalness: 0.9, vertexColors: true }),
    bronzo: new MeshStandardMaterial({ color: 0x3a3428, roughness: 0.45, metalness: 0.6 }),
    coppi: MAT.coppi,
    sottogronda: MAT.legnoScuro || MAT.legno,
    conci: MAT.conci,
    lastre
  };
  return MAT_OGGI;
}

/* --------------------------------------------- anelli spostati */

/**
 * L'anello spostato verso fuori di d[i] metri lato per lato (d negativo:
 * verso dentro). Con un anello antiorario la normale esterna del lato
 * a→b è (dz, −dx). Gli angoli si raccordano sull'incontro dei due lati
 * spostati; se l'incontro va troppo lontano, si taglia.
 */
function sposta(anello, d) {
  const n = anello.length, out = [];
  const nl = anello.map((a, i) => {
    const b = anello[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return [dz / l, -dx / l, dx / l, dz / l];
  });
  for (let i = 0; i < n; i++) {
    const p = anello[i], A = nl[(i + n - 1) % n], B = nl[i], da = d[(i + n - 1) % n], db = d[i];
    const pa = [p[0] + A[0] * da, p[1] + A[1] * da], pb = [p[0] + B[0] * db, p[1] + B[1] * db];
    const cr = A[2] * B[3] - A[3] * B[2];
    let q;
    if (Math.abs(cr) < 1e-4) q = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
    else {
      const t = ((pb[0] - pa[0]) * B[3] - (pb[1] - pa[1]) * B[2]) / cr;
      q = [pa[0] + A[2] * t, pa[1] + A[3] * t];
      const lim = 2.5 * Math.max(Math.abs(da), Math.abs(db)) + 0.01;
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) > lim) q = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
    }
    out.push(q);
  }
  return out;
}

/** Il rientro è buono se ogni lato conserva il suo verso e nessun lato ne taglia un altro. */
function rientroBuono(anello, dentro) {
  const n = anello.length;
  if (area(dentro) <= 0.5) return false;
  for (let i = 0; i < n; i++) {
    const a = anello[i], b = anello[(i + 1) % n], p = dentro[i], q = dentro[(i + 1) % n];
    if ((b[0] - a[0]) * (q[0] - p[0]) + (b[1] - a[1]) * (q[1] - p[1]) <= 0) return false;
  }
  if (n > 3) for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (incrocio(dentro[i], dentro[(i + 1) % n], dentro[j], dentro[(j + 1) % n])) return false;
  }
  return true;
}
function incrocio(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b) && o(a, b, c) !== 0 && o(c, d, a) !== 0;
}

/* --------------------------------------------- gli edifici */

/**
 * Costruisce la città di oggi. Restituisce il gruppo da accendere e
 * spegnere, la griglia dove si cammina e la quota dei piedi.
 * passo(k): per la barra d'avanzamento (k da 0 a 1); pausa(): cede il passo al browser.
 */
export async function costruisciOggi(scene, { passo = () => {}, pausa = async () => {}, segni = [] } = {}) {
  const { EDIFICI_OGGI: U, RIQUADRO_OGGI: R } = await import('../dati/oggi.js');
  const M = materiali();
  const raccolte = new Map();
  const prendi = (mat, x, z) => {
    const k = `${mat}|${Math.floor(x / TESSERA)}|${Math.floor(z / TESSERA)}`;
    if (!raccolte.has(k)) raccolte.set(k, { mat, r: new Raccolta(FACCIATE.has(mat)) });
    return raccolte.get(k).r;
  };

  // i monumenti (mondo/oggi-monumenti.js) ritoccano alcuni volumi misurati e ne aggiungono
  // altri: le botteghe e il Corridoio sul Ponte Vecchio, che il rilievo non ha
  const mon = preparaMonumenti(U);
  const V = [...U.map((o, k) => mon.ritocchi.has(k) ? { ...o, ...mon.ritocchi.get(k) } : o), ...mon.aggiunti].filter(o => !o.via);

  // i muri in comune: chi c'è dall'altra parte di ogni lato, e quanto è alto
  const chiave = (a, b) => `${a[0]},${a[1]}|${b[0]},${b[1]}`;
  const lati = new Map();
  const suolo = V.map(o => {
    // sul ponte il «terreno» è il piano del ponte
    if (o.rif !== undefined && o.y0 !== undefined) return { min: o.y0, medio: o.rif };
    const q = o.p.map(([x, z]) => quota(x, z));
    return { min: Math.min(...q), medio: q.reduce((s, v) => s + v, 0) / q.length };
  });
  const gronda = V.map((o, k) => o.cima ?? suolo[k].medio + (o.soffitto || 0) + o.h);
  V.forEach((o, k) => o.p.forEach((a, i) => lati.set(chiave(a, o.p[(i + 1) % o.p.length]), k)));

  let fatti = 0;
  for (let k = 0; k < V.length; k++) {
    const o = V[k], g = suolo[k], Ye = gronda[k];
    const seme = caso(o.e * 1.618 + 0.3) * 997;
    const pietra = o.t === 'chiesa' || o.t === 'campanile' || o.t === 'monumento';
    const minore = o.t === 'baracca' || o.t === 'chiosco' || o.t === 'loggiato';
    const finestre = o.finestre ?? (!minore && o.t !== 'chiesa' && o.t !== 'campanile' && o.h >= 3.5);
    const mat = o.mat || (pietra ? 'pietra' : 'intonaco');
    const tinta = o.tinta || (mat === 'marmo' ? MARMO : mat === 'pietra' ? PIETRAFORTE.map(v => v * (0.94 + 0.1 * caso(seme + 1))) : INTONACI[Math.floor(caso(seme) * INTONACI.length)].map(v => v * (0.95 + 0.08 * caso(seme + 2))));
    const rif = o.rif ?? g.medio;
    const H = Ye - rif;
    const piani = Math.max(1, Math.round((H - 0.5) / (stileDi(o) === 1 ? PIANO_PALAZZO : PIANO))), fh = o.fh || Math.max(2.8, (H - 0.5) / piani);
    const base = o.y0 ?? (o.sotto ? g.medio + o.soffitto : g.min - 0.4);
    const stile = stileDi(o);
    const du = caso(seme + 3) * 7, dv = caso(seme + 4) * 7;
    const sporto = o.sporto ?? (o.h < 4 || minore ? 0.25 : o.t === 'chiesa' || o.t === 'campanile' ? 0.35 : o.t === 'monumento' ? 1.1 : 0.9);

    // i muri, lato per lato (anche quelli dei cortili, che guardano dentro il cortile)
    const anelli = [o.p, ...(o.b || [])];
    const sporti = [];
    for (const [ia, an] of anelli.entries()) {
      const n = an.length;
      for (let i = 0; i < n; i++) {
        const a = an[i], b = an[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
        if (L < 0.05) { if (!ia) sporti.push(0); continue; }
        const nn = [dz / L, 0, -dx / L];
        const vicino = lati.get(chiave(b, a));
        let y0 = base, cieco = false;
        if (vicino !== undefined) {
          // il muro di confine si vede solo dove questa casa è più alta della vicina, ed è cieco
          if (gronda[vicino] >= Ye - 0.05) { if (!ia) sporti.push(0); continue; }
          y0 = Math.max(base, gronda[vicino]); cieco = true;
        }
        if (!ia) sporti.push(vicino === undefined ? sporto : 0);
        const r = prendi(mat, a[0], a[1]);
        // sul ponte le botteghe aprono solo sulla strada: sul retro, verso il fiume, ci sono finestre
        const retro = o.strada && nn[0] * o.strada[0] + nn[2] * o.strada[1] < 0.5;
        const fb = [seme, finestre && !cieco ? (retro ? 2 : 1) : 0, H, stile];
        // fino al piano del tetto, 12 cm sopra la gronda: dove non c'è sporto non resta una fessura
        const y1 = Ye + 0.12, v1 = y1 - rif;
        r.faccia([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], nn,
          [[du, y0 + dv], [L + du, y0 + dv], [L + du, y1 + dv], [du, y1 + dv]], tinta,
          [[0, y0 - rif, L, fh], [L, y0 - rif, L, fh], [L, v1, L, fh], [0, v1, L, fh]], fb);
      }
    }

    // il tetto: a padiglione dove la forma lo permette, altrimenti piano; con la gronda
    const tetto = o.tetto || 'padiglione', tettoMat = o.tettoMat || 'coppi';
    const tc = tettoMat === 'coppi' ? 0.86 + 0.2 * caso(seme + 5) : 1, tintaTetto = tettoMat === 'coppi' ? [tc, tc * (0.97 + 0.04 * caso(seme + 6)), tc * 0.96] : MARMO;
    const rt = prendi(tettoMat, o.p[0][0], o.p[0][1]);
    const yT = Ye + 0.12;
    let fuori = sposta(o.p, sporti);
    // una gronda che si annoda (angoli rientranti stretti) non si fa: il tetto si ferma al muro
    if (!rientroBuono(o.p, fuori)) { sporti.fill(0); fuori = o.p; }
    let dentro = null, sale = 0;
    if (tetto === 'padiglione' && !o.b && !minore && o.p.length <= 60) {
      const perimetro = o.p.reduce((s, v, i) => s + Math.hypot(o.p[(i + 1) % o.p.length][0] - v[0], o.p[(i + 1) % o.p.length][1] - v[1]), 0);
      let d = Math.min(3.5, 0.8 * area(o.p) / perimetro);
      for (let t = 0; t < 3 && d > 0.4; t++, d /= 2) {
        const q = sposta(o.p, o.p.map(() => -d));
        if (rientroBuono(o.p, q)) { dentro = q; sale = d * PENDENZA; break; }
      }
    }
    const n = o.p.length;
    // tetto piano (cortili, forme strane, baracche): niente gronda, il tetto chiude la scatola dei muri;
    // se il tetto piano è voluto (il campanile) la gronda resta, come una piattaforma che sporge
    const sporge = tetto === 'piano' && !o.b && o.sporto;
    if (!dentro && !sporge) { sporti.fill(0); fuori = o.p; }
    const hV = fuori.map((_, i) => dentro ? yT - PENDENZA * Math.max(sporti[i], sporti[(i + n - 1) % n]) : yT);
    if (tetto === 'nessuno') { /* il tetto lo disegna il monumento */ }
    else if (dentro) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, a = fuori[i], b = fuori[j], c = dentro[j], d = dentro[i];
        const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez);
        if (L < 0.05) continue;
        const pa = [a[0], hV[i], a[1]], pb = [b[0], hV[j], b[1]], pc = [c[0], yT + sale, c[1]], pd = [d[0], yT + sale, d[1]];
        // la normale della falda: verso fuori e in su
        const e1 = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], e2 = [pd[0] - pa[0], pd[1] - pa[1], pd[2] - pa[2]];
        let nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        if (nn[1] < 0) nn = nn.map(v => -v);
        const l = Math.hypot(...nn) || 1; nn = nn.map(v => v / l);
        const lungo = Math.hypot(pd[0] - pa[0], pd[1] - pa[1], pd[2] - pa[2]);
        rt.faccia([pa, pb, pc, pd], nn, [[0, 0], [L, 0], [L, lungo], [0, lungo]], tintaTetto);
      }
      rt.piano(dentro, [], yT + sale, true, tintaTetto);
    } else rt.piano(sporge ? fuori : o.p, o.b || [], yT, true, tintaTetto);

    // sotto la gronda: il tavolato e la testata
    const rs = prendi('sottogronda', o.p[0][0], o.p[0][1]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = o.p[i], b = o.p[j];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 0.05 || !sporti[i] || tetto === 'nessuno') continue;
      const fa = fuori[i], fb = fuori[j], nn = [(b[1] - a[1]) / L, 0, -(b[0] - a[0]) / L];
      rs.faccia([[a[0], Ye, a[1]], [b[0], Ye, b[1]], [fb[0], hV[j] - 0.18, fb[1]], [fa[0], hV[i] - 0.18, fa[1]]], [0, -1, 0],
        [[0, 0], [L, 0], [L, sporti[i]], [0, sporti[i]]], tinta.map(v => v * 0.8));
      rs.faccia([[fa[0], hV[i] - 0.18, fa[1]], [fb[0], hV[j] - 0.18, fb[1]], [fb[0], hV[j], fb[1]], [fa[0], hV[i], fa[1]]], nn,
        [[0, 0], [L, 0], [L, 0.18], [0, 0.18]], [0.55, 0.45, 0.36]);
    }

    // i portici: il soffitto e i pilastri di pietra serena agli angoli
    if (o.sotto) {
      prendi('sottogronda', o.p[0][0], o.p[0][1]).piano(o.p, [], base, false, tinta.map(v => v * 0.75));
      const rp = prendi('conci', o.p[0][0], o.p[0][1]);
      const centro = [o.p.reduce((s, v) => s + v[0], 0) / n, o.p.reduce((s, v) => s + v[1], 0) / n];
      for (const v of o.p) {
        const dx = centro[0] - v[0], dz = centro[1] - v[1], l = Math.hypot(dx, dz) || 1;
        const cx = v[0] + dx / l * 0.45, cz = v[1] + dz / l * 0.45;
        pilastro(rp, cx, cz, 0.28, g.min - 0.3, base, SERENA);
      }
    }
    if (++fatti % 500 === 0) { passo(0.8 * fatti / V.length); await pausa(); }
  }

  const gruppo = new Group();
  gruppo.name = 'oggi';
  const aggiungi = (r, mat, ombra = true) => {
    if (r.vuota()) return;
    const m = new Mesh(r.geometria(), M[mat]);
    m.castShadow = ombra; m.receiveShadow = true;
    gruppo.add(m);
  };

  // dove si cammina: tutto il riquadro, meno gli edifici (i portici no) e il fiume, più i ponti
  const griglia = new Griglia(-920, 880);
  const [x0, z0, x1, z1] = R;
  for (let j = 0; j < griglia.n; j++) {
    const z = griglia.min + (j + 0.5) * griglia.cella;
    for (let i = 0; i < griglia.n; i++) {
      const x = griglia.min + (i + 0.5) * griglia.cella;
      if (x < x0 + 3 || x > x1 - 3 || z < z0 + 3 || z > z1 - 3) griglia.c[j * griglia.n + i] = EDIFICIO;
    }
  }
  griglia.poligono(FIUME, C_FIUME);
  for (const o of V) if (!o.sotto && !o.sospeso) griglia.poligono(o.p, EDIFICIO);
  passo(0.85); await pausa();

  mon.costruisci({ prendi, gruppo, griglia, M });
  const ponti = costruisciPonti(gruppo, griglia, M);
  costruisciLungarni(gruppo, R, M, [...ponti.assi, ...mon.assi]);
  for (const { mat, r } of raccolte.values()) aggiungi(r, mat, mat !== 'sottogronda');
  passo(0.9); await pausa();
  aggiungi(lastricato(griglia, R), 'lastre', false);

  scene.add(gruppo);
  passo(1);
  // i piedi: sul lastricato, e sui ponti al loro piano (il Ponte Vecchio sale verso il mezzo)
  const quotaIn = (x, z) => griglia.get(x, z) === PONTE ? mon.quotaPonte(x, z) ?? ponti.piano : quota(x, z) + 0.05;
  segniDeiLuoghi(gruppo, segni, griglia, quotaIn);
  return { gruppo, griglia, quotaIn, volumi: V, riquadro: R };
}

/**
 * I luoghi della storia nella città di oggi: un anello a terra e una colonnina
 * che si vede da lontano, del colore di che cosa ne resta. Se il punto cade
 * dentro una casa di oggi, il segno sta nel punto libero più vicino.
 */
function segniDeiLuoghi(gruppo, segni, griglia, quotaIn) {
  const anello = new RingGeometry(1.5, 1.95, 40); anello.rotateX(-Math.PI / 2);
  const colonna = new CylinderGeometry(0.07, 0.07, 7, 8);
  const materiali = new Map();
  const materiale = (c, opacita) => {
    const k = c + opacita;
    if (!materiali.has(k)) materiali.set(k, new MeshBasicMaterial({ color: c, transparent: true, opacity: opacita, depthWrite: false }));
    return materiali.get(k);
  };
  for (const { pos, colore } of segni) {
    const q = postoLibero(griglia, pos[0], pos[1]);
    if (!q) continue;
    const y = quotaIn(q[0], q[1]);
    const a = new Mesh(anello, materiale(colore, 0.9)); a.position.set(q[0], y + 0.08, q[1]); a.renderOrder = 5;
    const c = new Mesh(colonna, materiale(colore, 0.55)); c.position.set(q[0], y + 3.5, q[1]); c.renderOrder = 5;
    gruppo.add(a, c);
  }
}

function pilastro(r, cx, cz, m, y0, y1, c) {
  for (const [nx, nz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const tx = -nz, tz = nx;
    const a = [cx + nx * m - tx * m, cz + nz * m - tz * m], b = [cx + nx * m + tx * m, cz + nz * m + tz * m];
    r.faccia([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [nx, 0, nz],
      [[0, y0], [2 * m, y0], [2 * m, y1], [0, y1]], c);
  }
}

/* --------------------------------------------- il lastricato */

/** Le strade e le piazze di oggi sono lastricate: una maglia di 4 m sul terreno, tolti edifici e fiume. */
function lastricato(griglia, [x0, z0, x1, z1]) {
  const r = new Raccolta(), P = 4;
  const nx = Math.floor((x1 - x0) / P), nz = Math.floor((z1 - z0) / P);
  const idx = new Int32Array((nx + 1) * (nz + 1)).fill(-1);
  const vert = (i, j) => {
    const k = j * (nx + 1) + i;
    if (idx[k] < 0) {
      const x = x0 + i * P, z = z0 + j * P;
      const t = 0.9 + 0.12 * caso(Math.floor(x / 9) * 7.1 + Math.floor(z / 9) * 3.3);
      idx[k] = r.vertice([x, quota(x, z) + 0.05, z], [0, 1, 0], x, z, [t, t * 0.98, t * 0.95]);
    }
    return idx[k];
  };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const cx = x0 + (i + 0.5) * P, cz = z0 + (j + 0.5) * P;
    const v = griglia.get(cx, cz);
    if (v === EDIFICIO || v === C_FIUME || v === PONTE || distanzaFiume(cx, cz) < 1.5) continue;
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
    r.i.push(a, d, c, a, c, b);
  }
  return r;
}

/* --------------------------------------------- lungarni e ponti */

/**
 * I muraglioni dell'Ottocento lungo il letto di oggi (dati/osm.js, FIUME):
 * una scarpata di pietra dalla strada fin sotto il pelo dell'acqua, che
 * copre la riva di terra del 1216, e sopra la spalletta. Semplificati:
 * i muri veri sono quasi verticali [da verificare: profilo dei muraglioni].
 */
function costruisciLungarni(gruppo, [x0, z0, x1, z1], M, assi = []) {
  const r = new Raccolta(), rb = new Raccolta(), c = PIETRAFORTE_CRUDA;
  const dentroR = ([x, z]) => x > x0 && x < x1 && z > z0 && z < z1;
  const verso = area(FIUME) > 0 ? 1 : -1;            // per avere la normale verso il fiume
  const n = FIUME.length;
  for (let i = 0; i < n; i++) {
    const a = FIUME[i], b = FIUME[(i + 1) % n];
    if (!dentroR(a) && !dentroR(b)) continue;
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    if (L < 0.2) continue;
    // la normale esterna di un anello antiorario è (dz, −dx): il fiume è dall'altra parte
    const nx = -verso * dz / L, nz = verso * dx / L;           // verso il fiume
    const tx = dx / L * 0.3, tz = dz / L * 0.3;               // ogni tratto un po' più lungo: niente fessure agli angoli
    const A = [a[0] - tx, a[1] - tz], B = [b[0] + tx, b[1] + tz];
    const Ai = [A[0] + nx * 3.2, A[1] + nz * 3.2], Bi = [B[0] + nx * 3.2, B[1] + nz * 3.2];
    const yS = 0.02, yF = LIVELLO_ACQUA - 1.0;
    // la banchina: il lastricato arriva fino alla spalletta, senza la striscia di terra lasciata dalla maglia di 4 m
    const Ao = [A[0] - nx * 7, A[1] - nz * 7], Bo = [B[0] - nx * 7, B[1] - nz * 7];
    rb.faccia([[A[0], yS + 0.01, A[1]], [B[0], yS + 0.01, B[1]], [Bo[0], quota(Bo[0], Bo[1]) + 0.05, Bo[1]], [Ao[0], quota(Ao[0], Ao[1]) + 0.05, Ao[1]]], [0, 1, 0],
      [[A[0], A[1]], [B[0], B[1]], [Bo[0], Bo[1]], [Ao[0], Ao[1]]], [0.94, 0.92, 0.88]);
    const pend = Math.hypot(3.2, yS - yF), ns = [nx * 0.87, 0.48, nz * 0.87];
    r.faccia([[A[0], yS, A[1]], [B[0], yS, B[1]], [Bi[0], yF, Bi[1]], [Ai[0], yF, Ai[1]]], ns,
      [[0, 0], [L, 0], [L, pend], [0, pend]], c);
    // la spalletta: alta 0,9 m, larga 0,45, sull'orlo; si interrompe dove arriva un ponte
    for (const [t0, t1] of trattiLiberi(A, B, assi)) {
      const P = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], Q = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
      const Pe = [P[0] - nx * 0.45, P[1] - nz * 0.45], Qe = [Q[0] - nx * 0.45, Q[1] - nz * 0.45];
      const l = Math.hypot(Q[0] - P[0], Q[1] - P[1]), yP = 0.9;
      r.faccia([[P[0], yS, P[1]], [Q[0], yS, Q[1]], [Q[0], yP, Q[1]], [P[0], yP, P[1]]], [nx, 0, nz], [[0, 0], [l, 0], [l, yP], [0, yP]], c);
      r.faccia([[Pe[0], yS, Pe[1]], [Qe[0], yS, Qe[1]], [Qe[0], yP, Qe[1]], [Pe[0], yP, Pe[1]]], [-nx, 0, -nz], [[0, 0], [l, 0], [l, yP], [0, yP]], c);
      r.faccia([[P[0], yP, P[1]], [Q[0], yP, Q[1]], [Qe[0], yP, Qe[1]], [Pe[0], yP, Pe[1]]], [0, 1, 0], [[0, 0], [l, 0], [l, 0.45], [0, 0.45]], SERENA);
    }
  }
  if (r.vuota()) return;
  const m = new Mesh(r.geometria(), M.conci);
  m.castShadow = true; m.receiveShadow = true;
  gruppo.add(m);
  const b = new Mesh(rb.geometria(), M.lastre);
  b.receiveShadow = true;
  gruppo.add(b);
}

/** I pezzi [t0, t1] del lato A→B che nessun ponte attraversa (assi: [a, b, larghezza]). */
function trattiLiberi(A, B, assi) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  let liberi = [[0, 1]];
  for (const [a, b, W] of assi) {
    const rx = B[0] - A[0], rz = B[1] - A[1], sx = b[0] - a[0], sz = b[1] - a[1];
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - A[0]) * sz - (a[1] - A[1]) * sx) / den, u = ((a[0] - A[0]) * rz - (a[1] - A[1]) * rx) / den;
    if (u < -0.05 || u > 1.05 || t < -0.2 || t > 1.2) continue;
    // l'apertura: mezza larghezza del ponte, allungata se il ponte arriva di sbieco
    const sen = Math.abs(den) / (L * Math.hypot(sx, sz)), m = (W / 2 + 0.6) / Math.max(0.3, sen) / L;
    liberi = liberi.flatMap(([p, q]) => [[p, Math.min(q, t - m)], [Math.max(p, t + m), q]]).filter(([p, q]) => q - p > 0.02);
  }
  return liberi;
}

/**
 * I ponti di oggi dentro il riquadro, dalle strade di OpenStreetMap che ci
 * passano sopra: piano, spallette e pile ogni 30 m circa. Le arcate vere
 * (le tre di Santa Trinita, le cinque della Carraia) non ci sono ancora.
 */
function costruisciPonti(gruppo, griglia, M) {
  const r = new Raccolta(), c = PIETRAFORTE_CRUDA, piano = 0.6, assi = [];
  for (const s of STRADE) {
    if (!/^Ponte /.test(s.nome) || s.nome === 'Ponte Vecchio' || s.area) continue;
    const W = s.tipo === 'pedestrian' ? 8 : s.tipo === 'footway' ? 3 : 11;
    for (let k = 0; k + 1 < s.punti.length; k++) {
      const a = s.punti[k], b = s.punti[k + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      if (L < 0.5) continue;
      const ux = dx / L, uz = dz / L, nx = -uz, nz = ux, w = W / 2;
      griglia.spezzata([a, b], W - 1.2, PONTE);
      assi.push([a, b, W]);
      const p = (t, o, y) => [a[0] + ux * t + nx * o, y, a[1] + uz * t + nz * o];
      // il piano, la faccia di sotto e i due fianchi
      r.faccia([p(0, -w, piano), p(L, -w, piano), p(L, w, piano), p(0, w, piano)], [0, 1, 0], [[0, 0], [L, 0], [L, W], [0, W]], c);
      r.faccia([p(0, -w, piano - 1.6), p(L, -w, piano - 1.6), p(L, w, piano - 1.6), p(0, w, piano - 1.6)], [0, -1, 0], [[0, 0], [L, 0], [L, W], [0, W]], c);
      for (const lato of [-1, 1]) {
        const o = lato * w;
        r.faccia([p(0, o, piano - 1.6), p(L, o, piano - 1.6), p(L, o, piano + 0.95), p(0, o, piano + 0.95)], [nx * lato, 0, nz * lato], [[0, 0], [L, 0], [L, 2.55], [0, 2.55]], c);
        const oi = lato * (w - 0.4);
        r.faccia([p(0, oi, piano), p(L, oi, piano), p(L, oi, piano + 0.95), p(0, oi, piano + 0.95)], [-nx * lato, 0, -nz * lato], [[0, 0], [L, 0], [L, 0.95], [0, 0.95]], c);
        r.faccia([p(0, oi, piano + 0.95), p(L, oi, piano + 0.95), p(L, o, piano + 0.95), p(0, o, piano + 0.95)], [0, 1, 0], [[0, 0], [L, 0], [L, 0.4], [0, 0.4]], SERENA);
      }
      // le pile, dove il ponte passa sull'acqua
      for (let t = 15; t < L - 5; t += 30) {
        const [cx, , cz] = p(t, 0, 0);
        if (distanzaFiume(cx, cz) > -3) continue;
        for (const [ox, oz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const ex = ux * ox + nx * oz, ez = uz * ox + nz * oz, hx = 1.8, hz = w + 0.6;
          const m = ox ? hx : hz, q = ox ? hz : hx;
          const tx = -ez, tz = ex;
          const A = [cx + ex * m - tx * q, cz + ez * m - tz * q], B = [cx + ex * m + tx * q, cz + ez * m + tz * q];
          r.faccia([[A[0], LIVELLO_ACQUA - 2, A[1]], [B[0], LIVELLO_ACQUA - 2, B[1]], [B[0], piano - 1.6, B[1]], [A[0], piano - 1.6, A[1]]], [ex, 0, ez],
            [[0, 0], [2 * q, 0], [2 * q, 7], [0, 7]], c);
        }
      }
    }
  }
  if (!r.vuota()) { const m = new Mesh(r.geometria(), M.conci); m.castShadow = true; m.receiveShadow = true; gruppo.add(m); }
  return { piano, assi };
}

/**
 * Gli alberi della campagna del 1216 dove oggi ci sono le case: nel
 * riquadro si nascondono (scala zero), e tornano quando si torna al 1216.
 */
export function diradaAlberi(alberi, [x0, z0, x1, z1], via) {
  for (const im of alberi) {
    if (!im.isInstancedMesh) continue;
    const a = im.instanceMatrix.array;
    im.userData.originali ||= a.slice();
    const o = im.userData.originali;
    for (let i = 0; i < im.count; i++) {
      const x = o[i * 16 + 12], z = o[i * 16 + 14];
      const dentro = x > x0 && x < x1 && z > z0 && z < z1;
      for (let k = 0; k < 16; k++) a[i * 16 + k] = via && dentro ? 0 : o[i * 16 + k];
    }
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
  }
}

/** Il punto libero più vicino a (x, z) sulla griglia: chi passa da un'epoca all'altra non resta in un muro. */
export function postoLibero(griglia, x, z) {
  if (griglia.percorribile(x, z)) return [x, z];
  for (let r = 1; r < 60; r += 1) for (let a = 0; a < Math.PI * 2; a += Math.PI / Math.max(8, r * 2)) {
    const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (griglia.percorribile(px, pz)) return [px, pz];
  }
  return null;
}
