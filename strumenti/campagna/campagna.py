# =====================================================================
# LA CAMPAGNA COLTIVATA: viti, siepi, graticci, cavoli e canne da orto,
# modellati da script.
#
#   blender -b --python campagna.py        (o: python campagna.py, con Blender come modulo)
#
# Scrive ../../public/campagna/<nome>.glb e indice.json. Ogni modello è una
# maglia sola con i colori nei vertici (COLOR_0): la città li ripete per
# istanze lungo le strade fuori porta (mondo/campagna.js) e li cambia con
# la stagione della giornata scelta.
#
#   vite-0, vite-1          la vite bassa legata al palo, spoglia (inverno,
#                           inizio primavera)
#   vite-foglie-0, -1       la stessa, con i tralci in foglia (maggio)
#   siepe-0, siepe-1        un tratto di siepe viva, lungo 2 m
#   graticcio               un pannello di graticcio (pali e rami intrecciati),
#                           lungo 2 m: il recinto degli orti
#   cavolo                  un cavolo
#   canne, canne-verdi      tre canne legate in cima, nude e con i legumi
#
# Fatti a mano da codice, senza asset esterni (decisione del 9 novembre
# 2026). Forme: ipotesi. Che nel contado fiorentino del Duecento la vite
# fosse bassa e a palo, e non maritata agli alberi, è una scelta di
# leggibilità (decisione del 10 novembre 2026: orti, campi e vigne
# distinti) [da verificare: studi sul paesaggio agrario toscano].
# =====================================================================
import bpy, os, sys, json, math, random
from mathutils import Vector

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, '..', 'vegetazione'))
import vegetazione as V               # Parte, materiale, tubo, ciuffo, pulisci
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'campagna'))

LEGNO = (0.36, 0.3, 0.23)
CORTECCIA = (0.27, 0.22, 0.18)


