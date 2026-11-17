#!/bin/sh
# Render completo 1080x1920 + grão sutil + áudio masterizado + QC.
set -e
cd "$(dirname "$0")/.."
mkdir -p out
[ -n "$SO_CODIFICAR" ] || npx remotion render src/index.ts Video out/video_sem_audio.mp4 --concurrency=${CONC:-4} --crf=12 --log=error
[ -f out/audio_final.wav ] || sh audio/mixar.sh
# ajuste fino de contraste (alvo do QC: 60–64), grão 2% (só na imagem) e H.264 High ~12 Mbps
ffmpeg -v error -y -i out/video_sem_audio.mp4 -i out/audio_final.wav -map 0:v -map 1:a \
  -vf "eq=contrast=0.98,noise=alls=5:allf=t+u,format=yuv420p" -c:v libx264 -profile:v high -preset slow -r 30 \
  -b:v 12M -maxrate 16M -bufsize 32M -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
  out/O_unico_homem_da_cidade_premium.mp4
python3 ../shorts_estilo/tools/qc_medir.py out/O_unico_homem_da_cidade_premium.mp4 || true
