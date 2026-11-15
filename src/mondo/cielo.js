import {
  Color, DirectionalLight, DoubleSide, FogExp2, HemisphereLight, Mesh, PMREMGenerator, PlaneGeometry, Scene, ShaderMaterial, Vector3
} from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { direzioneSole, posizioneSole } from './sole.js';
import { lerp, smooth } from './rumore.js';

/* =====================================================================
   CIELO, LUCE E FOSCHIA

   Il cielo è il modello fisico di Preetham (Sky.js di three.js). Da lui
   si ricava anche la luce ambiente: la scena è illuminata dallo stesso
   cielo che si vede, ricalcolato quando cambia l'ora.

   La foschia del mattino sull'Arno è una scelta di atmosfera, non un
   dato: non sappiamo che tempo facesse il 10 aprile 1216. Le fonti
   dicono solo «la mattina di Pasqua». Il 10 febbraio la foschia è più
   densa (giornate.js): è la mattina d'inverno, non il meteo di quel giorno.

   Le nuvole (15 novembre 2026) sono un velo calcolato, a 1.500 m, che si
   muove piano e prende il colore del sole: più coperto d'inverno, più
   sereno a Pasqua e a maggio (giornate.js, «nuvole»). Anche queste sono
   una scelta d'atmosfera. Si spengono con la qualità media, per i
   dispositivi lenti.
   ===================================================================== */

/*
 * L'ombra delle nuvole (15 novembre 2026): zone di luce e d'ombra che scorrono piano su tetti, muri
 * e campi. La calcolano il terreno e i materiali invecchiati (materiali.js) con una versione più
 * semplice della forma delle nuvole; non segue la direzione del sole. Con la qualità media è spenta.
 */
export const NUVOLE_U = { tempo: { value: 0 }, copertura: { value: 0.35 }, forza: { value: 0.3 } };
export const GLSL_OMBRA_NUVOLE = `
uniform float nTempo, nCopertura, nForza;
float nH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(nH(i), nH(i + vec2(1, 0)), f.x), mix(nH(i + vec2(0, 1)), nH(i + vec2(1, 1)), f.x), f.y); }
float ombraNuvole(vec2 xz) {
  vec2 q = xz / 2600.0 + vec2(nTempo * 0.004, nTempo * 0.0015);
  float d = nN(q) * 0.62 + nN(q * 2.03 + 17.0) * 0.38, s = 0.74 - nCopertura * 0.55;
  return 1.0 - nForza * smoothstep(s - 0.08, s + 0.12, d);
}`;
export function uniformiNuvole(sh) { sh.uniforms.nTempo = NUVOLE_U.tempo; sh.uniforms.nCopertura = NUVOLE_U.copertura; sh.uniforms.nForza = NUVOLE_U.forza; }

export class Cielo {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;

    this.sky = new Sky();
    this.sky.scale.setScalar(30000);
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    this.envScene = new Scene();
    this.envSky = new Sky();
    this.envSky.scale.setScalar(1000);
    this.envScene.add(this.envSky);
    this.pmrem = new PMREMGenerator(renderer);
    this.envRT = null;

    for (const s of [this.sky, this.envSky]) {
      const u = s.material.uniforms;
      u.turbidity.value = 4.2;
      u.rayleigh.value = 1.25;
      u.mieCoefficient.value = 0.0055;
      u.mieDirectionalG.value = 0.84;
    }

    this.sole = new DirectionalLight(0xffffff, 3);
    this.sole.castShadow = true;
    this.sole.shadow.mapSize.set(4096, 4096);
    const c = this.sole.shadow.camera;
    c.left = -120; c.right = 120; c.top = 120; c.bottom = -120; c.near = 1; c.far = 900;
    this.sole.shadow.bias = -0.0002;
    this.sole.shadow.normalBias = 0.035;
    this.sole.shadow.radius = 3;          // bordi delle ombre più morbidi (con PCFShadowMap, main.js)
    scene.add(this.sole, this.sole.target);

    // un filo di luce dal basso: il riflesso del suolo e dei muri chiari
    this.rimbalzo = new HemisphereLight(0x9fb2c8, 0x6b5a45, 0.25);
    scene.add(this.rimbalzo);

