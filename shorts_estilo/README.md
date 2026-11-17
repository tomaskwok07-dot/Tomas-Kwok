# Shorts animados — bíblia de estilo em código

Pacote para produzir Shorts no mesmo estilo dos 20 vídeos analisados, no Blender (cenários 3D +
personagens 2D recortados), com narração em português.

- `style_config.py` — **todos os valores da bíblia** (marcados M = medido, R = recomendado). Os scripts leem daqui.
- `blender/shorts_lib.py` — funções do Blender: projeto, cenário/luz, personagem, câmera, efeitos, montagem, legendas.
- `blender/build.py` — linha de comando para rodar tudo com `blender -b … -P build.py -- <comando>`.
- `tools/checar_roteiro.py` — confere o roteiro (palavras por batida, tamanho de frase, números, proibições, variante A/B).
- `tools/mixar_audio.py` — voz + trilha + efeitos sonoros, master em −14 LUFS / −1 dBTP, junta com o vídeo.
- `tools/qc_medir.py` — mede o vídeo final quadro a quadro e compara com as faixas dos originais.
- `templates/` — `roteiro_modelo.txt` e `decupagem_modelo.csv`.
- `exemplo/` — roteiro de exemplo, palavras com tempo, gerador de personagem de teste e projeto de demonstração.

Testado no Blender 5.3 (módulo `bpy`). As chamadas têm alternativas para o Blender 4.2+, mas essas não foram testadas.

## Requisitos

- Blender 4.2 ou mais novo (5.x recomendado)
- Python 3.10+ com `pip install opencv-python numpy pillow` (para `tools/` e o personagem de teste)
- ffmpeg no PATH

## Fluxo de um vídeo novo

```bash
# 1. Roteiro: copie o modelo, escreva, confira até não sobrar nada para ajustar
cp templates/roteiro_modelo.txt meu_video/roteiro.txt
python tools/checar_roteiro.py meu_video/roteiro.txt

# 2. Narração: grave ou gere a voz (WAV 48 kHz). Depois tire o tempo de cada palavra:
#    - Whisper:  whisper voz.wav --language pt --word_timestamps True --output_format json
#    - ou legenda automática do CapCut/Premiere exportada em SRT palavra por palavra
#    Aceitos: JSON do Whisper, JSON [{word,start,end}], CSV word,start,end, SRT.

# 3. Projeto e cenários (uma cena do Blender por cenário, com a paleta dele)
blender -b meu_video/projeto.blend -P blender/build.py -- cenario --nome mina --paleta ambar --interior
blender -b meu_video/projeto.blend -P blender/build.py -- cenario --nome rua --paleta verde
#    Modele cada cenário no Blender (low-poly arredondado, materiais simples, objetos de época).
#    Paletas: ambar, rosa, azul, verde, tijolo (edite em style_config.PALETAS).

# 4. Personagens: PNGs transparentes do mesmo tamanho, já alinhados (veja abaixo)
blender -b meu_video/projeto.blend -P blender/build.py -- personagem --nome ze --pasta meu_video/personagens/ze --cenario mina --local 0,1.5,0.85

# 5. Decupagem: uma linha por frase/plano (templates/decupagem_modelo.csv) e montagem
blender -b meu_video/projeto.blend -P blender/build.py -- montar \
    --decupagem meu_video/decupagem.csv --palavras meu_video/voz.json \
    --narracao meu_video/voz.wav --fonte fontes/Montserrat-Black.ttf \
    --saida //render/video.mp4 --render

# 6. Mixagem e exportação final
python tools/mixar_audio.py --voz meu_video/voz.wav --trilha trilha.mp3 \
    --sfx whoosh.wav@3.4 --sfx impacto.wav@12.0:-6 \
    --video meu_video/render/video.mp4 --saida meu_video/final.mp4

# 7. Controle de qualidade
python tools/qc_medir.py meu_video/final.mp4
```

## Decupagem (`decupagem.csv`)

