# =====================================================================
# L'ARREDO DELLE STRADE, modellato da script, per l'app Unity.
#
#   python arredo.py   (con Blender come modulo; o blender -b --python arredo.py)
#
# Scrive ../../../unity/Firenze1216/Assets/Modelli/Arredo/<nome>.glb e indice.json.
# Decisione del 16 novembre 2026: le strade piene, con insegne e stemmi.
#
#   Oggetti comuni (livello: ipotesi; forme di sempre, non descritte dalle fonti per Firenze):
#   botte, tino, cassa, sacchi, ceste, carro a due ruote, carretto a mano, catasta di legna,
#   mucchio di paglia, banco di bottega con la tettoia, panca, panni stesi, abbeveratoio.
#   Insegne di bottega: una tavola appesa a un braccio di ferro, con una sagoma dipinta
#   (forbici, scarpa, pane, botte, pesce, chiave). INVENZIONE DICHIARATA: di insegne fiorentine
#   del Duecento non abbiamo descrizioni; servono a dire che bottega è.
#   Stemmi: solo le famiglie della storia e solo da una descrizione (STEMMI, in fondo).
#
# Ogni oggetto è una maglia con i colori nei vertici; gli stemmi hanno un'immagine.
# L'origine è a terra al centro (insegne e stemmi: al punto di attacco al muro).
# =====================================================================
import bpy, os, sys, json, math, random
from mathutils import Vector

QUI = os.path.dirname(os.path.abspath(__file__))
for d in ('vegetazione', 'campagna', 'gente'): sys.path.insert(0, os.path.join(QUI, '..', d))
import vegetazione as V
from campagna import cassa
from attrezzi import anello
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', '..', 'unity', 'Firenze1216', 'Assets', 'Modelli', 'Arredo'))

LEGNO, SCURO, FERRO, TELA, PAGLIA, VIMINI, PIETRA = (0.42, 0.33, 0.23), (0.27, 0.2, 0.14), (0.2, 0.2, 0.21), (0.74, 0.69, 0.56), (0.72, 0.62, 0.34), (0.55, 0.43, 0.26), (0.6, 0.58, 0.54)
PANNI = [(0.75, 0.72, 0.66), (0.5, 0.2, 0.18), (0.25, 0.33, 0.5), (0.62, 0.52, 0.3), (0.3, 0.42, 0.28)]


def ruota(P, R, x, y, z, r, n=12):
    """Una ruota di carro nel piano y-z, alla quota x: il cerchione a pezzi e i raggi."""
    for k in range(n):
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        V.tubo(P, [(x, y + math.cos(a0) * r, z + math.sin(a0) * r), (x, y + math.cos(a1) * r, z + math.sin(a1) * r)], [0.035, 0.035], LEGNO, R, n=4, nodoso=0.05)
        if k % 2 == 0: V.tubo(P, [(x, y, z), (x, y + math.cos(a0) * r, z + math.sin(a0) * r)], [0.025, 0.02], LEGNO, R, n=4, nodoso=0.05)
    V.tubo(P, [(x - 0.06, y, z), (x + 0.06, y, z)], [0.06, 0.06], SCURO, R, n=6, nodoso=0.02)


def botte(R, P, r=0.34, h=0.95, z=0.0):
    for j in range(6):
        t = j / 5; rr = r * (0.82 + 0.18 * math.sin(math.pi * t))
        anello(P, R, rr, z + t * h * 0.84, 0.025, LEGNO, n=12, alto=h / 6 + 0.01)
    for t in (0.1, 0.3, 0.7, 0.9): anello(P, R, r * (0.84 + 0.18 * math.sin(math.pi * t)) + 0.02, z + t * h, 0.006, FERRO, n=12, alto=0.03)
    cassa(P, -r * 0.6, r * 0.6, -r * 0.6, r * 0.6, z + h - 0.03, z + h - 0.01, LEGNO, R)


