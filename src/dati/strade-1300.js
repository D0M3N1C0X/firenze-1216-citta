/* =====================================================================
   LE STRADE DEL 1300

   Due regole diverse, perché le due parti della città sono diverse.

   DENTRO LA CERCHIA DEL 1172–75 vale la regola del 1216 (strade-1216.js):
   i tracciati del centro sono in gran parte medievali, e si tolgono le
   eccezioni note. Dal 1216 al 1300 cambiano poche cose, scritte in
   NEL_1300: i ponti nuovi, via Maggio, la piazza dei Priori che comincia.

   FUORI DALLA CERCHIA VECCHIA, fino alle mura nuove, la regola si
   rovescia: una strada di oggi c'è nel 1300 solo se una fonte la mette
   prima del 1300 (FUORI). Le altre no. Il motivo è che dentro la cerchia
   nuova, nel 1300 e per secoli dopo, c'erano grandi orti, campi e
   conventi (Wikipedia, «Mura di Firenze»: la crisi del Trecento «permise
   così per secoli la presenza all'interno della cinta di grandi aree
   verdi, destinate a coltivazioni, pascolo, e giardini»), e molti
   quartieri di oggi sono del Quattrocento (Borgo Pinti) o dell'Ottocento
   (la Mattonaia, Barbano, i viali).

   LE FONTI. Per ogni strada fuori dalla cerchia vecchia è stata letta il
   6 novembre 2026 la sua voce su Wikipedia, quando c'è (130 su 281), che
   per lo più riprende lo Stradario storico e amministrativo del Comune di
   Firenze (1913) e Bargellini-Guarnieri, *Le strade di Firenze*. Sono
   letture di comodo: ogni motivo qui sotto è **[da verificare]** su
   quelle opere e su Sznura 1975, finché non è controllato.

   LE STRADE SENZA FONTE (decisione del 6/11/2026). Delle 151 strade fuori
   dalla cerchia vecchia di cui non è stata letta nessuna fonte, entrano come
   «ipotesi» quelle che passano vicino a una chiesa o a un convento di prima
   del 1300 (CHIESE); le altre restano fuori fino a un controllo su Sznura
   1975 o sullo Stradario del 1913. Non entrano mai quelle che una fonte
   data dopo il 1300 (DOPO).

   LIVELLO: i tracciati sono «dedotto» (o «ipotesi», per le strade delle
   chiese), le larghezze «ipotesi».
   ===================================================================== */

import { ESCLUSE as ESCLUSE_1216, larghezza, ritaglia } from './strade-1216.js';
import { MURO, PORTE as PORTE_VECCHIE, dentroTracciato } from './cerchia.js';
import { dentroLimite } from './cerchia-1300.js';
import { IMPRONTE } from './osm-1300.js';

/** Escluse nel 1216 ma presenti nel 1300, con il motivo. */
export const NEL_1300 = {
  'Ponte alla Carraia': 'pile fondate nel 1218, finito nel 1220 (Villani VI, 41–42)',
  'Ponte alle Grazie': 'il ponte Rubaconte, del 1237 (Villani VII, 26)',
  'Ponte Santa Trinita': 'del 1252 (Villani VII, 50); dopo la piena del 1269 [da verificare] (lacuna 65)',
  'Via Maggio': 'le prime case verso il 1260, dei Velluti (Wikipedia, «Via Maggio»)',
  'Piazza dei Mozzi': 'lo slargo al capo del ponte Rubaconte, del 1237',
  // piazza della Signoria non c'è nell'estratto OpenStreetMap come strada: il guasto degli Uberti è disegnato a mano (AGGIUNTE_1300, in fondo)
  'Piazza di Santo Spirito': 'il convento agostiniano è della metà del Duecento [da verificare]: la piazza come spazio aperto, nella forma di oggi è successiva'
};

