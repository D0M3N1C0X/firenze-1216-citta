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
import { TRACCIATO, dentroTracciato } from './dati/cerchia.js';
import { LUOGHI } from './dati/luoghi.js';
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
import { Abitanti } from './mondo/abitanti.js';
import { caricaAnimali, caricaFigure } from './mondo/figure.js';
import { Suoni } from './mondo/suoni.js';
import { alba, formatoOra, oraCanonica } from './mondo/sole.js';
import { Controlli } from './controlli.js';
import { Interfaccia } from './ui/interfaccia.js';
import { Racconto } from './ui/racconto.js';
import { Visita } from './ui/visita.js';

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
  document.getElementById('titolo').textContent = 'Campi, il convito di gennaio 1216';
  document.querySelector('#avvio .data').textContent = 'Gennaio 1216 · il castello dei Mazzinghi, sei miglia a nord-ovest di Firenze';
  document.querySelector('#avvio .data + p').innerHTML = 'Il convito in cui comincia la storia: un castello da percorrere a piedi, costruito a partire dalle fonti. Dove le fonti si fermano, il modello lo dice: l\'interruttore <b>Certezza</b> colora ogni cosa secondo quanto ne sappiamo.';
  document.querySelector('#avvio details ul').innerHTML =
    '<li><b>Non è una ricostruzione validata.</b> È un prototipo, e un medievista non l\'ha ancora visto.</li>' +
    '<li><b>Il castello non c\'è più.</b> Recinto, sala e arredo sono ricostruiti sul tipo dei castelli del contado: sono un\'ipotesi.</li>' +
    '<li><b>Gli invitati non hanno un volto.</b> Chi sia ciascuno non lo diciamo: lo racconta il gioco, con le fonti.</li>';
}

// senza WebGL la città non si può disegnare: lo si dice subito, in parole semplici
if (!document.createElement('canvas').getContext('webgl2')) {
  document.querySelector('.caricamento').innerHTML = '<p class="errore"><b>Questo browser non riesce a disegnare la città in 3D.</b><br>Prova con Safari, Chrome o Firefox aggiornati, o su un altro computer.</p>';
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
let giornata = GIORNATE[params.get('giorno')] || GIORNATE[scenaIniziale?.giornata] || GIORNATE[MONDO === 'campi' ? 'gennaio' : GIORNATA_PREDEFINITA];
let ora = +(params.get('ora') || scenaIniziale?.ora || giornata.ora);
let qualita = 'alta';         // dalle impostazioni ricordate, sotto
let movimentoRidotto = false;
let mondo = null;
let modelli = null;          // le figure di Blender, caricate una volta sola
let animali = null;          // cavalli, muli e asini di Blender
let certezzaAccesa = false;

const ui = new Interfaccia({
  entra,
  visita: () => apriVisita(),
  certezza: on => impostaCertezza(on),
  giorno: id => { if (MONDO === 'citta' && id !== giornata.id) impostaGiornata(id); },
  volo: on => mondo.controlli.impostaVolo(on),
  inVolo: () => mondo?.controlli.volo,
  ora: h => { ora = h; impostaOra(); },
  vai: l => vaiA(l),
  qualita: v => { if (v !== qualita) cambiaQualita(); },
  racconto: () => { visita.chiudi(false); racconto.alterna(); },
  movimentoRidotto: on => { movimentoRidotto = on; if (mondo) mondo.controlli.movimentoRidotto = on; }
});
qualita = ui.qualitaRicordata === 'media' ? 'media' : 'alta';
renderer.setPixelRatio(qualita === 'alta' ? Math.min(devicePixelRatio, 2) : 1);
ui.applicaPreferenze();
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
      ui.avviso('Ora esplora da solo: tocca la strada dove vuoi andare, trascina per guardarti intorno.', 7000);
    }
  }
});
if (scenaIniziale) ui.scenaIniziale(`Dal gioco: scena ${scenaIniziale.id}, «${COPIONE[scenaIniziale.id].titolo}»`);

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
const opzComandi = () => ({ scene, avviso: t => ui.avviso(t), gesto: () => ui.nascondiAvviso() });

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
  const strade = strade1216(STRADE);
  creaTerreno(scene);
  creaVegetazione(scene, { evita: strade.filter(s => s.fuori) });
  const acqua = creaAcqua(scene, cielo.dir);

  await passo('Le strade del 1216…');
  // da −1100 a 1100 m: la cerchia del 1172–75 e i borghi fuori porta
  const griglia = new Griglia(-1100, 1100);
  griglia.poligono(FIUME, C_FIUME);
  for (const s of strade) {
    if (s.area) griglia.poligono(s.punti, PIAZZA, false);
    else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
  }

  await passo('Il ponte, le chiese, le torri…');
  const cantiere = new Cantiere();
  const monumenti = costruisciMonumenti(cantiere, griglia);

  await passo('Le mura, le porte, il fossato…');
  costruisciMura(cantiere, griglia);
  ipotesiLatoSud(cantiere);

  await passo('Le case, una per una…');
  // la città casa per casa fino alle mura (dati/cerchia.js); fuori, i borghi
  const lotti = lottizza(griglia, strade.filter(s => !s.fuori), { dentro: dentroTracciato, riquadro: RIQUADRO_CERCHIA, riempimento: 28000 });
  // a blocchi, ridando la mano al browser: così la pagina non si blocca e la barra avanza
  for (let i = 0; i < lotti.length; i += 250) {
    costruisciLotti(cantiere, lotti.slice(i, i + 250));
    mostra(fatto + pesi[fase] * 0.72 * Math.min(1, (i + 250) / lotti.length)); await pausa();
  }
  const borghi = costruisciBorghi(cantiere, griglia, strade);
  mostra(fatto + pesi[fase] * 0.86); await pausa();
  costruisciPalizzata(cantiere, griglia);
  const pozzi = KIT.pezzi ? pozziNeiCortili(cantiere, griglia, dentroTracciato, 60, RIQUADRO_CERCHIA) : [];

  await passo('Muro su muro…');
  cantiere.costruisci(scene);

  await passo('La gente esce di casa…');
  // dove si cammina: il ponte, il pavimento di Santa Reparata, altrimenti il terreno
  const quotaIn = (x, z) => sulPonte(x, z) ?? quotaPavimento(x, z) ?? quota(x, z);
  modelli = params.has('manichini') ? null : await figure;
  animali = modelli ? await bestie : null;
  const controlli = new Controlli(camera, renderer.domElement, griglia, quotaIn, opzComandi());
  const partenza = params.get('da');
  if (partenza) { const [x, z, y] = partenza.split(',').map(Number); controlli.colloca(x, z, y || 0, 0); }
  else if (scenaIniziale?.vista) collocaVista(controlli, scenaIniziale.vista);
  else controlli.colloca(20, -46, 2.62, -0.02);

  mondo = { cielo, acqua, griglia, cantiere, monumenti, lotti, strade, controlli, quotaIn, suoni: new Suoni() };
  mondo.abitanti = creaAbitanti();
  impostaGiornata(giornata.id, { ora });
  impostaComposizione();
  if (qualita !== 'alta') cielo.dimensioneOmbre(2048, 80);
  controlli.movimentoRidotto = movimentoRidotto;
  await passo('');
  ricordaDurata((performance.now() - t0) / 1000);
  console.info(tempiCaricamento.join(' · '));
  console.info(`città pronta in ${((performance.now() - t0) / 1000).toFixed(1)} s · lotti ${lotti.length} · borghi ${borghi.length} · oggetti ${cantiere.mesh.length}` +
    (KIT.pezzi ? ` · kit ${(cantiere.triangoliKit / 1e6).toFixed(1)} M triangoli · pozzi ${pozzi.length}` : ' · senza kit'));
  ui.pronto();
  if (params.has('subito')) entra();
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
    // in chiesa e nella torre degli Amidei (dati/interni.js)
    fermi: figureNegliInterni(giornata)
  });
}

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
  mondo.suoni.giornata(g);
  if (cambia) {
    mondo.abitanti.distruggi();
    mondo.abitanti = creaAbitanti();
    if (certezzaAccesa) mondo.abitanti.visibili(false);
  }
  impostaOra();
}

