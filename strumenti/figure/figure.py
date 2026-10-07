# =====================================================================
# LE FIGURE: corpi MakeHuman (MPFB, CC0) vestiti alla fiorentina del 1216.
#
#   blender -b --python figure.py            tutte le varianti
#   blender -b --python figure.py -- 3       solo la variante 3 (prove)
#
# Scrive ../../public/figure/figura-NN.glb e figure.json (chi è chi).
#
# LE VESTI (livello: ipotesi; riferimento da controllare: M. G. Muzzarelli,
# Guardaroba medievale, 1999). Per tenere le figure leggere e senza
# compenetrazioni la parte aderente dell'abito è «dipinta» sul corpo:
# busto e maniche della gonnella, le calze sulle gambe, le scarpe. Sono
# invece geometria vera la gonna della gonnella o della veste, il mantello,
# il cappuccio con la sua mantellina, il velo e la cuffia, la cintura.
# Tutto è pesato sulle ossa, quindi si muove con il corpo.
# =====================================================================
import bpy, bmesh, os, sys, json, math, random
from mathutils import Vector
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.locationservice import LocationService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

QUI = os.path.dirname(os.path.abspath(__file__))
PIEGHE = True          # simulazione del tessuto (più lenta); False per prove rapide
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'figure'))
DATI = lambda tipo: LocationService.get_user_data(tipo)

# --------------------------------------------------------------- tinte
lin = lambda c: tuple((v / 255) ** 2.2 for v in c) + (1,)
LANA = [(112, 92, 70), (88, 76, 64), (132, 118, 96), (78, 74, 70), (104, 84, 60), (146, 134, 112), (96, 88, 66)]
TINTE = [(46, 66, 116), (134, 60, 40), (62, 92, 56), (110, 74, 46), (40, 52, 88), (156, 112, 56), (92, 50, 64), (120, 48, 36), (70, 104, 120)]
GRANA = [(150, 30, 32), (118, 22, 28)]
LINO = [(226, 220, 204), (214, 206, 188)]
CUOIO = [(58, 42, 30), (44, 34, 26), (74, 54, 36)]

NERO = [(34, 30, 30), (42, 36, 32)]                 # chierici
SAIO = [(92, 86, 78), (80, 70, 60)]                 # monaci [da verificare: colore dell'abito vallombrosano]
PELLI = [(0.9, 0.76, 0.66), (0.86, 0.7, 0.58), (0.8, 0.64, 0.52), (0.92, 0.8, 0.7), (0.76, 0.6, 0.48)]
CAPELLI_COL = [(0.18, 0.12, 0.08), (0.12, 0.09, 0.07), (0.28, 0.18, 0.1), (0.08, 0.07, 0.06), (0.36, 0.26, 0.16)]

# I ruoli: chi si vede per strada la mattina di Pasqua (livello: ipotesi).
# età secondo MakeHuman: 0,19 = 11 anni, 0,3 ≈ 16, 0,5 = 25, 0,8 ≈ 64.
RUOLI = [
    ('artigiano',   dict(sesso='m', eta=(0.5, 0.8),   ceto='popolo',   n=4, orlo=(0.44, 0.52), grembiule=0.75, capo=['cuffia', 'nudo', 'nudo', 'cappuccio'], mantello=0.05)),
    ('popolano',    dict(sesso='m', eta=(0.5, 0.86),  ceto='popolo',   n=4, orlo=(0.4, 0.5),   capo=['cappuccio', 'cappuccio', 'nudo'], mantello=0.15)),
    ('mercante',    dict(sesso='m', eta=(0.55, 0.82), ceto='mercante', n=4, orlo=(0.2, 0.3),   borsa=0.8, capo=['cappuccio', 'nudo'], mantello=0.6)),
    ('cavaliere',   dict(sesso='m', eta=(0.5, 0.75),  ceto='nobile',   n=3, orlo=(0.06, 0.12), spada=0.7, capo=['nudo', 'nudo', 'cappuccio'], mantello=0.85)),
    ('chierico',    dict(sesso='m', eta=(0.55, 0.85), ceto='clero',    n=2, orlo=(0.04, 0.07), tonsura=True, capo=['nudo'], mantello=0.5, colori=NERO)),
    ('monaco',      dict(sesso='m', eta=(0.55, 0.85), ceto='clero',    n=2, orlo=(0.04, 0.07), scapolare=True, cordone=True, capo=['cappuccio'], mantello=0, colori=SAIO)),
    ('popolana',    dict(sesso='f', eta=(0.5, 0.85),  ceto='popolo',   n=4, orlo=(0.03, 0.05), grembiule=0.4, capo=['velo', 'velo', 'cuffia'], mantello=0.1)),
    ('fantesca',    dict(sesso='f', eta=(0.42, 0.7),  ceto='popolo',   n=2, orlo=(0.04, 0.06), grembiule=1.0, capo=['cuffia', 'velo'], mantello=0)),
    ('mercantessa', dict(sesso='f', eta=(0.5, 0.8),   ceto='mercante', n=3, orlo=(0.02, 0.04), capo=['velo'], mantello=0.5)),
    ('nobildonna',  dict(sesso='f', eta=(0.5, 0.75),  ceto='nobile',   n=2, orlo=(0.012, 0.025), capo=['velo'], mantello=0.8)),
    ('fanciulla',   dict(sesso='f', eta=(0.3, 0.36),  ceto='mercante', n=2, orlo=(0.02, 0.04), capo=['trecce'], ghirlanda=1.0, mantello=0)),
    ('ragazzo',     dict(sesso='m', eta=(0.17, 0.24), ceto='popolo',   n=2, orlo=(0.3, 0.36),  capo=['nudo', 'cappuccio'], mantello=0)),
    ('ragazza',     dict(sesso='f', eta=(0.17, 0.24), ceto='popolo',   n=2, orlo=(0.05, 0.08), capo=['trecce', 'cuffia'], mantello=0)),
]
VARIANTI = []
for ruolo, spec in RUOLI:
    for k in range(spec['n']):
        i = len(VARIANTI)
        r = random.Random(1216 + i * 31)
        VARIANTI.append({'n': i, 'ruolo': ruolo, 'sesso': spec['sesso'], 'eta': round(r.uniform(*spec['eta']), 3),
                         'ceto': spec['ceto'], 'seme': 1216 + i * 31})
