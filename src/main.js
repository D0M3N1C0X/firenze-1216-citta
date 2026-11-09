import {
  AgXToneMapping, Clock, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

import { FIUME, STRADE } from './dati/osm.js';
import { strade1216 } from './dati/strade-1216.js';
import { EPOCA, NEL_1300 } from './mondo/epoca.js';
import { PALIZZATA_1300, RIEMPIMENTO_1300, componiStrade1300, lottiBorghi1300 } from './mondo/citta-1300.js';
import { costruisciMonumenti1300 } from './mondo/monumenti-1300.js';
import { ORA_ZUFFA, Zuffa } from './mondo/zuffa.js';
import { TRACCIATO, dentroTracciato } from './dati/cerchia.js';
import { LUOGHI, dellEpoca } from './dati/luoghi.js';
import { GIORNATA_PREDEFINITA, GIORNATE } from './dati/giornate.js';
import { SCENE } from './dati/scene.js';
import { figureNegliInterni } from './dati/interni.js';
import { COPIONE } from './dati/copione.js';
import { creaMateriali, impostaAnisotropia } from './mondo/materiali.js';
import { Cielo } from './mondo/cielo.js';
import { creaAcqua, creaTerreno, quota, quotaPianura } from './mondo/terreno.js';
import { costruisciCampi } from './mondo/campi.js';
import { MONDO, mondoDi } from './mondo/dove.js';
import { preparaCampo } from './mondo/fiume.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from './mondo/griglia.js';
import { Cantiere } from './mondo/cantiere.js';
import { costruisciLotti, lottizza, pozziNeiCortili } from './mondo/edifici.js';
import { KIT, caricaKit } from './mondo/kit.js';
import { caricaModelli } from './mondo/modelli.js';
import { PONTE_ASSE, costruisciMonumenti, quotaPavimento, sulPonte } from './mondo/monumenti.js';
import { costruisciBorghi } from './mondo/fondale.js';
import { costruisciMura, costruisciPalizzata, ipotesiLatoSud } from './mondo/mura.js';
import { creaVegetazione } from './mondo/vegetazione.js';
import { costruisciMestieri, figureDeiMestieri, grigliaDeiMestieri, suoniDeiMestieri } from './mondo/mestieri.js';
import { Abitanti } from './mondo/abitanti.js';
import { costruisciOggi, diradaAlberi, postoLibero } from './mondo/oggi.js';
import { COLORI_RESTA, oggiDi } from './dati/oggi-luoghi.js';
import { caricaAnimali, caricaFigure } from './mondo/figure.js';
import { Suoni } from './mondo/suoni.js';
import { alba, formatoOra, oraCanonica } from './mondo/sole.js';
import { Controlli } from './controlli.js';
import { Interfaccia } from './ui/interfaccia.js';
import { t } from './ui/lingua.js';
import { Racconto } from './ui/racconto.js';
import { Visita } from './ui/visita.js';
import { Mappa } from './ui/mappa.js';
import { TAPPE } from './dati/visita.js';

/* =====================================================================
   FIRENZE 1216 — LA CITTÀ  ·  prototipo v0.3: dal capo del Ponte Vecchio a Santa Reparata
   1 unità = 1 metro. Origine al capo nord del ponte; x est, z sud.
   ===================================================================== */

const params = new URLSearchParams(location.search);
// cede il passo al browser perché aggiorni il messaggio. Un MessageChannel
// e non un setTimeout: i timer di una scheda in background vengono
// rallentati fino a fermare la costruzione, i messaggi no.
/** Il rettangolo che contiene la cerchia: dove la lottizzazione cerca posto. */
const RIQUADRO_CERCHIA = [Math.min(...TRACCIATO.map(p => p[0])), Math.min(...TRACCIATO.map(p => p[1])), Math.max(...TRACCIATO.map(p => p[0])), Math.max(...TRACCIATO.map(p => p[1]))];

const pausa = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });

// a Campi la schermata d'avvio parla del convito, non della mattina di Pasqua
if (MONDO === 'campi') {
  document.title = 'Campi, il convito del 1216 — Firenze 1216';
  const chiave = (sel, k, html) => { const el = document.querySelector(sel); if (html) el.dataset.tHtml = k; else el.dataset.t = k; };
  chiave('#titolo', 'campi.titolo');
  chiave('#avvio .intro', 'campi.intro', true);
  document.querySelector('#avvio .intro').removeAttribute('data-t');
  chiave('#avvio details ul', 'campi.nonE.lista', true);
}

// nel 1300 la schermata d'avvio parla della città dei cronisti; la visita guidata è del 1216 e qui non si offre
if (NEL_1300 && MONDO === 'citta') {
  document.title = 'Firenze, Calendimaggio 1300 — la città dei cronisti';
  const chiave = (sel, k, html) => { const el = document.querySelector(sel); if (html) { el.dataset.tHtml = k; el.removeAttribute('data-t'); } else el.dataset.t = k; };
  chiave('#titolo', 'avvio1300.titolo');
  chiave('#avvio .intro', 'avvio1300.intro', true);
  chiave('#avvio details ul', 'avvio1300.nonE.lista', true);
  document.querySelector('#b-visita-inizio').hidden = true;
  document.querySelector('#entra').classList.add('primario');
}

