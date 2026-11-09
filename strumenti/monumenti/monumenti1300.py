# =====================================================================
# I MONUMENTI DEL 1300, modellati in Blender.
#
#   blender -b -Y --python monumenti1300.py -- [nomi...] [tavola]
#   (oppure, con Blender come modulo Python: python monumenti1300.py -- …)
#
# nomi: priori, guasto, loggia_grano, palazzo_popolo (senza nomi: tutti).
# Scrive ../../public/monumenti/<nome>.glb e la sua voce in indice.json, con
# «epoca»: «1300», così la città del 1216 non li scarica (mondo/modelli.js).
#
# Convenzioni: quelle di monumenti.py e del kit (1 unità = 1 metro, la
# facciata sul piano y = 0 verso +Y, l'interno verso -Y, z in alto).
# Le misure in pianta vengono dai volumi degli edifici di oggi (Regione
# Toscana, dati/oggi.js), che comprendono anche aggiunte successive: sono
# «dedotto» per il luogo e «ipotesi» per la forma. Fonti e lacune in
# PIANO-1300.md e in FONTI.md, § 8.
# =====================================================================
import bpy, os, sys, math, random
from mathutils import Vector, Matrix

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import monumenti as M                 # prepara, lastra, arco_punti, conci_arco, tetto_padiglione, esporta, tavola
K = M.K
R = random.Random(1300)


def trave(P, a, b, s, m='legno'):
    """Una trave a sezione quadra s fra due punti qualsiasi (pali, puntoni, funi)."""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-4: u = Vector((1, 0, 0))
    u.normalize(); v = d.cross(u).normalized()
    h = s / 2
    pts = []
    for p in (a, b):
        for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            pts.append(tuple(p + u * su * h + v * sv * h))
    P.solido(pts, m, 0)


def mucchio_conci(P, cx, cy, n, m='conci'):
    """Una catasta di conci squadrati, a file sfalsate."""
    z = 0.0
    fila = 0
    while n > 0:
        k = max(1, 4 - fila)
        for i in range(k):
            if n <= 0: break
            x = cx + (i - k / 2) * 0.75 + (0.35 if fila % 2 else 0)
            P.blocco(x, x + 0.7, z, z + 0.4, cy - 0.3, cy + 0.3, m, smusso=0.02, ruota=R.uniform(-0.05, 0.05))
            n -= 1
        z += 0.41; fila += 1


def macerie(P, cx, cy, r, n, m='pietrame'):
    """Un cumulo di pietre scomposte: blocchi storti, più fitti al centro."""
    for _ in range(n):
        a = R.uniform(0, 2 * math.pi); d = r * math.sqrt(R.random())
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
        z = max(0, (1 - d / r)) * r * 0.45 + R.uniform(-0.1, 0.15)
        w = R.uniform(0.25, 0.6)
        P.blocco(x - w / 2, x + w / 2, z - 0.1, z + R.uniform(0.15, 0.35), y - w * 0.4, y + w * 0.4, m, smusso=0, ruota=R.uniform(0, math.pi))


def rudere(P, x0, x1, y0, y1, hmax, sp=0.6, m='pietrame'):
    """I muri rimasti di una casa abbattuta: il perimetro a pezzi, alto a tratti."""
    for (ax, ay, bx, by) in ((x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)):
        L = math.hypot(bx - ax, by - ay); n = max(1, int(L / 1.2))
        for i in range(n):
            if R.random() < 0.18: continue                       # una breccia
            t0, t1 = i / n, (i + 1) / n
            h = R.uniform(0.3, hmax) if R.random() < 0.6 else R.uniform(0.2, 0.7)
            px0, py0 = ax + (bx - ax) * t0, ay + (by - ay) * t0
            px1, py1 = ax + (bx - ax) * t1, ay + (by - ay) * t1
            P.blocco(min(px0, px1) - (sp / 2 if ax == bx else 0), max(px0, px1) + (sp / 2 if ax == bx else 0), 0, h,
                     min(py0, py1) - (sp / 2 if ay == by else 0), max(py0, py1) + (sp / 2 if ay == by else 0), m, smusso=0)


# ================================================== il cantiere dei Priori
PRIORI = dict(W=51.0, D=34.0)

