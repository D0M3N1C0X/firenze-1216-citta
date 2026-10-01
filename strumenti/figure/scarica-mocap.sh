#!/bin/sh
# Riscarica i movimenti CMU usati dalle figure (conversione BVH di B. Hahne,
# copia su GitHub di una-dinosauria/cmu-mocap). Circa 12 MB.
set -e
cd "$(dirname "$0")"
mkdir -p mocap
for id in 07_01 08_01 35_01 37_01 69_01 104_19 15_09 77_02 141_20 18_08 77_01 139_26; do
  s=${id%%_*}; d=$(printf "%03d" $((10#$s)))
  [ -f "mocap/$id.bvh" ] || curl -sS -f -o "mocap/$id.bvh" "https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/$d/$id.bvh"
done
echo "movimenti in $(pwd)/mocap"
