# =====================================================================
# I MOVIMENTI: dal database CMU allo scheletro cmu_mb di MPFB.
#
#   blender -b --python movimenti.py
#
# Scrive ../../public/figure/movimenti.glb (solo lo scheletro con le
# animazioni) e ../../public/figure/movimenti.json (durata e velocità di
# ogni clip, per sincronizzare il passo con lo spostamento nel modello).
#
# Il trasferimento: il primo fotogramma di ogni BVH della conversione
# cgspeed è una posa a T. Per ogni osso si calcola quanto ha ruotato,
# nello spazio del mondo, rispetto a quella posa, e si applica la stessa
# rotazione allo scheletro di destinazione messo anche lui in posa a T.
# Funziona perché i due scheletri hanno gli stessi nomi e la stessa
# struttura, e guardano entrambi verso -Y.
#
# Dati: CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu),
# conversione BVH di B. Hahne (cgspeed). Uso libero, anche in prodotti;
# non si ridistribuiscono i file grezzi: per questo mocap/ è fuori da git.
# =====================================================================
import bpy, os, json, math, sys
from mathutils import Matrix, Vector, Quaternion
from bl_ext.user_default.mpfb.services.humanservice import HumanService

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'figure'))
FPS = 30

# nome della clip -> (file, tipo). «ciclo»: si cerca un passo intero che
# si ripeta; «tratto»: un tratto lungo con estremi simili
CLIP = {
    'cammina': ('08_01.bvh', 'ciclo'),
    'cammina2': ('35_01.bvh', 'ciclo'),
    'cammina_lento': ('37_01.bvh', 'ciclo'),
    'passeggia': ('104_19.bvh', 'ciclo'),
    'fermo': ('77_02.bvh', 'tratto'),
    'attesa': ('141_20.bvh', 'tratto'),
    'guarda': ('77_01.bvh', 'tratto'),
    'parla': ('18_08.bvh', 'tratto'),
}


def pulisci():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)


def tempo_fotogramma(path):
    with open(path) as f:
        for riga in f:
            if riga.startswith('Frame Time:'):
                return float(riga.split(':')[1])
    return 1 / 120


def ordine(arm):
    """Ossa dal genitore ai figli."""
    out = []
    def visita(b):
        out.append(b)
        for c in b.children:
            visita(c)
    for b in arm.data.bones:
        if b.parent is None:
            visita(b)
    return out


def rotazioni_mondo(obj):
    return {pb.name: (obj.matrix_world @ pb.matrix).to_3x3().normalized() for pb in obj.pose.bones}


def direzioni_mondo(obj):
    out = {}
    for pb in obj.pose.bones:
        d = (obj.matrix_world @ pb.tail) - (obj.matrix_world @ pb.head)
        out[pb.name] = d.normalized() if d.length > 1e-6 else None
    return out


ARTI = {'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand',
        'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'}


def posa_T_destinazione(arm, dir_src_T):
    """Rotazione (spazio armatura) di ogni osso di destinazione in posa a T:
    l'osso a riposo viene girato il minimo indispensabile perché punti
    come il corrispondente osso del BVH nel fotogramma a T."""
    R = {}
    for b in arm.data.bones:
        rest = b.matrix_local.to_3x3().normalized()
        d_rest = (b.tail_local - b.head_local).normalized()
        d_src = dir_src_T.get(b.name)
        # si raddrizzano solo braccia e gambe: clavicole, schiena e collo
        # restano come sono, o le spalle si alzano
        if b.name in ARTI and d_src is not None and b.length > 1e-4:
            R[b.name] = d_rest.rotation_difference(d_src).to_matrix() @ rest
        else:
            R[b.name] = rest
    return R


def trasferisci(arm, src, ft, nome):
    sc = bpy.context.scene
    passo = max(1, round((1 / FPS) / ft))
    act = src.animation_data.action
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
    sc.frame_set(f0)
    R_srcT = rotazioni_mondo(src)
    dir_srcT = direzioni_mondo(src)
    R_T = posa_T_destinazione(arm, dir_srcT)
    hips_T = (src.matrix_world @ src.pose.bones['Hips'].head).copy()
    altezza_src = hips_T.z
    altezza_dst = arm.data.bones['Hips'].head_local.z
    scala = altezza_dst / max(1e-6, altezza_src)

    ossa = ordine(arm)
    rest = {b.name: b.matrix_local.to_3x3().normalized() for b in arm.data.bones}
    fotogrammi = []
    for f in range(f0 + 1, f1 + 1, passo):       # si salta la posa a T
        sc.frame_set(f)
        R_src = rotazioni_mondo(src)
        R_des, base = {}, {}
        for b in ossa:
            n = b.name
            if n in R_src:
                delta = R_src[n] @ R_srcT[n].inverted()
                R_des[n] = delta @ R_T[n]
            else:
                # osso senza corrispondente: segue il genitore
                p = b.parent
                R_des[n] = (R_des[p.name] @ (rest[p.name].inverted() @ rest[n])) if p else rest[n]
            if b.parent:
                p = b.parent.name
                rel = rest[p].inverted() @ rest[n]
                base[n] = (rel.inverted() @ R_des[p].inverted() @ R_des[n]).to_quaternion()
            else:
                base[n] = (rest[n].inverted() @ R_des[n]).to_quaternion()
        h = src.matrix_world @ src.pose.bones['Hips'].head
        fotogrammi.append({'q': base, 'h': (h - hips_T) * scala})
    return fotogrammi


def distanza(a, b, ossa):
    d = 0
    for n in ossa:
        d += a['q'][n].rotation_difference(b['q'][n]).angle
    return d + abs(a['h'].z - b['h'].z) * 20


