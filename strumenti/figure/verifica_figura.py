# Costruisce alcune figure e le disegna di fronte e di lato.  blender -b --python verifica_figura.py -- 0 9 16
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figure as fg
OUT = '/private/tmp/claude-501/-Users-domenicoperroni/717308de-80cd-40e2-89ef-034c91c18b2f/scratchpad/verifica'
numeri = [int(x) for x in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else [0]
for n in numeri:
    rig, info = fg.crea(fg.VARIANTI[n])
    print('INFO', info)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x, sc.render.resolution_y = 300, 420
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam); sc.camera = cam
    for vista, (pos, rot) in {'fronte': ((0, -3.0, 0.95), (math.pi / 2, 0, 0)), 'lato': ((3.0, 0, 0.95), (math.pi / 2, 0, math.pi / 2)), 'retro': ((0, 3.0, 0.95), (math.pi / 2, 0, math.pi))}.items():
        cam.location = pos; cam.rotation_euler = rot
        sc.render.filepath = os.path.join(OUT, f'figura-{n:02d}-{vista}.png')
        bpy.ops.render.render(write_still=True)
