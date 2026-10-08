# =====================================================================
# CAVALLI, MULI E ASINI per la città.
#
#   blender -b -Y --python animali.py -- [cavallo mulo asino] [tavola]
#
# Parte dal «Rigged Horse» di Lyndon Daniels (CC0, vedi README.md), lo
# porta in metri, gli aggiunge una radice e costruisce le andature: per
# ogni zampa uno zoccolo che sta a terra mentre spinge e avanza in arco
# mentre è sollevato; la cinematica inversa piega spalla, gomito, ginocchio
# e garretto. Le andature si «cuociono» in rotazioni normali e si esportano
# in public/animali/<nome>.glb, con animali.json (velocità di ogni andatura,
# per accordare il passo alla strada percorsa).
#
# Mulo e asino sono lo stesso modello con proporzioni diverse (orecchie,
# testa, taglia) e il mantello ritinto: è un'approssimazione dichiarata.
# I mantelli, il basto e le some sono ipotesi.
# =====================================================================
import bpy, bmesh, os, sys, json, math, random
from mathutils import Vector, Matrix

QUI = os.path.dirname(os.path.abspath(__file__))
SORGENTE = os.path.join(QUI, 'sorgenti', 'opengameart-rigged-horse', 'riggedHorse.blend')
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'animali'))
FPS = 30

# le zampe: (ossa dalla spalla o dall'anca allo zoccolo, catena per l'IK)
ZAMPE = {'AS': (['Bone_L', 'Bone_L.001', 'Bone_L.002'], 2), 'AD': (['Bone_R', 'Bone_R.001', 'Bone_R.002'], 2),
         'PS': (['Bone_R.003', 'Bone_R.004', 'Bone_R.005'], 2), 'PD': (['Bone_L.003', 'Bone_L.004', 'Bone_L.005'], 2)}
# (la prima osso posteriore parte dal centro del bacino: fuori dalla catena,
# o l'IK torcerebbe tutta l'anca)
RADICI = ['Bone', 'Bone_L.003', 'Bone_R.003', 'Bone.003']

# le andature: durata del ciclo (s), velocità (m/s, per un cavallo), quota
# del ciclo in cui lo zoccolo sta a terra, fase di ogni zampa, sollevamento
ANDATURE = {
    'passo':   dict(T=1.15, v=1.55, terra=0.62, fasi={'PS': 0.0, 'AS': 0.25, 'PD': 0.5, 'AD': 0.75}, alza=0.12, sobbalzo=0.02, battiti=2),
    'trotto':  dict(T=0.72, v=3.6, terra=0.45, fasi={'AS': 0.0, 'PD': 0.0, 'AD': 0.5, 'PS': 0.5}, alza=0.2, sobbalzo=0.05, battiti=2),
    'galoppo': dict(T=0.62, v=7.5, terra=0.3, fasi={'PS': 0.0, 'PD': 0.1, 'AS': 0.28, 'AD': 0.4}, alza=0.28, sobbalzo=0.09, battiti=1),
}

# sella: il colore della gualdrappa (lineare, glTF), o None
VARIANTI = {
    'cavallo':  dict(scala=1.0, orecchie=1.0, testa=1.0, mantello=None, basto=False, sella=None),
    'mulo':     dict(scala=0.93, orecchie=1.55, testa=1.08, mantello=('scurisci', 0.62), basto=True, sella=None),
    'asino':    dict(scala=0.72, orecchie=1.85, testa=1.18, mantello=('grigio', 0.0), basto=True, sella=None),
    # cavalli da sella per i cavalieri: un baio con la gualdrappa di robbia,
    # un palafreno grigio chiaro con la gualdrappa di guado (ipotesi)
    'sellato':  dict(scala=1.0, orecchie=1.0, testa=1.0, mantello=None, basto=False, sella=(0.32, 0.05, 0.03)),
    'palafreno': dict(scala=0.97, orecchie=1.0, testa=1.0, mantello=('chiaro', 0.0), basto=False, sella=(0.05, 0.09, 0.25)),
}