SPEC = dict(RUOLI)


def pulisci():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.armatures):
        for x in list(coll):
            if x.users == 0:
                coll.remove(x)


def materiale(nome, colore, ruv=0.85, immagine=None):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = colore
    bsdf.inputs['Roughness'].default_value = ruv
    if immagine:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = immagine
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    m.use_backface_culling = False
    return m


def osso_dominante(obj, v):
    best, w = None, 0
    for g in v.groups:
        if g.weight > w:
            best, w = obj.vertex_groups[g.group].name, g.weight
    return best


TRONCO = {'Hips', 'LowerBack', 'Spine', 'Spine1', 'LHipJoint', 'RHipJoint', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg',
          'LeftShoulder', 'RightShoulder', 'Neck', 'Neck1'}


def misure(corpo):
    """Ellissi del corpo a varie quote (corpo a riposo, braccia escluse:
    nella posa ad A le mani pendono all'altezza dei fianchi), e la testa."""
    dom = [osso_dominante(corpo, v) for v in corpo.data.vertices]
    vs = [corpo.matrix_world @ v.co for v in corpo.data.vertices]
    tronco = [v for v, d in zip(vs, dom) if d in TRONCO]
    def fetta(z, banda=0.025):
        p = [v for v in tronco if abs(v.z - z) < banda]
        if not p: return None
        cx = (max(v.x for v in p) + min(v.x for v in p)) / 2; cy = (max(v.y for v in p) + min(v.y for v in p)) / 2
        return cx, cy, max(abs(v.x - cx) for v in p), max(abs(v.y - cy) for v in p)
    testa = [v for v, d in zip(vs, dom) if d == 'Head']
    tc = sum(testa, Vector()) / len(testa)
    tr = Vector((max(abs(v.x - tc.x) for v in testa), max(abs(v.y - tc.y) for v in testa), max(abs(v.z - tc.z) for v in testa)))
    return fetta, tc, tr


def nuova_mesh(nome, rig, verts, facce, pesi, mat):
    me = bpy.data.meshes.new(nome)
    me.from_pydata(verts, [], facce)
    me.update()
    # coordinate di texture cilindriche, in metri: servono alla trama della lana
    uv = me.uv_layers.new(name='UVMap')
    cx = sum(v[0] for v in verts) / len(verts); cy = sum(v[1] for v in verts) / len(verts)
    for poly in me.polygons:
        for li in poly.loop_indices:
            x, y, z = verts[me.loops[li].vertex_index]
            uv.data[li].uv = (math.atan2(x - cx, y - cy) * 0.25, z)
    ob = bpy.data.objects.new(nome, me)
    bpy.context.scene.collection.objects.link(ob)
    gruppi = {}
    for i, wl in enumerate(pesi):
        tot = sum(w for _, w in wl) or 1
        for osso, w in wl:
            if w <= 0: continue
            if osso not in gruppi: gruppi[osso] = ob.vertex_groups.new(name=osso)
            gruppi[osso].add([i], w / tot, 'REPLACE')
    ob.parent = rig
    mod = ob.modifiers.new('scheletro', 'ARMATURE'); mod.object = rig
    me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    return ob