// senza WebGL la città non si può disegnare: lo si dice subito, in parole semplici
if (!document.createElement('canvas').getContext('webgl2')) {
  document.querySelector('.caricamento').innerHTML = `<p class="errore">${t('errore.webgl')}</p>`;
  document.querySelector('.scelte-avvio').hidden = true;
  throw new Error('WebGL 2 non disponibile');
}
const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('cattura') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = AgXToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 40000);
// dal gioco si arriva su una scena: ?scena=IV3 (dati/scene.js)
const scenaIniziale = SCENE.find(s => s.id === params.get('scena')) || null;
// una scena di un altro mondo (dal gioco si arriva con ?scena=I1, che è a Campi): si va lì
if (scenaIniziale?.vista && mondoDi(scenaIniziale) !== MONDO) {
  if (mondoDi(scenaIniziale) === 'citta') params.delete('luogo'); else params.set('luogo', mondoDi(scenaIniziale));
  location.replace('?' + params.toString());
}
// le scene del copione e la visita sono nel 1216: chi ci arriva dal 1300 torna al 1216
if (NEL_1300 && (scenaIniziale || params.has('racconto') || params.has('visita'))) { params.delete('epoca'); location.replace('?' + params.toString()); }
// le giornate dell'epoca: nel 1300 c'è solo il 1° maggio (dati/giornate.js)
const giornataDellEpoca = g => g && (g.epoca || '1216') === EPOCA ? g : null;
let giornata = giornataDellEpoca(GIORNATE[params.get('giorno')]) || giornataDellEpoca(GIORNATE[scenaIniziale?.giornata]) || GIORNATE[MONDO === 'campi' ? 'gennaio' : NEL_1300 ? 'maggio' : GIORNATA_PREDEFINITA];
let ora = +(params.get('ora') || scenaIniziale?.ora || giornata.ora);
let qualita = 'alta';         // dalle impostazioni ricordate, sotto
let movimentoRidotto = false;
let mondo = null;
let modelli = null;          // le figure di Blender, caricate una volta sola
let animali = null;          // cavalli, muli e asini di Blender
let certezzaAccesa = false;
// il 1216 o oggi (mondo/oggi.js): la città di oggi si costruisce la prima volta che serve
let epoca = '1216', oggi = null, costruendoOggi = null;

const ui = new Interfaccia({
  entra,
  visita: () => apriVisita(),
  certezza: on => impostaCertezza(on),
  giorno: id => { if (MONDO === 'citta' && id !== giornata.id) impostaGiornata(id); },
  volo: on => mondo.controlli.impostaVolo(on),
  epoca: e => impostaEpoca(e === 'base' ? '1216' : e),
  ricostruisci: e => ricostruisci(e),
  inVolo: () => mondo?.controlli.volo,
  ora: h => { ora = h; impostaOra(); },
  vai: l => vaiA(l),
  qualita: v => { if (v !== qualita) cambiaQualita(); },
  racconto: () => { if (NEL_1300) return ricostruisci('1216', { racconto: '' }); visita.chiudi(false); racconto.alterna(); },
  movimentoRidotto: on => { movimentoRidotto = on; if (mondo) mondo.controlli.movimentoRidotto = on; },
  leggiTappe: on => { visita.leggiDaSola = on; },
  mappa: on => mappa?.mostra(on)
});
qualita = ui.qualitaRicordata === 'media' ? 'media' : 'alta';
renderer.setPixelRatio(qualita === 'alta' ? Math.min(devicePixelRatio, 2) : 1);
ui.applicaPreferenze();
// la mappa con «tu sei qui» (ui/mappa.js): solo in città, dopo che le strade sono pronte
let mappa = null;
const racconto = new Racconto({
  vai: s => vaiScena(s),
  scheda: l => ui.apri(l),
  aperto: on => ui.statoRacconto(on)
});
// la visita guidata (dati/visita.js): a ogni tappa la città porta nel punto di vista
let certezzaDallaVisita = false;
const visita = new Visita({
  vai: t => vaiTappa(t),
  scheda: l => ui.apri(l),
  aperta: (on, finita) => {
    if (on) return;
    if (certezzaDallaVisita) { certezzaDallaVisita = false; impostaCertezza(false); }
    if (finita) {
      collocaVista(mondo.controlli, { x: 20, z: -46, verso: [9, -27] });
      ui.avviso(t('avviso.dopoVisita'), 7000);
    }
  }
});
visita.leggiDaSola = ui.leggiTappe;
if (scenaIniziale) ui.scenaIniziale(t('scena.dalGioco', { id: scenaIniziale.id, t: COPIONE[scenaIniziale.id].titolo }));
// chi arriva dal gioco (?gioco) ci torna con un pulsante. Il gioco apre la città in una scheda
// nuova: chiuderla riporta alla sua schermata, con la partita dov'era
if (params.has('gioco')) for (const b of document.querySelectorAll('.torna-gioco')) {
  b.hidden = false;
  b.addEventListener('click', () => {
    window.close();
    // un browser chiude da sé solo le schede aperte da un link: se questa resta, lo si dice
    setTimeout(() => ui.avviso(t('gioco.chiudi'), 7000), 300);
  });
}

