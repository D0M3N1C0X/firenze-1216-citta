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
    for nome, col in {'marmo': (0.85, 0.83, 0.78), 'marmoVerde': (0.18, 0.28, 0.22), 'coppi': (0.62, 0.32, 0.22)}.items():
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


COSTRUTTORI = {'amidei': amidei, 'marte': marte, 'ponte': ponte, 'chiesa': chiesa, 'porta': porta}
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
