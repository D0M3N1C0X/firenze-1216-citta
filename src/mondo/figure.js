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
      // pelle e capelli: la tinta la decide lo script delle figure, una per
      // variante (la pelle MakeHuman «chiara» da sola risulterebbe pallida)
      if (m.name === 'pelle') m.color.setRGB(...(info.pelle || [0.9, 0.76, 0.66]));
      if (/bob|short|braid|ponytail|long|eyebrow/i.test(m.name) && info.colore_capelli)
        m.color.setRGB(...info.colore_capelli.map(c => Math.min(1, c * 2.4)));
    });
    const k = altezzaAnche(gltf.scene) / anche0;
    const clip = {};
    for (const c of mov.animations) {
      // dei movimenti si tengono le rotazioni di tutte le ossa e la sola
      // posizione delle anche. Le clip portano anche posizione e scala di
      // ogni osso, ma sono quelle dello scheletro di riferimento, un adulto:
      // applicate a un ragazzo gli davano proporzioni e statura da adulto
      // (1,65 m invece di 1,45). Le anche: la traslazione registrata vale per
      // lo scheletro di riferimento; su una persona più bassa o più alta va
      // riscalata.
      const copia = c.clone();
      copia.tracks = copia.tracks.filter(t => t.name.endsWith('.quaternion') || t.name === 'Hips.position');
      for (const t of copia.tracks) if (t.name === 'Hips.position') for (let i = 0; i < t.values.length; i++) t.values[i] *= k;
      clip[c.name] = copia;
    }
    return { info, scene: gltf.scene, clip, scala: k };
  }));
  return { varianti, infoMov };
}

/**
 * Cavalli, muli e asini (strumenti/animali/animali.py): un file per animale,
 * con le andature dentro (fermo, passo, trotto, e il galoppo per il cavallo)
 * e in animali.json la velocità di ognuna.
 */
export async function caricaAnimali() {
  const info = await fetch('./animali/animali.json').then(r => r.json());
  const loader = new GLTFLoader();
  const out = {};
  await Promise.all(Object.keys(info).map(async nome => {
    const gltf = await loader.loadAsync(`./animali/${nome}.glb`);
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      // criniera e coda: ritaglio netto, come i capelli delle figure
      if (m.transparent || m.alphaTest > 0) { m.transparent = false; m.depthWrite = true; m.alphaTest = 0.5; }
    });
    out[nome] = { nome, scene: gltf.scene, clip: Object.fromEntries(gltf.animations.map(a => [a.name, a])), info: info[nome] };
  }));
  return out;
}

function altezzaAnche(radice) {
  let y = 0.874;
  radice.traverse(o => { if (o.name === 'Hips') y = o.position.y; });
  return y;
}