// quanto pesa ogni fase sul tempo di caricamento (misure del 22/10/2026 su questo Mac):
// servono alla barra dell'avvio, che così avanza più o meno con il tempo vero
const PESI = {
  'Impasto la calce e cuocio i coppi…': 0.22, 'Il cielo del mattino…': 0.002, 'Il letto dell\'Arno e le colline…': 0.09,
  'Le strade del 1216…': 0.005, 'Il ponte, le chiese, le torri…': 0.015, 'Le mura, le porte, il fossato…': 0.003,
  'Le case, una per una…': 0.50, 'Muro su muro…': 0.145, 'La gente esce di casa…': 0.02
};
const PESI_CAMPI = { 'Impasto la calce e cuocio i coppi…': 0.55, 'Il cielo di gennaio…': 0.05, 'La piana di Campi…': 0.15, 'Il castello dei Mazzinghi…': 0.1, 'Gli invitati prendono posto…': 0.15 };
const tempiCaricamento = [];
/** L'ultima durata del caricamento su questo dispositivo, per dire quanto manca (o la salva). */
function ricordaDurata(s) {
  const k = 'citta.durata.' + MONDO;
  try { if (s) localStorage.setItem(k, s.toFixed(1)); else return +localStorage.getItem(k) || 0; } catch (e) { return 0; }
}
const opzComandi = () => ({ scene, avviso: k => ui.avviso(t(k)), gesto: () => ui.nascondiAvviso() });

