/* =====================================================================
   GRIGLIA DI OCCUPAZIONE

   Una mappa del suolo a celle di mezzo metro: per ogni cella dice se lì
   c'è una strada, una piazza, il fiume, il ponte o una costruzione.
   Serve a tre cose: non costruire sulle strade, non attraversare i muri
   camminando, e far camminare gli abitanti dove si cammina.
   ===================================================================== */

export const LIBERO = 0, STRADA = 1, PIAZZA = 2, FIUME = 3, EDIFICIO = 4, MONUMENTO = 5, PONTE = 6, ORTO = 7;

export class Griglia {
  constructor(min = -560, max = 560, cella = 0.5) {
    this.min = min; this.max = max; this.cella = cella;
    this.n = Math.ceil((max - min) / cella);
    this.c = new Uint8Array(this.n * this.n);
  }
  i(x) { return Math.floor((x - this.min) / this.cella); }
  get(x, z) {
    const i = this.i(x), j = this.i(z);
    if (i < 0 || j < 0 || i >= this.n || j >= this.n) return FIUME + 100; // fuori dal modello
    return this.c[j * this.n + i];
  }
  set(i, j, v, sovrascrivi = true) {
    if (i < 0 || j < 0 || i >= this.n || j >= this.n) return;
    const k = j * this.n + i;
    if (sovrascrivi || this.c[k] === LIBERO) this.c[k] = v;
  }

  /** Riempie un poligono [[x,z],...] con scansione per righe. */
  poligono(pts, v, sovrascrivi = true) {
    let z0 = Infinity, z1 = -Infinity;
    for (const p of pts) { z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    for (let j = Math.max(0, this.i(z0)); j <= Math.min(this.n - 1, this.i(z1)); j++) {
      const z = this.min + (j + 0.5) * this.cella;
      const xs = [];
      for (let k = 0, l = pts.length - 1; k < pts.length; l = k++) {
        const a = pts[k], b = pts[l];
        if ((a[1] > z) !== (b[1] > z)) xs.push(a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2)
        for (let i = Math.max(0, this.i(xs[q])); i <= Math.min(this.n - 1, this.i(xs[q + 1])); i++) this.set(i, j, v, sovrascrivi);
    }
  }

  /** Traccia una spezzata con una larghezza: le strade. */
  spezzata(pts, larg, v, sovrascrivi = true) {
    const r = larg / 2;
    for (let k = 0; k + 1 < pts.length; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1];
      const x0 = Math.min(ax, bx) - r, x1 = Math.max(ax, bx) + r, z0 = Math.min(az, bz) - r, z1 = Math.max(az, bz) + r;
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      for (let j = Math.max(0, this.i(z0)); j <= Math.min(this.n - 1, this.i(z1)); j++) {
        const z = this.min + (j + 0.5) * this.cella;
        for (let i = Math.max(0, this.i(x0)); i <= Math.min(this.n - 1, this.i(x1)); i++) {
          const x = this.min + (i + 0.5) * this.cella;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
          const ex = ax + t * dx - x, ez = az + t * dz - z;
          if (ex * ex + ez * ez <= r * r) this.set(i, j, v, sovrascrivi);
        }
      }
    }
  }

  /** Rettangolo orientato: centro, semiassi e direzione (ux, uz) del lato lungo «a». */
  rettangolo(cx, cz, ux, uz, a, b, fn) {
    const vx = -uz, vz = ux;
    const R = Math.hypot(a, b);
    for (let j = Math.max(0, this.i(cz - R)); j <= Math.min(this.n - 1, this.i(cz + R)); j++) {
      const z = this.min + (j + 0.5) * this.cella;
      for (let i = Math.max(0, this.i(cx - R)); i <= Math.min(this.n - 1, this.i(cx + R)); i++) {
        const x = this.min + (i + 0.5) * this.cella;
        const px = x - cx, pz = z - cz;
        if (Math.abs(px * ux + pz * uz) <= a && Math.abs(px * vx + pz * vz) <= b) if (fn(i, j) === false) return false;
      }
    }
    return true;
  }

  liberoRett(cx, cz, ux, uz, a, b) {
    return this.rettangolo(cx, cz, ux, uz, a, b, (i, j) => this.c[j * this.n + i] === LIBERO);
  }
  segnaRett(cx, cz, ux, uz, a, b, v) {
    this.rettangolo(cx, cz, ux, uz, a, b, (i, j) => { this.c[j * this.n + i] = v; });
  }

  /** Si può stare in piedi qui? (raggio del corpo ~0,3 m) */
  percorribile(x, z, r = 0.3) {
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      const v = this.get(x + dx, z + dz);
      if (v === EDIFICIO || v === MONUMENTO || v === FIUME || v > 99) return false;
    }
    return true;
  }
}
