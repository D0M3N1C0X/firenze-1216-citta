# =====================================================================
# L'ARREDO DEGLI INTERNI, per monumenti.py.
#
# Ogni funzione disegna un oggetto in un Pezzo del kit (strumenti/kit/
# kit.py), nella posizione (x, y) con la rotazione rot attorno alla
# verticale (0 = il lato lungo lungo x; il davanti verso -y) e alla quota
# z del pavimento. Le misure sono in metri.
#
# Le fonti (FONTI.md, § 8): tavole mobili su cavalletti, coperte da una
# tovaglia e tolte dopo il pasto («quando furono levate le tavole», dice
# lo pseudo-Brunetto del convito di Campi); panche e sgabelli; un piatto
# e una coppa ogni due commensali, coltello e cucchiaio, niente forchette;
# cassoni di legno per la biancheria e le cose. Sono quasi tutte notizie
# del Trecento, riportate al 1216: la forma di ogni oggetto è un'ipotesi.
# =====================================================================
import math, random
from mathutils import Matrix, Vector

R = random.Random(1209)


def posa(P, disegna, x, y, rot=0.0, z=0.0, K=None):
    """Disegna un oggetto in coordinate locali e lo innesta in P, spostato
    in (x, y, z) e ruotato di rot attorno a z."""
    P2 = K.Pezzo('_')
    disegna(P2)
    M = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rot, 4, 'Z')
    import bpy
    for m, bb in P2.bm.items():
        me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free()
        me.transform(M)
        P._bm(m).from_mesh(me); bpy.data.meshes.remove(me)
    P2.bm.clear()


def cilindro(P, cx, cy, r0, r1, z0, z1, m, n=12, sx=1.0, sy=1.0):
    P.solido([(cx + r * sx * math.cos(a), cy + r * sy * math.sin(a), z) for a in [2 * math.pi * i / n for i in range(n)] for r, z in ((r0, z0), (r1, z1))], m, 0)


def trave(P, a, b, s, m, sz=None):
    """Una trave a sezione quadrata da a a b (punti 3D), lato s."""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    u = d.orthogonal().normalized() * (s / 2)
    v = d.cross(u).normalized() * ((sz or s) / 2)
    P.solido([p + su * u + sv * v for p in (a, b) for su in (-1, 1) for sv in (-1, 1)], m, 0)


# ------------------------------------------------------------ mobili
def panca(lun=2.4, h=0.45, larg=0.3):
    """Panca di tavola su due fiancate di legno."""
    def d(P):
        P.blocco(-lun / 2, lun / 2, h - 0.05, h, -larg / 2, larg / 2, 'legno', smusso=0.006)
        for sx in (-1, 1):
            x = sx * (lun / 2 - 0.25)
            P.blocco(x - 0.03, x + 0.03, 0, h - 0.05, -larg / 2 + 0.03, larg / 2 - 0.03, 'legno', smusso=0.004)
        P.blocco(-lun / 2 + 0.25, lun / 2 - 0.25, 0.12, 0.17, -0.02, 0.02, 'legno', smusso=0)
    return d


def tavola(lun=3.0, larg=0.8, h=0.76, tovaglia=True):
    """Tavola mobile: assi su due cavalletti, con la tovaglia che ricade
    di un palmo sui lati."""
    def d(P):
        P.blocco(-lun / 2, lun / 2, h - 0.05, h, -larg / 2, larg / 2, 'legno', smusso=0.006)
        for sx in (-1, 1):                                  # i cavalletti: due gambe a V e la traversa
            x = sx * (lun / 2 - 0.35)
            P.blocco(x - 0.05, x + 0.05, h - 0.12, h - 0.05, -larg / 2 + 0.05, larg / 2 - 0.05, 'legnoScuro', smusso=0.004)
            for sy in (-1, 1):
                trave(P, (x, sy * 0.05, h - 0.1), (x, sy * (larg / 2 - 0.08), 0.0), 0.06, 'legnoScuro')
        if tovaglia:
            P.blocco(-lun / 2 - 0.05, lun / 2 + 0.05, h, h + 0.008, -larg / 2 - 0.05, larg / 2 + 0.05, 'tela', smusso=0)
            for sy in (-1, 1):                              # il bordo che ricade
                y = sy * (larg / 2 + 0.05)
                P.blocco(-lun / 2 - 0.05, lun / 2 + 0.05, h - 0.24, h + 0.008, min(y, y + sy * 0.008), max(y, y + sy * 0.008), 'tela', smusso=0)
    return d


