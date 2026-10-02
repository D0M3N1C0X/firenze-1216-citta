/* =====================================================================
   IL SOLE DI PASQUA 1216

   Pasqua cadde il 10 aprile 1216 (Faini 2006, p. 16). È una data del
   calendario giuliano, l'unico in uso allora. Per la posizione del sole
   conta la stagione astronomica, quindi la data va portata nel calendario
   gregoriano prolettico: nel Duecento la differenza è di 7 giorni, e il
   10 aprile giuliano corrisponde al 17 aprile gregoriano.

   Declinazione con la serie di Spencer (1971), la stessa delle formule
   NOAA. L'obliquità dell'eclittica nel 1216 era di circa 23,53° contro
   i 23,44° di oggi: lo scarto sull'altezza del sole è sotto il decimo di
   grado e qui si trascura.

   L'ora è l'ora solare vera del luogo, cioè quella delle meridiane: è
   anche l'unica che avesse senso nel 1216. Mezzogiorno = sole a sud.

   Le altre giornate del racconto (dati/giornate.js) passano il loro
   giorno dell'anno gregoriano (doy); senza, vale Pasqua.
   ===================================================================== */

export const FIRENZE = { lat: 43.7696, lon: 11.2558 };
export const PASQUA_1216 = { giuliano: '10 aprile 1216', gregoriano: '17 aprile', doy: 108 };

const RAD = Math.PI / 180;

export function declinazione(doy) {
  const g = 2 * Math.PI / 366 * (doy - 1);
  return 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
}

/** Altezza e azimut (da nord, in senso orario) in radianti per un'ora solare vera. */
export function posizioneSole(ora, doy = PASQUA_1216.doy, lat = FIRENZE.lat) {
  const d = declinazione(doy), f = lat * RAD, H = (ora - 12) * 15 * RAD;
  const el = Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(d) * Math.cos(f) - Math.sin(f) * Math.cos(H));
  return { el, az: (az + 2 * Math.PI) % (2 * Math.PI) };
}

/** Direzione verso il sole nelle coordinate del modello (x est, y su, z sud). */
export function direzioneSole(ora, out, doy = PASQUA_1216.doy) {
  const { el, az } = posizioneSole(ora, doy);
  out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  return out;
}

/** Ora del sorgere (altezza 0) cercata per bisezione. */
export function alba(doy = PASQUA_1216.doy) {
  let a = 3, b = 12;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (posizioneSole(m, doy).el > 0) b = m; else a = m; }
  return b;
}

/**
 * Le ore canoniche scandivano la giornata con le campane. Le collochiamo
 * in modo approssimato sulle ore solari: Prima al sorgere, Terza a metà
 * mattina, Sesta a mezzogiorno. Sono convenzioni monastiche, non orari.
 */
export function oraCanonica(ora, doy = PASQUA_1216.doy) {
  const a = alba(doy);
  const terza = (a + 12) / 2;
  if (ora < a - 0.9) return 'Mattutino';
  if (ora < a) return 'Lodi, all\'alba';
  if (ora < a + 0.6) return 'Prima';
  if (ora < terza - 0.4) return 'tra Prima e Terza';
  if (ora < terza + 0.4) return 'Terza';
  if (ora < 11.6) return 'tra Terza e Sesta';
  return 'Sesta';
}

export function formatoOra(ora) {
  const h = Math.floor(ora), m = Math.round((ora - h) * 60);
  return `${h}:${String(m === 60 ? 0 : m).padStart(2, '0')}`;
}
