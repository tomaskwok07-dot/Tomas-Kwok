#!/bin/sh
# Mixa voz + efeitos + leito no padrão do pacote (-14 LUFS / -1 dBTP).  Uso: sh audio/mixar.sh  ->  out/audio_final.wav
# Para usar uma trilha de verdade, troque audio/ambiente.wav pelo arquivo da música em --trilha.
set -e
cd "$(dirname "$0")/.."
mkdir -p out
BEIJO=$(python3 -c "import json;print(json.load(open('src/dados/marcas.json'))['beijo'])")
ffmpeg -v error -y -i audio/voz.wav -af apad=whole_dur=69 -ar 48000 audio/voz_pad.wav   # sobra no fim: o loudnorm come a cauda
python3 ../shorts_estilo/tools/mixar_audio.py --voz audio/voz_pad.wav --trilha audio/ambiente.wav \
  --sfx "audio/sfx.wav@0:${SFX_DB:--7}" --sfx "audio/beijo.wav@${BEIJO}:-1" --saida out/audio_final.wav
# respiro e picos nos momentos-chave (faixa de loudness 2–3 LU)
python3 audio/dinamica.py out/audio_final.wav ${DIN:-0.8} 63.5
