# Disegna alcuni fotogrammi di una persona che fa un gesto, con l'attrezzo in mano, per guardare i
# movimenti senza Unity.   python gesti.py figura.glb movimenti.glb cartella-attrezzi uscita.png gesto[:attrezzo] …
# Cycles sul processore. L'attrezzo segue la persona con la «presa» scritta in indice.json (attrezzi.py):
# due mani, impugnato (gesto:attrezzo:asse per provare un asse dell'osso della mano), appeso, verticale, palmo, sedile.
import bpy, sys, math, os
from mathutils import Vector, Matrix
figura, movimenti, attrezzi, uscita, gesti = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:]
FOT = 4
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=movimenti)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)      # restano le azioni
azioni = {a.name: a for a in bpy.data.actions}
bpy.ops.import_scene.gltf(filepath=figura)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
arm.animation_data_create()
sc = bpy.context.scene
bpy.ops.mesh.primitive_plane_add(size=40)
sole = bpy.data.objects.new('sole', bpy.data.lights.new('sole', 'SUN')); sole.data.energy = 3.5; sole.rotation_euler = (math.radians(50), 0, math.radians(35)); sc.collection.objects.link(sole)
sc.world = bpy.data.worlds.new('cielo'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.75, 0.82, 0.95, 1)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (2.4, -4.6, 1.5); cam.data.lens = 50
cam.rotation_euler = (Vector((0, 0, 0.95)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12; sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y = 380, 520
mano = next((b.name for b in arm.pose.bones if b.name in ('RightHand', 'hand.R', 'RHand')), None)
tmp = os.path.join(os.path.dirname(uscita), '_gesti'); os.makedirs(tmp, exist_ok=True)
import json
indice = json.load(open(os.path.join(attrezzi, 'indice.json')))
righe = []
for g in gesti:
    nome, _, attrezzo = g.partition(':')
    if nome not in azioni: print('MANCA', nome); continue
    arm.animation_data.action = azioni[nome]
    # da Blender 4.4 un'azione ha delle «caselle»: senza sceglierne una l'azione non muove niente
    if hasattr(arm.animation_data, 'action_slot') and azioni[nome].slots: arm.animation_data.action_slot = azioni[nome].slots[0]
    attrezzo, _, asse = attrezzo.partition(':')
    ogg = None
    if attrezzo:
        prima = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(attrezzi, attrezzo + '.glb'))
        ogg = next(o for o in bpy.data.objects if o not in prima and o.type == 'MESH')
        ogg.parent = None; ogg.rotation_mode = 'QUATERNION'
    presa = indice.get(attrezzo, {}).get('presa'); testa = indice.get(attrezzo, {}).get('testa', 0)
    a0, a1 = azioni[nome].frame_range; riga = []
    sedile = None
    for k in range(FOT):
        sc.frame_set(int(a0 + (a1 - a0) * k / FOT)); bpy.context.view_layer.update()
        if ogg:
            W = arm.matrix_world; osso = lambda n: arm.pose.bones[n]
            palmo = lambda n: W @ (osso(n).head + (osso(n).tail - osso(n).head) * 0.7)
            D, S = palmo('RightHand'), palmo('LeftHand'); su = Vector((0, 0, 1)); p = D; d = su
            if presa == 'due mani':
                d = (S - D).normalized(); petto = W @ osso('Spine1').head
                if d.dot((D + S) / 2 - petto) < 0: d = -d          # la testa dell'attrezzo lontano dal petto
                d = d * (testa or 1)
            elif presa == 'impugnato':
                M = (W @ osso('RightHand').matrix).to_3x3()
                d = {'x': M.col[0], '-x': -M.col[0], 'z': M.col[2], '-z': -M.col[2], 'y': M.col[1]}[asse or indice[attrezzo].get('asse') or 'x'].normalized()
            elif presa == 'verticale': p = D
            elif presa == 'palmo': p = S + Vector((0, 0, 0.03))
            elif presa == 'appeso': p = (S if indice[attrezzo].get('mano') == 'sinistra' else D) - Vector((0, 0, 0.04))
            elif presa == 'sedile':
                if sedile is None: h = W @ osso('Hips').head; sedile = Vector((h.x, h.y + 0.05, h.z - 0.12))
                p = sedile
            ogg.location = p; ogg.rotation_quaternion = su.rotation_difference(d)
        f = os.path.join(tmp, f'{g.replace(":", "-")}-{k}.png'); sc.render.filepath = f
        bpy.ops.render.render(write_still=True); riga.append(f)
    righe.append((nome + (' + ' + attrezzo if attrezzo else '') + (' (asse ' + asse + ')' if asse else ''), riga))
    if ogg: bpy.data.objects.remove(ogg, do_unlink=True)
    print('GESTO', nome)
# la tavola: una riga per gesto, con il nome
import json
json.dump(righe, open(os.path.join(tmp, 'righe.json'), 'w'))
print('FATTO'); os._exit(0)
