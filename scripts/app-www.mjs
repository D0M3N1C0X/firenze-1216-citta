/* =====================================================================
   I FILE DELL'APP — npm run app

   Capacitor copia nel pacchetto una cartella intera (webDir). Qui si
   ricompone app/www/ con il sito già costruito da Vite (dist/): la stessa
   cosa che pubblica GitHub Pages, niente di più. La città non scarica
   niente da fuori, quindi l'app funziona senza rete.
   ===================================================================== */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(radice, 'dist'), www = join(radice, 'app', 'www');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('manca dist/index.html: lancia prima npm run build');
  process.exit(1);
}
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
cpSync(dist, www, { recursive: true });
console.log('app/www pronta, copiata da dist/');
