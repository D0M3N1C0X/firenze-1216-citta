# Compone la tavola dei gesti dai fotogrammi di gesti.py:  python3 tavola.py cartella/_gesti uscita.png
import json, sys, os
from PIL import Image, ImageDraw
righe = json.load(open(os.path.join(sys.argv[1], 'righe.json')))
im0 = Image.open(righe[0][1][0]); w, h = im0.size; n = len(righe[0][1])
COL = 2; per = (len(righe) + COL - 1) // COL
tav = Image.new('RGB', (COL * (n * w + 20), per * (h + 26)), (245, 245, 245)); d = ImageDraw.Draw(tav)
for i, (nome, files) in enumerate(righe):
    cx, cy = (i // per) * (n * w + 20), (i % per) * (h + 26)
    d.text((cx + 6, cy + 6), nome, fill=(20, 20, 20))
    for k, f in enumerate(files): tav.paste(Image.open(f), (cx + k * w, cy + 26))
tav.save(sys.argv[2]); print('tavola', tav.size)
