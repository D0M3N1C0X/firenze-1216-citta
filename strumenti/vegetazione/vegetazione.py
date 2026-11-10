# =====================================================================
# GLI ALBERI DELLA CAMPAGNA: ulivi e cipressi, modellati da script.
#
#   blender -b --python vegetazione.py          (o: python vegetazione.py, con Blender come modulo)
#
# Scrive ../../public/vegetazione/<nome>.glb e indice.json. Ogni modello ha
# due parti, «corteccia» e «foglie», con i colori nei vertici (COLOR_0): la
# città li disegna con un materiale solo per parte e li ripete per istanze
# (mondo/vegetazione.js), il dettaglio solo vicino a chi guarda.
#
# Fatti a mano da codice, senza asset esterni (decisione del 9 novembre
# 2026: solo Blender e materiale CC0). Forme e colori: ipotesi, sull'ulivo
# e sul cipresso toscani di oggi; nel Duecento gli ulivi stavano sui colli
# intorno alla città [da verificare: quanto fossero diffusi].
# =====================================================================
import bpy, bmesh, os, sys, json, math, random
from mathutils import Vector, noise

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'vegetazione'))


def pulisci():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in (bpy.data.meshes, bpy.data.materials):
        for x in list(c): c.remove(x)


class Parte:
    """Una maglia con i colori nei vertici, costruita a pezzi."""
    def __init__(self):
        self.b = bmesh.new()
        self.col = self.b.loops.layers.color.new('Col')

    def faccia(self, vs, colori):
        try: f = self.b.faces.new(vs)
        except ValueError: return
        for l, c in zip(f.loops, colori): l[self.col] = c

    def oggetto(self, nome, materiale):
        me = bpy.data.meshes.new(nome)
        self.b.normal_update(); self.b.to_mesh(me); self.b.free()
        me.materials.append(materiale)
        ob = bpy.data.objects.new(nome, me)
        bpy.context.scene.collection.objects.link(ob)
        for p in me.polygons: p.use_smooth = True
        return ob


def materiale(nome, col):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    attr = nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9
    return m


def tubo(P, punti, raggi, colore, R, n=7, nodoso=0.25):
    """Un ramo o un tronco: anelli di n vertici lungo una spezzata, il raggio
    che cambia e un po' di rumore per i nodi."""
    anelli = []
    for i, (p, r) in enumerate(zip(punti, raggi)):
        a = Vector(punti[min(i + 1, len(punti) - 1)]) - Vector(punti[max(i - 1, 0)])
        d = a.normalized() if a.length > 1e-6 else Vector((0, 0, 1))
        u = d.cross(Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))).normalized(); v = d.cross(u)
        anello = []
        for k in range(n):
            t = 2 * math.pi * k / n
            rr = r * (1 + nodoso * noise.noise(Vector((p[0] * 3 + k, p[1] * 3, p[2] * 3))))
            anello.append(P.b.verts.new(Vector(p) + (u * math.cos(t) + v * math.sin(t)) * rr))
        anelli.append(anello)
    for i in range(len(anelli) - 1):
        for k in range(n):
            a, b = anelli[i][k], anelli[i][(k + 1) % n]
            c, d = anelli[i + 1][(k + 1) % n], anelli[i + 1][k]
            sc = 0.85 + 0.3 * R.random()
            P.faccia([a, b, c, d], [tuple(min(1, x * sc) for x in colore) + (1,)] * 4)


def ciuffo(P, c, r, colore, R, schiaccia=0.75, suddivisioni=2):
    """Un ciuffo di foglie: un icosaedro deformato, più chiaro sopra e più
    scuro sotto (le foglie dell'ulivo sono argentee di sotto: qui la luce)."""
    tmp = bmesh.new()
    bmesh.ops.create_icosphere(tmp, subdivisions=suddivisioni, radius=1.0)
    mappa = {}
    for v in tmp.verts:
        q = v.co.copy()
        d = 1 + 0.32 * noise.noise(q * 2.3 + Vector(c) * 0.7)
        p = Vector((c[0] + q.x * r * d, c[1] + q.y * r * d, c[2] + q.z * r * d * schiaccia))
        mappa[v] = (P.b.verts.new(p), q.z)
    for f in tmp.faces:
        vs = [mappa[v][0] for v in f.verts]
        cols = []
        for v in f.verts:
            alto = mappa[v][1]
            k = 0.78 + 0.32 * (alto + 1) / 2 + R.uniform(-0.06, 0.06)
            cols.append(tuple(min(1, x * k) for x in colore) + (1,))
        P.faccia(vs, cols)
    tmp.free()


