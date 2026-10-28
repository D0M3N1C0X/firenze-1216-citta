# =====================================================================
# IL KIT EDILIZIO: pezzi modellati una volta in Blender e usati dal
# generatore delle case al posto delle forme semplici.
#
#   blender -b --python kit.py               costruisce ed esporta
#   blender -b --python kit.py -- tavola     anche una tavola di controllo
#
# Scrive ../../public/kit/kit.glb (un oggetto per pezzo) e kit.json
# (misure dell'apertura di ogni pezzo, per scegliere e scalare).
#
# CONVENZIONI. 1 unità = 1 metro. Il muro sta sul piano y = 0: verso +Y
# c'è la strada, verso -Y l'interno. L'apertura è centrata in x = 0 e
# parte da z = 0 (soglia o davanzale). Esportato in glTF (y in alto),
# +Y di Blender diventa -Z: è il verso della facciata nel modello three.js.
#
# I NOMI DEI MATERIALI sono quelli di three.js (conci, legno, legnoScuro,
# ferro, scuro, tela): il browser sostituisce i materiali con i suoi, con
# le texture fotografiche. Le coordinate di texture sono in metri.
#
# FONTI (livello «dedotto per analogia» salvo dove detto): vedi FONTI.md.
# =====================================================================
import bpy, bmesh, os, sys, json, math, random
from mathutils import Vector, Matrix

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'kit'))
R = random.Random(1216)
# le pietre del telaio entrano di 1,5 cm nel foro del muro e la soglia ne
# sporge di 1,5 cm: così le facce del foro restano nascoste e non sfarfallano
COPRI = 0.015
# LOD = 1 costruisce la versione semplificata dei pezzi, per la distanza:
# niente smussi, stipiti in un blocco, pochi conci, ante senza tavole
LOD = 0


def pulisci():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in (bpy.data.meshes, bpy.data.materials):
        for x in list(c):
            c.remove(x)


MATERIALI = {}
def mat(nome):
    if nome not in MATERIALI:
        m = bpy.data.materials.new(nome)
        m.use_nodes = True
        col = {'conci': (0.55, 0.5, 0.42), 'legno': (0.42, 0.34, 0.26), 'legnoScuro': (0.2, 0.14, 0.1),
               'ferro': (0.05, 0.05, 0.05), 'scuro': (0.01, 0.01, 0.01), 'tela': (0.75, 0.68, 0.5),
               'pietrame': (0.5, 0.45, 0.38), 'intonaco': (0.8, 0.75, 0.66), 'lastre': (0.5, 0.48, 0.44),
               'pannoVerde': (0.12, 0.3, 0.16), 'pergamena': (0.85, 0.78, 0.6), 'rame': (0.55, 0.3, 0.15), 'verdura': (0.25, 0.42, 0.18),
               'pesce': (0.6, 0.62, 0.62), 'cesta': (0.55, 0.42, 0.24), 'carne': (0.45, 0.15, 0.1), 'pane': (0.65, 0.45, 0.25),
               'fuoco': (1.0, 0.45, 0.1), 'fosso': (0.15, 0.2, 0.18)}[nome]
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col + (1,)
        MATERIALI[nome] = m
    return MATERIALI[nome]


class Pezzo:
    """Raccoglie le parti di un pezzo (una bmesh per materiale) e lo crea."""
    def __init__(self, nome):
        self.nome = nome + ('_lod1' if LOD else '')
        self.bm = {}

    def _bm(self, m):
        if m not in self.bm: self.bm[m] = bmesh.new()
        return self.bm[m]

    def solido(self, punti, m, smusso=0.0):
        """Involucro convesso di una lista di punti, con gli spigoli smussati."""
        b = bmesh.new()
        vs = [b.verts.new(p) for p in punti]
        bmesh.ops.convex_hull(b, input=vs)
        # si smussano solo le pietre: gli smussi di pochi millimetri del legno
        # e del ferro non si vedono e costano triangoli
        if smusso >= 0.006 and not LOD:
            bmesh.ops.bevel(b, geom=list(b.edges), offset=smusso, segments=1, affect='EDGES', clamp_overlap=True)
        self._unisci(b, m)

    def blocco(self, x0, x1, z0, z1, y0, y1, m, smusso=0.008, ruota=0.0):
        cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        pts = []
        for x in (x0, x1):
            for z in (z0, z1):
                for y in (y0, y1):
                    # una minima rotazione nel piano del muro: pietre posate a mano
                    dx, dz = x - cx, z - cz
                    c, s = math.cos(ruota), math.sin(ruota)
                    pts.append((cx + dx * c - dz * s, y, cz + dx * s + dz * c))
        self.solido(pts, m, smusso)

    def concio(self, xc, zc, r_in, r_out, a0, a1, y0, y1, m, smusso=0.008):
        """Un concio d'arco tra gli angoli a0 e a1 (radianti, 0 = destra)."""
        pts = []
        for a in (a0, a1):
            for r in (r_in, r_out):
                for y in (y0, y1):
                    pts.append((xc + math.cos(a) * r, y, zc + math.sin(a) * r))
        self.solido(pts, m, smusso)

    def _unisci(self, b, m):
        dest = self._bm(m)
        me = bpy.data.meshes.new('tmp')
        b.to_mesh(me); b.free()
        dest.from_mesh(me)
        bpy.data.meshes.remove(me)

    def crea(self):
        me = bpy.data.meshes.new(self.nome)
        ob = bpy.data.objects.new(self.nome, me)
        bpy.context.scene.collection.objects.link(ob)
        parti = []
        for m, b in self.bm.items():
            pm = bpy.data.meshes.new(self.nome + '-' + m)
            b.normal_update()
            b.to_mesh(pm); b.free()
            po = bpy.data.objects.new(self.nome + '-' + m, pm)
            bpy.context.scene.collection.objects.link(po)
            pm.materials.append(mat(m))
            uv_metri(pm)
            parti.append(po)
        bpy.data.objects.remove(ob, do_unlink=True)
        bpy.ops.object.select_all(action='DESELECT')
        for p in parti: p.select_set(True)
        bpy.context.view_layer.objects.active = parti[0]
        if len(parti) > 1:
            bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active
        ob.name = self.nome; ob.data.name = self.nome
        for p in ob.data.polygons: p.use_smooth = False
        return ob


def uv_metri(me):
    """Coordinate di texture in metri, per proiezione sulla faccia dominante,
    con la stessa convenzione del cantiere three.js (u lungo il muro, v in alto)."""
    uv = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        n = poly.normal
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            if abs(n.z) >= abs(n.x) and abs(n.z) >= abs(n.y): u, v = co.x, co.y
            elif abs(n.x) >= abs(n.y): u, v = co.y, co.z
            else: u, v = co.x, co.z
            uv.data[li].uv = (u, v)