/** Escluse anche nel 1300, con il motivo aggiornato quando cambia. */
export const ESCLUSE = Object.fromEntries(Object.entries(ESCLUSE_1216).filter(([n]) => !(n in NEL_1300)).map(([n, m]) => [n, m]));
Object.assign(ESCLUSE, {
  'Piazza del Duomo': 'nel 1300 la cattedrale nuova è un cantiere appena cominciato (Villani IX, 9); la piazza di oggi è successiva',
  'Lungarno delle Grazie': 'la Repubblica decide un lungarno «ampio dieci braccia» a monte del ponte con la cerchia nuova (Wikipedia, «Lungarno delle Grazie»): quando, non si sa [da verificare]'
});

/**
 * Fuori dalla cerchia vecchia: le strade che c'erano nel 1300, con il
 * motivo. Le citazioni fra virgolette sono delle voci di Wikipedia della
 * strada, lette il 6/11/2026 [da verificare sulle fonti che riprendono].
 */
export const FUORI = {
  // le strade che escono dalle porte della cerchia vecchia: i borghi
  'Borgo Allegri': 'un «borgo», cioè fuori dalle mura del XII secolo',
  'Borgo Ognissanti': 'gli Umiliati arrivano nel 1250; con la cerchia del 1284 diventa l\'accesso a Porta al Prato',
  'Borgo Pinti': 'già borgo Fulceraco intorno al 1100; le case fitte sono del Quattrocento, nel 1300 è ancora «in larga parte agricola ed ecclesiastica»',
  'Borgo San Frediano': 'il borgo fuori dalla porta di San Jacopo; la chiesa di San Frediano è antica [da verificare: data]',
  'Borgo Santa Croce': 'un borgo fuori dalla cerchia vecchia, «nato per collegare» verso Santa Croce',
  'Borgo Tegolaio': 'nome di borgo; via del Presto di San Martino «fu un continuamento di borgo Tegolaio» [da verificare: data]',
  'Borgo della Stella': 'nome attestato «fin dalla metà del XIV secolo», borgo fuori dalla prima cerchia: per il 1300 è un\'ipotesi',
  'Borgo la Croce': 'la direttrice che esce da Porta San Piero verso la porta di Santa Candida, fondata nel 1284 (Villani VIII, 99)',
  'Borgo la Noce': 'nome «molto antico, risalente a prima della seconda cerchia»',
  'Corso dei Tintori': 'formata «nella città dell\'XI–XII secolo, appena fuori dalla Porta ai Buoi»',
  'Costa San Giorgio': 'il borgo era già nella cerchia del 1172–75; la parte alta, fino alla porta San Giorgio, è del 1324 circa e non c\'è (TAGLI)',
  'Piazza San Felice': 'il borgo medievale da Santa Felicita a San Felice',
  'Piazza Sant\'Ambrogio': 'la chiesa di Sant\'Ambrogio è «tra le più antiche di Firenze»',
  'Piazza dei Bonsi': 'lungo «la prima fortificazione d\'Oltrarno, del 1173 circa»',
  'Via del Canneto': 'lungo «la prima fortificazione d\'Oltrarno, del 1173 circa»',
  'Piazza della Santissima Annunziata': 'nome attestato «dalla seconda metà del XIII secolo»: i Servi di Maria dal 1233, la basilica dal 1250; la forma della piazza di oggi è del Quattrocento',
  'Piazza di Santa Croce': 'i francescani arrivano nel 1226–28; nel 1301 «vi si facea il predicare» (Villani IX, 49)',
  'Piazza Santa Croce': 'come piazza di Santa Croce (in OSM una parte ha questo nome)',
  'Piazza di Santa Maria Novella': 'la piazza davanti alla chiesa dei domenicani, per le prediche [da verificare: data; nessuna voce letta]',
  'Piazza d\'Ognissanti': 'la piazza davanti alla chiesa degli Umiliati, dal 1250 [da verificare; nessuna voce letta]',
  'Piazza di Santa Maria Nuova': 'l\'ospedale di Folco Portinari è del 1288 [da verificare; nessuna voce letta]',
  'Via Camillo Cavour': 'unisce «due antiche vie, via Larga e via San Leopoldo»: nel 1300 c\'è via Larga [da verificare: fin dove]',
  'Via Faenza': 'la strada verso la porta di Faenza, fondata nel 1284 (Villani VIII, 99)',
  'Via Fiesolana': 'esce dalla porta di San Piero verso Fiesole: denominazione «antica e attestata»',
  // via Verdi, via de' Benci, via Bufalini e via Sant'Egidio corrono sul muro vecchio, che nel 1300 c'è ancora:
  // come nel 1216 al loro posto ci sono il muro e il fosso (strade-1216.js), e non si mettono qui
  'Via Guelfa': 'il nome «è comunque antico, almeno per il tratto finale»; Sant\'Orsola è del 1309: per il 1300 è un\'ipotesi',
  'Via Mazzetta': 'denominazione «attestata almeno dal Trecento»; è la linea della cerchia d\'Oltrarno dopo il 1260 (cerchia-1300.js)',
  'Via Sant\'Agostino': 'lungo la cerchia d\'Oltrarno, «più probabilmente qui databili dopo il 1260»',
  'Via dei Serragli': 'la linea della cerchia d\'Oltrarno del 1300 (cerchia-1300.js)',
  'Via del Campuccio': 'la linea dell\'allargamento della fine del Duecento, con la porta di Giano della Bella (cerchia-1300.js)',
  'Via Palazzuolo': 'il primo tratto era «borgo San Paolo», fuori dalla porta a San Paolo della cerchia vecchia',
  'Via Panicale': 'detta anche «borgo Panicale»',
  'Via Pietrapiana': 'un «borgo» che usciva dalla porta di San Piero, «seguendo... un tracciato che era già presente»',
  'Via Romana': 'la strada per Roma attraverso l\'Oltrarno [da verificare; la voce non dà date]',
  'Via San Cristofano': 'denominazione antica, dal santo «tra i più venerati nel Medioevo» [da verificare: data]',
  'Via San Gallo': 'la «direttrice romana»; la chiesetta di San Gallo sul Mugnone è del 1218',
  'Via Santa Reparata': 'creata «alla fine del Duecento», parallela a via San Gallo, per un nuovo sviluppo verso nord',
  'Via San Zanobi': 'come via Santa Reparata, della fine del Duecento',
  'Via degli Avelli': 'lungo gli avelli di Santa Maria Novella; allargata nel 1867 [da verificare: data del tracciato]',
  'Via dei Fibbiai': 'qui «scorreva il percorso del Mugnone prima della costruzione delle mura del 1284»; «antichissima direttrice», soppiantata dopo il 1255 da via dei Servi',
  'Via del Castellaccio': 'nella Firenze medievale aveva «un\'importanza ben superiore a quella attuale»; il Mugnone prima del 1284',
  'Via dei Ginori': 'era «borgo San Lorenzo di Sopra», fuori dalla porta di San Lorenzo',
  'Via dei Macci': 'l\'ospedale di San Francesco al Tempio de\' Macci; l\'oratorio soppresso nel 1307',
  'Via dei Pepi': 'denominazioni antiche per tratti [da verificare: data]',
  'Via dei Vellutini': 'il «primitivo nucleo» dei Velluti, prima di via Maggio',
  'Via del Presto di San Martino': '«fu un continuamento di borgo Tegolaio»',
  'Via dell\'Ariento': '«esistente fino dal XIV secolo»: per il 1300 è un\'ipotesi',
  'Via della Scala': 'l\'«antica strada»; l\'ospedale di Santa Maria della Scala è del 1313 [da verificare: la strada prima del 1313]',
  'Via di Camaldoli': 'i camaldolesi hanno San Salvatore dal 1102'
};

