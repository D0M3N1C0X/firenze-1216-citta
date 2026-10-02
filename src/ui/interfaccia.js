import { LIVELLI } from '../mondo/materiali.js';
import { LUOGHI } from '../dati/luoghi.js';

/* L'interfaccia: avvio, testata, luogo vicino, scheda, elenco, legenda. */

const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// [da verificare] e «le fonti divergono» restano visibili anche nella scheda
const evidenzia = s => esc(s).replace(/\[da verificare[^\]]*\]/g, m => `<span class="verifica">${m}</span>`);

const badge = l => `<span class="badge" style="background:${LIVELLI[l].colore}">${LIVELLI[l].nome}</span>`;

export class Interfaccia {
  constructor(az) {
    this.az = az;           // azioni: { certezza(on), volo(on), ora(h), vai(luogo), qualita(), giorno() }
    this.vicino = null;
    $('#entra').addEventListener('click', () => az.entra());
    $('#b-certezza').addEventListener('click', () => this.certezza());
    $('#b-volo').addEventListener('click', () => this.volo());
    $('#b-luoghi').addEventListener('click', () => this.elenco());
    $('#b-qualita').addEventListener('click', () => { $('#b-qualita').textContent = 'Qualità: ' + az.qualita(); });
    $('#b-giorno').addEventListener('click', () => az.giorno());
    $('#b-racconto').addEventListener('click', () => az.racconto());
    $('#cursore-ora').addEventListener('input', e => az.ora(+e.target.value));
    for (const b of document.querySelectorAll('.chiudi')) b.addEventListener('click', () => { b.parentElement.hidden = true; });
    addEventListener('keydown', e => {
      if (e.repeat || $('#avvio').hidden === false) return;
      if (e.code === 'KeyC' && !az.inVolo()) this.certezza();
      if (e.code === 'KeyF') this.volo();
      if (e.code === 'KeyI') this.vicino ? this.apri(this.vicino) : null;
      if (e.code === 'KeyR') az.racconto();
      if (e.code === 'Escape') { $('#scheda').hidden = true; $('#elenco').hidden = true; }
    });
    $('#legenda').innerHTML = '<b>Certezza della forma</b>' + Object.values(LIVELLI)
      .map(l => `<div><i style="background:${l.colore}"></i><span>${l.nome}<small>${l.testo}</small></span></div>`).join('');
    $('#elenco-luoghi').innerHTML = LUOGHI.map(l =>
      `<li><button data-id="${l.id}"><i style="background:${LIVELLI[l.forma.livello].colore}"></i>${esc(l.nome)}</button></li>`).join('');
    for (const b of document.querySelectorAll('#elenco-luoghi button')) b.addEventListener('click', () => {
      const l = LUOGHI.find(x => x.id === b.dataset.id);
      $('#elenco').hidden = true;
      az.vai(l); this.apri(l);
    });
  }

  progresso(msg) { $('#progresso').textContent = msg; }
  pronto() { $('#progresso').textContent = 'Pronto.'; const b = $('#entra'); b.disabled = false; b.focus(); }
  mostra() {
    $('#avvio').hidden = true;
    for (const s of ['#testata', '#barra']) $(s).hidden = false;
    // i riquadri in basso stanno sempre sopra la barra, anche quando va a capo
    const barra = $('#barra');
    const misura = () => document.documentElement.style.setProperty('--sopra-barra', (barra.offsetHeight + 28) + 'px');
    misura();
    if (window.ResizeObserver) new ResizeObserver(misura).observe(barra);
  }

  certezza() {
    const b = $('#b-certezza'), on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    $('#legenda').hidden = !on;
    this.az.certezza(on);
  }
  volo() {
    const b = $('#b-volo'), on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    this.az.volo(on);
  }
  elenco() { $('#scheda').hidden = true; $('#elenco').hidden = !$('#elenco').hidden; }

  /** Lo stato dei pulsanti quando a cambiarlo è il racconto, non un clic. */
  statoVolo(on) { $('#b-volo').setAttribute('aria-pressed', on); }
  statoRacconto(on) { $('#b-racconto').setAttribute('aria-pressed', on); }

  /** Sulla schermata d'avvio: la scena da cui arriva chi viene dal gioco. */
  scenaIniziale(testo) { const p = $('#avvio-scena'); p.textContent = testo; p.hidden = !testo; }

  ora(testo, canonica) { $('#ora').textContent = `${testo} · ${canonica}`; }

  /** La giornata mostrata: testata, avvio, pulsante e limiti del cursore dell'ora (dall'alba). */
  giornata(g, alba, ora) {
    $('#quando').textContent = g.titolo;
    $('#quando').title = g.nota;
    $('#avvio .data').textContent = `${g.titolo} · ${g.nota}`;
    const b = $('#b-giorno');
    b.textContent = 'Giorno: ' + g.nome;
    b.title = 'Passa a ' + (g.id === 'pasqua' ? '10 febbraio' : 'Pasqua');
    const r = $('#cursore-ora');
    r.min = (Math.floor((alba - 0.4) * 20) / 20).toFixed(2);
    r.value = ora;
  }

  /** Aggiorna il riquadro del luogo più vicino. */
  luogoVicino(l) {
    if (l === this.vicino) return;
    this.vicino = l;
    const v = $('#vicino');
    if (!l) { v.hidden = true; return; }
    v.hidden = false;
    v.innerHTML = `<b>${esc(l.nome)}</b><br>${badge(l.forma.livello)} <span class="tasto">I</span> per la scheda`;
  }

  apri(l) {
    $('#elenco').hidden = true;
    $('#scheda').hidden = false;
    $('#scheda-corpo').innerHTML = `
      <h2>${esc(l.nome)}</h2>
      <div class="livelli">
        <div class="livello"><b>Luogo</b><span>${badge(l.luogo.livello)}${evidenzia(l.luogo.nota)}</span></div>
        <div class="livello"><b>Forma</b><span>${badge(l.forma.livello)}${evidenzia(l.forma.nota)}</span></div>
      </div>
      <p>${evidenzia(l.testo)}</p>
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#6b5a42;margin:16px 0 4px">Fonti</h3>
      <ul class="fonti">${l.fonti.map(f => `<li>${evidenzia(f)}</li>`).join('')}</ul>`;
  }
}