def priori():
    """Il palazzo dei Priori il 1° maggio 1300, un anno e mezzo dopo la
    fondazione (Villani IX, 26: «Nel detto anno MCCLXXXXVIII si cominciò a
    fondare il palagio de' priori»). Quanto fosse alto non lo sappiamo
    (lacuna 72): qui il piano terreno in bozze di pietraforte, finito fino a
    circa 8 m e irregolare in cima, con i ponteggi, un'antenna da sollevare
    i conci, le cataste, la fossa della calce. Pianta: il volume di oggi del
    corpo con la torre (dati/oggi.js, edificio 4148), 51 × 34 m; Villani dice
    che fu messo «musso», non squadrato, per non posarlo sul terreno degli
    Uberti: la pianta storta del palazzo vero non è riprodotta (ipotesi)."""
    W, D = PRIORI['W'], PRIORI['D']
    T, H0 = 2.0, 8.0
    P = K.Pezzo('priori')
    # la facciata sul guasto, con il portale e due finestrelle
    portale = M.arco_punti(W * 0.42, 4.2, 3.2, 'tondo', n=18)
    fin = [[(x - 0.35, 3.2), (x + 0.35, 3.2), (x + 0.35, 4.6), (x - 0.35, 4.6)] for x in (W * 0.18, W * 0.7)]
    M.lastra(P, [(0, -1.2), (W, -1.2), (W, H0), (0, H0)], [portale] + fin, -T, 0)
    M.conci_arco(P, portale[2:], 0.8, -0.3, 0.05)
    # gli altri tre lati: pieni, con una porta di servizio sul retro
    P.blocco(-0.0, T, -1.2, H0, -D, -T, 'conci', smusso=0.01)
    P.blocco(W - T, W, -1.2, H0, -D, -T, 'conci', smusso=0.01)
    P.blocco(0, W * 0.5 - 1.5, -1.2, H0, -D, -D + T, 'conci', smusso=0.01)
    P.blocco(W * 0.5 + 1.5, W, -1.2, H0, -D, -D + T, 'conci', smusso=0.01)
    # la cima non finita: tratti di muro più alti, a gradoni
    for (x0, x1, y0, y1) in ((0, W, -T, 0), (0, T, -D, -T), (W - T, W, -D, -T), (0, W, -D, -D + T)):
        lungo_x = (x1 - x0) > (y1 - y0)
        L = (x1 - x0) if lungo_x else (y1 - y0)
        s = 0.0
        while s < L - 0.3:
            l = min(L - s, R.uniform(1.8, 3.6))
            h = R.choice([0, 0, 0.6, 1.2, 1.8, 2.4])
            if h:
                if lungo_x: P.blocco(x0 + s, x0 + s + l, H0, H0 + h, y0, y1, 'conci', smusso=0.01)
                else: P.blocco(x0, x1, H0, H0 + h, y0 + s, y0 + s + l, 'conci', smusso=0.01)
            s += l
    # il muro di spina dentro, appena cominciato
    P.blocco(T, W - T, -1.2, 2.6, -D * 0.55, -D * 0.55 + 1.4, 'conci', smusso=0.01)
    # i ponteggi sulla facciata e sul fianco nord: pali, travicelli nelle buche pontaie, tavole
    def ponteggio(lungo, pos, fuori):
        n = int(lungo / 3.2)
        for i in range(n + 1):
            s = i * lungo / n
            a = pos(s, fuori)
            K.cil(P, a[0], a[1], 0.09, 0, H0 + 3.4, 'legno', n=6)
            for z in (3.4, 6.8, 9.6):
                trave(P, pos(s, -0.6) + (z,), a + (z,), 0.11, 'legno')
        for z in (3.4, 6.8, 9.6):
            for k in range(n):
                s0, s1 = k * lungo / n, (k + 1) * lungo / n
                b0, b1 = pos(s0, 0.25), pos(s1, fuori - 0.15)
                P.blocco(min(b0[0], b1[0]), max(b0[0], b1[0]), z + 0.06, z + 0.11, min(b0[1], b1[1]), max(b0[1], b1[1]), 'legno', smusso=0)
            trave(P, pos(0, fuori) + (z + 1.0,), pos(lungo, fuori) + (z + 1.0,), 0.08, 'legno')    # il parapetto
    ponteggio(W, lambda s, f: (s, f), 1.6)                       # facciata: y > 0
    ponteggio(D - T, lambda s, f: (W + f, -s), 1.6)              # fianco nord: x > W
    # una scala a pioli contro il ponteggio
    for x in (W * 0.92, W * 0.92 + 0.5):
        trave(P, (x, 2.6, 0), (x, 1.7, 9.6), 0.07, 'legno')
    for k in range(1, 24):
        z = k * 0.4; y = 2.6 - (0.9 * z / 9.6)
        trave(P, (W * 0.92, y, z), (W * 0.92 + 0.5, y, z), 0.04, 'legno')
    # l'antenna da tiro dentro il cantiere, con il puntone e la fune
    ax, ay = W * 0.5, -D * 0.35
    K.cil(P, ax, ay, 0.22, 0, 17.0, 'legnoScuro', n=8)
    trave(P, (ax, ay, 15.5), (W * 0.42, 3.0, 11.5), 0.18, 'legnoScuro')
    trave(P, (W * 0.42, 3.0, 11.5), (W * 0.42, 3.0, 1.2), 0.03, 'tela')
    for (dx, dy) in ((6, 6), (-6, 6), (0, -7)):                  # i tiranti
        trave(P, (ax, ay, 16.8), (ax + dx, ay + dy, 0), 0.03, 'tela')
    # il carico appeso: un concio con la tenaglia
    P.blocco(W * 0.42 - 0.35, W * 0.42 + 0.35, 0.8, 1.2, 2.7, 3.3, 'conci')
    # le cataste di conci sul guasto, la sabbia, la fossa della calce
    for (cx, cy, n) in ((W * 0.15, 5.0, 11), (W * 0.27, 6.5, 9), (W * 0.62, 5.5, 12), (W * 0.78, 7.0, 8)):
        mucchio_conci(P, cx, cy, n)
    K.cil(P, W * 0.5, 9.0, 2.2, 0, 1.3, 'ghiaia', n=12, r1=0.2)
    # la fossa della calce: quattro tavole intorno, la calce bianca dentro
    x0, x1, y0, y1 = W * 0.86, W * 0.86 + 4.0, 9.0, 11.5
    for (a0, a1, b0, b1) in ((x0, x1, y0, y0 + 0.12), (x0, x1, y1 - 0.12, y1), (x0, x0 + 0.12, y0, y1), (x1 - 0.12, x1, y0, y1)):
        P.blocco(a0, a1, -0.3, 0.3, b0, b1, 'legnoScuro', smusso=0)
    P.blocco(x0 + 0.12, x1 - 0.12, -0.3, 0.18, y0 + 0.12, y1 - 0.12, 'intonaco', smusso=0)
    ob = P.crea()
    M.scala_uv(ob, 0.8)                                          # bozze grandi
    return ob