function impostaOra() {
  if (!mondo) return;
  mondo.cielo.imposta(ora);
  mondo.acqua?.material.uniforms.sunDirection.value.copy(mondo.cielo.dir);
  ui.ora(formatoOra(ora) + ' ora solare', oraCanonica(ora, giornata.doy));
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
  else if (!params.has('subito')) ui.avviso('Tocca la strada dove vuoi andare. Trascina per guardarti intorno.', 7000);
}

function impostaCertezza(on) {
  certezzaAccesa = on;
  ui.statoCertezza(on);
  mondo.cantiere.certezza(on); mondo.abitanti.visibili(!on);
}

function apriVisita() {
  racconto.chiudi();
  visita.apri(0);
}

/** Una tappa della visita: si va nel punto di vista, con una breve dissolvenza. */
async function vaiTappa(t) {
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
    if (mondo.griglia.percorribile(x, z)) {
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
    ui.avviso('Questo computer fa fatica: ho alleggerito le immagini. Puoi cambiarlo in Impostazioni.', 7000);
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
    mondo.abitanti.aggiorna(dt, camera.position);
    mondo.cantiere.aggiornaLod(camera.position);
    mondo.suoni.aggiorna(dt, camera, mondo.abitanti);
    if ((tHud += dt) > 0.25) {
      tHud = 0;
      let best = null, bd = Infinity;
      for (const l of LUOGHI) {
        if (mondoDi(l) !== MONDO) continue;
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
  renderer, scene, camera, get mondo() { return mondo; }, get composer() { return composer; }, get giornata() { return giornata; }, impostaGiornata, racconto, vaiScena,
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

costruisci().catch(e => { console.error(e); ui.errore('Ricarica la pagina; se succede ancora, prova con un altro browser. (Dettaglio tecnico: ' + e.message + ')'); });
ciclo();
