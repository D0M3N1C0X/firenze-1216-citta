# =====================================================================
# CANI, GALLINE E PICCIONI per l'app (25 novembre 2026, «animali vivi»).
#
#   python piccoli.py   (con Blender come modulo; o blender -b --python piccoli.py)
#
# Fatti da codice, senza materiale di altri: ogni animale è una gerarchia di
# pezzi semplici (ellissoidi, coni, cilindri) — corpo, testa, zampe, coda,
# ali — e le animazioni muovono i pezzi, non uno scheletro: in Unity sono
# clip «legacy» come quelle dei cavalli. Scrive public/animali/<nome>.glb e
# aggiunge a animali.json le andature con la loro velocità.
#   cane      passo (zampe a coppie diagonali, coda che scodinzola), fermo
#             (si guarda intorno), annusa (muso a terra)
#   gallina   passo (la testa che va avanti e indietro), becca, fermo
#   piccione  passo, becca, vola (ali che battono)
# Forme e colori sono un'ipotesi: un cane da pagliaio, galline rosse e
# bianche, piccioni grigi come quelli di oggi.
# =====================================================================
import bpy, os, sys, json, math
from mathutils import Vector

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'animali'))
FPS = 30


def pulisci():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for a in list(bpy.data.actions): bpy.data.actions.remove(a)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)


def materiale(nome, colore, ruv=0.85):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*colore, 1); b.inputs['Roughness'].default_value = ruv
    return m


def pezzo(nome, forma, dim, pos, padre=None, mat=None, rot=(0, 0, 0)):
    """Un pezzo: forma 'sfera' | 'cono' | 'cilindro', dimensioni (x, y, z) in metri; pos rispetto al padre.
    Assi di Blender: x a destra, y avanti, z in su."""
    if forma == 'sfera': bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.5)
    elif forma == 'cono': bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.5, radius2=0.0, depth=1.0)
    else: bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.5, depth=1.0)
    o = bpy.context.object; o.name = nome
    o.scale = dim; bpy.ops.object.transform_apply(scale=True)
    o.rotation_mode = 'XYZ'; o.rotation_euler = rot
    if padre: o.parent = padre
    o.location = pos
    if mat: o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = True
    return o


def perno(nome, pos, padre=None):
    """Un punto di rotazione vuoto (spalla, anca, collo), a cui si attaccano i pezzi."""
    o = bpy.data.objects.new(nome, None); bpy.context.scene.collection.objects.link(o)
    o.rotation_mode = 'XYZ'
    if padre: o.parent = padre
    o.location = pos
    return o


def chiavi(o, attr, valori, n):
    """valori(t) per t in 0..1, n fotogrammi; il ciclo si chiude (l'ultimo = il primo)."""
    for k in range(n + 1):
        t = (k % n) / n
        v = valori(t)
        setattr(o, attr, v); o.keyframe_insert(attr, frame=k)


def azione(nome, oggetti, fn, durata):
    """Un'azione per gruppo di oggetti: fn(oggetto, t) → dizionario di attributi. Esportata come clip glTF."""
    n = max(2, int(durata * FPS))
    for o in oggetti:
        o.animation_data_create()
        a = bpy.data.actions.new(f'{nome}|{o.name}'); a.use_fake_user = True
        o.animation_data.action = a
        base = {'location': o.location.copy(), 'rotation_euler': o.rotation_euler.copy()}
        for k in range(n + 1):
            t = (k % n) / n
            d = fn(o.name, t)
            o.location = base['location'] + Vector(d.get('loc', (0, 0, 0)))
            o.rotation_euler = Vector(base['rotation_euler']) + Vector(d.get('rot', (0, 0, 0)))
            o.keyframe_insert('location', frame=k); o.keyframe_insert('rotation_euler', frame=k)
        o.location = base['location']; o.rotation_euler = base['rotation_euler']
        # una traccia NLA per azione: l'esportatore glTF fa una clip per ogni nome di traccia
        tr = o.animation_data.nla_tracks.new(); tr.name = nome
        tr.strips.new(nome, 0, a)
        o.animation_data.action = None
    return n / FPS


S = math.sin; C = math.cos; P2 = 2 * math.pi


