# =====================================================================
# I MONUMENTI DEL CAPO DEL PONTE, modellati in Blender.
#
#   blender -b -Y --python monumenti.py -- [nomi...] [tavola]
#
# nomi: amidei, marte, ponte, chiesa, porta (senza nomi: tutti). Scrive
# ../../public/monumenti/<nome>.glb. Le misure che devono combaciare con
# la città (asse del ponte, impronta della torre, posto di Marte) vengono
# da parametri.json, scritto da scripts/parametri-monumenti.mjs.
#
# Convenzioni: quelle del kit edilizio (strumenti/kit/kit.py). 1 unità =
# 1 metro; la facciata sta sul piano y = 0 e guarda verso +Y (la strada),
# l'interno è verso -Y; esportato in glTF, +Y diventa -Z come nel cantiere
# three.js. I materiali hanno i nomi della città (conci, lastre, marmo…).
#
# Le fonti di ogni monumento e i livelli di certezza sono in FONTI.md.
# =====================================================================
import bpy, bmesh, os, sys, json, math, random
from mathutils import Vector, Matrix

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, '..', 'kit'))
import kit as K                     # Pezzo, blocco, conci, ghiere, ante, materiali
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'monumenti'))
PAR = json.load(open(os.path.join(QUI, 'parametri.json')))
CAVALLO = os.path.join(QUI, '..', 'animali', 'sorgenti', 'opengameart-rigged-horse', 'riggedHorse.blend')
R = random.Random(1216)

def prepara():
    """Scena vuota; i materiali in più rispetto al kit."""
    K.pulisci()
    K.MATERIALI.clear()
    for nome, col in {'marmo': (0.85, 0.83, 0.78), 'marmoVerde': (0.18, 0.28, 0.22), 'coppi': (0.62, 0.32, 0.22),
                      'porfido': (0.3, 0.08, 0.08), 'cotto': (0.6, 0.32, 0.22)}.items():
        m = bpy.data.materials.new(nome); m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col + (1,)
        K.MATERIALI[nome] = m


def scala_uv(ob, k, materiale='conci'):
    """Rimpicciolisce i conci della foto: k = 2 dà il filaretto, pietre di
    mezza misura (le coordinate di texture sono in metri)."""
    me = ob.data
    idx = [i for i, m in enumerate(me.materials) if m.name == materiale]
    uv = me.uv_layers.active
    for p in me.polygons:
        if p.material_index in idx:
            for li in p.loop_indices: uv.data[li].uv = (uv.data[li].uv[0] * k, uv.data[li].uv[1] * k)


def muro_con_fori(P, x0, x1, z0, z1, y0, y1, fori, m='conci', seg=24):
    """Muro rettangolare nel piano x-z, spesso da y0 a y1, con fori di forma
    qualsiasi: fori = liste di punti (x, z) in senso antiorario."""
    lastra(P, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], fori, y0, y1, m)


def lastra(P, esterno, fori, y0, y1, m='conci'):
    """Lastra nel piano x-z con un contorno qualsiasi e dei fori."""
    from mathutils.geometry import tessellate_polygon
    anelli = [esterno] + fori
    tris = tessellate_polygon([[Vector((x, z, 0)) for x, z in a] for a in anelli])
    punti = [p for a in anelli for p in a]
    b = bmesh.new()
    fr = [b.verts.new((x, y1, z)) for x, z in punti]
    rt = [b.verts.new((x, y0, z)) for x, z in punti]
    for t in tris:
        try: b.faces.new([fr[t[0]], fr[t[1]], fr[t[2]]])
        except ValueError: pass
        try: b.faces.new([rt[t[2]], rt[t[1]], rt[t[0]]])
        except ValueError: pass
    o = 0
    for a in anelli:
        n = len(a)
        for i in range(n):
            j = (i + 1) % n
            try: b.faces.new([fr[o + i], rt[o + i], rt[o + j], fr[o + j]])
            except ValueError: pass
        o += n
    bmesh.ops.recalc_face_normals(b, faces=b.faces)
    P._unisci(b, m)


def freccia_acuto(w):
    """Altezza dell'arco acuto di arco_punti sopra l'imposta."""
    R_, r = w * 0.85, w / 2
    return math.sqrt(R_ * R_ - (R_ - r) ** 2)