def tino(R, P):
    for j in range(3): anello(P, R, 0.5 + j * 0.03, j * 0.2, 0.03, LEGNO, n=14, alto=0.21)
    for z in (0.08, 0.45): anello(P, R, 0.56, z, 0.006, FERRO, n=14, alto=0.035)
    cassa(P, -0.45, 0.45, -0.45, 0.45, 0.0, 0.03, SCURO, R)


def cassa_merci(R, P):
    cassa(P, -0.45, 0.45, -0.28, 0.28, 0.0, 0.5, LEGNO, R)
    for x in (-0.3, 0.3): cassa(P, x - 0.03, x + 0.03, -0.29, 0.29, 0.0, 0.51, FERRO, R)


def sacchi(R, P):
    for (x, y, z, r) in ((0, 0, 0.2, 0.26), (0.42, 0.05, 0.2, 0.25), (0.2, 0.1, 0.56, 0.24), (-0.36, 0.12, 0.18, 0.22)):
        V.ciuffo(P, (x, y, z), r, TELA, R, schiaccia=0.85, suddivisioni=2)


def ceste(R, P):         # una cesta larga di vimini, piena
    for j in range(4): anello(P, R, 0.26 + j * 0.014, j * 0.07, 0.014, VIMINI, alto=0.075)
    cassa(P, -0.23, 0.23, -0.23, 0.23, 0.0, 0.02, VIMINI, R)
    V.ciuffo(P, (0, 0, 0.3), 0.22, R.choice([(0.5, 0.3, 0.2), (0.45, 0.5, 0.25), (0.7, 0.62, 0.4)]), R, schiaccia=0.45, suddivisioni=1)


def carro(R, P):          # il carro a due ruote con le sponde e la stanga
    cassa(P, -0.6, 0.6, -1.1, 1.1, 0.72, 0.78, LEGNO, R)
    for x in (-0.6, 0.57): cassa(P, x, x + 0.03, -1.1, 1.1, 0.78, 1.15, LEGNO, R)
    cassa(P, -0.6, 0.6, 1.07, 1.1, 0.78, 1.15, LEGNO, R)
    for x in (-0.72, 0.72): ruota(P, R, x, 0.1, 0.6, 0.6)
    V.tubo(P, [(-0.72, 0.1, 0.6), (0.72, 0.1, 0.6)], [0.04, 0.04], SCURO, R, n=5)
    for x in (-0.35, 0.35): V.tubo(P, [(x, -1.1, 0.74), (x * 0.9, -2.6, 0.95)], [0.04, 0.03], LEGNO, R, n=5)


def carretto(R, P):       # a mano, con una ruota
    cassa(P, -0.3, 0.3, -0.5, 0.5, 0.42, 0.46, LEGNO, R)
    for x in (-0.3, 0.27): cassa(P, x, x + 0.03, -0.5, 0.5, 0.46, 0.68, LEGNO, R)
    ruota(P, R, 0.0, 0.62, 0.26, 0.26, n=8)
    for x in (-0.28, 0.28): V.tubo(P, [(x, 0.62, 0.3), (x, -0.5, 0.44), (x * 1.1, -1.25, 0.62)], [0.03, 0.03, 0.025], LEGNO, R, n=5)
    for x in (-0.25, 0.25): V.tubo(P, [(x, -0.4, 0.42), (x, -0.45, 0.0)], [0.025, 0.02], LEGNO, R, n=4)


def catasta(R, P):
    for j in range(4):
        for i in range(7 - j):
            x = -0.75 + (i + j * 0.5) * 0.25; z = 0.1 + j * 0.2; y0, y1 = -0.45 + R.uniform(-0.04, 0.04), 0.45 + R.uniform(-0.04, 0.04)
            col = R.choice([LEGNO, SCURO, (0.5, 0.4, 0.28)])
            V.tubo(P, [(x, y0, z), (x, y1, z)], [0.1, 0.095], col, R, n=6, nodoso=0.2)
            # le due teste del tronco, più chiare: il legno tagliato
            for y, verso in ((y0, 1), (y1, -1)):
                vs = [P.b.verts.new((x + math.cos(a) * 0.1, y, z + math.sin(a) * 0.1)) for a in [2 * math.pi * k / 6 * verso for k in range(6)]]
                P.faccia(vs, [(0.66, 0.55, 0.38, 1)] * 6)