def drappeggia(ob, corpo, fissati, fotogrammi=50, rigidezza=12, piega=0.8, massa=0.35):
    """Fa cadere il tessuto sul corpo con la simulazione di Blender e ne
    salva la forma finale. «fissati»: indici dei vertici cuciti (vita,
    spalle, collo). Il tessuto in eccesso si raccoglie in pieghe."""
    sc = bpy.context.scene
    g = ob.vertex_groups.new(name='spillo')
    g.add(list(fissati), 1.0, 'REPLACE')
    if 'collisione' not in corpo.modifiers:
        corpo.modifiers.new('collisione', 'COLLISION')
        corpo.collision.thickness_outer = 0.006
        corpo.collision.cloth_friction = 8
    cl = ob.modifiers.new('tessuto', 'CLOTH')
    ob.modifiers.move(len(ob.modifiers) - 1, 0)            # prima dello scheletro
    st = cl.settings
    st.quality = 6; st.mass = massa; st.air_damping = 1.5
    st.tension_stiffness = st.compression_stiffness = rigidezza
    st.shear_stiffness = rigidezza * 0.5; st.bending_stiffness = piega
    st.pin_stiffness = 1.0; st.vertex_group_mass = 'spillo'
    cl.collision_settings.distance_min = 0.006
    cl.collision_settings.use_self_collision = False
    cl.point_cache.frame_start = 1; cl.point_cache.frame_end = fotogrammi
    sc.frame_start, sc.frame_end = 1, fotogrammi
    for f in range(1, fotogrammi + 1):
        sc.frame_set(f)
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier=cl.name)
    sc.frame_set(1)
    ob.vertex_groups.remove(ob.vertex_groups['spillo'])
    return ob


def tornio(profilo, n, a0, a1, cx, cy, sx, sy, chiuso):
    """profilo: [(z, rx, ry)] dall'alto in basso. Restituisce vertici e facce."""
    verts, facce = [], []
    nn = n if chiuso else n + 1
    for (z, rx, ry) in profilo:
        for i in range(nn):
            a = a0 + (a1 - a0) * i / n
            verts.append((cx + math.sin(a) * rx * sx, cy - math.cos(a) * ry * sy, z))
    for k in range(len(profilo) - 1):
        for i in range(n):
            a = k * nn + i; b = k * nn + (i + 1) % nn
            facce.append((a, b, b + nn, a + nn))
    return verts, facce


def smooth(a, b, v):
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


# sezioni del volto da variare, con quanta forza al massimo
SEZIONI_VOLTO = {'nose': 0.6, 'chin': 0.5, 'cheek': 0.5, 'eyes': 0.35, 'mouth': 0.45, 'forehead': 0.4, 'head': 0.35, 'ears': 0.4, 'eyebrows': 0.4}


def volto(base, r):
    """Un volto diverso per ogni variante: pochi modificatori MakeHuman per
    sezione, con pesi moderati, simmetrici a destra e a sinistra."""
    radice = LocationService.get_mpfb_data('targets')
    for sez, forza in SEZIONI_VOLTO.items():
        cartella = os.path.join(radice, sez)
        if not os.path.isdir(cartella): continue
        nomi = sorted(f for f in os.listdir(cartella) if f.endswith('.target.gz'))
        gruppi = {}
        for f in nomi:
            chiave = f[2:] if f.startswith(('l-', 'r-')) else f
            gruppi.setdefault(chiave.replace('.target.gz', ''), []).append(f)
        # coppie incr/decr: se ne sceglie un verso solo
        scelte = r.sample(sorted(gruppi), min(len(gruppi), r.randint(1, 3)))
        for ch in scelte:
            w = r.uniform(0.1, forza)
            for f in gruppi[ch]:
                TargetService.load_target(base, os.path.join(cartella, f), weight=w)