/**
 * Fuori dalla cerchia vecchia, le strade che la voce di Wikipedia data DOPO
 * il 1300: non ci sono, e non diventano ipotesi nemmeno se passano vicino a
 * una chiesa (lette il 6/11/2026).
 */
export const DOPO = {
  'Costa Scarpuccia': 'nel Duecento è un nome di luogo; la strada arriva alla costa San Giorgio nel Settecento',
  'Lungarno Amerigo Vespucci': 'creato nel 1853', 'Lungarno Generale Diaz': 'il tiratoio dell\'Arte della Lana fino al 1858; lungarno dell\'Ottocento',
  'Lungarno della Zecca Vecchia': 'aperto dopo la delibera del 1867', 'Lungarno Soderini': 'i lungarni sono successivi [da verificare]',
  'Piazza Adua': 'anni Trenta del Novecento', 'Piazza Cesare Beccaria': 'di Giuseppe Poggi, 1876', 'Piazza Isidoro Del Lungo': 'quartiere del Maglio, 1864 circa',
  'Piazza Lorenzo Ghiberti': 'seconda metà dell\'Ottocento', 'Piazza Massimo d\'Azeglio': 'la Mattonaia, dal 1864–65', 'Piazza Torquato Tasso': '1901–1905',
  'Piazza dei Ciompi': 'Novecento', 'Piazza dei Cavalleggeri': 'con la Biblioteca Nazionale, 1911–1935', 'Piazza del Carmine': 'si forma nel 1330, per le prediche',
  'Piazza del Mercato Centrale': 'con il Mercato Centrale, dal 1865', 'Piazza del Tiratoio': 'fine del Seicento', 'Piazza dell\'Indipendenza': 'l\'orto di Barbano, piazza dal 1838–42',
  'Piazza della Calza': 'le monache arrivano nel 1531', 'Piazza della Stazione': '1841–1848', 'Piazza Giuseppe Poggi': 'i mulini sono del 1356; la piazza è dell\'Ottocento',
  'Piazzale Donatello': 'sui viali dell\'Ottocento', 'Piazza della Libertà': 'lo spiazzo di Porta San Gallo è del Trecento, la piazza del 1865', 'Ponte Amerigo Vespucci': 'Novecento',
  'Via Alessandro Manzoni': 'dopo il 1865', 'Via Antonio Magliabechi': '1913–1935', 'Via Giosuè Carducci': 'dal 1864', 'Via Giuseppe Giusti': 'lungo gli orti della Crocetta (1511)',
  'Via Laura': 'il monastero è del 1502', 'Via Nazionale': '«relativamente recente»', 'Via Pietro Thouar': 'aperta nel 1880', 'Via delle Casine': 'aperta nel 1880',
  'Via Silvio Pellico': 'dopo il 1865', 'Via Vittorio Alfieri': 'dopo il 1865', 'Via della Colonna': 'il tratto storico è aperto nel 1318', 'Via della Mattonaia': 'fino all\'Ottocento un collegamento fra orti',
  'Via delle Ruote': 'creata nel 1350', 'Via della Chiesa': 'la chiesa è del 1517', 'Via della Pergola': 'nel 1300 orti fuori dalle mura', 'Viale Filippo Strozzi': 'viali del 1865',
  'Viale Fratelli Rosselli': 'viali del 1865', 'Viale Giacomo Matteotti': 'viali del 1865', 'Viale Spartaco Lavagnini': 'viali del 1865', 'Viale Antonio Gramsci': 'viali del 1865',
  'Viale della Giovine Italia': 'viali del 1865', 'Piazza dell\'Unità Italiana': 'piazza dell\'Ottocento, dietro Santa Maria Novella [da verificare]', 'Viale Francesco Petrarca': 'viali del 1865', 'Viale Ludovico Ariosto': 'viali del 1865', 'Piazza di Cestello': 'la chiesa di oggi è del Seicento'
};