# --------------------------------------------------------------- il cane
def cane():
    pelo = materiale('pelo', (0.45, 0.33, 0.2)); scuro = materiale('scuro', (0.08, 0.06, 0.05), 0.5)
    rad = perno('cane', (0, 0, 0))
    corpo = pezzo('corpo', 'sfera', (0.26, 0.62, 0.28), (0, 0, 0.42), rad, pelo)
    collo = perno('collo', (0, 0.22, 0.06), corpo)
    pezzo('pelo collo', 'cilindro', (0.13, 0.13, 0.2), (0, 0.04, 0.06), collo, pelo, rot=(-0.7, 0, 0))
    testa = pezzo('testa', 'sfera', (0.18, 0.24, 0.18), (0, 0.08, 0.13), collo, pelo)
    pezzo('muso', 'sfera', (0.1, 0.16, 0.09), (0, 0.15, -0.03), testa, pelo)
    pezzo('naso', 'sfera', (0.04, 0.03, 0.03), (0, 0.23, -0.01), testa, scuro)
    for x in (-0.06, 0.06): pezzo('orecchio', 'cono', (0.06, 0.03, 0.1), (x, -0.02, 0.1), testa, pelo, rot=(0.3, 0, 0))
    coda = perno('coda', (0, -0.3, 0.08), corpo)
    pezzo('pelo coda', 'cono', (0.05, 0.05, 0.26), (0, -0.06, 0.1), coda, pelo, rot=(-0.6, 0, 0))
    zampe = {}
    for nome, x, y in (('AS', -0.08, 0.2), ('AD', 0.08, 0.2), ('PS', -0.08, -0.2), ('PD', 0.08, -0.2)):
        z = perno('zampa ' + nome, (x, y, -0.06), corpo)
        pezzo('gamba ' + nome, 'cilindro', (0.06, 0.06, 0.34), (0, 0, -0.17), z, pelo)
        zampe[nome] = z
    tutti = [corpo, collo, coda, *zampe.values()]
    fasi = {'AS': 0, 'PD': 0, 'AD': 0.5, 'PS': 0.5}
    def passo(n, t):
        if n.startswith('zampa'): return {'rot': (0.45 * S(P2 * (t + fasi[n[-2:]])), 0, 0)}
        if n == 'coda': return {'rot': (0, 0, 0.5 * S(P2 * t * 2))}
        if n == 'corpo': return {'loc': (0, 0, 0.012 * S(P2 * t * 2))}
        if n == 'collo': return {'rot': (0.05 * S(P2 * t * 2), 0, 0)}
        return {}
    def fermo(n, t):
        if n == 'coda': return {'rot': (0, 0, 0.25 * S(P2 * t * 3))}
        if n == 'collo': return {'rot': (0, 0, 0.5 * S(P2 * t))}
        if n == 'corpo': return {'loc': (0, 0, 0.004 * S(P2 * t * 4))}
        return {}
    def annusa(n, t):
        if n == 'collo': return {'rot': (0.7 + 0.08 * S(P2 * t * 6), 0, 0.2 * S(P2 * t))}
        if n == 'coda': return {'rot': (0, 0, 0.15 * S(P2 * t * 2))}
        return {}
    info = {'_misure': {'altezza': 0.55, 'lunghezza': 0.85}}
    info['passo'] = {'durata': round(azione('passo', tutti, passo, 0.5), 3), 'velocita': 1.3}
    info['fermo'] = {'durata': round(azione('fermo', tutti, fermo, 3.0), 3), 'velocita': 0}
    info['annusa'] = {'durata': round(azione('annusa', tutti, annusa, 2.0), 3), 'velocita': 0}
    return rad, info


