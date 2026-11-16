# =====================================================================
# GLI ATTREZZI IN MANO ALLA GENTE, modellati da script, per l'app Unity.
#
#   python attrezzi.py   (con Blender come modulo; o blender -b --python attrezzi.py)
#
# Scrive ../../../unity/Firenze1216/Assets/Modelli/Attrezzi/<nome>.glb e
# indice.json. Ogni attrezzo è una maglia sola con i colori nei vertici.
# L'origine è il punto dove lo si impugna (o dove poggia, per ceste e
# secchi); l'asse lungo va verso +Z di Blender (in su). indice.json dice a
# quale movimento serve (movimenti.py) e in quale mano va.
#
# Forme: ipotesi, su attrezzi di sempre (sega a telaio, zappa, scure,
# scopa di saggina). Fatti a mano da codice, senza materiale di altri.
# =====================================================================
import bpy, os, sys, json, math, random
from mathutils import Vector

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, '..', 'vegetazione'))
sys.path.insert(0, os.path.join(QUI, '..', 'campagna'))
import vegetazione as V
from campagna import cassa
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', '..', 'unity', 'Firenze1216', 'Assets', 'Modelli', 'Attrezzi'))

LEGNO, FERRO, VIMINI, TELA, COCCIO = (0.42, 0.33, 0.23), (0.2, 0.2, 0.21), (0.55, 0.43, 0.26), (0.72, 0.66, 0.52), (0.6, 0.36, 0.24)


def manico(P, R, l, r=0.016, z0=-0.1):
    V.tubo(P, [(0, 0, z0), (0, 0, z0 + l)], [r, r * 0.9], LEGNO, R, n=6, nodoso=0.06)


def anello(P, R, raggio, z, spessore, colore, n=12, alto=0.03):
    """Un cerchio di doghe o di vimini: n tavolette attorno all'asse."""
    for k in range(n):
        a = 2 * math.pi * k / n
        c, s = math.cos(a), math.sin(a)
        x, y = c * raggio, s * raggio
        w = raggio * math.pi / n * 1.05
        vs = [P.b.verts.new((x - s * w * sx + c * spessore * sr, y + c * w * sx + s * spessore * sr, z + dz)) for dz in (0, alto) for sx, sr in ((-1, 0), (1, 0), (1, 1), (-1, 1))]
        for idx in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
            sc = 0.85 + 0.3 * R.random()
            P.faccia([vs[i] for i in idx], [tuple(min(1, q * sc) for q in colore) + (1,)] * 4)


def sega(R, P):          # la sega a telaio: due montanti, la traversa, la lama sotto e la corda tesa sopra
    for x in (-0.3, 0.3): cassa(P, x - 0.012, x + 0.012, -0.01, 0.01, -0.18, 0.2, LEGNO, R)
    cassa(P, -0.3, 0.3, -0.01, 0.01, 0.0, 0.025, LEGNO, R)
    cassa(P, -0.3, 0.3, -0.002, 0.002, -0.18, -0.14, FERRO, R)
    cassa(P, -0.3, 0.3, -0.004, 0.004, 0.18, 0.188, TELA, R)


def martello(R, P):
    manico(P, R, 0.36); cassa(P, -0.06, 0.05, -0.018, 0.018, 0.22, 0.26, FERRO, R)


def zappa(R, P):
    manico(P, R, 1.25, r=0.018, z0=-0.45); cassa(P, 0.0, 0.2, -0.07, 0.07, 0.76, 0.775, FERRO, R)


def scure(R, P):
    manico(P, R, 0.8, r=0.018, z0=-0.3); cassa(P, 0.0, 0.14, -0.012, 0.012, 0.4, 0.5, FERRO, R)


def scopa(R, P):         # il manico e un mazzo di saggina legato in fondo
    manico(P, R, 1.3, r=0.014, z0=-0.5)
    for k in range(9):
        a = 2 * math.pi * k / 9
        V.tubo(P, [(0, 0, -0.5), (math.cos(a) * 0.09, math.sin(a) * 0.09, -0.9)], [0.02, 0.012], (0.62, 0.52, 0.3), R, n=4)


def cesta(R, P):         # di vimini, con il manico ad arco: si porta al braccio
    for j in range(5): anello(P, R, 0.17 + j * 0.012, -0.32 + j * 0.045, 0.012, VIMINI, alto=0.04)
    cassa(P, -0.16, 0.16, -0.16, 0.16, -0.325, -0.315, VIMINI, R)
    V.tubo(P, [(-0.2, 0, -0.12), (-0.14, 0, -0.02), (0, 0, 0.0), (0.14, 0, -0.02), (0.2, 0, -0.12)], [0.012] * 5, VIMINI, R, n=5)


def secchio(R, P):       # di doghe, cerchiato, con il manico di corda
    for j in range(4): anello(P, R, 0.13 + j * 0.006, -0.42 + j * 0.065, 0.014, LEGNO, n=10, alto=0.065)
    for z in (-0.4, -0.2): anello(P, R, 0.15, z, 0.004, FERRO, n=10, alto=0.02)
    cassa(P, -0.12, 0.12, -0.12, 0.12, -0.425, -0.415, LEGNO, R)
    V.tubo(P, [(-0.14, 0, -0.17), (-0.08, 0, -0.03), (0, 0, 0.0), (0.08, 0, -0.03), (0.14, 0, -0.17)], [0.008] * 5, TELA, R, n=4)


def sacco(R, P):         # pieno, legato in cima: si porta in spalla
    V.ciuffo(P, (0, 0, -0.2), 0.17, TELA, R, schiaccia=1.5, suddivisioni=3)
    V.tubo(P, [(0, 0, 0.1), (0.02, 0, 0.2)], [0.05, 0.07], TELA, R, n=6)


