import {
  BufferAttribute, DataTexture, LinearMipmapLinearFilter, Mesh,
  MeshStandardMaterial, NoColorSpace, PlaneGeometry, RGBAFormat, RepeatWrapping
} from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { distanzaFiume } from './fiume.js';
import { MAT } from './materiali.js';
import { fbm, lerp, smooth } from './rumore.js';

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
export function quota(x, z) {
  // Oltrarno: la collina sale ripida dietro via de' Bardi (Costa San
  // Giorgio): da Forte Belvedere, circa 50 m più in alto della città a
  // 470 m dal ponte, verso ovest più dolce (Boboli, Porta Romana)
  const sud = smooth(150, 470, z);
  const verso = 0.6 + 0.4 * smooth(-800, 250, x);
  let h = 52 * sud * verso + 14 * smooth(470, 900, z);
  // San Miniato, a sud-est
  h += 64 * Math.exp(-(((x - 950) ** 2) / (2 * 380 ** 2) + ((z - 760) ** 2) / (2 * 300 ** 2)));
  // Fiesole e le colline a nord: oltre i 3 km
  h += 280 * smooth(2600, 6200, -z) * (0.6 + 0.4 * fbm(x / 1500 + 9, 0.3, 3));
  // a sud, oltre i 2,5 km, le colline verso il Chianti
  h += 120 * smooth(2500, 6000, z);
  // piccole ondulazioni sui colli
  h += (fbm(x / 220 + 40, z / 220 + 40, 4) - 0.5) * 14 * Math.max(sud, smooth(2000, 4000, -z));
  // la città non è un biliardo, ma quasi
  h += (fbm(x / 60, z / 60, 3) - 0.5) * 0.35;

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

function costruisci(x0, z0, lato, seg, abbassa, conPeso) {
  const g = new PlaneGeometry(lato, lato, seg, seg);
  g.rotateX(-Math.PI / 2);
  g.translate(x0, 0, z0);
  const pos = g.attributes.position;
  const n = pos.count;
  const peso = new Float32Array(n * 3), xz = new Float32Array(n * 2), uv = g.attributes.uv;
  for (let k = 0; k < n; k++) {
    const x = pos.getX(k), z = pos.getZ(k);
    let y = quota(x, z);
    // il terreno lontano ha maglie di 80 m: dentro il riquadro vicino va
    // tenuto ben sotto, o spunterebbe attraverso il letto del fiume
    if (abbassa && Math.abs(x) < 790 && Math.abs(z) < 790) y = -40;
    else if (abbassa && Math.abs(x) < 810 && Math.abs(z) < 810) y -= 1.2;
    pos.setY(k, y);
    xz[k * 2] = x; xz[k * 2 + 1] = z;
    uv.setXY(k, x, z);
    if (conPeso) {
      const d = distanzaFiume(x, z);
      const riva = smooth(4, -2, d) * smooth(-12, -3, d);
      const acqua = smooth(-3, -9, d);
      const colle = smooth(4, 14, y) + 0.35 * smooth(-1, -6, d) * (1 - acqua);
      const macchia = fbm(x / 40 + 3, z / 40 + 7, 4);
      let wE = Math.min(1, colle * 1.2 + smooth(0.62, 0.8, macchia) * 0.6);
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

export function creaTerreno(scene, qualita = 'alta') {
  const mat = materialeTerreno();
  const vicino = new Mesh(costruisci(0, 0, 1600, qualita === 'alta' ? 800 : 480, false, true), mat);
  vicino.receiveShadow = true;
  vicino.name = 'terreno';
  scene.add(vicino);
  const lontano = new Mesh(costruisci(0, 0, 16000, 200, true, true), mat);
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

