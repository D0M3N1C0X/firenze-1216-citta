import { FIUME } from '../dati/osm.js';
import { MURO, PALIZZATA } from '../dati/cerchia.js';
import { LIVELLI } from '../mondo/materiali.js';
import { nomeLuogo, suLingua, t } from './lingua.js';

/* =====================================================================
   LA MAPPA CON «TU SEI QUI»

   Un cerchio in un angolo dello schermo, con la città intorno e una
   freccia per dove si è e dove si guarda; toccandolo si apre la pianta
   intera, con i luoghi: se ne tocca uno e ci si va. È disegnata dagli
   stessi dati della città (il fiume, le mura, la palizzata, le strade del
   1216), non da un'immagine: quello che si vede in pianta è quello che si
   percorre.
   ===================================================================== */

// il riquadro della pianta, in metri: la cerchia e un po' di campagna intorno
const X0 = -700, X1 = 820, Z0 = -880, Z1 = 520;
const SCALA = 1.4;                    // pixel per metro nella pianta disegnata una volta
const PICCOLA = 300;                  // metri di città nel cerchio
const COL = { carta: '#efe6d4', strada: '#b9a98c', piazza: '#d9ccb2', fiume: '#9fbfd6', muro: '#7a3b2a', palizzata: '#8e5a2b', testo: '#2b241c' };

export class Mappa {
  /**
   * @param {object} az { vai(luogo) }
   * @param {object[]} luoghi quelli del mondo in cui si è (non le porte)
   */
  constructor(az, luoghi, priorita = []) {
    this.az = az;
    this.luoghi = luoghi;
    this.priorita = priorita;           // i luoghi della visita: il loro nome si scrive per primo
    this.base = null;
    this.ultima = 0;
    this.el = document.getElementById('mappa');
    this.cerchio = document.getElementById('mappa-piccola');
    this.grande = document.getElementById('mappa-grande');
    this.tela = document.getElementById('mappa-tela');
    this.cerchio.addEventListener('click', () => this.apri());
    this.grande.querySelector('.chiudi').addEventListener('click', () => this.chiudi());
    this.tela.addEventListener('click', e => this.tocca(e));
    suLingua(() => { if (!this.grande.hidden) this.disegnaGrande(); });
  }