def arco_punti(cx, z_imp, w, tipo='tondo', freccia=None, n=16):
    """Contorno (antiorario) di un foro largo w con l'arco sopra l'imposta:
    tondo, acuto (due centri) o ribassato (freccia data)."""
    r = w / 2
    pts = [(cx - r, 0.0), (cx + r, 0.0)]
    if tipo == 'tondo':
        pts += [(cx + r * math.cos(a), z_imp + r * math.sin(a)) for a in [math.pi * i / n for i in range(n + 1)]]
    elif tipo == 'acuto':
        # due archi di raggio R_ con i centri dentro la luce: la metà destra
        # ha il centro a sinistra (cL) e viceversa
        R_ = w * 0.85
        cL, cR = cx + r - R_, cx - r + R_
        top = math.sqrt(max(R_ * R_ - (R_ - r) ** 2, 0))
        aR = math.atan2(top, cx - cL)
        pts += [(cL + R_ * math.cos(a), z_imp + R_ * math.sin(a)) for a in [aR * i / (n // 2) for i in range(n // 2 + 1)]]
        aL = math.pi - math.atan2(top, cR - cx)
        pts += [(cR + R_ * math.cos(a), z_imp + R_ * math.sin(a)) for a in [aL + (math.pi - aL) * i / (n // 2) for i in range(1, n // 2 + 1)]]
    else:                                                   # ribassato
        f = freccia or w * 0.18
        Rr = (r * r + f * f) / (2 * f)
        zc = z_imp + f - Rr
        a0 = math.asin(r / Rr)
        pts += [(cx + Rr * math.sin(a), zc + Rr * math.cos(a)) for a in [a0 - 2 * a0 * i / n for i in range(n + 1)]]
    # la base va da sinistra a destra, poi l'arco da destra a sinistra;
    # via i doppioni consecutivi
    pul = []
    for p in pts:
        if not pul or (abs(p[0] - pul[-1][0]) > 1e-4 or abs(p[1] - pul[-1][1]) > 1e-4): pul.append(p)
    if abs(pul[0][0] - pul[-1][0]) < 1e-4 and abs(pul[0][1] - pul[-1][1]) < 1e-4: pul.pop()
    return pul


def conci_arco(P, contorno_arco, spessore, y0, y1, m='conci', ogni=1):
    """Conci radiali lungo una spezzata d'arco (dall'imposta destra alla
    sinistra), spessi «spessore» verso l'esterno."""
    pts = contorno_arco
    cx = (pts[0][0] + pts[-1][0]) / 2
    for i in range(0, len(pts) - 1, ogni):
        a, b = pts[i], pts[min(i + ogni, len(pts) - 1)]
        def fuori(p, s):
            # normale verso l'esterno dell'arco: dal punto medio della corda di base
            dx, dz = p[0] - cx, p[1] - min(pts[0][1], pts[-1][1]) + 0.3
            l = math.hypot(dx, dz) or 1
            return (p[0] + dx / l * s, p[1] + dz / l * s)
        ext = spessore * R.uniform(0.92, 1.1)
        a2, b2 = fuori(a, ext), fuori(b, ext)
        q = []
        for (x, z) in (a, b, b2, a2):
            for y in (y0, y1): q.append((x, y, z))
        P.solido(q, m, 0.008)


def tetto_padiglione(P, x0, x1, y0, y1, z, h, gronda=0.5, m='coppi'):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    pts = [(x0 - gronda, y0 - gronda, z), (x1 + gronda, y0 - gronda, z), (x1 + gronda, y1 + gronda, z), (x0 - gronda, y1 + gronda, z),
           (cx - 0.01, cy, z + h), (cx + 0.01, cy, z + h)]
    P.solido(pts, m, 0)


# ============================================================ amidei
def amidei():
    """La torre degli Amidei (oggi via Por Santa Maria 9r–11r).
    Documentato: filaretto di pietraforte, due porte al piano terra con
    doppia ghiera (arco ribassato sotto, acuto sopra), due protomi di leone
    in marmo bianco sopra le porte, finestre a tutto sesto, buche pontaie
    con mensole. Ipotesi: l'altezza nel 1216 (fu abbassata nel Duecento),
    i merli, i beccatelli del ballatoio."""
    A = PAR['amidei']
    W, D, H, t = A['W'], A['D'], 36.0, 1.3
    P = K.Pezzo('amidei')
    # --- facciata con le due porte
    porte = [W * 0.27, W * 0.73]
    wp, zp = 1.7, 2.9                                       # larghezza e imposta dell'arco ribassato
    fori = []
    for cx in porte:
        fori.append(arco_punti(cx, zp, wp, 'ribassato', freccia=0.32, n=12))
    # finestre a tutto sesto, una per piano, alternate
    piani = [7.2, 11.4, 15.6, 19.8, 24.0, 28.2]
    fin = []
    for k, z in enumerate(piani):
        xs = [W / 2] if k % 2 else [W * 0.3, W * 0.7]
        for x in xs: fin.append((x, z))
    for x, z in fin:
        fori.append([(px, pz + z) for px, pz in arco_punti(x, 1.15, 0.75, 'tondo', n=10)])
    muro_con_fori(P, 0, W, -1.5, H, -t, 0, fori)
    # le porte: stipiti e doppia ghiera
    for cx in porte:
        rib = arco_punti(cx, zp, wp, 'ribassato', freccia=0.32, n=12)[2:]
        conci_arco(P, rib, 0.34, -t, 0.04)
        for lato in (-1, 1):                                # stipiti a conci
            z = 0
            while z < zp - 0.05:
                hb = min(zp - z, R.uniform(0.3, 0.45))
                x_in = cx + lato * (wp / 2 - 0.015)
                P.blocco(min(x_in, x_in + lato * 0.32), max(x_in, x_in + lato * 0.32), z, z + hb - 0.006, -t, 0.04, 'conci')
                z += hb
        # sopra, l'arco acuto di scarico: tra i due archi resta il filaretto
        za = zp + 0.32 + 0.34
        acu = arco_punti(cx, za, wp + 0.9, 'acuto', n=14)[2:]
        conci_arco(P, acu, 0.32, -t, 0.05)
        # battenti di tavole sotto l'arco ribassato
        K.anta(P, cx - wp / 2, cx + wp / 2, 0, zp + 0.25, -0.42, -0.36)
        # soglia
        P.blocco(cx - wp / 2 - 0.3, cx + wp / 2 + 0.3, -0.15, 0.015, -t, 0.3, 'conci', smusso=0.015)
        # protome di leone in marmo bianco, sporgente sopra la porta
        protome(P, cx, za + freccia_acuto(wp + 0.9) + 0.32 * 1.1 + 0.42)
    # davanzali e ghiere delle finestre
    for x, z in fin:
        arco = [(px, pz + z) for px, pz in arco_punti(x, 1.15, 0.75, 'tondo', n=10)][2:]
        conci_arco(P, arco, 0.22, -t, 0.035)
        P.blocco(x - 0.5, x + 0.5, z - 0.1, z + 0.015, -0.35, 0.08, 'conci', smusso=0.012)
        K.anta(P, x - 0.375, x, z, z + 1.5, -0.62, -0.58, arco=(x, z + 1.15, 0.375))
        K.anta(P, x, x + 0.375, z, z + 1.5, -0.62, -0.58, arco=(x, z + 1.15, 0.375))
    # buche pontaie con la mensolina sotto, in file
    for z in (9.6, 13.8, 18.0, 22.2, 26.4, 30.6):
        for x in [0.9 + i * (W - 1.8) / 4 for i in range(5)]:
            if any(abs(x - fx) < 0.9 and abs(z - fz - 0.7) < 1.4 for fx, fz in fin): continue
            P.blocco(x - 0.14, x + 0.14, z, z + 0.26, -0.3, 0.002, 'scuro', smusso=0)
            P.blocco(x - 0.16, x + 0.16, z - 0.14, z, -0.2, 0.18, 'conci', smusso=0.01)
    # beccatelli del ballatoio (ipotesi): fila di mensoloni al quarto piano
    for x in [0.5 + i * (W - 1.0) / 6 for i in range(7)]:
        for k, (zz, sp) in enumerate(((18.95, 0.55), (19.2, 0.38))):
            P.blocco(x - 0.2, x + 0.2, zz, zz + 0.25, -0.4, sp, 'conci', smusso=0.012)
    # fianchi e retro: filaretto con poche aperture
    # i fianchi stanno tra facciata e retro, così gli spigoli non hanno facce doppie
    for lato in range(3):
        P2 = K.Pezzo('_')
        larg = D - 2 * t if lato != 1 else W
        fori_l = [[(px, pz + z) for px, pz in arco_punti(larg / 2, 1.0, 0.6, 'tondo', n=8)] for z in (10.5, 18.9, 27.3)]
        muro_con_fori(P2, 0, larg, -1.5, H, -t, 0, fori_l)
        b = bmesh.new()
        for m, bb in P2.bm.items():
            me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free()
            mat = {0: Matrix.Translation((W, -t, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'),
                   1: Matrix.Translation((W, -D, 0)) @ Matrix.Rotation(math.pi, 4, 'Z'),
                   2: Matrix.Translation((0, -D + t, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z')}[lato]
            me.transform(mat)
            P._bm(m).from_mesh(me)
            bpy.data.meshes.remove(me)
    # il buio dell'interno
    P.blocco(t, W - t, -0.5, H - 0.4, -D + t, -t, 'scuro', smusso=0)
    # coronamento: merli guelfi e tetto basso a padiglione (ipotesi)
    P.blocco(-0.05, W + 0.05, H - 0.35, H, -D - 0.05, 0.05, 'conci', smusso=0.01)
    passo = 1.15
    # merli: davanti e dietro per tutta la larghezza, sui fianchi tra i due
    for (x0, y0, x1, y1) in ((0, -0.7, W, 0), (0, -D, W, -D + 0.7), (0, -D + 0.9, 0.7, -0.9), (W - 0.7, -D + 0.9, W, -0.9)):
        lungo = max(x1 - x0, y1 - y0)
        for s in [i * passo for i in range(int(lungo / passo) + 1)]:
            a, b2 = s, min(lungo, s + passo * 0.58)
            if b2 - a < 0.2: continue
            if x1 - x0 >= y1 - y0: P.blocco(x0 + a, x0 + b2, H, H + 1.25, y0, y1, 'conci')
            else: P.blocco(x0, x1, H, H + 1.25, y0 + a, y0 + b2, 'conci')
    tetto_padiglione(P, 0.8, W - 0.8, -D + 0.8, -0.8, H - 0.1, 1.6, gronda=0.1)
    ob = P.crea()
    scala_uv(ob, 2.2)                                       # filaretto: conci piccoli e regolari
    return ob


def protome(P, cx, z):
    """Testa di leone (o di leopardo, per Fantozzi) in marmo bianco, che
    sporge dalla facciata: muso, criniera, orecchie."""
    sfera = lambda c, r, s=(1, 1, 1), n=10: P.solido([(c[0] + r * s[0] * math.cos(a) * math.cos(b), c[1] + r * s[1] * math.sin(b), c[2] + r * s[2] * math.sin(a) * math.cos(b))
                                                     for a in [2 * math.pi * i / n for i in range(n)] for b in [math.pi * (j / 6 - 0.5) for j in range(7)]], 'marmo', 0)
    sfera((cx, 0.12, z), 0.3, (1.0, 0.45, 1.05), 12)        # criniera, schiacciata sul muro
    sfera((cx, 0.3, z - 0.02), 0.17, (1.0, 0.9, 0.95))       # testa
    sfera((cx, 0.44, z - 0.1), 0.09, (1.1, 1.0, 0.8))        # muso
    for s in (-1, 1): sfera((cx + s * 0.13, 0.28, z + 0.15), 0.05, (1, 0.6, 1), 6)  # orecchie


# ============================================================= marte
def marte():
    """La pietra di Marte: un frammento di statua equestre tardoromana
    (Vossilla 1994, da Cinelli) su un pilastro. Il cavallo viene dal modello
    CC0 di Lyndon Daniels, messo in posa da statua e spezzato: senza testa,
    con una zampa rotta; del cavaliere restano gambe e tunica. Tutto ciò che
    è forma è ipotesi."""
    with bpy.data.libraries.load(CAVALLO, link=False) as (src, dst):
        dst.objects = ['Plane', 'Armature']
    corpo, arm = dst.objects
    for o in (corpo, arm): bpy.context.scene.collection.objects.link(o)
    # i vertici da togliere, dai pesi dello scheletro: la testa e le orecchie,
    # lo stinco della zampa che si alza
    gruppi = {g.index: g.name for g in corpo.vertex_groups}
    def pesati(nomi, soglia=0.5):
        return {v.index for v in corpo.data.vertices
                if sum(g.weight for g in v.groups if gruppi.get(g.group) in nomi) > soglia}
    collo = pesati({'Bone.001', 'Bone.002', 'Bone.001_L', 'Bone.001_R'}, 0.3)
    via_zampa = pesati({'Bone_R.002'}, 0.6)
    # posa: zampa anteriore destra alzata, come nelle statue equestri romane
    arm.data.pose_position = 'POSE'
    pb = arm.pose.bones
    for nome, rot in (('Bone_R', (-0.15, 0, 0)), ('Bone_R.001', (-1.0, 0, 0)), ('Bone_R.002', (1.4, 0, 0)), ('Bone.003', (0.3, 0, 0))):
        pb[nome].rotation_mode = 'XYZ'; pb[nome].rotation_euler = rot
    bpy.context.view_layer.update()
    ossa = arm.data.bones
    sella = (arm.matrix_world @ ossa['Bone'].head_local + arm.matrix_world @ ossa['Bone.001'].head_local) / 2
    # il taglio del collo: al 45% fra il garrese e la nuca, di traverso al collo
    garrese, nuca = arm.matrix_world @ ossa['Bone.001'].head_local, arm.matrix_world @ ossa['Bone.001'].tail_local
    taglio = garrese.lerp(nuca, 0.45)
    verso = (nuca - garrese).normalized()
    bpy.context.view_layer.objects.active = corpo
    for mod in corpo.modifiers:
        if mod.type == 'ARMATURE':
            with bpy.context.temp_override(object=corpo): bpy.ops.object.modifier_apply(modifier=mod.name)
    mw = corpo.matrix_world.copy()
    corpo.parent = None
    corpo.matrix_world = Matrix()
    corpo.data.transform(mw)
    bpy.data.objects.remove(arm, do_unlink=True)
    corpo.vertex_groups.clear()
    # in metri, con gli zoccoli a terra e la testa verso +Y (la strada)
    s = 0.19
    me = corpo.data
    T = Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(s, 4)
    me.transform(T)
    zmin = min(v.co.z for v in me.vertices)
    me.transform(Matrix.Translation((0, 0, -zmin)))
    Tm = Matrix.Translation((0, 0, -zmin)) @ T
    sella, taglio = Tm @ sella, Tm @ taglio
    verso = (Tm.to_3x3() @ verso).normalized()
    # le mutilazioni: «pietra scema», dice Dante
    b = bmesh.new(); b.from_mesh(me)
    b.verts.ensure_lookup_table()
    via = {i for i in collo if (b.verts[i].co - taglio).dot(verso) > 0} | via_zampa
    bmesh.ops.delete(b, geom=[b.verts[i] for i in via], context='VERTS')
    # restano attaccati solo i pezzi grandi: via i frammenti sparsi (orecchie)
    visti, isole = set(), []
    for v in b.verts:
        if v in visti: continue
        isola, pila = [], [v]
        visti.add(v)
        while pila:
            u = pila.pop(); isola.append(u)
            for e in u.link_edges:
                w = e.other_vert(u)
                if w not in visti: visti.add(w); pila.append(w)
        isole.append(isola)
    isole.sort(key=len, reverse=True)
    for isola in isole[1:]:
        if len(isola) < 200: bmesh.ops.delete(b, geom=isola, context='VERTS')
    bordo = [e for e in b.edges if e.is_boundary]
    f = bmesh.ops.holes_fill(b, edges=bordo, sides=0)
    for fa in f['faces']:
        for v in fa.verts: v.co += Vector((R.uniform(-1, 1), R.uniform(-1, 1), R.uniform(-1, 1))) * 0.01
    bmesh.ops.triangulate(b, faces=f['faces'])
    b.to_mesh(me); b.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.clear(); me.materials.append(K.mat('marmo'))
    while me.uv_layers: me.uv_layers.remove(me.uv_layers[0])
    K.uv_metri(me)
    corpo.name = 'marte-cavallo'
    # del cavaliere resta un moncone sulla sella, spezzato sopra le anche
    P = K.Pezzo('marte-cavaliere')
    yc = sella.y
    zs = max(v.co.z for v in me.vertices if abs(v.co.y - yc) < 0.1 and abs(v.co.x) < 0.12)   # il dorso
    fianco = max(abs(v.co.x) for v in me.vertices if abs(v.co.y - yc) < 0.12 and zs - 0.55 < v.co.z < zs - 0.1)
    base = [(fianco * 0.95 * math.cos(a), yc + 0.3 * math.sin(a), zs - 0.12) for a in [2 * math.pi * i / 16 for i in range(16)]]
    rotto = [(0.19 * math.cos(a) + R.uniform(-0.03, 0.03), yc - 0.03 + 0.15 * math.sin(a) + R.uniform(-0.03, 0.03), zs + R.uniform(0.14, 0.32))
             for a in [2 * math.pi * i / 11 for i in range(11)]]
    P.solido(base + rotto, 'marmo', 0)
    # le cosce, appena accennate sui fianchi, spezzate sopra il ginocchio
    for sx in (-1, 1):
        P.solido([(sx * (fianco * 0.9 + dx), yc + dy, zs - 0.1 + dz) for dx, dy, dz in
                  ((0, -0.12, 0.05), (0, 0.12, 0.05), (0.09, -0.1, 0.0), (0.09, 0.14, -0.02),
                   (0.06, 0.2, -0.3), (0.13, 0.26, -0.3), (0.05, 0.35, -0.24 + R.uniform(-0.04, 0.04)), (0.12, 0.33, -0.22))], 'marmo', 0)
    cav = P.crea()
    for p in cav.data.polygons: p.use_smooth = True
    # il pilastro: zoccolo, fusto e cimasa
    Q = K.Pezzo('marte-pilastro')
    Q.blocco(-0.95, 0.95, -0.6, 0.45, -0.95, 0.95, 'conci', smusso=0.02)
    Q.blocco(-0.8, 0.8, 0.45, 0.7, -0.8, 0.8, 'conci', smusso=0.02)
    z = 0.7
    while z < 3.05:
        h = min(3.05 - z, R.uniform(0.38, 0.5))
        Q.blocco(-0.66, 0.66, z, z + h - 0.008, -0.66, 0.66, 'conci', smusso=0.012, ruota=R.uniform(-0.006, 0.006))
        z += h
    Q.blocco(-0.82, 0.82, 3.05, 3.25, -0.82, 0.82, 'conci', smusso=0.02)
    Q.blocco(-0.92, 0.92, 3.25, 3.42, -0.92, 0.92, 'lastre', smusso=0.015)
    pil = Q.crea()
    # tutto insieme: la statua sopra il pilastro
    for o in (corpo, cav): o.location.z = 3.42
    bpy.ops.object.select_all(action='DESELECT')
    for o in (corpo, cav, pil): o.select_set(True)
    bpy.context.view_layer.objects.active = pil
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = 'marte'
    return ob


# ============================================================= ponte
def ponte():
    """Il Ponte Vecchio ricostruito dopo il 1177: cinque arcate (le fonti
    divergono: c'è chi ne dice nove), pile con i rostri, conci di
    pietraforte, cornice, parapetti e lastricato. Asse, quote e luci sono
    quelle della città (parametri.json): x lungo l'asse dal capo in città,
    y di traverso (da 0 a −larghezza), z in alto. Tutto ciò che è forma è
    ipotesi."""
    Q = PAR['ponte']; LA = PAR['livello_acqua']
    L, W, s1, s2, n, pila = Q['L'], Q['larghezza'], Q['s1'], Q['s2'], Q['arcate'], Q['pila']
    prof = Q['profilo']
    def quota(x):
        i = max(0, min(len(prof) - 2, int(x)))
        (a, qa), (b, qb) = prof[i], prof[i + 1]
        return qa + (qb - qa) * (x - a) / (b - a)
    luce = (s2 - s1 - (n - 1) * pila) / n
    imposta = LA + 0.6
    fondo = LA - 5
    P = K.Pezzo('ponte')
    # --- il corpo: prospetto laterale con le arcate ribassate, esteso per la larghezza
    archi = []
    for k in range(n):
        x0 = s1 + k * (luce + pila); x1 = x0 + luce; xm = (x0 + x1) / 2
        chiave = quota(xm) - 1.45
        f = chiave - imposta; c = luce / 2
        r = (c * c + f * f) / (2 * f); zc = chiave - r
        a0 = math.asin(min(1, (imposta - zc) / r))
        arco = [(xm + r * math.cos(a), zc + r * math.sin(a)) for a in [a0 + (math.pi - 2 * a0) * i / 24 for i in range(25)]]
        archi.append((x0, x1, xm, zc, r, arco))
    sopra = 0.12                                             # spessore del lastricato
    esterno = [(0, fondo), (L, fondo)] + [(x, quota(x) - sopra) for x in [L - i for i in range(int(L) + 1)] if x > 0] + [(0, quota(0) - sopra)]
    fori = [[(x0, fondo + 0.5), (x1, fondo + 0.5)] + arco[1:-1] + [(x0, imposta)] for (x0, x1, xm, zc, r, arco) in archi]
    # l'arco va dall'imposta destra a quella sinistra: il foro è antiorario
    fori = [[(x0, fondo + 0.5), (x1, fondo + 0.5), (x1, imposta)] + arco[1:-1] + [(x0, imposta)] for (x0, x1, xm, zc, r, arco) in archi]
    lastra(P, esterno, fori, -W, 0)
    # --- i conci delle arcate, su tutte e due le facce
    for (x0, x1, xm, zc, r, arco) in archi:
        a_s = math.atan2(arco[0][1] - zc, arco[0][0] - xm); a_e = math.atan2(arco[-1][1] - zc, arco[-1][0] - xm)
        nc = max(9, round(r * (a_e - a_s) / 0.5))
        for i in range(nc):
            a0_ = a_s + (a_e - a_s) * i / nc + 0.003; a1_ = a_s + (a_e - a_s) * (i + 1) / nc - 0.003
            ext = 0.75 * R.uniform(0.9, 1.12)
            for (ya, yb) in ((-0.6, 0.04), (-W - 0.04, -W + 0.6)):
                q = [(xm + rr * math.cos(a), y, zc + rr * math.sin(a)) for a in (a0_, a1_) for rr in (r - 0.015, r + ext) for y in (ya, yb)]
                P.solido(q, 'conci', 0.01)
    # --- rostri a monte e a valle delle pile, con il cappello
    for k in range(1, n):
        xp = s1 + k * (luce + pila) - pila / 2
        for lato in (1, -1):
            yf = 0 if lato > 0 else -W
            tri = [(xp - pila / 2, yf - lato * 0.3), (xp + pila / 2, yf - lato * 0.3), (xp, yf + lato * pila * 0.9)]
            P.solido([(x, y, z) for x, y in tri for z in (fondo, imposta + 1.6)], 'conci', 0.02)
            P.solido([(x, y, imposta + 1.6) for x, y in tri] + [(xp, yf + lato * 0.2, imposta + 2.5)], 'lastre', 0.01)
    # --- cornice sotto il parapetto, lungo le due facce
    for i in range(int(L)):
        xa, xb = i, min(L, i + 1)
        for (ya, yb) in ((-0.05, 0.12), (-W - 0.12, -W + 0.05)):
            P.solido([(x, y, quota(x) + dz) for x in (xa, xb) for y in (ya, yb) for dz in (-0.62, -0.48)], 'conci', 0)
    # --- parapetti con la copertina, e il lastricato
    for i in range(int(L)):
        xa, xb = i, min(L, i + 1.0) + 0.01
        for (ya, yb) in ((-0.4, 0.0), (-W, -W + 0.4)):
            P.solido([(x, y, quota(x) + dz) for x in (xa, xb) for y in (ya, yb) for dz in (-sopra, 1.0)], 'conci', 0)
            P.solido([(x, y, quota(x) + dz) for x in (xa, xb) for y in (ya - 0.03, yb + 0.03) for dz in (1.0, 1.12)], 'lastre', 0)
        P.solido([(x, y, quota(x) + dz) for x in (xa, xb) for y in (-W + 0.4, -0.4) for dz in (-sopra, 0.0)], 'lastre', 0)
    return P.crea()


# ==================================================== santa maria sopra porta
def chiesa():
    """Santa Maria sopra Porta nel 1216: la chiesa prima della ricostruzione
    della seconda metà del Duecento. Non sappiamo com'era (ipotesi): navata
    unica di pietraforte, facciata a capanna con portale a lunetta bicroma
    (per analogia con Santo Stefano al Ponte, 1233), oculo, campanile a
    vela, archetti pensili, abside semicircolare."""
    Q = PAR['chiesa']
    W, L = Q['W'], Q['L']
    H, t = 9.0, 0.9
    pend = 0.42; hT = W / 2 * pend
    P = K.Pezzo('chiesa')
    # facciata a capanna con portale e oculo
    wp, zi = 1.8, 3.0                                        # portale: luce e imposta dell'arco
    portale = [(W / 2 - wp / 2, 0.0), (W / 2 + wp / 2, 0.0)] + [(W / 2 + wp / 2 * math.cos(a), zi + wp / 2 * math.sin(a)) for a in [math.pi * i / 16 for i in range(17)]]
    oculo = [(W / 2 + 0.6 * math.cos(a), H - 1.4 + 0.6 * math.sin(a)) for a in [2 * math.pi * i / 20 for i in range(20)]]
    lastra(P, [(0, -1.5), (W, -1.5), (W, H), (W / 2, H + hT), (0, H)], [portale, oculo], -t, 0)
    # il portale: stipiti, architrave, lunetta a tarsie bianche e verdi, ghiera
    for lato in (-1, 1):
        z = 0
        while z < zi - 0.5:
            hb = min(zi - 0.5 - z, R.uniform(0.32, 0.45))
            x_in = W / 2 + lato * (wp / 2 - 0.015)
            P.blocco(min(x_in, x_in + lato * 0.36), max(x_in, x_in + lato * 0.36), z, z + hb - 0.006, -t, 0.04, 'conci')
            z += hb
    P.blocco(W / 2 - wp / 2 - 0.1, W / 2 + wp / 2 + 0.1, zi - 0.5, zi, -t, 0.05, 'marmo', smusso=0.01)       # architrave
    lun = [(W / 2 + (wp / 2 - 0.02) * math.cos(a), zi + (wp / 2 - 0.02) * math.sin(a)) for a in [math.pi * i / 16 for i in range(17)]]
    P.solido([(x, y, z) for x, z in lun for y in (-0.12, -0.08)], 'marmo', 0)
    for i in range(6):                                       # i raggi verdi della tarsia
        a = math.pi * (i + 0.5) / 6
        P.solido([(W / 2 + rr * math.cos(a + d), y, zi + rr * math.sin(a + d)) for rr in (0.08, wp / 2 - 0.08) for d in (-0.06, 0.06) for y in (-0.08, -0.065)], 'marmoVerde', 0)
    ghi = [(W / 2 + wp / 2 * math.cos(a), zi + wp / 2 * math.sin(a)) for a in [math.pi * i / 13 for i in range(14)]]
    conci_arco(P, ghi, 0.34, -t, 0.05)
    P.blocco(W / 2 - wp / 2 - 0.4, W / 2 + wp / 2 + 0.4, -0.2, 0.015, -t, 0.5, 'conci', smusso=0.015)             # soglia
    K.anta(P, W / 2 - wp / 2, W / 2, 0, zi - 0.5, -0.55, -0.48)
    K.anta(P, W / 2, W / 2 + wp / 2, 0, zi - 0.5, -0.55, -0.48)
    # l'oculo con l'anello di conci e il buio dietro
    oc = [(W / 2 + 0.6 * math.cos(a), H - 1.4 + 0.6 * math.sin(a)) for a in [2 * math.pi * i / 14 for i in range(15)]]
    conci_arco(P, oc, 0.25, -t, 0.04)
    # cornice del frontone con gli archetti pensili
    def cornice_inclinata(xa, za, xb, zb):
        lung = math.hypot(xb - xa, zb - za); nn = max(2, round(lung / 0.6))
        for i in range(nn):
            u0, u1 = i / nn, (i + 1) / nn
            pa = (xa + (xb - xa) * u0, za + (zb - za) * u0); pb = (xa + (xb - xa) * u1, za + (zb - za) * u1)
            P.solido([(x, y, z + dz) for x, z in (pa, pb) for y in (-0.1, 0.18) for dz in (0.0, 0.18)], 'conci', 0)
            # archetto: un piccolo arco sotto la cornice
            xm, zm = (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2
            P.solido([(xm + 0.22 * math.cos(a) , y, zm - 0.02 + 0.16 * math.sin(a) - 0.05) for a in [math.pi * j / 6 for j in range(7)] for y in (-0.05, 0.07)], 'conci', 0)
    cornice_inclinata(-0.2, H - 0.05, W / 2, H + hT + 0.03)
    cornice_inclinata(W / 2, H + hT + 0.03, W + 0.2, H - 0.05)
    # fianchi con monofore alte e strombate
    for lato in (0, 1):
        x = 0 if lato == 0 else W
        fori_l = [[(px, pz + H - 3.6) for px, pz in arco_punti(sx, 1.4, 0.5, 'tondo', n=8)] for sx in (3.5, 8.5, 13.5) if sx < L - 2]
        P2 = K.Pezzo('_')
        lastra(P2, [(0, -1.5), (L - 2 * t, -1.5), (L - 2 * t, H), (0, H)], [[(px - t, pz) for px, pz in f] for f in fori_l], -t, 0)
        for m, bb in P2.bm.items():
            me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free()
            # la faccia esterna guarda fuori (−x a sinistra, +x a destra), il muro corre verso il fondo
            me.transform(Matrix.Translation((0, -L + t, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z') if lato == 0 else
                         Matrix.Translation((W, -t, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))
            P._bm(m).from_mesh(me); bpy.data.meshes.remove(me)
        # archetti sotto la gronda del fianco
        for k in range(int((L - 1) / 0.6)):
            yy = -0.5 - k * 0.6
            sx = -0.12 if lato == 0 else W + 0.12
            P.solido([(sx + (0.0 if lato == 0 else 0.0) + d, yy - 0.22 * math.cos(a), H - 0.45 + 0.14 * math.sin(a)) for a in [math.pi * j / 6 for j in range(7)] for d in ((0.0, 0.14) if lato == 0 else (-0.14, 0.0))], 'conci', 0)
    # il retro, con l'abside
    rA = min(3.6, W * 0.33)
    P.blocco(0, W, -1.5, H, -L, -L + t, 'conci', smusso=0)
    P.solido([(0, -L + t + 0.01, H), (W, -L + t + 0.01, H), (W / 2, -L + t + 0.01, H + hT), (0, -L, H), (W, -L, H), (W / 2, -L, H + hT)], 'conci', 0)
    seg = 18
    for i in range(seg):
        a0, a1 = math.pi * i / seg, math.pi * (i + 1) / seg
        q = [(W / 2 + rr * math.cos(a), -L - rr * math.sin(a) * 0 - (rr * math.sin(a)), z) for a in (a0, a1) for rr in (rA - 0.8, rA) for z in (-1.5, H * 0.75)]
        P.solido(q, 'conci', 0)
    P.solido([(W / 2 + (rA + 0.35) * math.cos(a), -L - (rA + 0.35) * math.sin(a), H * 0.75) for a in [math.pi * i / 12 for i in range(13)]] +
             [(W / 2, -L + 0.2, H * 0.75 + rA * 0.45), (W / 2 - rA - 0.35, -L + 0.2, H * 0.75), (W / 2 + rA + 0.35, -L + 0.2, H * 0.75)], 'coppi', 0)
    # il tetto a due falde, con la gronda
    for sx in (-1, 1):
        P.solido([(W / 2 + sx * (W / 2 + 0.6), y, H - 0.6 * pend) for y in (0.35, -L - 0.3)] +
                 [(W / 2, y, H + hT + 0.05) for y in (0.35, -L - 0.3)] +
                 [(W / 2 + sx * (W / 2 + 0.6), y, H - 0.6 * pend + 0.14) for y in (0.35, -L - 0.3)], 'coppi', 0)
    # il campanile a vela sopra la facciata, con la campana
    vb = H + hT - 0.4
    lastra(P, [(W / 2 - 1.5, vb), (W / 2 + 1.5, vb), (W / 2 + 1.5, vb + 2.6), (W / 2, vb + 3.3), (W / 2 - 1.5, vb + 2.6)],
           [[(px, pz + vb + 0.5) for px, pz in arco_punti(W / 2, 1.1, 1.0, 'tondo', n=10)]], -0.55, 0.02)
    P.solido([(W / 2 + 0.28 * math.cos(a), -0.27 + 0.28 * math.sin(a), vb + 0.85) for a in [2 * math.pi * i / 10 for i in range(10)]] +
             [(W / 2 + 0.14 * math.cos(a), -0.27 + 0.14 * math.sin(a), vb + 1.35) for a in [2 * math.pi * i / 10 for i in range(10)]], 'ferro', 0)
    # il buio dentro
    P.blocco(t, W - t, -0.5, H - 0.3, -L + t + 0.2, -t - 0.2, 'scuro', smusso=0)
    return P.crea()


# ============================================================= porta
def porta():
    """Una porta della cerchia del 1172–75: torre quadrata con il fornice
    ad arco a tutto sesto, ghiera di conci su tutte e due le facce, battenti
    aperti contro le pareti del passaggio, merli. Vale per Porta Santa
    Maria e per le altre porte: nessuna è sopravvissuta, la forma è
    un'ipotesi (FONTI.md). Misure della città: 9,5 × 7 m, alta 17."""
    W, D, H = 9.5, 7.0, 17.0
    wf, hf = 4.2, 6.8                                         # luce e altezza del fornice
    zi = hf - wf / 2
    P = K.Pezzo('porta')
    fornice = [(px, pz) for px, pz in arco_punti(W / 2, zi, wf, 'tondo', n=20)]
    fin = [(px, pz + 10.2) for px, pz in arco_punti(W / 2, 1.0, 0.7, 'tondo', n=10)]
    # il corpo: il prospetto con il fornice, esteso per tutta la profondità
    lastra(P, [(0, -1.5), (W, -1.5), (W, H), (0, H)], [fornice], -D, 0)
    # una finestra per faccia sopra l'arco, con il buio dietro
    for yf, sg in ((0.0, 1), (-D, -1)):
        P.blocco(W / 2 - 0.36, W / 2 + 0.36, 10.2, 11.55, yf - sg * 0.35, yf + sg * 0.004, 'scuro', smusso=0)
        arco = [(px, pz) for px, pz in fin][2:]
        conci_arco(P, arco, 0.22, yf - sg * 0.4 if sg > 0 else yf - 0.04, yf + 0.04 if sg > 0 else yf + 0.4)
        P.blocco(W / 2 - 0.5, W / 2 + 0.5, 10.1, 10.215, yf - 0.3, yf + 0.3, 'conci', smusso=0.01)
    # la ghiera del fornice e gli stipiti, sulle due facce
    for (ya, yb) in ((-0.9, 0.05), (-D - 0.05, -D + 0.9)):
        conci_arco(P, fornice[2:], 0.85, ya, yb)
        for lato in (-1, 1):
            z = 0
            while z < zi - 0.05:
                hb = min(zi - z, R.uniform(0.45, 0.65))
                x_in = W / 2 + lato * (wf / 2 - 0.015)
                P.blocco(min(x_in, x_in + lato * 0.5), max(x_in, x_in + lato * 0.5), z, z + hb - 0.008, ya, yb, 'conci')
                z += hb
    # i battenti, aperti contro le pareti del passaggio
    for lato in (-1, 1):
        P2 = K.Pezzo('_')
        # costruito già dal suo lato (uno specchio rovescerebbe le facce)
        lb = wf / 2 - 0.1
        K.anta(P2, min(0, lato * lb), max(0, lato * lb), 0, zi + 0.6, -0.08, 0.0)
        for m, bb in P2.bm.items():
            me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free()
            # ruotato di 90° e appoggiato alla parete del fornice, dietro la ghiera
            me.transform(Matrix.Translation((W / 2 + lato * (wf / 2 - 0.02), -1.0, 0)) @ Matrix.Rotation(-lato * math.pi / 2, 4, 'Z'))
            P._bm(m).from_mesh(me); bpy.data.meshes.remove(me)
    # buche pontaie
    for z in (8.4, 13.0):
        for x in [1.0 + i * (W - 2.0) / 5 for i in range(6)]:
            for yf, sg in ((0.0, 1), (-D, -1)):
                P.blocco(x - 0.14, x + 0.14, z, z + 0.26, yf - sg * 0.3 if sg > 0 else yf - 0.002, yf + 0.002 if sg > 0 else yf + 0.3, 'scuro', smusso=0)
    # coronamento: cornice e merli su tutti i lati
    P.blocco(-0.08, W + 0.08, H - 0.4, H, -D - 0.08, 0.08, 'conci', smusso=0.01)
    passo = 1.2
    for (x0, y0, x1, y1) in ((0, -0.7, W, 0), (0, -D, W, -D + 0.7), (0, -D + 0.9, 0.7, -0.9), (W - 0.7, -D + 0.9, W, -0.9)):
        lungo = max(x1 - x0, y1 - y0)
        for s_ in [i * passo for i in range(int(lungo / passo) + 1)]:
            a_, b_ = s_, min(lungo, s_ + passo * 0.6)
            if b_ - a_ < 0.2: continue
            if x1 - x0 >= y1 - y0: P.blocco(x0 + a_, x0 + b_, H, H + 1.3, y0, y1, 'conci')
            else: P.blocco(x0, x1, H, H + 1.3, y0 + a_, y0 + b_, 'conci')
    P.blocco(0.7, W - 0.7, H - 0.2, H + 0.05, -D + 0.7, -0.7, 'lastre', smusso=0)
    ob = P.crea()
    scala_uv(ob, 1.6)
    return ob


def innesta(P, P2, M):
    """Unisce a P le parti di P2, trasformate con la matrice M."""
    for m, bb in P2.bm.items():
        me = bpy.data.meshes.new('t'); bb.to_mesh(me); bb.free()
        me.transform(M)
        P._bm(m).from_mesh(me); bpy.data.meshes.remove(me)
    P2.bm.clear()


def cornice_rettangolo(P, x0, x1, z0, z1, y, larg=0.18, sp=0.06, m='marmoVerde'):
    """Riquadro di listelli (le specchiature verdi dei marmi fiorentini)."""
    P.blocco(x0, x1, z0, z0 + larg, y, y + sp, m, smusso=0)
    P.blocco(x0, x1, z1 - larg, z1, y, y + sp, m, smusso=0)
    P.blocco(x0, x0 + larg, z0 + larg, z1 - larg, y, y + sp, m, smusso=0)
    P.blocco(x1 - larg, x1, z0 + larg, z1 - larg, y, y + sp, m, smusso=0)


def arco_listello(P, cx, zi, r, y, larg=0.18, sp=0.06, m='marmoVerde', n=12):
    for i in range(n):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n
        P.solido([(cx + rr * math.cos(a), yy, zi + rr * math.sin(a)) for a in (a0, a1) for rr in (r - larg, r) for yy in (y, y + sp)], m, 0)


# ======================================================== battistero
def battistero():
    """Il Battistero di San Giovanni come poteva essere nel 1216.
    Documentato (l'edificio c'è ancora): l'ottagono di 34 m sui lati esterni
    (OpenStreetMap), i tre ordini rivestiti di marmo bianco di Carrara e
    verde di Prato, la lanterna (1150, Villani), la scarsella rettangolare,
    le due colonne di porfido donate da Pisa (1115 o 1117) alla porta est,
    l'altezza di circa 39 m. Ipotesi: i battenti di legno (le porte di
    bronzo sono del Tre e Quattrocento), il disegno delle specchiature,
    l'attico già compiuto (la data non è nota). Centro all'origine, lati
    piatti verso ±x e ±y: +x è est, +y è nord."""
    B = PAR['battistero']
    a = B['apotema']
    lato = 2 * a * math.tan(math.pi / 8)
    t = 1.2
    P = K.Pezzo('battistero')
    # zoccolo e gradino
    Rc = a / math.cos(math.pi / 8)
    anello = lambda r, z: [(r * math.cos(math.pi / 8 + k * math.pi / 4), r * math.sin(math.pi / 8 + k * math.pi / 4), z) for k in range(8)]
    P.solido(anello(Rc + 0.55, -1.2) + anello(Rc + 0.55, 0.25), 'marmo', 0.02)
    P.solido(anello(Rc + 0.25, 0.25) + anello(Rc + 0.25, 0.6), 'marmo', 0.02)
    Z1, C1, Z2, C2, Z3, C3 = 0.6, 11.2, 11.8, 20.0, 20.6, 26.0
    porte = {0: 'est', 90: 'nord', 270: 'sud'}
    for k in range(8):
        th = k * 45
        F = K.Pezzo('_')
        h = lato / 2
        wp, hp = 4.6, 7.6                                        # la porta
        fori = []
        if th in porte:
            fori.append([(-wp / 2, Z1), (wp / 2, Z1), (wp / 2, Z1 + hp), (-wp / 2, Z1 + hp)])
        # finestra dell'ordine di mezzo, nella campata centrale (non sopra la scarsella)
        fin = th != 180
        if fin:
            fori.append([(-0.65, 13.6), (0.65, 13.6), (0.65, 16.4), (-0.65, 16.4)])
        lastra(F, [(-h, Z1), (h, Z1), (h, C3), (-h, C3)], fori, -t, 0, 'marmo')
        # primo ordine: tre campate fra lesene verdi, specchiature
        for u in (-2.35, 2.35):
            F.blocco(u - 0.18, u + 0.18, Z1, C1, 0, 0.1, 'marmoVerde', smusso=0)
        for (u0, u1) in ((-h + 0.9, -2.75), (2.75, h - 0.9)):
            cornice_rettangolo(F, u0, u1, Z1 + 0.9, C1 - 0.8, 0)
            cornice_rettangolo(F, u0 + 0.6, u1 - 0.6, Z1 + 1.5, C1 - 1.4, 0, larg=0.1)
        if th in porte:
            # stipiti e architrave di marmo, battenti di legno chiusi
            for sx in (-1, 1):
                F.blocco(sx * wp / 2, sx * (wp / 2 + 0.55), Z1, Z1 + hp, -t, 0.15, 'marmo', smusso=0.015)
            F.blocco(-wp / 2 - 0.55, wp / 2 + 0.55, Z1 + hp, Z1 + hp + 0.7, -t, 0.2, 'marmo', smusso=0.015)
            F.blocco(-wp / 2 - 0.55, wp / 2 + 0.55, Z1 + hp + 0.7, Z1 + hp + 0.85, -t, 0.25, 'marmoVerde', smusso=0)
            K.anta(F, -wp / 2, 0, Z1, Z1 + hp, -0.75, -0.68)
            K.anta(F, 0, wp / 2, Z1, Z1 + hp, -0.75, -0.68)
            F.blocco(-wp / 2, wp / 2, Z1 - 0.01, Z1 + hp, -t + 0.05, -0.8, 'scuro', smusso=0)
            if porte[th] == 'est':
                # le colonne di porfido donate dai Pisani
                for sx in (-1, 1):
                    cx = sx * (wp / 2 + 1.25)
                    F.solido([(cx + 0.42 * math.cos(q), 0.5 + 0.42 * math.sin(q), z) for q in [2 * math.pi * i / 12 for i in range(12)] for z in (Z1, Z1 + 0.45)], 'marmo', 0)
                    F.solido([(cx + 0.33 * math.cos(q), 0.5 + 0.33 * math.sin(q), z) for q in [2 * math.pi * i / 14 for i in range(14)] for z in (Z1 + 0.45, Z1 + 6.6)], 'porfido', 0)
                    F.solido([(cx + 0.45 * math.cos(q), 0.5 + 0.45 * math.sin(q), z) for q in [2 * math.pi * i / 12 for i in range(12)] for z in (Z1 + 6.6, Z1 + 7.1)], 'marmo', 0)
        else:
            cornice_rettangolo(F, -1.95, 1.95, Z1 + 0.9, C1 - 0.8, 0)
            cornice_rettangolo(F, -1.35, 1.35, Z1 + 1.5, C1 - 1.4, 0, larg=0.1)
        # cornice fra il primo e il secondo ordine
        F.blocco(-h - 0.3, h + 0.3, C1, Z2, -t, 0.38, 'marmo', smusso=0.02)
        F.blocco(-h - 0.3, h + 0.3, C1 + 0.22, C1 + 0.36, 0.38, 0.42, 'marmoVerde', smusso=0)
        # secondo ordine: tre archi ciechi su lesene
        bay = (lato - 1.3) / 3
        for i in range(3):
            cx = -h + 0.65 + bay * (i + 0.5)
            r = bay / 2 - 0.15
            for sx in (-1, 1):
                F.blocco(cx + sx * r - 0.16, cx + sx * r + 0.16, Z2, 17.0, 0, 0.1, 'marmoVerde', smusso=0)
            arco_listello(F, cx, 17.0, r + 0.16, 0, larg=0.32, sp=0.1)
            if i == 1 and fin:
                # la finestra con il timpano
                for sx in (-1, 1):
                    F.blocco(sx * 0.65, sx * 0.95, 13.6, 16.4, -t, 0.12, 'marmo', smusso=0.01)
                F.blocco(-1.05, 1.05, 13.35, 13.6, -t, 0.18, 'marmo', smusso=0.01)
                F.solido([(-1.15, yy, 16.4) for yy in (0, 0.2)] + [(1.15, yy, 16.4) for yy in (0, 0.2)] + [(0, yy, 17.25) for yy in (0, 0.2)], 'marmoVerde', 0)
                F.blocco(-0.66, 0.66, 13.6, 16.4, -t + 0.1, -0.4, 'scuro', smusso=0)
            else:
                cornice_rettangolo(F, cx - r + 0.45, cx + r - 0.45, Z2 + 0.7, 16.2, 0, larg=0.12)
        # cornice fra il secondo ordine e l'attico
        F.blocco(-h - 0.3, h + 0.3, C2, Z3, -t, 0.38, 'marmo', smusso=0.02)
        # attico a fasce bianche e verdi
        z = Z3 + 0.45
        while z < C3 - 0.3:
            F.blocco(-h, h, z, z + 0.16, 0, 0.05, 'marmoVerde', smusso=0)
            z += 0.6
        F.blocco(-h - 0.45, h + 0.45, C3, C3 + 0.5, -t, 0.5, 'marmo', smusso=0.02)
        phi = math.radians(th - 90)
        M = Matrix.Translation((a * math.cos(math.radians(th)), a * math.sin(math.radians(th)), 0)) @ Matrix.Rotation(phi, 4, 'Z')
        innesta(P, F, M)
    # i pilastri d'angolo, a fasce bianche e verdi, nei due ordini bassi
    for k in range(8):
        q = math.pi / 8 + k * math.pi / 4
        cx, cy = (Rc - 0.25) * math.cos(q), (Rc - 0.25) * math.sin(q)
        z, i = Z1, 0
        while z < C2:
            z1 = min(C2, z + 0.55)
            pts = [(cx + 0.75 * math.cos(q + d), cy + 0.75 * math.sin(q + d), zz) for d in (math.pi / 2, -math.pi / 2, 0.0, math.pi) for zz in (z, z1)]
            P.solido(pts, 'marmo' if i % 2 == 0 else 'marmoVerde', 0)
            z, i = z1, i + 1
    # il tetto a piramide di lastre bianche, con i costoloni
    P.solido(anello(Rc + 0.6, C3 + 0.5) + anello(Rc + 0.6, C3 + 0.75) + [(0, 0, 32.2)], 'marmo', 0)
    for k in range(8):
        q = math.pi / 8 + k * math.pi / 4
        P.solido([((Rc + 0.6) * math.cos(q) + 0.2 * math.cos(q + d), (Rc + 0.6) * math.sin(q) + 0.2 * math.sin(q + d), C3 + 0.8) for d in (math.pi / 2, -math.pi / 2)] +
                 [(0.2 * math.cos(q + d), 0.2 * math.sin(q + d), 32.35) for d in (math.pi / 2, -math.pi / 2)] + [((Rc + 0.6) * math.cos(q), (Rc + 0.6) * math.sin(q), C3 + 1.0)], 'marmo', 0)
    # la lanterna: basamento, colonnine, cornice, cuspide, palla
    P.solido(anello(2.9, 31.0) + anello(2.9, 31.7), 'marmo', 0)
    P.solido(anello(1.9, 31.7) + anello(1.9, 35.6), 'scuro', 0)
    for k in range(8):
        q = math.pi / 8 + k * math.pi / 4
        P.solido([(2.4 * math.cos(q) + 0.19 * math.cos(w), 2.4 * math.sin(q) + 0.19 * math.sin(w), z) for w in [2 * math.pi * i / 8 for i in range(8)] for z in (31.7, 35.6)], 'marmo', 0)
    P.solido(anello(2.85, 35.6) + anello(2.85, 36.1), 'marmo', 0)
    P.solido(anello(2.6, 36.1) + [(0, 0, 38.3)], 'marmo', 0)
    P.solido([(0.32 * math.cos(w) * math.cos(v), 0.32 * math.sin(w) * math.cos(v), 38.65 + 0.32 * math.sin(v)) for w in [2 * math.pi * i / 10 for i in range(10)] for v in [math.pi * (j / 6 - 0.5) for j in range(7)]], 'marmo', 0)
    # la scarsella, a ovest
    S = B['scarsella']
    x0, x1 = -a - S['prof'], -a + 0.3
    yw = S['larg'] / 2
    P.blocco(x0, x1, -1.2, 15.4, -yw, yw, 'marmo', smusso=0.02)
    S2 = K.Pezzo('_')
    cornice_rettangolo(S2, -yw + 0.7, yw - 0.7, 1.6, 9.8, 0)
    cornice_rettangolo(S2, -yw + 0.7, yw - 0.7, 10.6, 14.4, 0)
    innesta(P, S2, Matrix.Translation((x0, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z'))
    P.blocco(x0 - 0.3, x1, 15.4, 15.8, -yw - 0.3, yw + 0.3, 'marmo', smusso=0.02)
    P.solido([(x, y, z) for x in (x0 - 0.3, x1) for y in (-yw - 0.3, yw + 0.3) for z in (15.8,)] + [(x1, y, 16.6) for y in (-yw - 0.3, yw + 0.3)], 'lastre', 0)
    return P.crea()


# ==================================================== santa reparata
def santa_reparata():
    """Santa Reparata, la cattedrale del 1216, con l'interno.
    Dedotto dagli scavi del 1965–1974 (Morozzi, Toker): tre navate, sette
    coppie di pilastri (la ricostruzione carolingia), due cappelle laterali
    absidate, abside con due absidiole, cripta sotto il presbiterio rialzato
    con due scale, portico davanti alla facciata, misure interne di circa
    58,5 × 25,5 m. Ipotesi: le altezze, le finestre, le capriate, il
    campanile (ne restano le fondazioni: qui uno solo, a nord), la facciata
    di marmi bianchi e verdi («probabilmente», come il Battistero).
    Facciata sul piano y = 0 verso +y (la piazza, a ovest), l'interno verso
    -y; x da 0 (sud) a W (nord). Le profondità d sono positive dalla
    facciata: y = -d. Nessuna trasformazione è una specchiatura, così le
    facce restano rivolte all'esterno."""
    S = PAR['santa_reparata']
    W, t, XP, LP, PAS, NP = S['W'], S['t'], S['pilastri'], S['lato'], S['passo'], S['n']
    PRES, FONDO, ALZ, PORT, PORTICO = S['presbiterio'], S['fondo'], S['alzato'], S['portale'], S['portico']
    xc = W / 2
    HA, HC, HN = 8.5, 11.8, 15.5                          # muri delle navatelle, colmo dei loro tetti, navata
    nx0, nx1 = XP[0] - 0.4, XP[1] + 0.4                   # facce esterne dei muri della navata
    COLMO = HN + (xc - nx0 + 0.5) * 0.42
    CAP = PRES - PAS / 2                                  # le cappelle laterali: la campata prima del presbiterio
    sp = 0.03                                             # le pelli: pietra fuori, intonaco dentro
    P = K.Pezzo('santa_reparata')
    xa = (XP[0] / 2 + 0.2, (W + XP[1]) / 2 - 0.2)         # gli assi delle navatelle

    def profilo():
        return [(0, -1.2), (W, -1.2), (W, HA), (nx1 + 0.3, HC), (nx1, HN), (xc, COLMO), (nx0, HN), (nx0 - 0.3, HC), (0, HA)]

    def arco(cx, w, h):
        return arco_punti(cx, h - w / 2, w, 'tondo', n=14)

    def solido_anello(cx, cy, r0, r1, a0, a1, z0, z1, m, sx=1):
        P.solido([(cx + sx * rr * math.cos(a), cy + rr * math.sin(a), z) for a in (a0, a1) for rr in (r0, r1) for z in (z0, z1)], m, 0)

    # --- la facciata, di marmo, con tre portali e l'occhio
    portali = ((xc, PORT, 5.6), (xa[0], 1.6, 3.8), (xa[1], 1.6, 3.8))
    occhio = [(xc + 1.0 * math.cos(q), 12.6 + 1.0 * math.sin(q)) for q in [2 * math.pi * i / 16 for i in range(16)]]
    fori = [arco(cx, w, h) for cx, w, h in portali] + [occhio]
    F = K.Pezzo('_')
    lastra(F, profilo(), fori, -t, 0, 'marmo')
    lastra(F, profilo(), fori, -t - sp, -t, 'intonaco')
    for x in (nx0, nx1):                                   # lesene e fascia verdi
        F.blocco(x - 0.25, x + 0.25, -1.2, HN, 0, 0.08, 'marmoVerde', smusso=0)
    F.blocco(-0.1, W + 0.1, HA - 0.25, HA, 0, 0.12, 'marmoVerde', smusso=0)
    cornice_rettangolo(F, xc - 2.9, xc + 2.9, 0.4, 7.4, 0)
    for (u0, u1) in ((0.8, nx0 - 0.6), (nx1 + 0.6, W - 0.8)):
        cornice_rettangolo(F, u0, u1, 0.4, HA - 0.7, 0)
    for (pa, pb) in (((nx0, HN), (xc, COLMO)), ((xc, COLMO), (nx1, HN))):   # la cornice del frontone
        for i in range(10):
            p0 = (pa[0] + (pb[0] - pa[0]) * i / 10, pa[1] + (pb[1] - pa[1]) * i / 10)
            p1 = (pa[0] + (pb[0] - pa[0]) * (i + 1) / 10, pa[1] + (pb[1] - pa[1]) * (i + 1) / 10)
            F.solido([(x, y, z + dz) for x, z in (p0, p1) for y in (-0.1, 0.25) for dz in (0.0, 0.3)], 'marmo', 0)
    for cx, w, h in portali:                               # stipiti e ghiere dei portali
        arco_listello(F, cx, h - w / 2, w / 2 + 0.35, 0, larg=0.35, sp=0.12)
        for sx in (-1, 1):
            F.blocco(cx + sx * w / 2, cx + sx * (w / 2 + 0.35), 0, h - w / 2, -t, 0.12, 'marmo', smusso=0.01)
    for q in range(16):                                    # l'anello dell'occhio, a conci bianchi e verdi
        F.solido([(xc + r * math.cos(a), y, 12.6 + r * math.sin(a)) for a in (2 * math.pi * q / 16, 2 * math.pi * (q + 1) / 16) for r in (1.0, 1.35) for y in (-t, 0.12)],
                 'marmoVerde' if q % 2 else 'marmo', 0)
    for cx, w, h in portali[1:]:                           # chiusi i portali piccoli
        K.anta(F, cx - w / 2, cx, 0, h, -0.55, -0.48, arco=(cx, h - w / 2, w / 2))
        K.anta(F, cx, cx + w / 2, 0, h, -0.55, -0.48, arco=(cx, h - w / 2, w / 2))
    innesta(P, F, Matrix())
    for sx in (-1, 1):                                     # aperto il portale grande: battenti girati verso l'interno
        A = K.Pezzo('_')
        K.anta(A, 0, PORT / 2 - 0.05, 0, 4.2, -0.06, 0.0)
        hx = xc + sx * PORT / 2 + (0.06 if sx > 0 else 0)
        innesta(P, A, Matrix.Translation((hx, -t - 0.08, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))

    # --- i muri delle navatelle: finestre e l'arco della cappella laterale.
    # Costruiti nel piano (u, spessore, z) e girati: a sud u è la profondità,
    # a nord è la profondità cambiata di segno (così la rotazione resta tale)
    for lato in ('sud', 'nord'):
        sg = 1 if lato == 'sud' else -1
        fori_l = []
        for k in range(9):
            d = t + PAS * (k + 0.5)
            if d > FONDO - 1 or abs(d - CAP) < 3.5: continue
            fori_l.append([(sg * (d + px), pz + 4.6) for px, pz in arco_punti(0, 1.8, 0.8, 'tondo', n=8)])
        fori_l.append([(sg * (CAP + px), pz) for px, pz in arco_punti(0, 3.9, 5.0, 'tondo', n=14)])
        fori_l = [f if sg > 0 else f[::-1] for f in fori_l]
        bordo = [(sg * t, -1.2), (sg * FONDO, -1.2), (sg * FONDO, HA), (sg * t, HA)]
        if sg < 0: bordo = bordo[::-1]
        Mu = K.Pezzo('_')
        lastra(Mu, bordo, fori_l, -t, 0, 'intonaco')
        lastra(Mu, bordo, fori_l, -t - sp, -t, 'conci')
        if sg > 0:   # x = spessore + t, y = -u
            M = Matrix(((0, 1, 0, t), (-1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))
        else:        # x = W - t - spessore, y = u
            M = Matrix(((0, -1, 0, W - t), (1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))
        innesta(P, Mu, M)

    # --- il muro di fondo, con le aperture dell'abside e delle absidiole
    fori_e = [arco(xc, 10.6, 12.8), arco(xa[0], 4.6, 6.3), arco(xa[1], 4.6, 6.3)]
    E = K.Pezzo('_')
    lastra(E, profilo(), fori_e, -t, 0, 'intonaco')
    lastra(E, profilo(), fori_e, -t - sp, -t, 'conci')
    innesta(P, E, Matrix.Translation((0, -FONDO, 0)))

    # --- i muri della navata sulle arcate, con le finestre alte; pilastri
    D = [t + PAS * k for k in range(1, NP + 1)]
    bordi = [t + 0.4] + D + [FONDO - 0.3]
    campate = []
    for i in range(len(bordi) - 1):
        u0 = bordi[i] + (0 if i == 0 else LP / 2)
        u1 = bordi[i + 1] - (LP / 2 if i + 1 < len(bordi) - 1 else 0)
        campate.append((u0, u1))
    alte = [[(px, pz + 12.3) for px, pz in arco_punti((u0 + u1) / 2, 1.75, 0.9, 'tondo', n=8)] for u0, u1 in campate]
    for j, xp in enumerate(XP):
        fori_n = [arco_punti((u0 + u1) / 2, 5.6, u1 - u0, 'tondo', n=14) for u0, u1 in campate] + alte
        N = K.Pezzo('_')
        lastra(N, [(t, -1.2), (FONDO, -1.2), (FONDO, HN), (t, HN)], fori_n, -0.4, 0.4, 'intonaco')
        for u0, u1 in campate:                             # le ghiere delle arcate, sulle due facce
            conci_arco(N, arco_punti((u0 + u1) / 2, 5.6, u1 - u0, 'tondo', n=14)[2:], 0.45, -0.44, 0.44)
        # sopra i tetti delle navatelle il muro è fuori: pietra, con le finestre
        y0 = -0.4 - sp if j == 0 else 0.4
        lastra(N, [(t, HC - 0.2), (FONDO, HC - 0.2), (FONDO, HN), (t, HN)], alte, y0, y0 + sp, 'conci')
        innesta(P, N, Matrix(((0, 1, 0, xp), (-1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1))))
        for d in D:
            z0 = ALZ if d > PRES else 0
            P.blocco(xp - LP / 2, xp + LP / 2, z0, 5.35, -d - LP / 2, -d + LP / 2, 'conci', smusso=0.02)
            P.blocco(xp - LP / 2 - 0.12, xp + LP / 2 + 0.12, 5.35, 5.75, -d - LP / 2 - 0.12, -d + LP / 2 + 0.12, 'conci', smusso=0.03)
            P.blocco(xp - LP / 2 - 0.1, xp + LP / 2 + 0.1, z0, z0 + 0.35, -d - LP / 2 - 0.1, -d + LP / 2 + 0.1, 'conci', smusso=0.03)

    # --- pavimento di mattoni; presbiterio sulla cripta, con le scale e l'altare
    P.blocco(t - 0.05, W - t + 0.05, -0.12, 0.0, -FONDO, -t + 0.05, 'cotto', smusso=0)
    P.blocco(t, W - t, 0.0, ALZ - 0.06, -FONDO, -PRES, 'conci', smusso=0)
    P.blocco(t, W - t, ALZ - 0.06, ALZ, -FONDO, -PRES, 'lastre', smusso=0)
    scale = (xc - 3.6, xc + 3.6)
    tratti = [t, scale[0] - 1.15, scale[0] + 1.15, scale[1] - 1.15, scale[1] + 1.15, W - t]
    for x0, x1 in zip(tratti[::2], tratti[1::2]):          # il parapetto, interrotto dalle scale
        P.blocco(x0, x1, ALZ, ALZ + 0.9, -PRES - 0.35, -PRES - 0.05, 'marmo', smusso=0.01)
    for cx in scale:                                       # le due scale ai lati della cripta
        for i in range(8):
            P.blocco(cx - 1.1, cx + 1.1, 0, (i + 1) * ALZ / 8, -PRES, -PRES + 0.4 * (8 - i), 'lastre', smusso=0.01)
    cr = arco_punti(xc, 1.0, 2.0, 'tondo', n=10)           # l'ingresso della cripta
    P.solido([(x, y, z) for x, z in cr for y in (-PRES - 0.6, -PRES + 0.01)], 'scuro', 0)
    conci_arco(P, cr[2:], 0.3, -PRES - 0.05, -PRES + 0.08)
    P.blocco(xc - 1.2, xc + 1.2, ALZ, ALZ + 1.0, -FONDO + 2.0, -FONDO + 3.2, 'marmo', smusso=0.02)        # l'altare
    P.blocco(xc - 1.35, xc + 1.35, ALZ + 1.0, ALZ + 1.12, -FONDO + 1.85, -FONDO + 3.35, 'marmo', smusso=0.01)

    # --- abside e absidiole: mezzo cilindro, catino, tetto a mezzo cono.
    # Il colmo del cono è alto abbastanza da restare fuori dal catino, che
    # altrimenti dall'interno si vedrebbe bucato dal tetto
    def abside(cx, r, h, colmo):
        n_ = 14
        for i in range(n_):
            a0, a1 = math.pi + math.pi * i / n_, math.pi + math.pi * (i + 1) / n_
            solido_anello(cx, -FONDO, r, r + t, a0, a1, -1.2, h, 'conci')
            solido_anello(cx, -FONDO, r - sp, r, a0, a1, ALZ, h, 'intonaco')
            for j in range(5):
                f0, f1 = math.pi / 2 * j / 5, math.pi / 2 * (j + 1) / 5
                P.solido([(cx + rr * math.cos(f) * math.cos(a), -FONDO + rr * math.cos(f) * math.sin(a), h + rr * math.sin(f))
                          for a in (a0, a1) for f in (f0, f1) for rr in (r - 0.05, r)], 'intonaco', 0)
            # il tetto parte dalla faccia esterna del muro di fondo, non da quella interna
            P.solido([(cx + rr * math.cos(a), -FONDO - t + rr * math.sin(a), z) for a in (a0, a1) for (rr, z) in ((r + t + 0.4, h), (r + t + 0.4, h + 0.15), (0.05, colmo))], 'coppi', 0)
        P.solido([(cx + rr * math.cos(a), -FONDO + rr * math.sin(a), z) for a in [math.pi + math.pi * i / 12 for i in range(13)] for rr in (0.0, r) for z in (ALZ - 0.1, ALZ)], 'lastre', 0)
    abside(xc, 5.3, 7.5, 17.2)
    abside(xa[0], 2.3, 4.0, 7.6)
    abside(xa[1], 2.3, 4.0, 7.6)

    # --- le cappelle laterali absidate, fuori dai muri delle navatelle
    for sx, x0 in ((-1, 0.0), (1, W)):
        r, h = 2.5, 4.6
        for i in range(12):
            a0, a1 = -math.pi / 2 + math.pi * i / 12, -math.pi / 2 + math.pi * (i + 1) / 12
            if sx < 0: a0, a1 = a1, a0                      # stessa rotazione, verso opposto
            solido_anello(x0, -CAP, r, r + 0.8, a0, a1, -1.2, h, 'conci', sx)
            solido_anello(x0, -CAP, r - sp, r, a0, a1, 0, h, 'intonaco', sx)
            for j in range(4):
                f0, f1 = math.pi / 2 * j / 4, math.pi / 2 * (j + 1) / 4
                P.solido([(x0 + sx * rr * math.cos(f) * math.cos(a), -CAP + rr * math.cos(f) * math.sin(a), h + rr * math.sin(f))
                          for a in (a0, a1) for f in (f0, f1) for rr in (r - 0.05, r)], 'intonaco', 0)
            P.solido([(x0 + sx * (0.04 + rr * math.cos(a)), -CAP + rr * math.sin(a), z) for a in (a0, a1) for (rr, z) in ((r + 1.2, h), (r + 1.2, h + 0.15), (0.05, 8.35))], 'coppi', 0)
        P.solido([(x0 + sx * rr * math.cos(a), -CAP + rr * math.sin(a), z) for a in [-math.pi / 2 + math.pi * i / 12 for i in range(13)] for rr in (0.0, r) for z in (-0.12, 0.0)], 'cotto', 0)

    # --- i tetti: la navata a due falde, le navatelle a uno spiovente; tavolato e capriate
    def falda_(xa_, za_, xb_, zb_, d0, d1, m, spes=0.14):
        P.solido([(x, -d, z + dz) for x, z in ((xa_, za_), (xb_, zb_)) for d in (d0, d1) for dz in (0.0, spes)], m, 0)
    falda_(nx0 - 0.5, HN - 0.2, xc, COLMO, -0.4, FONDO + t + 0.3, 'coppi')
    falda_(xc, COLMO, nx1 + 0.5, HN - 0.2, -0.4, FONDO + t + 0.3, 'coppi')
    falda_(nx0, HN, xc, COLMO - 0.16, t, FONDO, 'legno', 0.04)
    falda_(xc, COLMO - 0.16, nx1, HN, t, FONDO, 'legno', 0.04)
    falda_(-0.5, HA - 0.25, nx0 + 0.05, HC - 0.05, -0.4, FONDO + t + 0.3, 'coppi')
    falda_(nx1 - 0.05, HC - 0.05, W + 0.5, HA - 0.25, -0.4, FONDO + t + 0.3, 'coppi')
    falda_(t, HA - 0.05, nx0, HC - 0.2, t, FONDO, 'legno', 0.04)
    falda_(nx1, HC - 0.2, W - t, HA - 0.05, t, FONDO, 'legno', 0.04)
    d = t + 1.6
    while d < FONDO - 0.5:
        # la capriata: catena, due puntoni, il monaco
        P.blocco(nx0 + 0.4, nx1 - 0.4, HN - 0.38, HN - 0.05, -d - 0.16, -d + 0.16, 'legnoScuro', smusso=0.01)
        for x_a in (nx0 + 0.45, nx1 - 0.45):
            P.solido([(x, -d + dd, zz) for (x, z0_) in ((x_a, HN - 0.05), (xc, COLMO - 0.2)) for dd in (-0.14, 0.14) for zz in (z0_ - 0.3, z0_)], 'legnoScuro', 0)
        P.blocco(xc - 0.13, xc + 0.13, HN - 0.38, COLMO - 0.25, -d - 0.13, -d + 0.13, 'legnoScuro', smusso=0.01)
        for (x_a, z_a, x_b, z_b) in ((t, HA - 0.15, nx0, HC - 0.3), (nx1, HC - 0.3, W - t, HA - 0.15)):   # i puntoni delle navatelle
            P.solido([(x, -d + dd, zz) for (x, z0_) in ((x_a, z_a), (x_b, z_b)) for dd in (-0.11, 0.11) for zz in (z0_ - 0.24, z0_)], 'legnoScuro', 0)
        d += 3.3

    # --- il portico: otto colonne, l'architrave, il tetto a uno spiovente
    P.blocco(-0.3, W + 0.3, -0.12, 0.05, 0, PORTICO, 'lastre', smusso=0)
    for i in range(8):
        cx, cy = 0.5 + (W - 1.0) * i / 7, PORTICO - 0.45
        P.solido([(cx + 0.42 * math.cos(q), cy + 0.42 * math.sin(q), z) for q in [2 * math.pi * k / 12 for k in range(12)] for z in (0.05, 0.4)], 'conci', 0)
        P.solido([(cx + 0.27 * math.cos(q), cy + 0.27 * math.sin(q), z) for q in [2 * math.pi * k / 14 for k in range(14)] for z in (0.4, 4.7)], 'marmo', 0)
        P.blocco(cx - 0.4, cx + 0.4, 4.7, 5.1, cy - 0.4, cy + 0.4, 'conci', smusso=0.03)
    P.blocco(-0.2, W + 0.2, 5.1, 5.75, PORTICO - 0.85, PORTICO - 0.05, 'conci', smusso=0.02)
    P.solido([(x, y, z) for x in (-0.3, W + 0.3) for (y, z) in ((0.0, 7.3), (PORTICO + 0.4, 5.75), (0.0, 7.45), (PORTICO + 0.4, 5.9))], 'coppi', 0)
    P.solido([(x, y, z) for x in (-0.2, W + 0.2) for (y, z) in ((0.0, 7.05), (PORTICO - 0.05, 5.78), (0.0, 7.1), (PORTICO - 0.05, 5.83))], 'legno', 0)

    # --- il campanile, a nord accanto al fondo, con le bifore della cella
    cx0, cx1, cy1, cy0 = W, W + 5.6, -(FONDO - 0.9), -(FONDO - 6.5)
    P.blocco(cx0, cx1, -1.2, 27.0, cy1, cy0, 'conci', smusso=0.02)
    xm, ym = (cx0 + cx1) / 2, (cy0 + cy1) / 2
    for off in (-0.85, 0.85):
        P.blocco(cx1 - 0.02, cx1 + 0.03, 22.2, 24.8, ym + off - 0.5, ym + off + 0.5, 'scuro', smusso=0)
        for yf in (cy0, cy1):
            P.blocco(xm + off - 0.5, xm + off + 0.5, 22.2, 24.8, yf - 0.03, yf + 0.03, 'scuro', smusso=0)
    P.blocco(cx0 - 0.2, cx1 + 0.2, 27.0, 27.4, cy1 - 0.2, cy0 + 0.2, 'conci', smusso=0.02)
    P.solido([(x, y, 27.4) for x in (cx0 - 0.3, cx1 + 0.3) for y in (cy1 - 0.3, cy0 + 0.3)] + [(xm, ym, 30.2)], 'coppi', 0)
    return P.crea()


def esporta(ob, nome):
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_yup=True, export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_texcoords=True, export_animations=False)
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print('MONUMENTO', nome, tri, 'triangoli')
    # l'indice dice alla città quali modelli ci sono e con quali misure posarli
    f = os.path.join(USCITA, 'indice.json')
    indice = json.load(open(f)) if os.path.exists(f) else {}
    indice[nome] = dict(POSA.get(nome, lambda: {})(), triangoli=tri)
    json.dump(indice, open(f, 'w'), indent=1, sort_keys=True)


def tavola(ob, nome, dist=None, alto=0.35, lato=0.5):
    """Disegno di controllo, di tre quarti dalla strada."""
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
    sc.display.shading.show_cavity = True; sc.display.shading.show_shadows = True
    sc.render.resolution_x, sc.render.resolution_y = 1200, 1500
    for m in K.MATERIALI.values():
        m.diffuse_color = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    c = sum(bb, Vector()) / 8
    dim = max((max(v[i] for v in bb) - min(v[i] for v in bb)) for i in range(3))
    d = dist or dim * 1.9
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam); sc.camera = cam
    cam.location = c + Vector((math.sin(lato) * d, math.cos(lato) * d, alto * d))
    cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 50
    sc.render.filepath = os.path.abspath(os.path.join(QUI, '..', '..', '.catture', f'monumento-{nome}.png'))
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)


COSTRUTTORI = {'amidei': amidei, 'marte': marte, 'ponte': ponte, 'chiesa': chiesa, 'porta': porta, 'battistero': battistero,
               'santa_reparata': santa_reparata}
POSA = {'amidei': lambda: {k: PAR['amidei'][k] for k in ('fronte', 'W', 'D')},
        'chiesa': lambda: dict(PAR['chiesa'])}

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    nomi = [a for a in args if a in COSTRUTTORI] or list(COSTRUTTORI)
    for nome in nomi:
        prepara()
        ob = COSTRUTTORI[nome]()
        esporta(ob, nome)
        if 'tavola' in args: tavola(ob, nome)
    print('FATTO', nomi)