/**
 * Le chiese e i conventi fuori dalla cerchia vecchia che c'erano prima del
 * 1300 (decisione del 6/11/2026): una strada senza fonte che ci passa vicino
 * (entro VICINO_CHIESA metri) entra come «ipotesi». Le date sono quelle note
 * e sono tutte [da verificare], salvo quelle con il rimando a Villani.
 */
export const CHIESE = {
  'Basilica della Santissima Annunziata': 'i Servi di Maria dal 1233, la basilica dal 1250 (Wikipedia, «Piazza della Santissima Annunziata»)',
  'Basilica di Santa Croce': 'i francescani dal 1226–28; la chiesa nuova dal 1294 (Villani IX, 7)',
  'Basilica di Santa Maria Novella': 'i domenicani; la chiesa nuova dal 1279 [da verificare]',
  'Basilica di Santa Maria del Carmine': 'i carmelitani; la chiesa dal 1268 [da verificare]',
  'Basilica di Santa Maria del Santo Spirito': 'gli agostiniani dalla metà del Duecento [da verificare]',
  'Ognissanti': 'gli Umiliati dal 1250 (Wikipedia, «Borgo Ognissanti»)',
  'Sant\'Ambrogio': '«tra le più antiche di Firenze» (Wikipedia, «Piazza Sant\'Ambrogio»)',
  'Chiesa di San Paolino': 'chiesa antica, del X secolo [da verificare]',
  'Chiesa di San Pier Gattolino': 'la chiesa della porta d\'Oltrarno verso Roma [da verificare: data]',
  'Chiesa di Santa Lucia sul Prato': 'sul prato d\'Ognissanti, metà del Duecento [da verificare]',
  'San Jacopo in Campo Corbolini': 'dei cavalieri ospitalieri, Duecento [da verificare]',
  'Chiesa di Sant\'Egidio': 'la chiesa dell\'ospedale di Santa Maria Nuova, 1288 [da verificare]',
  'Chiesa di San Giorgio alla Costa': 'chiesa antica sulla costa [da verificare: data]',
  'Basilica di San Marco': 'i Silvestrini dal 1299 [da verificare]',
  'Chiesa di San Jacopo di Ripoli': 'le domenicane di Ripoli dal 1292 [da verificare]'
};
const VICINO_CHIESA = 35;
const puntiChiese = IMPRONTE.filter(i => i.nome in CHIESE).map(i => ({ nome: i.nome, punti: i.punti }));
function chiesaVicina(s) {
  for (const c of puntiChiese) for (const p of s.punti) for (const q of c.punti)
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) < VICINO_CHIESA) return c.nome;
  return null;
}

