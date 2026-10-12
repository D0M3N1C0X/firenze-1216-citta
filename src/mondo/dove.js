/* In quale mondo si è: la città (predefinita) o un luogo a parte, che si
   apre con ?luogo=… (per ora solo Campi, il castello del convito). */
export const MONDO = new URLSearchParams(location.search).get('luogo') === 'campi' ? 'campi' : 'citta';

/** Il mondo di un luogo o di una scena (dati/luoghi.js, dati/scene.js). */
export const mondoDi = x => x?.mondo || 'citta';
