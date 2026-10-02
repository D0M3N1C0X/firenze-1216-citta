import { COPIONE } from '../dati/copione.js';
import { GIORNATE } from '../dati/giornate.js';
import { LUOGHI } from '../dati/luoghi.js';
import { SCENE, TIPI_NOTA } from '../dati/scene.js';

/* =====================================================================
   IL RACCONTO NELLA CITTÀ

   Un percorso guidato che passa di scena in scena del copione: il testo
   della schermata, le scelte della classe, le note del quaderno con il
   loro tipo, le parole delle fonti e la base storica. Le scene di un
   bivio (I2, III3, IV2) stanno in un passo solo, con una linguetta per
   ramo. Andando avanti la città porta nel luogo, nella giornata e all'ora
   della scena; le scene fuori dalla città dicono perché non c'è un luogo.
   ===================================================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const evidenzia = s => esc(s).replace(/\[da verificare[^\]]*\]/g, m => `<span class="verifica">${m}</span>`);

const ATTI = { P: 'Prologo', I: 'Atto I', II: 'Atto II', III: 'Atto III', IV: 'Atto IV' };
const atto = id => ATTI[id.match(/^[A-Z]+/)[0]] || '';

/** I passi del racconto: una scena, o le scene alternative di un bivio. */
const PASSI = [];
for (const s of SCENE) {
  const ultimo = PASSI.at(-1);
  if (s.gruppo && ultimo && ultimo[0].gruppo === s.gruppo) ultimo.push(s);
  else PASSI.push([s]);
}

export class Racconto {
  /**
   * @param {object} az { vai(scena), scheda(luogo), aperto(on) }
   */
  constructor(az) {
    this.az = az;
    this.passo = 0; this.ramo = 0;
    this.el = $('#racconto');
    this.el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.ramo !== undefined) { this.ramo = +b.dataset.ramo; this.mostra(true); }
      else if (b.dataset.azione === 'avanti') this.vai(this.passo + 1);
      else if (b.dataset.azione === 'indietro') this.vai(this.passo - 1);
      else if (b.dataset.azione === 'guarda') this.az.vai(this.scena());
      else if (b.dataset.azione === 'scheda') this.az.scheda(LUOGHI.find(l => l.id === this.scena().luogo));
      else if (b.dataset.azione === 'chiudi') this.chiudi();
    });
  }

  get aperto() { return !this.el.hidden; }
  scena() { return PASSI[this.passo][this.ramo] || PASSI[this.passo][0]; }

  /** Apre il racconto su una scena (codice del copione) o sul passo corrente. */
  apri(id) {
    if (id) {
      const p = PASSI.findIndex(ps => ps.some(s => s.id === id));
      if (p >= 0) { this.passo = p; this.ramo = PASSI[p].findIndex(s => s.id === id); }
    }
    this.el.hidden = false;
    this.az.aperto?.(true);
    this.mostra(true);
  }
  chiudi() { this.el.hidden = true; this.az.aperto?.(false); }
  alterna() { this.aperto ? this.chiudi() : this.apri(); }

  vai(p) {
    if (p < 0 || p >= PASSI.length) return;
    this.passo = p; this.ramo = 0;
    this.mostra(true);
  }

  /** Disegna il passo; se porta è vero, la città va nel luogo e nella giornata della scena. */
  mostra(porta) {
    const passi = PASSI[this.passo], s = this.scena(), c = COPIONE[s.id];
    const g = s.giornata ? GIORNATE[s.giornata] : null;
    const luogo = s.luogo ? LUOGHI.find(l => l.id === s.luogo) : null;
    const quando = s.fuori ? 'Fuori dalla città' : [g?.titolo, luogo?.nome].filter(Boolean).join(' · ');

    const rami = passi.length > 1
      ? `<div class="rami" role="tablist">${passi.map((x, i) => `<button role="tab" aria-selected="${i === this.ramo}" data-ramo="${i}">${esc(x.ramo)}</button>`).join('')}</div>`
      : '';
    const note = c.note.map(n => {
      const t = TIPI_NOTA[n.tipo];
      return `<li><span class="badge" style="background:${t.colore}" title="${esc(t.testo)}">${esc(t.nome)}</span>`
        + `<b>${esc(n.id)}</b>${n.chi ? ` <span class="chi">(${esc(n.chi)})</span>` : ''} ${esc(n.testo)}</li>`;
    }).join('');

    this.el.innerHTML = `
      <button class="chiudi" data-azione="chiudi" aria-label="Chiudi il racconto">×</button>
      <p class="sopra">Il racconto · ${esc(atto(s.id))} · ${this.passo + 1} di ${PASSI.length}</p>
      <h2>${esc(s.id)} · ${esc(c.titolo)}</h2>
      ${rami}
      <p class="dove">${esc(quando)}</p>
      ${c.testo.map(p => `<p>${esc(p)}</p>`).join('')}
      ${s.fuori ? `<p class="nella-citta"><b>Fuori dalla città.</b> ${evidenzia(s.fuori)}</p>` : ''}
      ${s.adattamento ? `<p class="nella-citta"><b>Nella città.</b> ${evidenzia(s.adattamento)}</p>` : ''}
      ${c.testimoni ? `<h3>I testimoni</h3><ul class="scelte">${c.testimoni.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${c.scelte.length ? `<h3>La classe sceglie</h3><ul class="scelte">${c.scelte.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${note ? `<h3>Nel quaderno</h3><ul class="note">${note}</ul>` : ''}
      ${c.citazioni.length ? `<details><summary>Le parole delle fonti</summary>${c.citazioni.map(x => `<p><i>${esc(x.tipo)}.</i> ${esc(x.testo)}</p>`).join('')}</details>` : ''}
      ${c.base ? `<details><summary>Base storica</summary><p>${evidenzia(c.base)}</p></details>` : ''}
      <nav class="passi">
        <button data-azione="indietro" ${this.passo === 0 ? 'disabled' : ''}>◀ Indietro</button>
        ${s.vista ? '<button data-azione="guarda" title="Torna al punto di vista della scena">Guarda</button>' : ''}
        ${luogo ? '<button data-azione="scheda" title="La scheda del luogo, con le fonti">Scheda</button>' : ''}
        <button data-azione="avanti" ${this.passo === PASSI.length - 1 ? 'disabled' : ''}>Avanti ▶</button>
      </nav>
      ${this.passo === PASSI.length - 1 ? '<p class="fine">Il resto si gioca in classe: il notaio scrive la pagina dell\'anno, e un secolo dopo i cronisti scrivono la loro.</p>' : ''}`;
    this.el.scrollTop = 0;
    if (porta && (s.vista || s.giornata)) this.az.vai(s);
  }
}

export { PASSI };
