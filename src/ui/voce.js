/* =====================================================================
   LEGGI AD ALTA VOCE

   La voce del dispositivo (Web Speech API), nella lingua della pagina:
   gratis, senza file e senza rete. Serve a chi legge con fatica, ai più
   piccoli, a chi guarda la città alla LIM. Se il browser non ha voci, i
   pulsanti «Ascolta» non compaiono.
   ===================================================================== */

const sintesi = typeof window !== 'undefined' ? window.speechSynthesis : null;

class Voce {
  constructor() {
    this.bottone = null;
    this.lingua = 'it-IT';
  }

  get disponibile() { return Boolean(sintesi && window.SpeechSynthesisUtterance); }

  /** La voce migliore per la lingua: quella locale del sistema, se c'è. */
  scegliVoce() {
    const voci = sintesi.getVoices().filter(v => v.lang.replace('_', '-').startsWith(this.lingua.slice(0, 2)));
    return voci.find(v => v.localService && v.lang.replace('_', '-') === this.lingua) || voci.find(v => v.localService) || voci[0] || null;
  }

  /** Legge un testo; se si ripreme lo stesso pulsante, si ferma. */
  leggi(testo, bottone = null) {
    if (!this.disponibile) return;
    const eraQuesto = bottone && bottone === this.bottone && sintesi.speaking;
    this.ferma();
    if (eraQuesto) return;
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = this.lingua; u.rate = 0.95;
    const v = this.scegliVoce(); if (v) u.voice = v;
    this.bottone = bottone;
    if (bottone) { bottone.setAttribute('aria-pressed', 'true'); bottone.dataset.prima = bottone.dataset.prima || bottone.textContent; }
    u.onend = u.onerror = () => { if (this.bottone === bottone) this.libera(); };
    sintesi.speak(u);
  }

  libera() {
    if (this.bottone) this.bottone.setAttribute('aria-pressed', 'false');
    this.bottone = null;
  }

  ferma() {
    if (sintesi?.speaking || sintesi?.pending) sintesi.cancel();
    this.libera();
  }
}

export const voce = new Voce();
