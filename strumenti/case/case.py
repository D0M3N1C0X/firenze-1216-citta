# =====================================================================
# LE CASE, modellate in Blender: 27 tipi.
#
#   blender -b --python case.py        (o: python case.py, con Blender come modulo)
#
# Scrive ../../public/case/<tipo>.glb e indice.json. Un tipo è una casa a
# schiera fiorentina del Due e Trecento su un lotto stretto e profondo:
#   larghezza 5,2 / 6,8 / 8,2 m (la città la allunga o la accorcia di poco
#   per farla entrare nel lotto), profondità 12 m (idem);
#   2, 3 o 4 piani sopra il terreno (4 solo nella città del 1300);
#   i piani alti in pietra, in intonaco, o di tavole su un'intelaiatura che
#   sporge sulla strada (lo sporto), sempre sopra un piano terra di pietra.
# Ogni tipo ha quattro parti, che la città mostra secondo la distanza e il
# giorno (mondo/case-blender.js):
#   «vicino»   la casa con i suoi dettagli: la bottega ad arco con la ghiera
#              e una porta, le finestre con i davanzali e le imposte, i
#              marcapiani, lo sporto su mensole e saettoni, la gronda a
#              travicelli, il tetto di coppi;
#   «chiusa»   le imposte della bottega, nei giorni di festa;
#   «aperta»   la bottega aperta: lo sportello alzato a tettoia, il banco
#              sulla strada, la merce (giorni feriali);
#   «lontano»  la stessa casa semplificata, per quando si guarda da lontano.
#
# Le misure e le forme sono quelle di mondo/edifici.js (casa), che resta per
# le torri e le case sul fiume. Livello: ipotesi (edifici.js, in testa).
# Convenzioni: quelle dei monumenti (strumenti/monumenti/monumenti.py).
# =====================================================================
import bpy, os, sys, json, math, random

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, '..', 'monumenti'))
import monumenti as M                 # prepara, lastra, arco_punti, conci_arco, esporta
K = M.K
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'case'))

D, H0, HP, T = 12.0, 4.3, 3.4, 0.55
LARGHEZZE = [5.2, 6.8, 8.2]
PIANI = [2, 3, 4]
FINITURE = ['pietra', 'intonaco', 'legno']


def trave(P, a, b, s, m):
    from mathutils import Vector
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-4: u = Vector((1, 0, 0))
    u.normalize(); v = d.cross(u).normalized(); h = s / 2
    P.solido([tuple(p + u * su * h + v * sv * h) for p in (a, b) for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1))], m, 0)


def finestre_x(W):
    n = 2 if W < 6.0 else 3
    return [W * (k + 0.5) / n for k in range(n)]


def tetto(P, W, y_fronte, y_retro, z, m='coppi'):
    """Il tetto a capanna con il colmo parallelo alla strada, le due falde di
    coppi, i timpani di pietra ai fianchi e la gronda a travicelli davanti."""
    sal = (y_fronte - y_retro) / 2 * 0.42
    ym = (y_fronte + y_retro) / 2
    for (ya, yb) in ((y_fronte, ym), (y_retro, ym)):
        za, zb = z, z + sal
        pts = []
        for x in (-0.25, W + 0.25):
            for (yy, zz) in ((ya, za), (yb, zb)):
                pts += [(x, yy, zz), (x, yy, zz + 0.14)]
        P.solido(pts, m, 0)
    P.blocco(-0.25, W + 0.25, z + sal, z + sal + 0.2, ym - 0.18, ym + 0.18, m, smusso=0)        # il colmo
    for x0 in (0, W - 0.5):
        timpano = ((y_fronte - 0.6, z), (y_retro + 0.6, z), (ym, z + sal - 0.05))
        P.solido([(xx, y, zz) for xx in (x0, x0 + 0.5) for y, zz in timpano], 'pietrame', 0)
    # la gronda: i travicelli sotto la falda, dal muro al filo dei coppi
    x = 0.2
    while x < W - 0.1:
        P.blocco(x - 0.05, x + 0.05, z - 0.14, z, y_fronte - 0.75, y_fronte - 0.02, 'legnoScuro', smusso=0)
        x += 0.45
    P.blocco(-0.25, W + 0.25, z - 0.02, z + 0.02, y_fronte - 0.75, y_fronte, 'legno', smusso=0)       # il tavolato


