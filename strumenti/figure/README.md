# Le figure: come si producono

Le persone della città sono corpi **MakeHuman** (dentro Blender con l'estensione **MPFB**) vestiti da script e animati con i movimenti del **CMU Motion Capture Database**. Il risultato sta in `public/figure/`:

| File | Che cos'è |
|---|---|
| `figura-NN.glb` | 20 varianti: uomini, donne, ragazzi, di ceti diversi |
| `figure.json` | chi è chi: sesso, età, ceto, copricapo, mantello, altezza |
| `movimenti.glb` | lo scheletro con le clip: camminare, passeggiare, stare fermi, guardarsi intorno, parlare |
| `movimenti.json` | durata e velocità di ogni clip, e da quale registrazione CMU viene |

## Rigenerare

Servono Blender 4.5 LTS (l'ultima versione per i Mac Intel) e MPFB 2 con il pacchetto `makehuman_system_assets_cc0`.

```bash
./scarica-mocap.sh
~/Applications/Blender.app/Contents/MacOS/Blender -b --python movimenti.py
~/Applications/Blender.app/Contents/MacOS/Blender -b --python figure.py
```

Per controllare a occhio: `verifica.py -- cammina2` disegna quattro fotogrammi di una clip, `verifica_figura.py -- 0 9` disegna due figure di fronte e di lato.

## Come funziona il trasferimento dei movimenti

Il primo fotogramma di ogni BVH della conversione cgspeed è una posa a T. Lo scheletro `cmu_mb` di MPFB ha gli stessi nomi di ossa, ma riposa nella posa ad A. Per ogni osso si calcola la rotazione rispetto alla posa a T nello spazio del mondo, e la si applica allo scheletro di destinazione messo anch'esso in posa a T: si raddrizzano solo braccia e gambe, il resto resta com'è. Ogni clip viene poi girata in modo che il soggetto guardi o cammini verso −Y, e tagliata in un tratto che si ripeta senza scatti.

## Le vesti (livello: ipotesi)

La parte aderente della gonnella (busto e maniche), le calze e le scarpe sono **colori dipinti sul corpo**: così non ci sono compenetrazioni e le figure restano leggere: fra 2.400 e 5.300 vertici, a seconda dei capelli. Sono invece **geometria** la gonna della gonnella o della veste, il mantello, il cappuccio con la mantellina, il velo, la cuffia e la cintura. Le lunghezze cambiano con il ceto: gonnella al ginocchio per chi lavora, a metà polpaccio per i mercanti, lunga per i nobili; veste lunga e capo coperto per le donne sposate. Riferimento da controllare: M. G. Muzzarelli, *Guardaroba medievale*, Bologna 1999 **[da verificare]**.

## Licenze

- **MakeHuman, corpi e asset di sistema:** CC0 (pacchetto `makehuman_system_assets_cc0`). L'estensione MPFB è GPL, ma serve solo a produrre: nel progetto non entra.
- **Movimenti:** CMU Graphics Lab Motion Capture Database, http://mocap.cs.cmu.edu, creato con il finanziamento NSF EIA-0196217. I dati si possono usare liberamente, anche in prodotti, ma non rivendere come tali; per questo i BVH grezzi non sono nel repository (`scarica-mocap.sh` li riscarica dalla conversione di B. Hahne, cgspeed, ospitata su GitHub da una-dinosauria/cmu-mocap).
