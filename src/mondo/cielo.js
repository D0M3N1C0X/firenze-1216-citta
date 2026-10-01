import {
  Color, DirectionalLight, FogExp2, HemisphereLight, PMREMGenerator, Scene, Vector3
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
   dicono solo «la mattina di Pasqua».
   ===================================================================== */

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
    scene.add(this.sole, this.sole.target);

    // un filo di luce dal basso: il riflesso del suolo e dei muri chiari
    this.rimbalzo = new HemisphereLight(0x9fb2c8, 0x6b5a45, 0.25);
    scene.add(this.rimbalzo);

    scene.fog = new FogExp2(0xc8c6bc, 0.0016);
    this.dir = new Vector3();
    this.ora = -1;
    // equilibrio tra sole diretto e luce del cielo: il cielo di Preetham è
    // molto luminoso, e a forza piena cancellerebbe le ombre
    this.forzaSole = 4.2;
    this.forzaCielo = 0.28;
  }

  /** Imposta l'ora solare vera e aggiorna cielo, sole, ambiente e foschia. */
  imposta(ora) {
    this.ora = ora;
    direzioneSole(ora, this.dir);
    const { el } = posizioneSole(ora);
    const p = this.dir.clone().multiplyScalar(1000);
    this.sky.material.uniforms.sunPosition.value.copy(p);
    this.envSky.material.uniforms.sunPosition.value.copy(p);

    // colore e forza del sole: più caldo e debole quando è basso
    const alto = smooth(0, 0.6, el);
    const col = new Color().setRGB(1, lerp(0.62, 0.95, alto), lerp(0.38, 0.88, alto));
    this.sole.color.copy(col);
    this.sole.intensity = lerp(0.5, this.forzaSole, smooth(-0.02, 0.35, el));

    // la foschia si scalda all'alba e si dirada salendo
    const nebbia = this.scene.fog;
    nebbia.color.setRGB(lerp(0.80, 0.78, alto), lerp(0.74, 0.79, alto), lerp(0.66, 0.80, alto));
    nebbia.density = lerp(0.0021, 0.0009, alto);

    if (this.envRT) this.envRT.dispose();
    this.envRT = this.pmrem.fromScene(this.envScene, 0.02);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = lerp(0.6, 1, alto) * this.forzaCielo;
    this.rimbalzo.intensity = lerp(0.12, 0.3, alto);
  }

  /** L'ombra segue chi guarda, agganciata alla griglia dei texel per non tremolare. */
  segui(pos) {
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

