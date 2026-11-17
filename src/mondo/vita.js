import { InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LIBERO, PIAZZA, RECINTO, STRADA } from './griglia.js';
import { quota } from './terreno.js';
import { rng } from './rumore.js';

/* =====================================================================
   LA VITA DI STRADA — una prova, solo con ?vita (vita.html)

   Il materiale preparato per l'app Unity (16–17 novembre 2026) messo nella
   città del browser per poterlo guardare prima che ci sia Unity: le 87
   persone per epoca, i 40 movimenti, gli attrezzi in mano, l'arredo delle
   strade, le insegne e gli stemmi. La città normale non cambia.

   - Davanti a una parte delle case, lungo le strade larghe: botti, casse,
     sacchi, ceste, cataste, panche, carretti; nei giorni di lavoro chi
     spazza, sega, martella, solleva; sempre chi sta seduto; nei giorni di
     festa chi si saluta, si inchina, ride.
   - Negli orti, nei giorni di lavoro, chi zappa; nei borghi chi spacca legna.
   - Nei vicoli i panni stesi da una casa all'altra.
   - Sopra alcune porte le insegne di bottega: INVENZIONE DICHIARATA.
   - Sulle case delle famiglie della storia, il loro stemma (lacuna 82: da
     verificare, e non sappiamo se nel 1216 fosse già in uso).

   Livello: ipotesi, tutto. Dove stesse che cosa non lo dice nessuna fonte:
   la scelta è a caso, sempre la stessa (dal seme di ogni casa). Gli oggetti
   a terra fermano chi cammina. I gesti vengono da attori di oggi.
   ===================================================================== */

// quanto spazio prende a terra ogni oggetto (raggio, metri)
const INGOMBRO = { botte: 0.4, cassa: 0.45, sacchi: 0.5, ceste: 0.35, catasta: 0.75, panca: 0.55, carretto: 0.6, carro: 1.2, paglia: 0.7, tino: 0.6 };
const SAGOME = ['forbici', 'scarpa', 'pane', 'botte', 'pesce', 'chiave'];
const FAMIGLIE = { amidei: 'amidei', 'case-buondelmonti': 'buondelmonti', 'case-uberti': 'uberti', 'case-donati': 'donati', 'case-lamberti': 'lamberti', 'torre-fifanti': 'fifanti' };

/**
 * Dove sta che cosa. Pura (non disegna e non tocca la pianta del suolo): la usano la città e la verifica.
 * Rende { arredo: [{ nome, x, z, y, dir, scala }], gente: [{ x, z, dir, clip, ruoli, attrezzo, quando }] }
 * «quando»: 'lavoro', 'festa' o 'sempre'.
 */
