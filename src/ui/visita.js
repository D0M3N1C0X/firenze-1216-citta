import { LUOGHI } from '../dati/luoghi.js';
import { TAPPE } from '../dati/visita.js';

/* =====================================================================
   LA VISITA GUIDATA (dati/visita.js)

   Un pannello con la tappa, due o tre frasi e i pulsanti grandi Indietro
   e Avanti. A ogni tappa la città porta nel punto di vista; l'ultima
   accende i colori della certezza e invita a esplorare da soli.
   ===================================================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Visita {
  /**
   * @param {object} az { vai(tappa), scheda(luogo), aperta(on, finita) }
   */
  constructor(az) {
    this.az = az;
    this.i = 0;
    this.el = $('#visita');
    this.el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const a = b.dataset.azione;
      if (a === 'avanti') this.vai(this.i + 1);
      else if (a === 'indietro') this.vai(this.i - 1);
      else if (a === 'scheda') this.az.scheda(LUOGHI.find(l => l.id === TAPPE[this.i].luogo));
      else if (a === 'chiudi') this.chiudi(false);
      else if (a === 'fine') this.chiudi(true);
    });
  }

  get aperta() { return !this.el.hidden; }

  apri(i = 0) {
    this.el.hidden = false;
    this.az.aperta?.(true);
    this.vai(i);
  }

  chiudi(finita) {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.az.aperta?.(false, finita);
  }

  vai(i) {
    if (i < 0 || i >= TAPPE.length) return;
    this.i = i;
    this.mostra();
    this.az.vai(TAPPE[i]);
  }

  mostra() {
    const t = TAPPE[this.i], ultima = this.i === TAPPE.length - 1;
    const luogo = t.luogo && LUOGHI.find(l => l.id === t.luogo);
    const punti = TAPPE.map((_, k) => `<i class="${k < this.i ? 'fatto' : k === this.i ? 'qui' : ''}"></i>`).join('');
    this.el.innerHTML = `
      <button class="chiudi" data-azione="chiudi" aria-label="Esci dalla visita">×</button>
      <p class="sopra">Visita guidata · tappa ${this.i + 1} di ${TAPPE.length}</p>
      <div class="punti" aria-hidden="true">${punti}</div>
      <h2>${esc(t.titolo)}</h2>
      ${t.testo.map(p => `<p>${esc(p)}</p>`).join('')}
      ${luogo ? '<button class="leggi" data-azione="scheda">Leggi la scheda, con le fonti</button>' : ''}
      <nav class="passi">
        <button data-azione="indietro" ${this.i === 0 ? 'disabled' : ''}>◀ Indietro</button>
        ${ultima ? '<button data-azione="fine">Esplora da solo ▶</button>' : '<button data-azione="avanti">Avanti ▶</button>'}
      </nav>`;
    this.el.scrollTop = 0;
    this.el.querySelector(ultima ? '[data-azione="fine"]' : '[data-azione="avanti"]')?.focus({ preventScroll: true });
  }
}