def apparecchia(lun, larg, h, posti, R_=None, carne=True):
    """Sulla tavola: un tagliere e una coppa ogni due commensali, pane,
    coltelli, brocche; qua e là un tagliere con la carne. Davanti ai posti,
    che stanno lungo il lato -y."""
    rr = R_ or R
    def d(P):
        z = h + 0.008
        n = max(1, posti // 2)
        for i in range(n):
            x = -lun / 2 + (i + 0.5) * lun / n + rr.uniform(-0.08, 0.08)
            y = -larg / 2 + 0.22
            P.blocco(x - 0.17, x + 0.17, z, z + 0.022, y - 0.12, y + 0.12, 'legno', smusso=0.004)        # il tagliere
            if carne and rr.random() < 0.55:
                P.solido([(x + 0.1 * math.cos(a) * rr.uniform(0.8, 1.2), y + 0.07 * math.sin(a), z + 0.022 + hh)
                          for a in [2 * math.pi * k / 7 for k in range(7)] for hh in (0, 0.05)], 'carne', 0)
            px, py = x + rr.choice((-0.3, 0.3)), y + 0.12                                           # il pane
            P.solido([(px + 0.07 * math.cos(a) * math.cos(b), py + 0.07 * math.sin(a) * math.cos(b), z + 0.045 * math.sin(b))
                      for a in [2 * math.pi * k / 8 for k in range(8)] for b in (0.0, 0.7, 1.5)], 'pane', 0)
            cx, cy = x + rr.uniform(-0.25, 0.25), y + 0.3                                           # la coppa
            cilindro(P, cx, cy, 0.03, 0.045, z, z + 0.09, 'legno', n=10)
            P.blocco(x + 0.06, x + 0.2, z + 0.022, z + 0.028, y - 0.01, y + 0.01, 'ferro', smusso=0)       # il coltello
        for k in range(max(1, n // 3)):                    # le brocche
            bx = -lun / 2 + (k + 0.5) * lun / max(1, n // 3)
            cilindro(P, bx, 0.12, 0.06, 0.09, z, z + 0.14, 'cotto', n=12)
            cilindro(P, bx, 0.12, 0.09, 0.045, z + 0.14, z + 0.27, 'cotto', n=12)
    return d


def cassone(lun=1.5, prof=0.58, h=0.62):
    """Cassone di legno su piedi, con il coperchio e le bandelle di ferro."""
    def d(P):
        P.blocco(-lun / 2, lun / 2, 0.08, h, -prof / 2, prof / 2, 'legnoScuro', smusso=0.01)
        P.blocco(-lun / 2 - 0.02, lun / 2 + 0.02, h, h + 0.05, -prof / 2 - 0.02, prof / 2 + 0.02, 'legnoScuro', smusso=0.01)
        for sx in (-1, 1):                                   # i piedi
            P.blocco(min(sx * lun / 2, sx * (lun / 2 - 0.08)), max(sx * lun / 2, sx * (lun / 2 - 0.08)), 0, 0.08, -prof / 2, prof / 2, 'legnoScuro', smusso=0.005)
        for x in (-lun / 3, 0, lun / 3):
            P.blocco(x - 0.025, x + 0.025, 0.1, h + 0.05, -prof / 2 - 0.012, -prof / 2, 'ferro', smusso=0)
        P.blocco(-0.04, 0.04, h - 0.18, h - 0.05, -prof / 2 - 0.02, -prof / 2, 'ferro', smusso=0)    # la serratura
    return d


def botte(r=0.32, lun=0.85, in_piedi=False):
    def d(P):
        n = 14
        for i in range(n):
            a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
            pts = []
            for t in (-1, -0.5, 0, 0.5, 1):
                rad = r * (0.86 + 0.14 * (1 - t * t))
                for a in (a0, a1):
                    q = (lun / 2 * t, rad * math.cos(a), r + rad * math.sin(a)) if not in_piedi else (rad * math.cos(a), rad * math.sin(a), lun / 2 + lun / 2 * t)
                    pts.append(q)
            P.solido(pts, 'legno', 0)
        for t in (-0.8, -0.3, 0.3, 0.8):
            rad = r * (0.86 + 0.14 * (1 - t * t)) + 0.01
            if in_piedi:
                cilindro(P, 0, 0, rad, rad, lun / 2 + lun / 2 * t - 0.02, lun / 2 + lun / 2 * t + 0.02, 'ferro', n=14)
            else:
                P.solido([(lun / 2 * t + dx, rad * math.cos(a), r + rad * math.sin(a)) for a in [2 * math.pi * k / 14 for k in range(14)] for dx in (-0.02, 0.02)], 'ferro', 0)
        if not in_piedi:                                     # i ceppi che la tengono ferma
            for sx in (-1, 1):
                P.blocco(sx * lun / 3 - 0.05, sx * lun / 3 + 0.05, 0, 0.1, -r, r, 'legnoScuro', smusso=0)
    return d


def lancia(lun=3.4):
    def d(P):
        cilindro(P, 0, 0, 0.017, 0.015, 0, lun, 'legno', n=6)
        P.solido([(0.0, 0.0, lun + 0.28)] + [(0.035 * math.cos(a), 0.012 * math.sin(a), lun) for a in [2 * math.pi * k / 6 for k in range(6)]] +
                 [(0.012 * math.cos(a), 0.012 * math.sin(a), lun - 0.08) for a in [2 * math.pi * k / 6 for k in range(6)]], 'ferro', 0)
    return d


def rastrelliera(n=5, larg=1.6, h=2.0):
    """Rastrelliera a muro con le lance in piedi."""
    def d(P):
        P.blocco(-larg / 2, larg / 2, 0, 0.12, -0.18, 0.05, 'legnoScuro', smusso=0.005)
        P.blocco(-larg / 2, larg / 2, 1.5, 1.6, -0.1, 0.05, 'legnoScuro', smusso=0.005)
        for sx in (-1, 1):
            P.blocco(sx * larg / 2 - 0.04, sx * larg / 2 + 0.04, 0, h, -0.06, 0.04, 'legnoScuro', smusso=0.005)
        for i in range(n):
            x = -larg / 2 + 0.2 + i * (larg - 0.4) / max(1, n - 1)
            posa(P, lancia(R.uniform(3.0, 3.6)), x, -0.06, 0.0, 0.06, K=_K)
    return d


def scudo(colore='drappo', alto=0.95, largo=0.6):
    """Scudo a mandorla, appeso al muro con la faccia verso -y."""
    def d(P):
        prof = []
        for k in range(13):
            t = k / 12
            w = largo / 2 * (1 - t ** 2.2) if t > 0.25 else largo / 2
            z = alto * (1 - t)
            prof.append((w, z))
        for (w0, z0), (w1, z1) in zip(prof, prof[1:]):
            P.solido([(sx * w, y, z) for (w, z) in ((w0, z0), (w1, z1)) for sx in (-1, 1) for y in (-0.03, 0.0)] +
                     [(0, -0.06, (z0 + z1) / 2)], colore, 0)
        P.blocco(-0.04, 0.04, alto * 0.45, alto * 0.55, -0.075, -0.05, 'ferro', smusso=0.01)      # l'umbone
    return d


def mazza():
    """Mazza d'arme: manico di legno e testa di ferro a costole."""
    def d(P):
        cilindro(P, 0, 0, 0.018, 0.016, 0, 0.62, 'legno', n=6)
        for k in range(6):
            a = 2 * math.pi * k / 6
            P.solido([(0.012 * math.cos(a), 0.012 * math.sin(a), z) for z in (0.6, 0.78)] +
                     [(0.06 * math.cos(a), 0.06 * math.sin(a), z) for z in (0.64, 0.74)], 'ferro', 0)
    return d


def scala_pioli(alta=5.0, larg=0.5, incl=0.2):
    """Scala a pioli appoggiata al muro (davanti verso -y)."""
    def d(P):
        for sx in (-1, 1):
            trave(P, (sx * larg / 2, -alta * incl, 0), (sx * larg / 2, 0, alta), 0.06, 'legno')
        for k in range(1, int(alta / 0.32)):
            t = k * 0.32 / alta
            trave(P, (-larg / 2, -alta * incl * (1 - t), alta * t), (larg / 2, -alta * incl * (1 - t), alta * t), 0.035, 'legno')
    return d


def lucerna():
    """Lucerna a olio su una mensola di ferro murata."""
    def d(P):
        P.blocco(-0.02, 0.02, -0.08, 0.08, -0.25, 0.0, 'ferro', smusso=0)
        cilindro(P, 0, -0.22, 0.04, 0.06, 0.0, 0.05, 'cotto', n=10)
        P.solido([(0, -0.29, 0.03), (0, -0.22, 0.12), (0.01, -0.22, 0.05), (-0.01, -0.22, 0.05)], 'fuoco', 0)
    return d


def altare(lun=1.6, prof=0.9, h=1.0):
    def d(P):
        P.blocco(-lun / 2, lun / 2, 0, h - 0.12, -prof / 2, prof / 2, 'conci', smusso=0.01)
        P.blocco(-lun / 2 - 0.08, lun / 2 + 0.08, h - 0.12, h, -prof / 2 - 0.08, prof / 2 + 0.08, 'marmo', smusso=0.01)
        P.blocco(-lun / 2 - 0.06, lun / 2 + 0.06, h, h + 0.006, -prof / 2 - 0.08, prof / 2 + 0.06, 'tela', smusso=0)   # la tovaglia d'altare
        P.blocco(-lun / 2 - 0.06, lun / 2 + 0.06, h - 0.4, h, -prof / 2 - 0.086, -prof / 2 - 0.08, 'tela', smusso=0)
        # la croce e due candelieri
        P.blocco(-0.03, 0.03, h, h + 0.65, 0.2, 0.26, 'ferro', smusso=0)
        P.blocco(-0.18, 0.18, h + 0.4, h + 0.46, 0.2, 0.26, 'ferro', smusso=0)
        cilindro(P, 0, 0.23, 0.1, 0.08, h, h + 0.05, 'ferro', n=8)
        for sx in (-1, 1):
            cx = sx * (lun / 2 - 0.2)
            cilindro(P, cx, 0.15, 0.07, 0.02, h, h + 0.32, 'ferro', n=8)
            cilindro(P, cx, 0.15, 0.022, 0.022, h + 0.32, h + 0.52, 'intonaco', n=8)
            P.solido([(cx, 0.15, h + 0.6), (cx + 0.012, 0.15, h + 0.53), (cx - 0.012, 0.15, h + 0.53), (cx, 0.162, h + 0.53)], 'fuoco', 0)
    return d


def camino(larg=2.4, prof=0.9, h_bocca=1.7, h_cappa=4.2):
    """Camino a muro (davanti verso -y): piano del focolare, due spalle di
    pietra, architrave, cappa che si stringe verso il muro, ceppi accesi."""
    def d(P):
        P.blocco(-larg / 2 - 0.3, larg / 2 + 0.3, 0, 0.12, -prof - 0.3, 0, 'conci', smusso=0.01)
        for sx in (-1, 1):
            x0 = sx * larg / 2
            P.blocco(min(x0, x0 + sx * 0.32), max(x0, x0 + sx * 0.32), 0.12, h_bocca, -prof, 0, 'conci', smusso=0.012)
        P.blocco(-larg / 2 - 0.34, larg / 2 + 0.34, h_bocca, h_bocca + 0.35, -prof - 0.05, 0, 'conci', smusso=0.012)
        P.solido([(x, y, h_bocca + 0.35) for x in (-larg / 2 - 0.34, larg / 2 + 0.34) for y in (-prof - 0.05, 0)] +
                 [(x, y, h_cappa) for x in (-larg / 2 + 0.2, larg / 2 - 0.2) for y in (-0.35, 0)], 'intonaco', 0)
        P.blocco(-larg / 2 + 0.05, larg / 2 - 0.05, 0.12, h_bocca, -0.12, 0, 'scuro', smusso=0)          # il fondo annerito
        for k, (a, b) in enumerate((((-0.5, -0.5), (0.45, -0.35)), ((-0.4, -0.25), (0.5, -0.55)), ((-0.6, -0.4), (0.3, -0.45)))):
            trave(P, (a[0], a[1], 0.2 + 0.06 * k), (b[0], b[1], 0.2 + 0.06 * k), 0.12, 'legnoScuro')
        for k in range(5):                                   # le fiamme
            x = -0.4 + k * 0.2
            P.solido([(x, -0.45, 0.62 + 0.15 * (k % 2)), (x - 0.09, -0.4, 0.3), (x + 0.09, -0.4, 0.3), (x, -0.55, 0.3), (x, -0.3, 0.3)], 'fuoco', 0)
    return d


def drappo(larg=3.0, alto=2.2, colore='drappo'):
    """Panno appeso al muro (davanti verso -y), con le pieghe."""
    def d(P):
        n = int(larg / 0.25)
        for i in range(n):
            x0, x1 = -larg / 2 + i * larg / n, -larg / 2 + (i + 1) * larg / n
            y0, y1 = -0.02 - 0.05 * (i % 2), -0.02 - 0.05 * ((i + 1) % 2)
            P.solido([(x0, y0, 0), (x1, y1, 0), (x0, y0, alto), (x1, y1, alto), (x0, y0 + 0.01, 0), (x1, y1 + 0.01, 0), (x0, y0 + 0.01, alto), (x1, y1 + 0.01, alto)], colore, 0)
        P.blocco(-larg / 2 - 0.1, larg / 2 + 0.1, alto - 0.02, alto + 0.04, -0.06, 0.0, 'legnoScuro', smusso=0)
    return d


def pedana(x0, x1, y0, y1, h=0.3):
    def d(P):
        P.blocco(x0, x1, 0, h, y0, y1, 'legno', smusso=0.008)
    return d


_K = None
def usa_kit(K):
    """Il modulo kit (per posa annidata nelle rastrelliere)."""
    global _K
    _K = K
