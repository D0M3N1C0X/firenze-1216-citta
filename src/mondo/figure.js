import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* =====================================================================
   LE FIGURE PRODOTTE IN BLENDER

   Corpi MakeHuman (MPFB, CC0) vestiti alla fiorentina e movimenti del
   database CMU, preparati dagli script in strumenti/figure/. Qui si
   caricano: 20 varianti (public/figure/figura-NN.glb) e un solo file di
   movimenti (movimenti.glb) che vale per tutte, perché lo scheletro è lo
   stesso. Cambia solo l'altezza delle anche, che si riscala per ognuna.
   ===================================================================== */

export async function caricaFigure(avanzamento = () => {}) {
  const loader = new GLTFLoader();
  const [elenco, infoMov, mov] = await Promise.all([
    fetch('./figure/figure.json').then(r => r.json()),
    fetch('./figure/movimenti.json').then(r => r.json()),
    loader.loadAsync('./figure/movimenti.glb')
  ]);
  const anche0 = altezzaAnche(mov.scene);
  let fatti = 0;
  const varianti = await Promise.all(elenco.map(async info => {
    const gltf = await loader.loadAsync('./figure/' + info.file);
    avanzamento(++fatti, elenco.length);
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      // capelli e sopracciglia: ritaglio netto invece della trasparenza,
      // che con centinaia di figure darebbe errori di ordinamento
      if (m.transparent) { m.transparent = false; m.depthWrite = true; m.alphaTest = /low-poly/.test(m.name) ? 0 : 0.5; }
      // la pelle MakeHuman «chiara» sotto il sole di aprile risulta pallida:
      // la si scalda e la si scurisce un poco (scelta di resa, non un dato)
      if (m.name === 'pelle') m.color.setRGB(0.9, 0.76, 0.66);
    });
    const k = altezzaAnche(gltf.scene) / anche0;
    const clip = {};
    for (const c of mov.animations) {
      // le anche: la traslazione registrata vale per lo scheletro di
      // riferimento; su una persona più bassa o più alta va riscalata
      const copia = c.clone();
      for (const t of copia.tracks) if (t.name === 'Hips.position') for (let i = 0; i < t.values.length; i++) t.values[i] *= k;
      clip[c.name] = copia;
    }
    return { info, scene: gltf.scene, clip, scala: k };
  }));
  return { varianti, infoMov };
}

function altezzaAnche(radice) {
  let y = 0.874;
  radice.traverse(o => { if (o.name === 'Hips') y = o.position.y; });
  return y;
}
