import {
  BufferAttribute, DataTexture, LinearMipmapLinearFilter, Mesh,
  MeshStandardMaterial, NoColorSpace, PlaneGeometry, RGBAFormat, RepeatWrapping
} from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { distanzaFiume } from './fiume.js';
import { MAT } from './materiali.js';
import { fbm, lerp, smooth } from './rumore.js';
import { FOSSATO } from '../dati/cerchia.js';

export { distanzaFiume };

/* =====================================================================
   TERRENO E FIUME

   Quote: 0 è il piano della città sulla riva destra. L'acqua è a −5,2 m.
   Il rilievo dell'Oltrarno (Boboli, San Giorgio) e di San Miniato è
   approssimato con funzioni lisce: NON viene da un modello digitale del
   terreno. Va sostituito con il DTM della Regione Toscana (PIANO.md).

   La riva: dal bordo del letto di oggi la terra scende verso l'acqua con
   una scarpata naturale, perché nel 1216 non ci sono gli argini in muratura.
   ===================================================================== */

export const LIVELLO_ACQUA = -5.2;

/* ------------------------------------------------------------ quote */
// Oltrarno: dove finisce il piano lungo il fiume e comincia il colle (z del
// piede, secondo x) e quanto sale il colle. Le vie lungo l'Arno (via de'
// Bardi, via di San Niccolò, la strada davanti a quello che sarà palazzo
// Pitti, piazza San Felice) stanno in piano, come oggi. Fino al 13 ottobre
// 2026 il colle cominciava in linea retta a 150 m dal ponte, e via di San
// Niccolò risultava 70 m più in alto della città.
const PIEDE = [[-900, 450], [-450, 400], [-300, 330], [-150, 220], [0, 170], [100, 190], [250, 300], [400, 410], [700, 470], [1000, 500]];
const ALTEZZA = [[-900, 18], [-600, 22], [-300, 42], [-100, 55], [400, 55], [700, 50], [1000, 45]];
function interp(tab, x) {
  if (x <= tab[0][0]) return tab[0][1];
  for (let k = 1; k < tab.length; k++) if (x <= tab[k][0]) return lerp(tab[k - 1][1], tab[k][1], (x - tab[k - 1][0]) / (tab[k][0] - tab[k - 1][0]));
  return tab.at(-1)[1];
}

export function quota(x, z) {
  // il colle: Costa San Giorgio e Forte Belvedere, circa 55 m più in alto
  // della città, Boboli più dolce a ovest
  const piede = interp(PIEDE, x);
  const sud = smooth(piede, piede + 300, z);
  let h = interp(ALTEZZA, x) * sud + 14 * smooth(piede + 320, piede + 750, z);
  // San Miniato, a sud-est (43,7594 N 11,2650 E), circa 75 m più in alto della
  // città: solo oltre il piede del colle
  h += 30 * smooth(piede - 20, piede + 80, z) * Math.exp(-(((x - 936) ** 2) / (2 * 320 ** 2) + ((z - 960) ** 2) / (2 * 280 ** 2)));
  // Fiesole e le colline a nord: oltre i 3 km
  h += 280 * smooth(2600, 6200, -z) * (0.6 + 0.4 * fbm(x / 1500 + 9, 0.3, 3));
  // a sud, oltre i 2,5 km, le colline verso il Chianti
  h += 120 * smooth(2500, 6000, z);
  // piccole ondulazioni sui colli
  h += (fbm(x / 220 + 40, z / 220 + 40, 4) - 0.5) * 14 * Math.max(sud, smooth(2000, 4000, -z));
  // la città non è un biliardo, ma quasi
  h += (fbm(x / 60, z / 60, 3) - 0.5) * 0.35;

  // il fossato lungo il muro est (dati/cerchia.js): largo circa 9 m, profondo 2,5
  h -= fosso(x, z);

  // il letto del fiume
  const d = distanzaFiume(x, z);
  // la riva scende ripida: le case stanno sull'orlo e il fiume le lambisce
  if (d < 1) {
    const s = smooth(1, -4.5, d);
    const fondo = LIVELLO_ACQUA - 1.4 - 2.4 * smooth(-6, -30, d);
    h = lerp(h, fondo, s);
  }
  return h;
}

