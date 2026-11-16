#!/bin/bash
# Riscarica i movimenti CMU usati dalle figure (conversione BVH di B. Hahne,
# copia su GitHub di una-dinosauria/cmu-mocap). Circa 12 MB.
set -e
cd "$(dirname "$0")"
mkdir -p mocap
# in fondo, i movimenti in più per l'app Unity (movimenti.py, CLIP_UNITY)
for id in 07_01 08_01 35_01 37_01 69_01 104_19 15_09 77_02 141_20 18_08 77_01 139_26 \
  62_03 62_07 13_23 13_20 79_04 79_01 79_05 79_10 26_10 79_25 111_17 113_26 18_01 19_08 22_21 113_02 113_27 13_14 13_27 \
  13_04 13_01 79_42 13_09 79_89 79_72 113_23 91_16 82_10 17_05 07_04 18_03 19_03; do
  s=${id%%_*}; d=$(printf "%03d" $((10#$s)))
  [ -f "mocap/$id.bvh" ] || curl -sS -f -o "mocap/$id.bvh" "https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/$d/$id.bvh"
done
echo "movimenti in $(pwd)/mocap"
