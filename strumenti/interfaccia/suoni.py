# I suoni dei tocchi dell'interfaccia dell'app (decisione del 17 novembre 2026: sintetizzati da codice).
#   python3 suoni.py   → ../../../unity/Firenze1216/Assets/Interfaccia/Suoni/*.wav (mono, 44,1 kHz, 16 bit)
#   carta     il fruscio di una pergamena che si srotola (rumore filtrato che sale e scende)
#   carta-chiudi  lo stesso, più breve, che si arrotola
#   sigillo   un tonfo sordo con un piccolo crepitio (la ceralacca)
#   legno     un colpo su legno (seno smorzato a 190 Hz con il suo armonico, e un clic)
#   medaglia  un tocco di metallo leggero (due parziali inarmoniche che si spengono)
# Per il racconto (scene recitate, Racconto.cs):
#   campane   due campane a distesa (parziali di campana: bordone, fondamentale, terza minore, quinta, ottava)
#   grido     un grido vicino, fuori dalla sala (voce sintetica: dente di sega con le formanti della «a»)
#   urla      grida lontane, oltre il ponte: più voci, filtrate dalla distanza
#   porta     il battente di legno di una chiesa che si chiude (cigolio e tonfo)
#   canto     un canto piano lontano, voci d'uomo sulla «o», in una navata (eco)
#   rumore    la gente che si agita in strada, sentita da dentro (brusio e voci)
# Per l'ambiente (Ambiente.cs, 24 novembre 2026): anelli che si ripetono senza stacco
#   brusio    la gente che parla in strada, da vicino e da lontano
#   acqua     l'Arno che scorre sulle rive e sotto il ponte
#   uccelli   passeri e rondini la mattina (cinguettii brevi, a caso)
#   bottega   colpi di martello e una sega, lontano, nei giorni di lavoro
#   vento     un vento leggero
# Sintetizzati: approssimazioni dichiarate, non registrazioni.
import math, os, random, struct, wave
QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(QUI, '..', '..', '..', 'unity', 'Firenze1216', 'Assets', 'Interfaccia', 'Suoni'))
SR = 44100
R = random.Random(7)

def scrivi(nome, x):
    m = max(1e-9, max(abs(v) for v in x)); x = [v / m * 0.85 for v in x]
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, nome + '.wav'), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(v * 32767)) for v in x))
    print(nome, round(len(x) / SR, 2), 's')

def passa_basso(x, a):
    y, p = [], 0.0
    for v in x: p += a * (v - p); y.append(p)
    return y

def passa_alto(x, a):
    y, p, q = [], 0.0, 0.0
    for v in x: p = a * (p + v - q); q = v; y.append(p)
    return y

def carta(durata, salita):
    n = int(SR * durata); x = [R.uniform(-1, 1) for _ in range(n)]
    x = passa_alto(passa_basso(x, 0.35), 0.97)
    out = []
    for i, v in enumerate(x):
        t = i / n
        env = (t / salita if t < salita else (1 - t) / (1 - salita)) ** 1.5
        grana = 0.6 + 0.4 * math.sin(i / SR * 2 * math.pi * (23 + 40 * t)) ** 2        # lo scricchiolio irregolare della pergamena
        out.append(v * env * grana)
    return out

def sigillo():
    n = int(SR * 0.32); out = []
    for i in range(n):
        t = i / SR
        tonfo = math.sin(2 * math.pi * (95 - 40 * t) * t) * math.exp(-t * 22)
        crep = (R.uniform(-1, 1) if R.random() < 0.08 else 0) * math.exp(-t * 30) * 0.5
        out.append(tonfo + crep)
    return passa_basso(out, 0.5)

def legno():
    n = int(SR * 0.22); out = []
    for i in range(n):
        t = i / SR
        out.append(math.sin(2 * math.pi * 190 * t) * math.exp(-t * 38) + 0.45 * math.sin(2 * math.pi * 523 * t) * math.exp(-t * 60) + (R.uniform(-1, 1) * math.exp(-t * 400) * 0.6))
    return out

def medaglia():
    n = int(SR * 0.5); out = []
    for i in range(n):
        t = i / SR
        out.append(math.sin(2 * math.pi * 1240 * t) * math.exp(-t * 9) + 0.6 * math.sin(2 * math.pi * 3110 * t) * math.exp(-t * 14) + R.uniform(-1, 1) * math.exp(-t * 900) * 0.3)
    return out

def risonatore(x, f, q):
    # un filtro passa banda a due poli (le formanti della voce, le pareti)
    w = 2 * math.pi * f / SR; r = math.exp(-w / (2 * q)); a1, a2 = 2 * r * math.cos(w), -r * r
    y1 = y2 = 0.0; y = []
    for v in x: v0 = (1 - r) * v + a1 * y1 + a2 * y2; y2, y1 = y1, v0; y.append(v0)
    return y

def eco(x, ritardi, guadagno):
    y = list(x) + [0.0] * int(SR * 1.5)
    for d in ritardi:
        k = int(SR * d)
        for i in range(len(x)): y[i + k] += x[i] * guadagno; 
        guadagno *= 0.7
    return y