def imposte(P, x, z0, w, h, y, aperta, m='legnoScuro'):
    """Le due imposte di una finestra: chiuse nell'apertura, oppure aperte
    contro il muro ai lati."""
    if not aperta:
        K.anta(P, x - w / 2 + 0.02, x - 0.01, z0, z0 + h, y - 0.06, y, m)
        K.anta(P, x + 0.01, x + w / 2 - 0.02, z0, z0 + h, y - 0.06, y, m)
    else:
        for s in (-1, 1):
            xa = x + s * (w / 2 + 0.05)
            P.blocco(min(xa, xa + s * w / 2), max(xa, xa + s * w / 2), z0, z0 + h, 0.01, 0.05, m, smusso=0)


def casa(W, piani, fin, seme):
    R = random.Random(seme)
    M.R.seed(seme)
    V, CH, AP, LO = K.Pezzo('vicino'), K.Pezzo('chiusa'), K.Pezzo('aperta'), K.Pezzo('lontano')
    Hm = H0 + piani * HP
    sporto = 0.9 if fin == 'legno' else 0.0
    sopra = {'pietra': 'conci', 'intonaco': 'intonaco', 'legno': 'legno'}[fin]

    # --- il piano terra, di pietra: la bottega ad arco e, se c'è posto, la porta
    if W >= 6.5:
        wb, xb = min(3.2, W * 0.42), W * 0.36
        porta = (W * 0.82, 1.15)
    else:
        wb, xb = 2.7, W * 0.5
        porta = None
    imp = 2.3
    fori = [M.arco_punti(xb, imp, wb, 'tondo', n=14)]
    if porta: fori.append(M.arco_punti(porta[0], 2.5 - porta[1] / 2, porta[1], 'tondo', n=10))
    M.lastra(V, [(0, -1.5), (W, -1.5), (W, H0), (0, H0)], fori, -T, 0, 'conci')
    for f in fori: M.conci_arco(V, f[2:], 0.42 if f is fori[0] else 0.3, -0.12, 0.05)
    V.blocco(0.4, W - 0.4, -0.2, H0 - 0.4, -T - 0.7, -T - 0.5, 'scuro', smusso=0)       # il buio dell'interno
    if porta:
        K.anta(V, porta[0] - 0.56, porta[0] + 0.56, 0, 2.5 - porta[1] / 2 + porta[1] / 2 - 0.02, -0.42, -0.34, 'legnoScuro',
               arco=(porta[0], 2.5 - porta[1] / 2, porta[1] / 2))
    # la bottega chiusa: le imposte fino all'imposta dell'arco
    K.anta(CH, xb - wb / 2 + 0.02, xb - 0.01, 0, imp, -0.42, -0.34, 'legnoScuro')
    K.anta(CH, xb + 0.01, xb + wb / 2 - 0.02, 0, imp, -0.42, -0.34, 'legnoScuro')
    # la bottega aperta: lo sportello di sopra alzato a tettoia, quello di sotto abbassato a banco, la merce
    AP.solido([(x, y, z + dz) for x in (xb - wb / 2, xb + wb / 2) for y, z in ((-0.1, imp), (0.95, imp + 0.45)) for dz in (0, 0.05)], 'legno', 0)
    for s in (-1, 1): trave(AP, (xb + s * (wb / 2 - 0.1), 0.85, imp + 0.4), (xb + s * (wb / 2 - 0.1), 0.02, imp - 0.5), 0.05, 'legnoScuro')
    AP.blocco(xb - wb / 2 + 0.05, xb + wb / 2 - 0.05, 0.78, 0.86, -0.1, 0.6, 'legno', smusso=0)
    for s in (-1, 1): AP.blocco(xb + s * (wb / 2 - 0.2) - 0.05, xb + s * (wb / 2 - 0.2) + 0.05, 0, 0.78, 0.45, 0.55, 'legnoScuro', smusso=0)
    for k in range(int(wb / 0.55)):
        x = xb - wb / 2 + 0.3 + k * 0.55
        AP.blocco(x - 0.2, x + 0.2, 0.86, 0.86 + R.uniform(0.15, 0.35), 0.0, R.uniform(0.3, 0.5), R.choice(['tela', 'legno', 'cesta']), smusso=0)

    # --- i piani alti
    zf = sporto
    xs = finestre_x(W)
    if fin == 'legno':
        fin_r = [[(x - 0.4, H0 + p * HP + 0.95), (x + 0.4, H0 + p * HP + 0.95), (x + 0.4, H0 + p * HP + 2.15), (x - 0.4, H0 + p * HP + 2.15)]
                 for p in range(piani) for x in xs]
        # le tavole, l'intelaiatura, le travi dei solai
        M.lastra(V, [(0, H0), (W, H0), (W, Hm), (0, Hm)], fin_r, zf - 0.25, zf, 'legno')
        for x in [0.08, W - 0.08] + [(xs[i] + xs[i + 1]) / 2 for i in range(len(xs) - 1)]:
            V.blocco(x - 0.1, x + 0.1, H0, Hm, zf, zf + 0.06, 'legnoScuro', smusso=0)
        for p in range(piani + 1):
            z = H0 + p * HP
            V.blocco(0, W, z - 0.12, z + 0.06, zf, zf + 0.07, 'legnoScuro', smusso=0)
        for f in fin_r:
            (x0, z0), (x1, _), (_, z1), _ = f
            V.blocco(x0 - 0.5, x1 + 0.5, z0 - 0.4, z1 + 1.0, zf - 0.33, zf - 0.3, 'scuro', smusso=0)   # il buio dietro, largo: da sotto non si vede il tetto
            V.blocco(x0 - 0.06, x1 + 0.06, z0 - 0.06, z0, zf, zf + 0.08, 'legnoScuro', smusso=0)
            imposte(V, (x0 + x1) / 2, z0, x1 - x0, z1 - z0, zf + 0.06, R.random() < 0.45)
        # lo sporto: l'impalcato, le mensole, i saettoni
        V.blocco(0, W, H0 - 0.12, H0 + 0.02, 0, zf, 'legno', smusso=0)
        nb = max(2, round(W / 0.9))
        for i in range(nb):
            x = (i + 0.5) * W / nb
            V.blocco(x - 0.09, x + 0.09, H0 - 0.36, H0 - 0.12, -0.3, zf + 0.08, 'legnoScuro', smusso=0)
            if i % 2 == 0: trave(V, (x, 0.02, H0 - 1.45), (x, zf * 0.85, H0 - 0.3), 0.12, 'legnoScuro')
    else:
        fin_a = [[(px, pz + H0 + p * HP + 0.95) for px, pz in M.arco_punti(x, 1.5 - 0.4, 0.8, 'tondo', n=10)] for p in range(piani) for x in xs]
        M.lastra(V, [(0, H0), (W, H0), (W, Hm), (0, Hm)], fin_a, -T, 0, sopra)
        for f in fin_a:
            M.conci_arco(V, f[2:], 0.22, -0.08, 0.04)
            x0, x1, z0 = f[0][0], f[1][0], f[0][1]
            V.blocco(x0 - 0.1, x1 + 0.1, z0 - 0.1, z0, -0.05, 0.1, 'conci', smusso=0)                   # il davanzale
            V.blocco(x0 - 0.5, x1 + 0.5, z0 - 0.4, z0 + 2.3, -T - 0.1, -T - 0.07, 'scuro', smusso=0)        # il buio dietro, largo: da sotto non si vede il tetto
            imposte(V, (x0 + x1) / 2, z0, x1 - x0, 1.1, -0.25, R.random() < 0.5)
        for p in range(piani):                                                                          # i marcapiani
            z = H0 + p * HP
            V.blocco(-0.02, W + 0.02, z - 0.16, z, -0.07, 0.1, 'conci', smusso=0)

    # --- i fianchi e il retro, ciechi (muri in comune con le case accanto)
    V.blocco(0, T, -1.5, H0, -D, -T, 'conci' if fin == 'pietra' else 'pietrame', smusso=0)
    V.blocco(W - T, W, -1.5, H0, -D, -T, 'conci' if fin == 'pietra' else 'pietrame', smusso=0)
    lato_sopra = 'legno' if fin == 'legno' else sopra if fin == 'pietra' else 'pietrame'
    V.blocco(0, 0.3, H0, Hm, -D, zf - 0.25 if fin == 'legno' else -T, lato_sopra, smusso=0)
    V.blocco(W - 0.3, W, H0, Hm, -D, zf - 0.25 if fin == 'legno' else -T, lato_sopra, smusso=0)
    V.blocco(0, W, -1.5, Hm, -D, -D + T, 'pietrame', smusso=0)
    tetto(V, W, zf + 0.75, -D - 0.5, Hm)

    # --- da lontano: un volume, la bottega scura, il tetto
    LO.blocco(0, W, -1.5, H0, -D, 0, 'conci', smusso=0)
    LO.blocco(0, W, H0, Hm, -D, zf, sopra if fin != 'pietra' else 'conci', smusso=0)
    LO.blocco(xb - wb / 2, xb + wb / 2, 0, imp + wb / 2 - 0.2, 0.0, 0.02, 'scuro', smusso=0)
    for p in range(piani):
        for x in xs: LO.blocco(x - 0.4, x + 0.4, H0 + p * HP + 0.95, H0 + p * HP + 2.25, zf, zf + 0.02, 'scuro', smusso=0)
    sal = (zf + 0.75 + D + 0.5) / 2 * 0.42
    ym = (zf + 0.75 - D - 0.5) / 2
    for (ya, yb) in ((zf + 0.75, ym), (-D - 0.5, ym)):
        LO.solido([(x, yy, zz + dz) for x in (-0.25, W + 0.25) for (yy, zz) in ((ya, Hm), (yb, Hm + sal)) for dz in (0, 0.12)], 'coppi', 0)
    LO.solido([(x, y, z) for x in (0, W) for (y, z) in ((zf, Hm), (-D, Hm), (ym, Hm + sal - 0.05))], sopra if fin != 'pietra' else 'conci', 0)

    return [p.crea() for p in (V, CH, AP, LO)], Hm


