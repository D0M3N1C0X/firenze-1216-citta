import { LUOGHI } from '../dati/luoghi.js';
import { DOMANDE, TAPPE } from '../dati/visita.js';
import { voce } from './voce.js';
import { domanda as domandaL, suLingua, t, tappa as tappaL } from './lingua.js';

/* =====================================================================
   LA VISITA GUIDATA (dati/visita.js)

   Un pannello con la tappa, due o tre frasi e i pulsanti grandi Indietro
   e Avanti. A ogni tappa la città porta nel punto di vista; l'ultima
   accende i colori della certezza e invita a esplorare da soli, o a
   rispondere a quattro domande per la classe. «Ascolta» legge la tappa con
   la voce del dispositivo (ui/voce.js).
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
    this.leggiDaSola = false;      // Impostazioni: «Leggi ad alta voce le tappe»
    this.domanda = -1;             // -1: le tappe; da 0 in su: le domande
    this.giuste = 0;
    this.el = $('#visita');
    this.el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const a = b.dataset.azione;
      if (a === 'ascolta') voce.leggi(this.testoDaLeggere(), b);
      else if (a === 'domande') this.domande(0);
      else if (a === 'risposta') this.rispondi(+b.dataset.k);
      else if (a === 'prossima') this.domande(this.domanda + 1);
      else if (a === 'ricomincia') { this.domanda = -1; this.vai(0); }
      else if (a === 'scheda-domanda') this.az.scheda(LUOGHI.find(l => l.id === DOMANDE[this.domanda].luogo));
      else if (a === 'avanti') this.vai(this.i + 1);
      else if (a === 'indietro') this.vai(this.i - 1);
      else if (a === 'scheda') this.az.scheda(LUOGHI.find(l => l.id === TAPPE[this.i].luogo));
      else if (a === 'chiudi') this.chiudi(false);
      else if (a === 'fine') this.chiudi(true);
    });
    // la lingua cambia: si ridisegna quello che si sta guardando
    suLingua(() => { if (!this.aperta) return; if (this.domanda < 0) this.mostra(); else if (this.domanda < DOMANDE.length) this.domande(this.domanda); else this.fineDomande(); });
  }

  get aperta() { return !this.el.hidden; }

  apri(i = 0) {
    this.el.hidden = false;
    this.az.aperta?.(true);
    this.vai(i);
  }

  chiudi(finita) {
    voce.ferma();
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.az.aperta?.(false, finita);
  }

  vai(i) {
    if (i < 0 || i >= TAPPE.length) return;
    this.i = i; this.domanda = -1;
    voce.ferma();
    this.mostra();
    this.az.vai(TAPPE[i]);
    if (this.leggiDaSola) setTimeout(() => { if (this.i === i && this.domanda < 0 && this.aperta) voce.leggi(this.testoDaLeggere(), this.el.querySelector('[data-azione="ascolta"]')); }, 400);
  }

  testoDaLeggere() {
    if (this.domanda >= 0) { const d = domandaL(DOMANDE[this.domanda], this.domanda); return d.domanda + ' ' + d.risposte.join('. ') + '.'; }
    const tp = tappaL(TAPPE[this.i], this.i);
    return tp.titolo + '. ' + tp.testo.join(' ');
  }

  /** Le domande per la classe, dopo l'ultima tappa. */
  domande(k) {
    voce.ferma();
    if (k === 0) this.giuste = 0;
    this.domanda = k;
    if (k >= DOMANDE.length) return this.fineDomande();
    const d = domandaL(DOMANDE[k], k);
    this.el.innerHTML = `
      <button class="chiudi" data-azione="chiudi" aria-label="${esc(t('visita.esci'))}">×</button>
      <p class="sopra">${esc(t('domande.sopra', { k: k + 1, n: DOMANDE.length }))}</p>
      <h2>${esc(d.domanda)}</h2>
      <div class="risposte" role="group" aria-label="${esc(t('domande.risposte'))}">
        ${d.risposte.map((r, i) => `<button class="risposta" data-azione="risposta" data-k="${i}">${esc(r)}</button>`).join('')}
      </div>
      ${voce.disponibile ? `<button class="ascolta" data-azione="ascolta" aria-pressed="false">${esc(t('ascolta.domanda'))}</button>` : ''}`;
    this.el.scrollTop = 0;
    this.el.querySelector('.risposta')?.focus({ preventScroll: true });
  }

  rispondi(i) {
    const d = domandaL(DOMANDE[this.domanda], this.domanda), giusta = i === d.giusta;
    if (giusta) this.giuste++;
    for (const b of this.el.querySelectorAll('.risposta')) {
      const k = +b.dataset.k;
      b.disabled = true;
      if (k === d.giusta) b.classList.add('giusta');
      else if (k === i) b.classList.add('sbagliata');
    }
    const p = document.createElement('div');
    p.className = 'esito-domanda';
    p.innerHTML = `<p><b>${esc(t(giusta ? 'domande.giusto' : 'domande.no'))}</b> ${esc(d.perche)}</p>
      ${d.luogo ? `<button class="leggi" data-azione="scheda-domanda">${esc(t('scheda.leggiFonti'))}</button>` : ''}
      <nav class="passi"><button data-azione="prossima">${esc(t(this.domanda === DOMANDE.length - 1 ? 'domande.risultato' : 'domande.prossima'))}</button></nav>`;
    this.el.querySelector('.ascolta')?.remove();
    this.el.appendChild(p);
    p.querySelector('[data-azione="prossima"]').focus({ preventScroll: true });
  }

  fineDomande() {
    this.el.innerHTML = `
      <button class="chiudi" data-azione="chiudi" aria-label="${esc(t('visita.esci'))}">×</button>
      <p class="sopra">${esc(t('domande.titolo'))}</p>
      <h2>${esc(t('domande.fine', { g: this.giuste, n: DOMANDE.length }))}</h2>
      <p>${esc(t('domande.finetesto'))}</p>
      <nav class="passi">
        <button data-azione="ricomincia">${esc(t('domande.ricomincia'))}</button>
        <button data-azione="fine">${esc(t('visita.fine'))}</button>
      </nav>`;
    this.el.querySelector('[data-azione="fine"]').focus({ preventScroll: true });
  }

  mostra() {
    const tp = tappaL(TAPPE[this.i], this.i), ultima = this.i === TAPPE.length - 1;
    const luogo = tp.luogo && LUOGHI.find(l => l.id === tp.luogo);
    const punti = TAPPE.map((_, k) => `<i class="${k < this.i ? 'fatto' : k === this.i ? 'qui' : ''}"></i>`).join('');
    this.el.innerHTML = `
      <button class="chiudi" data-azione="chiudi" aria-label="${esc(t('visita.esci'))}">×</button>
      <p class="sopra">${esc(t('visita.sopra', { i: this.i + 1, n: TAPPE.length }))}</p>
      <div class="punti" aria-hidden="true">${punti}</div>
      <h2>${esc(tp.titolo)}</h2>
      ${voce.disponibile ? `<button class="ascolta" data-azione="ascolta" aria-pressed="false">${esc(t('ascolta'))}</button>` : ''}
      ${tp.testo.map(p => `<p>${esc(p)}</p>`).join('')}
      ${luogo ? `<button class="leggi" data-azione="scheda">${esc(t('scheda.leggiFonti'))}</button>` : ''}
      ${ultima ? `<button class="leggi" data-azione="domande">${esc(t('visita.domande'))}</button>` : ''}
      <nav class="passi">
        <button data-azione="indietro" ${this.i === 0 ? 'disabled' : ''}>${esc(t('visita.indietro'))}</button>
        ${ultima ? `<button data-azione="fine">${esc(t('visita.fine'))}</button>` : `<button data-azione="avanti">${esc(t('visita.avanti'))}</button>`}
      </nav>`;
    this.el.scrollTop = 0;
    this.el.querySelector(ultima ? '[data-azione="fine"]' : '[data-azione="avanti"]')?.focus({ preventScroll: true });
  }
}