def voce(durata, altezza, formanti, vibrato=5.5, rauco=0.15, R_=R):
    n = int(SR * durata); fase = 0.0; x = []
    for i in range(n):
        t = i / n
        f0 = altezza(t) * (1 + 0.02 * math.sin(2 * math.pi * vibrato * i / SR))
        fase = (fase + f0 / SR) % 1
        x.append((2 * fase - 1) + R_.uniform(-1, 1) * rauco)
    y = [0.0] * n
    for f, q, g in formanti:
        for i, v in enumerate(risonatore(x, f, q)): y[i] += v * g
    return [v * min(1, i / (SR * 0.05)) * min(1, (n - i) / (SR * 0.15)) for i, v in enumerate(y)]

A = [(800, 8, 1.0), (1150, 9, 0.6), (2900, 12, 0.25)]          # la «a»
O = [(450, 8, 1.0), (800, 9, 0.5), (2830, 12, 0.15)]           # la «o»

def campane():
    n = int(SR * 9); out = [0.0] * n
    for base, ogni, inizio in ((294, 1.6, 0.0), (392, 1.6, 0.8)):
        t0 = inizio
        while t0 < 7.5:
            k0 = int(t0 * SR)
            for rap, amp, dec in ((0.5, 0.5, 0.9), (1, 1, 1.4), (1.2, 0.6, 1.8), (1.5, 0.35, 2.2), (2, 0.4, 2.6), (2.7, 0.2, 4)):
                for i in range(k0, min(n, k0 + int(SR * 4))):
                    t = (i - k0) / SR
                    out[i] += amp * math.sin(2 * math.pi * base * rap * t) * math.exp(-t * dec)
            t0 += ogni
    return passa_basso(out, 0.6)

def grido():
    x = voce(1.3, lambda t: 380 + 260 * math.sin(math.pi * min(1, t * 1.6)) - 120 * t, A, vibrato=7, rauco=0.3)
    return eco(x, [0.07, 0.13], 0.25)

def urla():
    n = int(SR * 3.4); out = [0.0] * n
    for k in range(6):
        r = random.Random(40 + k); d = r.uniform(0.6, 1.4); t0 = r.uniform(0, 2.0); h = r.uniform(300, 520)
        x = voce(d, lambda t, h=h: h + 150 * math.sin(math.pi * t), A, vibrato=r.uniform(5, 8), rauco=0.35, R_=r)
        k0 = int(t0 * SR)
        for i, v in enumerate(x):
            if k0 + i < n: out[k0 + i] += v * r.uniform(0.5, 1)
    folla = passa_basso([R.uniform(-1, 1) for _ in range(n)], 0.05)
    return eco(passa_basso([a + b * 3 for a, b in zip(out, folla)], 0.18), [0.21, 0.37], 0.3)

def porta():
    n = int(SR * 1.8); out = []
    for i in range(n):
        t = i / SR
        cig = math.sin(2 * math.pi * (300 + 180 * math.sin(t * 9)) * t) * 0.25 * (1 if t < 1.0 else 0) * min(1, t * 4)
        tonfo = 0 if t < 1.05 else math.sin(2 * math.pi * 70 * (t - 1.05)) * math.exp(-(t - 1.05) * 9) + (R.uniform(-1, 1) * math.exp(-(t - 1.05) * 60) * 0.5)
        out.append(cig + tonfo * 1.4)
    return eco(passa_basso(out, 0.4), [0.09, 0.19, 0.31], 0.35)

def canto():
    note = [147, 165, 175, 165, 147, 131, 147, 147]      # re mi fa mi re do re re: una linea di canto piano, inventata
    x = []
    for k, f in enumerate(note):
        uno = [0.0] * int(SR * 1.1)
        for v, s_ in enumerate((1.0, 1.003, 0.997)):
            vv = voce(1.1, lambda t, f=f, s_=s_: f * s_, O, vibrato=4.5 + v, rauco=0.05)
            uno = [a + b for a, b in zip(uno, vv)]
        x += uno
    return passa_basso(eco(x, [0.23, 0.41, 0.67, 0.93], 0.45), 0.25)

def rumore():
    n = int(SR * 5); b = passa_basso([R.uniform(-1, 1) for _ in range(n)], 0.04)
    mod = [0.6 + 0.4 * math.sin(2 * math.pi * 0.7 * i / SR) * math.sin(2 * math.pi * 0.23 * i / SR) for i in range(n)]
    out = [v * m * 4 for v, m in zip(b, mod)]
    for k in range(5):
        r = random.Random(80 + k); x = voce(r.uniform(0.4, 0.8), lambda t, h=r.uniform(180, 300): h * (1 + 0.2 * t), A, rauco=0.3, R_=r)
        k0 = int(r.uniform(0.3, 4) * SR)
        for i, v in enumerate(x):
            if k0 + i < n: out[k0 + i] += v * 0.3
    return passa_basso(out, 0.15)

