// npm run racconto: scrive unity/Firenze1216/Assets/Dati/racconto.json per le scene recitate dell'app.
// Copione (testi, scelte, note del quaderno), scene (luogo, giornata, ora, punto di vista), regia (attori, folla,
// battute, voci) e le pose ferme (in sella, seduti) della città nel browser. Non serve costruire la città.
import { writeFileSync } from 'node:fs';
import { COPIONE } from '../src/dati/copione.js';
import { SCENE, TIPI_NOTA } from '../src/dati/scene.js';
import { REGIA, VOCI, SCENE_VIOLENTE, POSA_A_TERRA } from '../src/dati/regia.js';
import { POSA_SELLA, POSA_SEDUTA } from '../src/mondo/abitanti.js';
import { COPIONE_EN, SCENE_EN, TIPI_NOTA_EN } from '../src/dati/copione-en.js';

/** Le note del quaderno; «N11a / N11b / N11c» (la frase scelta in II3) diventa tre note, una per scelta, con quella frase. */
function note(c, en) {
  const out = [];
  for (const n of c.note) {
    const ids = n.id.split('/').map(x => x.trim());
    if (ids.length > 1) ids.forEach((id, i) => out.push({ id, tipo: n.tipo, chi: n.chi || '', testo: `«${c.scelte[i].replace(/^«|»$/g, '')}»`, en: en?.note?.[id] || '' }));
    else out.push({ id: n.id, tipo: n.tipo, chi: n.chi || '', testo: n.testo, en: en?.note?.[n.id] || '' });
  }
  return out;
}

const scene = SCENE.map(s => {
  const c = COPIONE[s.id], r = REGIA[s.id] || { battute: [] };
  return {
    id: s.id, titolo: c.titolo, testo: c.testo, scelte: c.scelte, note: note(c, COPIONE_EN[s.id]), base: c.base, facoltativo: !!c.facoltativo,
    testimoni: c.testimoni || [],
    // l'inglese (copione-en.js, bozza da rivedere): vuoto dove manca, e l'app legge l'italiano
    en: { titolo: COPIONE_EN[s.id]?.titolo || '', testo: COPIONE_EN[s.id]?.testo || [], scelte: COPIONE_EN[s.id]?.scelte || [], testimoni: COPIONE_EN[s.id]?.testimoni || [],
      adattamento: SCENE_EN[s.id]?.adattamento || '', fuori: SCENE_EN[s.id]?.fuori || '', ramo: SCENE_EN[s.id]?.ramo || '' },
    luogo: s.luogo || '', mondo: s.mondo || 'citta', giornata: s.giornata || '', ora: r.ora ?? s.ora ?? 10,
    vista: s.vista ? { c: true, x: s.vista.x, z: s.vista.z, y: s.vista.y ?? 0, vx: s.vista.verso[0], vz: s.vista.verso[1], volo: !!s.vista.volo } : { c: false },
    fuori: s.fuori || '', gruppo: s.gruppo || '', ramo: s.ramo || '', adattamento: r.adattamento ?? s.adattamento ?? '',
    quaderno: !!r.quaderno || !!s.fuori, sangue: !!r.sangue,
    // JsonUtility di Unity non legge oggetti liberi: la regia della scena passa come testo JSON, e la legge Racconto.cs
    regia: JSON.stringify({ attori: r.attori || [], folla: r.folla || [], battute: r.battute })
  };
});
const voci = Object.entries(VOCI).map(([nome, v]) => ({ nome, ...v }));
const pose = (nome, P) => ({ nome, ossa: Object.entries(P).map(([osso, [x, y, z]]) => ({ osso, x, y, z })) });
const out = { scene, voci, violente: SCENE_VIOLENTE, tipiNota: Object.entries(TIPI_NOTA).map(([k, t]) => ({ ...t, nomeEn: TIPI_NOTA_EN[k].nome, testoEn: TIPI_NOTA_EN[k].testo })), pose: [pose('in sella', POSA_SELLA), pose('seduto', POSA_SEDUTA), pose('a terra', POSA_A_TERRA)] };
const f = new URL('../../unity/Firenze1216/Assets/Dati/racconto.json', import.meta.url);
writeFileSync(f, JSON.stringify(out, null, 1));
console.log(`racconto: ${scene.length} scene, violente: ${SCENE_VIOLENTE.join(' ')}`);
