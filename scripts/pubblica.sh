#!/bin/sh
# Pubblica la cartella citta/ del repository privato nel repository pubblico
# D0M3N1C0X/firenze-1216-citta, con la sua storia. Da lanciare dalla radice
# del repository privato. Il sito si aggiorna da solo (GitHub Actions).
set -e
cd "$(git rev-parse --show-toplevel)"
git subtree split --prefix=citta -b citta-pubblica
git -c http.postBuffer=524288000 push https://github.com/D0M3N1C0X/firenze-1216-citta.git citta-pubblica:main
git branch -D citta-pubblica
echo "pubblicata: https://d0m3n1c0x.github.io/firenze-1216-citta/"