def paglia(R, P):
    for (x, y, z, r, s) in ((0, 0, 0.3, 0.75, 0.6), (0.3, 0.2, 0.62, 0.5, 0.55), (-0.35, -0.2, 0.25, 0.5, 0.5)):
        V.ciuffo(P, (x, y, z), r, PAGLIA, R, schiaccia=s, suddivisioni=2)


def banco(R, P):          # il banco davanti alla bottega: due cavalletti, il tavolato, la tettoia di tela su quattro pali
    cassa(P, -1.0, 1.0, -0.35, 0.35, 0.8, 0.85, LEGNO, R)
    for x in (-0.8, 0.8):
        for y in (-0.28, 0.28): V.tubo(P, [(x, y * 1.4, 0.0), (x, y, 0.8)], [0.03, 0.03], LEGNO, R, n=4)
    for x in (-1.05, 1.05):
        V.tubo(P, [(x, -0.4, 0.0), (x, -0.4, 2.0)], [0.03, 0.025], LEGNO, R, n=4)
        V.tubo(P, [(x, 0.45, 0.0), (x, 0.45, 2.3)], [0.03, 0.025], LEGNO, R, n=4)
    vs = [P.b.verts.new(p) for p in ((-1.15, -0.55, 1.98), (1.15, -0.55, 1.98), (1.15, 0.5, 2.3), (-1.15, 0.5, 2.3))]
    tela = R.choice(PANNI[:2] + [TELA])
    P.faccia(vs, [tela + (1,)] * 4); P.faccia(vs[::-1], [tuple(c * 0.8 for c in tela) + (1,)] * 4)
    for k in range(5):      # la merce: pani, panni piegati, cocci
        x = -0.8 + k * 0.4
        V.ciuffo(P, (x, R.uniform(-0.1, 0.1), 0.92), R.uniform(0.1, 0.15), R.choice([(0.7, 0.55, 0.3), (0.5, 0.2, 0.18), (0.6, 0.36, 0.24), (0.45, 0.5, 0.25)]), R, schiaccia=0.6, suddivisioni=1)


def panca(R, P):
    cassa(P, -0.8, 0.8, -0.16, 0.16, 0.42, 0.47, LEGNO, R)
    for x in (-0.65, 0.65): cassa(P, x - 0.03, x + 0.03, -0.15, 0.15, 0.0, 0.42, LEGNO, R)


def panni_stesi(R, P):    # una corda tesa tra due case (4 m), con i panni: l'origine è a metà, all'altezza della corda
    n = 9
    pts = [(-2.0 + 4.0 * i / (n - 1), 0, -0.25 * math.sin(math.pi * i / (n - 1))) for i in range(n)]
    V.tubo(P, pts, [0.006] * n, TELA, R, n=3, nodoso=0)
    for i in range(1, n - 1):
        if R.random() < 0.25: continue
        x, _, z = pts[i]; w, h, c = R.uniform(0.3, 0.42), R.uniform(0.5, 0.95), R.choice(PANNI)
        vs = [P.b.verts.new(p) for p in ((x - w / 2, 0.0, z), (x + w / 2, 0.0, z), (x + w / 2 + R.uniform(-0.03, 0.03), R.uniform(-0.06, 0.06), z - h), (x - w / 2 + R.uniform(-0.03, 0.03), R.uniform(-0.06, 0.06), z - h))]
        P.faccia(vs, [c + (1,)] * 4); P.faccia(vs[::-1], [tuple(q * 0.85 for q in c) + (1,)] * 4)


