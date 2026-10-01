import { calcolaCampo } from './fiume.js';

// Il campo di distanza dal fiume si calcola mentre altri worker fanno le texture.
self.onmessage = () => { const c = calcolaCampo(); self.postMessage(c, [c.buffer]); };
