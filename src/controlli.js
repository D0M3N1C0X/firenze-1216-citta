import { Vector3 } from 'three';

/* =====================================================================
   COMANDI

   A piedi: WASD o frecce, mouse per guardare (clic per agganciarlo),
   Maiusc per camminare svelti. In volo (F): stessi tasti, più Spazio e
   C per salire e scendere. Su tablet: la metà sinistra dello schermo è
   il passo, la destra lo sguardo.

   L'occhio è a 1,60 m: l'altezza media di un adulto del Duecento era
   di poco inferiore a quella di oggi [da verificare: dati
   antropometrici medievali toscani].
   ===================================================================== */

const OCCHIO = 1.6;

export class Controlli {
  constructor(camera, dom, griglia, quotaIn) {
    this.camera = camera; this.dom = dom; this.griglia = griglia; this.quotaIn = quotaIn;
    this.pos = new Vector3(); this.yaw = 0; this.pitch = 0;
    this.volo = false; this.tasti = new Set(); this.attivo = false;
    this.yLiscia = null; this.passo = 0;
    this.tocco = { muovi: null, guarda: null, dx: 0, dz: 0 };

    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      this.tasti.add(e.code);
    });
    addEventListener('keyup', e => this.tasti.delete(e.code));
    addEventListener('blur', () => this.tasti.clear());

    dom.addEventListener('click', () => { if (this.attivo && !matchMedia('(pointer: coarse)').matches) dom.requestPointerLock?.(); });
    addEventListener('mousemove', e => {
      if (document.pointerLockElement !== dom) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * 0.0022));
    });

    // tocco: sinistra cammina, destra guarda
    dom.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const lato = t.clientX < innerWidth / 2 ? 'muovi' : 'guarda';
        if (!this.tocco[lato]) this.tocco[lato] = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY };
      }
      e.preventDefault();
    }, { passive: false });
    dom.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) for (const lato of ['muovi', 'guarda']) {
        const s = this.tocco[lato];
        if (s && s.id === t.identifier) {
          if (lato === 'guarda') {
            this.yaw -= (t.clientX - s.x) * 0.005;
            this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - (t.clientY - s.y) * 0.005));
          }
          s.x = t.clientX; s.y = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });
    const fine = e => { for (const t of e.changedTouches) for (const lato of ['muovi', 'guarda']) if (this.tocco[lato]?.id === t.identifier) this.tocco[lato] = null; };
    dom.addEventListener('touchend', fine);
    dom.addEventListener('touchcancel', fine);
  }

  colloca(x, z, yaw = 0, pitch = 0) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.yLiscia = null;
    if (this.volo) this.pos.y = Math.max(this.pos.y, 60);
  }

  impostaVolo(on) {
    this.volo = on;
    if (on) this.pos.y = Math.max(this.camera.position.y + 25, 45);
    else this.yLiscia = null;
  }

  aggiorna(dt) {
    const k = this.tasti;
    let av = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let la = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (k.has('KeyQ')) this.yaw += dt * 1.6;
    if (k.has('KeyE')) this.yaw -= dt * 1.6;
    const m = this.tocco.muovi;
    if (m) {
      const dx = (m.x - m.x0) / 60, dy = (m.y - m.y0) / 60;
      la += Math.max(-1, Math.min(1, dx)); av += Math.max(-1, Math.min(1, -dy));
    }
    const svelto = k.has('ShiftLeft') || k.has('ShiftRight');
    const v = this.volo ? (svelto ? 70 : 22) : (svelto ? 4.2 : 1.9);
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    let mx = (fx * av + rx * la), mz = (fz * av + rz * la);
    const l = Math.hypot(mx, mz);
    if (l > 1) { mx /= l; mz /= l; }
    mx *= v * dt; mz *= v * dt;

    if (this.volo) {
      this.pos.x += mx; this.pos.z += mz;
      this.pos.y += ((k.has('Space') ? 1 : 0) - (k.has('KeyC') ? 1 : 0)) * v * dt;
      this.pos.y = Math.max(this.pos.y, this.quotaIn(this.pos.x, this.pos.z) + 3);
      this.camera.position.copy(this.pos);
    } else {
      // scorre lungo i muri: prova il passo intero, poi un asse alla volta
      const g = this.griglia, p = this.pos;
      if (g.percorribile(p.x + mx, p.z + mz)) { p.x += mx; p.z += mz; }
      else if (g.percorribile(p.x + mx, p.z)) p.x += mx;
      else if (g.percorribile(p.x, p.z + mz)) p.z += mz;
      const mosso = Math.hypot(mx, mz);
      this.passo += mosso * 2.1;
      const y = this.quotaIn(p.x, p.z) + OCCHIO;
      this.yLiscia = this.yLiscia === null ? y : this.yLiscia + (y - this.yLiscia) * Math.min(1, dt * 10);
      const ondeggio = Math.sin(this.passo) * 0.025 * Math.min(1, mosso / (dt * 1.5 + 1e-6));
      this.camera.position.set(p.x, this.yLiscia + ondeggio, p.z);
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
