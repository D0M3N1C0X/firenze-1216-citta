# Le vedute dei luoghi per il rotolo delle schede dell'app (decisione del 23 novembre 2026: «vedute dalla città»).
#   python3 miniature.py cartella-catture prefisso [prefisso-uscita]
# Prende le catture della città nel browser (prefisso-<id>.png, una veduta dall'alto di tre quarti per luogo) e le
# ripassa come un disegno a inchiostro e acquerello: colori stesi a macchie, un po' sbiaditi verso il colore della carta,
# i contorni a inchiostro seppia, la grana della carta, i bordi che sfumano nella pergamena del rotolo.
# Scrive ../../../unity/Firenze1216/Assets/Interfaccia/Miniature/<uscita><id>.jpg (640 × 400).
# Sono vedute del modello, con le sue ipotesi: non immagini storiche.
import os, sys, random
from PIL import Image, ImageFilter, ImageOps, ImageChops, ImageEnhance, ImageDraw

QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(QUI, '..', '..', '..', 'unity', 'Firenze1216', 'Assets', 'Interfaccia', 'Miniature'))
CARTA = (238, 224, 190)
W, H = 640, 400

def acquerello(im, seme):
    R = random.Random(seme)
    im = ImageOps.fit(im.convert('RGB'), (W, H), Image.LANCZOS)
    # le macchie di colore: la tessitura delle pietre sparisce, restano i colori dei volumi
    base = im.filter(ImageFilter.MedianFilter(5))
    c = Image.blend(base.filter(ImageFilter.ModeFilter(5)), im.filter(ImageFilter.SMOOTH_MORE), 0.35)
    c = ImageEnhance.Brightness(c).enhance(1.12)
    c = ImageEnhance.Color(c).enhance(0.95)
    c = Image.blend(c, Image.new('RGB', (W, H), CARTA), 0.18)
    # i contorni a inchiostro: solo quelli dei volumi (dall'immagine già spianata), sottili
    g = ImageOps.grayscale(base).filter(ImageFilter.MedianFilter(3))
    bordi = g.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 30 else 0).filter(ImageFilter.GaussianBlur(0.7))
    bordi = ImageOps.invert(bordi.point(lambda v: min(255, int(v * 0.8))))
    seppia = Image.merge('RGB', [bordi.point(lambda v: int(70 + v * (255 - 70) / 255)), bordi.point(lambda v: int(50 + v * 205 / 255)), bordi.point(lambda v: int(30 + v * 225 / 255))])
    out = ImageChops.multiply(c, seppia)
    # la grana della carta
    grana = Image.effect_noise((W, H), 18).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: 225 + v // 9)
    out = ImageChops.multiply(out, Image.merge('RGB', [grana] * 3))
    # i bordi irregolari che sfumano nella carta
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    pts = []
    for k in range(48):
        t = k / 48
        if t < 0.25: x, y = t * 4 * W, 0
        elif t < 0.5: x, y = W, (t - 0.25) * 4 * H
        elif t < 0.75: x, y = W - (t - 0.5) * 4 * W, H
        else: x, y = 0, H - (t - 0.75) * 4 * H
        cx, cy = W / 2, H / 2
        f = 0.9 + R.uniform(-0.03, 0.03)
        pts.append((cx + (x - cx) * f, cy + (y - cy) * f))
    d.polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(14))
    return Image.composite(out, Image.new('RGB', (W, H), CARTA), m)

if __name__ == '__main__':
    cartella, prefisso = sys.argv[1], sys.argv[2]
    uscita = sys.argv[3] if len(sys.argv) > 3 else ''
    os.makedirs(OUT, exist_ok=True); n = 0
    for f in sorted(os.listdir(cartella)):
        if not (f.startswith(prefisso + '-') and f.endswith('.png')): continue
        idl = f[len(prefisso) + 1:-4]
        acquerello(Image.open(os.path.join(cartella, f)), hash(idl) & 0xffff).save(os.path.join(OUT, uscita + idl + '.jpg'), quality=84)
        n += 1
    print(n, 'vedute in', OUT)