export function vitaDiStrada({ lotti, borghi = [], strade, griglia, campi = [], luoghi = [] }) {
  const arredo = [], gente = [];
  const aperta = (x, z) => { const v = griglia.get(x, z); return v === STRADA || v === PIAZZA; };
  for (const [L, borgo] of [...lotti.map(l => [l, false]), ...borghi.map(l => [l, true])]) {
    if (L.retro) continue;
    const R = rng(L.seme * 13 + 1), r = R();
    const tx = L.nz, tz = -L.nx, ox = -L.nx, oz = -L.nz;                 // lungo la facciata; in fuori
    const fx = L.px + tx * L.W / 2, fz = L.pz + tz * L.W / 2;             // il mezzo della facciata
    // serve una strada larga davanti: quattro metri sgombri
    let larga = true; for (let d = 0.5; d <= 4; d += 0.5) if (!aperta(fx + ox * d, fz + oz * d)) { larga = false; break; }
    if (!larga) continue;
    const lato = R.tra(-0.3, 0.3) * L.W, px = fx + tx * lato, pz = fz + tz * lato;
    const versoStrada = Math.atan2(ox, oz), lungo = Math.atan2(-tz, tx);
    const metti = (nome, d, extra = {}) => arredo.push({ nome, x: px + ox * d, z: pz + oz * d, y: quota(px + ox * d, pz + oz * d), dir: lungo + (extra.gira ?? R.tra(-0.15, 0.15)), scala: extra.scala || 1 });
    // soglie: circa due case su tre hanno qualcosa davanti (decisione del 17 novembre 2026: «più piena»)
    if (r < 0.13) metti('botte', 0.5, { scala: R.tra(0.85, 1.1) });
    else if (r < 0.23) metti(R.scegli(['cassa', 'sacchi', 'ceste', 'ceste']), 0.55);
    else if (r < 0.29) { metti('catasta', 0.55, { gira: 0 }); if (borgo && R.vero(0.5)) gente.push({ x: px + ox * 1.9, z: pz + oz * 1.9, dir: versoStrada + Math.PI, clip: 'spacca_legna', ruoli: ['popolano', 'contadino', 'artigiano'], attrezzo: 'scure', quando: 'lavoro' }); }
    else if (r < 0.37) {
      metti('panca', 0.45, { gira: 0 });
      if (R.vero(0.6)) gente.push({ x: px + ox * 0.5, z: pz + oz * 0.5, dir: versoStrada, clip: 'seduto', ruoli: ['vecchio', 'vecchia', 'popolana', 'popolano', 'mercante'], attrezzo: null, quando: 'sempre' });
    }
    else if (r < 0.41) metti('carretto', 0.8, { gira: R.scegli([0, Math.PI]) });
    else if (r < 0.56) {
      const [clip, attrezzo, ruoli] = R.scegli([['spazza', 'scopa', ['popolana', 'fantesca', 'ragazza']], ['spazza', 'scopa', ['popolana', 'fantesca', 'ragazzo']], ['sega', 'sega', ['artigiano']], ['martella', 'martello', ['artigiano']], ['solleva', null, ['popolano', 'artigiano']], ['raccoglie', null, ['popolana', 'ragazzo']]]);
      gente.push({ x: px + ox * 1.3, z: pz + oz * 1.3, dir: versoStrada + R.tra(-0.6, 0.6), verso: versoStrada, clip, ruoli, attrezzo, quando: 'lavoro' });
      if (R.vero(0.4)) metti(R.scegli(['botte', 'cassa', 'ceste', 'sacchi']), 0.5);
    }
    else if (r < 0.66) {
      // due che si incontrano, nei giorni di festa
      const a = R.scegli([['saluta', 'inchino'], ['stretta_di_mano', 'stretta_di_mano'], ['ride', 'parla'], ['discute', 'ascolta'], ['indica', 'ascolta']]);
      for (const [k, s] of [[0, -0.45], [1, 0.45]]) gente.push({ x: px + ox * 1.6 + tx * s, z: pz + oz * 1.6 + tz * s, dir: 0, guarda: [px + ox * 1.6 - tx * s, pz + oz * 1.6 - tz * s], verso: versoStrada, clip: a[k], ruoli: null, attrezzo: a[k] === 'discute' ? 'sgabello' : null, quando: 'festa' });
    }
    if (!borgo && R.vero(0.16)) arredo.push({ nome: 'insegna-' + R.scegli(SAGOME), x: fx + tx * R.tra(-0.2, 0.2) * L.W, z: fz + tz * R.tra(-0.2, 0.2) * L.W, y: quota(fx, fz) + 3.3, dir: versoStrada, scala: 1, appeso: true });
  }
  // i panni stesi nei vicoli: una corda ogni 22 m circa, a 5,5 m da terra, di traverso
  for (const s of strade) {
    if (s.area || !s.punti || (s.larghezza || 4) > 2.7 || s.fuori || s.fuoriVecchia) continue;
    const R = rng(Math.round(s.punti[0][0] * 7 + s.punti[0][1] * 13) + 5);
    for (let k = 0; k + 1 < s.punti.length; k++) {
      const [ax, az] = s.punti[k], [bx, bz] = s.punti[k + 1], l = Math.hypot(bx - ax, bz - az);
      for (let d = R.tra(6, 20); d < l - 3; d += R.tra(16, 28)) {
        const x = ax + (bx - ax) * d / l, z = az + (bz - az) * d / l;
        arredo.push({ nome: 'panni-stesi', x, z, y: quota(x, z) + R.tra(5, 6.2), dir: Math.atan2(-(bx - ax) / l, -(bz - az) / l), scala: Math.min(1.1, (s.larghezza + 1.2) / 4), appeso: true });
      }
    }
  }
  // negli orti, chi zappa
  for (const c of campi) {
    if (c.tipo !== 'orto' || (c.n % 5) !== 0) continue;
    const a = c.w * 0.5, b = (c.b0 + c.b1) / 2, x = c.ox + c.ux * a + c.vx * b, z = c.oz + c.uz * a + c.vz * b;
    gente.push({ x, z, dir: Math.atan2(c.ux, c.uz), clip: 'zappa', ruoli: ['contadino', 'contadina', 'popolano'], attrezzo: 'zappa', quando: 'lavoro' });
  }
  // gli stemmi sulle case delle famiglie: sulla facciata della casa più vicina al luogo
  const tutti = [...lotti, ...borghi];
  for (const l of luoghi) {
    const fam = FAMIGLIE[l.id]; if (!fam || !l.pos) continue;
    let best = null;
    for (const L of tutti) { const fx = L.px + L.nz * L.W / 2, fz = L.pz - L.nx * L.W / 2, d = Math.hypot(fx - l.pos[0], fz - l.pos[1]); if (!best || d < best[0]) best = [d, L, fx, fz]; }
    if (!best || best[0] > 45) continue;
    const [, L, fx, fz] = best;
    arredo.push({ nome: 'stemma-' + fam, x: fx - L.nx * 0.06, z: fz - L.nz * 0.06, y: quota(fx, fz) + 4.6, dir: Math.atan2(-L.nx, -L.nz), scala: 1.6, appeso: true });
  }
  return { arredo, gente };
}

