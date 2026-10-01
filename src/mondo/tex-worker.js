import { GENERATORI } from './texture-gen.js';

// Un worker genera una texture alla volta e restituisce gli array senza copiarli.
self.onmessage = e => {
  const { nome, S } = e.data;
  const r = GENERATORI[nome](S);
  self.postMessage(r, [r.col.buffer, r.nor.buffer, r.rgh.buffer]);
};