/** Quanto il fossato scava il terreno in (x, z): 0 lontano dal fossato. */
// i tratti in celle di 20 m, ciascuna con quelli che passano a meno di 6 m
const F_CELLA = 20, F_SEG = new Float64Array(FOSSATO.flat(2)), F_CELLE = new Map();
FOSSATO.forEach(([[ax, az], [bx, bz]], k) => {
  for (let i = Math.floor((Math.min(ax, bx) - 6) / F_CELLA); i <= Math.floor((Math.max(ax, bx) + 6) / F_CELLA); i++)
    for (let j = Math.floor((Math.min(az, bz) - 6) / F_CELLA); j <= Math.floor((Math.max(az, bz) + 6) / F_CELLA); j++) {
      const c = i * 10007 + j;
      if (!F_CELLE.has(c)) F_CELLE.set(c, []);
      F_CELLE.get(c).push(k * 4);
    }
});
export function fosso(x, z) {
  const lista = F_CELLE.get(Math.floor(x / F_CELLA) * 10007 + Math.floor(z / F_CELLA));
  if (!lista) return 0;
  let d2 = Infinity;
  for (const o of lista) {
    const ax = F_SEG[o], az = F_SEG[o + 1], dx = F_SEG[o + 2] - ax, dz = F_SEG[o + 3] - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    const ex = ax + t * dx - x, ez = az + t * dz - z;
    d2 = Math.min(d2, ex * ex + ez * ez);
  }
  return d2 > 25 ? 0 : 2.5 * smooth(4.8, 2.6, Math.sqrt(d2));
}

