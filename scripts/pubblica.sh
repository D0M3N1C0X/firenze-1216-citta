#!/bin/sh
# Pubblica la cartella citta/ del repository privato nel repository pubblico
# D0M3N1C0X/firenze-1216-citta. Da lanciare dalla radice del repository
# privato, dopo il commit. Il sito si aggiorna da solo (GitHub Actions).
#
# Dal 23 ottobre 2026 la storia pubblica è stata riscritta per togliere
# l'email personale dai commit: non si spinge più la storia privata (git
# subtree), che la rimetterebbe. Si aggiunge invece, sopra la storia
# pubblica com'è, un solo commit con il contenuto di citta/ di adesso,
# firmato con l'indirizzo anonimo di GitHub. Se nel repository pubblico c'è
# qualcosa che in citta/ manca, lo script si ferma e lo elenca: va prima
# riportato qui, o andrebbe perso.
set -e
cd "$(git rev-parse --show-toplevel)"
PUBBLICO=https://github.com/D0M3N1C0X/firenze-1216-citta.git
NOME='Domenico Perroni'
ANONIMA='230162619+D0M3N1C0X@users.noreply.github.com'

if [ -n "$(git status --porcelain -- citta)" ]; then
  echo "citta/ ha modifiche non committate: prima il commit." >&2; exit 1
fi
git fetch -q "$PUBBLICO" main
BASE=$(git rev-parse FETCH_HEAD)
ALBERO=$(git rev-parse HEAD:citta)
if [ "$(git rev-parse "$BASE^{tree}")" = "$ALBERO" ]; then echo "niente di nuovo da pubblicare"; exit 0; fi

# niente si perde: ogni file che nel pubblico è diverso da citta/ deve avere
# la sua versione pubblica già passata dalla storia privata (cioè qui è più
# nuovo); un file che esiste solo nel pubblico, o una versione mai vista,
# ferma tutto
PERSI=""
for f in $(git diff --name-only "$ALBERO" "$BASE^{tree}"); do
  PUB=$(git rev-parse -q --verify "$BASE:$f" 2>/dev/null || echo assente)
  [ "$PUB" = assente ] && continue                     # nuovo qui: si aggiunge
  VISTO=""
  for c in $(git log --format=%H -- "citta/$f"); do
    [ "$(git rev-parse -q --verify "$c:citta/$f" 2>/dev/null)" = "$PUB" ] && { VISTO=1; break; }
  done
  [ -z "$VISTO" ] && PERSI="$PERSI $f"
done
if [ -n "$PERSI" ]; then
  echo "Il repository pubblico ha versioni che in citta/ non ci sono:$PERSI" >&2
  echo "Riportale in citta/ (git show FETCH_HEAD:<file> > citta/<file>), fai il commit e rilancia." >&2
  exit 1
fi

# il messaggio: i titoli dei commit privati dall'ultima pubblicazione
DATA=$(git log -1 --format=%cI "$BASE")
MSG=$(printf 'Città: aggiornamento dal progetto\n\n%s\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n' "$(git log --format='- %s' --since="$DATA" -- citta)")
NUOVO=$(GIT_AUTHOR_NAME="$NOME" GIT_AUTHOR_EMAIL="$ANONIMA" GIT_COMMITTER_NAME="$NOME" GIT_COMMITTER_EMAIL="$ANONIMA" \
  git commit-tree "$ALBERO" -p "$BASE" -m "$MSG")
git -c http.postBuffer=524288000 push "$PUBBLICO" "$NUOVO:refs/heads/main"
echo "pubblicata: https://d0m3n1c0x.github.io/firenze-1216-citta/"