# ============================================================ aperture
def ghiera(P, w, z_imposta, spessore, profondita, n_conci, m='conci', sporge=0.03):
    """Arco a tutto sesto di conci radiali sopra un'apertura larga w."""
    r = w / 2 - COPRI
    if LOD: n_conci = max(3, n_conci // 3)
    for i in range(n_conci):
        a0 = math.pi * i / n_conci + 0.004
        a1 = math.pi * (i + 1) / n_conci - 0.004
        ext = spessore * R.uniform(0.92, 1.12)            # conci di lunghezza diversa
        P.concio(0, z_imposta, r, r + ext, a0, a1, -profondita, sporge, m)


def stipiti(P, w, z0, z1, larg, profondita, m='conci', sporge=0.03):
    """Stipiti a conci sovrapposti, di altezza irregolare."""
    if LOD:
        for lato in (-1, 1):
            x_in = lato * (w / 2 - COPRI)
            x_out = x_in + lato * larg
            P.blocco(min(x_in, x_out), max(x_in, x_out), z0, z1, -profondita, sporge, m)
        return
    for lato in (-1, 1):
        z = z0
        while z < z1 - 0.05:
            hb = min(z1 - z, R.uniform(0.26, 0.42))
            lb = larg * R.uniform(0.8, 1.25)
            x_in = lato * (w / 2 - COPRI)
            x_out = x_in + lato * lb
            P.blocco(min(x_in, x_out), max(x_in, x_out), z, z + hb - 0.006, -profondita, sporge, m, ruota=R.uniform(-0.01, 0.01))
            z += hb


def davanzale(P, w, z, m='conci'):
    z += COPRI
    P.blocco(-w / 2 - 0.12, w / 2 + 0.12, z - 0.1, z, -0.28, 0.07, m, smusso=0.012)
    # gocciolatoio sotto il bordo
    P.blocco(-w / 2 - 0.1, w / 2 + 0.1, z - 0.13, z - 0.1, 0.0, 0.05, m, smusso=0.005)


def anta(P, x0, x1, z0, z1, y0, y1, m='legnoScuro', arco=None):
    """Anta di tavole verticali con due traverse; se arco = (xc, zc, r) la
    parte alta segue l'arco."""
    n = max(2, round((x1 - x0) / 0.13))
    if LOD: n = 3 if arco else 1
    lw = (x1 - x0) / n
    for i in range(n):
        a, b = x0 + i * lw + 0.003, x0 + (i + 1) * lw - 0.003
        top = z1
        if arco:
            xc, zc, r = arco
            xm = (a + b) / 2
            dx = min(abs(xm - xc), r - 0.001)
            top = zc + math.sqrt(r * r - dx * dx) - 0.01
        P.blocco(a, b, z0, top, y0, y1, m, smusso=0.003)
    if LOD: return
    for zt in (z0 + 0.18, min(z1, z0 + (z1 - z0) * 0.7)):
        P.blocco(x0 + 0.03, x1 - 0.03, zt, zt + 0.1, y1, y1 + 0.025, m, smusso=0.004)


def bandelle(P, x0, x1, zs, y, lato):
    """Bandelle di ferro sulle ante, con l'occhio del cardine."""
    if LOD: return
    for z in zs:
        if lato < 0: P.blocco(x0, x0 + (x1 - x0) * 0.62, z, z + 0.035, y, y + 0.008, 'ferro', smusso=0.002)
        else: P.blocco(x1 - (x1 - x0) * 0.62, x1, z, z + 0.035, y, y + 0.008, 'ferro', smusso=0.002)


def scuri_arco(nome, w, h, y=-0.3):
    """Due ante chiuse dentro un'apertura ad arco."""
    P = Pezzo(nome)
    r, zi = w / 2, h - w / 2
    anta(P, -w / 2, 0, 0, h, y - 0.04, y, arco=(0, zi, r))
    anta(P, 0, w / 2, 0, h, y - 0.04, y, arco=(0, zi, r))
    bandelle(P, -w / 2, 0, (0.15, h * 0.55), y + 0.025, -1)
    bandelle(P, 0, w / 2, (0.15, h * 0.55), y + 0.025, 1)
    return P.crea()


def tela_arco(nome, w, h, y=-0.3):
    """Impannata: telaio di legno a riquadri con tela oliata."""
    P = Pezzo(nome)
    r, zi = w / 2, h - w / 2
    P.blocco(-w / 2 + 0.02, w / 2 - 0.02, 0.02, zi + r * 0.6, y - 0.012, y - 0.008, 'tela', smusso=0)
    for x in (-w / 2 + 0.02, -0.02, w / 2 - 0.06):
        P.blocco(x, x + 0.045, 0, zi + (r * 0.95 if abs(x) < 0.05 else r * 0.3), y - 0.03, y, 'legno', smusso=0.003)
    for z in (0, zi * 0.5, zi):
        P.blocco(-w / 2, w / 2, z, z + 0.045, y - 0.03, y, 'legno', smusso=0.003)
    return P.crea()


def finestra_arco(nome, w=0.8, h=1.5):
    P = Pezzo(nome)
    zi = h - w / 2
    stipiti(P, w, 0, zi, 0.17, 0.32)
    ghiera(P, w, zi, 0.2, 0.32, 9)
    davanzale(P, w, 0)
    return P.crea()


def finestra_architrave(nome, w=0.8, h=1.3):
    """Architrave su due mensoline modanate e arco di scarico sopra (Pisa,
    via Cavalca: dedotto per analogia)."""
    P = Pezzo(nome)
    stipiti(P, w, 0, h, 0.17, 0.32)
    for lato in (-1, 1):                                   # mensoline
        x = lato * w / 2
        P.solido([(x, -0.3, h - 0.16), (x, 0.03, h - 0.16), (x - lato * 0.1, -0.3, h), (x - lato * 0.1, 0.03, h),
                  (x + lato * 0.04, -0.3, h - 0.16), (x + lato * 0.04, 0.03, h - 0.16), (x + lato * 0.04, -0.3, h), (x + lato * 0.04, 0.03, h)], 'conci', 0.006)
    P.blocco(-w / 2 - 0.22, w / 2 + 0.22, h - COPRI, h + 0.24, -0.32, 0.035, 'conci', smusso=0.01)       # architrave
    # lunetta di pietrame e arco di scarico
    rs = w / 2 + 0.22
    P.solido([(math.cos(a) * rs * 0.98, y, h + 0.24 + math.sin(a) * rs * 0.55) for a in [i * math.pi / 10 for i in range(11)] for y in (-0.2, COPRI)], 'pietrame', 0)
    for i in range(11):
        a0, a1 = math.pi * i / 11 + 0.004, math.pi * (i + 1) / 11 - 0.004
        pts = []
        for a in (a0, a1):
            for k in (1.0, 1.0 + 0.32):
                for y in (-0.3, 0.035):
                    pts.append((math.cos(a) * rs * k, y, h + 0.24 + math.sin(a) * rs * 0.55 * k))
        P.solido(pts, 'conci', 0.007)
    davanzale(P, w, 0)
    return P.crea()


def scuri_rett(nome, w, h, y=-0.3):
    P = Pezzo(nome)
    anta(P, -w / 2, 0, 0, h, y - 0.04, y)
    anta(P, 0, w / 2, 0, h, y - 0.04, y)
    bandelle(P, -w / 2, 0, (0.15, h * 0.7), y + 0.025, -1)
    bandelle(P, 0, w / 2, (0.15, h * 0.7), y + 0.025, 1)
    return P.crea()


def feritoia(nome, w=0.22, h=1.1):
    """Feritoia delle torri: fessura stretta con stipiti e piccolo arco."""
    P = Pezzo(nome)
    zi = h - w / 2
    stipiti(P, w, 0, zi, 0.2, 0.5)
    ghiera(P, w, zi, 0.18, 0.5, 5)
    P.blocco(-w / 2 - 0.2, w / 2 + 0.2, -0.12, COPRI, -0.5, 0.03, 'conci')
    return P.crea()


def portale_senese(nome, w=1.2, h=2.6):
    """Portale a «doppio arco» (torre della Castagna): architrave in basso,
    arco a tutto sesto sopra, lunetta di pietra in mezzo. Il foro nel muro
    è un arco largo w con l'imposta sopra l'architrave (vedi FORI)."""
    P = Pezzo(nome)
    z_arch = h - 0.55                                       # architrave
    z_imp = z_arch + 0.3
    stipiti(P, w, 0, z_arch, 0.24, 0.45)
    P.blocco(-w / 2 - 0.1, w / 2 + 0.1, z_arch, z_imp, -0.45, 0.035, 'conci', smusso=0.012)
    # lunetta, un poco rientrata: il bordo che va oltre il foro resta nel muro
    r = w / 2 + 0.04
    P.solido([(math.cos(a) * r, y, z_imp + math.sin(a) * r) for a in [i * math.pi / 12 for i in range(13)] for y in (-0.3, -0.05)], 'conci', 0.004)
    ghiera(P, w, z_imp, 0.3, 0.45, 13)
    soglia(P, w + 0.6, 0.45)
    return P.crea()


def soglia(P, larg, prof):
    P.blocco(-larg / 2, larg / 2, -0.15, COPRI, -prof, 0.25, 'conci', smusso=0.015)


def portale_arco(nome, w=1.2, h=2.5):
    """Porta di casa ad arco a tutto sesto, con stipiti e ghiera a conci."""
    P = Pezzo(nome)
    zi = h - w / 2
    stipiti(P, w, 0, zi, 0.24, 0.45)
    ghiera(P, w, zi, 0.28, 0.45, 11)
    soglia(P, w + 0.5, 0.45)
    return P.crea()


def porta_arco(nome, w=1.2, h=2.5, y=-0.32):
    """Battente ad arco: tavole, bandelle, chiodi e anello."""
    P = Pezzo(nome)
    zi = h - w / 2
    anta(P, -w / 2, w / 2, 0, h, y - 0.06, y, arco=(0, zi, w / 2))
    if LOD: return P.crea()
    for z in (0.25, zi * 0.55, zi - 0.05):
        P.blocco(-w / 2 + 0.03, w / 2 - 0.15, z, z + 0.045, y + 0.025, y + 0.035, 'ferro', smusso=0.002)
    for z in (0.23, zi * 0.7):
        for i in range(7):
            x = -w / 2 + 0.1 + i * (w - 0.2) / 6
            P.blocco(x - 0.012, x + 0.012, z + 0.03, z + 0.055, y + 0.025, y + 0.04, 'ferro', smusso=0.003)
    for k in range(10):
        a0, a1 = k * 2 * math.pi / 10, (k + 1) * 2 * math.pi / 10
        P.concio(w * 0.25, zi * 0.62, 0.05, 0.065, a0, a1, y + 0.03, y + 0.05, 'ferro', smusso=0)
    return P.crea()


def porta(nome, w=1.2, h=2.05, y=-0.32):
    """Battente di tavole chiodate, con bandelle e anello."""
    P = Pezzo(nome)
    anta(P, -w / 2, w / 2, 0, h, y - 0.06, y)
    if LOD: return P.crea()
    for z in (0.25, h * 0.5, h - 0.3):
        P.blocco(-w / 2 + 0.03, w / 2 - 0.15, z, z + 0.045, y + 0.025, y + 0.035, 'ferro', smusso=0.002)
    # chiodi a testa larga sulle traverse
    for z in (0.23, (h) * 0.7):
        for i in range(7):
            x = -w / 2 + 0.1 + i * (w - 0.2) / 6
            P.blocco(x - 0.012, x + 0.012, z + 0.03, z + 0.055, y + 0.025, y + 0.04, 'ferro', smusso=0.003)
    # anello battiporta
    for k in range(10):
        a0, a1 = k * 2 * math.pi / 10, (k + 1) * 2 * math.pi / 10
        P.concio(w * 0.25, h * 0.55, 0.05, 0.065, a0, a1, y + 0.03, y + 0.05, 'ferro', smusso=0)
    return P.crea()


def bottega(nome, w=3.0, z_imposta=2.3):
    """Arco largo di bottega a tutto sesto, con stipiti robusti."""
    P = Pezzo(nome)
    stipiti(P, w, 0, z_imposta, 0.3, 0.5)
    ghiera(P, w, z_imposta, 0.42, 0.5, 17)
    P.blocco(-w / 2 - 0.3, w / 2 + 0.3, -0.12, COPRI, -0.5, 0.15, 'conci', smusso=0.015)
    return P.crea()


def bottega_chiusa(nome, w=3.0, z_imposta=2.3, y=-0.3):
    """Sportelli chiusi: il basso fa da banco, l'alto da tettoia (chiusi)."""
    P = Pezzo(nome)
    r = w / 2
    anta(P, -w / 2, w / 2, 0.0, 1.0, y - 0.05, y)
    anta(P, -w / 2, w / 2, 1.02, z_imposta + r, y - 0.05, y, arco=(0, z_imposta, r))
    for x in (-w / 2 + 0.04, w / 2 - 0.14):
        P.blocco(x, x + 0.1, 0.4, 0.44, y + 0.01, y + 0.02, 'ferro', smusso=0.002)
    return P.crea()


def bottega_aperta(nome, w=3.0, z_imposta=2.3, y=-0.3):
    """Sportello basso abbassato a banco sulla strada, sportello alto
    alzato a tettoia su due puntelli; nel vano, il buio della bottega."""
    P = Pezzo(nome)
    r = w / 2
    P.blocco(-w / 2 - 0.05, w / 2 + 0.05, 0.0, z_imposta + r, y - 1.2, y - 1.15, 'scuro', smusso=0)
    # muricciolo del banco e piano di tavole
    P.blocco(-w / 2 + 0.05, w / 2 - 0.05, 0.0, 0.78, -0.1, 0.25, 'pietrame', smusso=0.01)
    n = 1 if LOD else round(w / 0.16)
    for i in range(n):
        x0 = -w / 2 + 0.05 + i * (w - 0.1) / n
        P.blocco(x0 + 0.003, x0 + (w - 0.1) / n - 0.003, 0.78, 0.82, -0.12, 0.55, 'legno', smusso=0.003)
    # sportello alto alzato (ruotato attorno alla cerniera in alto)
    pivot_z, lun = z_imposta + 0.1, 1.15
    ang = math.radians(70)
    pts = []
    for x in (-w / 2 + 0.05, w / 2 - 0.05):
        for d in (0, lun):
            for s in (0, 0.04):
                pts.append((x, 0.02 + math.sin(ang) * d + s * math.cos(ang), pivot_z - math.cos(ang) * d + s * math.sin(ang)))
    P.solido(pts, 'legnoScuro', 0.004)
    tip_y, tip_z = 0.02 + math.sin(ang) * lun, pivot_z - math.cos(ang) * lun
    for x in (-w / 2 + 0.2, w / 2 - 0.2):                  # puntelli
        P.solido([(x - 0.025, 0.5, 0.82), (x + 0.025, 0.5, 0.82), (x - 0.025, 0.55, 0.82), (x + 0.025, 0.55, 0.82),
                  (x - 0.025, tip_y - 0.03, tip_z), (x + 0.025, tip_y - 0.03, tip_z), (x - 0.025, tip_y + 0.02, tip_z), (x + 0.025, tip_y + 0.02, tip_z)], 'legno', 0.004)
    return P.crea()


# ======================================================== arredo di strada
def pozzo(nome):
    """Pozzo con puteale circolare in pietra, due pilastrini, trave e carrucola."""
    P = Pezzo(nome)
    n, r_in, r_out = (8 if LOD else 16), 0.55, 0.75
    for i in range(n):                                     # puteale a conci
        a0, a1 = 2 * math.pi * i / n + 0.006, 2 * math.pi * (i + 1) / n - 0.006
        pts = []
        for a in (a0, a1):
            for rr in (r_in, r_out):
                for z in (0, 0.85 * R.uniform(0.97, 1.03)):
                    pts.append((math.cos(a) * rr, math.sin(a) * rr, z))
        P.solido(pts, 'conci', 0.01)
    P.blocco(-0.56, 0.56, 0.0, 0.02, -0.56, 0.56, 'scuro', smusso=0)        # bocca buia
    for x in (-0.68, 0.68):
        P.blocco(x - 0.1, x + 0.1, 0.8, 2.2, -0.1, 0.1, 'conci', smusso=0.012)
    P.blocco(-0.85, 0.85, 2.2, 2.38, -0.09, 0.09, 'legno', smusso=0.01)       # trave
    if LOD: return P.crea()
    P.solido([(math.cos(a) * 0.16, y, 2.0 + math.sin(a) * 0.16) for a in [k * math.pi / 6 for k in range(12)] for y in (-0.03, 0.03)], 'legno')  # carrucola
    P.blocco(-0.008, 0.008, 1.1, 2.0, -0.008, 0.008, 'legno', smusso=0)       # fune
    secchio = [(math.cos(a) * rr, math.sin(a) * rr, z) for a in [k * math.pi / 6 for k in range(12)] for rr, z in ((0.13, 0.9), (0.16, 1.15))]
    P.solido([(x + 0.0, y, z) for x, y, z in secchio], 'legnoScuro', 0.004)
    return P.crea()


def anello(nome):
    """Anello di ferro murato, per legare cavalli e muli."""
    P = Pezzo(nome)
    P.blocco(-0.04, 0.04, -0.04, 0.04, 0.0, 0.04, 'ferro', smusso=0.006)
    for k in range(14):
        a0, a1 = k * 2 * math.pi / 14, (k + 1) * 2 * math.pi / 14
        P.concio(0, -0.1, 0.075, 0.095, a0, a1, 0.025, 0.045, 'ferro', smusso=0)
    return P.crea()


def portafiaccola(nome):
    """Ferro portafiaccola murato, con la fiaccola spenta (è giorno)."""
    P = Pezzo(nome)
    P.blocco(-0.03, 0.03, -0.12, 0.12, 0.0, 0.03, 'ferro', smusso=0.005)
    P.solido([(-0.012, 0.03, -0.01), (0.012, 0.03, -0.01), (-0.012, 0.03, 0.01), (0.012, 0.03, 0.01),
              (-0.012, 0.28, 0.1), (0.012, 0.28, 0.1), (-0.012, 0.28, 0.12), (0.012, 0.28, 0.12)], 'ferro', 0.003)
    for k in range(8):
        a0, a1 = k * 2 * math.pi / 8, (k + 1) * 2 * math.pi / 8
        pts = [(math.cos(a) * rr, 0.3 + math.sin(a) * rr, z) for a in (a0, a1) for rr in (0.0, 0.05) for z in (0.06, 0.16)]
        P.solido(pts, 'ferro', 0.002)
    P.solido([(math.cos(a) * 0.03, 0.3 + math.sin(a) * 0.03, z) for a in [k * math.pi / 4 for k in range(8)] for z in (-0.25, 0.32)], 'legnoScuro', 0.005)
    return P.crea()


def scala_esterna(nome, salita=3.6, larg=1.0):
    """Scala di pietra addossata al muro, che sale verso destra fino a un
    pianerottolo davanti alla porta del primo piano."""
    P = Pezzo(nome)
    n = round(salita / 0.2)
    alzata, pedata = salita / n, 0.3
    for i in range(n):
        x0 = i * pedata
        P.blocco(x0, x0 + pedata + 0.02, 0.0, (i + 1) * alzata, 0.0, larg, 'conci', smusso=0.012)
    xp = n * pedata
    P.blocco(xp, xp + 1.3, 0.0, salita, 0.0, larg + 0.1, 'conci', smusso=0.012)     # pianerottolo
    for i in range(0, n, 2):                                                         # parapetto basso
        x0 = i * pedata
        P.blocco(x0, x0 + pedata * 2 + 0.02, (i + 1) * alzata, (i + 1) * alzata + 0.75, larg - 0.18, larg, 'conci', smusso=0.012)
    return P.crea()


def panca(nome, lun=2.4):
    """Panca di pietra lungo il muro, su mensole."""
    P = Pezzo(nome)
    P.blocco(0, lun, 0.42, 0.5, 0.0, 0.4, 'conci', smusso=0.015)
    for x in (0.1, lun / 2 - 0.1, lun - 0.3):
        P.blocco(x, x + 0.2, 0.0, 0.42, 0.02, 0.32, 'conci', smusso=0.012)
    return P.crea()


# ============================================================ i mestieri
# Aggiunti il 28 ottobre 2026 (PIANO.md, «Mestieri, mercato e suoni»).
# Pezzi da banco: stanno da soli sulla strada o in piazza, con il davanti
# verso +Y (dove sta chi compra) e chi vende dietro, verso -Y. L'origine è
# a terra, al centro del banco. Forme per analogia con le botteghe e i
# banchi di Due e Trecento dipinti e miniati: tutte «ipotesi» (FONTI.md).

def cil(P, cx, cy, r, z0, z1, m, n=10, r1=None):
    """Cilindro (o tronco di cono) verticale."""
    r1 = r if r1 is None else r1
    n = max(5, n // 2) if LOD else n
    P.solido([(cx + math.cos(2 * math.pi * k / n) * rr, cy + math.sin(2 * math.pi * k / n) * rr, z)
              for k in range(n) for rr, z in ((r, z0), (r1, z1))], m)


def palla(P, cx, cy, cz, rx, ry, rz, m, n=5):
    """Ellissoide: pani, cavoli, pesci, carne, sacchi."""
    n = 3 if LOD else n
    pts = []
    for i in range(n + 1):
        t = math.pi * i / n
        for k in range(2 * n):
            a = math.pi * k / n
            pts.append((cx + rx * math.sin(t) * math.cos(a), cy + ry * math.sin(t) * math.sin(a), cz + rz * math.cos(t)))
    P.solido(pts, m)


def tavola_cavalletti(P, lun, prof, h, m='legno'):
    """Asse su due cavalletti: il banco di chi vende in piazza."""
    P.blocco(-lun / 2, lun / 2, h - 0.05, h, -prof / 2, prof / 2, m, smusso=0.006)
    for x in (-lun / 2 + 0.28, lun / 2 - 0.28):
        P.blocco(x - 0.04, x + 0.04, h - 0.12, h - 0.05, -prof * 0.42, prof * 0.42, 'legnoScuro', smusso=0)
        for sy in (-1, 1):
            P.solido([(x - 0.03, sy * prof * 0.4, 0), (x + 0.03, sy * prof * 0.4, 0), (x - 0.03, sy * prof * 0.4 + 0.05 * sy, 0), (x + 0.03, sy * prof * 0.4 + 0.05 * sy, 0),
                      (x - 0.03, sy * 0.02, h - 0.12), (x + 0.03, sy * 0.02, h - 0.12), (x - 0.03, sy * 0.07, h - 0.12), (x + 0.03, sy * 0.07, h - 0.12)], 'legnoScuro')


def panca_legno(P, x0, x1, y, h=0.45):
    P.blocco(x0, x1, h - 0.05, h, y - 0.15, y + 0.15, 'legno', smusso=0)
    for x in (x0 + 0.12, x1 - 0.12):
        P.blocco(x - 0.04, x + 0.04, 0, h - 0.05, y - 0.12, y + 0.12, 'legnoScuro', smusso=0)


def libro(P, x, y, z, w=0.26, d=0.19, h=0.05):
    P.blocco(x - w / 2, x + w / 2, z, z + h, y - d / 2, y + d / 2, 'legnoScuro', smusso=0)
    P.blocco(x - w / 2 + 0.01, x + w / 2 + 0.004, z + 0.008, z + h - 0.008, y - d / 2 + 0.01, y + d / 2 - 0.01, 'pergamena', smusso=0)


def banco_cambio(nome):
    """La tavola del cambiatore: panno verde, bilancia, pile di monete, il registro, la cassetta."""
    P = Pezzo(nome)
    h = 0.82
    tavola_cavalletti(P, 1.6, 0.8, h)
    P.blocco(-0.82, 0.82, h, h + 0.012, -0.42, 0.42, 'pannoVerde', smusso=0)          # il panno
    P.blocco(-0.82, 0.82, h - 0.36, h + 0.012, 0.42, 0.432, 'pannoVerde', smusso=0)   # ricade sul davanti
    libro(P, -0.45, -0.1, h + 0.012, 0.32, 0.24, 0.06)                                # il registro
    P.blocco(-0.75, -0.48, h + 0.012, h + 0.2, -0.38, -0.2, 'legno', smusso=0.004)    # la cassetta
    P.blocco(-0.76, -0.47, h + 0.08, h + 0.1, -0.385, -0.195, 'ferro', smusso=0)
    # la bilancia: colonnina, giogo, due piatti
    cil(P, 0.5, -0.15, 0.06, h + 0.012, h + 0.03, 'rame', 10)
    P.blocco(0.49, 0.51, h + 0.03, h + 0.42, -0.16, -0.14, 'ferro', smusso=0)
    P.blocco(0.3, 0.7, h + 0.41, h + 0.43, -0.16, -0.14, 'ferro', smusso=0)
    for x in (0.31, 0.69):
        cil(P, x, -0.15, 0.07, h + 0.16, h + 0.18, 'rame', 12, 0.08)
        if not LOD:
            P.blocco(x - 0.003, x + 0.003, h + 0.18, h + 0.41, -0.153, -0.147, 'ferro', smusso=0)
    if not LOD:
        for k, (x, y) in enumerate([(-0.05, 0.12), (0.06, 0.18), (0.14, 0.08), (-0.14, 0.2), (0.25, 0.2)]):
            cil(P, x, y, 0.013, h + 0.012, h + 0.012 + 0.01 * (2 + k % 4), 'rame', 8)   # pile di denari
        palla(P, 0.2, -0.28, h + 0.07, 0.07, 0.06, 0.07, 'tela')                    # un sacchetto
        palla(P, 0.05, -0.3, h + 0.05, 0.05, 0.05, 0.05, 'tela')
    panca_legno(P, -0.6, 0.6, -0.75)
    return P.crea()


def pezze(nome):
    """Una pila di pezze di panno piegate: il colore lo dà la città."""
    P = Pezzo(nome)
    if LOD:
        P.blocco(-0.3, 0.3, 0, 0.36, -0.2, 0.2, 'tela', smusso=0)
        return P.crea()
    for k in range(3):
        dx, dy = R.uniform(-0.03, 0.03), R.uniform(-0.03, 0.03)
        P.blocco(-0.29 + dx, 0.29 + dx, k * 0.12, k * 0.12 + 0.115, -0.19 + dy, 0.19 + dy, 'tela', smusso=0.012)
    return P.crea()


def banco_panni(nome):
    """Il banco del mercante di panni: la canna per misurare (quattro braccia) e le forbici."""
    P = Pezzo(nome)
    h = 0.86
    tavola_cavalletti(P, 2.0, 0.85, h)
    P.blocco(-1.17, 1.17, h, h + 0.025, 0.3, 0.325, 'legnoScuro', smusso=0)        # la canna, 2,33 m
    if not LOD:
        for s in (-1, 1):                                                         # le forbici
            P.solido([(0.55, -0.1, h), (0.57, -0.1, h), (0.55, -0.1, h + 0.01), (0.83, -0.1 + s * 0.03, h), (0.83, -0.1 + s * 0.03, h + 0.01)], 'ferro')
    return P.crea()


def banco_beccaio(nome):
    """Il banco del beccaio: il ceppo, la stanga con i pezzi appesi, la carne sul banco."""
    P = Pezzo(nome)
    h = 0.85
    tavola_cavalletti(P, 1.7, 0.8, h)
    cil(P, 1.2, -0.05, 0.26, 0, 0.82, 'legno', 12)                                # il ceppo
    P.blocco(1.1, 1.36, 0.82, 0.835, -0.07, -0.03, 'ferro', smusso=0)             # la mannaia
    for x in (-0.8, 0.8):                                                          # la stanga
        P.blocco(x - 0.04, x + 0.04, 0, 2.05, -0.42, -0.36, 'legnoScuro', smusso=0)
    P.blocco(-0.84, 0.84, 1.97, 2.03, -0.42, -0.36, 'legnoScuro', smusso=0)
    for x in (-0.5, -0.1, 0.3, 0.62):                                              # pezzi appesi
        if not LOD:
            P.blocco(x - 0.005, x + 0.005, 1.7, 1.97, -0.395, -0.385, 'ferro', smusso=0)
        palla(P, x, -0.39, 1.48, 0.12, 0.08, 0.24, 'carne')
    for x in (-0.55, -0.15, 0.3):                                                  # sul banco
        palla(P, x, 0.05, h + 0.06, 0.16, 0.11, 0.06, 'carne')
    return P.crea()


def banco_pesce(nome):
    """Il banco del pesce: ceste sul banco e la tinozza con l'acqua."""
    P = Pezzo(nome)
    h = 0.8
    tavola_cavalletti(P, 1.6, 0.8, h)
    for x in (-0.48, 0.0, 0.48):
        cil(P, x, 0.0, 0.22, h, h + 0.16, 'cesta', 12, 0.25)
        n = 2 if LOD else 5
        for k in range(n):
            a = k * 2.4
            palla(P, x + math.cos(a) * 0.09, math.sin(a) * 0.09, h + 0.17 + 0.02 * (k % 2), 0.13, 0.035, 0.025, 'pesce')
    cil(P, 1.15, 0.05, 0.3, 0, 0.42, 'legno', 12, 0.33)                           # la tinozza
    cil(P, 1.15, 0.05, 0.28, 0.36, 0.38, 'fosso', 12)
    return P.crea()


def banco_ortolano(nome):
    """Il banco dell'ortolano: ceste di cavoli e di rape, sacchi a terra."""
    P = Pezzo(nome)
    h = 0.8
    tavola_cavalletti(P, 1.7, 0.8, h)
    for x in (-0.5, 0.05):
        cil(P, x, 0.0, 0.24, h, h + 0.14, 'cesta', 12, 0.27)
    for k in range(3 if LOD else 6):                                               # cavoli
        palla(P, -0.5 + (k % 3 - 1) * 0.13, (k // 3 - 0.5) * 0.14, h + 0.2, 0.1, 0.1, 0.09, 'verdura')
    for k in range(3 if LOD else 7):                                               # rape
        palla(P, 0.05 + (k % 4 - 1.5) * 0.09, (k // 4 - 0.5) * 0.12, h + 0.18, 0.05, 0.05, 0.05, 'intonaco')
    palla(P, 0.6, 0.05, h + 0.12, 0.2, 0.15, 0.12, 'verdura')                      # un mazzo di erbe
    for x in (-0.6, 0.55):                                                         # sacchi a terra, legati in cima
        cil(P, x, 0.65, 0.21, 0, 0.42, 'tela', 10, 0.13)
        cil(P, x, 0.65, 0.05, 0.42, 0.5, 'tela', 6, 0.08)
    return P.crea()


def banco_pane(nome):
    """Il banco del fornaio: pani tondi in file, una cesta, la pala."""
    P = Pezzo(nome)
    h = 0.82
    tavola_cavalletti(P, 1.6, 0.8, h)
    for i in range(3 if LOD else 5):
        for j in range(2):
            palla(P, -0.6 + i * 0.26 + (0.13 if j else 0), -0.15 + j * 0.26, h + 0.05, 0.11, 0.11, 0.055, 'pane')
    cil(P, 0.55, 0.0, 0.22, h, h + 0.18, 'cesta', 12, 0.25)
    if not LOD:
        for k in range(4):
            palla(P, 0.5 + (k % 2) * 0.1, -0.05 + (k // 2) * 0.1, h + 0.22, 0.08, 0.08, 0.045, 'pane')
    P.blocco(-0.9, -0.84, 0, 1.6, -0.5, -0.46, 'legno', smusso=0)                 # la pala, appoggiata
    P.blocco(-0.98, -0.76, 1.55, 1.85, -0.51, -0.47, 'legno', smusso=0)
    return P.crea()


def fucina(nome):
    """La fucina del fabbro sotto una tettoia: forgia accesa con la cappa, mantice, incudine, tinozza, ferri."""
    P = Pezzo(nome)
    # la tettoia: quattro pali e un tetto di tavole che scende verso la strada
    for x in (-1.6, 1.6):
        for y, z in ((-1.2, 2.9), (1.2, 2.45)):
            P.blocco(x - 0.07, x + 0.07, 0, z, y - 0.07, y + 0.07, 'legnoScuro', smusso=0)
    P.solido([(-1.75, -1.35, 2.95), (1.75, -1.35, 2.95), (-1.75, 1.35, 2.42), (1.75, 1.35, 2.42),
              (-1.75, -1.35, 3.0), (1.75, -1.35, 3.0), (-1.75, 1.35, 2.47), (1.75, 1.35, 2.47)], 'legno')
    # la forgia: un banco di muratura con il fuoco, e la cappa che sale oltre il tetto
    P.blocco(-1.45, -0.25, 0, 0.82, -1.15, -0.35, 'pietrame', smusso=0.01)
    P.blocco(-1.05, -0.65, 0.82, 0.86, -0.9, -0.6, 'fuoco', smusso=0)
    P.blocco(-1.2, -0.5, 0.82, 0.84, -1.0, -0.5, 'scuro', smusso=0)
    palla(P, -0.85, -0.75, 0.86, 0.24, 0.18, 0.1, 'fuoco')                       # la brace accesa, ben visibile
    P.solido([(-1.4, -1.15, 1.6), (-0.3, -1.15, 1.6), (-1.4, -0.4, 1.6), (-0.3, -0.4, 1.6),
              (-1.0, -1.0, 2.3), (-0.7, -1.0, 2.3), (-1.0, -0.7, 2.3), (-0.7, -0.7, 2.3)], 'pietrame')
    P.blocco(-1.0, -0.7, 2.3, 3.5, -1.0, -0.7, 'pietrame', smusso=0.01)
    # il mantice, di fianco alla forgia
    P.solido([(-0.25, -1.0, 0.95), (-0.25, -0.5, 0.95), (-0.25, -1.0, 1.15), (-0.25, -0.5, 1.15),
              (0.55, -0.85, 1.0), (0.55, -0.65, 1.0), (0.55, -0.85, 1.08), (0.55, -0.65, 1.08)], 'legnoScuro')
    P.blocco(-0.25, -0.18, 0, 0.98, -0.8, -0.7, 'legnoScuro', smusso=0)
    # l'incudine sul ceppo
    cil(P, 0.4, 0.25, 0.24, 0, 0.62, 'legno', 12)
    P.blocco(0.25, 0.55, 0.62, 0.78, 0.17, 0.33, 'ferro', smusso=0.006)
    P.solido([(0.55, 0.19, 0.72), (0.55, 0.31, 0.72), (0.55, 0.19, 0.78), (0.55, 0.31, 0.78), (0.72, 0.25, 0.76)], 'ferro')
    P.blocco(0.22, 0.58, 0.78, 0.84, 0.15, 0.35, 'ferro', smusso=0.004)
    # la tinozza per temprare
    cil(P, 1.15, -0.3, 0.3, 0, 0.5, 'legno', 12, 0.33)
    cil(P, 1.15, -0.3, 0.28, 0.44, 0.46, 'fosso', 12)
    if not LOD:
        P.blocco(0.3, 0.6, 0.84, 0.86, 0.22, 0.25, 'ferro', smusso=0)              # il martello posato
        for k in range(4):                                                       # ferri di cavallo appesi al palo
            a0 = math.radians(-30)
            for i in range(6):
                b0, b1 = a0 + i * math.radians(40), a0 + (i + 1) * math.radians(40)
                P.concio(1.6, 1.0 + 0.1 * (k // 2) + 0.4, 0.05, 0.065, b0, b1, -1.13 - 0.12 * (k % 2), -1.115 - 0.12 * (k % 2), 'ferro', smusso=0)
        for k in range(3):                                                       # tenaglie e martelli sulla rastrelliera
            P.blocco(1.0 + k * 0.15, 1.02 + k * 0.15, 0.9, 1.45, -1.18, -1.16, 'ferro', smusso=0)
        P.blocco(0.9, 1.5, 1.3, 1.36, -1.2, -1.15, 'legnoScuro', smusso=0)
    return P.crea()


def banco_notaio(nome):
    """Lo scrittoio del notaio: il piano inclinato con la pergamena, calamaio e penna, i registri, lo sgabello."""
    P = Pezzo(nome)
    for x in (-0.42, 0.42):
        for y in (-0.25, 0.25):
            P.blocco(x - 0.03, x + 0.03, 0, 0.74 if y < 0 else 0.86, y - 0.03, y + 0.03, 'legnoScuro', smusso=0)
    # il piano, inclinato verso chi scrive (dietro, -Y, dove sta lo sgabello)
    P.solido([(-0.48, -0.3, 0.74), (0.48, -0.3, 0.74), (-0.48, 0.3, 0.86), (0.48, 0.3, 0.86),
              (-0.48, -0.3, 0.77), (0.48, -0.3, 0.77), (-0.48, 0.3, 0.89), (0.48, 0.3, 0.89)], 'legno')
    P.solido([(-0.2, -0.18, 0.775), (0.18, -0.18, 0.775), (-0.2, 0.18, 0.892), (0.18, 0.18, 0.892),
              (-0.2, -0.18, 0.78), (0.18, -0.18, 0.78), (-0.2, 0.18, 0.897), (0.18, 0.18, 0.897)], 'pergamena')
    P.blocco(0.28, 0.4, 0.89, 0.95, 0.22, 0.3, 'legnoScuro', smusso=0)           # la tavoletta del calamaio, in alto
    cil(P, 0.34, 0.26, 0.025, 0.95, 1.01, 'scuro', 8)                              # il calamaio di corno
    if not LOD:
        P.solido([(0.34, 0.26, 0.98), (0.345, 0.26, 0.98), (0.25, 0.32, 1.19), (0.26, 0.32, 1.19)], 'pergamena')   # la penna
    libro(P, -0.75, 0.0, 0.0, 0.3, 0.22, 0.07)                                    # registri a terra, nella cassetta
    P.blocco(-0.95, -0.55, 0, 0.32, -0.2, 0.2, 'legno', smusso=0.004)
    libro(P, -0.75, 0.0, 0.32, 0.3, 0.22, 0.06)
    cil(P, 0.0, -0.75, 0.2, 0, 0.48, 'legno', 10)                                  # lo sgabello
    return P.crea()


def tenda_muro(nome):
    """Una tenda di tela contro la facciata, su due pali: il riparo di un banco davanti a casa."""
    P = Pezzo(nome)
    for x in (-1.15, 1.15):
        P.blocco(x - 0.035, x + 0.035, 0, 2.05, 1.35, 1.42, 'legnoScuro', smusso=0)
    P.solido([(-1.25, 0.0, 2.55), (1.25, 0.0, 2.55), (-1.25, 1.45, 2.08), (1.25, 1.45, 2.08),
              (-1.25, 0.0, 2.57), (1.25, 0.0, 2.57), (-1.25, 1.45, 2.1), (1.25, 1.45, 2.1)], 'tela')
    return P.crea()


# ================================================================ tutto
# Ogni telaio dichiara il FORO da aprire nel muro (largo w, alto h dalla
# soglia, ad arco o no) e le chiusure che ci stanno dentro. Il livello è
# quello della FORMA del pezzo: «dedotto» = per analogia con edifici
# superstiti di Firenze e della Toscana coeva (FONTI.md); «ipotesi» = senza
# un riscontro preciso. Le fasi dicono in quali città il pezzo si usa.
CATALOGO = []

def registra(ob, **info):
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if LOD:
        base = ob.name[:-len('_lod1')]
        next(c for c in CATALOGO if c['nome'] == base)['triangoli_lod1'] = tri
    else:
        CATALOGO.append(dict(nome=ob.name, triangoli=tri, **info))


def costruisci():
    F1216 = ['1216', '1300', '1480']
    for w, h in ((0.8, 1.5), (0.7, 1.25)):
        s = f'{round(w * 100)}x{round(h * 100)}'
        registra(finestra_arco(f'finestra_arco_{s}', w, h), tipo='telaio', foro=dict(w=w, h=h, arco=True),
                 chiusure=[f'scuri_arco_{s}', f'tela_arco_{s}'], livello='dedotto', fasi=F1216)
        registra(scuri_arco(f'scuri_arco_{s}', w, h), tipo='chiusura', livello='ipotesi')
        registra(tela_arco(f'tela_arco_{s}', w, h), tipo='chiusura', livello='ipotesi')
    registra(finestra_architrave('finestra_architrave_80x130', 0.8, 1.3), tipo='telaio', foro=dict(w=0.8, h=1.3, arco=False),
             chiusure=['scuri_rett_80x130'], livello='dedotto', fasi=F1216)
    registra(scuri_rett('scuri_rett_80x130', 0.8, 1.3), tipo='chiusura', livello='ipotesi')
    registra(feritoia('feritoia_22x110'), tipo='telaio', foro=dict(w=0.22, h=1.1, arco=True), chiusure=[], livello='dedotto', fasi=F1216)
    registra(portale_senese('portale_senese_120x260'), tipo='telaio', foro=dict(w=1.2, h=2.95, arco=True),
             chiusure=['porta_120x205'], livello='dedotto', fasi=F1216)
    registra(porta('porta_120x205', 1.2, 2.05), tipo='chiusura', livello='ipotesi')
    registra(portale_arco('portale_arco_120x250'), tipo='telaio', foro=dict(w=1.2, h=2.5, arco=True),
             chiusure=['porta_arco_120x250'], livello='dedotto', fasi=F1216)
    registra(porta_arco('porta_arco_120x250'), tipo='chiusura', livello='ipotesi')
    for w in (2.4, 3.0, 3.4):
        s = f'{round(w * 100)}'
        registra(bottega(f'bottega_{s}', w), tipo='telaio', foro=dict(w=w, h=2.3 + w / 2, arco=True),
                 chiusure=[f'bottega_chiusa_{s}', f'bottega_aperta_{s}'], livello='dedotto', fasi=F1216)
        registra(bottega_chiusa(f'bottega_chiusa_{s}', w), tipo='chiusura', livello='ipotesi')
        registra(bottega_aperta(f'bottega_aperta_{s}', w), tipo='chiusura', livello='ipotesi')
    # arredo di strada: le fasi seguono la verifica degli anacronismi (FONTI.md)
    registra(pozzo('pozzo'), tipo='arredo', livello='ipotesi', fasi=F1216)
    registra(anello('anello'), tipo='arredo', livello='ipotesi', fasi=F1216)
    registra(portafiaccola('portafiaccola'), tipo='arredo', livello='ipotesi', fasi=['1480'])
    registra(scala_esterna('scala_esterna'), tipo='arredo', salita=3.6, livello='ipotesi', fasi=[])
    registra(panca('panca'), tipo='arredo', livello='ipotesi', fasi=['1480'])
    # i mestieri (28 ottobre 2026): banchi e botteghe allestite, solo nel 1216 per ora
    for fn in (banco_cambio, pezze, banco_panni, banco_beccaio, banco_pesce, banco_ortolano, banco_pane, fucina, banco_notaio, tenda_muro):
        registra(fn(fn.__name__), tipo='mestiere', livello='ipotesi', fasi=['1216'])


def esporta():
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, 'kit.glb'), export_format='GLB', use_selection=True,
                              export_yup=True, export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_texcoords=True, export_animations=False)
    with open(os.path.join(USCITA, 'kit.json'), 'w') as f:
        json.dump(CATALOGO, f, indent=1)


def tavola():
    """I pezzi su due file, visti di tre quarti dalla strada: per controllarli."""
    for m in MATERIALI.values():
        m.diffuse_color = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
    file = [[c for c in CATALOGO if c['tipo'] != 'arredo' and 'bottega' not in c['nome']],
            [c for c in CATALOGO if 'bottega' in c['nome'] or c['tipo'] == 'arredo']]
    larg = 0
    for r, fila in enumerate(file):
        x = 0
        for c in fila:
            ob = bpy.data.objects[c['nome']]
            w = max(ob.dimensions.x, 0.6)
            ob.location = (x + w / 2, 0, -r * 5.2)
            x += w + 0.5
        larg = max(larg, x)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'MATERIAL'
    sc.display.shading.show_cavity = True
    sc.display.shading.show_shadows = True
    sc.render.resolution_x, sc.render.resolution_y = 2400, 1100
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = larg + 0.6
    # dalla strada (+Y), un poco da sinistra e dall'alto
    cam.location = (larg / 2 + 6.3, 30, 0.6); cam.rotation_euler = (math.radians(86), 0, math.radians(168))
    sc.render.filepath = os.path.abspath(os.path.join(USCITA, '..', '..', '.catture', 'kit-tavola.png'))
    bpy.ops.render.render(write_still=True)
    for c in CATALOGO:
        bpy.data.objects[c['nome']].location = (0, 0, 0)


if __name__ == '__main__':
    pulisci()
    costruisci()
    LOD = 1
    costruisci()
    for c in CATALOGO: print('PEZZO', c['nome'], c['triangoli'], c['triangoli_lod1'])
    esporta()
    if '--' in sys.argv and 'tavola' in sys.argv[sys.argv.index('--') + 1:]:
        for o in list(bpy.data.objects):
            if o.name.endswith('_lod1'): bpy.data.objects.remove(o, do_unlink=True)
        tavola()
    print('FATTO', len(CATALOGO), 'pezzi')