/* -------------------------------------------- materiale del terreno */
// Tre materiali mescolati per vertice: terra battuta, erba, ghiaia di riva.
function materialeTerreno() {
  const m = new MeshStandardMaterial({
    normalMap: MAT.terra.normalMap, roughness: 1, metalness: 0
  });
  m.onBeforeCompile = sh => {
    sh.uniforms.tTerra = { value: MAT.terra.map };
    sh.uniforms.tErba = { value: MAT.erba.map };
    sh.uniforms.tGhiaia = { value: MAT.ghiaia.map };
    sh.uniforms.tRuvTerra = { value: MAT.terra.roughnessMap };
    // quanti cicli di texture per metro: dipende da quanto copre ogni immagine
    sh.uniforms.rT = { value: MAT.terra.map.repeat.x };
    sh.uniforms.cTerra = { value: MAT.terra.color };
    sh.uniforms.cGhiaia = { value: MAT.ghiaia.color };
    sh.uniforms.rE = { value: MAT.erba.map.repeat.x };
    sh.uniforms.rG = { value: MAT.ghiaia.map.repeat.x };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 peso;\nattribute vec2 xz;\nvarying vec3 vPeso;\nvarying vec2 vXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPeso = peso;\nvXZ = xz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tTerra, tErba, tGhiaia, tRuvTerra;\nuniform float rT, rE, rG;\nuniform vec3 cTerra, cGhiaia;\nvarying vec3 vPeso;\nvarying vec2 vXZ;')
      .replace('#include <map_fragment>', `
        // ogni texture letta a due scale e mescolata: spezza la ripetizione
        vec3 cT = mix(texture2D(tTerra, vXZ * rT).rgb, texture2D(tTerra, vXZ * rT * 0.23 + 0.37).rgb, 0.4);
        vec3 cE = mix(texture2D(tErba, vXZ * rE).rgb, texture2D(tErba, vXZ * rE * 0.27 + 0.61).rgb, 0.4);
        vec3 cG = mix(texture2D(tGhiaia, vXZ * rG).rgb, texture2D(tGhiaia, vXZ * rG * 0.31 + 0.13).rgb, 0.35);
        cT *= cTerra; cG *= cGhiaia;
        vec3 w = vPeso / max(0.001, vPeso.x + vPeso.y + vPeso.z);
        diffuseColor.rgb *= cT * w.x + cE * w.y + cG * w.z;`)
      .replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = roughness;
        float ruvT = texture2D(tRuvTerra, vXZ * rT).g;
        roughnessFactor = ruvT * w.x + 0.94 * w.y + 0.8 * w.z;`);
  };
  // la ripetizione della normal map è già impostata da materiali.js (1/8 m)
  return m;
}

/**
 * La piana di Campi (un luogo a parte, mondo/campi.js): piatta attorno al
 * castello, con lievi ondulazioni; lontano, a nord, i monti (Monte Morello,
 * la Calvana). Approssimata, come il rilievo della città.
 */
export function quotaPianura(x, z) {
  let h = (fbm(x / 90 + 5, z / 90 + 3, 3) - 0.5) * 0.7 * smooth(40, 90, Math.hypot(x, z));
  h += 650 * smooth(3500, 9000, -z) * (0.6 + 0.4 * fbm(x / 1800 + 2, 0.7, 3));
  return h;
}

function costruisci(x0, z0, lato, seg, abbassa, conPeso, q = quota, fiume = true) {
  const g = new PlaneGeometry(lato, lato, seg, seg);
  g.rotateX(-Math.PI / 2);
  g.translate(x0, 0, z0);
  const pos = g.attributes.position;
  const n = pos.count;
  const peso = new Float32Array(n * 3), xz = new Float32Array(n * 2), uv = g.attributes.uv;
  for (let k = 0; k < n; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    let y = q(x, z);
    // il terreno lontano ha maglie di 80 m: dentro il riquadro vicino va
    // tenuto ben sotto, o spunterebbe attraverso il letto del fiume
    const vx = Math.abs(x - VICINO.x), vz = Math.abs(z - VICINO.z), m = VICINO.lato / 2;
    if (abbassa && vx < m - 10 && vz < m - 10) y = -40;
    else if (abbassa && vx < m + 10 && vz < m + 10) y -= 1.2;
    pos.setY(k, y);
    xz[k * 2] = x; xz[k * 2 + 1] = z;
    uv.setXY(k, x, z);
    if (conPeso) {
      const d = fiume ? distanzaFiume(x, z) : 99;
      const riva = smooth(4, -2, d) * smooth(-12, -3, d);
      const acqua = smooth(-3, -9, d);
      const colle = smooth(4, 14, y) + 0.35 * smooth(-1, -6, d) * (1 - acqua);
      const macchia = fbm(x / 40 + 3, z / 40 + 7, 4);
      // nella piana senza fiume (Campi): prati e campi arati, a macchie
      let wE = fiume ? Math.min(1, colle * 1.2 + smooth(0.62, 0.8, macchia) * 0.6) : 0.2 + 0.75 * smooth(0.42, 0.62, macchia);
      let wG = Math.max(riva, acqua);
      let wT = Math.max(0, 1 - wE - wG);
      peso[k * 3] = wT; peso[k * 3 + 1] = wE * (1 - wG); peso[k * 3 + 2] = wG;
    } else { peso[k * 3 + 1] = 1; }
  }
  g.setAttribute('peso', new BufferAttribute(peso, 3));
  g.setAttribute('xz', new BufferAttribute(xz, 2));
  g.computeVertexNormals();
  return g;
}

/**
 * Il riquadro del terreno a maglia fine: dal 13 ottobre 2026 copre tutta la
 * cerchia del 1172–75 e i borghi fuori porta (2 km di lato, maglie di 2,2 m).
 */
export const VICINO = { x: 100, z: -240, lato: 2000 };

export function creaTerreno(scene, qualita = 'alta', q = quota, fiume = true) {
  const mat = materialeTerreno();
  const vicino = new Mesh(costruisci(VICINO.x, VICINO.z, VICINO.lato, qualita === 'alta' ? 900 : 540, false, true, q, fiume), mat);
  vicino.receiveShadow = true;
  vicino.name = 'terreno';
  scene.add(vicino);
  const lontano = new Mesh(costruisci(0, 0, 16000, 200, true, true, q, fiume), mat);
  lontano.receiveShadow = false;
  scene.add(lontano);
  return { vicino, lontano };
}

/* ------------------------------------------------------------- acqua */
function normaliAcqua(S = 512) {
  const h = new Float32Array(S * S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++)
    h[j * S + i] = fbm(i / S * 8, j / S * 8, 5, 8, 3) + 0.5 * fbm(i / S * 24, j / S * 24, 3, 24, 9);
  const d = new Uint8Array(S * S * 4);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const l = h[j * S + (i - 1 + S) % S], r = h[j * S + (i + 1) % S];
    const b = h[((j - 1 + S) % S) * S + i], t = h[((j + 1) % S) * S + i];
    let nx = (l - r) * 6, ny = (b - t) * 6, nz = 1; const n = Math.hypot(nx, ny, nz);
    const k = (j * S + i) * 4;
    d[k] = (nx / n * 0.5 + 0.5) * 255; d[k + 1] = (ny / n * 0.5 + 0.5) * 255; d[k + 2] = (nz / n * 0.5 + 0.5) * 255; d[k + 3] = 255;
  }
  const tx = new DataTexture(d, S, S, RGBAFormat);
  tx.wrapS = tx.wrapT = RepeatWrapping; tx.generateMipmaps = true; tx.minFilter = LinearMipmapLinearFilter;
  tx.colorSpace = NoColorSpace; tx.needsUpdate = true;
  return tx;
}

export function creaAcqua(scene, dirSole) {
  const acqua = new Water(new PlaneGeometry(5000, 5000), {
    textureWidth: 1024, textureHeight: 1024,
    waterNormals: normaliAcqua(),
    sunDirection: dirSole.clone(),
    sunColor: 0xfff4e0,
    waterColor: 0x2b3a2f,
    distortionScale: 1.4,
    fog: true
  });
  acqua.rotation.x = -Math.PI / 2;
  acqua.position.y = LIVELLO_ACQUA;
  acqua.material.uniforms.size.value = 2.2;
  acqua.material.uniforms.alpha.value = 1.0;
  acqua.name = 'arno';
  scene.add(acqua);
  return acqua;
}