def crea(var):
    r = random.Random(var['seme'])
    pulisci()
    m = var['sesso'] == 'm'
    macro = {'gender': r.uniform(0.92, 1.0) if m else r.uniform(0.0, 0.08), 'age': var['eta'],
             'muscle': r.uniform(0.4, 0.6), 'weight': r.uniform(0.3, 0.55), 'proportions': r.uniform(0.4, 0.6),
             'height': r.uniform(0.3, 0.55), 'cupsize': 0.45, 'firmness': 0.5,
             'race': {'caucasian': 0.92, 'african': 0.03, 'asian': 0.05}}
    base = HumanService.create_human(macro_detail_dict=macro)
    volto(base, r)
    HumanService.add_builtin_rig(base, 'cmu_mb')
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    rig.name = f'figura-{var["n"]:02d}'
    proxy = 'male1591' if m else 'female1605'
    HumanService.add_mhclo_asset(os.path.join(DATI('proxymeshes'), proxy, proxy + '.proxy'), base, asset_type='Proxymeshes', subdiv_levels=0)
    HumanService.add_mhclo_asset(os.path.join(DATI('eyes'), 'low-poly', 'low-poly.mhclo'), base, asset_type='Eyes', subdiv_levels=0, material_type='MAKESKIN')
    if var['eta'] > 0.25:
        sop = f'eyebrow{r.randint(1, 12):03d}'
        HumanService.add_mhclo_asset(os.path.join(DATI('eyebrows'), sop, sop + '.mhclo'), base, asset_type='Eyebrows', subdiv_levels=0, material_type='MAKESKIN')
    corpo = next(o for o in rig.children if o.type == 'MESH' and proxy in o.name)

    # --- chi è e come veste: lo decide il ruolo
    sp = SPEC[var['ruolo']]
    ceto = var['ceto']
    if 'colori' in sp: veste = lin(r.choice(sp['colori']))
    elif ceto == 'popolo': veste = lin(r.choice(LANA) if r.random() < 0.6 else tuple(int(c * 0.8) for c in r.choice(TINTE)))
    elif ceto == 'mercante': veste = lin(r.choice(TINTE) if r.random() < 0.8 else r.choice(LANA))
    else: veste = lin(r.choice(GRANA) if r.random() < 0.5 else r.choice(TINTE))
    calze = lin(r.choice(GRANA) if ceto == 'nobile' and r.random() < 0.5 else r.choice(NERO) if ceto == 'clero' else r.choice(LANA + TINTE[:3]))
    scarpe = lin(r.choice(CUOIO))
    orlo = r.uniform(*sp['orlo'])
    capo = r.choice(sp['capo'])
    mantello = r.random() < sp.get('mantello', 0)
    pelle_tinta = r.choice(PELLI)
    capelli_tinta = (0.42, 0.4, 0.38) if var['eta'] > 0.78 and r.random() < 0.7 else r.choice(CAPELLI_COL)

    # --- pelle: la texture MakeHuman adatta all'età
    eta_pelle = 'young' if var['eta'] < 0.62 else 'middleage' if var['eta'] < 0.78 else 'old'
    nome_pelle = f'{eta_pelle}_caucasian_{"male" if m else "female"}'
    cartella = os.path.join(DATI('skins'), nome_pelle)
    png = next((os.path.join(dp, f) for dp, _, fs in os.walk(cartella) for f in fs if f.endswith('diffuse.png')), None)
    img = bpy.data.images.load(png) if png else None
    if img and max(img.size) > 1024: img.scale(1024, 1024)
    M = {
        'pelle': materiale('pelle', (1, 1, 1, 1), 0.55, img),
        'veste': materiale('veste', veste, 0.9),
        'calze': materiale('calze', calze, 0.9),
        'scarpe': materiale('scarpe', scarpe, 0.7),
    }
    corpo.data.materials.clear()
    for k in ['pelle', 'veste', 'calze', 'scarpe']: corpo.data.materials.append(M[k])
    PELLE = {'Head', 'Neck', 'Neck1', 'LeftHand', 'RightHand', 'LThumb', 'RThumb', 'LeftFingerBase', 'RightFingerBase', 'LeftHandFinger1', 'RightHandFinger1'}
    CALZE = {'LHipJoint', 'RHipJoint', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'}
    SCARPE = {'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'}
    z_sotto = orlo * rig.data.bones['Head'].tail_local.z / 1.7 + 0.04
    for p in corpo.data.polygons:
        conta = {}
        for vi in p.vertices:
            o = osso_dominante(corpo, corpo.data.vertices[vi]); conta[o] = conta.get(o, 0) + 1
        o = max(conta, key=conta.get)
        # le gambe sopra l'orlo stanno sotto la veste: stesso colore, così
        # se la gonna si apre camminando non affiora un'altra tinta
        if o in CALZE and (corpo.matrix_world @ p.center).z > z_sotto:
            o = 'Hips'
        p.material_index = 0 if o in PELLE else 2 if o in CALZE else 3 if o in SCARPE else 1

    # --- misure del corpo a riposo
    fetta, tc, tr = misure(corpo)
    B = {b.name: b for b in rig.data.bones}
    zh = B['Hips'].head_local.z
    zv = zh + 0.1 * (zh / 0.874)                 # vita
    zg = B['LeftLeg'].head_local.z                # ginocchio
    altezza = B['Head'].tail_local.z

    # --- la gonna della gonnella (o della veste): segue anche e cosce
    # profilo: vita, il punto più largo dei fianchi, poi una svasatura
    # regolare fino all'orlo; si controlla solo che copra le gambe
    z_orlo = orlo * altezza / 1.7
    fv = fetta(zv, 0.02) or (0, 0, 0.14, 0.1)
    fianchi = [fetta(zv - 0.02 * i, 0.02) for i in range(1, 14)]
    fianchi = [(f, zv - 0.02 * (i + 1)) for i, f in enumerate(fianchi) if f]
    (fh, zfh) = max(fianchi, key=lambda x: x[0][2]) if fianchi else (fv, zv - 0.15)
    # più stoffa del necessario all'orlo: cadendo si raccoglie in pieghe
    svasa = 0.2 if not m else {'popolo': 0.09, 'mercante': 0.13, 'nobile': 0.17, 'clero': 0.15}[ceto]
    ring = []
    k = 16
    for i in range(k + 1):
        t = i / k
        z = zv + (z_orlo - zv) * t
        if z >= zfh:                             # dalla vita ai fianchi
            u = (zv - z) / max(1e-3, zv - zfh)
            rx = fv[2] + 0.004 + (fh[2] + 0.02 - fv[2]) * math.sin(u * math.pi / 2)
            ry = fv[3] + 0.006 + (fh[3] + 0.025 - fv[3]) * math.sin(u * math.pi / 2)
        else:                                    # dai fianchi all'orlo
            u = (zfh - z) / max(1e-3, zfh - z_orlo)
            rx = fh[2] + 0.02 + svasa * u
            ry = fh[3] + 0.025 + svasa * 0.8 * u
            f = fetta(z, 0.03)
            if f:                                # le gambe stanno dentro
                rx = max(rx, f[2] + 0.03); ry = max(ry, f[3] + 0.04)
        ring.append((z, rx, ry, fv[0], fv[1]))
    cx0, cy0 = ring[0][3], ring[0][4]
    # quanto la gonna segue le gambe: molto la gonnella corta, poco la veste
    # lunga, che altrimenti si dividerebbe in due tubi come un paio di brache
    segue = 0.85 if orlo > 0.35 else 0.6 if orlo > 0.15 else 0.4

    def come_gonna(x, z):
        t = smooth(zv, z_orlo, z) * segue
        lato = smooth(-1.0, 1.0, (x - cx0) / 0.2)
        basso = smooth(zg + 0.05, zg - 0.25, z) * 0.35
        return [('Hips', 1 - t), ('LeftUpLeg', t * lato * (1 - basso)), ('RightUpLeg', t * (1 - lato) * (1 - basso)),
                ('LeftLeg', t * lato * basso), ('RightLeg', t * (1 - lato) * basso)]

    N = 56
    verts, facce = tornio([(z, rx, ry) for (z, rx, ry, _, _) in ring], N, 0, 2 * math.pi, cx0, cy0, 1, 1, True)
    # pieghe impostate: la stoffa raccolta in vita forma cannoni verticali
    lobi = 14 if orlo < 0.2 else 10
    for i, (x, y, z) in enumerate(verts):
        a = (i % N) / N * 2 * math.pi
        t = smooth(zv, z_orlo, z)
        k = 1 + (0.012 + 0.05 * t) * math.sin(lobi * a)
        verts[i] = (cx0 + (x - cx0) * k, cy0 + (y - cy0) * k, z)
    pesi = [come_gonna(x, z) for (x, y, z) in verts]
    gonna = nuova_mesh('gonna', rig, verts, facce, pesi, M['veste'])
    pesi_gonna = pesi
    if PIEGHE:
        drappeggia(gonna, corpo, range(2 * N), rigidezza=15 if ceto == 'popolo' else 10, piega=1.2 if m else 0.6)

    def pannello(nome, a0, a1, z_alto, z_basso, scarto, mat, fissa=True):
        """Un telo davanti o dietro (grembiule, scapolare) che segue la gonna
        e poi cade per conto suo."""
        prof = []
        for i in range(9):
            z = z_alto + (z_basso - z_alto) * i / 8
            if z >= zv:
                f = fetta(z, 0.03) or fv
                prof.append((z, f[2] + scarto, f[3] + scarto))
            else:
                j = min(range(len(ring)), key=lambda q: abs(ring[q][0] - z))
                prof.append((z, ring[j][1] + scarto + 0.02, ring[j][2] + scarto + 0.02))
        nn = 16
        verts, facce = tornio(prof, nn, a0, a1, cx0, cy0, 1, 1, False)
        ob = nuova_mesh(nome, rig, verts, facce, [come_gonna(x, z) if z < zv else [('Spine', 0.6), ('Spine1', 0.4)] for (x, _, z) in verts], mat)
        if PIEGHE and fissa:
            if 'collisione' not in gonna.modifiers:
                gonna.modifiers.new('collisione', 'COLLISION'); gonna.collision.thickness_outer = 0.006
            drappeggia(ob, corpo, range(nn + 1), rigidezza=14, piega=2.0, massa=0.3)
        return ob

    # --- cintura
    if m or r.random() < 0.5:
        f = fetta(zv + 0.01, 0.02) or (0, 0, 0.15, 0.11)
        verts, facce = tornio([(zv + 0.03, f[2] + 0.012, f[3] + 0.012), (zv - 0.005, f[2] + 0.014, f[3] + 0.014)], 28, 0, 2 * math.pi, f[0], f[1], 1, 1, True)
        nuova_mesh('cintura', rig, verts, facce, [[('Hips', 1)]] * len(verts), materiale('cuoio', lin(r.choice(CUOIO)), 0.6))

    # --- mantello: dalle spalle in giù, aperto davanti
    zs = B['LeftArm'].head_local.z
    zc = B['Neck'].head_local.z
    if mantello:
        colore = lin(r.choice(TINTE + GRANA) if ceto == 'nobile' else r.choice(LANA + TINTE))
        fino = (0.3 if not m else r.uniform(0.35, 0.6)) * altezza / 1.7
        fs = fetta(zs - 0.03, 0.03)
        prof = [(zc + 0.02, 0.075, 0.07), (zs + 0.01, fs[2] + 0.03, fs[3] + 0.04)]
        for i in range(1, 6):
            z = zs - (zs - fino) * i / 5
            f = fetta(z, 0.04) or fs
            prof.append((z, max(fs[2] + 0.04, f[2] + 0.06) + 0.02 * i, max(fs[3] + 0.05, f[3] + 0.07) + 0.02 * i))
        prof = [prof[0], prof[1]] + [(z, rx * 1.12, ry * 1.12) for (z, rx, ry) in prof[2:]]   # stoffa abbondante
        verts, facce = tornio(prof, 34, math.pi * 0.6, math.pi * 1.4, fs[0], fs[1], 1, 1, False)
        pesi = []
        for (x, y, z) in verts:
            a = smooth(zc, zs - 0.25, z)
            b = smooth(zs - 0.25, fino, z) * 0.35
            lato = smooth(-0.6, 0.6, x / 0.2)
            pesi.append([('Neck', (1 - a) * 0.6), ('Spine1', (1 - a) * 0.4 + a * (1 - b) * 0.5), ('Spine', a * (1 - b) * 0.5),
                         ('Hips', b * 0.4), ('LeftUpLeg', b * 0.6 * lato), ('RightUpLeg', b * 0.6 * (1 - lato))])
        ob = nuova_mesh('mantello', rig, verts, facce, pesi, materiale('mantello', colore, 0.92))
        if PIEGHE:
            drappeggia(ob, corpo, range(2 * 35), rigidezza=12, piega=1.5, massa=0.45)

    # --- accessori del mestiere
    accessori = []
    if r.random() < sp.get('grembiule', 0):
        col = lin(r.choice(LINO)) if r.random() < 0.6 or not m else lin(r.choice(CUOIO))
        fondo = max(z_orlo + 0.08, zg - 0.12) if m else z_orlo + 0.25
        pannello('grembiule', -math.pi * 0.3, math.pi * 0.3, zv + 0.01, fondo, 0.02, materiale('grembiule', col, 0.9))
        accessori.append('grembiule')
    if sp.get('scapolare'):
        mat = materiale('scapolare', tuple(c * 0.8 for c in veste[:3]) + (1,), 0.92)
        pannello('scapolare', -math.pi * 0.16, math.pi * 0.16, zs, zg - 0.18, 0.025, mat)
        pannello('scapolare-dietro', math.pi * 0.84, math.pi * 1.16, zs, zg - 0.18, 0.025, mat)
        accessori.append('scapolare')
    if sp.get('cordone'):
        f = fetta(zv + 0.01, 0.02) or fv
        verts, facce = tornio([(zv + 0.012, f[2] + 0.03, f[3] + 0.03), (zv - 0.004, f[2] + 0.032, f[3] + 0.032)], 28, 0, 2 * math.pi, f[0], f[1], 1, 1, True)
        nuova_mesh('cordone', rig, verts, facce, [[('Hips', 1)]] * len(verts), materiale('cordone', lin((200, 190, 160)), 0.95))
        accessori.append('cordone')
    if r.random() < sp.get('borsa', 0):
        # la scarsella appesa alla cintura, sul fianco destro
        x0 = cx0 - (fv[2] + 0.035)
        verts = [(x0 + dx, cy0 + dy, zv - 0.03 + dz) for dz in (0, -0.15) for (dx, dy) in ((-0.02, -0.06), (0.02, -0.06), (0.02, 0.06), (-0.02, 0.06))]
        facce = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        nuova_mesh('scarsella', rig, verts, facce, [[('Hips', 1)]] * 8, materiale('scarsella', lin(r.choice(CUOIO)), 0.6))
        accessori.append('scarsella')
    if r.random() < sp.get('spada', 0):
        # la spada nel fodero, appesa a sinistra e inclinata all'indietro
        x0 = cx0 + fv[2] + 0.04
        alto, basso = Vector((x0, cy0 + 0.02, zv - 0.02)), Vector((x0 + 0.03, cy0 + 0.3, zv - 0.82))
        d = (basso - alto).normalized(); u = Vector((1, 0, 0)).cross(d).normalized() * 0.022; w = Vector((0.012, 0, 0))
        verts = [tuple(p + a + b) for p in (alto, basso) for a, b in ((u, w), (-u, w), (-u, -w), (u, -w))]
        facce = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        nuova_mesh('spada', rig, verts, facce, [[('Hips', 1)]] * 8, materiale('fodero', lin((40, 30, 24)), 0.5))
        accessori.append('spada')

    # --- il capo
    def guscio(nome, centro, raggi, z_taglio, faccia_aperta, mat, osso_basso='Neck'):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1)
        for v in bm.verts:
            v.co = Vector((centro.x + v.co.x * raggi.x, centro.y + v.co.y * raggi.y, centro.z + v.co.z * raggi.z))
        via = [f for f in bm.faces if f.calc_center_median().z < z_taglio or
               (faccia_aperta and f.calc_center_median().y < centro.y - raggi.y * 0.35 and f.calc_center_median().z < centro.z + raggi.z * 0.45)]
        bmesh.ops.delete(bm, geom=via, context='FACES')
        verts = [tuple(v.co) for v in bm.verts]
        idx = {v: i for i, v in enumerate(bm.verts)}
        facce = [tuple(idx[v] for v in f.verts) for f in bm.faces]
        bm.free()
        pesi = [[('Head', smooth(zc + 0.02, centro.z, z)), (osso_basso, 1 - smooth(zc + 0.02, centro.z, z))] for (_, _, z) in verts]
        return nuova_mesh(nome, rig, verts, facce, pesi, mat)

    if capo == 'cappuccio':
        col = lin(r.choice(LANA + TINTE))
        mat = materiale('cappuccio', col, 0.92)
        guscio('cappuccio', tc + Vector((0, 0.012, 0.01)), tr + Vector((0.018, 0.02, 0.02)), tc.z - tr.z * 0.85, True, mat)
        fs = fetta(zs - 0.02, 0.03)
        verts, facce = tornio([(zc + 0.05, 0.075, 0.085), (zc - 0.02, 0.12, 0.11), (zs - 0.06, fs[2] + 0.05, fs[3] + 0.05), (zs - 0.14, fs[2] + 0.07, fs[3] + 0.07)],
                              24, 0, 2 * math.pi, fs[0], fs[1], 1, 1, True)
        pesi = [[('Neck1', smooth(zs - 0.1, zc + 0.05, z)), ('Spine1', 1 - smooth(zs - 0.1, zc + 0.05, z))] for (_, _, z) in verts]
        nuova_mesh('batolo', rig, verts, facce, pesi, mat)
    elif capo == 'cuffia':
        # la cuffia copre capelli e orecchie e lascia il viso scoperto
        guscio('cuffia', tc + Vector((0, 0.008, 0.012)), tr + Vector((0.01, 0.012, 0.008)), tc.z - tr.z * 0.55, True, materiale('cuffia', lin(r.choice(LINO)), 0.95))
    elif capo == 'velo':
        mat = materiale('velo', lin(r.choice(LINO)), 0.95)
        guscio('velo', tc + Vector((0, 0.01, 0.012)), tr + Vector((0.016, 0.018, 0.012)), tc.z - tr.z * 0.6, True, mat)
        fs = fetta(zs - 0.02, 0.03)
        verts, facce = tornio([(tc.z - tr.z * 0.3, tr.x + 0.016, tr.y + 0.018), (zc, tr.x + 0.03, tr.y + 0.03), (zs - 0.08, fs[2] * 0.8, fs[3] + 0.03)],
                              18, math.pi * 0.62, math.pi * 1.38, tc.x, tc.y + 0.01, 1, 1, False)
        pesi = [[('Head', smooth(zc, tc.z, z)), ('Neck1', 1 - smooth(zc, tc.z, z) - smooth(zc, zs - 0.08, z) * 0.5), ('Spine1', smooth(zc, zs - 0.08, z) * 0.5)] for (_, _, z) in verts]
        nuova_mesh('velo-dietro', rig, verts, facce, pesi, mat)
    capelli = None
    if capo == 'nudo':
        # gli uomini del Duecento portano la zazzera, i capelli al mento
        capelli = 'short02' if sp.get('tonsura') else r.choice(['bob01', 'bob02', 'bob01', 'short02']) if m else 'braid01'
    elif capo == 'trecce':
        capelli = r.choice(['braid01', 'braid01', 'ponytail01'])
    if capelli:
        HumanService.add_mhclo_asset(os.path.join(DATI('hair'), capelli, capelli + '.mhclo'), base, asset_type='Hair', subdiv_levels=0, material_type='MAKESKIN')
    if sp.get('tonsura'):
        # la chierica: la sommità del capo rasata, un disco color pelle
        guscio('tonsura', tc + Vector((0, 0.01, 0.022)), tr + Vector((0.016, 0.016, 0.014)), tc.z + tr.z * 0.72, False,
               materiale('tonsura', (pelle_tinta[0] * 0.62, pelle_tinta[1] * 0.42, pelle_tinta[2] * 0.32, 1), 0.5), 'Head')
        accessori.append('tonsura')
    if r.random() < sp.get('ghirlanda', 0):
        # la ghirlanda delle fanciulle: un serto di foglie e fiori
        zg2 = tc.z + tr.z * 0.42
        verts, facce = [], []
        n1, n2, R1, R2 = 28, 6, max(tr.x, tr.y) + 0.012, 0.014
        for i in range(n1):
            a = i / n1 * 2 * math.pi
            for j in range(n2):
                b = j / n2 * 2 * math.pi
                rr = R1 + R2 * math.cos(b) * (1 + 0.35 * math.sin(a * 9))
                verts.append((tc.x + math.sin(a) * rr * (tr.x / max(tr.x, tr.y)), tc.y + 0.01 - math.cos(a) * rr * (tr.y / max(tr.x, tr.y)), zg2 + R2 * math.sin(b)))
        for i in range(n1):
            for j in range(n2):
                a0, a1 = i * n2 + j, ((i + 1) % n1) * n2 + j
                facce.append((a0, a1, ((i + 1) % n1) * n2 + (j + 1) % n2, i * n2 + (j + 1) % n2))
        nuova_mesh('ghirlanda', rig, verts, facce, [[('Head', 1)]] * len(verts), materiale('ghirlanda', lin((70, 104, 52)), 0.8))
        accessori.append('ghirlanda')

    # --- via il corpo ad alta risoluzione e gli oggetti di servizio
    bpy.data.objects.remove(base, do_unlink=True)
    for o in rig.children:
        for mod in o.modifiers:
            if mod.type != 'ARMATURE':
                o.modifiers.remove(mod)
    info = dict(var, capo=capo, mantello=mantello, accessori=accessori, capelli=capelli,
                pelle=pelle_tinta, colore_capelli=capelli_tinta, orlo=round(orlo, 2), altezza=round(altezza, 3),
                anche=round(zh, 4), file=f'figura-{var["n"]:02d}.glb',
                vertici=sum(len(o.data.vertices) for o in rig.children if o.type == 'MESH'))
    return rig, info


