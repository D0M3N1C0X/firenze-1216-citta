/* =====================================================================
   LA REGIA DELLE SCENE RECITATE (app per iPad, Unity)

   Decisioni del 17 novembre 2026: le scene del copione si recitano con
   attori nella città; si vede in prima persona, con gli occhi dell'allievo
   notaio; i personaggi con un nome hanno una figura propria, con i colori
   della casata (strumenti/figure/figure.py, PERSONAGGI); la violenza si
   mostra, con il sangue, e si può togliere (impostazione «senza sangue»,
   avviso per l'insegnante). Si mostra solo quello che il notaio vede nel
   copione: il colpo di coltello di Campi e l'assalto al ponte non si
   vedono, perché il notaio non c'era (I3: «Da fuori senti un grido»; IV3:
   «Buondelmonte è a terra»). Nessuna scena in più.

   Il testo e le scelte restano quelli del copione (copione.js): la regia
   aggiunge soltanto chi sta in scena e che cosa fa mentre la voce legge.

   Posizioni: [avanti, destra] in metri rispetto a chi guarda, dal punto
   di vista della scena (scene.js, vista: dove stai e verso dove guardi).
   Così la regia non dipende dalle coordinate della città; l'app mette
   ogni attore sul punto calpestabile più vicino.

   Per ogni scena:
   - attori: { chi, a: [avanti, destra], guarda: 'te' | chi | [a, d],
       posa: 'fermo' | 'seduto' | 'in sella' | 'a terra' | un movimento,
       porta: attrezzo in mano, cavallo: modello (Modelli/Animali) }
     chi è un personaggio (figure.json dei personaggi) o un ruolo della
     folla seguito da un numero («cavaliere#2»: una figura qualsiasi di quel
     ruolo, presa dalla gente della città).
   - folla: gruppi di comparse { ruoli, n, centro: [a, d], raggio, posa }
   - battute: una per paragrafo del testo, nello stesso ordine. Ogni
     battuta può dire chi pronuncia le frasi tra «» di quel paragrafo
     (voci: un nome per ogni «…», nell'ordine; le parti fuori dalle
     virgolette le legge la voce del racconto) e che cosa succede mentre
     la si legge (fa: [{ dopo: secondi, chi, ... }]).
     Le azioni: va: [a, d] (cammina fin lì), gesto: movimento, guarda,
     posa, dice (solo il movimento delle labbra e del corpo: «parla»),
     oggetto: { cosa, da: chi, a: chi | [a, d], vola: true },
     sangue: { su: chi, dove: 'braccio' | 'terra' }, suono, buio (il
     notaio esce o torna: dissolvenza), sparisce.
   - adattamento: che cosa l'app mostra di diverso dal copione, quando è
     diverso da quello che dice la città nel browser (scene.js).
   - sangue: true se nella scena c'è sangue (senza sangue: non si mostra,
     e il ferito resta ferito).

   Ciò che la regia aggiunge al copione è un'ipotesi di messa in scena:
   dove stanno le persone, i gesti, la folla. Quando il copione dice chi
   è presente, la regia non aggiunge nessun personaggio con un nome.
   ===================================================================== */

/** Disteso a terra, sulla schiena (IV3): rotazioni come POSA_SELLA (mondo/abitanti.js), da aggiungere alla posa a T.
    Composta a mano il 23 novembre 2026 al posto dell'ultimo fotogramma della caduta (lì la veste si rovescia): le
    braccia lungo i fianchi, appena aperte, una gamba piegata, la testa girata. Da regolare guardandola in Unity. */
export const POSA_A_TERRA = {
  LeftArm: [0, 0, -1.15], RightArm: [0, 0, 1.0],
  LeftForeArm: [0, -0.35, 0], RightForeArm: [0, 0.6, 0],
  LeftUpLeg: [-0.08, 0, -0.05], RightUpLeg: [-0.35, 0, 0.12], RightLeg: [0.6, 0, 0],
  Head: [0, 0.45, 0.1]
};

