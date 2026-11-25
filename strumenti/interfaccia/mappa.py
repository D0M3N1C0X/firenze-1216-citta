# La mappa della città per l'app (25 novembre 2026): una pianta disegnata come quelle antiche, inchiostro bruno su
# pergamena, dai dati della città (Assets/Dati/citta-<epoca>.json): l'Arno, le case (una per lotto), le strade e le
# piazze, le mura e le porte, i luoghi della storia con il loro nome. In alto la rosa dei venti e il cartiglio.
#   python3 mappa.py 1216   e   python3 mappa.py 1300
# Scrive Assets/Interfaccia/Mappa/mappa-<epoca>.png (2048 × 2048) e mappa-<epoca>.json (il riquadro in metri, per
# mettere sulla mappa chi gioca). Coordinate del browser: x verso est, z verso sud (il nord è in alto).
import json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

QUI = os.path.dirname(os.path.abspath(__file__))
UNITY = os.path.abspath(os.path.join(QUI, '..', '..', '..', 'unity', 'Firenze1216', 'Assets'))
epoca = sys.argv[1] if len(sys.argv) > 1 else '1216'
d = json.load(open(os.path.join(UNITY, 'Dati', f'citta-{epoca}.json')))
LATO = 2048
X0, X1, Z0, Z1 = (-560, 640, -880, 320) if epoca == '1300' else (-480, 520, -780, 220)
S = LATO / max(X1 - X0, Z1 - Z0)
P = lambda x, z: ((x - X0) * S, (z - Z0) * S)
CARTA, INCH, ACQUA, CASE, ROSSO = (236, 222, 188), (74, 52, 32), (168, 178, 160), (196, 170, 128), (128, 38, 26)
R = random.Random(1216)
CAR = os.path.join(UNITY, 'Interfaccia', 'Caratteri')
f_tit = ImageFont.truetype(os.path.join(CAR, 'Cinzel-SemiBold.ttf'), 64)
f_luogo = ImageFont.truetype(os.path.join(CAR, 'EBGaramond-Italic.ttf'), 26)
f_porta = ImageFont.truetype(os.path.join(CAR, 'Cinzel-SemiBold.ttf'), 18)

im = Image.new('RGB', (LATO, LATO), CARTA)
dr = ImageDraw.Draw(im)
pts = lambda a: [P(a[i], a[i + 1]) for i in range(0, len(a) - 1, 2)]

# l'Arno, con una riga d'onde lungo le rive
f = pts(d['fiume'])
dr.polygon(f, fill=ACQUA)
dr.line(f + [f[0]], fill=INCH, width=3)
# le case: un rettangolo per lotto, un po' mosso a mano
for c in d['case']:
    tx, tz = c['nz'], -c['nx']
    a = [(0, 0), (c['w'], 0), (c['w'], c['d']), (0, c['d'])]
    poly = [P(c['x'] + tx * u + c['nx'] * v + R.uniform(-0.3, 0.3), c['z'] + tz * u + c['nz'] * v + R.uniform(-0.3, 0.3)) for u, v in a]
    dr.polygon(poly, fill=CASE if c.get('tipo') != 'torre' else (176, 140, 98), outline=(150, 120, 84))
# le piazze e le strade: la carta resta chiara; un filo d'inchiostro ai lati delle strade principali
for s in d['strade']:
    p = pts(s['punti'])
    if len(p) < 2: continue
    if s.get('piazza'): dr.polygon(p, fill=(232, 216, 178), outline=(150, 120, 84)); continue
    w = max(2, int((s.get('larghezza') or 3) * S))
    dr.line(p, fill=(232, 216, 178), width=w, joint='curve')
# le mura e le porte
for nome in ('cerchia1172', 'cerchiaNuova'):
    if d.get(nome):
        m = pts(d[nome]); dr.line(m + [m[0]], fill=INCH, width=7)
        for i in range(0, len(m), 3): dr.ellipse([m[i][0] - 5, m[i][1] - 5, m[i][0] + 5, m[i][1] + 5], fill=INCH)
for p in d.get('porte', []):
    x, y = P(*p['pos'][:2]); dr.rectangle([x - 9, y - 9, x + 9, y + 9], fill=ROSSO, outline=INCH)