def abbeveratoio(R, P):   # una vasca di pietra
    cassa(P, -0.9, 0.9, -0.35, 0.35, 0.0, 0.12, PIETRA, R)
    for (x0, x1, y0, y1) in ((-0.9, 0.9, -0.35, -0.25), (-0.9, 0.9, 0.25, 0.35), (-0.9, -0.8, -0.35, 0.35), (0.8, 0.9, -0.35, 0.35)): cassa(P, x0, x1, y0, y1, 0.12, 0.5, PIETRA, R)
    cassa(P, -0.8, 0.8, -0.25, 0.25, 0.38, 0.4, (0.23, 0.3, 0.28), R)


# le sagome delle insegne, su una griglia 7 × 7 (1 = dipinto): invenzione dichiarata
SAGOME = {
    'forbici': ["1.....1", ".1...1.", "..1.1..", "...1...", "..1.1..", ".11.11.", ".11.11."],
    'scarpa':  [".......", ".11....", ".11....", ".11....", ".111111", ".111111", "......."],
    'pane':    [".......", "..111..", ".11111.", "1111111", "1111111", ".11111.", "......."],
    'botte':   ["..111..", ".11111.", "1111111", "1.1.1.1", "1111111", ".11111.", "..111.."],
    'pesce':   [".......", "1..111.", "11.1111", "1111111", "11.1111", "1..111.", "......."],
    'chiave':  ["..111..", "..1.1..", "..111..", "...1...", "...1...", "...11..", "...11.."],
}


def insegna(R, P, sagoma):   # il braccio di ferro esce dal muro (verso -y), la tavola pende
    V.tubo(P, [(0, 0, 0), (0, -0.75, 0.02)], [0.015, 0.012], FERRO, R, n=4, nodoso=0)
    V.tubo(P, [(0, 0, -0.3), (0, -0.4, 0.0)], [0.01, 0.01], FERRO, R, n=4, nodoso=0)
    for y in (-0.3, -0.62): V.tubo(P, [(0, y, 0.0), (0, y, -0.1)], [0.005, 0.005], FERRO, R, n=3, nodoso=0)
    fondo = R.choice([(0.78, 0.72, 0.58), (0.6, 0.2, 0.16), (0.2, 0.28, 0.42)]); segno = (0.12, 0.1, 0.09) if fondo[0] > 0.7 else (0.85, 0.78, 0.5)
    cassa(P, -0.012, 0.012, -0.72, -0.2, -0.6, -0.1, LEGNO, R)
    g = 0.5 / 7
    for faccia, sx in ((0.014, 1), (-0.014, -1)):
        for r_, riga in enumerate(SAGOME[sagoma]):
            for c_, ch in enumerate(riga):
                y0 = -0.71 + c_ * g if sx == 1 else -0.21 - (c_ + 1) * g; z1 = -0.11 - r_ * g
                vs = [P.b.verts.new(p) for p in ((faccia, y0, z1 - g), (faccia, y0 + g, z1 - g), (faccia, y0 + g, z1), (faccia, y0, z1))]
                P.faccia(vs if sx == 1 else vs[::-1], [(segno if ch == '1' else fondo) + (1,)] * 4)


# ------------------------------------------------------------------ gli stemmi
# Solo le famiglie della storia, e solo con una descrizione. Fonte di tutte: le voci di Wikipedia in italiano
# (lette il 17 novembre 2026); per i Cerchi la voce rimanda alla Raccolta Ceramelli Papiani dell'Archivio di
# Stato di Firenze. Da verificare su quella raccolta. E resta aperta la domanda più grossa: se nel 1216 queste
# famiglie portassero già uno stemma, e questo (lacuna 82). L'aquila degli Uberti è una sagoma semplificata.
STEMMI = {
    'buondelmonti': ("troncato d'azzurro e d'argento", 'lo stemma originario; quello con il monte e la croce è più tardo'),
    'amidei': ("d'oro, a tre fasce di rosso", "la voce dice: «uno scudo d'oro fasciato da tre barre rosse»; la lettura è incerta"),
    'uberti': ("partito: nel 1° d'oro all'aquila di nero uscente dalla partizione; nel 2° scaccato d'oro e d'azzurro", 'ramo di Firenze'),
    'donati': ("troncato di rosso e d'argento", ''),
    'fifanti': ("di rosso, alla ruota d'argento", ''),
    'lamberti': ("d'azzurro, a sei palle d'oro", 'Crollalanza, p. 4; la disposizione qui è 3, 2, 1'),
    'cerchi': ("d'azzurro, a tre anelletti d'oro, legati di rosso, posti 2 e 1", 'Raccolta Ceramelli Papiani, Archivio di Stato di Firenze'),
}
ORO, ROSSO, AZZURRO, ARGENTO, NERO = (214, 170, 50), (170, 32, 36), (36, 70, 150), (232, 232, 226), (25, 24, 26)


