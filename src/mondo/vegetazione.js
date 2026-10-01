import {
  Color, CylinderGeometry, IcosahedronGeometry, InstancedMesh, LatheGeometry, Matrix4, MeshStandardMaterial, Quaternion, Vector2, Vector3
} from 'three';
import { dentroCerchia } from './fondale.js';
import { distanzaFiume, quota } from './terreno.js';
import { rng } from './rumore.js';

/* =====================================================================
   LA CAMPAGNA INTORNO

   Fuori dalle mura, sui colli d'Oltrarno e verso San Miniato: ulivi,
   qualche cipresso, campi. È un paesaggio dedotto da quello toscano dei
   secoli successivi (livello: ipotesi): per il 1216 la distribuzione
   delle colture va verificata [da verificare: studi sul contado
   fiorentino, per esempio Ch. M. de La Roncière].
   ===================================================================== */

export function creaVegetazione(scene, opz = {}) {
  const R = rng(1209);
  const ulivi = [], cipressi = [];
  const tenta = opz.tentativi || 14000;
  for (let i = 0; i < tenta; i++) {
    // solo sul terreno a maglia fine: altrove gli alberi galleggerebbero
    const x = R.tra(-785, 785), z = R.tra(-785, 785);
    if (dentroCerchia(x, z) || distanzaFiume(x, z) < 10) continue;
    const y = quota(x, z);
    // gli ulivi stanno sui colli; la piana resta a campi e orti
    const colle = y > 4;
    if (!colle && !R.vero(0.08)) continue;
    // a filari e a macchie: un rumore grossolano decide dove c'è l'oliveto
    if (Math.sin(x * 0.011 + Math.sin(z * 0.007) * 2) * Math.cos(z * 0.013) < -0.15) continue;
    if (R.vero(0.07)) cipressi.push([x, y, z]); else ulivi.push([x, y, z]);
  }

  const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), up = new Vector3(0, 1, 0);
  const c = new Color();

  // ulivi: chioma grigioverde su un tronco corto e storto
  const chioma = new IcosahedronGeometry(1, 1);
  const tronco = new CylinderGeometry(0.14, 0.22, 1, 6); tronco.translate(0, 0.5, 0);
  const matC = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true });
  const matT = new MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1, metalness: 0 });
  const iC = new InstancedMesh(chioma, matC, ulivi.length), iT = new InstancedMesh(tronco, matT, ulivi.length);
  ulivi.forEach(([x, y, z], k) => {
    const r = R.tra(1.5, 2.6), h = R.tra(1.2, 1.9);
    q.setFromAxisAngle(up, R.tra(0, 6.28));
    m.compose(p.set(x, y + h + r * 0.55, z), q, s.set(r, r * R.tra(0.62, 0.8), r)); iC.setMatrixAt(k, m);
    m.compose(p.set(x, y - 0.2, z), q, s.set(1, h + 0.6, 1)); iT.setMatrixAt(k, m);
    iC.setColorAt(k, c.setRGB(0.2 + R() * 0.05, 0.24 + R() * 0.05, 0.16 + R() * 0.03));
  });

  // cipressi: fusi scuri e alti
  const profilo = [[0, 0], [0.5, 0.02], [0.82, 0.18], [0.9, 0.34], [0.8, 0.55], [0.56, 0.75], [0.3, 0.9], [0.06, 0.99], [0, 1]]
    .map(([r, y]) => new Vector2(r, y));
  const fuso = new LatheGeometry(profilo, 8);
  const matF = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true });
  const iF = new InstancedMesh(fuso, matF, cipressi.length);
  cipressi.forEach(([x, y, z], k) => {
    const h = R.tra(9, 17), r = h * R.tra(0.075, 0.1);
    m.compose(p.set(x, y - 0.3, z), q.setFromAxisAngle(up, R() * 6.28), s.set(r, h, r)); iF.setMatrixAt(k, m);
    iF.setColorAt(k, c.setRGB(0.09 + R() * 0.03, 0.14 + R() * 0.03, 0.08 + R() * 0.02));
  });

  for (const im of [iC, iT, iF]) { im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); }
  return { ulivi: ulivi.length, cipressi: cipressi.length };
}