def priori_posa():
    W, D = PRIORI['W'], PRIORI['D']
    # dentro il cantiere si cammina (il pavimento è il terreno): ostacoli i muri e le cataste
    return dict(W=W, D=D, epoca='1300',
                ostacoli=[[0, W, -2.0, 0], [0, 2.0, -D, 0], [W - 2.0, W, -D, 0], [0, W, -D, -D + 2.0],
                          [W * 0.5 - 0.4, W * 0.5 + 0.4, -D * 0.35 - 0.4, -D * 0.35 + 0.4]],
                fuori=[[W * 0.15 - 1.6, W * 0.15 + 1.6, 4.6, 5.4], [W * 0.27 - 1.6, W * 0.27 + 1.6, 6.1, 6.9],
                       [W * 0.62 - 1.6, W * 0.62 + 1.6, 5.1, 5.9], [W * 0.78 - 1.6, W * 0.78 + 1.6, 6.6, 7.4],
                       [W * 0.5 - 2.2, W * 0.5 + 2.2, 6.8, 11.2], [W * 0.86, W * 0.86 + 4.0, 9.0, 11.5]],
                varchi=[[W * 0.42 - 1.5, W * 0.42 + 1.5, -2.1, 0.1], [W * 0.5 - 1.4, W * 0.5 + 1.4, -D - 0.1, -D + 2.1]])


# ============================================================ il guasto
GUASTO = dict(W=100.0, D=60.0)
# il contorno del guasto (dati/strade-1300.js, AGGIUNTE_1300) nelle coordinate del modello:
# origine nel mondo (203, -205), x verso sud, -y verso ovest
CONTORNO_GUASTO = [(5, 0), (100, 0), (101, -23), (73, -60), (5, -60)]

def dentro_guasto(x, y):
    p = CONTORNO_GUASTO; ok = False
    for i in range(len(p)):
        (ax, ay), (bx, by) = p[i], p[i - 1]
        if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax: ok = not ok
    return ok


