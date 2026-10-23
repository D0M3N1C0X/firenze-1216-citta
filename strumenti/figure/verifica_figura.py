# Costruisce alcune figure e le disegna di fronte e di lato.  blender -b --python verifica_figura.py -- 0 9 16
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figure as fg
# le immagini di controllo restano fuori dal repository (.catture/ è ignorata); VERIFICA_OUT per cambiare cartella
OUT = os.environ.get('VERIFICA_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.catture', 'verifica')
os.makedirs(OUT, exist_ok=True)
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
