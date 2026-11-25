/* =====================================================================
   LE VEDUTE DEI LUOGHI PER L'APP — npm run vedute (25 novembre 2026)

   Da fare sul Mac, una volta: nel contenitore senza scheda grafica ogni
   veduta richiede minuti, con la scheda grafica qualche secondo.
   Serve: npx playwright install chromium (una volta) e Pillow per Python
   (pip3 install pillow).

   Avvia la città nel browser (server di Vite), e per ogni luogo del 1216 e
   del 1300 fa una veduta dall'alto di tre quarti dal punto più libero fra
   otto direzioni (meno edifici tra la camera e il luogo); le salva in
   .catture/ e le ripassa a inchiostro e acquerello
   (strumenti/interfaccia/miniature.py) in
   ../unity/Firenze1216/Assets/Interfaccia/Miniature/. Salta le vedute già
   fatte: si può interrompere e riprendere.
   ===================================================================== */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const qui = new URL('..', import.meta.url).pathname;
const server = await createServer({ root: qui, server: { port: 5199, strictPort: false } });
await server.listen();
const porta = server.config.server.port;
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu'] });

async function giro(epoca, prefisso) {
  const p = await browser.newPage({ viewport: { width: 960, height: 600 } });
  p.on('pageerror', e => console.log('errore nella pagina:', e.message));
  await p.goto(`http://localhost:${porta}/?debug&subito&cattura&ora=10.5&gente=0&manichini${epoca === '1300' ? '&epoca=1300' : '&giorno=febbraio'}`, { timeout: 120000 });
  await p.waitForFunction(() => window.citta?.mondo?.controlli, null, { timeout: 900000, polling: 1000 });
  const luoghi = await p.evaluate(async ep => {
    const { LUOGHI, dellEpoca } = await import('/src/dati/luoghi.js');
    return LUOGHI.filter(l => (l.mondo || 'citta') === 'citta' && l.pos && dellEpoca(l, ep)).map(l => ({ id: l.id, pos: l.pos, raggio: l.raggio || 12 }));
  }, epoca);
  const fatte = new Set(existsSync(qui + '.catture') ? readdirSync(qui + '.catture').filter(f => f.startsWith(prefisso + '-')).map(f => f.slice(prefisso.length + 1, -4)) : []);
  await p.evaluate(() => document.querySelectorAll('#interfaccia, .pannello, #avvio, header, nav, aside').forEach(e => { e.style.display = 'none'; }));
  for (const l of luoghi) {
    if (fatte.has(l.id)) continue;
    const d = Math.max(34, l.raggio * 2.2 + 22), h = d * 0.5;
    const az = await p.evaluate(([px, pz, d]) => {
      const g = window.citta.mondo.griglia; let best = 3.9, bv = Infinity;
      for (let k = 0; k < 8; k++) {
        const a = 3.9 + k * Math.PI / 4, cx = px + Math.sin(a) * d, cz = pz - Math.cos(a) * d; let n = 0;
        for (let t = 0.15; t < 0.8; t += 0.025) { const v = g.get(cx + (px - cx) * t, cz + (pz - cz) * t); if (v === 4 || v === 5) n += t < 0.4 ? 2 : 1; }
        if (n + k * 0.01 < bv) { bv = n + k * 0.01; best = a; }
      }
      return best;
    }, [l.pos[0], l.pos[1], d]);
    const x = l.pos[0] + Math.sin(az) * d, z = l.pos[1] - Math.cos(az) * d, dx = l.pos[0] - x, dz = l.pos[1] - z;
    await p.evaluate(v => window.citta.guarda(...v), [x, z, Math.atan2(-dx, -dz), -Math.atan2(h - 6, Math.hypot(dx, dz)), h + 2]);
    await p.waitForTimeout(1500);
    console.log(epoca, l.id, await p.evaluate(n => window.citta.cattura(n), `${prefisso}-${l.id}`));
  }
  await p.close();
}

await giro('1216', 'min');
await giro('1300', 'min1300');
await browser.close(); await server.close();
for (const [pre, usc] of [['min', ''], ['min1300', '1300-']]) {
  const r = spawnSync('python3', [qui + 'strumenti/interfaccia/miniature.py', qui + '.catture', pre, usc], { stdio: 'inherit' });
  if (r.status !== 0) console.log('Per ripassarle serve Pillow: pip3 install pillow, poi di nuovo npm run vedute.');
}