# --------------------------------------------------------------- la gallina e il piccione
def uccello(nome, scala, piume, ala_col, becco_col, cresta=False):
    p = materiale('piume ' + nome, piume); a = materiale('ali ' + nome, ala_col); b = materiale('becco ' + nome, becco_col, 0.5)
    zampe_m = materiale('zampe ' + nome, (0.75, 0.55, 0.25) if cresta else (0.7, 0.3, 0.3), 0.6)
    rad = perno(nome, (0, 0, 0))
    corpo = pezzo('corpo', 'sfera', (0.16 * scala, 0.26 * scala, 0.18 * scala), (0, 0, 0.17 * scala), rad, p, rot=(0.25, 0, 0))
    collo = perno('collo', (0, 0.08 * scala, 0.04 * scala), corpo)
    pezzo('piume collo', 'cilindro', (0.06 * scala, 0.06 * scala, 0.08 * scala), (0, 0.01 * scala, 0.03 * scala), collo, p, rot=(-0.3, 0, 0))
    testa = pezzo('testa', 'sfera', (0.08 * scala, 0.09 * scala, 0.08 * scala), (0, 0.02 * scala, 0.07 * scala), collo, p)
    pezzo('becco', 'cono', (0.025 * scala, 0.025 * scala, 0.05 * scala), (0, 0.06 * scala, -0.005 * scala), testa, b, rot=(-1.57, 0, 0))
    if cresta: pezzo('cresta', 'sfera', (0.015 * scala, 0.06 * scala, 0.04 * scala), (0, 0.0, 0.05 * scala), testa, materiale('cresta', (0.75, 0.08, 0.06)))
    pezzo('coda', 'cono', (0.12 * scala, 0.06 * scala, 0.14 * scala), (0, -0.14 * scala, 0.05 * scala), corpo, a, rot=(-2.2, 0, 0))
    ali = []
    for lato in (-1, 1):
        sp = perno('spalla ' + ('S' if lato < 0 else 'D'), (lato * 0.07 * scala, 0.02 * scala, 0.04 * scala), corpo)
        pezzo('ala', 'sfera', (0.025 * scala, 0.22 * scala, 0.12 * scala), (lato * 0.005 * scala, -0.04 * scala, -0.02 * scala), sp, a)
        ali.append(sp)
    zampe = []
    for lato in (-1, 1):
        z = perno('zampa ' + ('S' if lato < 0 else 'D'), (lato * 0.04 * scala, 0, -0.07 * scala), corpo)
        pezzo('gamba', 'cilindro', (0.015 * scala, 0.015 * scala, 0.1 * scala), (0, 0, -0.05 * scala), z, zampe_m)
        zampe.append(z)
    tutti = [corpo, collo, *ali, *zampe]
    def passo(n, t):
        if n.startswith('zampa'): return {'rot': (0.5 * S(P2 * (t + (0 if n.endswith('S') else 0.5))), 0, 0)}
        if n == 'collo': return {'loc': (0, 0.02 * scala * S(P2 * t * 2), 0)}           # la testa va avanti e indietro
        if n == 'corpo': return {'rot': (0, 0.06 * S(P2 * t), 0)}
        return {}
    def becca(n, t):
        u = t * 3 % 1
        giu = max(0.0, S(P2 * u)) ** 2
        if n == 'collo': return {'rot': (1.3 * giu, 0, 0), 'loc': (0, 0.02 * scala * giu, -0.03 * scala * giu)}
        if n == 'corpo': return {'rot': (0.25 * giu, 0, 0)}
        return {}
    def fermo(n, t):
        if n == 'collo': return {'rot': (0, 0, 0.6 * S(P2 * t) * (1 if (t * 4) % 1 < 0.5 else 0.3))}
        return {}
    def vola(n, t):
        # le ali si aprono verso l'alto e battono attorno all'asse del corpo
        if n.startswith('spalla'): return {'rot': (0, (-1 if n.endswith('S') else 1) * (1.2 + 0.9 * S(P2 * t * 4)), 0)}
        if n.startswith('zampa'): return {'rot': (-0.9, 0, 0)}
        if n == 'corpo': return {'rot': (-0.25, 0, 0)}
        return {}
    info = {'_misure': {'altezza': round(0.3 * scala, 3), 'lunghezza': round(0.4 * scala, 3)}}
    info['passo'] = {'durata': round(azione('passo', tutti, passo, 0.5), 3), 'velocita': round(0.35 * scala, 3)}
    info['becca'] = {'durata': round(azione('becca', tutti, becca, 1.5), 3), 'velocita': 0}
    info['fermo'] = {'durata': round(azione('fermo', tutti, fermo, 2.5), 3), 'velocita': 0}
    if not cresta: info['vola'] = {'durata': round(azione('vola', tutti, vola, 1.0), 3), 'velocita': 6.0}
    return rad, info


def esporta(rad, nome):
    bpy.ops.object.select_all(action='DESELECT')
    for o in [rad, *rad.children_recursive]: o.select_set(True)
    bpy.context.view_layer.objects.active = rad
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_yup=True)


if __name__ == '__main__':
    bpy.context.scene.render.fps = FPS
    indice_f = os.path.join(USCITA, 'animali.json')
    indice = json.load(open(indice_f)) if os.path.exists(indice_f) else {}
    for nome, fa in (('cane', cane), ('gallina', lambda: uccello('gallina', 1.6, (0.62, 0.3, 0.12), (0.45, 0.2, 0.08), (0.85, 0.65, 0.2), cresta=True)),
                     ('piccione', lambda: uccello('piccione', 1.0, (0.5, 0.52, 0.56), (0.38, 0.4, 0.45), (0.25, 0.22, 0.22)))):
        pulisci()
        rad, info = fa()
        esporta(rad, nome)
        indice[nome] = info
        print('ANIMALE', nome, json.dumps(info))
    json.dump(indice, open(indice_f, 'w'), indent=1)
    if 'python' in os.path.basename(sys.executable): os._exit(0)