def esporta(oggetti, nome):
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in oggetti: o.select_set(True)
    bpy.context.view_layer.objects.active = oggetti[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, nome + '.glb'), export_format='GLB', use_selection=True,
                              export_yup=True, export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_texcoords=True, export_animations=False)
    return {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in oggetti}


if __name__ == '__main__':
    indice = {}
    for W in LARGHEZZE:
        for piani in PIANI:
            for fin in FINITURE:
                nome = f'casa-{int(W * 10)}-{piani}-{fin}'
                M.prepara()
                for extra, col in {'tela': (0.75, 0.68, 0.5), 'cesta': (0.55, 0.42, 0.24), 'legnoScuro': (0.2, 0.14, 0.1)}.items():
                    if extra not in K.MATERIALI:
                        m = bpy.data.materials.new(extra); m.use_nodes = True
                        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col + (1,)
                        K.MATERIALI[extra] = m
                oggetti, Hm = casa(W, piani, fin, sum(ord(c) * (i + 1) for i, c in enumerate(nome)))     # seme fisso: hash() cambia a ogni avvio
                tri = esporta(oggetti, nome)
                indice[nome] = dict(W=W, D=D, piani=piani, finitura=fin, altezza=round(Hm, 2), sporto=0.9 if fin == 'legno' else 0, triangoli=tri)
                print('CASA', nome, tri)
    json.dump(indice, open(os.path.join(USCITA, 'indice.json'), 'w'), indent=1, sort_keys=True)
    print('FATTO', len(indice))
    if 'python' in os.path.basename(sys.executable): os._exit(0)