/** Le voci dell'iPad (sintesi vocale di iOS): altezza e velocità di chi parla. */
export const VOCI = {
  racconto: { altezza: 1.0, velocita: 0.5 },
  sanzanome: { altezza: 0.8, velocita: 0.45 },
  uberto: { altezza: 0.95, velocita: 0.52 },
  oddo: { altezza: 0.85, velocita: 0.55 },
  cilia: { altezza: 1.25, velocita: 0.5 },
  gualdrada: { altezza: 1.1, velocita: 0.46 },
  servitore: { altezza: 1.05, velocita: 0.55 },
  fifanti: { altezza: 0.9, velocita: 0.5 },
  messo: { altezza: 0.85, velocita: 0.48 },
  uomo: { altezza: 1.0, velocita: 0.6 },
  passante: { altezza: 1.1, velocita: 0.55 }
};

export const REGIA = {
  // la bottega e i luoghi senza luogo (scene.js, fuori) si leggono sul quaderno: nessun attore
  P1: { quaderno: true, battute: [{}, {}, { voci: ['sanzanome'] }, { voci: ['passante', 'uomo'] }] },
  II1: { quaderno: true, battute: [{}, { voci: ['sanzanome'] }, {}] },
  III3a: { quaderno: true, battute: [{ voci: ['messo'] }] },

  // ------------------------------------------------ Campi, il convito
  // La sala del castello (modello di Blender, Modelli/Monumenti/indice.json «campi»): la tavola lunga a nord (posti 0–23,
  // rivolti a sud), due tavole a sud (24–40, rivolti a nord), la tavola alta a est, su una pedana (41–49, rivolti a ovest);
  // in mezzo la corsia dove passano i servitori. «posto»: il numero del posto (seduto, rivolto verso la tavola);
  // { qui: [x, z] }: un punto preciso della sala, in coordinate del browser (x verso est, z verso sud).
  // Chi siede dove: Mazzingo al centro della tavola alta (è la sua festa); Uberto e Buondelmonte vicini, allo stesso
  // tagliere (Faini p. 18: interpretazione); Oddo all'altro capo della stessa tavola, tra i Fifanti. Ipotesi di regia.
  I1: {
    adattamento: 'Il castello dei Mazzinghi non c\'è più: castello, sala e convito sono un\'ipotesi. I personaggi con un nome hanno una figura e i colori della casata, per riconoscerli (ipotesi); dove siede ciascuno è un\'ipotesi di regia.',
    attori: [
      { chi: 'mazzingo-mazzinghi', posto: 45 },
      { chi: 'uberto-infangati', posto: 1 },
      { chi: 'buondelmonte', posto: 2 },
      { chi: 'oddo-arrighi', posto: 22 },
      { chi: 'giullare', qui: [-7.2, -12.6], guarda: [6, 0], posa: 'ride' },
      { chi: 'servitore', qui: [-3, -11.2], guarda: [4, 0], porta: 'brocca' }
    ],
    folla: [
      { posti: true, ruoli: ['cavaliere', 'mercante', 'cavaliere', 'nobildonna', 'mercante', 'mercantessa'] },
      { ruoli: ['popolano', 'fantesca', 'ragazzo'], n: 3, centro: [3, 0], raggio: 2, posa: 'fermo' }
    ],
    battute: [{ fa: [
      { dopo: 1, chi: 'mazzingo-mazzinghi', gesto: 'beve' },
      { dopo: 3, chi: 'giullare', gesto: 'ride' },
      { dopo: 4, chi: 'servitore', va: { qui: [2.4, -11.6] } }
    ] }, {}]
  },
  I2a: {
    sangue: false,
    attori: [
      { chi: 'uberto-infangati', posto: 1 },
      { chi: 'buondelmonte', posto: 2 },
      { chi: 'oddo-arrighi', posto: 22 },
      { chi: 'giullare', qui: [-8.5, -12.6], guarda: 'uberto-infangati' }
    ],
    folla: [{ posti: true, ruoli: ['cavaliere', 'mercante', 'nobildonna', 'cavaliere', 'mercante', 'mercantessa'] }],
    battute: [{
      fa: [
        { dopo: 0.5, chi: 'giullare', va: { qui: [-11.2, -13.4] } },
        { dopo: 2.5, chi: 'giullare', oggetto: { cosa: 'tagliere', da: 'uberto-infangati', a: 'giullare' } },
        { dopo: 3, chi: 'giullare', va: { qui: [-5, -12] }, gesto: 'ride' },
        { dopo: 5.5, chi: 'oddo-arrighi', posa: 'fermo', gesto: 'discute', guarda: 'uberto-infangati' },
        { dopo: 9, chi: 'uberto-infangati', posa: 'fermo', gesto: 'discute', guarda: 'oddo-arrighi' },
        { dopo: 12.5, chi: 'oddo-arrighi', gesto: 'getta', oggetto: { cosa: 'tagliere', da: 'oddo-arrighi', a: 'uberto-infangati', vola: true } },
        { dopo: 13.6, chi: 'uberto-infangati', gesto: 'resiste' }
      ]
    }]
  },
  I2b: {
    attori: [
      { chi: 'oddo-arrighi', qui: [-1.6, -12.3], guarda: 'uberto-infangati' },
      { chi: 'uberto-infangati', qui: [-11.4, -13.2], guarda: 'oddo-arrighi' }
    ],
    folla: [
      // «c'è troppa gente in piedi»: tra te e Uberto
      { ruoli: ['cavaliere', 'mercante', 'popolano', 'cavaliere'], n: 12, centro: { qui: [-7.5, -12.4] }, raggio: 2.2, posa: 'guarda', verso: { qui: [-11.4, -13.2] } },
      { posti: true, ruoli: ['nobildonna', 'mercante', 'mercantessa'] }
    ],
    battute: [{
      voci: ['uberto'],
      fa: [
        { dopo: 4, chi: 'uberto-infangati', gesto: 'discute' },
        { dopo: 7.5, chi: 'oddo-arrighi', gesto: 'getta', oggetto: { cosa: 'tagliere', da: 'oddo-arrighi', a: 'uberto-infangati', vola: true } }
      ]
    }]
  },
  I2c: {
    attori: [
      { chi: 'servitore', qui: [-17, -11.3], guarda: 'te' },
      { chi: 'giullare', qui: [-9, -12.6], guarda: 'uberto-infangati' },
      { chi: 'uberto-infangati', posto: 1 },
      { chi: 'oddo-arrighi', posto: 22 }
    ],
    folla: [
      { posti: true, ruoli: ['cavaliere', 'mercante', 'nobildonna', 'cavaliere', 'mercante', 'mercantessa'] },
      { ruoli: ['popolano', 'ragazzo'], n: 2, centro: { qui: [-18.5, -12.5] }, raggio: 1, posa: 'fermo', verso: { qui: [0, -12.2] } }
    ],
    battute: [{
      voci: ['servitore'],
      fa: [
        { dopo: 0.5, chi: 'giullare', va: { qui: [-11.2, -13.4] } },
        { dopo: 2.5, chi: 'giullare', oggetto: { cosa: 'tagliere', da: 'uberto-infangati', a: 'giullare' } },
        { dopo: 3, chi: 'giullare', va: { qui: [-6, -11.5] }, gesto: 'ride' },
        { dopo: 3.5, chi: 'servitore', dice: true },
        { dopo: 11, chi: 'oddo-arrighi', posa: 'fermo', gesto: 'getta', oggetto: { cosa: 'tagliere', da: 'oddo-arrighi', a: 'uberto-infangati', vola: true } }
      ]
    }]
  },
  I3: {
    // il notaio porta fuori le panche nel cortile (vista di scene.js); al grido, buio; rientra nella sala, sulla soglia
    adattamento: 'Il notaio è nel cortile a portare le panche. Quando rientra, nella sala le tavole sono ancora apparecchiate: il copione dice che vengono tolte, l\'app non le toglie.',
    sangue: true,
    attori: [
      { chi: 'servitore', a: [1.2, 0.6], guarda: 'te', porta: 'sgabello' },
      { chi: 'oddo-arrighi', qui: [-6.3, -12.0], guarda: { qui: [-6, -8.6] }, nascosto: true },
      { chi: 'buondelmonte', qui: [-8.0, -12.8], guarda: 'oddo-arrighi', porta: 'coltello', nascosto: true },
      { chi: 'uberto-infangati', qui: [-9.0, -11.0], guarda: { qui: [-6, -8.6] }, nascosto: true },
      { chi: 'cavaliere#1', qui: [-4.4, -11.3], guarda: { qui: [-6, -8.6] }, nascosto: true }
    ],
    folla: [{ ruoli: ['cavaliere', 'mercante', 'popolano', 'nobildonna'], n: 12, centro: { qui: [-7, -12.4] }, raggio: 3.2, posa: 'guarda', verso: { qui: [-6.6, -12.3] }, nascosta: true }],
    battute: [
      { fa: [{ dopo: 1.5, chi: 'servitore', gesto: 'indica' }, { dopo: 4, buio: true }, { dopo: 4.5, suono: 'grido' }] },
      { fa: [
        { dopo: 0, sposta: [-6, -8.6, -6.5, -12.2] },
        { dopo: 0, compare: ['oddo-arrighi', 'buondelmonte', 'uberto-infangati', 'cavaliere#1', 'folla'], via: ['servitore'] },
        { dopo: 0, chi: 'oddo-arrighi', gesto: 'piange', sangue: { su: 'oddo-arrighi', dove: 'braccio' } },
        { dopo: 0.5, luce: true }
      ] },
      { voci: ['uberto', 'fifanti'], fa: [{ dopo: 3, chi: 'uberto-infangati', dice: true }, { dopo: 9, chi: 'cavaliere#1', dice: true }] },
      {}
    ]
  },

  // ------------------------------------------------ in città
  II2: {
    attori: [{ chi: 'cilia', a: [1.3, 0.4], guarda: 'te' }],
    battute: [
      { voci: ['cilia'], fa: [{ dopo: 1, chi: 'cilia', gesto: 'ascolta' }, { dopo: 6, chi: 'cilia', dice: true }] },
      { voci: ['gualdrada'], fa: [{ dopo: 1, chi: 'cilia', gesto: 'discute' }] }
    ]
  },
  II3: {
    attori: [
      { chi: 'lambertuccio-amidei', a: [9, -3], guarda: [9, 0] },
      { chi: 'figlia-amidei', a: [9, -2], guarda: [9, 0] },
      { chi: 'oddo-arrighi', a: [10, -3.5], guarda: [9, 0] },
      { chi: 'gualdrada-donati', a: [14, 3], guarda: [14, 0] },
      { chi: 'figlia-donati', a: [14, 2], guarda: [14, 0] },
      { chi: 'buondelmonte', a: [26, 0], guarda: 'te', posa: 'in sella', cavallo: 'palafreno' }
    ],
    folla: [
      { ruoli: ['cavaliere', 'mercante', 'popolano', 'mercantessa'], n: 12, centro: [9, -4], raggio: 2.5, posa: 'attesa' },
      { ruoli: ['cavaliere', 'mercante', 'popolano', 'nobildonna'], n: 10, centro: [14, 4], raggio: 2.5, posa: 'attesa' }
    ],
    battute: [
      { fa: [{ dopo: 2, chi: 'lambertuccio-amidei', gesto: 'saluta', guarda: 'te' }] },
      { fa: [
        { dopo: 0, chi: 'buondelmonte', va: [12, 0.5] },
        { dopo: 5.5, chi: 'buondelmonte', posa: 'fermo', smonta: true, va: [13.6, 1.4], guarda: 'figlia-donati' },
        { dopo: 9, chi: 'buondelmonte', gesto: 'inchino' },
        { dopo: 9.5, chi: 'gualdrada-donati', gesto: 'stretta_di_mano' }
      ] },
      { fa: [{ dopo: 0, chi: 'figlia-amidei', posa: 'triste', guarda: 'te' }, { dopo: 1, chi: 'lambertuccio-amidei', gesto: 'discute', guarda: 'oddo-arrighi' }] },
      {}, {}
    ]
  },
  III1: {
    attori: [
      { chi: 'sagrestano', a: [7, 0], guarda: 'te', nome: 'Prete Giunta', nascosto: true },
      { chi: 'servitore', a: [5, 2], guarda: 'te', nome: 'Bartolo', nascosto: true },
      { chi: 'uberto-infangati', a: [3, -2], guarda: 'te' }
    ],
    folla: [{ ruoli: ['cavaliere', 'mercante'], n: 10, centro: [12, 0], raggio: 3, posa: 'discute', nascosta: true }],
    battute: [
      { fa: [{ dopo: 1, folla: 'entra', a: [16, 0] }, { dopo: 6, suono: 'porta' }] },
      { fa: [{ dopo: 0, compare: ['sagrestano', 'servitore', 'folla'] }, { dopo: 0.5, folla: 'esce', a: [-20, 6] }] }
    ]
  },
  III2: { battute: [{}] },
  III3b: {
    ora: 18.2,
    attori: [{ chi: 'uberto-infangati', a: [9, 0], guarda: 'te' }],
    battute: [{ voci: ['uberto'], fa: [{ dopo: 0, chi: 'uberto-infangati', va: [1.4, 0.3] }, { dopo: 3, chi: 'uberto-infangati', gesto: 'ride' }] }]
  },
  III3c: { battute: [{}] },
  IV1: {
    folla: [
      { ruoli: ['popolano', 'popolana', 'mercante', 'mercantessa', 'cavaliere', 'ragazzo'], n: 40, sul: 'ponte', posa: 'cammina' }
    ],
    battute: [{ fa: [{ dopo: 0, suono: 'campane' }] }, {}]
  },
  IV2a: {
    attori: [{ chi: 'buondelmonte', a: [6, -14], guarda: [6, 30], posa: 'in sella', cavallo: 'palafreno' }],
    folla: [{ ruoli: ['popolano', 'popolana', 'mercante', 'mercantessa', 'ragazzo', 'fanciulla'], n: 24, centro: [4, 0], raggio: 5, posa: 'cammina' }],
    battute: [{
      fa: [
        { dopo: 0, chi: 'buondelmonte', va: [6, 30] },
        { dopo: 11, suono: 'urla' }, { dopo: 13, suono: 'urla' },
        { dopo: 14, folla: 'corre', a: [40, 0] }
      ]
    }]
  },
  IV2b: {
    attori: [
      { chi: 'schiatta-uberti', a: [7, 0], guarda: 'te', porta: 'mazza' },
      { chi: 'mosca-lamberti', a: [8, -1.5], guarda: [8, 2] },
      { chi: 'oddo-arrighi', a: [9, 1.2], guarda: [8, -1] },
      { chi: 'lambertuccio-amidei', a: [10, -0.5], guarda: [8, 0] },
      { chi: 'cavaliere#1', a: [6.5, 2], guarda: 'te', porta: 'bastone' },
      { chi: 'cavaliere#2', a: [9.5, 2.5], guarda: [8, 0] },
      { chi: 'cavaliere#3', a: [11, 1], guarda: [8, 0] }
    ],
    battute: [{
      fa: [
        { dopo: 1, chi: 'mosca-lamberti', gesto: 'discute' },
        { dopo: 7, chi: 'cavaliere#1', gesto: 'indica', guarda: 'te' },
        { dopo: 11, suono: 'urla' },
        { dopo: 12, chi: 'schiatta-uberti', va: [40, 0] }, { dopo: 12.2, chi: 'cavaliere#1', va: [40, 2] }
      ]
    }]
  },
  IV2c: {
    folla: [
      { ruoli: ['popolano', 'popolana', 'mercante', 'mercantessa', 'nobildonna', 'cavaliere', 'ragazza'], n: 36, centro: [9, 0], raggio: 5, posa: 'si_inginocchia', verso: [30, 0] },
      { ruoli: ['chierico'], n: 3, centro: [26, 0], raggio: 1.5, posa: 'fermo', verso: [0, 0] }
    ],
    attori: [{ chi: 'popolano#1', a: [-14, 0], guarda: [9, 0], nascosto: true }],
    battute: [{
      voci: ['uomo'],
      fa: [
        { dopo: 0, suono: 'canto' }, { dopo: 3, suono: 'rumore' },
        { dopo: 6, compare: ['popolano#1'] }, { dopo: 6, chi: 'popolano#1', va: [3, 0], corre: true },
        { dopo: 9, chi: 'popolano#1', gesto: 'indica' },
        { dopo: 11, folla: 'esce', a: [-30, 0] }
      ]
    }]
  },
  IV3: {
    sangue: true,
    attori: [
      { chi: 'buondelmonte', a: [8, 0], guarda: [8, 4], posa: 'a terra' },
      { chi: 'popolana#1', a: [7.2, -1], guarda: 'buondelmonte', posa: 'si_inginocchia' },
      { chi: 'mercante#1', a: [2, -1], guarda: 'te' },
      { chi: 'popolano#2', a: [2, 1.2], guarda: 'te' }
    ],
    folla: [{ ruoli: ['popolano', 'popolana', 'mercante', 'mercantessa', 'cavaliere', 'ragazzo'], n: 30, intorno: 'buondelmonte', raggio: 3.5, posa: 'guarda', fuori: [4.6, 0] }],
    battute: [
      { fa: [{ dopo: 0, sangue: { su: 'buondelmonte', dove: 'terra' } }, { dopo: 3, chi: 'popolana#1', gesto: 'piange' }] },
      { fa: [{ dopo: 1, chi: 'mercante#1', dice: true }, { dopo: 4, chi: 'popolano#2', dice: true, gesto: 'discute' }] }
    ]
  },
  IV4: {
    sangue: false,
    attori: [
      { chi: 'buondelmonte', a: [10, -6], guarda: [10, 20], posa: 'bara' },
      { chi: 'figlia-donati', a: [10, -6.6], guarda: [10, 20], posa: 'seduto' },
      { chi: 'sagrestano', a: [2, 1], guarda: 'te', nascosto: true, porta: 'registro' }
    ],
    folla: [{ ruoli: ['popolano', 'popolana', 'mercante', 'cavaliere', 'nobildonna', 'chierico'], n: 30, centro: [10, -6], raggio: 4, posa: 'lento', segue: 'buondelmonte' }],
    battute: [
      { fa: [{ dopo: 0, chi: 'buondelmonte', va: [10, 30], lento: true }, { dopo: 1, chi: 'figlia-donati', gesto: 'piange' }] },
      { fa: [{ dopo: 0, buio: true }, { dopo: 1, compare: ['sagrestano'], via: ['buondelmonte', 'figlia-donati', 'folla'] }, { dopo: 1.5, luce: true }, { dopo: 3, chi: 'sagrestano', gesto: 'indica' }] },
      {}
    ]
  }
};

/** Le scene che mostrano sangue o violenza: l'avviso per l'insegnante le elenca. */
export const SCENE_VIOLENTE = Object.entries(REGIA).filter(([, r]) => r.sangue || JSON.stringify(r).includes('getta')).map(([id]) => id);
