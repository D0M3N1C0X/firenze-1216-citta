import { trovaCammino, vicinoPercorribile } from './cammino.js';
import { rng } from './rumore.js';

/* =====================================================================
   LA ZUFFA DI CALENDIMAGGIO, piazza Santa Trinita, 1° maggio 1300

   La scena segue Villani (IX, 39), come la città (decisione del
   6 novembre 2026): «la sera di calen di maggio, anno MCCC, veggendo uno
   ballo di donne che si facea nella piazza di Santa Trinita, l'una parte
   contra l'altra si cominciarono a sdegnare, e a pignere l'uno contro a
   l'altro i cavagli, onde si cominciò una grande zuffa e mislea». La
   versione di Compagni (un agguato preparato a cena) è nella scheda della
   piazza (dati/trecento-luoghi.js).

   Si vede senza sangue (decisione del 6 novembre): il ballo, le due
   brigate a cavallo che arrivano, i cavalli spinti gli uni contro gli
   altri, la gente che scappa. La ferita di Ricoverino non si vede.

   Quante persone: dieci donne nel ballo, una ventina intorno a guardare,
   dieci cavalieri per brigata. Villani dice «più di XXX a cavallo» con i
   Cerchi: i numeri sono ridotti per il peso della scena (decisione del
   9 novembre). Da dove arrivano le brigate: i Cerchi da borgo Santi
   Apostoli, i Donati da nord, dalla via che oggi è via Tornabuoni
   (ipotesi: la fonte non lo dice). Tutto è «ipotesi».

   I tempi, in secondi veri dall'inizio (ore 18.40 della città):
     0–25   le brigate arrivano al passo; il ballo continua
     25–65  la mischia: i cavalli si spingono, la gente scappa
     65–95  le brigate se ne vanno di trotto, ciascuna dalla sua parte
     95     la piazza è vuota: «la sera tutta la città fu per gelosia sotto l'arme»
   ===================================================================== */

// alle 18.40, «la sera» di Villani ma ancora con la luce del tramonto (alle 19.08): decisione del 9 novembre 2026
export const ORA_ZUFFA = 18 + 40 / 60;
export const CENTRO_ZUFFA = [-164, -206];
const LONTANO = 1e5;

export class Zuffa {
  /**
   * ab: l'oggetto Abitanti (le figure si aggiungono alle sue e lui le disegna);
   * opz: { griglia, varianti, animali, avvisa(chiave) }.
   */
  constructor(ab, opz) {
    this.ab = ab; this.g = opz.griglia; this.avvisa = opz.avvisa || (() => {});
    const R = rng(1300);
    this.R = R;
    const varianti = opz.varianti, animali = opz.animali;
    const di = ruoli => { const l = varianti.filter(v => ruoli.includes(v.info?.ruolo)); return l.length ? l : varianti; };
    const C = vicinoPercorribile(this.g, CENTRO_ZUFFA, 8) || CENTRO_ZUFFA;
    this.C = C;
    this.ballo = []; this.folla = []; this.brigate = [];
    // il ballo: dieci donne in tondo
    const donne = di(['fanciulla', 'nobildonna', 'mercantessa', 'popolana']);
    for (let i = 0; i < 10; i++) {
      const v = donne[i % donne.length];
      const f = this.figura(v, 'passeggia');
      f.angolo = i / 10 * Math.PI * 2; f.raggio = 3.2;
      this.ballo.push(f);
    }
    // la folla intorno, che guarda
    for (let i = 0; i < 20; i++) {
      const v = varianti[(i * 5) % varianti.length];
      const a = i / 20 * Math.PI * 2 + R.tra(-0.15, 0.15), r = R.tra(6.5, 9.5);
      const p = vicinoPercorribile(this.g, [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r], 3);
      if (!p) continue;
      const f = this.figura(v, R.scegli(['guarda', 'fermo', 'parla']));
      f.casa = p;
      this.folla.push(f);
    }
    // le due brigate: partenza, arrivo intorno alla piazza, e il cammino fra i due
    const sellati = ['sellato', 'palafreno'].filter(t => animali?.[t]);
    const cavalieri = di(['cavaliere', 'mercante']);
    const lati = [
      { nome: 'Cerchi', da: [-80, -132], verso: [1, 0.35] },
      { nome: 'Donati', da: [-172, -268], verso: [-0.35, -1] }
    ];
    if (sellati.length) for (const [k, lato] of lati.entries()) {
      const partenza = vicinoPercorribile(this.g, lato.da, 8);
      if (!partenza) continue;
      for (let i = 0; i < 10; i++) {
        const tipo = animali[sellati[(i + k) % sellati.length]];
        const cav = ab.nuovoAnimale(tipo, R, 'passo');
        ab.monta(cav, cavalieri[(i * 3 + k) % cavalieri.length]);
        const l = Math.hypot(...lato.verso), ux = lato.verso[0] / l, uz = lato.verso[1] / l;
        // il posto nella mischia: a 6–9 m dal centro, dalla parte da cui si arriva
        const fila = Math.floor(i / 4), col = i % 4 - 1.5;
        const posto = vicinoPercorribile(this.g, [C[0] + ux * (6 + fila * 2.5) - uz * col * 2.4, C[1] + uz * (6 + fila * 2.5) + ux * col * 2.4], 4) || C;
        const cammino = trovaCammino(this.g, partenza, posto, { margine: 30 }) || [partenza, posto];
        Object.assign(cav, { fermo: true, x: LONTANO, z: LONTANO, dir: 0, parte: k, variante: tipo, posto, cammino, ritardo: i * 1.1, fase: R.tra(0, 6.28) });
        this.brigate.push(cav);
        ab.figure.push(cav);
      }
    }
    this.stato = 'attesa'; this.t = 0; this.avvisato = false;
    this.mettiInPiazza();
  }