/**
 * Una strada c'è nel 1300? «dentroVecchia» vuol dire dentro la cerchia vecchia
 * per più di metà. Restituisce null se non c'è, altrimenti il livello del
 * tracciato: «dedotto» se una fonte la mette prima del 1300, «ipotesi» se
 * passa vicino a una chiesa di prima del 1300 e non ha una fonte.
 */
export function livelloNel1300(s, dentroVecchia) {
  if (dentroVecchia) return s.nome in ESCLUSE ? null : 'dedotto';
  if (s.nome in FUORI) return 'dedotto';
  if (s.nome in DOPO || /^(Viale|Lungarno|Piazzale|Sottopasso|Rampe)/.test(s.nome)) return null;
  // solo strade vere: non i passaggi pedonali, i servizi e le gallerie di oggi
  if (!/^(residential|pedestrian|unclassified|tertiary|secondary|living_street)$/.test(s.tipo)) return null;
  return chiesaVicina(s) ? 'ipotesi' : null;
}

/** Le strade che il modello tiene come ipotesi, con la chiesa vicina: per la verifica e per il piano. */
export function ipotesiPerChiese(tutte, dentroVecchiaDi) {
  const out = new Map();
  for (const s of tutte) if (!dentroVecchiaDi(s) && livelloNel1300(s, false) === 'ipotesi' && !out.has(s.nome)) out.set(s.nome, chiesaVicina(s));
  return out;
}

