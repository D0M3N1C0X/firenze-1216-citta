import {
  BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Mesh, Path, Shape, Vector3
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAT, MAT_CERTEZZA } from './materiali.js';

/* =====================================================================
   IL CANTIERE

   Raccoglie migliaia di pezzi (muri, travi, coppi) e alla fine li fonde
   in pochi grandi oggetti, uno per materiale, per livello di certezza e
   per riquadro di città. Così la scheda video disegna poche centinaia di
   oggetti invece di centomila, e l'interruttore «Certezza» può ricolorare
   tutto in un colpo cambiando solo il materiale.

   Coordinate di texture: SEMPRE in metri.
   ===================================================================== */

const RIQUADRO = 80;   // metri

export class Cantiere {
  constructor() { this.pezzi = new Map(); this.mesh = []; }

  /**
   * Aggiunge una geometria costruita in coordinate locali.
   * @param {BufferGeometry} g    geometria (viene consumata)
   * @param {string} mat          chiave di MAT
   * @param {string} livello      documentato | dedotto | ipotesi
   * @param {Matrix4} m           da locale a mondo
   * @param {number[]} tinta      moltiplicatore RGB del colore
   */
  aggiungi(g, mat, livello, m, tinta = [1, 1, 1], ombra = true) {
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.clearGroups();
    if (m) {
      g.applyMatrix4(m);
      // ogni edificio sfasa le texture in modo diverso: la stessa foto non
      // si ripete identica da una casa all'altra
      const e = m.elements, fr = v => v - Math.floor(v);
      const du = fr(e[12] * 0.1371 + e[14] * 0.0713) * 7, dv = fr(e[12] * 0.0517 + e[14] * 0.1931) * 7;
      const uv = g.attributes.uv;
      if (uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + du, uv.getY(i) + dv);
    }
    const n = g.attributes.position.count;
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = tinta[0]; c[i * 3 + 1] = tinta[1]; c[i * 3 + 2] = tinta[2]; }
    g.setAttribute('color', new Float32BufferAttribute(c, 3));
    const p = g.attributes.position;
    const rx = Math.floor(p.getX(0) / RIQUADRO), rz = Math.floor(p.getZ(0) / RIQUADRO);
    const chiave = `${mat}|${livello}|${ombra ? 1 : 0}|${rx}|${rz}`;
    if (!this.pezzi.has(chiave)) this.pezzi.set(chiave, []);
    this.pezzi.get(chiave).push(g);
  }

  /** Fonde tutto e aggiunge alla scena. */
  costruisci(scene) {
    for (const [chiave, lista] of this.pezzi) {
      const [mat, livello, ombra] = chiave.split('|');
      const g = mergeGeometries(lista, false);
      for (const x of lista) x.dispose();
      if (!g) { console.warn('fusione fallita', chiave); continue; }
      g.computeBoundingSphere();
      const mesh = new Mesh(g, MAT[mat]);
      mesh.castShadow = ombra === '1';
      mesh.receiveShadow = true;
      mesh.userData = { mat, livello };
      scene.add(mesh);
      this.mesh.push(mesh);
    }
    this.pezzi.clear();
    return this.mesh;
  }

  /** Interruttore «Certezza»: colora per livello, o torna ai materiali veri. */
  certezza(acceso) {
    for (const m of this.mesh) m.material = acceso ? MAT_CERTEZZA[m.userData.livello] : MAT[m.userData.mat];
  }
}

/* --------------------------------------------- primitive con UV in metri */

/** Riproietta le UV in metri secondo la direzione dominante della normale. */
export function uvMetri(g, du = 0, dv = 0) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u + du; uv[i * 2 + 1] = v + dv;
  }
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return g;
}

/** Parallelepipedo da (x0,y0,z0) a (x1,y1,z1), con UV in metri. */
export function scatola(x0, y0, z0, x1, y1, z1, du = 0, dv = 0) {
  const g = new BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return uvMetri(g.toNonIndexed(), du, dv);
}

/**
 * Percorso di un'apertura: rettangolare o ad arco a tutto sesto.
 * a = { x (centro), y (davanzale o soglia), w, h, arco }
 */
export function percorsoApertura(a, PathClass = Path) {
  const p = new PathClass();
  const x0 = a.x - a.w / 2, x1 = a.x + a.w / 2, y0 = a.y;
  if (a.arco) {
    const r = a.w / 2, ys = a.y + a.h - r;
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, ys);
    p.absarc(a.x, ys, r, 0, Math.PI, false);
    p.lineTo(x0, y0);
  } else {
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y0 + a.h); p.lineTo(x0, y0 + a.h); p.lineTo(x0, y0);
  }
  return p;
}