    this.nuvole = new Mesh(new PlaneGeometry(46000, 46000), new ShaderMaterial({
      transparent: true, depthWrite: false, side: DoubleSide, fog: false,
      uniforms: { tempo: NUVOLE_U.tempo, copertura: NUVOLE_U.copertura, luce: { value: new Color(1, 1, 1) }, ombra: { value: new Color(0.55, 0.6, 0.68) }, centro: { value: new Vector3() } },
      vertexShader: `varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
        uniform float tempo, copertura; uniform vec3 luce, ombra, centro; varying vec3 vP;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
        void main() {
          vec2 q = vP.xz / 2600.0 + vec2(tempo * 0.004, tempo * 0.0015);
          float d = fbm(q) * 0.75 + fbm(q * 2.7 - tempo * 0.002) * 0.25;
          float soglia = 0.74 - copertura * 0.55;
          float a = smoothstep(soglia, soglia + 0.16, d);
          // il cuore della nuvola è più in ombra dei bordi; verso l'orizzonte svanisce nella foschia
          vec3 c = mix(luce, ombra, smoothstep(soglia + 0.1, soglia + 0.38, d) * 0.75);
          float lontano = 1.0 - smoothstep(9000.0, 22000.0, length(vP.xz - centro.xz));
          gl_FragColor = vec4(c, a * 0.9 * lontano);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
    this.nuvole.rotation.x = -Math.PI / 2; this.nuvole.position.y = 1500; this.nuvole.frustumCulled = false; this.nuvole.renderOrder = -1;
    scene.add(this.nuvole);

    scene.fog = new FogExp2(0xc8c6bc, 0.0016);
    this.dir = new Vector3();
    this.ora = -1;
    this.doy = 108;             // Pasqua, finché una giornata non dice altro
    this.foschia = 1;
    // equilibrio tra sole diretto e luce del cielo: il cielo di Preetham è
    // molto luminoso, e a forza piena cancellerebbe le ombre
    this.forzaSole = 4.2;
    this.forzaCielo = 0.28;
  }

  /** Giorno dell'anno (gregoriano) e foschia della giornata; poi ricalcola l'ora corrente. */
  giornata(g) {
    this.doy = g.doy; this.foschia = g.foschia ?? 1;
    this.nuvole.material.uniforms.copertura.value = g.nuvole ?? 0.35;
    if (this.ora >= 0) this.imposta(this.ora);
  }

  /** Imposta l'ora solare vera e aggiorna cielo, sole, ambiente e foschia. */
  imposta(ora) {
    this.ora = ora;
    direzioneSole(ora, this.dir, this.doy);
    const { el } = posizioneSole(ora, this.doy);
    const p = this.dir.clone().multiplyScalar(1000);
    this.sky.material.uniforms.sunPosition.value.copy(p);
    this.envSky.material.uniforms.sunPosition.value.copy(p);

    // colore e forza del sole: più caldo e debole quando è basso
    const alto = smooth(0, 0.6, el);
    // la mattina la luce è più fredda e pallida, la sera più dorata (15 novembre 2026: più differenza tra le ore, ma credibile)
    const sera = ora > 12;
    const col = sera ? new Color().setRGB(1, lerp(0.56, 0.95, alto), lerp(0.28, 0.88, alto)) : new Color().setRGB(1, lerp(0.74, 0.95, alto), lerp(0.58, 0.88, alto));
    this.sole.color.copy(col);
    this.sole.intensity = lerp(0.5, this.forzaSole, smooth(-0.02, 0.35, el));
    // le nuvole prendono la luce del sole: bianche di giorno, calde al tramonto, grigio-azzurre in ombra
    const un = this.nuvole.material.uniforms;
    // (valori sopra 1: il cielo di Preetham è molto luminoso, e una nuvola al sole lo è di più)
    un.luce.value.setRGB(col.r, col.g, col.b).multiplyScalar(lerp(1.6, 2.6, alto));
    un.ombra.value.setRGB(lerp(0.5, 0.6, alto), lerp(0.48, 0.64, alto), lerp(0.52, 0.72, alto)).multiplyScalar(lerp(1.0, 1.5, alto));

    // la foschia si scalda all'alba e si dirada salendo
    const nebbia = this.scene.fog;
    // la foschia: grigio-azzurra e fitta la mattina, calda e più rada la sera, quasi niente a mezzogiorno
    if (sera) nebbia.color.setRGB(lerp(0.86, 0.78, alto), lerp(0.72, 0.79, alto), lerp(0.56, 0.80, alto));
    else nebbia.color.setRGB(lerp(0.76, 0.78, alto), lerp(0.77, 0.79, alto), lerp(0.79, 0.80, alto));
    nebbia.density = lerp(sera ? 0.0017 : 0.0025, 0.0008, alto) * this.foschia;

    if (this.envRT) this.envRT.dispose();
    this.envRT = this.pmrem.fromScene(this.envScene, 0.02);
    this.scene.environment = this.envRT.texture;
    // con il sole basso il cielo rischiara meno: le ombre lunghe restano scure; a mezzogiorno la luce è più piatta
    this.scene.environmentIntensity = lerp(0.5, 1.15, alto) * this.forzaCielo;
    this.rimbalzo.intensity = lerp(0.12, 0.3, alto);
  }

  /** Nuvole e loro ombra: solo con la qualità alta. */
  nuvoleAccese(on) { this.nuvole.visible = on; NUVOLE_U.forza.value = on ? 0.3 : 0; }

  /** Le nuvole si muovono piano. */
  passa(dt) { this.nuvole.material.uniforms.tempo.value += dt; }

  /** L'ombra segue chi guarda, agganciata alla griglia dei texel per non tremolare. */
  segui(pos) {
    this.nuvole.position.x = pos.x; this.nuvole.position.z = pos.z; this.nuvole.material.uniforms.centro.value.copy(pos);
    const cam = this.sole.shadow.camera;
    const passo = (cam.right - cam.left) / this.sole.shadow.mapSize.x;
    const t = this.sole.target.position;
    t.set(Math.round(pos.x / passo) * passo, 0, Math.round(pos.z / passo) * passo);
    this.sole.position.copy(t).addScaledVector(this.dir, 420);
    this.sole.target.updateMatrixWorld();
  }

  dimensioneOmbre(n, metri) {
    this.sole.shadow.mapSize.set(n, n);
    const c = this.sole.shadow.camera;
    c.left = -metri; c.right = metri; c.top = metri; c.bottom = -metri;
    c.updateProjectionMatrix();
    if (this.sole.shadow.map) { this.sole.shadow.map.dispose(); this.sole.shadow.map = null; }
  }
}