def anello(x, sec=1.0):
    # l'ultimo secondo sfuma nel primo: il suono si ripete senza stacco
    k = int(SR * sec); y = x[:len(x) - k]
    for i in range(k): t = i / k; y[i] = x[i] * t + x[len(x) - k + i] * (1 - t)
    return y

def brusio_():
    n = int(SR * 9); out = [0.0] * n
    for k in range(26):
        r = random.Random(200 + k); t0 = r.uniform(0, 8); d = r.uniform(0.3, 1.1); h = r.uniform(110, 260)
        x = voce(d, lambda t, h=h: h * (1 + 0.15 * math.sin(t * 9) + 0.1 * t), A if k % 2 else O, vibrato=r.uniform(3, 7), rauco=0.2, R_=r)
        k0 = int(t0 * SR); g = r.uniform(0.15, 0.6)
        for i, v in enumerate(x):
            if k0 + i < n: out[k0 + i] += v * g
    fondo = passa_basso([R.uniform(-1, 1) for _ in range(n)], 0.03)
    return anello(passa_basso([a + b * 2.5 for a, b in zip(out, fondo)], 0.22))

def acqua_():
    n = int(SR * 7); x = [R.uniform(-1, 1) for _ in range(n)]
    a = passa_basso(x, 0.08); b = passa_alto(passa_basso(x, 0.5), 0.9)
    out = []
    for i in range(n):
        t = i / SR
        mod = 0.7 + 0.3 * math.sin(2 * math.pi * 0.31 * t) * math.sin(2 * math.pi * 0.13 * t + 1)
        gorgo = (R.uniform(-1, 1) if R.random() < 0.002 else 0)
        out.append(a[i] * 3 * mod + b[i] * 0.25 * mod + gorgo * 0.3)
    return anello(passa_basso(out, 0.35))

def uccelli_():
    n = int(SR * 11); out = [0.0] * n
    for k in range(34):
        r = random.Random(400 + k); t0 = r.uniform(0, 10.5); f0 = r.uniform(2800, 5200); d = r.uniform(0.04, 0.14)
        k0 = int(t0 * SR); m = int(d * SR); g = r.uniform(0.2, 1)
        for rep in range(r.randint(1, 4)):
            for i in range(m):
                t = i / SR; f = f0 * (1 + 0.25 * math.sin(math.pi * i / m) * (1 if k % 2 else -1))
                v = math.sin(2 * math.pi * f * t) * math.sin(math.pi * i / m) * g
                j = k0 + rep * int(m * 1.6) + i
                if j < n: out[j] += v
    return anello(out, 0.6)

def bottega_():
    n = int(SR * 8); out = [0.0] * n; t = 0.3
    while t < 7.5:
        k0 = int(t * SR)
        for i in range(int(SR * 0.25)):
            tt = i / SR
            if k0 + i < n: out[k0 + i] += (math.sin(2 * math.pi * 1400 * tt) * 0.4 + math.sin(2 * math.pi * 620 * tt)) * math.exp(-tt * 40) + R.uniform(-1, 1) * math.exp(-tt * 300) * 0.5
        t += R.choice([0.55, 0.6, 0.62, 1.4])
    for i in range(int(SR * 4.5), int(SR * 6.8)):          # una sega, avanti e indietro
        tt = i / SR; ciclo = abs(math.sin(math.pi * tt * 1.6))
        out[i] += passa_alto([R.uniform(-1, 1)], 0.5)[0] * 0.25 * ciclo
    return anello(eco(passa_basso(out, 0.5), [0.07, 0.15], 0.3)[:n])

def vento_():
    n = int(SR * 8); x = passa_basso([R.uniform(-1, 1) for _ in range(n)], 0.02)
    return anello([v * (0.6 + 0.4 * math.sin(2 * math.pi * 0.17 * i / SR)) for i, v in enumerate(x)])

if os.environ.get('SOLO_AMBIENTE'):
    scrivi('brusio', brusio_()); scrivi('acqua', acqua_()); scrivi('uccelli', uccelli_()); scrivi('bottega', bottega_()); scrivi('vento', vento_())
    raise SystemExit

if os.environ.get('SOLO_RACCONTO'):
    scrivi('campane', campane()); scrivi('grido', grido()); scrivi('urla', urla()); scrivi('porta', porta()); scrivi('canto', canto()); scrivi('rumore', rumore())
    raise SystemExit

scrivi('carta', carta(0.55, 0.25)); scrivi('carta-chiudi', carta(0.3, 0.6)); scrivi('sigillo', sigillo()); scrivi('legno', legno()); scrivi('medaglia', medaglia())
scrivi('campane', campane()); scrivi('grido', grido()); scrivi('urla', urla()); scrivi('porta', porta()); scrivi('canto', canto()); scrivi('rumore', rumore())
scrivi('brusio', brusio_()); scrivi('acqua', acqua_()); scrivi('uccelli', uccelli_()); scrivi('bottega', bottega_()); scrivi('vento', vento_())