def disegna_stemma(nome, percorso):
    from PIL import Image, ImageDraw
    W, H = 256, 320
    im = Image.new('RGB', (W, H), ARGENTO); d = ImageDraw.Draw(im)
    if nome == 'buondelmonti': d.rectangle([0, 0, W, H // 2], fill=AZZURRO)
    elif nome == 'donati': d.rectangle([0, 0, W, H // 2], fill=ROSSO)
    elif nome == 'amidei':
        d.rectangle([0, 0, W, H], fill=ORO)
        for k in (0, 2, 4): d.rectangle([0, k * H // 6, W, (k + 1) * H // 6], fill=ROSSO)
    elif nome == 'fifanti':
        d.rectangle([0, 0, W, H], fill=ROSSO); c = (W // 2, int(H * 0.42)); r = 84
        d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline=ARGENTO, width=14)
        for k in range(8):
            a = math.pi * k / 4; d.line([c[0], c[1], c[0] + math.cos(a) * r, c[1] + math.sin(a) * r], fill=ARGENTO, width=9)
        d.ellipse([c[0] - 16, c[1] - 16, c[0] + 16, c[1] + 16], fill=ARGENTO)
    elif nome == 'lamberti':
        d.rectangle([0, 0, W, H], fill=AZZURRO)
        for (x, y) in ((64, 60), (128, 60), (192, 60), (96, 130), (160, 130), (128, 200)): d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=ORO)
    elif nome == 'cerchi':
        d.rectangle([0, 0, W, H], fill=AZZURRO)
        for (x, y) in ((80, 80), (176, 80), (128, 180)): d.ellipse([x - 36, y - 36, x + 36, y + 36], outline=ORO, width=12)
        d.line([80, 80, 176, 80], fill=ROSSO, width=5); d.line([80, 80, 128, 180], fill=ROSSO, width=5); d.line([176, 80, 128, 180], fill=ROSSO, width=5)
    elif nome == 'uberti':
        d.rectangle([0, 0, W // 2, H], fill=ORO)
        q = 26
        for j in range(H // q + 1):
            for i in range(5): d.rectangle([W // 2 + i * q, j * q, W // 2 + (i + 1) * q, (j + 1) * q], fill=ORO if (i + j) % 2 == 0 else AZZURRO)
        # la mezz'aquila che esce dalla partizione: mezzo corpo, un'ala, mezza coda, la testa
        d.polygon([(128, 70), (128, 230), (104, 210), (96, 130), (108, 80)], fill=NERO)
        d.polygon([(110, 96), (20, 60), (34, 100), (22, 110), (40, 136), (30, 150), (100, 170)], fill=NERO)
        d.polygon([(128, 226), (92, 280), (128, 270)], fill=NERO); d.polygon([(128, 44), (128, 76), (104, 70), (92, 56), (112, 52)], fill=NERO)
    im.save(percorso)


def stemma(nome, cartella):
    """Lo scudo: una tavola a forma di scudo (in alto dritto, in basso a punta) con lo stemma dipinto."""
    png = os.path.join(cartella, f'_stemma-{nome}.png'); disegna_stemma(nome, png)
    w, h = 0.5, 0.62
    contorno = [(-w / 2, 0), (w / 2, 0)] + [(w / 2 * math.cos(t) ** 0.7, -h * 0.45 - h * 0.55 * math.sin(t)) for t in [k * math.pi / 2 / 8 for k in range(1, 9)]]
    contorno += [(-x, z) for (x, z) in reversed(contorno[2:-1])]
    me = bpy.data.meshes.new('stemma-' + nome)
    vs = [(x, -0.03, z) for (x, z) in contorno] + [(x, 0.0, z) for (x, z) in contorno]; n = len(contorno)
    facce = [list(range(n))[::-1], list(range(n, 2 * n))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    me.from_pydata(vs, [], facce); uv = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        for li in poly.loop_indices:
            x, _, z = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = ((x + w / 2) / w, 1 + z / h)
    m = bpy.data.materials.new('stemma-' + nome); m.use_nodes = True
    tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(png)
    b = m.node_tree.nodes['Principled BSDF']; m.node_tree.links.new(tex.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.8
    me.materials.append(m)
    ob = bpy.data.objects.new('stemma-' + nome, me); bpy.context.scene.collection.objects.link(ob)
    return ob, png


OGGETTI = {
    'botte': (botte, 'davanti alle botteghe e ai fondaci'), 'tino': (tino, 'cortili, tintori, vinattieri'),
    'cassa': (cassa_merci, 'botteghe e fondaci'), 'sacchi': (sacchi, 'mercato, mulini, fondaci'), 'ceste': (ceste, 'mercato e botteghe'),
    'carro': (carro, 'strade larghe e piazze; fermo'), 'carretto': (carretto, 'ovunque'), 'catasta': (catasta, 'contro i muri, nei cortili'),
    'paglia': (paglia, 'stalle, cortili, mercato'), 'banco': (banco, 'davanti alle botteghe nei giorni di lavoro, al mercato'),
    'panca': (panca, 'davanti alle case'), 'panni-stesi': (panni_stesi, 'tra due case, in alto, nei vicoli'), 'abbeveratoio': (abbeveratoio, 'piazze e porte'),
}


def esporta(nome, ob, info):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_normals=True, export_vertex_color='ACTIVE', export_animations=False, export_image_format='JPEG', export_jpeg_quality=88)
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print('ARREDO', nome, tri, 'triangoli')
    return dict(info, triangoli=tri)


if __name__ == '__main__':
    indice = {}
    os.makedirs(USCITA, exist_ok=True)
    for k, (nome, (fa, dove)) in enumerate(OGGETTI.items()):
        R = random.Random(900 + k * 13); P = V.Parte(); fa(R, P)
        V.pulisci(); indice[nome] = esporta(nome, P.oggetto(nome, V.materiale('arredo', None)), {'tipo': 'oggetto', 'livello': 'ipotesi', 'dove': dove})
    for k, sagoma in enumerate(SAGOME):
        R = random.Random(1500 + k * 7); P = V.Parte(); insegna(R, P, sagoma)
        V.pulisci(); indice['insegna-' + sagoma] = esporta('insegna-' + sagoma, P.oggetto('insegna-' + sagoma, V.materiale('arredo', None)), {'tipo': 'insegna', 'livello': 'invenzione dichiarata', 'dove': 'sopra la porta di una bottega'})
    for nome, (blasone, nota) in STEMMI.items():
        V.pulisci(); ob, png = stemma(nome, USCITA)
        indice['stemma-' + nome] = esporta('stemma-' + nome, ob, {'tipo': 'stemma', 'famiglia': nome, 'blasone': blasone, 'nota': nota, 'fonte': 'Wikipedia in italiano, voce della famiglia, letta il 17 novembre 2026', 'livello': 'da verificare', 'dove': 'sulle case e sulle torri della famiglia'})
        os.remove(png)
    json.dump(indice, open(os.path.join(USCITA, 'indice.json'), 'w'), indent=1, ensure_ascii=False)
    print('FATTO', len(indice))
    if 'python' in os.path.basename(sys.executable): os._exit(0)
