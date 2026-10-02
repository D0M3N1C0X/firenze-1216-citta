/* =====================================================================
   I SUONI DELLA MATTINA DI PASQUA — tutti sintetizzati, nessun file.

   - le campane delle chiese vicine suonano a festa, ciascuna dalla sua
     posizione (le chiese e le loro torri campanarie del 1216 sono da
     verificare una per una: qui suonano le chiese che il modello contiene);
   - il fiume, più forte vicino all'acqua;
   - il brusio della gente, che cresce quando ci sono persone intorno;
   - le rondini, tornate da poco: a metà aprile è plausibile.
   Il 10 febbraio (dati/giornate.js) niente festa e niente rondini: solo
   qualche rintocco lento, come per le ore canoniche.
   I suoni sono un'ipotesi d'atmosfera, non una ricostruzione.
   ===================================================================== */

const CAMPANILI = [
  { nome: 'Santo Stefano al Ponte', x: 78, z: -46, nota: 620 },
  { nome: 'Santi Apostoli', x: -95, z: -112, nota: 540 },
  { nome: 'Santa Felicita', x: -58, z: 156, nota: 480 },
  { nome: 'Santa Reparata', x: 191, z: -562, nota: 330 },
  { nome: 'Santa Trinita', x: -211, z: -220, nota: 455 }
];
const FIUME = [[-20, 15], [-140, -55], [110, 50]];

export class Suoni {
  constructor() { this.ctx = null; this.attivo = false; this.muto = false; this.g = { campane: 'festa', rondini: true }; }

  /** Campane e rondini della giornata (giornate.js). */
  giornata(g) {
    this.g = g;
    if (this.ctx) { this.prossimaCampana = this.ctx.currentTime + 2; this.prossimaRondine = this.ctx.currentTime + 4; }
  }

  avvia() {
    if (this.ctx) return;
    try { this.ctx = new AudioContext(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.75; this.master.connect(c.destination);
    this.riverbero = this.creaRiverbero();
    this.riverbero.connect(this.master);
    this.rumore = this.bufferRumore(4);

    // fiume: rumore bruno filtrato, da tre punti lungo la riva
    for (const [x, z] of FIUME) {
      const src = c.createBufferSource(); src.buffer = this.rumore; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650;
      const g = c.createGain(); g.gain.value = 0.55;
      const p = this.pannello(x, -3, z, 18, 1.4);
      src.connect(f).connect(g).connect(p).connect(this.master);
      src.start(c.currentTime + Math.random());
    }
    // brusio: rumore in banda della voce, modulato lentamente
    const src = c.createBufferSource(); src.buffer = this.rumore; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.8;
    const bp2 = c.createBiquadFilter(); bp2.type = 'peaking'; bp2.frequency.value = 1300; bp2.gain.value = 5;
    this.brusio = c.createGain(); this.brusio.gain.value = 0;
    src.connect(bp).connect(bp2).connect(this.brusio).connect(this.master);
    src.start();

    this.prossimaCampana = c.currentTime + 1.5;
    this.prossimaRondine = c.currentTime + 4;
    this.attivo = true;
    addEventListener('keydown', e => { if (e.code === 'KeyM') this.muta(!this.muto); });
  }

  muta(on) { this.muto = on; if (this.master) this.master.gain.setTargetAtTime(on ? 0 : 0.75, this.ctx.currentTime, 0.1); }

  bufferRumore(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; ultimo = (ultimo + 0.02 * w) / 1.02; d[i] = ultimo * 3.5; }
    return b;
  }

  creaRiverbero() {
    // una coda breve, come tra muri di pietra in una strada stretta
    const c = this.ctx, n = c.sampleRate * 2.2, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * 0.35; }
    const conv = c.createConvolver(); conv.buffer = b;
    const g = c.createGain(); g.gain.value = 0.35;
    conv.connect(g);
    this.ingressoRiverbero = conv;
    return g;
  }