def guasto():
    """Il guasto degli Uberti: le case abbattute nel 1258 (Villani VII, 65) e
    lasciate in rovina, perché «mai non si rifacessono» (IX, 26). Qui i muri
    rimasti di otto case, a pezzi, i cumuli di pietre, qualche trave
    bruciata, l'erba. Quante case, dove e come: ipotesi (lacuna 68). Una
    parte delle pietre se l'è già presa il cantiere dei Priori."""
    P = K.Pezzo('guasto')
    case = [(10, -6, 9, 14), (22, -4, 7, 12), (33, -8, 10, 15), (48, -5, 8, 13), (62, -10, 9, 11),
            (12, -30, 12, 9), (30, -36, 8, 14), (52, -34, 11, 10)]
    ostacoli = []
    for (x, y, w, d) in case:
        if not (dentro_guasto(x, y) and dentro_guasto(x + w, y - d)): continue
        rudere(P, x, x + w, y - d, y, R.uniform(1.4, 3.2))
        ostacoli += [[x - 0.3, x + w + 0.3, y - 0.3, y + 0.3],
                     [x - 0.3, x + w + 0.3, y - d - 0.3, y - d + 0.3], [x - 0.3, x + 0.3, y - d, y], [x + w - 0.3, x + w + 0.3, y - d, y]]
        # dentro: un cumulo e una trave
        macerie(P, x + w / 2, y - d / 2, min(w, d) * 0.3, 22)
        trave(P, (x + 1, y - 1, 0.1), (x + w - 1.5, y - d + 2, 1.1), 0.22, 'legnoScuro')
    for (cx, cy, r) in ((40, -22, 3.0), (70, -22, 2.4), (20, -48, 2.8), (85, -8, 2.0), (45, -52, 2.2)):
        if dentro_guasto(cx, cy):
            macerie(P, cx, cy, r, 38)
            ostacoli.append([cx - r * 0.6, cx + r * 0.6, cy - r * 0.6, cy + r * 0.6])
    # l'erba: chiazze basse, irregolari
    for _ in range(140):
        x, y = R.uniform(5, 100), R.uniform(-60, 0)
        if not dentro_guasto(x, y): continue
        w = R.uniform(0.6, 2.4)
        P.blocco(x, x + w, -0.05, R.uniform(0.04, 0.12), y, y + w * R.uniform(0.4, 0.9), 'verdura', smusso=0, ruota=R.uniform(0, math.pi))
    ob = P.crea()
    GUASTO['ostacoli'] = ostacoli
    return ob


def guasto_posa():
    return dict(W=GUASTO['W'], D=GUASTO['D'], epoca='1300', ostacoli=GUASTO.get('ostacoli', []))


# ======================================= la loggia del grano, Orsanmichele
LOGGIA = dict(W=24.0, D=34.0)