def esporta(rig, file):
    # texture piccole: gli occhi e le sopracciglia si vedono da lontano,
    # i capelli quasi; la pelle resta a 1024
    for img in bpy.data.images:
        if not img.size[0]: continue
        nome = img.name.lower()
        lato = 128 if 'eye' in nome and 'brow' not in nome else 256 if 'brow' in nome or 'lash' in nome else 512 if img.name != 'pelle' and 'diffuse' in nome and 'skinned' not in nome else 1024
        if max(img.size) > lato:
            img.scale(lato, lato)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for o in rig.children: o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=file, export_format='GLB', use_selection=True, export_animations=False,
                              export_skins=True, export_morph=False, export_yup=True, export_apply=False,
                              export_image_format='JPEG', export_jpeg_quality=82, export_materials='EXPORT')


def main():
    os.makedirs(USCITA, exist_ok=True)
    scelta = [int(sys.argv[sys.argv.index('--') + 1])] if '--' in sys.argv else [v['n'] for v in VARIANTI]
    elenco = []
    percorso_json = os.path.join(USCITA, 'figure.json')
    if os.path.exists(percorso_json) and len(scelta) == 1:
        elenco = [e for e in json.load(open(percorso_json)) if e['n'] not in scelta]
    for n in scelta:
        rig, info = crea(VARIANTI[n])
        esporta(rig, os.path.join(USCITA, info['file']))
        elenco.append(info)
        print('FIGURA', json.dumps(info))
    elenco.sort(key=lambda e: e['n'])
    json.dump(elenco, open(percorso_json, 'w'), indent=1)


if __name__ == '__main__':
    main()