def pulisci():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in (bpy.data.meshes, bpy.data.armatures, bpy.data.actions, bpy.data.materials, bpy.data.images):
        for x in list(c): c.remove(x)


def carica():
    with bpy.data.libraries.load(SORGENTE, link=False) as (src, dst):
        dst.objects = ['Plane', 'Armature', 'BezierCurve', 'BezierCurve.005', 'Sphere', 'Sphere.002']
        # le immagini (incluse nel file) servono ai materiali rifatti con i nodi
        dst.images = ['HorseMain4k00.png', 'HorseMain4k00AO00.png', 'HorseMain4k00Norm00.p', 'Hair12Main2k.png', 'eye_texture.bmp.001']
    corpo, arm, criniera, coda, o1, o2 = dst.objects
    for o in dst.objects: bpy.context.scene.collection.objects.link(o)
    # nel file lo scheletro non è a riposo: criniera, coda e occhi sono
    # modellati sul corpo in posa. La posa del file diventa quella di riposo.
    mod = next(m for m in corpo.modifiers if m.type == 'ARMATURE')
    bpy.context.view_layer.objects.active = corpo
    with bpy.context.temp_override(object=corpo): bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    # tutto nello spazio del mondo, senza genitori
    for o in (corpo, criniera, coda, o1, o2):
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = Matrix(); o.data.transform(mw)
    # le parti rigide seguono un osso: criniera il collo, coda la coda, occhi la testa
    for o, osso in ((criniera, 'Bone.001'), (coda, 'Bone.004'), (o1, 'Bone.002'), (o2, 'Bone.002')):
        g = o.vertex_groups.new(name=osso); g.add(range(len(o.data.vertices)), 1.0, 'REPLACE')
    return corpo, arm, [criniera, coda, o1, o2]


def in_metri(corpo, arm, parti, scala):
    """Un cavallo da sella: circa 1,45 m al garrese. Zoccoli a terra, il
    corpo centrato sull'origine, la testa verso -Y (in glTF: +Z, il verso
    in cui cammina la città)."""
    zmin = min(v.co.z for v in corpo.data.vertices)
    # il centro sta a metà fra gli zoccoli anteriori e posteriori
    yz = [(arm.matrix_world @ arm.data.bones[o[-1]].tail_local).y for o, _ in ZAMPE.values()]
    s = 0.175 * scala
    T = Matrix.Scale(s, 4) @ Matrix.Translation((0, -(min(yz) + max(yz)) / 2, -zmin))
    for o in [corpo] + parti: o.data.transform(T)
    arm.matrix_world = T @ arm.matrix_world
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return s


def proporzioni(corpo, parti, arm, v):
    """Orecchie e testa più grandi per mulo e asino: si mettono in posa le
    ossa scalate e la posa diventa quella di riposo."""
    if v['orecchie'] == 1 and v['testa'] == 1: return
    pb = arm.pose.bones
    pb['Bone.002'].scale = (v['testa'],) * 3
    for o in ('Bone.001_L', 'Bone.001_R'): pb[o].scale = (1.0, v['orecchie'], 1.0)
    bpy.context.view_layer.update()
    for o in [corpo] + parti:
        mod = next((m for m in o.modifiers if m.type == 'ARMATURE'), None)
        if mod is None: mod = o.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
        bpy.context.view_layer.objects.active = o
        with bpy.context.temp_override(object=o): bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')


def unisci(corpo, parti, arm):
    for o in parti:
        for m in list(o.modifiers): o.modifiers.remove(m)
    bpy.ops.object.select_all(action='DESELECT')
    for o in [corpo] + parti: o.select_set(True)
    bpy.context.view_layer.objects.active = corpo
    bpy.ops.object.join()
    for m in list(corpo.modifiers): corpo.modifiers.remove(m)
    mod = corpo.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
    corpo.parent = arm
    return corpo