  /** Una figura di Blender ferma, con il movimento dato; la muove la zuffa. */
  figura(v, clip) {
    const f = this.ab.nuovaModello(v, this.R, clip);
    Object.assign(f, { fermo: true, x: LONTANO, z: LONTANO, dir: 0, variante: v });
    this.ab.figure.push(f);
    return f;
  }

  cambiaClip(f, nome, scala = 1) {
    const clip = f.variante?.clip?.[nome];
    if (!clip || !f.mixer || f.clipOra === nome) { if (f.azione) f.azione.timeScale = scala; return; }
    const nuova = f.mixer.clipAction(clip);
    nuova.reset().play(); nuova.timeScale = scala;
    if (f.azione && f.azione !== nuova) f.azione.crossFadeTo(nuova, 0.3, false);
    f.azione = nuova; f.clipOra = nome;
  }

  /** Il ballo e la folla al loro posto; le brigate fuori scena. */
  mettiInPiazza() {
    for (const f of [...this.ballo, ...this.folla]) { f.via = null; f.nascosta = false; }
    for (const f of this.folla) { f.x = f.casa[0]; f.z = f.casa[1]; f.dir = Math.atan2(this.C[0] - f.x, this.C[1] - f.z); }
    for (const f of this.ballo) this.cambiaClip(f, 'passeggia', 0.55);
    for (const c of this.brigate) { c.x = c.z = LONTANO; c.passo = 0; }
  }

  /** Fuga: ognuno verso un punto a 25–35 m dal centro, lontano dalla mischia. */
  scappa(f) {
    const a = Math.atan2(f.z - this.C[1], f.x - this.C[0]) + this.R.tra(-0.4, 0.4), r = this.R.tra(25, 35);
    const meta = vicinoPercorribile(this.g, [this.C[0] + Math.cos(a) * r, this.C[1] + Math.sin(a) * r], 8);
    f.via = (meta && trovaCammino(this.g, [f.x, f.z], meta, { margine: 25 })) || null;
    f.passo = 0;
    this.cambiaClip(f, 'cammina2', 1.6);
  }

  /** Segue un cammino a velocità v; restituisce true quando è arrivato. */
  segui(f, cammino, v, dt) {
    if (!cammino || cammino.length < 2) return true;
    f.passo = (f.passo || 0) + v * dt;
    let s = f.passo;
    for (let i = 0; i + 1 < cammino.length; i++) {
      const [ax, az] = cammino[i], [bx, bz] = cammino[i + 1], l = Math.hypot(bx - ax, bz - az);
      if (s <= l) {
        const k = s / (l || 1);
        f.x = ax + (bx - ax) * k; f.z = az + (bz - az) * k;
        let dd = Math.atan2(bx - ax, bz - az) - f.dir; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
        f.dir += dd * Math.min(1, dt * 5);
        return false;
      }
      s -= l;
    }
    const fine = cammino[cammino.length - 1];
    f.x = fine[0]; f.z = fine[1];
    return true;
  }

