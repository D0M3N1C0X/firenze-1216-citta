import { Mesh, MeshBasicMaterial, Raycaster, RingGeometry, Vector2, Vector3 } from 'three';
import { trovaCammino } from './mondo/cammino.js';

/* =====================================================================
   COMANDI

   Pensati per chiunque, anche senza tastiera:
   - tocca o clicca un punto della strada e ci vai a piedi, girando gli
     angoli (mondo/cammino.js); dall'alto, ci voli sopra;
   - trascina (dito o mouse) per guardarti intorno, come in una foto a
     360 gradi: si «prende» la scena e la si sposta;
   - con la tastiera: WASD o frecce, Maiusc per andare svelti, Q ed E per
     girarsi; in volo Spazio e C per salire e scendere.

   L'occhio è a 1,60 m: l'altezza media di un adulto del Duecento era
   di poco inferiore a quella di oggi [da verificare: dati
   antropometrici medievali toscani].
   ===================================================================== */

const OCCHIO = 1.6;
const PASSO_TOCCO = 2.3;          // m/s quando si cammina da soli verso un punto toccato

export class Controlli {
  /**
   * @param {object} opz { scene: per il segno dove si va, avviso(testo), gesto(): il primo gesto dell'utente }
   */
  constructor(camera, dom, griglia, quotaIn, opz = {}) {
    this.camera = camera; this.dom = dom; this.griglia = griglia; this.quotaIn = quotaIn; this.opz = opz;
    this.pos = new Vector3(); this.yaw = 0; this.pitch = 0;
    this.volo = false; this.tasti = new Set(); this.attivo = false;
    this.yLiscia = null; this.passo = 0;
    this.movimentoRidotto = false;
    this.percorso = null;          // i punti verso cui si cammina da soli
    this.voloVerso = null;         // in volo: il punto sopra cui si va
    this.punt = new Map();         // dita e mouse premuti
    this.raggio = new Raycaster();

    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      this.tasti.add(e.code);
      if (/^(Key[WASDQE]|Arrow)/.test(e.code)) { this.ferma(); this.opz.gesto?.(); }
    });
    addEventListener('keyup', e => this.tasti.delete(e.code));
    addEventListener('blur', () => this.tasti.clear());

    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', e => {
      if (!this.attivo || (e.pointerType === 'mouse' && e.button !== 0)) return;
      // alcuni browser rifiutano la cattura: il tocco deve funzionare lo stesso
      try { dom.setPointerCapture?.(e.pointerId); } catch (err) { /* si va avanti senza */ }
      this.punt.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), mosso: false, tipo: e.pointerType });
    });
    dom.addEventListener('pointermove', e => {
      const s = this.punt.get(e.pointerId);
      if (!s) return;
      if (!s.mosso && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > 6) { s.mosso = true; dom.style.cursor = 'grabbing'; this.opz.gesto?.(); }
      if (s.mosso && this.punt.size === 1) {
        this.giraAuto = false;     // chi si gira da sé non va rigirato verso la strada
        const k = s.tipo === 'mouse' ? 0.0042 : 0.0055;
        this.yaw += (e.clientX - s.x) * k;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + (e.clientY - s.y) * k));
      }
      s.x = e.clientX; s.y = e.clientY;
    });
    const su = e => {
      const s = this.punt.get(e.pointerId);
      if (!s) return;
      this.punt.delete(e.pointerId);
      dom.style.cursor = 'grab';
      if (e.type === 'pointerup' && !s.mosso && performance.now() - s.t < 650) { this.tocca(e.clientX, e.clientY); this.opz.gesto?.(); }
    };
    dom.addEventListener('pointerup', su);
    dom.addEventListener('pointercancel', su);
    dom.addEventListener('contextmenu', e => e.preventDefault());

    // il segno dove si va: un anello sulla strada
    if (opz.scene) {
      const g = new RingGeometry(0.3, 0.46, 40); g.rotateX(-Math.PI / 2);
      this.segno = new Mesh(g, new MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.95, depthWrite: false }));
      this.segno.renderOrder = 10; this.segno.visible = false;
      opz.scene.add(this.segno);
    }
  }

  colloca(x, z, yaw = 0, pitch = 0) {
    this.ferma();
    this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.yLiscia = null;
    if (this.volo) this.pos.y = Math.max(this.pos.y, 60);
  }

  impostaVolo(on) {
    this.ferma();
    this.volo = on;
    if (on) this.pos.y = Math.max(this.camera.position.y + 25, 45);
    else this.yLiscia = null;
  }

  /** Smette di andare da solo verso un punto. */
  ferma() {
    this.percorso = null; this.voloVerso = null;
    if (this.segno) this.segno.visible = false;
  }

  /** Il punto della città sotto il dito: il suolo, o il piede del muro che si tocca. */
  puntoSotto(cx, cy) {
    const r = this.dom.getBoundingClientRect();
    this.raggio.setFromCamera(new Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera);
    const o = this.raggio.ray.origin, d = this.raggio.ray.direction;
    let ultimo = null;
    const fino = this.volo ? 2500 : 450;
    for (let t = 0.4; t < fino; t += t < 60 ? 0.25 : t < 300 ? 0.75 : 2.5) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const suolo = this.quotaIn(x, z), passa = this.griglia.percorribile(x, z, 0.05);
      if (y <= suolo + 0.05) return passa || this.volo ? [x, z] : ultimo;
      // un muro, una casa, il fiume: a piedi ci si ferma davanti; in volo ci si va sopra
      if (!passa && y < suolo + 16) return this.volo ? [x, z] : ultimo;
      if (passa) ultimo = [x, z];
    }
    return null;
  }

  tocca(cx, cy) {
    const p = this.puntoSotto(cx, cy);
    if (!p) { this.opz.avviso?.('Lì non c\'è una strada: tocca un punto della strada, o la facciata di una casa per andarci davanti.'); return; }
    if (this.volo) { this.voloVerso = p; this.mostraSegno(p); return; }
    this.giraAuto = true;
    const c = trovaCammino(this.griglia, [this.pos.x, this.pos.z], p);
    if (!c) {
      const lontano = Math.hypot(p[0] - this.pos.x, p[1] - this.pos.z) > 250;
      this.opz.avviso?.(lontano ? 'È lontano: per arrivarci prima usa «Vai a…» o «Dall\'alto».'
        : 'Da qui a piedi non ci si arriva: forse è dietro un muro o dall\'altra parte del fiume.');
      return;
    }
    this.percorso = c.slice(1);
    this.mostraSegno(c.at(-1));
  }

  mostraSegno(p) {
    if (!this.segno) return;
    this.segno.position.set(p[0], this.quotaIn(p[0], p[1]) + 0.06, p[1]);
    this.segno.visible = true;
  }

  /**
   * dt: il passo del fotogramma, limitato (con la tastiera si urtano i muri);
   * vero: il tempo vero trascorso, perché su un computer lento si cammini
   * comunque alla velocità giusta lungo un percorso già controllato.
   */
  aggiorna(dt, vero = dt) {
    const k = this.tasti;
    let av = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let la = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (k.has('KeyQ')) this.yaw += dt * 1.6;
    if (k.has('KeyE')) this.yaw -= dt * 1.6;
    const svelto = k.has('ShiftLeft') || k.has('ShiftRight');
    const v = this.volo ? (svelto ? 70 : 22) : (svelto ? 4.2 : 1.9);
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    let mx = (fx * av + rx * la), mz = (fz * av + rz * la);
    const l = Math.hypot(mx, mz);
    if (l > 1) { mx /= l; mz /= l; }
    const dtTasti = Math.min(vero, 0.1);
    mx *= v * dtTasti; mz *= v * dtTasti;
    const trascina = [...this.punt.values()].some(s => s.mosso);

    // da soli verso il punto toccato: lo sguardo si gira piano verso dove si va
    const gira = (dx, dz) => {
      if (trascina || !this.giraAuto) return;
      let d = Math.atan2(-dx, -dz) - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, vero * 3);
    };

    if (this.volo) {
      if (this.voloVerso) {
        const dx = this.voloVerso[0] - this.pos.x, dz = this.voloVerso[1] - this.pos.z, dist = Math.hypot(dx, dz);
        const s = Math.min(dist, Math.max(15, dist * 1.4) * Math.min(vero, 0.5));
        if (dist < 1) this.ferma(); else { this.pos.x += dx / dist * s; this.pos.z += dz / dist * s; }
      }
      this.pos.x += mx; this.pos.z += mz;
      this.pos.y += ((k.has('Space') ? 1 : 0) - (k.has('KeyC') ? 1 : 0)) * v * dtTasti;
      this.pos.y = Math.max(this.pos.y, this.quotaIn(this.pos.x, this.pos.z) + 3);
      this.camera.position.copy(this.pos);
    } else {
      const g = this.griglia, p = this.pos;
      let mosso = 0;
      if (this.percorso) {
        // lungo un percorso già controllato si può avanzare anche di mezzo secondo per fotogramma
        let resto = (svelto ? 4.2 : PASSO_TOCCO) * Math.min(vero, 0.5);
        while (resto > 0 && this.percorso.length) {
          const [tx, tz] = this.percorso[0], dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
          if (dist <= resto) { p.x = tx; p.z = tz; resto -= dist; mosso += dist; this.percorso.shift(); }
          else { p.x += dx / dist * resto; p.z += dz / dist * resto; mosso += resto; gira(dx, dz); resto = 0; }
        }
        if (!this.percorso.length) this.ferma();
      } else {
        // scorre lungo i muri: prova il passo intero, poi un asse alla volta
        if (g.percorribile(p.x + mx, p.z + mz)) { p.x += mx; p.z += mz; }
        else if (g.percorribile(p.x + mx, p.z)) p.x += mx;
        else if (g.percorribile(p.x, p.z + mz)) p.z += mz;
        mosso = Math.hypot(mx, mz);
      }
      this.passo += mosso * 2.1;
      const y = this.quotaIn(p.x, p.z) + OCCHIO;
      this.yLiscia = this.yLiscia === null ? y : this.yLiscia + (y - this.yLiscia) * Math.min(1, vero * 10);
      const ondeggio = this.movimentoRidotto ? 0 : Math.sin(this.passo) * 0.025 * Math.min(1, mosso / (vero * 1.5 + 1e-6));
      this.camera.position.set(p.x, this.yLiscia + ondeggio, p.z);
    }
    if (this.segno?.visible) {
      const s = 1 + 0.12 * Math.sin(performance.now() / 180);
      this.segno.scale.set(s, 1, s);
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