/* -------------------------------------------------- dentro e fuori */

/**
 * Tagli: le strade di oggi che nel 1300 c'erano solo in parte. La costa San
 * Giorgio arrivava alla biforcazione con la costa Scarpuccia, e solo con le
 * mura nuove (verso il 1324) fu prolungata fino alla porta San Giorgio
 * (Wikipedia, «Costa San Giorgio»; lacuna 78). La biforcazione è a z = 322.
 */
export const TAGLI = {
  'Costa San Giorgio': (x, z) => z <= 322.5
};

const SUL_MURO = 7;           // come nel 1216: il muro vecchio e il suo fosso
function distanza(pts, x, z) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}
const sulMuro = (x, z) => distanza(MURO, x, z) < SUL_MURO;
const nellaCitta = (x, z) => dentroLimite(x, z) && !sulMuro(x, z);

/**
 * Le strade del 1300: quelle di oggi che valgono, tagliate sul limite della
 * cerchia nuova e sul muro vecchio, più i passaggi delle porte vecchie.
 * Le aggiunte del 1216 (Mercato Vecchio, piazza di San Giovanni, la strada per
 * San Felice) valgono anche nel 1300 e le aggiunge chi costruisce.
 */
export function strade1300(tutte) {
  const out = [];
  for (const s of tutte) {
    const dentroVecchia = s.punti.filter(p => dentroTracciato(p[0], p[1])).length > s.punti.length / 2;
    const livello = livelloNel1300(s, dentroVecchia);
    if (!livello) continue;
    const l = livello === 'ipotesi' ? Math.min(larghezza(s.nome), 3.6) : larghezza(s.nome);
    if (s.area) {
      const c = s.punti.reduce((a, p) => [a[0] + p[0] / s.punti.length, a[1] + p[1] / s.punti.length], [0, 0]);
      if (nellaCitta(c[0], c[1])) out.push({ ...s, larghezza: l, livello });
      continue;
    }
    const taglio = TAGLI[s.nome];
    const tiene = taglio ? (x, z) => nellaCitta(x, z) && taglio(x, z) : nellaCitta;
    for (const punti of ritaglia(s.punti, tiene)) out.push({ ...s, punti, larghezza: l, fuoriVecchia: !dentroVecchia, livello });
  }
  for (const p of PORTE_VECCHIE.filter(p => p.pos)) {
    const [x, z] = p.pos, [dx, dz] = p.dir, l = 13;
    out.push({ nome: p.nome, porta: p.id, larghezza: p.tipo === 'porta' ? 4.2 : 2.6, punti: [[x - dx * l, z - dz * l], [x + dx * l, z + dz * l]] });
  }
  return out;
}

/**
 * Aggiunte a mano per il 1300, come AGGIUNTE in strade-1216.js. Livello «ipotesi».
 *
 * IL GUASTO DEGLI UBERTI. OpenStreetMap non ha piazza della Signoria come
 * area: senza questa aggiunta il modello ci costruirebbe case. Nel 1300 qui ci
 * sono i «casolari» abbattuti degli Uberti, di cui «feciono piazza, acciò che
 * mai non si rifacessono»; il palazzo dei Priori fu messo «musso», storto, per
 * non posarlo sul loro terreno (Villani IX, 26). Il guasto è quindi a ovest del
 * palazzo: qui è disegnato fra lo sbocco di via Vacchereccia, quello di via dei
 * Calzaiuoli e il fianco ovest di Palazzo Vecchio, con le misure della parte
 * ovest della piazza di oggi. Forma e misure sono ipotesi (lacuna 68).
 */
export const AGGIUNTE_1300 = [
  {
    nome: 'Il guasto degli Uberti',
    area: true,
    punti: [[143, -200], [203, -205], [203, -112], [180, -104], [143, -132]],
    motivo: 'le case degli Uberti abbattute nel 1258 (Villani VII, 65) e lasciate vuote (IX, 26); forma e misure ipotetiche'
  }
];
