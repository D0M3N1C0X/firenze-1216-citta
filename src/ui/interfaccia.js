import { LIVELLI } from '../mondo/materiali.js';
import { LUOGHI as TUTTI } from '../dati/luoghi.js';
import { MONDO, mondoDi } from '../mondo/dove.js';
import { voce } from './voce.js';
import { applicaTesti, fase as faseL, giornata as giornataL, impostaLingua, inglese, lang, ora as oraL, scheda as schedaL, suLingua, t } from './lingua.js';

// i luoghi del mondo in cui si è: la città, oppure un luogo a parte (Campi)
const LUOGHI = TUTTI.filter(l => mondoDi(l) === MONDO);

/* =====================================================================
   L'INTERFACCIA

   Pensata per chiunque, anche per chi non ha mai usato un videogioco:
   due scelte grandi all'ingresso (visita guidata o esplora da solo), una
   barra che dice quanto manca al caricamento, pulsanti grandi con parole
   di tutti i giorni, un aiuto, e le impostazioni (lingua, giornata,
   immagini, testo più grande, movimento ridotto, voce, mappa) che il
   dispositivo ricorda. Tutti i testi passano da ui/lingua.js: italiano o
   inglese, e si cambia senza ricaricare la città.
   ===================================================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// [da verificare] (e in inglese [to be checked]) e «le fonti divergono» restano visibili anche nella scheda
const evidenzia = s => esc(s).replace(/\[(da verificare|to be checked)[^\]]*\]/g, m => `<span class="verifica">${m}</span>`);
const badge = l => `<span class="badge" style="background:${LIVELLI[l].colore}">${t('livello.' + l)}</span>`;

// le preferenze restano sul dispositivo; se il browser non le salva, si va avanti senza
const ricorda = (k, v) => { try { localStorage.setItem('citta.' + k, JSON.stringify(v)); } catch (e) { /* niente */ } };
const ricordato = (k, def) => { try { const v = localStorage.getItem('citta.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };

const DESTRA = ['#scheda', '#elenco', '#aiuto', '#impostazioni'];

export class Interfaccia {
  /**
   * @param {object} az azioni: entra(modo), visita(), certezza(on), volo(on), inVolo(), ora(h), vai(luogo),
   *   qualita(v), giorno(id), racconto(), movimentoRidotto(on), leggiTappe(on), mappa(on), lingua(l)
   */
  constructor(az) {
    this.az = az;
    this.vicino = null;
    this.pronta = false;
    this.scelta = null;
    this.dentro = false;
    this.aperta = null;          // la scheda aperta, per ridisegnarla se cambia la lingua
    applicaTesti();
    voce.lingua = inglese() ? 'en-GB' : 'it-IT';

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
    for (const b of document.querySelectorAll('.destra > .chiudi')) b.addEventListener('click', () => { b.parentElement.hidden = true; if (b.parentElement.id === 'scheda') this.aperta = null; });

    // impostazioni
    for (const b of document.querySelectorAll('#seg-lingua button')) b.addEventListener('click', () => impostaLingua(b.dataset.v));
    this.segna('#seg-lingua', lang());
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
    // leggere da sola ogni tappa; la mappa nell'angolo
    const leggi = $('#i-voce'), mappa = $('#i-mappa');
    if (!voce.disponibile) $('#riga-voce').hidden = true;
    leggi.checked = ricordato('leggiTappe', false);
    mappa.checked = ricordato('mappa', true);
    leggi.addEventListener('change', () => { ricorda('leggiTappe', leggi.checked); az.leggiTappe?.(leggi.checked); if (!leggi.checked) voce.ferma(); });
    mappa.addEventListener('change', () => { ricorda('mappa', mappa.checked); az.mappa?.(mappa.checked); });
    this.leggiTappe = leggi.checked;
    this.conMappa = mappa.checked;
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

    this.disegnaLegenda();
    this.disegnaElenco();
    $('#elenco-luoghi').addEventListener('click', e => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      const l = LUOGHI.find(x => x.id === b.dataset.id);
      az.vai(l); this.apri(l);
    });
    $('#vicino').addEventListener('click', e => { if (e.target.closest('.leggi') && this.vicino) this.apri(this.vicino); });

    // a Campi non c'è la visita della città: si entra nel castello
    if (MONDO === 'campi') this.soloEsplora('campi.entra');

    // la lingua cambia: si ridisegna quello che non è testo fisso della pagina
    suLingua(() => {
      voce.ferma();
      voce.lingua = inglese() ? 'en-GB' : 'it-IT';
      this.segna('#seg-lingua', lang());
      this.disegnaLegenda();
      this.disegnaElenco();
      if (this.giornataMostrata) this.giornata(...this.giornataMostrata);
      if (this.oraMostrata) this.ora(...this.oraMostrata);
      const v = this.vicino; this.vicino = undefined; this.luogoVicino(v);
      if (this.aperta && !$('#scheda').hidden) this.apri(this.aperta);
      if (!this.pronta && this.ultimoCarico) this.caricamento(...this.ultimoCarico);
      if (this.pronta && !this.dentro) $('#progresso').textContent = t('carico.pronta');
      this.az.lingua?.(lang());
    });
  }

  /** La legenda in parole di tutti i giorni; le definizioni precise restano in materiali.js e nel PIANO. */
  disegnaLegenda() {
    $('#legenda').innerHTML = `<b>${esc(t('legenda.titolo'))}</b>` + Object.entries(LIVELLI)
      .map(([k, l]) => `<div><i style="background:${l.colore}"></i><span>${t('livello.' + k)}<small>${t('legenda.' + k)}</small></span></div>`).join('');
  }

  /** I luoghi principali, poi le porte della cerchia in un gruppo che si apre. */
  disegnaElenco() {
    const voceElenco = l => `<li><button data-id="${l.id}"><i style="background:${LIVELLI[l.forma.livello].colore}"></i>${esc(schedaL(l).nome)}</button></li>`;
    const porte = LUOGHI.filter(l => l.gruppo === 'porte');
    $('#elenco-luoghi').innerHTML = LUOGHI.filter(l => !l.gruppo).map(voceElenco).join('') +
      (porte.length ? `<li class="gruppo"><details><summary>${esc(t('elenco.porte', { n: porte.length }))}</summary><ul>${porte.map(voceElenco).join('')}</ul></details></li>` : '');
  }

  /** Un solo pulsante d'ingresso (Campi, o chi arriva dal gioco su una scena). */
  soloEsplora(chiave) {
    for (const id of ['#b-visita-inizio', '#b-visita-elenco', '#b-visita-aiuto']) $(id).hidden = true;
    const b = $('#entra');
    b.dataset.tHtml = chiave; b.innerHTML = t(chiave);
    b.classList.add('primario');
    $('.scelte-avvio').style.gridTemplateColumns = '1fr';
  }

  scegli(modo) {
    if (this.pronta) { this.az.entra(modo); return; }
    this.scelta = modo;
    for (const id of ['#b-visita-inizio', '#entra']) $(id).setAttribute('aria-busy', 'true');
    // la conferma sta sul pulsante scelto, che si vede anche sugli schermi bassi
    const b = $(modo === 'visita' ? '#b-visita-inizio' : '#entra');
    b.querySelector('small').textContent = t('carico.entro');
  }

  /** Il caricamento: frazione da 0 a 1, che cosa si sta facendo, quanto manca in secondi. */
  caricamento(f, fase, restano) {
    this.ultimoCarico = [f, fase, restano];
    const pc = Math.round(Math.max(0, Math.min(1, f)) * 100);
    // il tempo che resta non risale mai: una stima che cresce sembra un passo indietro
    if (this.restano !== undefined) restano = Math.min(this.restano, restano);
    this.restano = restano;
    $('#riempimento').style.width = pc + '%';
    $('#traccia').setAttribute('aria-valuenow', pc);
    const quanto = restano > 1.5 ? t('carico.ancora', { n: restano < 10 ? Math.ceil(restano) : Math.round(restano / 5) * 5 }) : pc >= 90 ? t('carico.quasi') : '';
    $('#progresso').textContent = t('carico.titolo', { pc, quanto });
    if (!this.scelta && fase) $('#fase').textContent = faseL(fase);
  }
  progresso(msg) { $('#fase').textContent = faseL(msg); }

  pronto() {
    this.pronta = true;
    $('.caricamento').classList.add('pronto');
    $('#progresso').textContent = t('carico.pronta');
    $('#fase').textContent = '';
    for (const id of ['#b-visita-inizio', '#entra']) $(id).removeAttribute('aria-busy');
    if (this.scelta) this.az.entra(this.scelta);
    else ($('#b-visita-inizio').hidden ? $('#entra') : $('#b-visita-inizio')).focus();
  }

  /** Se qualcosa va storto: lo si dice in parole semplici, con un pulsante per riprovare. */
  errore(dettaglio) {
    $('.caricamento').innerHTML = `<p class="errore"><b>${esc(t('errore.titolo'))}</b><br>${esc(t('errore.testo', { e: dettaglio }))}</p>`;
    $('.scelte-avvio').innerHTML = `<button class="grande primario" onclick="location.reload()">${esc(t('errore.riprova'))}</button>`;
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

  chiudiDestra() { if (voce.bottone?.closest('#scheda')) voce.ferma(); for (const s of DESTRA) $(s).hidden = true; this.aperta = null; }
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
    if (on) this.avviso(t('avviso.volo'), 6000);
  }
  elenco() { this.alterna('#elenco'); }

  /** Lo stato dei pulsanti quando a cambiarlo è il racconto o la visita, non un clic. */
  statoVolo(on) { $('#b-volo').setAttribute('aria-pressed', on); }
  statoRacconto(on) { $('#b-racconto').setAttribute('aria-pressed', on); }

  /** Sulla schermata d'avvio: la scena da cui arriva chi viene dal gioco. */
  scenaIniziale(testo) {
    const p = $('#avvio-scena'); p.textContent = testo; p.hidden = !testo;
    if (testo) this.soloEsplora('scena.entra');
  }

  /** L'ora in testata: l'ora solare e l'ora canonica (in inglese con i nomi della liturgia). */
  ora(h, canonica) {
    this.oraMostrata = [h, canonica];
    $('#ora').textContent = t('ora.solare', { h, c: oraL(canonica) });
  }

  /** La giornata mostrata: testata, avvio, impostazioni e limiti del cursore dell'ora (dall'alba). */
  giornata(g0, alba, ora) {
    this.giornataMostrata = [g0, alba, ora];
    const g = giornataL(g0);
    $('#quando').textContent = g.titolo;
    $('#quando').title = g.nota;
    $('#avvio .data').textContent = `${g.titolo} · ${g.nota}`;
    this.segna('#seg-giorno', g.id);
    for (const b of document.querySelectorAll('#seg-giorno button')) b.disabled = MONDO === 'campi';
    $('#nota-giorno').textContent = MONDO === 'campi' ? t('nota.campi') : g.id === 'pasqua' ? t('nota.pasqua') : t('nota.febbraio');
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
    v.innerHTML = `<b>${esc(schedaL(l).nome)}</b>${badge(l.forma.livello)}<button class="leggi" title="I">${esc(t('vicino.leggi'))}</button>`;
  }

  apri(l) {
    this.chiudiDestra();
    this.aperta = l;
    const s = schedaL(l);
    $('#scheda').hidden = false;
    $('#scheda-corpo').innerHTML = `
      <h2>${esc(s.nome)}</h2>
      ${voce.disponibile ? `<button class="ascolta" aria-pressed="false">${esc(t('ascolta'))}</button>` : ''}
      <div class="livelli">
        <div class="livello"><b>${esc(t('scheda.luogo'))}</b><span>${badge(l.luogo.livello)}${evidenzia(s.luogo)}</span></div>
        <div class="livello"><b>${esc(t('scheda.forma'))}</b><span>${badge(l.forma.livello)}${evidenzia(s.forma)}</span></div>
      </div>
      <p>${evidenzia(s.testo)}</p>
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#6b5a42;margin:16px 0 4px">${esc(inglese() ? t('scheda.fonti.it') : t('scheda.fonti'))}</h3>
      <ul class="fonti" lang="it">${l.fonti.map(f => `<li>${evidenzia(f)}</li>`).join('')}</ul>`;
    $('#scheda').scrollTop = 0;
    const b = $('#scheda .ascolta');
    // si legge il racconto della scheda, senza i segni [da verificare]: quelli restano scritti
    if (b) b.addEventListener('click', () => voce.leggi(s.nome + '. ' + s.testo.replace(/\s*\[[^\]]*\]/g, ''), b));
  }
}