def ulivo(seme):
    """Un ulivo: il tronco corto e contorto che si apre in due o tre branche,
    la chioma a ciuffi larga e bassa. Alto circa 4,5 m."""
    R = random.Random(seme)
    C, F = Parte(), Parte()
    corteccia = (0.33, 0.29, 0.24)
    verde = (0.32 + R.uniform(-0.03, 0.03), 0.37 + R.uniform(-0.03, 0.03), 0.27)
    h0 = R.uniform(0.9, 1.4)
    base = [(0, 0, -0.3), (R.uniform(-0.1, 0.1), R.uniform(-0.1, 0.1), h0 * 0.5), (R.uniform(-0.15, 0.15), R.uniform(-0.15, 0.15), h0)]
    tubo(C, base, [0.34, 0.27, 0.22], corteccia, R, n=9, nodoso=0.35)
    estremi = []
    nb = R.choice([2, 3, 3])
    for i in range(nb):
        a = 2 * math.pi * i / nb + R.uniform(-0.4, 0.4)
        l = R.uniform(1.4, 2.1)
        p0 = Vector(base[-1])
        p1 = p0 + Vector((math.cos(a) * l * 0.45, math.sin(a) * l * 0.45, l * 0.55))
        p2 = p1 + Vector((math.cos(a + 0.3) * l * 0.4, math.sin(a + 0.3) * l * 0.4, l * 0.5))
        tubo(C, [tuple(p0), tuple(p1), tuple(p2)], [0.16, 0.11, 0.06], corteccia, R, n=6)
        estremi.append(p2)
        # rametti
        for _ in range(2):
            q = p1.lerp(p2, R.random()); b = R.uniform(0, 2 * math.pi)
            tubo(C, [tuple(q), tuple(q + Vector((math.cos(b) * 0.7, math.sin(b) * 0.7, 0.5)))], [0.05, 0.02], corteccia, R, n=5)
            estremi.append(q + Vector((math.cos(b) * 0.7, math.sin(b) * 0.7, 0.5)))
    centro = sum(estremi, Vector()) / len(estremi)
    for _ in range(26):
        e = R.choice(estremi)
        c = e + Vector((R.uniform(-0.9, 0.9), R.uniform(-0.9, 0.9), R.uniform(-0.3, 0.6)))
        c = c.lerp(centro + Vector((0, 0, 0.3)), 0.15)
        ciuffo(F, tuple(c), R.uniform(0.55, 0.85), verde, R)
    return C, F


def cipresso(seme):
    """Un cipresso: un fuso scuro a fiamma, fatto di anelli irregolari, con
    i ciuffi che sporgono. Alto 12 m, la città lo scala (9–17 m)."""
    R = random.Random(seme)
    C, F = Parte(), Parte()
    tubo(C, [(0, 0, -0.3), (0, 0, 1.2)], [0.22, 0.18], (0.3, 0.24, 0.19), R, n=6)
    verde = (0.11 + R.uniform(-0.01, 0.01), 0.17 + R.uniform(-0.01, 0.02), 0.1)
    H, n, livelli = 12.0, 16, 30
    profilo = lambda t: (0.2 + 0.85 * math.sin(math.pi * min(1, t * 1.15)) ** 0.8) * (1 - t) ** 0.35 if t < 1 else 0.0
    anelli = []
    for j in range(livelli + 1):
        t = j / livelli
        z = 0.8 + t * (H - 0.8)
        r = profilo(t) * 1.05
        anello = []
        for k in range(n):
            a = 2 * math.pi * k / n + j * 0.37
            rr = r * (1 + 0.28 * noise.noise(Vector((k * 0.9, j * 0.7, seme))))
            anello.append(F.b.verts.new((math.cos(a) * rr, math.sin(a) * rr, z)))
        anelli.append(anello)
    for j in range(livelli):
        for k in range(n):
            a, b = anelli[j][k], anelli[j][(k + 1) % n]
            c, d = anelli[j + 1][(k + 1) % n], anelli[j + 1][k]
            sc = 0.8 + 0.4 * R.random()
            F.faccia([a, b, c, d], [tuple(min(1, x * sc) for x in verde) + (1,)] * 4)
    punta = F.b.verts.new((0, 0, H + 0.4))
    for k in range(n):
        F.faccia([anelli[-1][k], anelli[-1][(k + 1) % n], punta], [verde + (1,)] * 3)
    return C, F


def esporta(nome, C, F, info):
    pulisci()
    mc, mf = materiale('corteccia', None), materiale('foglie', None)
    oc = C.oggetto(nome + '-corteccia', mc); of = F.oggetto(nome + '-foglie', mf)
    bpy.ops.object.select_all(action='DESELECT')
    oc.select_set(True); of.select_set(True)
    bpy.context.view_layer.objects.active = of
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_yup=True, export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_vertex_color='ACTIVE', export_animations=False)
    tri = sum(len(p.vertices) - 2 for o in (oc, of) for p in o.data.polygons)
    print('ALBERO', nome, tri, 'triangoli')
    return dict(info, triangoli=tri)


if __name__ == '__main__':
    indice = {}
    for i in range(4):
        C, F = ulivo(1209 + i * 17)
        indice[f'ulivo-{i}'] = esporta(f'ulivo-{i}', C, F, {'tipo': 'ulivo'})
    for i in range(3):
        C, F = cipresso(1300 + i * 23)
        indice[f'cipresso-{i}'] = esporta(f'cipresso-{i}', C, F, {'tipo': 'cipresso', 'altezza': 12.0})
    json.dump(indice, open(os.path.join(USCITA, 'indice.json'), 'w'), indent=1, sort_keys=True)
    print('FATTO', list(indice))
    if 'python' in os.path.basename(sys.executable): os._exit(0)
