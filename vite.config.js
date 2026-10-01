import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Solo in sviluppo: POST /__cattura?nome=... con un'immagine PNG in base64
// la salva in .catture/ (esclusa da git). Serve a controllare il modello
// a piena risoluzione mentre lo si costruisce.
const DIR = join(import.meta.dirname, '.catture');
const cattura = {
  name: 'cattura',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__cattura', (req, res) => {
      const nome = (new URL(req.url, 'http://x').searchParams.get('nome') || 'cattura').replace(/[^\w-]/g, '');
      const parti = [];
      req.on('data', d => parti.push(d));
      req.on('end', () => {
        const b64 = Buffer.concat(parti).toString().replace(/^data:image\/\w+;base64,/, '');
        mkdirSync(DIR, { recursive: true });
        writeFileSync(join(DIR, nome + '.png'), Buffer.from(b64, 'base64'));
        res.end('ok');
      });
    });
  }
};

// La città è servita da una sottocartella del sito del progetto
// (…/firenze-1216/citta/): i percorsi devono essere relativi.
export default defineConfig({
  base: './',
  plugins: [cattura],
  server: { port: 5216, strictPort: true },
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 }
});