  pannello(x, y, z, rif = 20, roll = 1) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = rif; p.rolloffFactor = roll; p.maxDistance = 3000;
    p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z;
    return p;
  }

  /** Un colpo di campana: parziali della campana (hum, prima, terza minore, quinta, nominale). */
  colpo(t, f, pann, forza = 1) {
    const c = this.ctx;
    const parziali = [[0.5, 0.5, 4.5], [1, 0.8, 3.0], [1.19, 0.45, 2.2], [1.5, 0.35, 1.8], [2, 0.6, 1.6], [2.52, 0.25, 1.0], [3.01, 0.2, 0.8], [4.07, 0.12, 0.5]];
    const g = c.createGain(); g.gain.value = 0.11 * forza;
    g.connect(pann);
    for (const [r, a, dec] of parziali) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * r * (1 + (Math.random() - 0.5) * 0.004);
      const e = c.createGain();
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0008, t + dec);
      o.connect(e).connect(g); o.start(t); o.stop(t + dec + 0.05);
    }
    // il batacchio: un colpo metallico breve
    const n = c.createBufferSource(); n.buffer = this.rumore;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const e = c.createGain(); e.gain.setValueAtTime(0.25 * forza, t); e.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(hp).connect(e).connect(g); n.start(t, Math.random()); n.stop(t + 0.08);
  }

  /** Suonata a festa: due campane alternate, irregolari, per un po'. */
  suonata(campanile, t0) {
    if (!campanile.pann) { campanile.pann = this.pannello(campanile.x, 30, campanile.z, 35, 1.1); campanile.pann.connect(this.master); campanile.pann.connect(this.ingressoRiverbero); }
    let t = t0;
    const colpi = 10 + Math.floor(Math.random() * 18);
    for (let i = 0; i < colpi; i++) {
      const seconda = i % 2 === 1;
      this.colpo(t, campanile.nota * (seconda ? 0.84 : 1), campanile.pann, seconda ? 0.85 : 1);
      t += 0.55 + Math.random() * 0.35;
    }
    return t;
  }

  /** Rintocchi lenti di una campana sola, come per segnare un'ora. */
  rintocchi(campanile, t0) {
    if (!campanile.pann) { campanile.pann = this.pannello(campanile.x, 30, campanile.z, 35, 1.1); campanile.pann.connect(this.master); campanile.pann.connect(this.ingressoRiverbero); }
    let t = t0;
    const colpi = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < colpi; i++) { this.colpo(t, campanile.nota, campanile.pann, 0.9); t += 2.4 + Math.random() * 0.4; }
    return t;
  }

  rondine(t, x, y, z) {
    const c = this.ctx, p = this.pannello(x, y, z, 12, 1.3);
    p.connect(this.master);
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator(), e = c.createGain();
      const t1 = t + i * 0.09, f0 = 4200 + Math.random() * 1800;
      o.frequency.setValueAtTime(f0, t1); o.frequency.exponentialRampToValueAtTime(f0 * 1.45, t1 + 0.05);
      e.gain.setValueAtTime(0, t1); e.gain.linearRampToValueAtTime(0.05, t1 + 0.01); e.gain.exponentialRampToValueAtTime(0.0005, t1 + 0.07);
      o.connect(e).connect(p); o.start(t1); o.stop(t1 + 0.08);
    }
  }

  aggiorna(dt, camera, abitanti) {
    if (!this.attivo) return;
    const c = this.ctx, L = c.listener, p = camera.position;
    const avanti = camera.getWorldDirection(this._v || (this._v = camera.position.clone()));
    if (L.positionX) {
      L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z;
      L.forwardX.value = avanti.x; L.forwardY.value = avanti.y; L.forwardZ.value = avanti.z;
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    }
    const t = c.currentTime;
    if (t > this.prossimaCampana) {
      const camp = CAMPANILI[Math.floor(Math.random() * CAMPANILI.length)];
      if (this.g.campane === 'festa') {
        const fine = this.suonata(camp, t + 0.1);
        this.prossimaCampana = Math.min(fine, t + 9) + 4 + Math.random() * 10;
      } else {
        const fine = this.rintocchi(camp, t + 0.1);
        this.prossimaCampana = fine + 35 + Math.random() * 50;
      }
    }
    if (this.g.rondini && t > this.prossimaRondine) {
      this.rondine(t + 0.05, p.x + (Math.random() - 0.5) * 60, p.y + 12 + Math.random() * 20, p.z + (Math.random() - 0.5) * 60);
      this.prossimaRondine = t + 1.5 + Math.random() * 6;
    }
    // brusio: quante persone ci sono entro 18 m
    let n = 0;
    if (abitanti?.figure) for (const f of abitanti.figure) if (Math.abs(f.x - p.x) < 18 && Math.abs(f.z - p.z) < 18) n++;
    const obiettivo = Math.min(0.5, n * 0.045) * (0.75 + 0.25 * Math.sin(t * 0.37) * Math.sin(t * 0.11));
    this.brusio.gain.setTargetAtTime(obiettivo, t, 0.8);
  }
}