def ritaglia(fot, tipo):
    """Sceglie un tratto che si possa ripetere senza scatti."""
    chiave = ['Hips', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm', 'Spine', 'Head']
    n = len(fot)
    if tipo == 'ciclo':
        lmin, lmax = int(0.9 * FPS), int(1.5 * FPS)
        inizio = range(int(n * 0.15), max(int(n * 0.15) + 1, n - lmax))
    else:
        lmin, lmax = int(4 * FPS), int(9 * FPS)
        inizio = range(0, max(1, n - lmin))
    best = None
    for i in inizio:
        for L in range(lmin, min(lmax, n - i - 1) + 1):
            d = distanza(fot[i], fot[i + L], chiave)
            if tipo == 'tratto':
                d -= L * 0.002          # a parità di somiglianza, meglio lungo
            if best is None or d < best[0]:
                best = (d, i, L)
    _, i, L = best
    return fot[i:i + L + 1], best[0]


def raddrizza(fot, tipo, rest_root):
    """Gira tutta la clip attorno alla verticale: chi cammina va verso -Y,
    chi sta fermo guarda verso -Y in media. I soggetti CMU si voltano
    durante le registrazioni; nel modello la direzione la decide il codice."""
    if tipo == 'ciclo':
        v = fot[-1]['h'] - fot[0]['h']
        fx, fy = v.x, v.y
    else:
        fx = fy = 0
        for f in fot:
            rrel = rest_root @ f['q']['Hips'].to_matrix() @ rest_root.inverted()
            d = rrel @ Vector((0, -1, 0))
            fx += d.x; fy += d.y
    # rotazione attorno a Z che porta la direzione (fx, fy) su (0, -1)
    C = Matrix.Rotation(-math.pi / 2 - math.atan2(fy, fx), 3, 'Z')
    for f in fot:
        R = rest_root @ f['q']['Hips'].to_matrix()
        f['q']['Hips'] = (rest_root.inverted() @ C @ R).to_quaternion()
        f['h'] = C @ f['h']
    return fot


def scrivi_azione(arm, nome, fot, tipo):
    act = bpy.data.actions.new(nome)
    act.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    # spostamento delle anche: si toglie l'avanzamento, resta l'oscillazione
    h0 = fot[0]['h'].copy(); h1 = fot[-1]['h'].copy()
    L = len(fot) - 1
    avanz = (h1 - h0)
    rest_h = arm.data.bones['Hips'].matrix_local.to_3x3().normalized()
    for k, f in enumerate(fot):
        t = k / max(1, L)
        # l'ultimo fotogramma ripete il primo: il ciclo si chiude senza scatto
        g = fot[0] if k == L else f
        off = g['h'] - (h0 + avanz * (0 if k == L else t))
        off.z = g['h'].z                 # quota rispetto alla posa a T
        for pb in arm.pose.bones:
            q = g['q'][pb.name]
            if k > 0 and pb.rotation_quaternion.dot(q) < 0:
                q = -q
            pb.rotation_quaternion = q
            pb.keyframe_insert('rotation_quaternion', frame=k)
        hb = arm.pose.bones['Hips']
        hb.location = rest_h.inverted() @ Vector((off.x, off.y, off.z))
        hb.keyframe_insert('location', frame=k)
    durata = L / FPS
    velocita = Vector((avanz.x, avanz.y, 0)).length / durata if tipo == 'ciclo' else 0
    return {'durata': round(durata, 3), 'velocita': round(velocita, 3), 'fotogrammi': L + 1}


def main():
    pulisci()
    bpy.context.scene.render.fps = FPS
    corpo = HumanService.create_human()
    HumanService.add_builtin_rig(corpo, 'cmu_mb')
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.name = 'scheletro'
    print('MATRICE ARMATURA', [round(v, 4) for r in arm.matrix_world for v in r])
    info = {}
    for nome, (file, tipo) in CLIP.items():
        path = os.path.join(QUI, 'mocap', file)
        if not os.path.exists(path):
            print('MANCA', path); continue
        bpy.ops.import_anim.bvh(filepath=path, axis_forward='-Z', axis_up='Y', rotate_mode='NATIVE', use_fps_scale=False)
        src = bpy.context.object
        fot = trasferisci(arm, src, tempo_fotogramma(path), nome)
        tratto, d = ritaglia(fot, tipo)
        tratto = raddrizza(tratto, tipo, arm.data.bones['Hips'].matrix_local.to_3x3().normalized())
        info[nome] = scrivi_azione(arm, nome, tratto, tipo)
        info[nome]['fonte'] = 'CMU ' + file.replace('.bvh', '')
        info[nome]['scarto_chiusura'] = round(d, 3)
        bpy.data.objects.remove(src, do_unlink=True)
        print('CLIP', nome, info[nome])
    # via il corpo: nel file restano solo lo scheletro e le azioni
    for o in list(bpy.data.objects):
        if o.type == 'MESH':
            bpy.data.objects.remove(o, do_unlink=True)
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_quaternion = Quaternion(); pb.location = Vector()
    os.makedirs(USCITA, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    # Il campionamento scrive per ogni osso anche posizione e scala, che sono
    # quelle di questo scheletro di riferimento (un adulto). La città le
    # scarta e tiene solo le rotazioni e la posizione delle anche
    # (src/mondo/figure.js): altrimenti un ragazzo prenderebbe le misure
    # dell'adulto.
    bpy.ops.export_scene.gltf(filepath=os.path.join(USCITA, 'movimenti.glb'), export_format='GLB', use_selection=True,
                              export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
                              export_frame_range=False, export_anim_single_armature=True, export_yup=True)
    with open(os.path.join(USCITA, 'movimenti.json'), 'w') as f:
        json.dump(info, f, indent=1)
    print('FATTO', USCITA)


if __name__ == "__main__":
    main()