  /** La pianta, disegnata una volta sola quando le strade sono pronte. */
  prepara(strade) {
    const W = Math.round((X1 - X0) * SCALA), H = Math.round((Z1 - Z0) * SCALA);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const P = ([x, z]) => [(x - X0) * SCALA, (z - Z0) * SCALA];
    const poli = (pts, chiudi = true) => { g.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p); i ? g.lineTo(a, b) : g.moveTo(a, b); }); if (chiudi) g.closePath(); };
    g.fillStyle = COL.carta; g.fillRect(0, 0, W, H);
    for (const s of strade) if (s.area) { poli(s.punti); g.fillStyle = COL.piazza; g.fill(); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of strade) if (!s.area) { poli(s.punti, false); g.strokeStyle = COL.strada; g.lineWidth = Math.max(1.5, s.larghezza * SCALA); g.stroke(); }
    poli(FIUME); g.fillStyle = COL.fiume; g.fill();
    poli(MURO, false); g.strokeStyle = COL.muro; g.lineWidth = 3.4; g.stroke();
    g.setLineDash([6, 4]); poli(PALIZZATA, false); g.strokeStyle = COL.palizzata; g.lineWidth = 2.2; g.stroke(); g.setLineDash([]);
    this.base = c;
    this.W = W; this.H = H;
    this.el.hidden = false;
  }

  mostra(on) { this.el.hidden = !on || !this.base; }

  /** Il cerchio nell'angolo: la città intorno, la freccia al centro (nord in alto). */
  aggiorna(x, z, yaw) {
    if (!this.base || this.el.hidden) return;
    const t = performance.now();
    if (t - this.ultima < 200) return;
    this.ultima = t;
    const cv = this.cerchio.querySelector('canvas'), g = cv.getContext('2d'), D = cv.width;
    const m = PICCOLA * SCALA, sx = (x - X0) * SCALA - m / 2, sz = (z - Z0) * SCALA - m / 2;
    g.clearRect(0, 0, D, D);
    g.save(); g.beginPath(); g.arc(D / 2, D / 2, D / 2 - 1, 0, Math.PI * 2); g.clip();
    g.fillStyle = COL.carta; g.fillRect(0, 0, D, D);
    g.drawImage(this.base, sx, sz, m, m, 0, 0, D, D);
    g.restore();
    this.freccia(g, D / 2, D / 2, yaw, D * 0.07);
    this.pos = [x, z, yaw];
    if (!this.grande.hidden) this.disegnaGrande();
  }

  freccia(g, cx, cy, yaw, r) {
    // il davanti della camera è (-sin yaw, -cos yaw) in (x, z); sulla carta z va in giù
    const th = Math.atan2(-Math.sin(yaw), Math.cos(yaw));
    g.save(); g.translate(cx, cy); g.rotate(th);
    g.beginPath(); g.moveTo(0, -r * 1.5); g.lineTo(r, r); g.lineTo(0, r * 0.45); g.lineTo(-r, r); g.closePath();
    g.fillStyle = '#c0392b'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.fill(); g.stroke();
    g.restore();
  }

  apri() { this.grande.hidden = false; this.disegnaGrande(); this.grande.querySelector('.chiudi').focus({ preventScroll: true }); }
  chiudi() { this.grande.hidden = true; }

  /** La pianta intera, adattata allo schermo, con i luoghi e «tu sei qui». */
  disegnaGrande() {
    const box = this.tela.parentElement.getBoundingClientRect();
    const k = Math.min(box.width / this.W, (box.height - 4) / this.H);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.tela.style.width = Math.round(this.W * k) + 'px'; this.tela.style.height = Math.round(this.H * k) + 'px';
    this.tela.width = Math.round(this.W * k * dpr); this.tela.height = Math.round(this.H * k * dpr);
    const g = this.tela.getContext('2d');
    g.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    g.drawImage(this.base, 0, 0);
    this.k = k;
    const P = ([x, z]) => [(x - X0) * SCALA, (z - Z0) * SCALA];
    g.font = `${Math.round(13 / k)}px system-ui, -apple-system, sans-serif`;
    g.textBaseline = 'middle';
    // prima i punti, poi i nomi: un nome si scrive solo dove non ne copre un altro,
    // cominciando dai luoghi della visita; gli altri restano come punto
    for (const l of this.luoghi) {
      const [a, b] = P(l.pos);
      g.beginPath(); g.arc(a, b, 6 / k, 0, Math.PI * 2);
      g.fillStyle = LIVELLI[l.forma.livello]?.colore || '#555'; g.fill();
      g.lineWidth = 2 / k; g.strokeStyle = '#fff'; g.stroke();
    }
    const occupati = [], h = 16 / k;
    const prima = this.priorita || [];
    const ordine = [...this.luoghi].sort((x, y) => (prima.includes(y.id) ? 1 : 0) - (prima.includes(x.id) ? 1 : 0));
    for (const l of ordine) {
      const nome = nomeLuogo(l), [a, b] = P(l.pos), w = g.measureText(nome).width;
      for (const [dx, dy, al] of [[9 / k, 0, 'left'], [-9 / k, 0, 'right'], [0, -h, 'center'], [0, h, 'center']]) {
        const x0 = al === 'left' ? a + dx : al === 'right' ? a + dx - w : a - w / 2, y0 = b + dy - h / 2;
        const box = [x0 - 2 / k, y0, x0 + w + 2 / k, y0 + h];
        if (occupati.some(o => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
        occupati.push(box);
        g.textAlign = al;
        g.lineWidth = 3 / k; g.strokeStyle = 'rgba(239,230,212,0.92)'; g.strokeText(nome, a + dx, b + dy);
        g.fillStyle = COL.testo; g.fillText(nome, a + dx, b + dy);
        break;
      }
    }
    g.textAlign = 'left';
    if (this.pos) {
      const [a, b] = P(this.pos);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.freccia(g, a * k, b * k, this.pos[2], 9);
      g.font = '600 14px system-ui, -apple-system, sans-serif';
      g.lineWidth = 4; g.strokeStyle = 'rgba(239,230,212,0.95)'; g.strokeText(t('mappa.qui'), a * k + 14, b * k - 16);
      g.fillStyle = '#c0392b'; g.fillText(t('mappa.qui'), a * k + 14, b * k - 16);
    }
  }

  /** Si tocca un luogo sulla pianta: ci si va. */
  tocca(e) {
    const r = this.tela.getBoundingClientRect();
    const x = (e.clientX - r.left) / this.k / SCALA + X0, z = (e.clientY - r.top) / this.k / SCALA + Z0;
    let best = null, bd = 22 / this.k / SCALA;
    for (const l of this.luoghi) { const d = Math.hypot(l.pos[0] - x, l.pos[1] - z); if (d < bd) { bd = d; best = l; } }
    if (best) { this.chiudi(); this.az.vai(best); }
  }
}