  /** ogni fotogramma: dt in secondi veri, ora della città */
  aggiorna(dt, ora) {
    // se si torna indietro con l'ora, la scena ricomincia
    if (ora < ORA_ZUFFA - 0.05 && this.stato !== 'attesa') { this.stato = 'attesa'; this.t = 0; this.avvisato = false; this.mettiInPiazza(); }
    if (this.stato === 'attesa' && !this.avvisato && ora >= ORA_ZUFFA - 0.09) { this.avvisato = true; this.avvisa('zuffa.presto'); }
    if (this.stato === 'attesa' && ora >= ORA_ZUFFA) { this.stato = 'arrivo'; this.t = 0; this.avvisa('zuffa.inizia'); }
    this.t += dt;
    const C = this.C;
    // il ballo gira finché non arriva la mischia
    if (this.stato === 'attesa' || this.stato === 'arrivo') for (const f of this.ballo) {
      f.angolo += dt * 0.32;
      f.x = C[0] + Math.cos(f.angolo) * f.raggio; f.z = C[1] + Math.sin(f.angolo) * f.raggio;
      f.dir = Math.atan2(-Math.sin(f.angolo), Math.cos(f.angolo));        // tangente: si gira in tondo
    }
    if (this.stato === 'arrivo') {
      for (const c of this.brigate) {
        if (this.t < c.ritardo) continue;
        if (c.x === LONTANO) { c.x = c.cammino[0][0]; c.z = c.cammino[0][1]; c.passo = 0; this.cambiaClip(c, 'passo', 1); }
        this.segui(c, c.cammino, c.clipVel || 1.5, dt);
      }
      // chi guarda si volta verso i cavalli che arrivano
      if (this.t > 12) for (const f of this.folla) this.cambiaClip(f, 'guarda', 1);
      if (this.t > 25) {
        this.stato = 'mischia'; this.t = 0;
        for (const f of [...this.ballo, ...this.folla]) this.scappa(f);
      }
      return;
    }
    if (this.stato === 'mischia') {
      // i cavalli si spingono: avanti e indietro verso l'altra brigata, girandosi
      const altri = [0, 1].map(k => { const l = this.brigate.filter(c => c.parte !== k); return l.length ? [l.reduce((s, c) => s + c.posto[0], 0) / l.length, l.reduce((s, c) => s + c.posto[1], 0) / l.length] : C; });
      for (const c of this.brigate) {
        const [ox, oz] = altri[c.parte];
        const dx = ox - c.posto[0], dz = oz - c.posto[1], l = Math.hypot(dx, dz) || 1;
        const spinta = 1.6 + 1.4 * Math.sin(this.t * 1.7 + c.fase);
        const x = c.posto[0] + dx / l * spinta + Math.sin(this.t * 2.3 + c.fase * 2) * 0.6;
        const z = c.posto[1] + dz / l * spinta + Math.cos(this.t * 1.9 + c.fase) * 0.6;
        if (this.g.percorribile(x, z)) { c.x = x; c.z = z; }
        c.dir = Math.atan2(dx, dz) + 0.7 * Math.sin(this.t * 1.3 + c.fase);
        this.cambiaClip(c, Math.sin(this.t * 0.9 + c.fase) > 0 ? 'trotto' : 'passo', 1);
      }
      for (const f of [...this.ballo, ...this.folla]) {
        if (f.nascosta) continue;
        if (!f.via || this.segui(f, f.via, 2.6, dt)) { if (this.t > 8) { f.x = f.z = LONTANO; f.nascosta = true; } }
      }
      if (this.t > 40) {
        this.stato = 'via'; this.t = 0;
        for (const c of this.brigate) { c.via = [[c.x, c.z], ...[...c.cammino].reverse()]; c.passo = 0; this.cambiaClip(c, 'trotto', 1); }
        this.avvisa('zuffa.naso');
      }
      return;
    }
    if (this.stato === 'via') {
      let tutti = true;
      for (const c of this.brigate) {
        if (c.x === LONTANO) continue;
        if (this.segui(c, c.via, 3.4, dt)) c.x = c.z = LONTANO; else tutti = false;
      }
      for (const f of [...this.ballo, ...this.folla]) if (!f.nascosta) { f.x = f.z = LONTANO; f.nascosta = true; }
      if (tutti || this.t > 30) { this.stato = 'dopo'; this.avvisa('zuffa.dopo'); }
    }
  }
}