def loggia_grano():
    """La loggia del grano di Orto San Michele, fatta dal Comune verso il 1284
    (Villani VIII, 99: «la loggia sopra la piazza d'Orto Sammichele, ove si
    vende il grano, e lastricossi e amattonossi intorno»), bruciata nel 1304.
    Una loggia aperta su pilastri, coperta da un tetto di legno e coppi. Non
    è il palazzo di oggi (1337). Pianta: il volume di oggi (edificio 4426),
    24 × 34 m. Pilastri, archi e tetto: ipotesi. Sotto, le misure del grano
    e i sacchi; su un pilastro la Madonna dipinta dei miracoli del 1292."""
    W, D = LOGGIA['W'], LOGGIA['D']
    H, imp = 9.0, 5.6
    P = K.Pezzo('loggia_grano')
    P.blocco(-0.4, W + 0.4, -0.3, 0.15, -D - 0.4, 0.4, 'lastre', smusso=0)        # il lastrico
    nx, ny = 3, 4
    xs = [i * W / nx for i in range(nx + 1)]; ys = [-j * D / ny for j in range(ny + 1)]
    for x in xs:
        for y in ys:
            P.blocco(x - 0.6, x + 0.6, 0.15, imp, y - 0.6, y + 0.6, 'conci', smusso=0.02)
            P.blocco(x - 0.75, x + 0.75, imp, imp + 0.3, y - 0.75, y + 0.75, 'conci', smusso=0.02)     # il capitello
    # i quattro prospetti: archi a tutto sesto fra i pilastri, e sopra il muro fino alla gronda
    def prospetto(L, campate, trasf):
        fori = [M.arco_punti(L * (k + 0.5) / campate, imp, L / campate - 1.2, 'tondo', n=14) for k in range(campate)]
        P2 = K.Pezzo('_')
        M.lastra(P2, [(-0.6, 0.15), (L + 0.6, 0.15), (L + 0.6, H), (-0.6, H)], fori, -0.5, 0.5)
        for f in fori: M.conci_arco(P2, f[2:], 0.45, -0.55, 0.55)
        for m, bb in P2.bm.items():
            me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free(); me.transform(trasf)
            P._bm(m).from_mesh(me); bpy.data.meshes.remove(me)
    prospetto(W, nx, Matrix.Identity(4))
    prospetto(W, nx, Matrix.Translation((0, -D, 0)))
    prospetto(D, ny, Matrix.Translation((0, 0, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))
    prospetto(D, ny, Matrix.Translation((W, 0, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))
    # il tetto a padiglione, di legno e coppi, e le travi viste da sotto
    P.blocco(-0.6, W + 0.6, H, H + 0.4, -D - 0.6, 0.6, 'legnoScuro', smusso=0)
    M.tetto_padiglione(P, -0.6, W + 0.6, -D - 0.6, 0.6, H + 0.4, 4.0, gronda=1.0)
    for y in [-(k + 0.5) * D / 8 for k in range(8)]:
        P.blocco(0, W, H - 0.5, H, y - 0.15, y + 0.15, 'legnoScuro', smusso=0)
    # le misure del grano (staia) e i sacchi
    for k in range(6):
        x, y = W * (0.2 + 0.12 * k), -D * 0.5 + (k % 2) * 3
        K.cil(P, x, y, 0.42, 0.15, 0.75, 'legno', n=10)
        for s in range(3):
            K.palla(P, x + 1.0 + s * 0.55, y + 0.8, 0.45, 0.28, 0.22, 0.32, 'tela')
    # la Madonna dipinta sul pilastro di mezzo, con le candele e gli ex voto (ipotesi)
    xm, ym = xs[1], ys[2]
    P.blocco(xm - 0.5, xm + 0.5, 2.4, 3.8, ym + 0.6, ym + 0.66, 'intonaco', smusso=0)
    P.blocco(xm - 0.55, xm + 0.55, 2.3, 2.4, ym + 0.6, ym + 0.9, 'legnoScuro', smusso=0)
    ob = P.crea()
    M.scala_uv(ob, 1.2)
    return ob


def loggia_posa():
    W, D = LOGGIA['W'], LOGGIA['D']
    pil = [[i * W / 3 - 0.7, i * W / 3 + 0.7, -j * D / 4 - 0.7, -j * D / 4 + 0.7] for i in range(4) for j in range(5)]
    return dict(W=W, D=D, epoca='1300', ostacoli=pil)


# =========================================== il palazzo del Popolo (1255)
POPOLO = dict(W=40.0, D=14.0, torre=54.0)

def palazzo_popolo():
    """Il palazzo del Popolo, poi del Podestà (il Bargello): Villani VII, 39,
    con il Primo Popolo del 1250, «il palagio il quale è di dietro a la
    Badia... quello ch'è di pietre conce colla torre». Qui il corpo sulla via
    del Proconsolo, 40 × 14 m, tre piani in pietraforte, il coronamento di
    merli su beccatelli, le finestre in alto bifore; la torre, che nel 1300
    c'era già (la Volognana), alta come oggi (54 m, dati/oggi.js): se fosse
    stata mozzata come le torri private non lo sappiamo (lacuna 79). Le
    aggiunte del Trecento (il cortile con la scala, l'ala su via Ghibellina)
    non ci sono. Forma e misure: ipotesi."""
    W, D, Ht = POPOLO['W'], POPOLO['D'], POPOLO['torre']
    H = 21.0
    P = K.Pezzo('palazzo_popolo')
    portale = M.arco_punti(W * 0.5, 3.4, 3.0, 'tondo', n=16)
    fori = [portale]
    for x in [W * (0.12 + 0.19 * k) for k in range(5)]:
        if abs(x - W * 0.5) > 3:
            fori.append([(x - 0.3, 3.0), (x + 0.3, 3.0), (x + 0.3, 4.2), (x - 0.3, 4.2)])        # finestrelle del terreno
        fori.append([(px, pz + 8.0) for px, pz in M.arco_punti(x, 1.6, 1.4, 'tondo', n=10)])         # le finestre del primo piano
        fori.append([(px, pz + 14.2) for px, pz in M.arco_punti(x, 1.9, 2.0, 'tondo', n=12)])      # le bifore del piano alto
    M.lastra(P, [(0, -1.2), (W, -1.2), (W, H), (0, H)], fori, -1.6, 0)
    M.conci_arco(P, portale[2:], 0.7, -0.3, 0.05)
    for x in [W * (0.12 + 0.19 * k) for k in range(5)]:
        P.blocco(x - 0.08, x + 0.08, 14.2, 16.1, -0.9, -0.7, 'conci', smusso=0)             # la colonnina della bifora
        P.blocco(x - 1.1, x + 1.1, 14.05, 14.2, -0.3, 0.12, 'conci', smusso=0)              # il davanzale
    P.blocco(0, 1.6, -1.2, H, -D, -1.6, 'conci', smusso=0.01)
    P.blocco(W - 1.6, W, -1.2, H, -D, -1.6, 'conci', smusso=0.01)
    P.blocco(0, W, -1.2, H, -D, -D + 1.6, 'conci', smusso=0.01)
    P.blocco(1.6, W - 1.6, H - 0.6, H - 0.2, -D + 1.6, -1.6, 'lastre', smusso=0)
    # i beccatelli e i merli guelfi, sul davanti e sui fianchi
    for k in range(int(W / 1.3)):
        x = 0.4 + k * 1.3
        P.blocco(x, x + 0.45, H - 1.2, H, 0, 0.6, 'conci', smusso=0.01)
    P.blocco(-0.1, W + 0.1, H, H + 0.5, -D, 0.7, 'conci', smusso=0.01)
    for k in range(int(W / 1.5)):
        x = 0.2 + k * 1.5
        P.blocco(x, x + 0.9, H + 0.5, H + 1.6, 0.1, 0.7, 'conci', smusso=0.01)
    for y in [-1.0 - k * 1.5 for k in range(int((D - 1) / 1.5))]:
        for x in (-0.1, W - 0.5):
            P.blocco(x, x + 0.6, H + 0.5, H + 1.6, y - 0.9, y, 'conci', smusso=0.01)
    # la torre all'angolo sud, sul davanti
    tx0, tx1, ty0, ty1 = W - 7.0, W, -7.0, 0.0
    P.blocco(tx0, tx1, H, Ht, ty0, ty1, 'conci', smusso=0.01)
    for z in range(int(H) + 5, int(Ht) - 4, 6):
        P.blocco(tx0 + 3.1, tx0 + 3.9, z, z + 1.4, ty1 - 0.02, ty1 + 0.004, 'scuro', smusso=0)
    P.blocco(tx0 - 0.4, tx1 + 0.4, Ht - 2.0, Ht, ty0 - 0.4, ty1 + 0.4, 'conci', smusso=0.01)
    for k in range(5):
        for (x0, x1, y0, y1) in ((tx0 - 0.4 + k * 1.6, tx0 + 0.5 + k * 1.6, ty1, ty1 + 0.4), (tx0 - 0.4 + k * 1.6, tx0 + 0.5 + k * 1.6, ty0 - 0.4, ty0)):
            P.blocco(x0, x1, Ht, Ht + 1.4, y0, y1, 'conci', smusso=0.01)
    P.blocco(tx0, tx1, Ht - 0.2, Ht + 0.05, ty0, ty1, 'lastre', smusso=0)
    ob = P.crea()
    M.scala_uv(ob, 1.4)
    return ob


def popolo_posa():
    return dict(W=POPOLO['W'], D=POPOLO['D'], epoca='1300')


# ============================================ i cantieri delle chiese nuove
def cantiere_chiesa(nome, W, D, nave, fatta, alto, vecchia=None, nota=''):
    """Una chiesa nuova in cantiere, cominciata dall'abside come d'uso: la
    parte in fondo (da y = -D a y = -fatta) è già in piedi, alta «alto», con
    il tetto; la navata ha i muri a metà e i ponteggi; verso la facciata ci
    sono solo le fondazioni. W è la larghezza col transetto, «nave» quella
    della navata. «vecchia»: (x0, x1, y0, y1, h) la chiesa vecchia ancora in
    uso. Tutto ipotesi, salvo il luogo."""
    P = K.Pezzo(nome)
    x0n, x1n = (W - nave) / 2, (W + nave) / 2
    T = 1.6
    ostacoli = []
    def muro(xa, xb, ya, yb, h, m='conci'):
        P.blocco(xa, xb, -1.0, h, ya, yb, m, smusso=0.01)
        ostacoli.append([xa, xb, ya, yb])
    # il fondo costruito: transetto e cappelle, con il tetto
    yt = -fatta
    muro(0, W, -D, -D + T, alto); muro(0, T, -D, yt, alto); muro(W - T, W, -D, yt, alto)
    muro(0, x0n + T, yt - T, yt, alto * 0.9); muro(x1n - T, W, yt - T, yt, alto * 0.9)
    P.blocco(-0.4, W + 0.4, alto, alto + 0.5, -D - 0.4, yt + 0.4, 'legnoScuro', smusso=0)
    M.tetto_padiglione(P, -0.4, W + 0.4, -D - 0.4, yt + 0.4, alto + 0.5, 5.5, gronda=0.8)
    # le finestre alte, strette, ad arco acuto (buio dietro)
    for k in range(1, int(W / 7)):
        x = k * W / int(W / 7)
        P.blocco(x - 0.4, x + 0.4, alto * 0.45, alto * 0.75, -D - 0.01, -D + 0.2, 'scuro', smusso=0)
    # la navata: muri a metà, con la cima a gradoni, e i ponteggi fuori
    ym = yt - (D - fatta) * 0.45
    for xa in (x0n, x1n - T):
        s_ = ym
        while s_ < yt - T - 0.2:
            l = min(yt - T - s_, R.uniform(3, 6))
            h = alto * R.uniform(0.25, 0.55) * (1 - (yt - s_) / (D - fatta))
            muro(xa, xa + T, s_, s_ + l, max(1.2, h))
            s_ += l
        xp = xa - 1.6 if xa == x0n else xa + T + 1.6
        for k in range(int((yt - ym) / 3.2)):
            y = ym + k * 3.2
            K.cil(P, xp, y, 0.09, 0, alto * 0.55, 'legno', n=6)
            for z in (3.4, 6.8):
                if z < alto * 0.55: trave(P, (xp, y, z), (xa + (T / 2), y, z), 0.1, 'legno')
        for z in (3.4, 6.8):
            if z < alto * 0.55: trave(P, (xp, ym, z), (xp, yt - T, z), 0.09, 'legno')
    # verso la facciata: le fondazioni, a filo del terreno, e le cataste
    for xa in (x0n, x1n - T):
        P.blocco(xa, xa + T, -1.0, 0.5, -2.0, ym, 'conci', smusso=0.01)
    P.blocco(x0n, x1n, -1.0, 0.5, -2.0, 0, 'conci', smusso=0.01)
    for k in range(5):
        mucchio_conci(P, x0n + 3 + k * (nave - 6) / 4, -6 - (k % 2) * 4, 9)
    K.cil(P, W * 0.5, -14, 2.0, 0, 1.2, 'ghiaia', n=12, r1=0.2)
    # l'antenna da tiro vicino al fondo
    ax, ay = W * 0.5, yt + 6
    K.cil(P, ax, ay, 0.22, 0, alto + 8, 'legnoScuro', n=8)
    trave(P, (ax, ay, alto + 6), (x1n + 1.0, ym + 4, alto * 0.6), 0.18, 'legnoScuro')
    trave(P, (x1n + 1.0, ym + 4, alto * 0.6), (x1n + 1.0, ym + 4, 1.0), 0.03, 'tela')
    ostacoli.append([ax - 0.4, ax + 0.4, ay - 0.4, ay + 0.4])
    # la chiesa vecchia, ancora in uso, dentro il cantiere
    if vecchia:
        a0, a1, b0, b1, h = vecchia
        P.blocco(a0, a1, -1.0, h, b0, b1, 'intonaco', smusso=0.01)
        cx = (a0 + a1) / 2
        P.solido([(a0 - 0.4, b0 - 0.4, h), (a1 + 0.4, b0 - 0.4, h), (a1 + 0.4, b1 + 0.4, h), (a0 - 0.4, b1 + 0.4, h),
                  (cx - 0.01, b0 - 0.4, h + (a1 - a0) * 0.35), (cx + 0.01, b1 + 0.4, h + (a1 - a0) * 0.35)], 'coppi', 0)
        P.blocco(cx - 1.0, cx + 1.0, 0, 3.4, b1 - 0.02, b1 + 0.02, 'legnoScuro', smusso=0)
        ostacoli.append([a0, a1, b0, b1])
    ob = P.crea()
    M.scala_uv(ob, 1.2)
    CANTIERI[nome] = dict(W=W, D=D, epoca='1300', ostacoli=ostacoli, nota=nota)
    return ob

CANTIERI = {}

def santa_croce():
    """La chiesa nuova dei frati minori, fondata il 3 maggio 1294 (Villani IX,
    7). Pianta: l'impronta di oggi (OpenStreetMap, rettangolo minimo
    121 × 69 m, col transetto); navata 38 m (ipotesi). Nel 1300, dopo sei
    anni, qui il fondo con il transetto in piedi, la navata a metà, e la
    chiesa vecchia, più piccola, ancora in uso (ipotesi: dove stesse, e
    quanto fosse costruito della nuova, non lo sappiamo; lacuna 80)."""
    return cantiere_chiesa('santa_croce', 69.0, 121.4, 38.0, 32.0, 19.0, vecchia=(23, 46, -70, -40, 9.5))

def santa_maria_novella():
    """La chiesa nuova dei domenicani, cominciata nel 1279 [da verificare].
    Pianta: l'impronta di oggi (rettangolo minimo 103 × 61 m); navata 28 m.
    Nel 1300, dopo vent'anni, il fondo con il transetto e le cappelle in
    piedi, la navata a metà; la facciata è del Trecento e del Quattrocento
    (lacuna 80)."""
    return cantiere_chiesa('santa_maria_novella', 61.2, 102.8, 28.0, 40.0, 18.0)

# ================================================ il cantiere della cattedrale
CATTEDRALE = dict(W=43.0, D=62.0, vecchia=27.3, arretra=9.5)

def cattedrale():
    """Il cantiere di Santa Maria del Fiore intorno a Santa Reparata, che resta
    in uso (Villani IX, 9: la chiesa vecchia era «piccola a comparazione di
    sì fatta cittade» e si decise «di crescerla, e di trarla addietro, e di
    farla tutta di marmi»). La facciata nuova sta dov'è quella di oggi, 9,5 m
    dietro quella vecchia (monumenti.js, SANTA_REPARATA): nel 1300 se ne
    vedono i primi corsi di marmo ai due lati della chiesa vecchia, che le
    passa in mezzo; i fianchi della chiesa nuova, più larga (43 m), sono
    fondazioni e muri bassi lungo la chiesa vecchia. Quanto ce ne fosse il
    1° maggio 1300: ipotesi (lacuna 74). L'inizio: 1294 per Villani, 1296
    per la data comune."""
    W, D, V = CATTEDRALE['W'], CATTEDRALE['D'], CATTEDRALE['vecchia']
    lato = (W - V) / 2 - 0.4
    P = K.Pezzo('cattedrale')
    ostacoli = []
    # i due tronconi della facciata nuova, ai lati della chiesa vecchia
    for (x0, x1) in ((0, lato), (W - lato, W)):
        P.blocco(x0, x1, -1.0, 1.4, -2.6, 0, 'marmo', smusso=0.01)
        P.blocco(x0 + 0.05, x1 - 0.05, 1.4, 1.75, -2.55, 0.05, 'marmoVerde', smusso=0.01)
        s_ = x0
        while s_ < x1 - 0.2:
            l = min(x1 - s_, R.uniform(1.2, 2.4))
            P.blocco(s_, s_ + l, 1.75, 1.75 + R.choice([0.6, 1.4, 2.2, 3.4, 4.2]), -2.6, 0, 'marmo', smusso=0.01)
            s_ += l
        ostacoli.append([x0, x1, -2.6, 0])
        # i ponteggi davanti
        for k in range(int((x1 - x0) / 2.4) + 1):
            x = x0 + k * (x1 - x0) / max(1, int((x1 - x0) / 2.4))
            K.cil(P, x, 1.5, 0.08, 0, 7.5, 'legno', n=6)
            for z in (3.2, 6.2): trave(P, (x, -0.3, z), (x, 1.6, z), 0.1, 'legno')
        for z in (3.2, 6.2):
            P.blocco(x0, x1, z + 0.06, z + 0.11, 0.2, 1.5, 'legno', smusso=0)
    # i fianchi: fondazioni e muri bassi lungo la chiesa vecchia
    for (x0, x1) in ((0, 2.4), (W - 2.4, W)):
        y = -2.6
        while y > -D:
            l = min(y + D, R.uniform(4, 8))
            h = R.uniform(0.4, 2.6) * (1 if y > -D * 0.6 else 0.5)
            P.blocco(x0, x1, -1.2, h, y - l, y, 'conci', smusso=0.01)
            ostacoli.append([x0, x1, y - l, y])
            y -= l
    # le cataste di marmo bianco e verde e di pietraforte, davanti ai tronconi (fuori dalla chiesa vecchia)
    for (cx, cy, m) in ((2.5, 5.0, 'marmo'), (5.0, 7.5, 'conci'), (W - 2.5, 5.0, 'marmo'), (W - 5.0, 7.5, 'marmoVerde')):
        mucchio_conci(P, cx, cy, 8, m)
        ostacoli.append([cx - 1.6, cx + 1.6, cy - 0.5, cy + 0.5])
    # un'antenna da tiro al troncone sud
    K.cil(P, lato * 0.5, -6, 0.2, 0, 14, 'legnoScuro', n=8)
    trave(P, (lato * 0.5, -6, 12.5), (lato * 0.6, 1.2, 8.0), 0.16, 'legnoScuro')
    trave(P, (lato * 0.6, 1.2, 8.0), (lato * 0.6, 1.2, 1.0), 0.03, 'tela')
    ostacoli.append([lato * 0.5 - 0.4, lato * 0.5 + 0.4, -6.4, -5.6])
    ob = P.crea()
    M.scala_uv(ob, 1.1)
    CATTEDRALE['ostacoli'] = ostacoli
    return ob

COSTRUTTORI = {'priori': priori, 'guasto': guasto, 'loggia_grano': loggia_grano, 'palazzo_popolo': palazzo_popolo,
               'santa_croce': santa_croce, 'santa_maria_novella': santa_maria_novella, 'cattedrale': cattedrale}
M.POSA.update({'priori': priori_posa, 'guasto': guasto_posa, 'loggia_grano': loggia_posa, 'palazzo_popolo': popolo_posa,
               'santa_croce': lambda: CANTIERI['santa_croce'], 'santa_maria_novella': lambda: CANTIERI['santa_maria_novella'],
               'cattedrale': lambda: dict(W=CATTEDRALE['W'], D=CATTEDRALE['D'], epoca='1300', arretra=CATTEDRALE['arretra'], ostacoli=CATTEDRALE['ostacoli'])})

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    nomi = [a for a in args if a in COSTRUTTORI] or list(COSTRUTTORI)
    for nome in nomi:
        M.prepara()
        # materiali in più: hanno i nomi di quelli della città (mondo/materiali.js)
        for extra, col in {'ghiaia': (0.6, 0.55, 0.45), 'verdura': (0.25, 0.42, 0.18), 'tela': (0.75, 0.68, 0.5), 'marmo': (0.85, 0.83, 0.78), 'marmoVerde': (0.18, 0.28, 0.22)}.items():
            if extra not in K.MATERIALI:
                m = bpy.data.materials.new(extra); m.use_nodes = True
                m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col + (1,)
                K.MATERIALI[extra] = m
        ob = COSTRUTTORI[nome]()
        M.esporta(ob, nome)
        if 'tavola' in args: M.tavola(ob, nome)
    print('FATTO', nomi)