| coluna | o que é |
| --- | --- |
| `plano`, `inicio`, `fim` | número e quadros (30 fps) do plano; cada plano começa no quadro seguinte ao fim do anterior |
| `cenario` | nome da cena do Blender (criada com `cenario`) |
| `alvo` | nome do objeto que a câmera olha, ou `"x,y,z"` |
| `tipo` | `aberto` (24–28 mm), `medio` (35–50 mm), `close` (50–70 mm) |
| `distancia`, `altura`, `azimute` | posição da câmera em relação ao alvo (m, m, graus) |
| `dolly_pct` | aproximação no plano todo (padrão 20; faixa 10–30) |
| `pan_pct`, `tilt_pct` | deslize lateral/vertical em % da largura do quadro |
| `roll_graus` | giro da lente ao longo do plano (2–5) |
| `transicao_saida` | `fusao` (padrão) ou `corte` (máx. 3 por vídeo) |
| `transicao_quadros` | duração da fusão (6–11; padrão 9) |
| `efeito` | `tremor:QUADRO`, `chicote`, `flash:QUADRO`; vários separados por `;` |
| `frase` | a frase da narração (só referência) |

A montagem cria uma câmera por plano, já em movimento na entrada e assentando no fim (com 15
quadros de alça em cada ponta), e uma cena `EDICAO` com as faixas alternando entre os canais 1 e 2.
Também cria fusões no canal 3 centradas na troca, a narração no canal 12 e as legendas nos canais 8–9.

## Personagens (PNGs)

Desenhe cada parte num PNG transparente, todos do mesmo tamanho (ex.: 1024×2048) e na posição final:

```
corpo.png  cabeca.png  acessorio.png
olhos_neutro.png  olhos_feliz.png  olhos_entediado.png  olhos_arregalado.png  olhos_bravo.png  olhos_preocupado.png
boca_neutra.png  boca_sorriso.png  boca_sorriso_aberto.png  boca_convencido.png  boca_surpresa.png  boca_dentes.png  boca_fala_a.png  boca_fala_o.png
```

Regras: cabeça redonda branca (#F7F5F0) com 35–40% da altura, contorno preto uniforme, corpo de cápsula
numa cor sólida, braços e pernas de palito, e um acessório que diga o papel. `exemplo/gerar_personagem_teste.py`
gera um conjunto de teste. No Blender, troque expressões com:

```python
import shorts_lib as S
ze = bpy.data.objects["ze"]
S.expressao(ze, 120, olhos="bravo", boca="dentes")   # troca seca no quadro 120
S.falar(ze, 200, 240)                                 # fala citada: alterna fala_a/fala_o
```

## Efeitos à mão (no Text Editor do Blender)

```python
S.mudar_luz(bpy.data.objects["lampiao"], quadro=300, de=40, para=300)  # mudança de luz no plano
S.tremor(bpy.data.objects["cam_07"], quadro=410)                         # tremor no impacto
S.flash(bpy.data.scenes["mina"], (0, 2, 1.5), quadro=520)                # clarão de 2 quadros
S.luz_pratica(bpy.data.scenes["mina"], "vela", (1, 2, 1.1))              # lâmpada visível a 2700 K
```

## Conferências no primeiro render

1. **Legenda branca**: o texto tem que sair branco puro (255). Se sair cinza, a transformação de cor
   da cena `EDICAO` está agindo sobre ela: em Color Management da `EDICAO`, mude View Transform para
   `Standard` e confira se o 3D manteve o contraste (as cenas de cenário continuam em AgX).
2. **Exposição**: rode `tools/qc_medir.py` num trecho; ajuste a exposição de cada cenário até o
   brilho médio ficar entre 92 e 139 e o branco estourado abaixo de 3,7%.
3. **Névoa**: a névoa do mundo no Eevee vai até o céu. Use-a só em interiores (0,002–0,006). Em
   exteriores, ponha um cubo com volume só na região dos raios de luz.
4. **Sem MP4**: se o seu Blender não gravar MP4, o `montar` renderiza PNG em `render/quadros/`.
   Junte com `tools/mixar_audio.py --quadros "render/quadros/q_%04d.png" ...`.

## Demonstração

```bash
python exemplo/gerar_personagem_teste.py demo/personagens/ze
ffmpeg -f lavfi -i "sine=f=180:d=6" -ar 48000 demo/voz_teste.wav
blender -b -P exemplo/demo_projeto.py -- demo/
blender -b demo/demo.blend -P blender/build.py -- montar --decupagem templates/decupagem_modelo.csv \
    --palavras exemplo/palavras_exemplo.json --narracao demo/voz_teste.wav --saida //render/demo.mp4 --render
```
