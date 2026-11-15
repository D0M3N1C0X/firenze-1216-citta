import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from 'three';
import { VICINO } from './terreno.js';

/* =====================================================================
   IL SUOLO DELLE STRADE

   Le strade non hanno una loro geometria: sono il terreno. Qui si disegna
   una mappa del riquadro fine del terreno che dice, punto per punto, dove
   c'è una strada e com'è fatta; la legge il materiale del terreno
   (terreno.js):
   - rosso: la strada (120 = terra battuta, 255 = lastricata);
   - verde: i solchi dei carri, due tracce ai lati dell'asse delle strade
     di terra larghe almeno 3,5 m.

   1216: tutte di terra (decisione del 15 novembre 2026: solo terra, tranne
   le piazze note, che sono modelli a parte). Villani però dice che prima
   del 1237 c'erano «poche lastricate, se non in certi singulari luoghi, e
   mastre strade lastricate di mattoni» (VII, 26): quali, non lo sappiamo
   (lacuna 81).
   1300: lastricate tutte le vie dentro la cerchia del 1172–75 e le vie
   maestre dei borghi, perché nel 1237, podestà Rubaconte da Mandello, «si
   lastricarono tutte le vie di Firenze» (Villani VII, 26, letto il 15
   novembre 2026). Quanto il lastrico arrivasse nei borghi nel 1300 è
   un'ipotesi. I solchi marcati sono una scelta d'aspetto.
   ===================================================================== */

export function mascheraStrade(strade, { lastre = () => false, lato = 4096 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = lato;
  const g = c.getContext('2d'), k = lato / VICINO.lato, x0 = VICINO.x - VICINO.lato / 2, z0 = VICINO.z - VICINO.lato / 2;
  g.fillStyle = '#000'; g.fillRect(0, 0, lato, lato);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const traccia = pts => { g.beginPath(); pts.forEach((p, i) => { const x = (p[0] - x0) * k, y = (p[1] - z0) * k; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); };
  // prima la terra, poi le lastre: agli incroci vince il lastrico
  for (const lastricata of [false, true]) for (const s of strade) {
    if (!s.punti || s.punti.length < 2 || Boolean(lastre(s)) !== lastricata) continue;
    const colore = lastricata ? '#ff0000' : '#780000';
    traccia(s.punti);
    if (s.area) { g.closePath(); g.fillStyle = colore; g.fill(); }
    else { g.strokeStyle = colore; g.lineWidth = Math.max(1.5, ((s.larghezza || 4) + 0.6) * k); g.stroke(); }
  }
  // i solchi: sommati nel verde
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = '#00ff00'; g.lineWidth = Math.max(1.1, 0.42 * k);
  for (const s of strade) {
    if (s.area || !s.punti || s.punti.length < 2 || lastre(s) || (s.larghezza || 4) < 3.5) continue;
    for (const lato_ of [-0.72, 0.72]) {
      const pts = s.punti.map((p, i) => {
        const a = s.punti[Math.max(0, i - 1)], b = s.punti[Math.min(s.punti.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        return [p[0] - (b[1] - a[1]) / l * lato_, p[1] + (b[0] - a[0]) / l * lato_];
      });
      traccia(pts); g.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.flipY = false; t.colorSpace = NoColorSpace; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}
