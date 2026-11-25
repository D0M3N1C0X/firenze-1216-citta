# Disegna con Cycles (solo processore, niente scheda grafica) alcuni modelli glTF affiancati, per guardarli
# senza Unity:  python anteprima.py uscita.png file1.glb file2.glb …   (PASSO = distanza tra i modelli, SUOLO = quota del piano)
import bpy, sys, math, os
from mathutils import Vector
uscita, files = sys.argv[1], sys.argv[2:]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
PASSO = float(os.environ.get('PASSO', '1.3'))
x = 0.0; alto = 0.0
for k, f in enumerate(files):
    prima = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f)
    nuovi = [o for o in bpy.data.objects if o not in prima]
    for o in nuovi:
        if o.parent is None: o.location.x += k * PASSO
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in nuovi if o.type == 'MESH' for c in o.bound_box]
    if pts: alto = max(alto, max(p.z for p in pts) - min(0, min(p.z for p in pts)))
x = (len(files) - 1) * PASSO
# colori nei vertici: solo per i materiali di maglie che hanno davvero un attributo colore, e senza texture né colore proprio già collegato
for o in bpy.data.objects:
    if o.type != 'MESH' or not o.data.color_attributes: continue
    nome = o.data.color_attributes[0].name
    for m in o.data.materials:
        if not m or not m.use_nodes: continue
        b = m.node_tree.nodes.get('Principled BSDF')
        if b and not b.inputs['Base Color'].is_linked:
            a = m.node_tree.nodes.new('ShaderNodeVertexColor'); a.layer_name = nome; m.node_tree.links.new(a.outputs['Color'], b.inputs['Base Color'])
bpy.ops.mesh.primitive_plane_add(size=60, location=(x / 2, 0, float(os.environ.get('SUOLO', '0'))))
sc = bpy.context.scene
sole = bpy.data.objects.new('sole', bpy.data.lights.new('sole', 'SUN')); sole.data.energy = 3.5; sole.rotation_euler = (math.radians(50), 0, math.radians(35)); sc.collection.objects.link(sole)
sc.world = bpy.data.worlds.new('cielo'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.75, 0.82, 0.95, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.9
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
d = max(x * 1.55, alto * 1.3) + 1.5      # 50 mm: il campo largo è circa 0,72 volte la distanza
cam.location = (x / 2 + d * 0.5, -d, alto * 0.9); cam.data.lens = 50
dir = Vector((x / 2, 0, alto * 0.5)) - cam.location; cam.rotation_euler = dir.to_track_quat('-Z', 'Y').to_euler()
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y = 1500, 700; sc.render.filepath = uscita
bpy.ops.render.render(write_still=True)
print('FATTO', uscita); os._exit(0)
