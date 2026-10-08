import {
  AgXToneMapping, Clock, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

import { FIUME, STRADE } from './dati/osm.js';
import { CORRIDOI, RAGGIO_CITTA, strade1216 } from './dati/strade-1216.js';
import { LUOGHI } from './dati/luoghi.js';
import { GIORNATA_PREDEFINITA, GIORNATE } from './dati/giornate.js';
import { SCENE } from './dati/scene.js';
import { COPIONE } from './dati/copione.js';
import { creaMateriali, impostaAnisotropia } from './mondo/materiali.js';
import { Cielo } from './mondo/cielo.js';
import { creaAcqua, creaTerreno, quota } from './mondo/terreno.js';
import { preparaCampo } from './mondo/fiume.js';
import { FIUME as C_FIUME, Griglia, PIAZZA, STRADA } from './mondo/griglia.js';
import { Cantiere } from './mondo/cantiere.js';
import { areaCostruita, costruisciLotti, lottizza, pozziNeiCortili } from './mondo/edifici.js';
import { KIT, caricaKit } from './mondo/kit.js';
import { caricaModelli } from './mondo/modelli.js';
import { PONTE_ASSE, costruisciMonumenti, sulPonte } from './mondo/monumenti.js';
import { costruisciFondale } from './mondo/fondale.js';
import { creaVegetazione } from './mondo/vegetazione.js';
import { Abitanti } from './mondo/abitanti.js';
import { caricaAnimali, caricaFigure } from './mondo/figure.js';
import { Suoni } from './mondo/suoni.js';
import { alba, formatoOra, oraCanonica } from './mondo/sole.js';
import { Controlli } from './controlli.js';
import { Interfaccia } from './ui/interfaccia.js';
import { Racconto } from './ui/racconto.js';

/* =====================================================================
   FIRENZE 1216 — LA CITTÀ  ·  prototipo v0.3: dal capo del Ponte Vecchio a Santa Reparata
   1 unità = 1 metro. Origine al capo nord del ponte; x est, z sud.
   ===================================================================== */

const params = new URLSearchParams(location.search);
// cede il passo al browser perché aggiorni il messaggio. Un MessageChannel
// e non un setTimeout: i timer di una scheda in background vengono
// rallentati fino a fermare la costruzione, i messaggi no.
const pausa = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });

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
let giornata = GIORNATE[params.get('giorno')] || GIORNATE[scenaIniziale?.giornata] || GIORNATE[GIORNATA_PREDEFINITA];
let ora = +(params.get('ora') || scenaIniziale?.ora || giornata.ora);
let qualita = 'alta';
let mondo = null;
let modelli = null;          // le figure di Blender, caricate una volta sola
let animali = null;          // cavalli, muli e asini di Blender
let certezzaAccesa = false;

const ui = new Interfaccia({
  entra,
  certezza: on => { certezzaAccesa = on; mondo.cantiere.certezza(on); mondo.abitanti.visibili(!on); },
  giorno: () => impostaGiornata(giornata.id === 'pasqua' ? 'febbraio' : 'pasqua'),
  volo: on => mondo.controlli.impostaVolo(on),
  inVolo: () => mondo?.controlli.volo,
  ora: h => { ora = h; impostaOra(); },
  vai: l => vaiA(l),
  qualita: cambiaQualita,
  racconto: () => racconto.alterna()
});
const racconto = new Racconto({
  vai: s => vaiScena(s),
  scheda: l => ui.apri(l),
  aperto: on => ui.statoRacconto(on)
});
if (scenaIniziale) ui.scenaIniziale(`Dal gioco: scena ${scenaIniziale.id}, «${COPIONE[scenaIniziale.id].titolo}»`);