async function costruisci() {
  const t0 = performance.now();
  let tf = t0, fase = '', fatto = 0;
  const pesi = MONDO === 'campi' ? PESI_CAMPI : PESI;
  const durata = ricordaDurata() || (MONDO === 'campi' ? 25 : 40);
  const mostra = f => {
    const passati = (performance.now() - t0) / 1000;
    // all'inizio conta di più la durata dell'ultima volta; da metà in poi il passo di adesso
    const totale = f > 0.5 ? passati / f : Math.max(durata, passati / Math.max(f, 0.05));
    ui.caricamento(f, fase, Math.max(0, totale - passati));
  };
  const passo = async msg => {
    const t = performance.now();
    if (fase) { tempiCaricamento.push(`${fase} ${((t - tf) / 1000).toFixed(1)}s`); fatto += pesi[fase] || 0; }
    tf = t; fase = msg; mostra(fatto); await pausa();
  };
  await passo('Impasto la calce e cuocio i coppi…');
  // le figure si caricano mentre si fa il resto; se mancano si usano quelle generate
  const figure = caricaFigure().catch(e => { console.warn('figure di Blender non caricate:', e); return null; });
  const bestie = caricaAnimali().catch(e => { console.warn('animali di Blender non caricati:', e); return null; });
  // il kit edilizio (finestre, porte, botteghe, pozzi): senza, le case usano forme semplici
  const kit = params.has('senzakit') ? null : caricaKit().catch(e => { console.warn('kit edilizio non caricato:', e); return null; });
  // i monumenti modellati in Blender: senza, quelli generati
  const monumentiBlender = params.has('senzamodelli') ? null : caricaModelli().catch(e => { console.warn('monumenti di Blender non caricati:', e); return null; });
  await Promise.all([
    kit, monumentiBlender,
    creaMateriali('alta', (k, n) => mostra(fatto + pesi[fase] * k / n)),
    MONDO === 'citta' ? preparaCampo() : null
  ]);
  impostaAnisotropia(renderer.capabilities.getMaxAnisotropy());
  console.info(`materiali e fiume in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  if (MONDO === 'campi') return costruisciCampiMondo(passo, figure, bestie, t0);

  await passo('Il cielo del mattino…');
  const cielo = new Cielo(renderer, scene);

  await passo('Il letto dell\'Arno e le colline…');
  // le strade del 1216 servono già qui: gli alberi non crescono sulle strade fuori porta
  // nel 1300 (?epoca=1300) i dati della città grande si caricano solo adesso, in un pezzo a parte
  const d1300 = NEL_1300 ? await carica1300() : null;
  const strade = NEL_1300 ? d1300.strade : strade1216(STRADE);
  creaTerreno(scene);
  // gli alberi si ricordano: dove oggi ci sono le case, nella Firenze di oggi si tolgono
  const primaDegliAlberi = scene.children.length;
  creaVegetazione(scene, { evita: strade.filter(s => NEL_1300 ? s.fuoriVecchia : s.fuori) });
  const alberi = scene.children.slice(primaDegliAlberi);
  const acqua = creaAcqua(scene, cielo.dir);

  await passo(NEL_1300 ? 'Le strade del 1300…' : 'Le strade del 1216…');
  // da −1100 a 1100 m: la cerchia del 1172–75 e i borghi fuori porta; nel 1300 fino alla cerchia nuova
  const griglia = NEL_1300 ? new Griglia(-2000, 1800) : new Griglia(-1100, 1100);
  griglia.poligono(FIUME, C_FIUME);
  for (const s of strade) {
    if (s.area) griglia.poligono(s.punti, PIAZZA, false);
    else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
  }

  await passo('Il ponte, le chiese, le torri…');
  const cantiere = new Cantiere();
  const monumenti = costruisciMonumenti(cantiere, griglia);
  // nel 1300: il cantiere dei Priori, il guasto, la loggia del grano, il palazzo del Popolo (mondo/monumenti-1300.js)
  if (NEL_1300) console.info('monumenti del 1300:', costruisciMonumenti1300(cantiere, griglia).join(', '));

  await passo('Le mura, le porte, il fossato…');
  costruisciMura(cantiere, griglia);
  ipotesiLatoSud(cantiere);
  if (NEL_1300) { d1300.muraOltrarno1300(cantiere, griglia); d1300.porteInCantiere(cantiere, griglia); }

  await passo('Le case, una per una…');
  // la città casa per casa fino alle mura (dati/cerchia.js); fuori, i borghi
  // nel 1300 la città vecchia è più fitta: più tentativi di riempire gli isolati (ipotesi)
  const lotti = lottizza(griglia, strade.filter(s => NEL_1300 ? !s.fuoriVecchia : !s.fuori), { dentro: dentroTracciato, riquadro: RIQUADRO_CERCHIA, riempimento: NEL_1300 ? RIEMPIMENTO_1300 : 28000 });
  // a blocchi, ridando la mano al browser: così la pagina non si blocca e la barra avanza
  for (let i = 0; i < lotti.length; i += 250) {
    costruisciLotti(cantiere, lotti.slice(i, i + 250));
    mostra(fatto + pesi[fase] * 0.72 * Math.min(1, (i + 250) / lotti.length)); await pausa();
  }
  const borghi = NEL_1300 ? await borghi1300(cantiere, griglia, strade, d1300, f => mostra(fatto + pesi[fase] * (0.72 + 0.14 * f))) : costruisciBorghi(cantiere, griglia, strade);
  mostra(fatto + pesi[fase] * 0.86); await pausa();
  // nel 1300 la palizzata resta solo a est di San Felice: a ovest c'è il muro duecentesco (mondo/mura-1300.js)
  if (NEL_1300) costruisciPalizzata(cantiere, griglia, PALIZZATA_1300);
  else costruisciPalizzata(cantiere, griglia);
  const pozzi = KIT.pezzi ? pozziNeiCortili(cantiere, griglia, dentroTracciato, 60, RIQUADRO_CERCHIA) : [];

  // i mestieri dei giorni di lavoro: banchi, botteghe allestite, chi vende e chi compra
  const mestieri = costruisciMestieri(cantiere, griglia, lotti, strade);
  console.info(`mestieri: ${mestieri.panni} botteghe di panni, ${mestieri.figure} figure ai banchi`);

  await passo('Muro su muro…');
  cantiere.costruisci(scene);

  await passo('La gente esce di casa…');
  // dove si cammina: il ponte, il pavimento di Santa Reparata, altrimenti il terreno
  const quotaIn = (x, z) => sulPonte(x, z) ?? quotaPavimento(x, z) ?? quota(x, z);
  modelli = params.has('manichini') ? null : await figure;
  animali = modelli ? await bestie : null;
  const controlli = new Controlli(camera, renderer.domElement, griglia, quotaIn, opzComandi());
  const partenza = params.get('da');
  // ?da=x,z,direzione: da dove si parte (lo usa anche la linea del tempo); se lì c'è una casa, il posto libero più vicino
  if (partenza) { const [x, z, y] = partenza.split(',').map(Number); const q = postoLibero(griglia, x, z) || [x, z]; controlli.colloca(q[0], q[1], y || 0, 0); }
  else if (scenaIniziale?.vista) collocaVista(controlli, scenaIniziale.vista);
  else controlli.colloca(20, -46, 2.62, -0.02);

  mondo = { cielo, acqua, griglia, cantiere, monumenti, lotti, strade, controlli, quotaIn, suoni: new Suoni(), mestieri, alberi };
  mondo.abitanti = creaAbitanti();
  creaZuffa();
  impostaGiornata(giornata.id, { ora });
  impostaComposizione();
  if (qualita !== 'alta') cielo.dimensioneOmbre(2048, 80);
  controlli.movimentoRidotto = movimentoRidotto;
  mappa = new Mappa({ vai: l => { vaiA(l); ui.apri(l); } }, LUOGHI.filter(l => mondoDi(l) === 'citta' && !l.gruppo && dellEpoca(l, EPOCA)), TAPPE.map(t => t.luogo).filter(Boolean));
  mappa.prepara(strade);
  mappa.mostra(ui.conMappa);
  await passo('');
  ricordaDurata((performance.now() - t0) / 1000);
  console.info(tempiCaricamento.join(' · '));
  console.info(`città pronta in ${((performance.now() - t0) / 1000).toFixed(1)} s · lotti ${lotti.length} · borghi ${borghi.length} · oggetti ${cantiere.mesh.length}` +
    (KIT.pezzi ? ` · kit ${(cantiere.triangoliKit / 1e6).toFixed(1)} M triangoli · pozzi ${pozzi.length}` : ' · senza kit'));
  ui.pronto();
  if (params.has('subito')) entra();
  if (params.has('visita')) apriVisita();
  if (params.get('epoca') === 'oggi') impostaEpoca('oggi');
}

/**
 * Dalla linea del tempo, verso l'altra epoca: la pagina si ricarica nello
 * stesso punto e con la stessa direzione (?da), e la città si ricostruisce
 * (mondo/epoca.js). Le scene e la giornata non passano: sono dell'epoca di prima.
 */
function ricostruisci(e, altri = {}) {
  const u = new URL(location.href);
  if (e === '1216') u.searchParams.delete('epoca'); else u.searchParams.set('epoca', e);
  for (const k of ['scena', 'racconto', 'visita', 'giorno', 'ora', 'gioco']) u.searchParams.delete(k);
  const c = mondo?.controlli;
  if (c && !c.volo) u.searchParams.set('da', `${c.pos.x.toFixed(1)},${c.pos.z.toFixed(1)},${c.yaw.toFixed(2)}`);
  u.searchParams.set('subito', '');
  for (const [k, v] of Object.entries(altri)) u.searchParams.set(k, v);
  ui.avviso(t(altri.racconto !== undefined || altri.visita !== undefined ? 'tempo.racconto' : 'tempo.ricostruisco', { e }), 60000);
  // con pausa() e non con un setTimeout, che il browser può rallentare fino a non partire più
  pausa().then(() => location.assign(u));
}

/** I dati e i costruttori del 1300, in un pezzo a parte che la città del 1216 non scarica. */
async function carica1300() {
  const [osm, strade, cerchia, mura] = await Promise.all([
    import('./dati/osm-1300.js'), import('./dati/strade-1300.js'), import('./dati/cerchia-1300.js'), import('./mondo/mura-1300.js')
  ]);
  return {
    strade: componiStrade1300(strade, osm.STRADE),
    dentroLimite: cerchia.dentroLimite, limite: cerchia.LIMITE,
    muraOltrarno1300: mura.muraOltrarno1300, porteInCantiere: mura.porteInCantiere
  };
}

/**
 * I borghi del 1300: le case lungo le strade fra la cerchia vecchia e la
 * nuova, sempre più rade allontanandosi dal centro (decisione del 6/11/2026).
 * Fitte vicino alla cerchia vecchia, dove i borghi esistevano già nel 1216;
 * verso le mura nuove orti e campi. Le proporzioni sono ipotesi.
 */
async function borghi1300(cantiere, griglia, strade, d1300, avanza) {
  const lotti = lottiBorghi1300(griglia, strade, d1300.dentroLimite, d1300.limite);
  for (let i = 0; i < lotti.length; i += 250) {
    costruisciLotti(cantiere, lotti.slice(i, i + 250));
    avanza(Math.min(1, (i + 250) / lotti.length)); await pausa();
  }
  return lotti;
}

/**
 * Campi, il castello del convito: un luogo a parte (?luogo=campi). Niente
 * città, niente fiume: la piana, il castello, gli invitati a tavola.
 */
async function costruisciCampiMondo(passo, figure, bestie, t0) {
  await passo('Il cielo di gennaio…');
  const cielo = new Cielo(renderer, scene);
  await passo('La piana di Campi…');
  creaTerreno(scene, 'alta', quotaPianura, false);
  creaVegetazione(scene, { pianura: { quota: quotaPianura, libero: 70 }, tentativi: 3000 });
  await passo('Il castello dei Mazzinghi…');
  const griglia = new Griglia();
  const cantiere = new Cantiere();
  const campi = costruisciCampi(cantiere, griglia);
  cantiere.costruisci(scene);
  await passo('Gli invitati prendono posto…');
  modelli = params.has('manichini') ? null : await figure;
  animali = modelli ? await bestie : null;
  const controlli = new Controlli(camera, renderer.domElement, griglia, campi.quotaIn, opzComandi());
  collocaVista(controlli, scenaIniziale?.vista || campi.partenza);
  mondo = { cielo, acqua: null, griglia, cantiere, monumenti: null, lotti: [], strade: [], controlli, quotaIn: campi.quotaIn, suoni: new Suoni(), campi };
  mondo.abitanti = creaAbitanti();
  impostaGiornata(giornata.id, { ora });
  impostaComposizione();
  if (qualita !== 'alta') cielo.dimensioneOmbre(2048, 80);
  controlli.movimentoRidotto = movimentoRidotto;
  await passo('');
  ricordaDurata((performance.now() - t0) / 1000);
  console.info(`Campi pronto in ${((performance.now() - t0) / 1000).toFixed(1)} s · oggetti ${cantiere.mesh.length}`);
  ui.pronto();
  if (params.has('subito')) entra();
}

function creaAbitanti() {
  if (MONDO === 'campi') {
    const C = mondo.campi;
    return new Abitanti(scene, [], mondo.griglia, mondo.quotaIn, {
      modelli, animali, numero: 0,
      seduti: C.seduti.filter((_, i) => i % 7 !== 3),     // qualche posto vuoto
      fermi: C.fermi, cavalliFermi: C.cavalli
    });
  }
  return new Abitanti(scene, mondo.strade, mondo.griglia, mondo.quotaIn, {
    modelli,
    animali,
    // muli, asini e cavalli: più nei giorni di lavoro che a Pasqua (ipotesi)
    numeroAnimali: Math.round(+(params.get('gente') || giornata.gente) * (giornata.festa ? 0.04 : 0.09)),
    numeroCavalieri: Math.round(+(params.get('gente') || giornata.gente) * (giornata.festa ? 0.025 : 0.035)),
    numero: +(params.get('gente') || giornata.gente),
    raggio: 5000,             // tutta la città, fino ai borghi: le strade sono già solo quelle
    extra: [{ punti: [PONTE_ASSE.A, PONTE_ASSE.B], larghezza: 5.5 }],
    gruppi: giornata.gruppi,
    // in chiesa e nella torre degli Amidei (dati/interni.js); ai banchi nei giorni di lavoro (mondo/mestieri.js)
    fermi: [...figureNegliInterni(giornata), ...figureDeiMestieri(giornata).fermi],
    seduti: figureDeiMestieri(giornata).seduti,
    cavalliFermi: figureDeiMestieri(giornata).cavalliFermi
  });
}

/**
 * La zuffa di Calendimaggio (mondo/zuffa.js): solo nel 1300, il 1° maggio,
 * con le figure e i cavalli di Blender. La sera la città ha un orologio che
 * va da solo (un secondo vero, dodici della città): alle 18.40 la scena parte.
 */
function creaZuffa() {
  mondo.zuffa = null;
  if (!NEL_1300 || MONDO !== 'citta' || giornata.id !== 'maggio' || !modelli || !animali) return;
  mondo.zuffa = new Zuffa(mondo.abitanti, {
    griglia: mondo.griglia, varianti: modelli.varianti, animali,
    avvisa: k => ui.avviso(t(k), k === 'zuffa.dopo' ? 14000 : k === 'zuffa.presto' ? 12000 : 9000)
  });
}
const OROLOGIO_SERA = 12 / 3600;          // ore della città per secondo vero
let tOrologio = 0;

/** Cambia giornata (giornate.js): sole, foschia, botteghe, campane, gente. */
function impostaGiornata(id, opz = {}) {
  const g = GIORNATE[id];
  if (!g) return;
  const cambia = g !== giornata;
  giornata = g;
  if (opz.ora !== undefined) ora = opz.ora; else if (cambia) ora = g.ora;
  ui.giornata(g, alba(g.doy), ora);
  if (!mondo) return;
  mondo.cielo.giornata(g);
  mondo.cantiere.giornata(g);
  if (epoca === 'oggi') mostra1216(false);
  mondo.suoni.giornata(g);
  if (MONDO === 'citta') { grigliaDeiMestieri(mondo.griglia, g.festa); mondo.suoni.mestieri(suoniDeiMestieri(g)); }
  if (cambia) {
    mondo.abitanti.distruggi();
    mondo.abitanti = creaAbitanti();
    creaZuffa();
    if (certezzaAccesa || epoca === 'oggi') mondo.abitanti.visibili(false);
  }
  impostaOra();
}

/** Accende o spegne tutto quello che è del 1216: case, monumenti, mura, mestieri, gente, campagna. */
function mostra1216(on) {
  for (const m of mondo.cantiere.mesh) m.visible = on;
  if (on) { mondo.cantiere.giornata(giornata); mondo.cantiere.certezza(certezzaAccesa); }
  mondo.abitanti.visibili(on && !certezzaAccesa);
  mondo.suoni.mestieri(on ? suoniDeiMestieri(giornata) : []);
}

/**
 * Il 1216 o oggi, nello stesso punto. La prima volta la Firenze di oggi si
 * costruisce (qualche secondo); poi si scambia con il 1216 in un attimo.
 */
async function impostaEpoca(e) {
  if (costruendoOggi && !oggi) return;           // la si sta ancora costruendo
  if (MONDO !== 'citta' || !mondo || e === epoca) return ui.statoEpoca(epoca === 'oggi');
  if (e === 'oggi' && !oggi) {
    ui.avviso(t('oggi.costruisco'), 60000);
    ui.statoEpoca(true);
    try {
      const t0 = performance.now();
      // i luoghi della storia hanno un segno anche oggi, del colore di che cosa ne resta (dati/oggi-luoghi.js)
      const segni = LUOGHI.filter(l => mondoDi(l) === 'citta' && !l.gruppo && dellEpoca(l, EPOCA) && oggiDi(l)).map(l => ({ pos: l.pos, colore: COLORI_RESTA[oggiDi(l).resta] }));
      oggi = await (costruendoOggi ||= costruisciOggi(scene, { pausa, segni }));
      console.info(`Firenze di oggi in ${((performance.now() - t0) / 1000).toFixed(1)} s · ${oggi.volumi.length} volumi · oggetti ${oggi.gruppo.children.length}`);
      oggi.gruppo.visible = false;
      mappa?.preparaOggi(oggi.volumi);
    } catch (err) {
      console.error(err); costruendoOggi = null;
      ui.statoEpoca(false); ui.avviso(t('oggi.errore', { e: EPOCA }), 7000);
      return;
    }
  }
  const adesso = e === 'oggi';
  if (adesso && certezzaAccesa) impostaCertezza(false);
  epoca = e;
  mostra1216(!adesso);
  oggi.gruppo.visible = adesso;
  diradaAlberi(mondo.alberi, oggi.riquadro, adesso);
  // si cammina sulla griglia dell'epoca; chi si trova dentro un muro dell'altra si sposta di poco
  const c = mondo.controlli;
  c.ferma();
  c.griglia = adesso ? oggi.griglia : mondo.griglia;
  c.quotaIn = adesso ? oggi.quotaIn : mondo.quotaIn;
  c.yLiscia = null;
  if (!c.volo) { const q = postoLibero(c.griglia, c.pos.x, c.pos.z); if (q) { c.pos.x = q[0]; c.pos.z = q[1]; } }
  mappa?.epoca(adesso, l => COLORI_RESTA[oggiDi(l)?.resta]);
  ui.statoEpoca(adesso);
  ui.avviso(t(adesso ? 'oggi.pronta' : 'oggi.torna', { e: EPOCA }), adesso ? 9000 : 3000);
}

function impostaOra() {
  if (!mondo) return;
  mondo.cielo.imposta(ora);
  mondo.acqua?.material.uniforms.sunDirection.value.copy(mondo.cielo.dir);
  ui.ora(formatoOra(ora), oraCanonica(ora, giornata.doy));
}

/* ----------------------------------------------------- post-produzione */
let composer = null, gtao = null;
function impostaComposizione() {
  const w = innerWidth, h = innerHeight, pr = renderer.getPixelRatio();
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(pr);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  if (qualita === 'alta') {
    gtao = new GTAOPass(scene, camera, w, h);
    gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 16 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
  } else gtao = null;
  // niente bloom: il disco del sole di Sky.js supera il massimo della mezza
  // precisione e la sfocatura spargerebbe l'infinito su tutto lo schermo
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass(w * pr, h * pr));
}

function cambiaQualita() {
  qualita = qualita === 'alta' ? 'media' : 'alta';
  renderer.setPixelRatio(qualita === 'alta' ? Math.min(devicePixelRatio, 2) : 1);
  mondo.cielo.dimensioneOmbre(qualita === 'alta' ? 4096 : 2048, qualita === 'alta' ? 120 : 80);
  impostaComposizione();
  return qualita;
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) impostaComposizione();
});

/** Mette l'osservatore nel punto di vista di una scena (dati/scene.js). */
function collocaVista(c, v) {
  const yaw = Math.atan2(-(v.verso[0] - v.x), -(v.verso[1] - v.z));
  if (v.volo) {
    c.impostaVolo(true);
    c.pos.set(v.x, v.y, v.z); c.yaw = yaw;
    c.pitch = -Math.atan2(v.y - 2, Math.hypot(v.verso[0] - v.x, v.verso[1] - v.z));
  } else {
    c.impostaVolo(false);
    c.colloca(v.x, v.z, yaw, v.pitch ?? 0.04);
  }
  ui.statoVolo(c.volo);
}

/** La città va nella giornata, all'ora e nel punto di vista di una scena. */
function vaiScena(s) {
  if (epoca === 'oggi') impostaEpoca('1216');
  // una scena in un altro mondo (Campi o la città): si riapre la pagina lì
  if (mondoDi(s) !== MONDO) {
    const q = new URLSearchParams(location.search);
    for (const k of ['luogo', 'giorno', 'ora', 'da', 'scena']) q.delete(k);
    if (mondoDi(s) !== 'citta') q.set('luogo', mondoDi(s));
    q.set('scena', s.id); q.set('racconto', '');
    location.search = q.toString();
    return;
  }
  if (s.giornata) impostaGiornata(s.giornata, { ora: s.ora ?? GIORNATE[s.giornata].ora });
  if (s.vista && mondo) collocaVista(mondo.controlli, s.vista);
}

function entra(modo) {
  ui.mostra();
  mondo.controlli.attivo = true;
  mondo.suoni.avvia(camera);
  if (scenaIniziale || params.has('racconto')) racconto.apri(scenaIniziale?.id);
  else if (modo === 'visita' && MONDO === 'citta') apriVisita();
  else if (!params.has('subito')) ui.avviso(t('avviso.inizio'), 7000);
}

function impostaCertezza(on) {
  certezzaAccesa = on;
  ui.statoCertezza(on);
  mondo.cantiere.certezza(on); mondo.abitanti.visibili(!on);
}

function apriVisita() {
  if (NEL_1300) return ricostruisci('1216', { visita: '' });
  racconto.chiudi();
  visita.apri(0);
}

/** Una tappa della visita: si va nel punto di vista, con una breve dissolvenza. */
async function vaiTappa(t) {
  if (epoca === 'oggi') await impostaEpoca('1216');
  const sfuma = !movimentoRidotto && mondo;
  const velo = document.getElementById('dissolvenza');
  if (sfuma) { velo.classList.add('su'); await new Promise(r => setTimeout(r, 280)); }
  if (MONDO === 'citta' && giornata.id !== 'pasqua') impostaGiornata('pasqua');
  collocaVista(mondo.controlli, t.vista);
  if (t.certezza && !certezzaAccesa) { certezzaDallaVisita = true; impostaCertezza(true); }
  if (!t.certezza && certezzaDallaVisita) { certezzaDallaVisita = false; impostaCertezza(false); }
  if (sfuma) { mondo.controlli.aggiorna(0.016); velo.classList.remove('su'); }
}

function vaiA(l) {
  const c = mondo.controlli;
  // si guarda il luogo da qualche metro, da un punto dove si può stare
  for (let r = 8; r < 40; r += 2) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const x = l.pos[0] + Math.cos(a) * r, z = l.pos[1] + Math.sin(a) * r;
    if (c.griglia.percorribile(x, z)) {
      const yaw = Math.atan2(-(l.pos[0] - x), -(l.pos[1] - z));
      if (c.volo) { c.pos.set(x, c.pos.y, z); c.yaw = yaw; }
      else c.colloca(x, z, yaw, 0.08);
      return;
    }
  }
  c.impostaVolo(true); c.colloca(l.pos[0], l.pos[1] + 80, 0, -0.6);
}

/* ------------------------------------------------------------- ciclo */
// Nei primi secondi dentro la città si contano i fotogrammi: se va a scatti e
// nessuno ha scelto la qualità, si alleggeriscono le immagini e lo si dice.
const scioltezza = { t: 0, n: 0, fatto: false };
function controllaScioltezza(vero) {
  if (scioltezza.fatto) return;
  scioltezza.t += vero; scioltezza.n++;
  if (scioltezza.t < 4) return;
  scioltezza.fatto = true;
  const fps = scioltezza.n / scioltezza.t;
  if (fps < 12 && qualita === 'alta' && !ui.qualitaScelta) {
    cambiaQualita();
    ui.segna('#seg-qualita', 'media');
    ui.avviso(t('avviso.lento'), 7000);
  }
}

const orologio = new Clock();
let tHud = 0;
function ciclo() {
  requestAnimationFrame(ciclo);
  const vero = orologio.getDelta(), dt = Math.min(0.05, vero);
  if (mondo) {
    const c = mondo.controlli;
    c.aggiorna(dt, Math.min(vero, 0.5));
    if (c.attivo) controllaScioltezza(vero);
    mondo.cielo.segui(camera.position);
    if (mondo.acqua) mondo.acqua.material.uniforms.time.value += dt * 0.55;
    // la sera del 1° maggio 1300 l'ora va avanti da sola, fino a dopo la zuffa
    if (mondo.zuffa && c.attivo && ora < giornata.oraMax) {
      ora = Math.min(giornata.oraMax, ora + dt * OROLOGIO_SERA);
      if ((tOrologio += dt) > 1) { tOrologio = 0; impostaOra(); const r = document.querySelector('#cursore-ora'); if (r) r.value = ora; }
    }
    mondo.zuffa?.aggiorna(dt, ora);
    mondo.abitanti.aggiorna(dt, camera.position);
    mondo.cantiere.aggiornaLod(camera.position);
    mondo.suoni.aggiorna(dt, camera, mondo.abitanti);
    if (mappa && c.attivo) mappa.aggiorna(camera.position.x, camera.position.z, c.yaw);
    if ((tHud += dt) > 0.25) {
      tHud = 0;
      let best = null, bd = Infinity;
      for (const l of LUOGHI) {
        if (mondoDi(l) !== MONDO || !dellEpoca(l, EPOCA)) continue;
        const d = Math.hypot(camera.position.x - l.pos[0], camera.position.z - l.pos[1]);
        if (d < l.raggio && d < bd) { bd = d; best = l; }
      }
      ui.luogoVicino(c.attivo && !racconto.aperto && !visita.aperta ? best : null);
    }
    composer.render(dt);
  }
}

// per le verifiche dalla console: ?debug
if (params.has('debug')) window.citta = {
  renderer, scene, camera, get mondo() { return mondo; }, get oggi() { return oggi; }, impostaEpoca, get composer() { return composer; }, get giornata() { return giornata; }, impostaGiornata, racconto, vaiScena,
  get figure() { return modelli; }, get animali() { return animali; }, tempi: tempiCaricamento, visita, ui,
  /** Salva un fotogramma a piena risoluzione (solo con il server di sviluppo). */
  async cattura(nome = 'cattura') {
    composer.render(0.016);
    const url = renderer.domElement.toDataURL('image/png');
    return (await fetch('/__cattura?nome=' + nome, { method: 'POST', body: url })).text();
  },
  /** Mette l'osservatore in un punto e lo fa guardare in una direzione. */
  guarda(x, z, yaw, pitch = 0, y) {
    const c = mondo.controlli;
    if (y !== undefined) { c.impostaVolo(true); c.pos.set(x, y, z); c.yaw = yaw; c.pitch = pitch; }
    else { c.impostaVolo(false); c.colloca(x, z, yaw, pitch); }
    c.aggiorna(0.016);
  }
};

costruisci().catch(e => { console.error(e); ui.errore(e.message); });
ciclo();