def cassa(P, x0, x1, y0, y1, z0, z1, colore, R):
    vs = [P.b.verts.new((x, y, z)) for z in (z0, z1) for (x, y) in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    for idx in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
        sc = 0.85 + 0.3 * R.random()
        P.faccia([vs[i] for i in idx], [tuple(min(1, c * sc) for c in colore) + (1,)] * 4)


def vite(seme, foglie):
    """Una vite bassa: il palo di castagno, il ceppo storto, due o tre tralci
    legati al palo. Con le foglie, i tralci portano ciuffi verdi. Alta 1,5 m."""
    R = random.Random(seme)
    P = V.Parte()
    V.tubo(P, [(0.12, 0, -0.3), (0.12, 0, 1.55)], [0.025, 0.02], LEGNO, R, n=5, nodoso=0.1)
    ceppo = [(0, 0, -0.2), (R.uniform(-0.06, 0.06), R.uniform(-0.05, 0.05), 0.3), (0.06, R.uniform(-0.04, 0.04), 0.62)]
    V.tubo(P, ceppo, [0.04, 0.03, 0.024], CORTECCIA, R, n=5, nodoso=0.4)
    punte = []
    for i in range(R.choice([2, 3])):
        a = R.uniform(0, 2 * math.pi)
        p0 = Vector(ceppo[-1])
        p1 = p0 + Vector((math.cos(a) * 0.22, math.sin(a) * 0.22, 0.3))
        p2 = p1 + Vector((math.cos(a + 0.6) * 0.2, math.sin(a + 0.6) * 0.2, 0.32))
        p3 = Vector((0.12 + R.uniform(-0.12, 0.12), R.uniform(-0.12, 0.12), 1.35 + R.uniform(-0.1, 0.1)))
        V.tubo(P, [tuple(p0), tuple(p1), tuple(p2), tuple(p3)], [0.014, 0.011, 0.009, 0.006], CORTECCIA, R, n=4, nodoso=0.2)
        punte += [p1, p2, p3]
    if foglie:
        verde = (0.38 + R.uniform(-0.03, 0.03), 0.56 + R.uniform(-0.04, 0.04), 0.2)
        for p in punte:
            c = p + Vector((R.uniform(-0.12, 0.12), R.uniform(-0.12, 0.12), R.uniform(-0.08, 0.1)))
            V.ciuffo(P, tuple(c), R.uniform(0.13, 0.19), verde, R, schiaccia=0.8, suddivisioni=1)
    return P


def siepe(seme):
    """Due metri di siepe viva: rami fitti dal piede, una massa irregolare di
    foglie alta poco più di un metro."""
    R = random.Random(seme)
    P = V.Parte()
    verde = (0.2 + R.uniform(-0.02, 0.02), 0.3 + R.uniform(-0.03, 0.03), 0.14)
    for k in range(5):
        x = -0.85 + k * 0.42 + R.uniform(-0.08, 0.08)
        V.tubo(P, [(x, R.uniform(-0.1, 0.1), -0.2), (x + R.uniform(-0.1, 0.1), R.uniform(-0.15, 0.15), 0.55)], [0.035, 0.02], CORTECCIA, R, n=4)
    # una massa irregolare dal piede in su: ciuffi di grandezze diverse, sfalsati, e rami che spuntano
    for k in range(5):
        x = -0.84 + k * 0.42 + R.uniform(-0.08, 0.08)
        V.ciuffo(P, (x, R.uniform(-0.16, 0.16), R.uniform(0.28, 0.5)), R.uniform(0.36, 0.48), verde, R, schiaccia=R.uniform(0.85, 1.2), suddivisioni=2)
    for k in range(4):
        x = -0.7 + k * 0.47 + R.uniform(-0.12, 0.12)
        V.ciuffo(P, (x, R.uniform(-0.12, 0.12), R.uniform(0.7, 0.9)), R.uniform(0.22, 0.32), verde, R, schiaccia=0.9, suddivisioni=1)
    for k in range(6):
        x = R.uniform(-0.9, 0.9); y = R.uniform(-0.15, 0.15)
        V.tubo(P, [(x, y, 0.5), (x + R.uniform(-0.15, 0.15), y + R.uniform(-0.1, 0.1), R.uniform(1.05, 1.35))], [0.014, 0.006], CORTECCIA, R, n=3)
    return P


def graticcio(seme):
    """Un pannello di graticcio lungo 2 m e alto 1,1: quattro pali piantati
    e i rami intrecciati, una fila davanti e una dietro ai pali, a onde."""
    R = random.Random(seme)
    P = V.Parte()
    pali = [-0.95, -0.32, 0.32, 0.95]
    for x in pali:
        V.tubo(P, [(x, 0, -0.3), (x + R.uniform(-0.02, 0.02), 0, 1.2 + R.uniform(-0.06, 0.06))], [0.035, 0.028], LEGNO, R, n=5, nodoso=0.15)
    ramo = (0.42, 0.34, 0.24)
    for j in range(6):
        z = 0.12 + j * 0.18
        pts = []
        for i in range(7):
            x = -1.0 + i * 2.0 / 6
            # davanti a un palo e dietro al successivo, alternando da una fila all'altra
            y = 0.05 * math.cos(math.pi * i + (math.pi if j % 2 else 0))
            pts.append((x, y, z + R.uniform(-0.015, 0.015)))
        V.tubo(P, pts, [0.045] * len(pts), ramo, R, n=3, nodoso=0.25)
    return P


def cavolo(seme):
    R = random.Random(seme)
    P = V.Parte()
    V.ciuffo(P, (0, 0, 0.16), 0.17, (0.36, 0.5, 0.3), R, schiaccia=0.85, suddivisioni=1)
    for k in range(4):                                           # le foglie larghe intorno
        a = 2 * math.pi * k / 4 + R.uniform(-0.2, 0.2)
        c = (math.cos(a) * 0.19, math.sin(a) * 0.19, 0.1)
        V.ciuffo(P, c, 0.15, (0.24, 0.4, 0.24), R, schiaccia=0.45, suddivisioni=1)
    return P


def canne(seme, verdi):
    """Tre canne piantate a triangolo e legate in cima, alte 2 m: il sostegno
    dei legumi dell'orto. «Verdi»: con le piante che ci salgono."""
    R = random.Random(seme)
    P = V.Parte()
    canna = (0.62, 0.55, 0.36)
    cima = Vector((0, 0, 2.0))
    piedi = [Vector((math.cos(a) * 0.38, math.sin(a) * 0.38, -0.2)) for a in (0.3, 2.4, 4.5)]
    for p in piedi:
        V.tubo(P, [tuple(p), tuple(cima + Vector((R.uniform(-0.03, 0.03), R.uniform(-0.03, 0.03), 0.15)))], [0.016, 0.012], canna, R, n=4, nodoso=0.05)
    if verdi:
        verde = (0.3, 0.5, 0.2)
        for p in piedi:
            for t in (0.25, 0.45, 0.65, 0.85):
                c = p.lerp(cima, t) + Vector((R.uniform(-0.05, 0.05), R.uniform(-0.05, 0.05), 0))
                V.ciuffo(P, tuple(c), 0.2 * (1.15 - t * 0.6), verde, R, schiaccia=1.1, suddivisioni=1)
    return P


def esporta(nome, P, info):
    V.pulisci()
    ob = P.oggetto(nome, V.materiale('campagna', None))
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_yup=True, export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_vertex_color='ACTIVE', export_animations=False)
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print('CAMPAGNA', nome, tri, 'triangoli')
    return dict(info, triangoli=tri)


if __name__ == '__main__':
    indice = {}
    for i in range(2):
        indice[f'vite-{i}'] = esporta(f'vite-{i}', vite(410 + i * 13, False), {'tipo': 'vite'})
        indice[f'vite-foglie-{i}'] = esporta(f'vite-foglie-{i}', vite(410 + i * 13, True), {'tipo': 'vite-foglie'})
        indice[f'siepe-{i}'] = esporta(f'siepe-{i}', siepe(520 + i * 7), {'tipo': 'siepe', 'lunga': 2.0})
    indice['graticcio'] = esporta('graticcio', graticcio(77), {'tipo': 'graticcio', 'lungo': 2.0})
    indice['cavolo'] = esporta('cavolo', cavolo(31), {'tipo': 'cavolo'})
    indice['canne'] = esporta('canne', canne(52, False), {'tipo': 'canne'})
    indice['canne-verdi'] = esporta('canne-verdi', canne(52, True), {'tipo': 'canne-verdi'})
    json.dump(indice, open(os.path.join(USCITA, 'indice.json'), 'w'), indent=1, sort_keys=True)
    print('FATTO', list(indice))
    if 'python' in os.path.basename(sys.executable): os._exit(0)