/** Gli oggetti a terra fermano chi cammina. Rende quanti ne ha segnati. */
export function segnaArredo(griglia, vita) {
  let n = 0;
  for (const o of vita.arredo) {
    const r = INGOMBRO[o.nome]; if (!r || o.appeso) continue;
    griglia.rettangolo(o.x, o.z, 1, 0, r, r, (i, j) => { const k = j * griglia.n + i, v = griglia.c[k]; if (v === STRADA || v === PIAZZA || v === LIBERO) griglia.c[k] = RECINTO; });
    n++;
  }
  return n;
}

/* ------------------------------------------------------------ i modelli */
let MODELLI = null;       // { arredo: { nome: [{ geo, mat }] }, attrezzi: { nome: { geo, info } } }
export async function caricaVita() {
  const loader = new GLTFLoader();
  const [ia, it] = await Promise.all(['./vita/arredo/indice.json', './vita/attrezzi/indice.json'].map(u => fetch(u).then(r => r.json())));
  const colori = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const parti = async url => {
    const g = await loader.loadAsync(url); g.scene.updateMatrixWorld(true);
    const out = [];
    g.scene.traverse(o => { if (o.isMesh) { const geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); out.push({ geo, mat: o.material.map ? o.material : colori }); } });
    return out;
  };
  const arredo = {}, attrezzi = {};
  await Promise.all([
    ...Object.keys(ia).map(async n => { arredo[n] = await parti(`./vita/arredo/${n}.glb`); }),
    ...Object.entries(it).map(async ([n, info]) => { attrezzi[n] = { parti: await parti(`./vita/attrezzi/${n}.glb`), info }; })
  ]);
  MODELLI = { arredo, attrezzi };
  return MODELLI;
}

const SU = new Vector3(0, 1, 0);
export class Vita {
  constructor(scene, vita) {
    this.scene = scene; this.vita = vita; this.mesh = []; this.attrezzi = []; this.visibile = true;
    // l'arredo, per istanze: un InstancedMesh per modello e per parte
    const per = {};
    for (const o of vita.arredo) (per[o.nome] ||= []).push(o);
    const m = new Matrix4(), q = new Quaternion(), p = new Vector3(), s = new Vector3();
    for (const [nome, lista] of Object.entries(per)) for (const { geo, mat } of MODELLI.arredo[nome] || []) {
      const im = new InstancedMesh(geo, mat, lista.length);
      lista.forEach((o, k) => im.setMatrixAt(k, m.compose(p.set(o.x, o.y, o.z), q.setFromAxisAngle(SU, o.dir), s.setScalar(o.scala))));
      im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere();
      scene.add(im); this.mesh.push(im);
    }
    console.info(`vita di strada: ${vita.arredo.length} oggetti, ${vita.gente.length} persone con un gesto`);
  }

  /** Le persone con un gesto, per la giornata: da dare ad Abitanti come «fermi». */
  persone(festa) { return this.vita.gente.filter(g => g.quando === 'sempre' || g.quando === (festa ? 'festa' : 'lavoro')).map(g => ({ ...g, dir: g.guarda ? Math.atan2(g.guarda[0] - g.x, g.guarda[1] - g.z) : g.dir })); }