def basto(corpo, arm):
    """Il basto di legno con due some di tela, legato al dorso (ipotesi)."""
    ossa = arm.data.bones
    a = ossa['Bone'].head_local; b = ossa['Bone'].tail_local
    c = (a + b) / 2
    vs = [v.co for v in corpo.data.vertices if abs(v.co.y - c.y) < 0.12 and abs(v.co.x) < 0.12]
    zd = max(v.z for v in vs) if vs else c.z + 0.2
    larg = max(abs(v.co.x) for v in corpo.data.vertices if abs(v.co.y - c.y) < 0.15 and zd - 0.5 < v.co.z < zd - 0.15)
    b_ = bmesh.new()
    def scatola(x0, x1, y0, y1, z0, z1):
        vv = [b_.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
        bmesh.ops.convex_hull(b_, input=vv)
    mats = []
    # gli arcioni del basto e le stecche
    for dy in (-0.22, 0.22):
        scatola(-larg - 0.06, larg + 0.06, c.y + dy - 0.035, c.y + dy + 0.035, zd - 0.05, zd + 0.16)
    scatola(-0.2, 0.2, c.y - 0.28, c.y + 0.28, zd - 0.02, zd + 0.04)
    n_legno = len(b_.faces)
    # le some: sacchi pendenti sui due fianchi
    for sx in (-1, 1):
        pts = []
        for i in range(10):
            a_ = 2 * math.pi * i / 10
            for dz, r in ((0.05, 0.15), (-0.25, 0.2), (-0.5, 0.16)):
                pts.append((sx * (larg + 0.16 + r * 0.6 * math.cos(a_)), c.y + r * 1.25 * math.sin(a_), zd + dz))
        bmesh.ops.convex_hull(b_, input=[b_.verts.new(p) for p in pts])
    me = bpy.data.meshes.new('basto'); b_.to_mesh(me); b_.free()
    # colori lineari (glTF): tela di canapa grezza e legno scuro
    for nome, col in (('legno_basto', (0.12, 0.07, 0.035)), ('tela_soma', (0.3, 0.24, 0.15))):
        m = bpy.data.materials.new(nome); m.use_nodes = True
        bsdf = m.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = col + (1,); bsdf.inputs['Roughness'].default_value = 0.9
        me.materials.append(m)
    for i, p in enumerate(me.polygons):
        p.material_index = 0 if i < n_legno else 1
        p.use_smooth = i >= n_legno                       # le some sono di tela: morbide
    ob = bpy.data.objects.new('basto', me); bpy.context.scene.collection.objects.link(ob)
    g = ob.vertex_groups.new(name='Bone'); g.add(range(len(me.vertices)), 1.0, 'REPLACE')
    ob.data.uv_layers.new(name=corpo.data.uv_layers.active.name)
    return ob


def sella(corpo, arm, panno):
    """La sella da cavaliere: gualdrappa di panno, seduta di cuoio con gli
    arcioni alti davanti e dietro, staffili e staffe di ferro, legata al
    dorso. La forma segue le selle del Duecento nella pittura e nella
    scultura: è un'ipotesi."""
    ossa = arm.data.bones
    a = ossa['Bone'].head_local; b = ossa['Bone'].tail_local
    c = a.lerp(b, 0.6)                                     # un poco verso il garrese
    vs = [v.co for v in corpo.data.vertices if abs(v.co.y - c.y) < 0.12 and abs(v.co.x) < 0.12]
    zd = max(v.z for v in vs) if vs else c.z + 0.2
    larg = max(abs(v.co.x) for v in corpo.data.vertices if abs(v.co.y - c.y) < 0.15 and zd - 0.5 < v.co.z < zd - 0.15)
    b_ = bmesh.new()
    gruppi = []                                           # facce per materiale
    def solido(pts, mat):
        prima = len(b_.faces)
        bmesh.ops.convex_hull(b_, input=[b_.verts.new(p) for p in pts])
        gruppi.append((prima, len(b_.faces), mat))
    y0 = c.y
    # la gualdrappa che ricade sui fianchi (un guscio sopra il dorso)
    prof = [(0.0, zd + 0.012), (0.16, zd - 0.01), (larg * 0.8, zd - 0.12), (larg + 0.03, zd - 0.24), (larg + 0.03, zd - 0.36)]
    for sx in (-1, 1):
        for i in range(len(prof) - 1):
            (x0, z0), (x1, z1) = prof[i], prof[i + 1]
            solido([(sx * x, y, z + dz) for x, z in ((x0, z0), (x1, z1)) for y in (y0 - 0.42, y0 + 0.44) for dz in (0.0, 0.012)], 2)
    # la seduta e gli arcioni
    solido([(sx * 0.17, y, z) for sx in (-1, 1) for y in (y0 - 0.24, y0 + 0.24) for z in (zd + 0.01, zd + 0.08)], 0)
    # l'arcione davanti: un arco basso sul garrese
    arco = [(0.13 * math.cos(t), zd + 0.06 + 0.13 * math.sin(t)) for t in [math.pi * i / 8 for i in range(9)]]
    solido([(x, y, z) for x, z in arco for y in (y0 - 0.27, y0 - 0.22)], 0)
    # l'arcione dietro: un appoggio curvo che avvolge la seduta
    curva = [(0.19 * math.sin(t), y0 + 0.2 + 0.08 * math.cos(t)) for t in [math.pi * (i / 8 - 0.5) for i in range(9)]]
    solido([(x, y, z) for x, y in curva for z in (zd + 0.06, zd + 0.27)] + [(x, y + 0.04, zd + 0.06) for x, y in curva], 0)
    # staffili e staffe
    for sx in (-1, 1):
        x = sx * (larg + 0.05)
        solido([(x + dx, y0 - 0.05 + dy, z) for dx in (-0.006, 0.006) for dy in (-0.02, 0.02) for z in (zd - 0.05, zd - 0.58)], 0)
        staffa = [(x + sx * 0.0 + dx, y0 - 0.05 + 0.07 * math.cos(t), zd - 0.58 - 0.09 * (1 - abs(math.sin(t)))) for t in [math.pi * i / 6 for i in range(13)] for dx in (-0.02, 0.02)]
        solido(staffa, 1)
    me = bpy.data.meshes.new('sella'); b_.to_mesh(me); b_.free()
    for nome, col, r in (('cuoio', (0.09, 0.045, 0.02), 0.6), ('ferro_staffe', (0.03, 0.03, 0.03), 0.4), ('gualdrappa', panno, 0.85)):
        m = bpy.data.materials.new(nome); m.use_nodes = True
        bsdf = m.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = col + (1,); bsdf.inputs['Roughness'].default_value = r
        if nome == 'ferro_staffe': bsdf.inputs['Metallic'].default_value = 0.8
        me.materials.append(m)
    for (i0, i1, mat) in gruppi:
        for i in range(i0, i1):
            if i < len(me.polygons): me.polygons[i].material_index = mat
    ob = bpy.data.objects.new('sella', me); bpy.context.scene.collection.objects.link(ob)
    g = ob.vertex_groups.new(name='Bone'); g.add(range(len(me.vertices)), 1.0, 'REPLACE')
    ob.data.uv_layers.new(name=corpo.data.uv_layers.active.name)
    return ob


def materiali(corpo, regola, nome):
    """I materiali del file vengono da Blender 2.6, senza nodi: il glTF non li
    leggerebbe. Si rifanno con i nodi dalle immagini incluse nel file: il
    mantello con l'ombreggiatura (AO) già moltiplicata, il rilievo, la
    criniera con la sua trasparenza, gli occhi. Per il mulo il mantello si
    scurisce, per l'asino diventa grigio topo."""
    import numpy as np
    I = bpy.data.images
    diff, ao, nor = I['HorseMain4k00.png'], I['HorseMain4k00AO00.png'], I['HorseMain4k00Norm00.p']
    crine, occhio = I['Hair12Main2k.png'], I['eye_texture.bmp.001']
    w, h = diff.size
    px = np.array(diff.pixels[:], dtype=np.float32).reshape(-1, 4)
    occl = np.array(ao.pixels[:], dtype=np.float32).reshape(-1, 4)[:, 0:1]
    px[:, :3] *= 0.55 + 0.45 * occl
    if regola and regola[0] == 'scurisci':
        px[:, :3] *= regola[1]
    elif regola and regola[0] == 'chiaro':
        # grigio chiaro pomellato: il mantello schiarito, con le macchie della foto
        lum = px[:, :3] @ np.array([0.3, 0.59, 0.11], dtype=np.float32)
        g = np.clip(lum * 1.25 + 0.42, 0, 1)
        px[:, 0], px[:, 1], px[:, 2] = g * 0.97, g * 0.96, g * 0.93
    elif regola:
        lum = px[:, :3] @ np.array([0.3, 0.59, 0.11], dtype=np.float32)
        g = np.clip(lum * 1.5 + 0.13, 0, 1)
        px[:, 0], px[:, 1], px[:, 2] = g, g * 0.96, g * 0.9
    col = I.new(f'mantello-{nome}', w, h)
    col.pixels[:] = px.ravel(); col.pack()
    col.file_format = 'JPEG'
    # i crini: scuri per il mulo, grigio scuro per l'asino
    if regola:
        cw, ch = crine.size
        cp = np.array(crine.pixels[:], dtype=np.float32).reshape(-1, 4)
        lum_c = cp[:, :3] @ np.array([0.3, 0.59, 0.11], dtype=np.float32)
        if regola[0] == 'scurisci': cp[:, :3] *= 0.45
        else: cp[:, 0], cp[:, 1], cp[:, 2] = lum_c * 0.8, lum_c * 0.77, lum_c * 0.72
        nuovo_crine = I.new(f'crine-{nome}', cw, ch, alpha=True)
        nuovo_crine.pixels[:] = cp.ravel(); nuovo_crine.pack()
        crine = nuovo_crine
    nor.colorspace_settings.name = 'Non-Color'
    nor.file_format = 'JPEG'

    def nuovo(nome_m, immagine, normale=None, alfa=False, ruvido=0.8):
        m = bpy.data.materials.new(nome_m); m.use_nodes = True
        nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = immagine
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        if alfa:
            nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha'])
        if normale:
            tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = normale
            nm = nt.nodes.new('ShaderNodeNormalMap')
            nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
            nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
        bsdf.inputs['Roughness'].default_value = ruvido
        return m
    nuovi = {'Material': nuovo('pelo', col, nor), 'Material.003': nuovo('crine', crine, alfa=True, ruvido=0.7),
             'Eye_brown': nuovo('occhio', occhio, ruvido=0.2)}
    for i, m in enumerate(corpo.data.materials):
        if m and m.name in nuovi: corpo.data.materials[i] = nuovi[m.name]


def prepara_rig(arm):
    """Radice (per il sobbalzo del corpo) e un bersaglio per ogni zoccolo."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    r = eb.new('radice'); r.head = (0, 0, 0); r.tail = (0, 0.3, 0); r.use_deform = True
    for n in RADICI: eb[n].use_connect = False; eb[n].parent = r
    zoccoli = {}
    for z, (ossa, _) in ZAMPE.items():
        piede = eb[ossa[-1]].tail.copy()
        t = eb.new('meta_' + z); t.head = piede; t.tail = piede + Vector((0, 0.15, 0)); t.use_deform = False
        zoccoli[z] = piede.copy()
    bpy.ops.object.mode_set(mode='POSE')
    for z, (ossa, catena) in ZAMPE.items():
        c = arm.pose.bones[ossa[-1]].constraints.new('IK')
        c.target = arm; c.subtarget = 'meta_' + z; c.chain_count = catena; c.use_tail = True
    bpy.ops.object.mode_set(mode='OBJECT')
    return zoccoli


def chiave(pb, attr, valore, f):
    setattr(pb, attr, valore); pb.keyframe_insert(attr, frame=f)


def andatura(arm, zoccoli, nome, A, scala):
    """Chiavi dei bersagli degli zoccoli, della radice, del collo e della coda."""
    T = A['T']; v = A['v'] * scala; n = round(T * FPS)
    act = bpy.data.actions.new('_' + nome)
    arm.animation_data_create(); arm.animation_data.action = act
    pb = arm.pose.bones
    for p in pb: p.rotation_mode = 'XYZ'
    for f in range(n + 1):
        u = f / n
        for z, fase in A['fasi'].items():
            q = (u - fase) % 1.0
            L = v * A['terra'] * T                              # lo zoccolo arretra di L mentre è a terra
            if q < A['terra']:
                y = -L / 2 + L * q / A['terra']; dz = 0.0
            else:
                w = (q - A['terra']) / (1 - A['terra'])
                s_ = 0.5 - 0.5 * math.cos(math.pi * w)
                y = L / 2 - L * s_; dz = A['alza'] * scala * math.sin(math.pi * w) ** 0.8
            chiave(pb['meta_' + z], 'location', Vector((0, y, dz)), f)
        fb = A['battiti']
        chiave(pb['radice'], 'location', Vector((0, 0, -A['sobbalzo'] * scala * (0.5 + 0.5 * math.cos(2 * math.pi * fb * u)))), f)
        chiave(pb['radice'], 'rotation_euler', Vector((0.04 * math.sin(2 * math.pi * u) if fb == 1 else 0.0, 0, 0)), f)
        chiave(pb['Bone.001'], 'rotation_euler', Vector((0.07 * math.sin(2 * math.pi * fb * u + 0.6), 0, 0)), f)
        chiave(pb['Bone.003'], 'rotation_euler', Vector((0.15 + 0.05 * math.sin(2 * math.pi * u), 0.08 * math.sin(2 * math.pi * u), 0)), f)
    return act, n


def fermo(arm, zoccoli):
    """In piedi: il peso che si sposta, la testa, le orecchie, la coda."""
    n = 4 * FPS
    act = bpy.data.actions.new('_fermo')
    arm.animation_data_create(); arm.animation_data.action = act
    pb = arm.pose.bones
    for p in pb: p.rotation_mode = 'XYZ'
    for f in range(0, n + 1, 3):
        u = f / n
        for z in ZAMPE: chiave(pb['meta_' + z], 'location', Vector((0, 0, 0)), f)
        chiave(pb['radice'], 'location', Vector((0.015 * math.sin(2 * math.pi * u), 0, 0.006 * math.sin(4 * math.pi * u))), f)
        chiave(pb['Bone.001'], 'rotation_euler', Vector((0.05 + 0.06 * math.sin(2 * math.pi * u), 0.08 * math.sin(2 * math.pi * u + 1), 0)), f)
        chiave(pb['Bone.003'], 'rotation_euler', Vector((0.12, 0.25 * math.sin(4 * math.pi * u) * math.sin(math.pi * u), 0)), f)
        for o, k in (('Bone.001_L', 1), ('Bone.001_R', -1)):
            chiave(pb[o], 'rotation_euler', Vector((0.2 * max(0, math.sin(6 * math.pi * u + k)), 0, 0)), f)
    return act, n


def cuoci(arm, act, n, nome):
    """Dalle chiavi dei bersagli alle rotazioni di tutte le ossa."""
    arm.animation_data.action = act
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = 0, n
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.nla.bake(frame_start=0, frame_end=n, only_selected=False, visual_keying=True,
                     clear_constraints=False, use_current_action=False, bake_types={'POSE'})
    cotta = arm.animation_data.action
    cotta.name = nome
    cotta.use_fake_user = True
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.data.actions.remove(act)
    return cotta


def riduci_immagini(corpo):
    """Texture leggere: il mantello e il rilievo a 1024 in JPEG, i crini a
    512 in PNG (hanno la trasparenza), gli occhi a 128."""
    misure = {'pelo': (1024, 'JPEG'), 'crine': (512, 'PNG'), 'occhio': (128, 'JPEG')}
    for m in corpo.data.materials:
        if not m or m.name not in misure or not m.use_nodes: continue
        lato, formato = misure[m.name]
        for nd in m.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image and nd.image.size[0] > 0:
                img = nd.image.copy()
                if img.size[0] > lato: img.scale(lato, lato)
                img.file_format = formato
                img.pack()
                nd.image = img


def costruisci(nome):
    v = VARIANTI[nome]
    pulisci()
    corpo, arm, parti = carica()
    s = in_metri(corpo, arm, parti, v['scala'])
    proporzioni(corpo, parti, arm, v)
    if v['basto']: parti = parti + [basto(corpo, arm)]
    if v['sella']: parti = parti + [sella(corpo, arm, v['sella'])]
    corpo = unisci(corpo, parti, arm)
    materiali(corpo, v['mantello'], nome)
    riduci_immagini(corpo)
    zoccoli = prepara_rig(arm)
    info = {}
    act, n = fermo(arm, zoccoli); cuoci(arm, act, n, 'fermo'); info['fermo'] = {'velocita': 0}
    for nome_a, A in ANDATURE.items():
        if nome in ('mulo', 'asino') and nome_a == 'galoppo': continue
        act, n = andatura(arm, zoccoli, nome_a, A, v['scala'])
        cuoci(arm, act, n, nome_a)
        info[nome_a] = {'velocita': round(A['v'] * v['scala'], 3), 'durata': A['T']}
    vs = [corpo.matrix_world @ vv.co for vv in corpo.data.vertices]
    info['_misure'] = {'altezza': round(max(p.z for p in vs), 3), 'lunghezza': round(max(p.y for p in vs) - min(p.y for p in vs), 3)}
    arm.name = nome
    arm.animation_data.action = bpy.data.actions['fermo']
    return arm, corpo, info


def esporta(arm, corpo, nome):
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True); corpo.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
                              export_frame_range=False, export_anim_single_armature=True, export_yup=True,
                              export_def_bones=True, export_image_format='JPEG', export_jpeg_quality=82)


def tavola(arm, corpo, nome, andatura_='passo'):
    """Quattro fotogrammi di un'andatura, di fianco: per controllarla."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x, sc.render.resolution_y = 900, 600
    arm.animation_data.action = bpy.data.actions[andatura_]
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 3.4
    cam.location = (6, 0, 0.9); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    n = int(bpy.data.actions[andatura_].frame_range[1])
    for k in range(4):
        sc.frame_set(round(n * k / 4))
        sc.render.filepath = os.path.abspath(os.path.join(QUI, '..', '..', '.catture', f'animale-{nome}-{andatura_}-{k}.png'))
        bpy.ops.render.render(write_still=True)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    nomi = [a for a in args if a in VARIANTI] or list(VARIANTI)
    tutte = {}
    f = os.path.join(USCITA, 'animali.json')
    if os.path.exists(f): tutte = json.load(open(f))
    for nome in nomi:
        arm, corpo, info = costruisci(nome)
        esporta(arm, corpo, nome)
        tutte[nome] = info
        print('ANIMALE', nome, json.dumps(info))
        if 'tavola' in args:
            for a in ('passo', 'trotto'): tavola(arm, corpo, nome, a)
    os.makedirs(USCITA, exist_ok=True)
    json.dump(tutte, open(f, 'w'), indent=1, sort_keys=True)
    print('FATTO', nomi)