/**
 * Muro piano con aperture: rettangolo largo W da y0 a y1, spesso t,
 * faccia esterna in z = 0 (rivolta verso −z), interno verso +z.
 */
export function muro(W, y0, y1, t, aperture = [], segmentiArco = 7) {
  const s = new Shape();
  s.moveTo(0, y0); s.lineTo(W, y0); s.lineTo(W, y1); s.lineTo(0, y1); s.lineTo(0, y0);
  for (const a of aperture) s.holes.push(percorsoApertura(a));
  const g = new ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: segmentiArco });
  return uvMuro(g);
}

/** Lastra con la forma di un'apertura: imposte, porte, tele. */
export function tamponamento(a, t, segmentiArco = 7, verticale = false) {
  const s = percorsoApertura(a, Shape);
  const g = uvMuro(new ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: segmentiArco }));
  if (verticale) {   // assi delle porte in verticale: si scambiano le coordinate di texture
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
  }
  return g;
}

/** Ghiera d'arco in conci attorno a un'apertura arcuata. */
export function ghiera(a, spessore, prof) {
  const r = a.w / 2, ys = a.y + a.h - r, R = r + spessore;
  const s = new Shape();
  s.moveTo(a.x + R, ys);
  s.absarc(a.x, ys, R, 0, Math.PI, false);
  s.lineTo(a.x - r, ys);
  s.absarc(a.x, ys, r, Math.PI, 0, true);
  s.lineTo(a.x + R, ys);
  return uvMuro(new ExtrudeGeometry(s, { depth: prof, bevelEnabled: false, curveSegments: 9 }));
}

/** Timpano triangolare: base W a quota y, colmo alto h, spesso t. */
export function timpano(W, y, h, t) {
  const s = new Shape();
  s.moveTo(0, y); s.lineTo(W, y); s.lineTo(W / 2, y + h); s.lineTo(0, y);
  return uvMuro(new ExtrudeGeometry(s, { depth: t, bevelEnabled: false }));
}

/** Le estrusioni hanno UV giuste sulle facce; sui risvolti le rifacciamo. */
function uvMuro(g) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const az = Math.abs(n.getZ(i));
    if (az > 0.5) uv.setXY(i, p.getX(i), p.getY(i));
    else if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, p.getX(i), p.getZ(i));
    else uv.setXY(i, p.getZ(i), p.getY(i));
  }
  return g;
}

/**
 * Falda di tetto: un lastrone spesso «sp» che va dalla gronda (y0, z0) al
 * colmo (y1, z1), largo da x0 a x1. Le UV corrono lungo la gronda (u) e
 * lungo la pendenza (v), come i filari dei coppi.
 */
export function falda(x0, x1, y0, z0, y1, z1, sp = 0.14) {
  const L = Math.hypot(y1 - y0, z1 - z0);
  const g = scatola(x0, -sp, 0, x1, 0, L);
  const ang = Math.atan2(y1 - y0, z1 - z0);
  const m = new Matrix4().makeRotationX(-ang).setPosition(0, y0, z0);
  g.applyMatrix4(m);
  return g;
}

/** Piramide a quattro falde su base W×D (centro in 0), alta h, con gronda. */
export function piramide(W, D, y, h, gronda = 0.4) {
  const a = W / 2 + gronda, b = D / 2 + gronda;
  const top = [0, y + h, 0];
  const base = [[-a, y, -b], [a, y, -b], [a, y, b], [-a, y, b]];
  const pos = [], uv = [];
  for (let i = 0; i < 4; i++) {
    const p0 = base[i], p1 = base[(i + 1) % 4];
    pos.push(...p0, ...top, ...p1);
    const lato = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
    const alt = Math.hypot(h, (i % 2 ? a : b));
    uv.push(0, 0, lato / 2, alt, lato, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** Matrice da locale (x lungo la strada, z verso l'interno del lotto) a mondo. */
export function matriceLotto(px, py, pz, nx, nz) {
  const t = new Vector3(nz, 0, -nx), y = new Vector3(0, 1, 0), n = new Vector3(nx, 0, nz);
  return new Matrix4().makeBasis(t, y, n).setPosition(px, py, pz);
}
