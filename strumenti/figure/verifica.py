# Disegna alcuni fotogrammi di una clip su un corpo MPFB, per controllare
# a occhio il trasferimento dei movimenti.  blender -b --python verifica.py -- cammina
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import movimenti as mv
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

clip = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'cammina'
OUT = '/private/tmp/claude-501/-Users-domenicoperroni/717308de-80cd-40e2-89ef-034c91c18b2f/scratchpad/verifica'
os.makedirs(OUT, exist_ok=True)
mv.pulisci()
corpo = HumanService.create_human()
HumanService.add_builtin_rig(corpo, 'cmu_mb')
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
file, tipo = mv.CLIP[clip]
path = os.path.join(mv.QUI, 'mocap', file)
bpy.ops.import_anim.bvh(filepath=path, axis_forward='-Z', axis_up='Y', rotate_mode='NATIVE', use_fps_scale=False)
src = bpy.context.object
fot = mv.trasferisci(arm, src, mv.tempo_fotogramma(path), clip)
tratto, d = mv.ritaglia(fot, tipo)
tratto = mv.raddrizza(tratto, tipo, arm.data.bones['Hips'].matrix_local.to_3x3().normalized())
info = mv.scrivi_azione(arm, clip, tratto, tipo)
bpy.data.objects.remove(src, do_unlink=True)
corpo.modifiers['Hide helpers'].show_render = True
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x, sc.render.resolution_y = 360, 480
sc.display.shading.light = 'STUDIO'
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam); sc.camera = cam
n = info['fotogrammi']
for k, f in enumerate([0, n // 4, n // 2, 3 * n // 4]):
    for vista, (pos, rot) in {'lato': ((3.2, 0, 1.0), (math.pi / 2, 0, math.pi / 2)), 'fronte': ((0, -3.2, 1.0), (math.pi / 2, 0, 0))}.items():
        sc.frame_set(f)
        cam.location = pos; cam.rotation_euler = rot
        sc.render.filepath = os.path.join(OUT, f'{clip}-{vista}-{k}.png')
        bpy.ops.render.render(write_still=True)
print('VERIFICA', clip, info)