  /** Dopo che Abitanti ha creato le figure: a chi ha un attrezzo, lo mette in mano. */
  attacca(abitanti, festa) {
    for (const a of this.attrezzi) for (const o of a.oggetti) this.scene.remove(o);
    this.attrezzi = [];
    const persone = this.persone(festa).filter(g => g.attrezzo && MODELLI.attrezzi[g.attrezzo]);
    for (const g of persone) {
      const f = abitanti.figure.find(f => f.fermo && f.modello && Math.abs(f.x - g.x) < 0.01 && Math.abs(f.z - g.z) < 0.01);
      if (!f) continue;
      const ossa = {}; f.mesh.traverse(o => { if (o.isBone) ossa[o.name] = o; });
      const mod = MODELLI.attrezzi[g.attrezzo];
      const oggetti = mod.parti.map(({ geo, mat }) => { const o = new Mesh(geo, mat); o.castShadow = true; this.scene.add(o); return o; });
      this.attrezzi.push({ f, ossa, info: mod.info, oggetti, sedile: null });
    }
  }

  /** Una parte di chi cammina porta qualcosa: una cesta, un secchio, un sacco; chi va piano, il bastone (17 novembre 2026). */
  portano(abitanti) {
    const R = rng(77);
    for (const f of abitanti.figure) {
      if (f.fermo || !f.modello || !f.azione) continue;
      const lento = /lento|vecchio/.test(f.azione.getClip().name);
      const cosa = lento ? (R.vero(0.45) ? 'bastone' : null) : R.vero(0.28) ? R.scegli(['cesta', 'cesta', 'secchio', 'sacco']) : null;
      if (!cosa || !MODELLI.attrezzi[cosa]) continue;
      const ossa = {}; f.mesh.traverse(o => { if (o.isBone) ossa[o.name] = o; });
      const mod = MODELLI.attrezzi[cosa];
      const oggetti = mod.parti.map(({ geo, mat }) => { const o = new Mesh(geo, mat); o.castShadow = true; this.scene.add(o); return o; });
      this.attrezzi.push({ f, ossa, info: mod.info, oggetti, sedile: null });
    }
  }

  visibili(on) { this.visibile = on; for (const im of this.mesh) im.visible = on; for (const a of this.attrezzi) for (const o of a.oggetti) o.visible = on; }

  /** Ogni fotogramma: gli attrezzi seguono le mani (solo vicino a chi guarda). */
  aggiorna(cam) {
    if (!this.visibile) return;
    const D = new Vector3(), S = new Vector3(), petto = new Vector3(), p = new Vector3(), d = new Vector3(), q = new Quaternion(), t = new Vector3();
    for (const a of this.attrezzi) {
      const vicino = Math.hypot(a.f.x - cam.x, a.f.z - cam.z) < 55 && a.f.mesh.visible !== false;
      for (const o of a.oggetti) o.visible = vicino;
      if (!vicino || !a.ossa.RightHand || !a.ossa.LeftHand) continue;
      a.f.mesh.updateWorldMatrix(true, true);
      const palmo = (mano, dita, out) => { a.ossa[mano].getWorldPosition(out); if (a.ossa[dita]) out.lerp(a.ossa[dita].getWorldPosition(t), 0.7); return out; };
      palmo('RightHand', 'RightFingerBase', D); palmo('LeftHand', 'LeftFingerBase', S);
      const presa = a.info.presa; p.copy(D); d.copy(SU);
      if (presa === 'due mani') {
        d.copy(S).sub(D).normalize(); (a.ossa.Spine1 || a.ossa.Spine).getWorldPosition(petto);
        if (d.dot(t.copy(D).add(S).multiplyScalar(0.5).sub(petto)) < 0) d.negate();
        d.multiplyScalar(a.info.testa || 1);
      } else if (presa === 'impugnato') { d.setFromMatrixColumn(a.ossa.RightHand.matrixWorld, 0).normalize(); }
      else if (presa === 'palmo') p.copy(S).y += 0.03;
      else if (presa === 'appeso') p.copy(a.info.mano === 'sinistra' ? S : D).y -= 0.04;
      else if (presa === 'sedile') { if (!a.sedile) { a.ossa.Hips.getWorldPosition(t); a.sedile = new Vector3(t.x, t.y - 0.12, t.z); } p.copy(a.sedile); }
      q.setFromUnitVectors(SU, d);
      for (const o of a.oggetti) { o.position.copy(p); o.quaternion.copy(q); }
    }
  }
}