async function costruisci() {
  const t0 = performance.now();
  let tf = t0, fase = '';
  const tempi = [];
  const passo = async msg => {
    const t = performance.now();
    if (fase) tempi.push(`${fase} ${((t - tf) / 1000).toFixed(1)}s`);
    tf = t; fase = msg; ui.progresso(msg); await pausa();
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
    creaMateriali('alta', (k, n) => ui.progresso(`Impasto la calce e cuocio i coppi… ${k}/${n}`)),
    preparaCampo()
  ]);
  impostaAnisotropia(renderer.capabilities.getMaxAnisotropy());
  console.info(`materiali e fiume in ${((performance.now() - t0) / 1000).toFixed(1)} s`);

  await passo('Il cielo del mattino…');
  const cielo = new Cielo(renderer, scene);

  await passo('Il letto dell\'Arno e le colline…');
  creaTerreno(scene);
  creaVegetazione(scene);
  const acqua = creaAcqua(scene, cielo.dir);

  await passo('Le strade del 1216…');
  const griglia = new Griglia();
  griglia.poligono(FIUME, C_FIUME);
  const strade = strade1216(STRADE);
  for (const s of strade) {
    if (s.area) griglia.poligono(s.punti, PIAZZA, false);
    else griglia.spezzata(s.punti, s.larghezza, STRADA, false);
  }

  await passo('Il ponte, le chiese, le torri…');
  const cantiere = new Cantiere();
  const monumenti = costruisciMonumenti(cantiere, griglia);

  await passo('Le case, una per una…');
  // la città casa per casa: 480 m dal capo del ponte, più il corridoio verso Santa Reparata
  const lotti = lottizza(griglia, strade, { raggio: RAGGIO_CITTA, corridoi: CORRIDOI, riempimento: 15000 });
  costruisciLotti(cantiere, lotti);
  const pozzi = KIT.pezzi ? pozziNeiCortili(cantiere, griglia, areaCostruita(RAGGIO_CITTA, CORRIDOI)) : [];
  costruisciFondale(cantiere, areaCostruita(RAGGIO_CITTA + 5, CORRIDOI.map(c => ({ ...c, larghezza: c.larghezza + 5 }))));

  await passo('Muro su muro…');
  cantiere.costruisci(scene);

  await passo('La gente esce di casa…');
  const quotaIn = (x, z) => { const p = sulPonte(x, z); return p === null ? quota(x, z) : p; };
  modelli = params.has('manichini') ? null : await figure;
  animali = modelli ? await bestie : null;
  const controlli = new Controlli(camera, renderer.domElement, griglia, quotaIn);
  const partenza = params.get('da');
  if (partenza) { const [x, z, y] = partenza.split(',').map(Number); controlli.colloca(x, z, y || 0, 0); }
  else if (scenaIniziale?.vista) collocaVista(controlli, scenaIniziale.vista);
  else controlli.colloca(20, -46, 2.62, -0.02);

  mondo = { cielo, acqua, griglia, cantiere, monumenti, lotti, strade, controlli, quotaIn, suoni: new Suoni() };
  mondo.abitanti = creaAbitanti();
  impostaGiornata(giornata.id, { ora });
  impostaComposizione();
  await passo('');
  console.info(tempi.join(' · '));
  console.info(`città pronta in ${((performance.now() - t0) / 1000).toFixed(1)} s · lotti ${lotti.length} · oggetti ${cantiere.mesh.length}` +
    (KIT.pezzi ? ` · kit ${(cantiere.triangoliKit / 1e6).toFixed(1)} M triangoli · pozzi ${pozzi.length}` : ' · senza kit'));
  ui.pronto();
  if (params.has('subito')) entra();
}

function creaAbitanti() {
  return new Abitanti(scene, mondo.strade, mondo.griglia, mondo.quotaIn, {
    modelli,
    animali,
    // muli, asini e cavalli: più nei giorni di lavoro che a Pasqua (ipotesi)
    numeroAnimali: Math.round(+(params.get('gente') || giornata.gente) * (giornata.festa ? 0.04 : 0.09)),
    numeroCavalieri: Math.round(+(params.get('gente') || giornata.gente) * (giornata.festa ? 0.025 : 0.035)),
    numero: +(params.get('gente') || giornata.gente),
    raggio: RAGGIO_CITTA,
    extra: [{ punti: [PONTE_ASSE.A, PONTE_ASSE.B], larghezza: 5.5 }],
    gruppi: giornata.gruppi
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
  mondo.acqua.material.uniforms.sunDirection.value.copy(mondo.cielo.dir);
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
    c.colloca(v.x, v.z, yaw, 0.04);
  }
  ui.statoVolo(c.volo);
}

/** La città va nella giornata, all'ora e nel punto di vista di una scena. */
function vaiScena(s) {
  if (s.giornata) impostaGiornata(s.giornata, { ora: s.ora ?? GIORNATE[s.giornata].ora });
  if (s.vista && mondo) collocaVista(mondo.controlli, s.vista);
}

function entra() {
  ui.mostra();
  mondo.controlli.attivo = true;
  mondo.suoni.avvia(camera);
  if (scenaIniziale || params.has('racconto')) racconto.apri(scenaIniziale?.id);
  if (!matchMedia('(pointer: coarse)').matches && !params.has('subito')) renderer.domElement.requestPointerLock?.();
}

function vaiA(l) {
  const c = mondo.controlli;
  // si guarda il luogo da qualche metro, da un punto dove si può stare
  for (let r = 8; r < 40; r += 2) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const x = l.pos[0] + Math.cos(a) * r, z = l.pos[1] + Math.sin(a) * r;
    if (Math.abs(x) > 620 || Math.abs(z) > 620) continue;
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
const orologio = new Clock();
let tHud = 0;
function ciclo() {
  requestAnimationFrame(ciclo);
  const dt = Math.min(0.05, orologio.getDelta());
  if (mondo) {
    const c = mondo.controlli;
    c.aggiorna(dt);
    mondo.cielo.segui(camera.position);
    mondo.acqua.material.uniforms.time.value += dt * 0.55;
    mondo.abitanti.aggiorna(dt, camera.position);
    mondo.cantiere.aggiornaLod(camera.position);
    mondo.suoni.aggiorna(dt, camera, mondo.abitanti);
    if ((tHud += dt) > 0.25) {
      tHud = 0;
      let best = null, bd = Infinity;
      for (const l of LUOGHI) {
        const d = Math.hypot(camera.position.x - l.pos[0], camera.position.z - l.pos[1]);
        if (d < l.raggio && d < bd) { bd = d; best = l; }
      }
      ui.luogoVicino(c.attivo && !racconto.aperto ? best : null);
    }
    composer.render(dt);
  }
}

// per le verifiche dalla console: ?debug
if (params.has('debug')) window.citta = {
  renderer, scene, camera, get mondo() { return mondo; }, get composer() { return composer; }, get giornata() { return giornata; }, impostaGiornata, racconto, vaiScena,
  get figure() { return modelli; }, get animali() { return animali; },
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

costruisci().catch(e => { console.error(e); ui.progresso('Errore: ' + e.message); });
ciclo();