def brocca(R, P):
    V.ciuffo(P, (0, 0, -0.1), 0.1, COCCIO, R, schiaccia=1.2, suddivisioni=2)
    V.tubo(P, [(0, 0, 0.0), (0, 0, 0.09)], [0.045, 0.055], COCCIO, R, n=8, nodoso=0.02)
    V.tubo(P, [(0.05, 0, 0.07), (0.12, 0, 0.02), (0.1, 0, -0.08)], [0.012] * 3, COCCIO, R, n=5)


def ciotola(R, P):
    for j in range(3): anello(P, R, 0.05 + j * 0.02, j * 0.018, 0.008, LEGNO, n=10, alto=0.02)
    cassa(P, -0.045, 0.045, -0.045, 0.045, -0.004, 0.004, LEGNO, R)


def bastone(R, P):
    V.tubo(P, [(0, 0, -0.95), (0.01, 0, -0.4), (0, 0.01, 0.0), (0, 0, 0.12)], [0.014, 0.016, 0.018, 0.02], LEGNO, R, n=6, nodoso=0.2)


def sgabello(R, P):      # tre gambe e un sedile tondo, alto mezzo metro: l'origine è al centro del sedile, in cima
    for j in range(2): anello(P, R, 0.08 + j * 0.07, -0.04, 0.07, LEGNO, n=10, alto=0.04)
    cassa(P, -0.09, 0.09, -0.09, 0.09, -0.04, 0.0, LEGNO, R)
    for a in (0.5, 2.6, 4.7):
        V.tubo(P, [(math.cos(a) * 0.1, math.sin(a) * 0.1, -0.04), (math.cos(a) * 0.2, math.sin(a) * 0.2, -0.5)], [0.02, 0.016], LEGNO, R, n=5)


# nome: (funzione, mano, a quali movimenti serve, come si porta). La «presa» è la regola con cui l'attrezzo segue la persona
# (la usano gesti.py per le anteprime e, in Unity, lo script della gente):
#   due mani   l'asse dell'attrezzo passa per le due mani, con la testa lontano dal petto; l'origine alla mano destra
#   impugnato  nella mano destra, con l'asse dell'attrezzo lungo l'asse x dell'osso della mano (scelto il 17 novembre
#              guardando il martello nei quattro versi possibili; per la sega e la brocca non è stato guardato)
#   appeso     alla mano, sempre dritto (pende)
#   verticale  la cima nella mano, il resto dritto verso terra
#   palmo      appoggiato sul palmo, sempre dritto
#   sedile     per terra sotto le anche
ATTREZZI = {
    'sega': (sega, 'destra', ['sega'], 'impugnata'),
    'martello': (martello, 'destra', ['martella'], 'impugnato'),
    'zappa': (zappa, 'due mani', ['zappa'], 'impugnata'),
    'scure': (scure, 'due mani', ['spacca_legna'], 'impugnata'),
    'scopa': (scopa, 'due mani', ['spazza'], 'impugnata'),
    'cesta': (cesta, 'sinistra', ['cammina', 'cammina_lento', 'passeggia', 'fermo', 'porta'], 'appesa al braccio o alla mano'),
    'secchio': (secchio, 'destra', ['cammina_lento', 'fermo', 'porta'], 'appeso alla mano'),
    'sacco': (sacco, 'destra', ['porta', 'cammina_lento'], 'in spalla'),
    'brocca': (brocca, 'destra', ['beve', 'fermo'], 'impugnata per il manico'),
    'ciotola': (ciotola, 'sinistra', ['mangia'], 'tenuta nel palmo'),
    'bastone': (bastone, 'destra', ['vecchio', 'zoppica', 'lento'], 'impugnato in cima'),
    'sgabello': (sgabello, '', ['seduto', 'si_alza', 'discute'], 'per terra, sotto chi siede'),
}
PRESA = {'sega': 'impugnato', 'martello': 'impugnato', 'zappa': 'due mani', 'scure': 'due mani', 'scopa': 'due mani', 'cesta': 'appeso', 'secchio': 'appeso',
         'sacco': 'appeso', 'brocca': 'impugnato', 'ciotola': 'palmo', 'bastone': 'verticale', 'sgabello': 'sedile'}
# dove sta la parte che lavora rispetto all'origine: +1 in cima (zappa, scure), -1 in fondo (scopa)
TESTA = {'zappa': 1, 'scure': 1, 'scopa': -1}


def esporta(nome, P, info):
    V.pulisci()
    ob = P.oggetto(nome, V.materiale('attrezzo', None))
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_materials='EXPORT', export_normals=True, export_vertex_color='ACTIVE', export_animations=False)
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print('ATTREZZO', nome, tri, 'triangoli')
    return dict(info, triangoli=tri)


if __name__ == '__main__':
    indice = {}
    for k, (nome, (fa, mano, movimenti, come)) in enumerate(ATTREZZI.items()):
        R = random.Random(300 + k * 11); P = V.Parte(); fa(R, P)
        indice[nome] = esporta(nome, P, {'mano': mano, 'movimenti': movimenti, 'come': come, 'presa': PRESA[nome], 'testa': TESTA.get(nome, 0), 'asse': 'x' if PRESA[nome] == 'impugnato' else ''})
    json.dump(indice, open(os.path.join(USCITA, 'indice.json'), 'w'), indent=1, ensure_ascii=False)
    print('FATTO', list(indice))
    if 'python' in os.path.basename(sys.executable): os._exit(0)
