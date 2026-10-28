import { LIVELLI } from '../mondo/materiali.js';
import { LUOGHI as TUTTI } from '../dati/luoghi.js';
import { MONDO, mondoDi } from '../mondo/dove.js';

// i luoghi del mondo in cui si è: la città, oppure un luogo a parte (Campi)
const LUOGHI = TUTTI.filter(l => mondoDi(l) === MONDO);

/* =====================================================================
   L'INTERFACCIA

   Pensata per chiunque, anche per chi non ha mai usato un videogioco:
   due scelte grandi all'ingresso (visita guidata o esplora da solo), una
   barra che dice quanto manca al caricamento, pulsanti grandi con parole
   di tutti i giorni, un aiuto, e le impostazioni (giornata, immagini,
   testo più grande, movimento ridotto) che il dispositivo ricorda.
   ===================================================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// [da verificare] e «le fonti divergono» restano visibili anche nella scheda
const evidenzia = s => esc(s).replace(/\[da verificare[^\]]*\]/g, m => `<span class="verifica">${m}</span>`);
const badge = l => `<span class="badge" style="background:${LIVELLI[l].colore}">${LIVELLI[l].nome}</span>`;

// le preferenze restano sul dispositivo; se il browser non le salva, si va avanti senza
const ricorda = (k, v) => { try { localStorage.setItem('citta.' + k, JSON.stringify(v)); } catch (e) { /* niente */ } };
const ricordato = (k, def) => { try { const v = localStorage.getItem('citta.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };

const DESTRA = ['#scheda', '#elenco', '#aiuto', '#impostazioni'];

export class Interfaccia {
  /**
   * @param {object} az azioni: entra(modo), visita(), certezza(on), volo(on), inVolo(), ora(h), vai(luogo),
   *   qualita(v), giorno(id), racconto(), movimentoRidotto(on)
   */
  constructor(az) {
    this.az = az;
    this.vicino = null;
    this.pronta = false;
    this.scelta = null;
    this.dentro = false;

    // l'ingresso: si può scegliere anche prima che la città sia pronta
    $('#b-visita-inizio').addEventListener('click', () => this.scegli('visita'));
    $('#entra').addEventListener('click', () => this.scegli('esplora'));

    $('#b-certezza').addEventListener('click', () => this.certezza());
    $('#b-volo').addEventListener('click', () => this.volo());
    $('#b-luoghi').addEventListener('click', () => this.alterna('#elenco'));
    $('#b-aiuto').addEventListener('click', () => this.alterna('#aiuto'));
    $('#b-impostazioni').addEventListener('click', () => this.alterna('#impostazioni'));
    $('#b-racconto').addEventListener('click', () => az.racconto());
    for (const id of ['#b-visita-elenco', '#b-visita-aiuto']) $(id).addEventListener('click', () => { this.chiudiDestra(); az.visita(); });
    $('#cursore-ora').addEventListener('input', e => az.ora(+e.target.value));
    for (const b of document.querySelectorAll('.destra > .chiudi')) b.addEventListener('click', () => { b.parentElement.hidden = true; });

    // impostazioni
    for (const b of document.querySelectorAll('#seg-giorno button')) b.addEventListener('click', () => az.giorno(b.dataset.v));
    for (const b of document.querySelectorAll('#seg-qualita button')) b.addEventListener('click', () => { az.qualita(b.dataset.v); this.segna('#seg-qualita', b.dataset.v); ricorda('qualita', b.dataset.v); this.qualitaScelta = b.dataset.v; });
    const testo = $('#i-testo'), movimento = $('#i-movimento');
    testo.checked = ricordato('testoGrande', false);
    movimento.checked = ricordato('movimentoRidotto', matchMedia('(prefers-reduced-motion: reduce)').matches);
    const applica = () => {
      document.documentElement.classList.toggle('testo-grande', testo.checked);
      document.documentElement.classList.toggle('movimento-ridotto', movimento.checked);
      az.movimentoRidotto(movimento.checked);
    };
    testo.addEventListener('change', () => { ricorda('testoGrande', testo.checked); applica(); this.misuraBarra?.(); });
    movimento.addEventListener('change', () => { ricorda('movimentoRidotto', movimento.checked); applica(); });
    this.applicaPreferenze = applica;
    this.qualitaScelta = ricordato('qualita', null);          // null: nessuno l'ha mai scelta
    this.qualitaRicordata = this.qualitaScelta || 'alta';
    this.segna('#seg-qualita', this.qualitaRicordata);

    addEventListener('keydown', e => {
      if (e.repeat || !this.dentro || (e.target.closest && e.target.closest('input'))) return;
      if (e.code === 'KeyC' && !az.inVolo()) this.certezza();
      if (e.code === 'KeyF') this.volo();
      if (e.code === 'KeyI' && this.vicino) this.apri(this.vicino);
      if (e.code === 'KeyR') az.racconto();
      if (e.code === 'Escape') this.chiudiDestra();
    });

    // la legenda in parole di tutti i giorni; le definizioni precise restano in materiali.js e nel PIANO
    const SEMPLICE = { documentato: 'lo dicono le fonti, o c\'è ancora oggi', dedotto: 'ricavato da indizi: resti senza data, piante più tarde, confronti', ipotesi: 'ricostruito per somiglianza, senza una prova diretta' };
    $('#legenda').innerHTML = '<b>Che cosa è certo</b>' + Object.entries(LIVELLI)
      .map(([k, l]) => `<div><i style="background:${l.colore}"></i><span>${l.nome}<small>${SEMPLICE[k] || l.testo}</small></span></div>`).join('');
    // i luoghi principali, poi le porte della cerchia in un gruppo che si apre
    const voce = l => `<li><button data-id="${l.id}"><i style="background:${LIVELLI[l.forma.livello].colore}"></i>${esc(l.nome)}</button></li>`;
    const porte = LUOGHI.filter(l => l.gruppo === 'porte');
    $('#elenco-luoghi').innerHTML = LUOGHI.filter(l => !l.gruppo).map(voce).join('') +
      (porte.length ? `<li class="gruppo"><details><summary>Le porte della cerchia (${porte.length})</summary><ul>${porte.map(voce).join('')}</ul></details></li>` : '');
    for (const b of document.querySelectorAll('#elenco-luoghi button')) b.addEventListener('click', () => {
      const l = LUOGHI.find(x => x.id === b.dataset.id);
      az.vai(l); this.apri(l);
    });
    $('#vicino').addEventListener('click', e => { if (e.target.closest('.leggi') && this.vicino) this.apri(this.vicino); });

    // a Campi non c'è la visita della città: si entra nel castello
    if (MONDO === 'campi') this.soloEsplora('Entra nel castello', 'gli invitati sono già a tavola');
  }

  /** Un solo pulsante d'ingresso (Campi, o chi arriva dal gioco su una scena). */
  soloEsplora(titolo, sotto) {
    for (const id of ['#b-visita-inizio', '#b-visita-elenco', '#b-visita-aiuto']) $(id).hidden = true;
    $('#entra').innerHTML = `${esc(titolo)}<small>${esc(sotto)}</small>`;
    $('#entra').classList.add('primario');
    $('.scelte-avvio').style.gridTemplateColumns = '1fr';
  }

  scegli(modo) {
    if (this.pronta) { this.az.entra(modo); return; }
    this.scelta = modo;
    for (const id of ['#b-visita-inizio', '#entra']) $(id).setAttribute('aria-busy', 'true');
    // la conferma sta sul pulsante scelto, che si vede anche sugli schermi bassi
    const b = $(modo === 'visita' ? '#b-visita-inizio' : '#entra');
    b.querySelector('small').textContent = 'entro appena la città è pronta…';
  }

  /** Il caricamento: frazione da 0 a 1, che cosa si sta facendo, quanto manca in secondi. */
  caricamento(f, fase, restano) {
    const pc = Math.round(Math.max(0, Math.min(1, f)) * 100);
    // il tempo che resta non risale mai: una stima che cresce sembra un passo indietro
    if (this.restano !== undefined) restano = Math.min(this.restano, restano);
    this.restano = restano;
    $('#riempimento').style.width = pc + '%';
    $('#traccia').setAttribute('aria-valuenow', pc);
    const quanto = restano > 1.5 ? ` · ancora circa ${restano < 10 ? Math.ceil(restano) : Math.round(restano / 5) * 5} secondi` : pc >= 90 ? ' · quasi pronta' : '';
    $('#progresso').textContent = `Preparo la città: ${pc}%${quanto}`;
    if (!this.scelta && fase) $('#fase').textContent = fase;
  }
  progresso(msg) { $('#fase').textContent = msg; }

  pronto() {
    this.pronta = true;
    $('.caricamento').classList.add('pronto');
    $('#progresso').textContent = 'La città è pronta.';
    $('#fase').textContent = '';
    for (const id of ['#b-visita-inizio', '#entra']) $(id).removeAttribute('aria-busy');
    if (this.scelta) this.az.entra(this.scelta);
    else ($('#b-visita-inizio').hidden ? $('#entra') : $('#b-visita-inizio')).focus();
  }

  /** Se qualcosa va storto: lo si dice in parole semplici, con un pulsante per riprovare. */
  errore(testo) {
    $('.caricamento').innerHTML = `<p class="errore"><b>Non sono riuscito a preparare la città.</b><br>${esc(testo)}</p>`;
    $('.scelte-avvio').innerHTML = '<button class="grande primario" onclick="location.reload()">Riprova</button>';
    $('#come').hidden = true;
  }

  mostra() {
    this.dentro = true;
    $('#avvio').hidden = true;
    for (const s of ['#testata', '#barra']) $(s).hidden = false;
    // i riquadri in basso stanno sempre sopra la barra, anche quando va a capo
    const barra = $('#barra');
    this.misuraBarra = () => document.documentElement.style.setProperty('--sopra-barra', (barra.getBoundingClientRect().height + 28) + 'px');
    this.misuraBarra();
    if (window.ResizeObserver) new ResizeObserver(this.misuraBarra).observe(barra);
  }

  /** Un messaggio breve in alto, che sparisce da solo. */
  avviso(testo, ms = 5000) {
    const a = $('#avviso');
    a.textContent = testo; a.hidden = false;
    clearTimeout(this.tAvviso);
    this.tAvviso = setTimeout(() => { a.hidden = true; }, ms);
  }
  nascondiAvviso() { $('#avviso').hidden = true; }

  segna(gruppo, v) { for (const b of document.querySelectorAll(gruppo + ' button')) b.setAttribute('aria-pressed', b.dataset.v === v); }

  chiudiDestra() { for (const s of DESTRA) $(s).hidden = true; }
  alterna(id) {
    const aperto = !$(id).hidden;
    this.chiudiDestra();
    $(id).hidden = aperto;
  }

  certezza() {
    const on = $('#b-certezza').getAttribute('aria-pressed') !== 'true';
    this.statoCertezza(on);
    this.az.certezza(on);
  }
  statoCertezza(on) {
    $('#b-certezza').setAttribute('aria-pressed', on);
    $('#legenda').hidden = !on;
  }
  volo() {
    const on = $('#b-volo').getAttribute('aria-pressed') !== 'true';
    $('#b-volo').setAttribute('aria-pressed', on);
    this.az.volo(on);
    if (on) this.avviso('Tocca un punto della città per volarci sopra. Per tornare a piedi, premi di nuovo «Dall\'alto».', 6000);
  }
  elenco() { this.alterna('#elenco'); }

  /** Lo stato dei pulsanti quando a cambiarlo è il racconto o la visita, non un clic. */
  statoVolo(on) { $('#b-volo').setAttribute('aria-pressed', on); }
  statoRacconto(on) { $('#b-racconto').setAttribute('aria-pressed', on); }

  /** Sulla schermata d'avvio: la scena da cui arriva chi viene dal gioco. */
  scenaIniziale(testo) {
    const p = $('#avvio-scena'); p.textContent = testo; p.hidden = !testo;
    if (testo) this.soloEsplora('Entra nella scena', 'la città si apre lì, con il racconto');
  }

  ora(testo, canonica) { $('#ora').textContent = `${testo} · ${canonica}`; }

  /** La giornata mostrata: testata, avvio, impostazioni e limiti del cursore dell'ora (dall'alba). */
  giornata(g, alba, ora) {
    $('#quando').textContent = g.titolo;
    $('#quando').title = g.nota;
    $('#avvio .data').textContent = `${g.titolo} · ${g.nota}`;
    this.segna('#seg-giorno', g.id);
    for (const b of document.querySelectorAll('#seg-giorno button')) b.disabled = MONDO === 'campi';
    $('#nota-giorno').textContent = MONDO === 'campi' ? 'A Campi c\'è un giorno solo: il convito di gennaio.'
      : g.id === 'pasqua' ? 'La mattina del delitto: botteghe chiuse, campane a festa.' : 'Il giorno della promessa rotta: botteghe aperte, mercato.';
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
    v.innerHTML = `<b>${esc(l.nome)}</b>${badge(l.forma.livello)}<button class="leggi" title="Tasto I">Leggi la scheda</button>`;
  }

  apri(l) {
    this.chiudiDestra();
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
    $('#scheda').scrollTop = 0;
  }
}
