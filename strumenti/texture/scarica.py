# Scarica texture CC0 da Poly Haven nella cartella delle texture della città (public/texture/<nome>/) e ne scrive la
# fonte in FONTI.json (id, nome, misure in mm, autori, licenza, indirizzo).
#   python3 scarica.py nome=id_polyhaven [nome=id …]
# Per ciascuna: colore.jpg (diffuse), rilievo.jpg (normali, convenzione OpenGL), ruvidita.jpg (roughness), a 2k.
# Poi npm run unity le copia nel progetto Unity (Assets/Texture).
import json, os, sys, urllib.request
QUI = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.abspath(os.path.join(QUI, '..', '..', 'public', 'texture'))
API = 'https://api.polyhaven.com'

def leggi(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'firenze-1216'})) as r: return r.read()

fonti = json.load(open(os.path.join(TEX, 'FONTI.json')))
for arg in sys.argv[1:]:
    nome, id_ = arg.split('=')
    info = json.loads(leggi(f'{API}/info/{id_}'))
    file = json.loads(leggi(f'{API}/files/{id_}'))
    os.makedirs(os.path.join(TEX, nome), exist_ok=True)
    for chiave, uscita in (('Diffuse', 'colore'), ('nor_gl', 'rilievo'), ('Rough', 'ruvidita')):
        url = file[chiave]['2k']['jpg']['url']
        open(os.path.join(TEX, nome, uscita + '.jpg'), 'wb').write(leggi(url))
    fonti[nome] = {'id': id_, 'nome': info['name'], 'dimensioni_mm': info.get('dimensions'), 'autori': list(info.get('authors', {}).keys()),
                   'licenza': 'CC0', 'url': f'https://polyhaven.com/a/{id_}'}
    print(nome, '←', info['name'], info.get('dimensions'))
json.dump(fonti, open(os.path.join(TEX, 'FONTI.json'), 'w'), indent=1, ensure_ascii=False)