# un po' di grana e di macchie della carta
grana = Image.effect_noise((LATO, LATO), 24).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 210 + v // 6)
im = ImageChops.multiply(im, Image.merge('RGB', [grana] * 3))
macchie = Image.effect_noise((LATO // 16, LATO // 16), 60).resize((LATO, LATO), Image.BICUBIC).filter(ImageFilter.GaussianBlur(30)).point(lambda v: 200 + v // 5)
im = ImageChops.multiply(im, Image.merge('RGB', [macchie] * 3))
dr = ImageDraw.Draw(im)
# i luoghi della storia: un tondo rosso e il nome; le schede generali (strade, case, fiume, cerchia) non sono un punto.
# Le scritte non si sovrappongono: per ogni nome si prova a destra, a sinistra, sopra e sotto il tondo.
GENERALI = {'strade', 'fiume', 'case', 'cerchia'}
occupati = []
def libero(r): return all(r[2] < o[0] or r[0] > o[2] or r[3] < o[1] or r[1] > o[3] for o in occupati)
luoghi = [l for l in d['luoghi'] if l.get('pos') and l['id'] not in GENERALI]
for l in luoghi:
    x, y = P(*l['pos'][:2]); occupati.append((x - 9, y - 9, x + 9, y + 9))
for l in luoghi:
    x, y = P(*l['pos'][:2])
    dr.ellipse([x - 8, y - 8, x + 8, y + 8], fill=ROSSO, outline=INCH, width=2)
    w = dr.textlength(l['nome'], font=f_luogo); h = 30
    for ox, oy in ((12, -15), (-12 - w, -15), (-w / 2, -42), (-w / 2, 12), (12, 8), (12, -38), (-12 - w, 8), (-12 - w, -38)):
        r = (x + ox, y + oy, x + ox + w, y + oy + h)
        if libero(r): break
    occupati.append(r)
    dr.text((r[0], r[1]), l['nome'], font=f_luogo, fill=INCH, stroke_width=3, stroke_fill=(240, 228, 198))
# il titolo nel cartiglio e la rosa dei venti
titolo = 'FIRENZE · MCCXVI' if epoca == '1216' else 'FIRENZE · MCCC'
tw = dr.textlength(titolo, font=f_tit)
dr.rectangle([60, 50, 100 + tw, 150], fill=(240, 228, 198), outline=INCH, width=4)
dr.text((80, 62), titolo, font=f_tit, fill=ROSSO)
cx, cy, r = LATO - 170, 170, 110
for k in range(16):
    a = k * math.pi / 8; lung = r if k % 4 == 0 else r * (0.6 if k % 2 == 0 else 0.4)
    q = [(cx + math.sin(a) * lung, cy - math.cos(a) * lung), (cx + math.sin(a + 0.25) * 16, cy - math.cos(a + 0.25) * 16), (cx, cy), (cx + math.sin(a - 0.25) * 16, cy - math.cos(a - 0.25) * 16)]
    dr.polygon(q, fill=ROSSO if k == 0 else INCH if k % 4 == 0 else (150, 120, 84))
dr.text((cx - 9, cy - r - 36), 'N', font=f_porta, fill=ROSSO)
# la scala: cento metri
x, y = 80, LATO - 90; L = 100 * S
dr.line([(x, y), (x + L, y)], fill=INCH, width=5)
for k in range(3): dr.line([(x + L * k / 2, y - 10), (x + L * k / 2, y + 10)], fill=INCH, width=3)
dr.text((x, y - 42), '100 m', font=f_porta, fill=INCH)
# i bordi più scuri, come una carta vecchia
v = Image.new('L', (LATO, LATO), 0); ImageDraw.Draw(v).rectangle([40, 40, LATO - 40, LATO - 40], fill=255)
v = v.filter(ImageFilter.GaussianBlur(60))
im = Image.composite(im, ImageChops.multiply(im, Image.new('RGB', (LATO, LATO), (170, 140, 100))), v)
out = os.path.join(UNITY, 'Interfaccia', 'Mappa'); os.makedirs(out, exist_ok=True)
im.save(os.path.join(out, f'mappa-{epoca}.png'), optimize=True)
json.dump({'x0': X0, 'z0': Z0, 'lato_metri': LATO / S, 'pixel': LATO}, open(os.path.join(out, f'mappa-{epoca}.json'), 'w'))
print('mappa', epoca, os.path.getsize(os.path.join(out, f'mappa-{epoca}.png')) // 1024, 'KB')
